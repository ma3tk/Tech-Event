"use server";

/**
 * Organization (org > calendar > event 階層) の Server Actions。
 *
 * Luma の "Organization" 相当。複数の Calendar を 1 つの組織にまとめ、
 * `/org/{slug}` で配下カレンダーと集約イベントを公開する。
 *
 * 設計原則 (非破壊):
 *  - 既存の Calendar Server Action (`calendar-actions.ts`) には一切手を入れない
 *  - Calendar への org 割り当ては本ファイルの `assignCalendarToOrg` が
 *    `Calendar.organizationId` を update する形で完結させる
 *  - `organizationId = null` の個人カレンダーは従来どおりの挙動を維持する
 *
 * 認可:
 *  - createOrganization : ログイン必須 (ownerUserId = 自分)
 *  - updateOrganization : org owner のみ
 *  - assignCalendarToOrg: calendar owner 必須 + (割り当て時は) org owner 必須
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { nextId, withRetry } from "@/lib/id-gen";
import { buildRedirectUrlWithFormError } from "@/lib/action-error";
import { recordAudit } from "@/lib/audit";
import { isReservedSlug } from "@/lib/reserved-words";
import { assertRateLimit, RATE_LIMITS, RateLimitError } from "@/lib/rate-limit";
import {
  getString as formValue,
  getStringRaw as formValueRaw,
} from "@/lib/form-data";
import { SlugSchema, UrlOrEmpty } from "@/lib/schemas";

/* ============================================================
 * 入力スキーマ
 * ============================================================ */

const OrganizationBaseSchema = z.object({
  name: z.string().min(1, "name は必須").max(120),
  description: z.string().max(20_000).optional().default(""),
  logoUrl: UrlOrEmpty.optional().default(""),
});

const CreateOrganizationSchema = OrganizationBaseSchema.extend({
  slug: SlugSchema,
});

const UpdateOrganizationSchema = OrganizationBaseSchema.extend({
  organizationId: z.string().regex(/^\d+$/),
});

const AssignCalendarSchema = z.object({
  calendarId: z.string().regex(/^\d+$/),
  // 空文字 = org から解除 (organizationId を null に戻す)
  organizationId: z.string().regex(/^\d*$/),
});

/**
 * `/org/create` などの静的サブパスと衝突する slug。
 * `isReservedSlug` (全 route 共通の予約語) に加えて org 名前空間固有で拒否する。
 */
const ORG_LOCAL_RESERVED = new Set(["create", "edit", "new"]);

function isOrgReservedSlug(slug: string): boolean {
  return isReservedSlug(slug) || ORG_LOCAL_RESERVED.has(slug.toLowerCase());
}

/* ============================================================
 * エラーリダイレクト (calendar-actions と同パターン)
 * ============================================================ */

function redirectWithError(
  basePath: string,
  form: FormData,
  errorKey: string,
  errorMessage?: string,
): never {
  redirect(buildRedirectUrlWithFormError(basePath, form, errorKey, errorMessage));
}

/* ============================================================
 * createOrganization
 * ============================================================ */

export async function createOrganization(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/org/create")}`);
  }

  // ---- レート制限 (user 単位: 5 回/時) ----
  try {
    assertRateLimit(
      `user:${user.id}:createOrganization`,
      RATE_LIMITS.createResource,
    );
  } catch (e) {
    if (e instanceof RateLimitError) {
      redirectWithError("/org/create", formData, "rate_limited", e.message);
    }
    throw e;
  }

  const parsed = CreateOrganizationSchema.safeParse({
    slug: formValue(formData, "slug"),
    name: formValue(formData, "name"),
    description: formValueRaw(formData, "description"),
    logoUrl: formValue(formData, "logoUrl"),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    redirectWithError(
      "/org/create",
      formData,
      "invalid_input",
      first?.message ?? "入力が不正です",
    );
  }
  const data = parsed.data;

  // 予約語チェック (システムパス衝突 / フィッシング対策 + /org/create 衝突回避)
  if (isOrgReservedSlug(data.slug)) {
    redirectWithError(
      "/org/create",
      formData,
      "slug_reserved",
      `slug "${data.slug}" は予約語のため使用できません`,
    );
  }

  const dup = await prisma.organization.findUnique({
    where: { slug: data.slug },
    select: { id: true },
  });
  if (dup) {
    redirectWithError(
      "/org/create",
      formData,
      "slug_taken",
      `slug "${data.slug}" は既に使われています`,
    );
  }

  try {
    await withRetry(() =>
      prisma.$transaction(async (tx) => {
        const orgId = await nextId(tx, "organization");
        await tx.organization.create({
          data: {
            id: orgId,
            slug: data.slug,
            name: data.name,
            description: data.description || null,
            logoUrl: data.logoUrl || null,
            ownerUserId: user.id,
          },
        });
      }),
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/UNIQUE|constraint|slug/i.test(msg)) {
      redirectWithError(
        "/org/create",
        formData,
        "slug_taken",
        `slug "${data.slug}" は既に使われています`,
      );
    }
    redirectWithError(
      "/org/create",
      formData,
      "internal_error",
      "Organization の作成に失敗しました",
    );
  }

  // 監査ログ
  void recordAudit({
    actorUserId: user.id,
    action: "organization.create",
    targetType: "Organization",
    targetId: BigInt(0),
    metadata: { slug: data.slug },
  });

  revalidatePath(`/org/${data.slug}`);
  revalidatePath("/dashboard");
  redirect(`/org/${data.slug}?toast=org-created`);
}

