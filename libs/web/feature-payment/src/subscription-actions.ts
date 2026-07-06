"use server";

/**
 * グループ Plus プラン (月額サブスクリプション) の Server Actions。
 *
 * - `createPlusSubscriptionCheckout(groupId)` :
 *   Stripe Checkout (mode: "subscription") のセッションを作成し URL を返す。
 *   price は env `STRIPE_PLUS_PRICE_ID`。Stripe / price 未設定環境では
 *   `{ ok: false, reason: "disabled" }` を返し、UI は「準備中」表示に
 *   フォールバックする (createCheckoutSession の disabled パターン踏襲)。
 *
 * - `cancelPlusSubscription(groupId)` :
 *   Plus サブスクリプションの解約。Stripe 設定済みなら
 *   `stripe.subscriptions.cancel` を呼んだ上で DB を更新、
 *   未設定環境では DB のみ更新 (free に戻す)。
 *
 * - `upgradeGroupPlanForm` / `cancelPlusSubscriptionForm` :
 *   billing ページのフォームから呼ばれる薄いラッパー (redirect 付き)。
 *
 * 認可: いずれも対象グループの GroupAdmin (owner / admin) のみ。
 * NOTE: Stripe secret / price id は絶対にログ出力しない。
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getString as formValue } from "@/lib/form-data";
import { BigIntIdSchema } from "@/lib/schemas";

import { getStripe, isStripeEnabled } from "./lib/stripe";
import { getPlusPriceId, isGroupPlus } from "./lib/plan";

/* ============================================================
 * 型 / Schema
 * ============================================================ */

const GroupIdSchema = z.object({ groupId: BigIntIdSchema });

export type SubscriptionCheckoutResult =
  | { ok: true; url: string; sessionId: string }
  | {
      ok: false;
      reason:
        | "disabled"
        | "invalid_input"
        | "unauthorized"
        | "forbidden"
        | "not_found"
        | "already_plus"
        | "error";
      message?: string;
    };

export type CancelSubscriptionResult =
  | {
      ok: true;
      /** Stripe 側の解約を実行したか (未設定環境では "none" = DB のみ更新) */
      provider: "stripe" | "none";
    }
  | {
      ok: false;
      reason:
        | "invalid_input"
        | "unauthorized"
        | "forbidden"
        | "not_found"
        | "not_plus"
        | "error";
      message?: string;
    };

/* ============================================================
 * 認可ヘルパー
 * ============================================================ */

/** 指定ユーザーが指定グループの課金操作をできるか (owner / admin)。 */
async function canManageGroupBilling(
  groupId: bigint,
  userId: bigint,
): Promise<boolean> {
  const admin = await prisma.groupAdmin.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { role: true },
  });
  return !!admin && (admin.role === "owner" || admin.role === "admin");
}

/* ============================================================
 * createPlusSubscriptionCheckout
 * ============================================================ */

/**
 * グループを Plus プランにアップグレードするための
 * Stripe Checkout Session (mode: "subscription") を作成する。
 *
 * 戻り値:
 *   - 成功: `{ ok: true, url, sessionId }` (`url` にリダイレクトで Checkout 画面)
 *   - Stripe / STRIPE_PLUS_PRICE_ID 未設定: `{ ok: false, reason: "disabled" }`
 *     (UI 側は「準備中」表示にフォールバック)
 *   - その他失敗: `{ ok: false, reason: ... }`
 */
