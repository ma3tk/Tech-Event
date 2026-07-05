"use server";

/**
 * クーポン (割引コード) 関連の Server Actions。
 *
 * - `createCoupon` / `createCouponForm` : 主催者 / GroupAdmin がイベント用クーポンを発行
 * - `listCoupons`                       : イベントのクーポン一覧 (主催者用)
 * - `deactivateCoupon` / `deactivateCouponForm` : クーポン無効化 (削除はしない)
 * - `validateCoupon`                    : コードの有効性検証 (checkout / プレビュー共用)
 *
 * コードは {@link normalizeCouponCode} で大文字正規化して保存・照合する。
 * 割引額の計算は `lib/coupon.ts` の `computeCouponDiscount` (純粋関数) を使う。
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { nextId, withRetry } from "@/lib/id-gen";
import { BigIntIdSchema } from "@/lib/schemas";
import { getString as formValue } from "@/lib/form-data";

import { normalizeCouponCode } from "./lib/coupon";
import { canManageEventPayments } from "./lib/event-admin";

/* ============================================================
 * 型 / Schema
 * ============================================================ */

const CouponCodeSchema = z
  .string()
  .trim()
  .min(2, "コードは 2 文字以上にしてください")
  .max(32, "コードは 32 文字以内にしてください")
  .regex(/^[A-Za-z0-9_-]+$/, "コードは英数字・ハイフン・アンダースコアのみ使えます");

const CreateCouponSchema = z
  .object({
    eventId: BigIntIdSchema,
    code: CouponCodeSchema,
    discountType: z.enum(["percent", "fixed"]),
    discountValue: z.coerce.number().int().min(1),
    maxRedemptions: z.coerce.number().int().min(1).optional(),
    perUserLimit: z.coerce.number().int().min(1).max(100).default(1),
    /** ISO 日付文字列 (YYYY-MM-DD or ISO datetime)。空なら無期限。 */
    expiresAt: z
      .string()
      .trim()
      .optional()
      .transform((s) => (s ? new Date(s) : undefined))
      .refine((d) => d === undefined || !Number.isNaN(d.getTime()), {
        message: "有効期限の日付形式が不正です",
      }),
  })
  .refine(
    (v) => v.discountType !== "percent" || v.discountValue <= 100,
    { message: "percent の割引率は 1〜100 で指定してください", path: ["discountValue"] },
  );

export type CreateCouponInput = {
  eventId: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  maxRedemptions?: number;
  perUserLimit?: number;
  expiresAt?: string;
};

/** 一覧表示用に BigInt を文字列化したクーポン概要。 */
export type CouponSummary = {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  maxRedemptions: number | null;
  redeemedCount: number;
  perUserLimit: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
};

export type CreateCouponResult =
  | { ok: true; coupon: CouponSummary }
  | {
      ok: false;
      reason:
        | "invalid_input"
        | "unauthorized"
        | "forbidden"
        | "not_found"
        | "duplicate_code"
        | "error";
      message?: string;
    };

export type ValidateCouponResult =
  | {
      valid: true;
      couponId: string;
      code: string;
      discountType: string;
      discountValue: number;
    }
  | {
      valid: false;
      reason:
        | "invalid_input"
        | "not_found"
        | "inactive"
        | "expired"
        | "exhausted"
        | "per_user_limit";
    };

/* ============================================================
 * 内部ヘルパー
 * ============================================================ */

function couponToSummary(c: {
  id: bigint;
  code: string;
  discountType: string;
  discountValue: number;
  maxRedemptions: number | null;
  redeemedCount: number;
  perUserLimit: number;
  expiresAt: Date | null;
  active: boolean;
  createdAt: Date;
}): CouponSummary {
  return {
    id: c.id.toString(),
    code: c.code,
    discountType: c.discountType,
    discountValue: c.discountValue,
    maxRedemptions: c.maxRedemptions,
    redeemedCount: c.redeemedCount,
    perUserLimit: c.perUserLimit,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    active: c.active,
    createdAt: c.createdAt.toISOString(),
  };
}

function revalidateCouponAdmin(eventId: bigint): void {
  revalidatePath(`/event/${eventId.toString()}/admin/coupons`);
}

/* ============================================================
 * createCoupon
 * ============================================================ */