/* ============================================================
 * updateOrganization (owner のみ)
 * ============================================================ */

export async function updateOrganization(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/org/create")}`);
  }

  const parsed = UpdateOrganizationSchema.safeParse({
    organizationId: formValueRaw(formData, "organizationId"),
    name: formValue(formData, "name"),
    description: formValueRaw(formData, "description"),
    logoUrl: formValue(formData, "logoUrl"),
  });
  if (!parsed.success) {
    throw new Error("invalid_input");
  }
  const data = parsed.data;
  const orgId = BigInt(data.organizationId);

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, slug: true, ownerUserId: true },
  });
  if (!org) throw new Error("organization_not_found");
  if (org.ownerUserId !== user.id) throw new Error("forbidden");

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      name: data.name,
      description: data.description || null,
      logoUrl: data.logoUrl || null,
    },
  });

  // 監査ログ
  void recordAudit({
    actorUserId: user.id,
    action: "organization.update",
    targetType: "Organization",
    targetId: org.id,
  });

  revalidatePath(`/org/${org.slug}`);
  revalidatePath(`/org/${org.slug}/edit`);
  redirect(`/org/${org.slug}?toast=org-updated`);
}

/* ============================================================
 * assignCalendarToOrg
 *
 * Calendar を Organization に割り当て / 解除する。
 * 既存 calendar-actions には触れず、本 Action が `Calendar.organizationId`
 * のみを update する (他のフィールドは不変 = 非破壊)。
 *
 * - `organizationId` が空文字 → 解除 (null に戻す = 個人カレンダーへ復帰)
 * - 認可: calendar owner 必須。割り当て時は加えて org owner 必須
 * ============================================================ */

export async function assignCalendarToOrg(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/calendars")}`);
  }

  const parsed = AssignCalendarSchema.safeParse({
    calendarId: formValueRaw(formData, "calendarId"),
    organizationId: formValueRaw(formData, "organizationId"),
  });
  if (!parsed.success) {
    throw new Error("invalid_input");
  }
  const calendarId = BigInt(parsed.data.calendarId);
  const targetOrgId = parsed.data.organizationId
    ? BigInt(parsed.data.organizationId)
    : null;

  const cal = await prisma.calendar.findUnique({
    where: { id: calendarId },
    select: { id: true, slug: true, ownerUserId: true, organizationId: true },
  });
  if (!cal) throw new Error("calendar_not_found");
  if (cal.ownerUserId !== user.id) throw new Error("forbidden");

  // 解除時のリダイレクト先用に、現所属 org を先に引いておく
  const previousOrg = cal.organizationId
    ? await prisma.organization.findUnique({
        where: { id: cal.organizationId },
        select: { id: true, slug: true },
      })
    : null;

  let redirectSlug: string | null = null;

  if (targetOrgId !== null) {
    // ---- 割り当て: org owner かつ calendar owner のみ ----
    const org = await prisma.organization.findUnique({
      where: { id: targetOrgId },
      select: { id: true, slug: true, ownerUserId: true },
    });
    if (!org) throw new Error("organization_not_found");
    if (org.ownerUserId !== user.id) throw new Error("forbidden");

    await prisma.calendar.update({
      where: { id: cal.id },
      data: { organizationId: org.id },
    });
    redirectSlug = org.slug;

    void recordAudit({
      actorUserId: user.id,
      action: "organization.calendar_assign",
      targetType: "Calendar",
      targetId: cal.id,
      metadata: { organizationId: org.id.toString(), slug: cal.slug },
    });
    revalidatePath(`/org/${org.slug}`);
    revalidatePath(`/org/${org.slug}/edit`);
  } else {
    // ---- 解除: calendar owner のみで可 (個人カレンダーへ復帰) ----
    await prisma.calendar.update({
      where: { id: cal.id },
      data: { organizationId: null },
    });
    redirectSlug = previousOrg?.slug ?? null;

    void recordAudit({
      actorUserId: user.id,
      action: "organization.calendar_unassign",
      targetType: "Calendar",
      targetId: cal.id,
      metadata: { slug: cal.slug },
    });
  }

  if (previousOrg) {
    revalidatePath(`/org/${previousOrg.slug}`);
    revalidatePath(`/org/${previousOrg.slug}/edit`);
  }
  revalidatePath(`/calendar/${cal.slug}`);

  if (redirectSlug) {
    redirect(`/org/${redirectSlug}/edit?toast=org-calendar-updated`);
  }
  redirect(`/calendar/${cal.slug}`);
}

/* ============================================================
 * listOrgCalendars (読み取りヘルパー)
 *
 * Server Component から呼ぶ想定。org 配下の active カレンダーを
 * 購読者数の多い順で返す。
 * ============================================================ */

export async function listOrgCalendars(orgId: bigint | string): Promise<
  Array<{
    id: bigint;
    slug: string;
    name: string;
    description: string | null;
    coverImageUrl: string | null;
    tintColor: string | null;
    subscriberCount: number;
    eventCount: number;
  }>
> {
  const id = typeof orgId === "bigint" ? orgId : BigInt(orgId);
  return prisma.calendar.findMany({
    where: { organizationId: id, status: "active" },
    orderBy: [{ subscriberCount: "desc" }, { id: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      coverImageUrl: true,
      tintColor: true,
      subscriberCount: true,
      eventCount: true,
    },
  });
}
