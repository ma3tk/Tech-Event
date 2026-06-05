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
      } | null;
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
      const existingPayment = await tx.payment.findUnique({
        where: { participantId },
      });
      if (!existingPayment) {
        const paymentId = await nextPaymentId(tx);
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
          },
        });
        // Participant.paymentId を埋める
        await tx.participant.update({
          where: { id: participantId },
          data: { paymentId },
        });
      } else {
        await tx.payment.update({
          where: { id: existingPayment.id },
          data: {
            status: "succeeded",
            providerTxnId: providerTxnId,
            paidAt: now,
          },
        });
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