export async function createPlusSubscriptionCheckout(
  groupId: string,
): Promise<SubscriptionCheckoutResult> {
  const parsed = GroupIdSchema.safeParse({ groupId });
  if (!parsed.success) {
    return { ok: false, reason: "invalid_input" };
  }

  const priceId = getPlusPriceId();
  const stripe = getStripe();
  if (!isStripeEnabled() || !stripe || !priceId) {
    return { ok: false, reason: "disabled" };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, reason: "unauthorized" };
  }

  const group = await prisma.group.findUnique({
    where: { id: parsed.data.groupId },
  });
  if (!group) {
    return { ok: false, reason: "not_found" };
  }

  if (!(await canManageGroupBilling(group.id, user.id))) {
    return { ok: false, reason: "forbidden" };
  }

  if (isGroupPlus(group)) {
    return { ok: false, reason: "already_plus" };
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  const billingPath = `/group/${group.subdomain}/admin/billing`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      // 既に Stripe Customer が紐付いていれば再利用 (二重 customer 化を防ぐ)
      ...(group.stripeCustomerId
        ? { customer: group.stripeCustomerId }
        : { customer_email: user.email }),
      metadata: {
        purpose: "plus_subscription",
        groupId: group.id.toString(),
        userId: user.id.toString(),
      },
      // Subscription 本体にも groupId を残し、webhook (customer.subscription.*)
      // で Group と突合できるようにする。
      subscription_data: {
        metadata: { groupId: group.id.toString() },
      },
      success_url: `${baseUrl}${billingPath}?billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}${billingPath}?billing=checkout_cancelled`,
    });

    if (!session.url) {
      return { ok: false, reason: "error", message: "stripe returned no url" };
    }

    return { ok: true, url: session.url, sessionId: session.id };
  } catch (e) {
    // NOTE: price id / secret はログに含めない (e はStripe SDK のエラーメッセージのみ)
    console.error("[stripe] createPlusSubscriptionCheckout failed", e);
    return {
      ok: false,
      reason: "error",
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

/* ============================================================
 * cancelPlusSubscription
 * ============================================================ */

/**
 * Plus サブスクリプションを解約し、グループを free に戻す。
 *
 * - Stripe 設定済み + stripeSubscriptionId あり:
 *   `stripe.subscriptions.cancel` を先に呼び、成功後 DB を更新。
 *   (webhook `customer.subscription.deleted` も同じ状態に収束する = 冪等)
 * - Stripe 未設定環境: DB のみ更新 (既存の refundPayment と同じフォールバック方針)
 */
export async function cancelPlusSubscription(
  groupId: string,
): Promise<CancelSubscriptionResult> {
  const parsed = GroupIdSchema.safeParse({ groupId });
  if (!parsed.success) {
    return { ok: false, reason: "invalid_input" };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, reason: "unauthorized" };
  }

  const group = await prisma.group.findUnique({
    where: { id: parsed.data.groupId },
  });
  if (!group) {
    return { ok: false, reason: "not_found" };
  }

  if (!(await canManageGroupBilling(group.id, user.id))) {
    return { ok: false, reason: "forbidden" };
  }

  if (group.plan !== "plus" && !group.stripeSubscriptionId) {
    return { ok: false, reason: "not_plus" };
  }

  // ---- Stripe 側の解約 (設定済み & subscription id あり) ----
  let provider: "stripe" | "none" = "none";
  const stripe = getStripe();
  if (isStripeEnabled() && stripe && group.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(group.stripeSubscriptionId);
      provider = "stripe";
    } catch (e) {
      console.error("[stripe] subscriptions.cancel failed", e);
      return {
        ok: false,
        reason: "error",
        message: e instanceof Error ? e.message : String(e),
      };
    }
  }
  // Stripe 未設定環境では DB のみ更新するフォールバック。

  try {
    await prisma.group.update({
      where: { id: group.id },
      data: {
        plan: "free",
        planExpiresAt: null,
        stripeSubscriptionId: null,
        // stripeCustomerId は再アップグレード時の customer 再利用のため保持
      },
    });
  } catch (e) {
    console.error("[plan] cancelPlusSubscription DB update failed", e);
    return {
      ok: false,
      reason: "error",
      message: e instanceof Error ? e.message : String(e),
    };
  }

  revalidatePath(`/group/${group.subdomain}/admin/billing`);
  revalidatePath(`/group/${group.subdomain}`);

  return { ok: true, provider };
}

/* ============================================================
 * フォーム用ラッパー (billing ページから呼ばれる)
 * ============================================================ */

/** subdomain の形式検証 (redirect 先パスの組み立てに使うため) */
function safeSubdomain(raw: string): string | null {
  return /^[a-z0-9][a-z0-9-]{1,62}$/.test(raw) ? raw : null;
}

/**
 * アップグレードフォーム用 Server Action。
 *
 * formData:
 *   - `groupId`   : 対象グループ id
 *   - `subdomain` : redirect 先の billing ページ解決用
 *
 * 成功時は Stripe Checkout URL に redirect。
 * disabled (env 未設定) 時は `?billing=disabled` で billing ページに戻す
 * (ページ側は「準備中」表示)。
 */
export async function upgradeGroupPlanForm(formData: FormData): Promise<void> {
  const groupId = formValue(formData, "groupId");
  const subdomain = safeSubdomain(formValue(formData, "subdomain"));
  if (!/^\d+$/.test(groupId) || !subdomain) {
    throw new Error("invalid_input");
  }
  const billingPath = `/group/${subdomain}/admin/billing`;

  const result = await createPlusSubscriptionCheckout(groupId);
  if (result.ok) {
    redirect(result.url);
  }

  switch (result.reason) {
    case "unauthorized":
      redirect(`/login?next=${encodeURIComponent(billingPath)}`);
      break;
    default:
      redirect(`${billingPath}?billing=${encodeURIComponent(result.reason)}`);
  }
}

/**
 * 解約フォーム用 Server Action。
 *
 * formData:
 *   - `groupId`   : 対象グループ id
 *   - `subdomain` : redirect 先の billing ページ解決用
 */
export async function cancelPlusSubscriptionForm(
  formData: FormData,
): Promise<void> {
  const groupId = formValue(formData, "groupId");
  const subdomain = safeSubdomain(formValue(formData, "subdomain"));
  if (!/^\d+$/.test(groupId) || !subdomain) {
    throw new Error("invalid_input");
  }
  const billingPath = `/group/${subdomain}/admin/billing`;

  const result = await cancelPlusSubscription(groupId);
  if (result.ok) {
    redirect(`${billingPath}?billing=canceled_plan`);
  }

  switch (result.reason) {
    case "unauthorized":
      redirect(`/login?next=${encodeURIComponent(billingPath)}`);
      break;
    default:
      redirect(`${billingPath}?billing=${encodeURIComponent(result.reason)}`);
  }
}
