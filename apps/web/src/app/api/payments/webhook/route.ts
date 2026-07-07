/**
 * Stripe Webhook 受信エンドポイント。
 *
 * `POST /api/payments/webhook`
 *
 * - Header `Stripe-Signature` を `STRIPE_WEBHOOK_SECRET` で検証
 * - `checkout.session.completed` を受け取ったら:
 *   1. `metadata.eventId` / `eventRoleId` / `userId` を参照
 *   2. 当該ユーザの `Participant` を作成 / 既存なら更新 (status = "accepted")
 *   3. `Payment` レコードを作成 (provider = "stripe", status = "succeeded")
 *   4. Event.acceptedCount をインクリメント (新規 accepted のみ)
 *   5. `metadata.couponId` / `discountAmount` があれば Payment に記録し、
 *      `CouponRedemption` を作成 + `Coupon.redeemedCount` をインクリメント
 * - `charge.refunded` / `refund.updated` を受け取ったら:
 *   `payment_intent` で `Payment.providerTxnId` を突合し、
 *   refundedAmount / providerRefundId / refundedAt / status
 *   (refunded | partially_refunded) を更新する (冪等)。
 * - `customer.subscription.created/updated/deleted` (グループ Plus プラン) は:
 *   `Group.stripeSubscriptionId` で突合 (初回は subscription の
 *   `metadata.groupId` で fallback) し、Group.plan / planExpiresAt /
 *   stripeCustomerId / stripeSubscriptionId を更新する (冪等)。
 *
 * 開発時 / Stripe 未設定環境では:
 *   - 署名検証をスキップし、リクエストボディの JSON をそのまま信用する。
 *   - これは E2E テストで dummy POST → Payment 作成を検証するために必要。
 *   - production では STRIPE_WEBHOOK_SECRET を必ず設定し、署名検証を有効にする。
 */
import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";
import { nextId } from "@/lib/id-gen";
import {
  RATE_LIMITS,
  buildRateLimitResponse,
  getRequestIp,
  rateLimit,
} from "@/lib/rate-limit";

// 必ず Node ランタイム (Stripe SDK は Edge 非対応)
export const runtime = "nodejs";

/** Webhook payload (Stripe イベント) の最低限の型 */
type CheckoutCompletedEvent = {
  id?: string;
  type: string;
  data: {
    object: {
      id?: string;
      payment_intent?: string | null;
      amount_total?: number | null;
      currency?: string | null;
      metadata?: {
        eventId?: string;
        eventRoleId?: string;
        userId?: string;
        /** クーポン適用時のみ (createCheckoutSession が付与) */
        couponId?: string;
        discountAmount?: string;
        /** Plus subscription のみ (createPlusSubscriptionCheckout が付与) */
        groupId?: string;
      } | null;
      // ---- charge.refunded (object = Charge) ----
      /** Charge の累計返金額 */
      amount_refunded?: number | null;
      refunds?: { data?: Array<{ id?: string }> } | null;
      // ---- refund.updated (object = Refund) ----
      /** Refund の返金額 */
      amount?: number | null;
      /** Refund / Subscription の状態
       *  (Refund: succeeded | pending | failed | canceled /
       *   Subscription: active | trialing | past_due | canceled | unpaid | ...) */
      status?: string | null;
      // ---- customer.subscription.* (object = Subscription) ----
      /** Stripe Customer id (string / expand 済み object の両対応) */
      customer?: string | { id?: string } | null;
      /** 現在の課金期間の終了 epoch 秒 (planExpiresAt に反映) */
      current_period_end?: number | null;
    };
  };
};

async function nextParticipantId(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
): Promise<bigint> {
  return nextId(tx, "participant");
}

async function nextPaymentId(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
): Promise<bigint> {
  return nextId(tx, "payment");
}

