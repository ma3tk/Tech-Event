"use server";

/**
 * Calendar Membership Tier (Luma 風 有料 / 承認制カレンダー購読プラン) の
 * Server Actions。
 *
 * - tier CRUD (`createTier` / `listTiers` / `updateTier` / `deactivateTier`)
 * - 承認フロー (`approveSubscription` / `rejectSubscription` /
 *   `listPendingSubscriptions`)
 * - manage ページのフォームから呼ぶ薄いラッパー (`*Form`)
 *
 * 認可:
 * - tier 管理・購読の承認 / 却下は **calendar owner のみ** (Server 側で検証)
 * - `listTiers` は誰でも可 (active のみ)。inactive 込みは owner のみ
 *
 * データ整合:
 * - `Calendar.subscriberCount` は status=active の購読のみ計上する。
 *   pending 作成時は増やさず、approve 時に increment する。
 * - id 採番は `nextId(tx, "calendarMembershipTier")` (race retry は withRetry)
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { nextId, withRetry } from "@/lib/id-gen";
import { recordAudit } from "@/lib/audit";
import { getString as formValue, getStringRaw as formValueRaw } from "@/lib/form-data";

/* ============================================================
 * 型 / Schema
 * ============================================================ */

const BigIntIdString = z.string().regex(/^\d+$/, "id must be digits only");

const TierInputSchema = z.object({
  name: z.string().min(1, "name は必須").max(120),
  description: z.string().max(2_000).optional().default(""),
  /** 月額 (JPY)。0 = 無料 (承認制のみのプラン等) */
  price: z.number().int().min(0).max(1_000_000),
  approvalRequired: z.boolean(),
});

export type TierInput = z.infer<typeof TierInputSchema>;

/** ページ / クライアントに渡せる serialize 済み tier。 */
export type TierDTO = {
  id: string;
  calendarId: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  approvalRequired: boolean;
  active: boolean;
};

export type TierActionResult =
  | { ok: true; tierId: string }
  | {
      ok: false;
      reason:
        | "unauthorized"
        | "forbidden"
        | "calendar_not_found"
        | "tier_not_found"
        | "invalid_input"
        | "invalid_status";
      message?: string;
    };

export type SubscriptionApprovalResult =
  | { ok: true; subscriptionId: string; status: "active" | "cancelled" }
  | {
      ok: false;
      reason:
        | "unauthorized"
        | "forbidden"
        | "calendar_not_found"
        | "subscription_not_found"
        | "invalid_input"
        | "invalid_status";
      message?: string;
    };

/** 承認待ち購読の serialize 済み行 (manage ページ用)。 */
export type PendingSubscriptionDTO = {
  id: string;
  subscribedAt: string;
  user: { id: string; nickname: string; displayName: string; avatarUrl: string | null };
  tier: { id: string; name: string; price: number; approvalRequired: boolean } | null;
};

/* ============================================================
 * 内部ヘルパー
 * ============================================================ */

function toTierDTO(t: {
  id: bigint;
  calendarId: bigint;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  approvalRequired: boolean;
  active: boolean;
}): TierDTO {
  return {
    id: t.id.toString(),
    calendarId: t.calendarId.toString(),
    name: t.name,
    description: t.description,
    price: t.price,
    currency: t.currency,
    approvalRequired: t.approvalRequired,
    active: t.active,
  };
}

/**
 * calendar を取得して現在ユーザーが owner であることを検証する。
 * 失敗時は理由 (unauthorized / calendar_not_found / forbidden) を返す。
 */
async function requireCalendarOwner(calendarId: bigint): Promise<
  | {
      ok: true;
      userId: bigint;
      cal: { id: bigint; slug: string; ownerUserId: bigint };
    }
  | { ok: false; reason: "unauthorized" | "calendar_not_found" | "forbidden" }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "unauthorized" };

  const cal = await prisma.calendar.findUnique({
    where: { id: calendarId },
    select: { id: true, slug: true, ownerUserId: true },
  });
  if (!cal) return { ok: false, reason: "calendar_not_found" };
  if (cal.ownerUserId !== user.id) return { ok: false, reason: "forbidden" };

  return { ok: true, userId: user.id, cal };
}