/**
 * イベント用クーポンを発行する (主催者 / GroupAdmin のみ)。
 *
 * - `code` は大文字正規化して保存。
 * - 同一イベント内で同じ正規化コードの (active な) クーポンがあれば
 *   `duplicate_code` を返す (SQLite は NULL を含む UNIQUE を重複可とするため
 *   アプリ層でも防御する)。
 */
export async function createCoupon(
  input: CreateCouponInput,
): Promise<CreateCouponResult> {
  const parsed = CreateCouponSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "invalid_input",
      message: parsed.error.issues[0]?.message,
    };
  }
  const data = parsed.data;

  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "unauthorized" };

  const event = await prisma.event.findUnique({
    where: { id: data.eventId },
    select: { id: true },
  });
  if (!event) return { ok: false, reason: "not_found" };

  if (!(await canManageEventPayments(data.eventId, user.id))) {
    return { ok: false, reason: "forbidden" };
  }

  const code = normalizeCouponCode(data.code);

  const dup = await prisma.coupon.findFirst({
    where: { scope: "event", eventId: data.eventId, code },
    select: { id: true },
  });
  if (dup) {
    return { ok: false, reason: "duplicate_code" };
  }

  try {
    const created = await withRetry(() =>
      prisma.$transaction(async (tx) => {
        const id = await nextId(tx, "coupon");
        return tx.coupon.create({
          data: {
            id,
            code,
            scope: "event",
            eventId: data.eventId,
            discountType: data.discountType,
            discountValue: data.discountValue,
            maxRedemptions: data.maxRedemptions ?? null,
            perUserLimit: data.perUserLimit,
            expiresAt: data.expiresAt ?? null,
            active: true,
          },
        });
      }),
    );
    revalidateCouponAdmin(data.eventId);
    return { ok: true, coupon: couponToSummary(created) };
  } catch (e) {
    console.error("[coupon] createCoupon failed", e);
    return {
      ok: false,
      reason: "error",
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * クーポン発行フォーム用 Server Action。
 * 成功 / 失敗を query param で `admin/coupons` に返す。
 */
export async function createCouponForm(formData: FormData): Promise<void> {
  const eventId = formValue(formData, "eventId");
  if (!/^\d+$/.test(eventId)) {
    throw new Error("invalid_input");
  }
  const basePath = `/event/${eventId}/admin/coupons`;

  const result = await createCoupon({
    eventId,
    code: formValue(formData, "code"),
    discountType:
      formValue(formData, "discountType") === "percent" ? "percent" : "fixed",
    discountValue: Number(formValue(formData, "discountValue") || "0"),
    maxRedemptions: formValue(formData, "maxRedemptions")
      ? Number(formValue(formData, "maxRedemptions"))
      : undefined,
    perUserLimit: formValue(formData, "perUserLimit")
      ? Number(formValue(formData, "perUserLimit"))
      : undefined,
    expiresAt: formValue(formData, "expiresAt") || undefined,
  });

  if (result.ok) {
    redirect(`${basePath}?created=${encodeURIComponent(result.coupon.code)}`);
  }
  redirect(
    `${basePath}?error=${encodeURIComponent(result.reason)}${
      result.message ? `&message=${encodeURIComponent(result.message)}` : ""
    }`,
  );
}

/* ============================================================
 * listCoupons
 * ============================================================ */

/**
 * イベントのクーポン一覧を取得する (主催者 / GroupAdmin のみ)。
 * 権限がない場合は空配列を返す。
 */
export async function listCoupons(eventId: string): Promise<CouponSummary[]> {
  const parsed = BigIntIdSchema.safeParse(eventId);
  if (!parsed.success) return [];

  const user = await getCurrentUser();
  if (!user) return [];
  if (!(await canManageEventPayments(parsed.data, user.id))) return [];

  const coupons = await prisma.coupon.findMany({
    where: { scope: "event", eventId: parsed.data },
    orderBy: { id: "desc" },
  });
  return coupons.map(couponToSummary);
}

/* ============================================================
 * deactivateCoupon
 * ============================================================ */

export type DeactivateCouponResult =
  | { ok: true }
  | {
      ok: false;
      reason: "invalid_input" | "unauthorized" | "forbidden" | "not_found";
    };

/**
 * クーポンを無効化する (`active=false`)。既存の利用実績は保持する。
 */
export async function deactivateCoupon(
  couponId: string,
): Promise<DeactivateCouponResult> {
  const parsed = BigIntIdSchema.safeParse(couponId);
  if (!parsed.success) return { ok: false, reason: "invalid_input" };

  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "unauthorized" };

  const coupon = await prisma.coupon.findUnique({
    where: { id: parsed.data },
    select: { id: true, eventId: true, groupId: true, scope: true },
  });
  if (!coupon || coupon.scope !== "event" || coupon.eventId === null) {
    return { ok: false, reason: "not_found" };
  }

  if (!(await canManageEventPayments(coupon.eventId, user.id))) {
    return { ok: false, reason: "forbidden" };
  }

  await prisma.coupon.update({
    where: { id: coupon.id },
    data: { active: false },
  });
  revalidateCouponAdmin(coupon.eventId);
  return { ok: true };
}

/** クーポン無効化フォーム用 Server Action。 */
export async function deactivateCouponForm(formData: FormData): Promise<void> {
  const eventId = formValue(formData, "eventId");
  const couponId = formValue(formData, "couponId");
  if (!/^\d+$/.test(eventId) || !/^\d+$/.test(couponId)) {
    throw new Error("invalid_input");
  }
  const result = await deactivateCoupon(couponId);
  const basePath = `/event/${eventId}/admin/coupons`;
  if (result.ok) {
    redirect(`${basePath}?deactivated=1`);
  }
  redirect(`${basePath}?error=${encodeURIComponent(result.reason)}`);
}

/* ============================================================
 * validateCoupon
 * ============================================================ */

/**
 * クーポンコードの有効性を検証する。
 *
 * 検証項目:
 *   - コード存在 (イベントスコープ or 当該イベントのグループスコープ)
 *   - `active`
 *   - `expiresAt` (期限切れでないか)
 *   - `maxRedemptions` vs `redeemedCount` (発行上限)
 *   - `perUserLimit` vs `CouponRedemption` の userId 集計 (ユーザー上限)
 *
 * 割引額の計算は呼び出し側で `computeCouponDiscount(discountType,
 * discountValue, price)` (lib/coupon.ts) を使う。
 *
 * @param eventId 対象イベント id (数字文字列)
 * @param code    入力コード (正規化前で OK)
 * @param userId  利用者 id (数字文字列)。省略時はログイン中ユーザー。
 */
export async function validateCoupon(
  eventId: string,
  code: string,
  userId?: string,
): Promise<ValidateCouponResult> {
  const parsedEvent = BigIntIdSchema.safeParse(eventId);
  const parsedCode = CouponCodeSchema.safeParse(code);
  if (!parsedEvent.success || !parsedCode.success) {
    return { valid: false, reason: "invalid_input" };
  }

  let uid: bigint | null = null;
  if (userId !== undefined) {
    const parsedUser = BigIntIdSchema.safeParse(userId);
    if (!parsedUser.success) return { valid: false, reason: "invalid_input" };
    uid = parsedUser.data;
  } else {
    const user = await getCurrentUser();
    uid = user?.id ?? null;
  }

  const normalized = normalizeCouponCode(parsedCode.data);

  const event = await prisma.event.findUnique({
    where: { id: parsedEvent.data },
    select: { id: true, groupId: true },
  });
  if (!event) return { valid: false, reason: "not_found" };

  const coupon = await prisma.coupon.findFirst({
    where: {
      code: normalized,
      OR: [
        { scope: "event", eventId: event.id },
        { scope: "group", groupId: event.groupId },
      ],
    },
    orderBy: { id: "desc" },
  });
  if (!coupon) return { valid: false, reason: "not_found" };
  if (!coupon.active) return { valid: false, reason: "inactive" };
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    return { valid: false, reason: "expired" };
  }
  if (
    coupon.maxRedemptions !== null &&
    coupon.redeemedCount >= coupon.maxRedemptions
  ) {
    return { valid: false, reason: "exhausted" };
  }
  if (uid !== null) {
    const used = await prisma.couponRedemption.count({
      where: { couponId: coupon.id, userId: uid },
    });
    if (used >= coupon.perUserLimit) {
      return { valid: false, reason: "per_user_limit" };
    }
  }

  return {
    valid: true,
    couponId: coupon.id.toString(),
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
  };
}
