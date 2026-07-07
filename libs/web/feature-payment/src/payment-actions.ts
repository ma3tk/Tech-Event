"use server";

/**
 * Stripe 決済関連の Server Actions。
 *
 * - `createCheckoutSession(eventId, eventRoleId)` :
 *   有料 (`pricingType = "prepaid"`) の `EventRole` に対して Stripe Checkout Session
 *   を作成し、リダイレクト先 URL (`session.url`) を返す。
 *   Stripe 未設定環境では `disabled` を示す結果を返す。
 *
 * - `joinPaidEvent(formData)` :
 *   フォーム経由で呼び出される薄いラッパー。Checkout URL を生成して
 *   `redirect()` で飛ばす。`joinEvent` (event-actions.ts) の有料版に相当。
 *   formData に `couponCode` があれば割引を適用する (未指定時は従来挙動)。
 *
 * - `refundPayment(participantId, { amount?, reason })` :
 *   主催者 / GroupAdmin による返金 (全額 / 部分)。Stripe 決済なら
 *   `stripe.refunds.create` を呼び、現地払い等 Stripe 未設定なら DB のみ更新。
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { nextId, withRetry } from "@/lib/id-gen";
import { getString as formValue } from "@/lib/form-data";
import {
  getStripe,
  isStripeEnabled,
} from "./lib/stripe";
import { computeCouponDiscount, MIN_PAID_AMOUNT_JPY } from "./lib/coupon";
import { validateCoupon } from "./coupon-actions";
import { canManageEventPayments } from "./lib/event-admin";

import { BigIntIdSchema } from "@/lib/schemas";

/* ============================================================
 * 型 / Schema
 * ============================================================ */

const CheckoutInputSchema = z.object({
  eventId: BigIntIdSchema,
  eventRoleId: BigIntIdSchema,
});

export type CheckoutSessionResult =
  | { ok: true; url: string; sessionId: string }
  | { ok: false; reason: "disabled" | "not_paid" | "unauthorized" | "not_found" | "invalid_input" | "coupon_invalid" | "error"; message?: string };

/** `createCheckoutSession` の追加オプション (後方互換のため第 3 引数)。 */
export type CheckoutSessionOptions = {
  /** クーポンコード (正規化前で OK)。未指定なら割引なしの従来挙動。 */
  couponCode?: string;
  /** 寄付額 (JPY)。pricingType="donation" の枠でのみ使用。未指定なら price を推奨額として使う。 */
  donationAmount?: number;
};

/* ============================================================
 * createCheckoutSession
 * ============================================================ */

/**
 * 有料の `EventRole` 向けに Stripe Checkout Session を作成する。
 *
 * 戻り値:
 *   - 成功: `{ ok: true, url, sessionId }` (`url` にリダイレクトすれば Checkout 画面)
 *   - Stripe 未設定: `{ ok: false, reason: "disabled" }` (UI 側で現地払い表示にフォールバック)
 *   - クーポン不正: `{ ok: false, reason: "coupon_invalid" }`
 *   - その他失敗: `{ ok: false, reason: ... }`
 *
 * `opts.couponCode` を指定すると `validateCoupon` で検証し、割引後金額で
 * Checkout Session を作る。割引情報 (couponId / discountAmount) は metadata に
 * 載せ、webhook 側で Payment / CouponRedemption に記録する。
 * couponCode 未指定時の挙動は従来と完全に同一。
 */