function parseBigIntId(raw: string | bigint): bigint | null {
  if (typeof raw === "bigint") return raw;
  const parsed = BigIntIdString.safeParse(raw);
  return parsed.success ? BigInt(parsed.data) : null;
}

/* ============================================================
 * createTier
 * ============================================================ */

/**
 * tier を新規作成する (calendar owner のみ)。
 *
 * 例: `createTier(calendarId, { name: "Pro", price: 500, approvalRequired: false })`
 */
export async function createTier(
  calendarId: string | bigint,
  input: {
    name: string;
    price: number;
    approvalRequired: boolean;
    description?: string;
  },
): Promise<TierActionResult> {
  const calId = parseBigIntId(calendarId);
  if (calId === null) return { ok: false, reason: "invalid_input" };

  const parsed = TierInputSchema.safeParse({
    name: input.name,
    price: input.price,
    approvalRequired: input.approvalRequired,
    description: input.description ?? "",
  });
  if (!parsed.success) {
    return {
      ok: false,
      reason: "invalid_input",
      message: parsed.error.issues[0]?.message,
    };
  }

  const auth = await requireCalendarOwner(calId);
  if (!auth.ok) return { ok: false, reason: auth.reason };

  const data = parsed.data;
  let createdId: bigint = BigInt(0);
  await withRetry(() =>
    prisma.$transaction(async (tx) => {
      const tierId = await nextId(tx, "calendarMembershipTier");
      await tx.calendarMembershipTier.create({
        data: {
          id: tierId,
          calendarId: calId,
          name: data.name,
          description: data.description || null,
          price: data.price,
          currency: "JPY",
          approvalRequired: data.approvalRequired,
          active: true,
        },
      });
      createdId = tierId;
    }),
  );

  void recordAudit({
    actorUserId: auth.userId,
    action: "calendar.tier.create",
    targetType: "CalendarMembershipTier",
    targetId: createdId,
    metadata: { calendarId: calId.toString(), name: data.name, price: data.price },
  });

  revalidatePath(`/calendar/${auth.cal.slug}`);
  revalidatePath(`/calendar/${auth.cal.slug}/manage`);
  return { ok: true, tierId: createdId.toString() };
}

/* ============================================================
 * listTiers
 * ============================================================ */

/**
 * calendar の tier 一覧を返す。
 *
 * - 既定: active な tier のみ (公開ページ用、誰でも可)
 * - `includeInactive: true`: owner のみ inactive 込みで返す (manage 用)。
 *   owner でない場合は active のみに fallback する。
 */
export async function listTiers(
  calendarId: string | bigint,
  opts?: { includeInactive?: boolean },
): Promise<TierDTO[]> {
  const calId = parseBigIntId(calendarId);
  if (calId === null) return [];

  let includeInactive = false;
  if (opts?.includeInactive) {
    const auth = await requireCalendarOwner(calId);
    includeInactive = auth.ok;
  }

  const rows = await prisma.calendarMembershipTier.findMany({
    where: { calendarId: calId, ...(includeInactive ? {} : { active: true }) },
    orderBy: [{ price: "asc" }, { id: "asc" }],
  });
  return rows.map(toTierDTO);
}

/* ============================================================
 * updateTier
 * ============================================================ */