/**
 * Stripe Webhook を受信し、`checkout.session.completed` 時に
 * Participant + Payment を作成する。
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // ---- レート制限 (Stripe 側で 1 次防御があるが、念のため IP 単位) ----
  const ip = getRequestIp(request);
  const rl = rateLimit(`${ip}:stripe-webhook`, RATE_LIMITS.webhook);
  if (!rl.ok) {
    return buildRateLimitResponse(rl);
  }

  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = getStripeWebhookSecret();
  const stripe = getStripe();

  // production では webhookSecret / stripe / signature の 3 つが揃っていなければ
  // 503 で fail-close する (環境変数の設定ミスを起動後に検出するため)。
  const isProd = process.env.NODE_ENV === "production";
  if (isProd && (!stripe || !webhookSecret)) {
    console.error(
      "[stripe-webhook] STRIPE_WEBHOOK_SECRET / Stripe client が未設定です",
    );
    return NextResponse.json(
      { error: "webhook_misconfigured" },
      { status: 503 },
    );
  }
  if (isProd && !signature) {
    return NextResponse.json(
      { error: "missing_signature" },
      { status: 400 },
    );
  }

  let event: CheckoutCompletedEvent;

  if (stripe && webhookSecret && signature) {
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      ) as unknown as CheckoutCompletedEvent;
    } catch (err) {
      console.error("[stripe-webhook] signature verification failed", err);
      return NextResponse.json(
        { error: "invalid_signature" },
        { status: 400 },
      );
    }
  } else {
    // dev / E2E 用フォールバック (production では上の早期 return で到達不可)
    try {
      event = JSON.parse(rawBody) as CheckoutCompletedEvent;
    } catch {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }
  }

  // ---- 返金系イベント (charge.refunded / refund.updated) ----
  if (event.type === "charge.refunded" || event.type === "refund.updated") {
    return handleRefundEvent(event);
  }

  // ---- グループ Plus プラン (customer.subscription.*) ----
  if (event.type.startsWith("customer.subscription.")) {
    return handleSubscriptionEvent(event);
  }

  if (event.type !== "checkout.session.completed") {
    // 他のイベントタイプは無視 (200 を返してリトライさせない)
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const obj = event.data?.object;
  const metadata = obj?.metadata ?? null;
  if (
    !metadata ||
    !metadata.eventId ||
    !metadata.eventRoleId ||
    !metadata.userId ||
    !/^\d+$/.test(metadata.eventId) ||
    !/^\d+$/.test(metadata.eventRoleId) ||
    !/^\d+$/.test(metadata.userId)
  ) {
    return NextResponse.json(
      { error: "missing_metadata" },
      { status: 400 },
    );
  }

  const eventId = BigInt(metadata.eventId);
  const eventRoleId = BigInt(metadata.eventRoleId);
  const userId = BigInt(metadata.userId);
  const amount = obj?.amount_total ?? 0;
  const currency = (obj?.currency ?? "jpy").toUpperCase();
  const providerTxnId = obj?.payment_intent ?? obj?.id ?? null;

  // クーポン適用時のみ metadata に couponId / discountAmount が載る
  // (createCheckoutSession が付与)。数字文字列でなければ無視する。
  const couponId =
    metadata.couponId && /^\d+$/.test(metadata.couponId)
      ? BigInt(metadata.couponId)
      : null;
  const discountAmount =
    metadata.discountAmount && /^\d+$/.test(metadata.discountAmount)
      ? Number(metadata.discountAmount)
      : 0;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. EventRole を参照 (定員 / 価格チェック)
      const role = await tx.eventRole.findUnique({
        where: { id: eventRoleId },
      });
      if (!role || role.eventId !== eventId) {
        throw new Error("event_role_not_found");
      }

      // 2. 既存 Participant (cancelled 以外) を探す。あれば accepted に更新。
      const existing = await tx.participant.findFirst({
        where: {
          eventId,
          userId,
          status: { not: "cancelled" },
        },
      });

      const now = new Date();
      let participantId: bigint;

      if (existing) {
        // 既存レコードを accepted に昇格
        const wasAccepted = existing.status === "accepted";
        await tx.participant.update({
          where: { id: existing.id },
          data: {
            eventRoleId,
            status: "accepted",
            acceptedAt: existing.acceptedAt ?? now,
            waitingPosition: null,
          },
        });
        participantId = existing.id;
        if (!wasAccepted) {
          await tx.event.update({
            where: { id: eventId },
            data: { acceptedCount: { increment: 1 } },
          });
        }
      } else {
        participantId = await nextParticipantId(tx);
        await tx.participant.create({
          data: {
            id: participantId,
            eventId,
            eventRoleId,
            userId,
            status: "accepted",
            appliedAt: now,
            acceptedAt: now,
          },
        });
        await tx.event.update({
          where: { id: eventId },
          data: { acceptedCount: { increment: 1 } },
        });
      }

      // 3. Payment を作成 (participantId は UNIQUE なので衝突回避)
      //    クーポン適用時は tx 内で Coupon の実在を確認してから記録する
      //    (dev フォールバックで偽 metadata が来ても FK 違反にしない)。
      const coupon = couponId
        ? await tx.coupon.findUnique({
            where: { id: couponId },
            select: { id: true },
          })
        : null;

      const existingPayment = await tx.payment.findUnique({
        where: { participantId },
      });
      let paymentId: bigint;
      if (!existingPayment) {
        paymentId = await nextPaymentId(tx);
        await tx.payment.create({
          data: {
            id: paymentId,
            participantId,
            amount,
            currency,
            provider: "stripe",
            providerTxnId: providerTxnId,
            status: "succeeded",
            paidAt: now,
            ...(coupon
              ? { couponId: coupon.id, discountAmount }
              : {}),
          },
        });
        // Participant.paymentId を埋める
        await tx.participant.update({
          where: { id: participantId },
          data: { paymentId },
        });
      } else {
        paymentId = existingPayment.id;
        await tx.payment.update({
          where: { id: existingPayment.id },
          data: {
            status: "succeeded",
            providerTxnId: providerTxnId,
            paidAt: now,
            ...(coupon
              ? { couponId: coupon.id, discountAmount }
              : {}),
          },
        });
      }

      // 4. クーポン利用実績 (CouponRedemption) を記録 + redeemedCount++
      //    同一 payment への二重計上は冪等ガード (webhook リトライ対策)。
      if (coupon) {
        const existingRedemption = await tx.couponRedemption.findFirst({
          where: { couponId: coupon.id, paymentId },
          select: { id: true },
        });
        if (!existingRedemption) {
          const redemptionId = await nextId(tx, "couponRedemption");
          await tx.couponRedemption.create({
            data: {
              id: redemptionId,
              couponId: coupon.id,
              userId,
              paymentId,
              amount: discountAmount,
            },
          });
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { redeemedCount: { increment: 1 } },
          });
        }
      }
    });
  } catch (e) {
    console.error("[stripe-webhook] participant/payment update failed", e);
    return NextResponse.json(
      {
        error: "internal_error",
        message: e instanceof Error ? e.message : String(e),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

/**
 * `charge.refunded` / `refund.updated` の処理。
 *
 * - `payment_intent` で `Payment.providerTxnId` を突合。見つからなければ
 *   200 で無視 (自前レコード外の Stripe イベントをリトライさせない)。
 * - `charge.refunded` は `amount_refunded` (累計)、`refund.updated` は
 *   `amount` (単発) を採用し、既存の refundedAmount と比べて大きい方を
 *   記録する (冪等 / 二重配信対策)。
 * - `refund.updated` は status=succeeded 以外 (pending / failed / canceled) を無視。
 * - 累計返金額が Payment.amount 以上なら `refunded`、未満なら
 *   `partially_refunded` に更新する。
 */