export async function createCheckoutSession(
  eventId: string,
  eventRoleId: string,
  opts?: CheckoutSessionOptions,
): Promise<CheckoutSessionResult> {
  const parsed = CheckoutInputSchema.safeParse({ eventId, eventRoleId });
  if (!parsed.success) {
    return { ok: false, reason: "invalid_input" };
  }

  if (!isStripeEnabled()) {
    return { ok: false, reason: "disabled" };
  }

  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, reason: "disabled" };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, reason: "unauthorized" };
  }

  const role = await prisma.eventRole.findUnique({
    where: { id: parsed.data.eventRoleId },
    include: { event: true },
  });
  if (!role || role.eventId !== parsed.data.eventId) {
    return { ok: false, reason: "not_found" };
  }
  // prepaid (固定額) と donation (任意額) のみ Stripe Checkout 対象。
  const isDonation = role.pricingType === "donation";
  if (role.pricingType !== "prepaid" && !isDonation) {
    return { ok: false, reason: "not_paid" };
  }

  // ---- 課金ベース額の決定 ----
  // donation は寄付額を採用 (未指定なら price を推奨額として使う)。
  // 最低寄付額 (donationMinAmount) と Stripe 最小額を満たさなければ拒否。
  let baseAmount = role.price;
  if (isDonation) {
    baseAmount = opts?.donationAmount ?? role.price;
    const minDonation = Math.max(
      role.donationMinAmount ?? 0,
      MIN_PAID_AMOUNT_JPY,
    );
    if (!Number.isFinite(baseAmount) || baseAmount < minDonation) {
      return { ok: false, reason: "invalid_input", message: "donation_amount" };
    }
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  // ---- クーポン適用 (couponCode 指定時のみ / 未指定なら従来挙動) ----
  let discountAmount = 0;
  let couponId: string | null = null;
  const couponCode = opts?.couponCode?.trim();
  if (couponCode) {
    const validated = await validateCoupon(
      parsed.data.eventId.toString(),
      couponCode,
      user.id.toString(),
    );
    if (!validated.valid) {
      return {
        ok: false,
        reason: "coupon_invalid",
        message: validated.reason,
      };
    }
    discountAmount = computeCouponDiscount(
      validated.discountType,
      validated.discountValue,
      baseAmount,
    );
    couponId = validated.couponId;
  }
  const chargeAmount = baseAmount - discountAmount;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: (role.currency || "JPY").toLowerCase(),
            unit_amount: chargeAmount,
            product_data: {
              name: `${role.event.title} - ${role.name}`,
              description:
                role.description ?? `${role.event.title} の参加費 (${role.name})`,
            },
          },
        },
      ],
      metadata: {
        eventId: role.eventId.toString(),
        eventRoleId: role.id.toString(),
        userId: user.id.toString(),
        ...(couponId
          ? {
              couponId,
              discountAmount: discountAmount.toString(),
            }
          : {}),
      },
      success_url: `${baseUrl}/event/${role.eventId.toString()}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/event/${role.eventId.toString()}?payment=cancelled`,
    });

    if (!session.url) {
      return { ok: false, reason: "error", message: "stripe returned no url" };
    }

    return { ok: true, url: session.url, sessionId: session.id };
  } catch (e) {
    console.error("[stripe] createCheckoutSession failed", e);
    return {
      ok: false,
      reason: "error",
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

/* ============================================================
 * joinPaidEvent (Server Action form 用)
 * ============================================================ */

/**
 * 有料イベント参加用のフォーム Server Action。
 *
 * - 成功時は Stripe Checkout URL に `redirect()`。
 * - Stripe 未設定なら `?payment=disabled` 付きでイベント詳細に戻す。
 * - 未ログインなら `/login?next=...` にリダイレクト。
 * - formData に `couponCode` (任意) があれば割引適用を試みる。
 *   不正なクーポンなら `?payment=coupon_invalid` で戻す。
 *   `couponCode` 未指定時の挙動は従来と完全に同一。
 */
export async function joinPaidEvent(formData: FormData): Promise<void> {
  const eventId = String(formData.get("eventId") ?? "");
  const eventRoleId = String(formData.get("eventRoleId") ?? "");
  const couponCode = String(formData.get("couponCode") ?? "").trim();
  const donationRaw = String(formData.get("donationAmount") ?? "").trim();
  const donationAmount =
    donationRaw && /^\d+$/.test(donationRaw) ? Number(donationRaw) : undefined;
  if (!/^\d+$/.test(eventId)) {
    throw new Error("invalid_input");
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/event/${eventId}`)}`);
  }

  const result = await createCheckoutSession(
    eventId,
    eventRoleId,
    couponCode || donationAmount !== undefined
      ? { couponCode: couponCode || undefined, donationAmount }
      : undefined,
  );
  if (result.ok) {
    redirect(result.url);
  }

  // 失敗種別ごとにフォールバック
  switch (result.reason) {
    case "disabled":
      redirect(`/event/${eventId}?payment=disabled`);
      break;
    case "not_paid":
      // 有料枠じゃない場合は通常の joinEvent に飛ばすことも可能だが、
      // 安全のためイベント詳細に戻す
      redirect(`/event/${eventId}?payment=not_paid`);
      break;
    case "coupon_invalid":
      redirect(`/event/${eventId}?payment=coupon_invalid`);
      break;
    case "unauthorized":
      redirect(`/login?next=${encodeURIComponent(`/event/${eventId}`)}`);
      break;
    default:
      redirect(`/event/${eventId}?payment=error`);
  }
}

/* ============================================================
 * refundPayment (返金)
 * ============================================================ */

const RefundInputSchema = z.object({
  participantId: BigIntIdSchema,
  /** 返金額 (JPY)。省略時は残額全額。 */
  amount: z.number().int().min(1).optional(),
  /** 返金理由 (主催者入力 / イベント中止など)。 */
  reason: z.string().trim().max(500).optional(),
});

export type RefundPaymentResult =
  | {
      ok: true;
      /** 更新後の Payment.status (refunded | partially_refunded) */
      status: "refunded" | "partially_refunded";
      /** 今回返金した額 */
      refundedNow: number;
      /** 累計返金額 */
      refundedTotal: number;
      /** Stripe refund id (現地払い等 Stripe 外なら null) */
      providerRefundId: string | null;
    }
  | {
      ok: false;
      reason:
        | "invalid_input"
        | "unauthorized"
        | "forbidden"
        | "not_found"
        | "not_refundable"
        | "amount_exceeds"
        | "error";
      message?: string;
    };

/**
 * 参加者の支払いを返金する (主催者 / GroupAdmin のみ)。
 *
 * - `amount` 省略時は「残額全額」を返金。部分返金は `amount` 指定。
 * - Stripe 決済 (`provider="stripe"` かつ Stripe 設定済み・providerTxnId あり) は
 *   `stripe.refunds.create` を先に呼び、成功後に DB を更新する。
 * - 現地払い / Stripe 未設定環境では DB のみ更新 (記録として返金扱い)。
 * - Payment.status は累計返金額が amount に達したら `refunded`、
 *   それ未満なら `partially_refunded`。
 */
export async function refundPayment(
  participantId: string,
  opts: { amount?: number; reason?: string } = {},
): Promise<RefundPaymentResult> {
  const parsed = RefundInputSchema.safeParse({
    participantId,
    amount: opts.amount,
    reason: opts.reason,
  });
  if (!parsed.success) {
    return {
      ok: false,
      reason: "invalid_input",
      message: parsed.error.issues[0]?.message,
    };
  }

  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "unauthorized" };

  const participant = await prisma.participant.findUnique({
    where: { id: parsed.data.participantId },
    include: { payment: true },
  });
  if (!participant || !participant.payment) {
    return { ok: false, reason: "not_found" };
  }

  if (!(await canManageEventPayments(participant.eventId, user.id))) {
    return { ok: false, reason: "forbidden" };
  }

  const payment = participant.payment;
  if (
    payment.status !== "succeeded" &&
    payment.status !== "partially_refunded"
  ) {
    return { ok: false, reason: "not_refundable" };
  }

  const alreadyRefunded = payment.refundedAmount ?? 0;
  const remaining = payment.amount - alreadyRefunded;
  if (remaining <= 0) {
    return { ok: false, reason: "not_refundable" };
  }

  const refundNow = parsed.data.amount ?? remaining;
  if (refundNow > remaining) {
    return { ok: false, reason: "amount_exceeds" };
  }

  // ---- Stripe 返金 (設定済み & stripe 決済 & providerTxnId あり) ----
  let providerRefundId: string | null = null;
  const stripe = getStripe();
  if (
    payment.provider === "stripe" &&
    isStripeEnabled() &&
    stripe &&
    payment.providerTxnId
  ) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: payment.providerTxnId,
        amount: refundNow,
        ...(parsed.data.reason ? { metadata: { reason: parsed.data.reason } } : {}),
      });
      providerRefundId = refund.id;
    } catch (e) {
      console.error("[stripe] refunds.create failed", e);
      return {
        ok: false,
        reason: "error",
        message: e instanceof Error ? e.message : String(e),
      };
    }
  }
  // Stripe 未設定 (現地払い等) は DB のみ更新するフォールバック。

  const refundedTotal = alreadyRefunded + refundNow;
  const nextStatus: "refunded" | "partially_refunded" =
    refundedTotal >= payment.amount ? "refunded" : "partially_refunded";

  try {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: nextStatus,
        refundedAmount: refundedTotal,
        refundReason: parsed.data.reason ?? payment.refundReason,
        providerRefundId: providerRefundId ?? payment.providerRefundId,
        refundedAt: new Date(),
      },
    });
  } catch (e) {
    console.error("[payment] refund DB update failed", e);
    return {
      ok: false,
      reason: "error",
      message: e instanceof Error ? e.message : String(e),
    };
  }

  revalidatePath(`/event/${participant.eventId.toString()}/admin/refunds`);
  revalidatePath(`/event/${participant.eventId.toString()}`);

  return {
    ok: true,
    status: nextStatus,
    refundedNow: refundNow,
    refundedTotal,
    providerRefundId,
  };
}

/**
 * 返金フォーム用 Server Action (`admin/refunds` の各行から呼ばれる)。
 *
 * formData:
 *   - `eventId`       : リダイレクト先の解決用
 *   - `participantId` : 返金対象
 *   - `amount`        : 任意。空なら全額 (残額) 返金
 *   - `reason`        : 任意
 */
export async function refundPaymentForm(formData: FormData): Promise<void> {
  const eventId = formValue(formData, "eventId");
  const participantId = formValue(formData, "participantId");
  if (!/^\d+$/.test(eventId) || !/^\d+$/.test(participantId)) {
    throw new Error("invalid_input");
  }
  const basePath = `/event/${eventId}/admin/refunds`;

  const amountRaw = formValue(formData, "amount");
  const reason = formValue(formData, "reason");
  const amount =
    amountRaw && /^\d+$/.test(amountRaw) ? Number(amountRaw) : undefined;

  const result = await refundPayment(participantId, {
    amount,
    reason: reason || undefined,
  });

  if (result.ok) {
    redirect(`${basePath}?refunded=${result.status}`);
  }
  redirect(`${basePath}?error=${encodeURIComponent(result.reason)}`);
}