/** tier を更新する (calendar owner のみ)。指定したフィールドのみ更新。 */
export async function updateTier(
  tierId: string | bigint,
  input: {
    name?: string;
    price?: number;
    approvalRequired?: boolean;
    description?: string;
    active?: boolean;
  },
): Promise<TierActionResult> {
  const id = parseBigIntId(tierId);
  if (id === null) return { ok: false, reason: "invalid_input" };

  const tier = await prisma.calendarMembershipTier.findUnique({
    where: { id },
    select: { id: true, calendarId: true },
  });
  if (!tier) return { ok: false, reason: "tier_not_found" };

  const auth = await requireCalendarOwner(tier.calendarId);
  if (!auth.ok) return { ok: false, reason: auth.reason };

  const PartialSchema = TierInputSchema.partial().extend({
    active: z.boolean().optional(),
  });
  const parsed = PartialSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "invalid_input",
      message: parsed.error.issues[0]?.message,
    };
  }
  const data = parsed.data;

  await prisma.calendarMembershipTier.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.approvalRequired !== undefined
        ? { approvalRequired: data.approvalRequired }
        : {}),
      ...(data.description !== undefined
        ? { description: data.description || null }
        : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
    },
  });

  void recordAudit({
    actorUserId: auth.userId,
    action: "calendar.tier.update",
    targetType: "CalendarMembershipTier",
    targetId: id,
    metadata: { calendarId: tier.calendarId.toString() },
  });

  revalidatePath(`/calendar/${auth.cal.slug}`);
  revalidatePath(`/calendar/${auth.cal.slug}/manage`);
  return { ok: true, tierId: id.toString() };
}

/* ============================================================
 * deactivateTier
 * ============================================================ */

/**
 * tier を無効化する (calendar owner のみ)。
 *
 * 既存購読は削除しない (非破壊)。新規の tier 購読受付だけ止まる。
 */
export async function deactivateTier(
  tierId: string | bigint,
): Promise<TierActionResult> {
  const id = parseBigIntId(tierId);
  if (id === null) return { ok: false, reason: "invalid_input" };

  const tier = await prisma.calendarMembershipTier.findUnique({
    where: { id },
    select: { id: true, calendarId: true },
  });
  if (!tier) return { ok: false, reason: "tier_not_found" };

  const auth = await requireCalendarOwner(tier.calendarId);
  if (!auth.ok) return { ok: false, reason: auth.reason };

  await prisma.calendarMembershipTier.update({
    where: { id },
    data: { active: false },
  });

  void recordAudit({
    actorUserId: auth.userId,
    action: "calendar.tier.deactivate",
    targetType: "CalendarMembershipTier",
    targetId: id,
    metadata: { calendarId: tier.calendarId.toString() },
  });

  revalidatePath(`/calendar/${auth.cal.slug}`);
  revalidatePath(`/calendar/${auth.cal.slug}/manage`);
  return { ok: true, tierId: id.toString() };
}

/* ============================================================
 * 承認フロー: approveSubscription / rejectSubscription
 * ============================================================ */

/**
 * 承認待ち (status=pending) の購読を承認して active にする
 * (calendar owner のみ)。
 *
 * `subscriberCount` は active のみ計上のため、ここで increment する。
 */
export async function approveSubscription(
  subscriptionId: string | bigint,
): Promise<SubscriptionApprovalResult> {
  const id = parseBigIntId(subscriptionId);
  if (id === null) return { ok: false, reason: "invalid_input" };

  const sub = await prisma.calendarSubscription.findUnique({
    where: { id },
    select: { id: true, calendarId: true, status: true, userId: true },
  });
  if (!sub) return { ok: false, reason: "subscription_not_found" };

  const auth = await requireCalendarOwner(sub.calendarId);
  if (!auth.ok) return { ok: false, reason: auth.reason };

  if (sub.status !== "pending") {
    return { ok: false, reason: "invalid_status", message: `status=${sub.status}` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.calendarSubscription.update({
      where: { id },
      data: { status: "active" },
    });
    // pending 作成時には増やしていないので、ここで初めて計上する
    await tx.calendar.update({
      where: { id: sub.calendarId },
      data: { subscriberCount: { increment: 1 } },
    });
  });

  void recordAudit({
    actorUserId: auth.userId,
    action: "calendar.subscription.approve",
    targetType: "CalendarSubscription",
    targetId: id,
    metadata: {
      calendarId: sub.calendarId.toString(),
      subscriberUserId: sub.userId.toString(),
    },
  });

  revalidatePath(`/calendar/${auth.cal.slug}`);
  revalidatePath(`/calendar/${auth.cal.slug}/manage`);
  return { ok: true, subscriptionId: id.toString(), status: "active" };
}