async function handleRefundEvent(
  event: CheckoutCompletedEvent,
): Promise<NextResponse> {
  const obj = event.data?.object;
  const paymentIntent = obj?.payment_intent ?? null;
  if (!paymentIntent) {
    return NextResponse.json({ ok: true, ignored: "no_payment_intent" });
  }

  if (
    event.type === "refund.updated" &&
    obj?.status &&
    obj.status !== "succeeded"
  ) {
    return NextResponse.json({
      ok: true,
      ignored: `refund_status_${obj.status}`,
    });
  }

  const reportedAmount =
    event.type === "charge.refunded"
      ? obj?.amount_refunded ?? null
      : obj?.amount ?? null;
  const providerRefundId =
    event.type === "charge.refunded"
      ? obj?.refunds?.data?.[0]?.id ?? null
      : obj?.id ?? null;

  try {
    const payment = await prisma.payment.findFirst({
      where: { providerTxnId: paymentIntent },
    });
    if (!payment) {
      return NextResponse.json({ ok: true, ignored: "payment_not_found" });
    }

    // 冪等: 既存の累計返金額より小さい値では巻き戻さない。
    // 金額情報が無い場合は全額返金とみなす (charge.refunded は全額時にも発火)。
    const nextRefunded = Math.min(
      payment.amount,
      Math.max(payment.refundedAmount ?? 0, reportedAmount ?? payment.amount),
    );
    const nextStatus =
      nextRefunded >= payment.amount ? "refunded" : "partially_refunded";

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: nextStatus,
        refundedAmount: nextRefunded,
        providerRefundId: providerRefundId ?? payment.providerRefundId,
        refundedAt: payment.refundedAt ?? new Date(),
      },
    });

    return NextResponse.json({ ok: true, refund: nextStatus });
  } catch (e) {
    console.error("[stripe-webhook] refund update failed", e);
    return NextResponse.json(
      {
        error: "internal_error",
        message: e instanceof Error ? e.message : String(e),
      },
      { status: 500 },
    );
  }
}

