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
 */
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  getStripe,
  isStripeEnabled,
} from "@/lib/stripe";

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
  | { ok: false; reason: "disabled" | "not_paid" | "unauthorized" | "not_found" | "invalid_input" | "error"; message?: string };

/* ============================================================
 * createCheckoutSession
 * ============================================================ */

/**
 * 有料の `EventRole` 向けに Stripe Checkout Session を作成する。
 *
 * 戻り値:
 *   - 成功: `{ ok: true, url, sessionId }` (`url` にリダイレクトすれば Checkout 画面)
 *   - Stripe 未設定: `{ ok: false, reason: "disabled" }` (UI 側で現地払い表示にフォールバック)
 *   - その他失敗: `{ ok: false, reason: ... }`
 */
export async function createCheckoutSession(
  eventId: string,
  eventRoleId: string,
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
  if (role.pricingType !== "prepaid") {
    return { ok: false, reason: "not_paid" };
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

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
            unit_amount: role.price,
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
 */
export async function joinPaidEvent(formData: FormData): Promise<void> {
  const eventId = String(formData.get("eventId") ?? "");
  const eventRoleId = String(formData.get("eventRoleId") ?? "");
  if (!/^\d+$/.test(eventId)) {
    throw new Error("invalid_input");
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/event/${eventId}`)}`);
  }

  const result = await createCheckoutSession(eventId, eventRoleId);
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
    case "unauthorized":
      redirect(`/login?next=${encodeURIComponent(`/event/${eventId}`)}`);
      break;
    default:
      redirect(`/event/${eventId}?payment=error`);
  }
}