/**
 * 承認待ち (status=pending) の購読を却下して cancelled にする
 * (calendar owner のみ)。
 *
 * pending は subscriberCount に計上していないため decrement しない。
 * 行は履歴として残す (却下されたユーザーは再度購読申請すると status が
 * 上書きされる)。
 */
export async function rejectSubscription(
  subscriptionId: string | bigint,
): Promise<SubscriptionApprovalResult> {
  const id = parseBigIntId(subscriptionId);
  if (id === null) return { ok: false, reason: "invalid_input" };

  const sub = await prisma.calendarSubscription.findUnique({
    where: { id },
    select: { id: true, calendarId: true, status: true, userId: true },
  });
  if (!sub) return { ok: false, reason: "subscription_not_found" };

  const auth = await requireCalendarOwner(sub.calendarId);
  if (!auth.ok) return { ok: false, reason: auth.reason };

  if (sub.status !== "pending") {
    return { ok: false, reason: "invalid_status", message: `status=${sub.status}` };
  }

  await prisma.calendarSubscription.update({
    where: { id },
    data: { status: "cancelled" },
  });

  void recordAudit({
    actorUserId: auth.userId,
    action: "calendar.subscription.reject",
    targetType: "CalendarSubscription",
    targetId: id,
    metadata: {
      calendarId: sub.calendarId.toString(),
      subscriberUserId: sub.userId.toString(),
    },
  });

  revalidatePath(`/calendar/${auth.cal.slug}`);
  revalidatePath(`/calendar/${auth.cal.slug}/manage`);
  return { ok: true, subscriptionId: id.toString(), status: "cancelled" };
}

/* ============================================================
 * listPendingSubscriptions (owner のみ)
 * ============================================================ */

/** 承認待ち (status=pending) の購読一覧を返す (calendar owner のみ)。 */
export async function listPendingSubscriptions(
  calendarId: string | bigint,
): Promise<PendingSubscriptionDTO[]> {
  const calId = parseBigIntId(calendarId);
  if (calId === null) return [];

  const auth = await requireCalendarOwner(calId);
  if (!auth.ok) return [];

  const rows = await prisma.calendarSubscription.findMany({
    where: { calendarId: calId, status: "pending" },
    orderBy: { subscribedAt: "asc" },
    include: {
      user: {
        select: { id: true, nickname: true, displayName: true, avatarUrl: true },
      },
      tier: {
        select: { id: true, name: true, price: true, approvalRequired: true },
      },
    },
  });

  return rows.map((r) => ({
    id: r.id.toString(),
    subscribedAt: r.subscribedAt.toISOString(),
    user: {
      id: r.user.id.toString(),
      nickname: r.user.nickname,
      displayName: r.user.displayName,
      avatarUrl: r.user.avatarUrl,
    },
    tier: r.tier
      ? {
          id: r.tier.id.toString(),
          name: r.tier.name,
          price: r.tier.price,
          approvalRequired: r.tier.approvalRequired,
        }
      : null,
  }));
}

/* ============================================================
 * manage ページ用フォームラッパー
 *
 * manage ページの <form action={...}> から呼ぶ薄い Server Action。
 * 成功 / 失敗いずれも manage ページへリダイレクトして通知する。
 * ============================================================ */

function manageUrl(slug: string, key: string, value: string): string {
  return `/calendar/${slug}/manage?${key}=${encodeURIComponent(value)}`;
}

async function slugOfCalendar(calendarId: bigint): Promise<string | null> {
  const cal = await prisma.calendar.findUnique({
    where: { id: calendarId },
    select: { slug: true },
  });
  return cal?.slug ?? null;
}