/**
 * `customer.subscription.created / updated / deleted` の処理
 * (グループ Plus プラン)。
 *
 * - `Group.stripeSubscriptionId == subscription.id` で突合。見つからなければ
 *   subscription の `metadata.groupId` (createPlusSubscriptionCheckout が
 *   `subscription_data.metadata` に付与) で fallback。どちらも無ければ
 *   200 で無視 (自前レコード外の Stripe イベントをリトライさせない)。
 * - `deleted` → plan="free" / planExpiresAt=null / stripeSubscriptionId=null。
 * - `created` / `updated` → status が active | trialing | past_due なら
 *   plan="plus" + planExpiresAt=current_period_end、それ以外
 *   (canceled / unpaid / incomplete_expired 等) は free に戻す。
 * - 同一イベントの再配信は同じ値の上書きになるだけ (冪等)。
 * - それ以外の customer.subscription.* (trial_will_end 等) は無視。
 */
async function handleSubscriptionEvent(
  event: CheckoutCompletedEvent,
): Promise<NextResponse> {
  if (
    event.type !== "customer.subscription.created" &&
    event.type !== "customer.subscription.updated" &&
    event.type !== "customer.subscription.deleted"
  ) {
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const obj = event.data?.object;
  const subscriptionId = obj?.id ?? null;
  if (!subscriptionId) {
    return NextResponse.json({ ok: true, ignored: "no_subscription_id" });
  }

  const customerId =
    typeof obj?.customer === "string"
      ? obj.customer
      : obj?.customer?.id ?? null;

  try {
    // 1. stripeSubscriptionId で突合 (通常経路)
    let group = await prisma.group.findFirst({
      where: { stripeSubscriptionId: subscriptionId },
    });

    // 2. 初回 (created 直後) は未突合のため metadata.groupId で fallback
    if (!group) {
      const gid = obj?.metadata?.groupId;
      if (gid && /^\d+$/.test(gid)) {
        group = await prisma.group.findUnique({ where: { id: BigInt(gid) } });
      }
    }

    if (!group) {
      return NextResponse.json({ ok: true, ignored: "group_not_found" });
    }

    if (event.type === "customer.subscription.deleted") {
      await prisma.group.update({
        where: { id: group.id },
        data: {
          plan: "free",
          planExpiresAt: null,
          stripeSubscriptionId: null,
          // stripeCustomerId は再アップグレード時の customer 再利用のため保持
          ...(customerId ? { stripeCustomerId: customerId } : {}),
        },
      });
      return NextResponse.json({ ok: true, plan: "free" });
    }

    // created / updated
    const status = obj?.status ?? "active"; // dev フォールバックで省略時は active 扱い
    const isActive =
      status === "active" || status === "trialing" || status === "past_due";
    const periodEnd =
      typeof obj?.current_period_end === "number" && obj.current_period_end > 0
        ? new Date(obj.current_period_end * 1000)
        : null;

    if (isActive) {
      await prisma.group.update({
        where: { id: group.id },
        data: {
          plan: "plus",
          planExpiresAt: periodEnd,
          stripeSubscriptionId: subscriptionId,
          ...(customerId ? { stripeCustomerId: customerId } : {}),
        },
      });
      return NextResponse.json({ ok: true, plan: "plus" });
    }

    // 非アクティブ status (canceled / unpaid / incomplete_expired 等) → free
    await prisma.group.update({
      where: { id: group.id },
      data: {
        plan: "free",
        planExpiresAt: null,
        ...(group.stripeSubscriptionId === subscriptionId
          ? { stripeSubscriptionId: null }
          : {}),
        ...(customerId ? { stripeCustomerId: customerId } : {}),
      },
    });
    return NextResponse.json({ ok: true, plan: "free" });
  } catch (e) {
    console.error("[stripe-webhook] subscription update failed", e);
    return NextResponse.json(
      {
        error: "internal_error",
        message: e instanceof Error ? e.message : String(e),
      },
      { status: 500 },
    );
  }
}