/** tier 作成フォーム (fields: calendarId, name, price, approvalRequired, description)。 */
export async function createTierForm(formData: FormData): Promise<void> {
  const calendarIdRaw = formValue(formData, "calendarId");
  const calId = parseBigIntId(calendarIdRaw);
  if (calId === null) throw new Error("invalid_input");
  const slug = await slugOfCalendar(calId);
  if (!slug) throw new Error("calendar_not_found");

  const priceRaw = formValue(formData, "price") || "0";
  const price = /^\d+$/.test(priceRaw) ? Number(priceRaw) : NaN;
  const result = await createTier(calId, {
    name: formValue(formData, "name"),
    price,
    approvalRequired: formValue(formData, "approvalRequired") === "on",
    description: formValueRaw(formData, "description"),
  });

  if (!result.ok) {
    redirect(manageUrl(slug, "error", result.message ?? result.reason));
  }
  redirect(manageUrl(slug, "notice", "tier-created"));
}

/** tier 更新フォーム (fields: tierId, name, price, approvalRequired, description)。 */
export async function updateTierForm(formData: FormData): Promise<void> {
  const tierIdRaw = formValue(formData, "tierId");
  const id = parseBigIntId(tierIdRaw);
  if (id === null) throw new Error("invalid_input");
  const tier = await prisma.calendarMembershipTier.findUnique({
    where: { id },
    select: { calendarId: true },
  });
  if (!tier) throw new Error("tier_not_found");
  const slug = await slugOfCalendar(tier.calendarId);
  if (!slug) throw new Error("calendar_not_found");

  const priceRaw = formValue(formData, "price");
  const result = await updateTier(id, {
    name: formValue(formData, "name") || undefined,
    price: /^\d+$/.test(priceRaw) ? Number(priceRaw) : undefined,
    approvalRequired: formValue(formData, "approvalRequired") === "on",
    description: formValueRaw(formData, "description") || undefined,
  });

  if (!result.ok) {
    redirect(manageUrl(slug, "error", result.message ?? result.reason));
  }
  redirect(manageUrl(slug, "notice", "tier-updated"));
}

/** tier 無効化フォーム (fields: tierId)。 */
export async function deactivateTierForm(formData: FormData): Promise<void> {
  const tierIdRaw = formValue(formData, "tierId");
  const id = parseBigIntId(tierIdRaw);
  if (id === null) throw new Error("invalid_input");
  const tier = await prisma.calendarMembershipTier.findUnique({
    where: { id },
    select: { calendarId: true },
  });
  if (!tier) throw new Error("tier_not_found");
  const slug = await slugOfCalendar(tier.calendarId);
  if (!slug) throw new Error("calendar_not_found");

  const result = await deactivateTier(id);
  if (!result.ok) {
    redirect(manageUrl(slug, "error", result.message ?? result.reason));
  }
  redirect(manageUrl(slug, "notice", "tier-deactivated"));
}

/** 購読承認フォーム (fields: subscriptionId, slug)。 */
export async function approveSubscriptionForm(formData: FormData): Promise<void> {
  const slug = formValue(formData, "slug");
  const result = await approveSubscription(formValue(formData, "subscriptionId"));
  if (!result.ok) {
    redirect(manageUrl(slug, "error", result.message ?? result.reason));
  }
  redirect(manageUrl(slug, "notice", "subscription-approved"));
}

/** 購読却下フォーム (fields: subscriptionId, slug)。 */
export async function rejectSubscriptionForm(formData: FormData): Promise<void> {
  const slug = formValue(formData, "slug");
  const result = await rejectSubscription(formValue(formData, "subscriptionId"));
  if (!result.ok) {
    redirect(manageUrl(slug, "error", result.message ?? result.reason));
  }
  redirect(manageUrl(slug, "notice", "subscription-rejected"));
}
