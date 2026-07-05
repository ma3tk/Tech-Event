"use server";

/**
 * イベント作成・編集・公開・中止用の Server Actions (主催者向け)。
 *
 * 既存 `event-actions.ts` は参加者向けの join/cancel/bookmark を担当しており、
 * こちらは主催者用の CRUD と状態遷移 (publish/cancel) を担当する。
 *
 * 認可:
 *   - createEvent: ログイン必須 + 対象 group の owner/admin であること
 *   - updateEvent: ログイン必須 + (event.ownerId === self) OR 対象 group の owner/admin
 *   - publishEvent / cancelEvent: updateEvent と同じ
 *
 * BigInt 採番は seed.ts と event-actions.ts 同様 _max+1 方式で行う。
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendMail, getMailProvider } from "@/lib/mailer";
import { notifyEventPublished } from "@/lib/slack";
import { nextId } from "@/lib/id-gen";
import { ActionError } from "@/lib/action-error";
import { recordAudit } from "@/lib/audit";
import { assertRateLimit, RATE_LIMITS, RateLimitError } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { incrementCounter, METRIC_NAMES } from "@/lib/metrics";
import { getString as formValue, getStringRaw as formValueRaw, getInt as formInt } from "@/lib/form-data";
import { BigIntIdString, UrlOrEmpty } from "@/lib/schemas";
import {
  buildEventCancelledMailContent,
  buildGroupMessageMailContent,
  formatEventDateJst,
} from "@/lib/notification";

import { fanoutNotifications, resolveBaseUrl } from "./lib/notification-fanout";
import { refundPayment } from "@tech-event/web-feature-payment";

/* ============================================================
 * バリデーション
 * ============================================================ */

const EventFormatEnum = z.enum(["offline", "online", "hybrid"]);
const RecruitmentEnum = z.enum(["fcfs", "lottery"]);
// donation = 寄付型 (donationMinAmount 以上の任意額。price は推奨額)
const PricingEnum = z.enum(["free", "on_site", "prepaid", "donation"]);

const EventRoleInputSchema = z.object({
  name: z.string().min(1).max(120),
  capacity: z.number().int().min(0).max(100_000).optional(),
  pricingType: PricingEnum,
  price: z.number().int().min(0).max(10_000_000),
});

/** datetime-local 文字列 (`YYYY-MM-DDTHH:mm`) を Date に変換 */
function parseDateTimeLocal(raw: string): Date | null {
  if (!raw) return null;
  // datetime-local は秒を持たないので Date コンストラクタは tz 指定なし → ローカル時刻として解釈される
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** #RRGGBB の形式のみ許容 (簡易) */
const HexColorOrEmpty = z
  .string()
  .max(20)
  .refine(
    (v) => v === "" || /^#[0-9a-fA-F]{6}$/.test(v),
    "テーマカラーは #RRGGBB 形式で指定してください",
  );

const ThemeBackgroundStyleEnum = z.enum(["solid", "gradient", "image"]);
const ThemeFontStyleEnum = z.enum(["default", "serif", "mono"]);

const EventBaseSchema = z.object({
  groupId: BigIntIdString,
  title: z.string().min(1).max(200),
  catchPhrase: z.string().max(300).optional().default(""),
  description: z.string().max(50_000).optional().default(""),
  coverImageUrl: UrlOrEmpty.optional().default(""),
  hashTag: z.string().max(120).optional().default(""),
  eventFormat: EventFormatEnum,
  place: z.string().max(200).optional().default(""),
  address: z.string().max(300).optional().default(""),
  onlineUrl: UrlOrEmpty.optional().default(""),
  startedAt: z.string().min(1),
  endedAt: z.string().min(1),
  acceptsFrom: z.string().optional().default(""),
  acceptsUntil: z.string().optional().default(""),
  capacity: z.number().int().min(0).max(100_000).optional(),
  recruitmentMethod: RecruitmentEnum,
  approvalRequired: z.string().optional().default(""),
  lotteryAnnounceAt: z.string().optional().default(""),
  status: z.enum(["draft", "published"]).optional().default("draft"),
  themeTintColor: HexColorOrEmpty.optional().default(""),
  themeBackgroundStyle: ThemeBackgroundStyleEnum.optional(),
  themeFontStyle: ThemeFontStyleEnum.optional(),
  themeReset: z.string().optional().default(""),
});

/* ============================================================
 * 共通ヘルパー
 * ============================================================ */

async function nextEventId(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
): Promise<bigint> {
  return nextId(tx, "event");
}

async function nextEventRoleId(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
): Promise<bigint> {
  return nextId(tx, "eventRole");
}

/** owner / admin の判定 (グループ単位) */
async function isGroupAdmin(
  groupId: bigint,
  userId: bigint,
): Promise<boolean> {
  const row = await prisma.groupAdmin.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  return !!row && (row.role === "owner" || row.role === "admin");
}

type EventRolePricing = "free" | "on_site" | "prepaid" | "donation";

type EventRoleInput = {
  name: string;
  capacity?: number;
  pricingType: EventRolePricing;
  price: number;
  /** 販売開始日時 (null = 即時販売) */
  saleStartsAt: Date | null;
  /** 販売終了日時 (null = イベント受付終了まで) */
  saleEndsAt: Date | null;
  /** 招待コード限定枠のコード (null = 制限なし) */
  unlockCode: string | null;
  /** pricingType=donation のときの最低寄付額 (null = 0 円扱い) */
  donationMinAmount: number | null;
};

const PRICING_VALUES = ["free", "on_site", "prepaid", "donation"] as const;

/**
 * form から i 番目の EventRole 入力 1 行を読み出す。
 * 枠名が空なら null (= 無効な行としてスキップ)。
 * 販売期間の逆転や不正な招待コードは ActionError で弾く。
 */
function parseRoleRow(form: FormData, i: number): EventRoleInput | null {
  const name = formValue(form, `eventRole[${i}].name`);
  if (!name) return null;
  const capRaw = formValue(form, `eventRole[${i}].capacity`);
  const capacity = capRaw === "" ? undefined : Number(capRaw);
  const priceRaw = formValue(form, `eventRole[${i}].price`);
  const price = priceRaw === "" ? 0 : Number(priceRaw);
  const pricingRaw = formValue(form, `eventRole[${i}].pricingType`);
  const pricing = (PRICING_VALUES as readonly string[]).includes(pricingRaw)
    ? (pricingRaw as EventRolePricing)
    : "free";
  const parsed = EventRoleInputSchema.safeParse({
    name,
    capacity:
      capacity != null && Number.isFinite(capacity) ? capacity : undefined,
    pricingType: pricing,
    price: Number.isFinite(price) ? price : 0,
  });
  if (!parsed.success) return null;

  // ---- 販売期間 (Early Bird 等) ----
  const saleStartsAt = parseDateTimeLocal(
    formValue(form, `eventRole[${i}].saleStartsAt`),
  );
  const saleEndsAt = parseDateTimeLocal(
    formValue(form, `eventRole[${i}].saleEndsAt`),
  );
  if (saleStartsAt && saleEndsAt && saleEndsAt <= saleStartsAt) {
    throw new ActionError(
      "invalid_input",
      `参加枠「${name}」の販売終了日時は販売開始日時より後にしてください`,
    );
  }

  // ---- Unlock Code (招待コード限定枠) ----
  const unlockRaw = formValue(form, `eventRole[${i}].unlockCode`).trim();
  if (unlockRaw.length > 64) {
    throw new ActionError(
      "invalid_input",
      `参加枠「${name}」の招待コードは 64 文字以内で入力してください`,
    );
  }
  const unlockCode = unlockRaw || null;

  // ---- Donation (寄付型) の最低寄付額 ----
  const donationRaw = formValue(form, `eventRole[${i}].donationMinAmount`);
  const donationNum = donationRaw === "" ? NaN : Number(donationRaw);
  const donationMinAmount =
    parsed.data.pricingType === "donation" &&
    Number.isFinite(donationNum) &&
    donationNum >= 0 &&
    donationNum <= 10_000_000
      ? Math.floor(donationNum)
      : null;

  return {
    ...parsed.data,
    saleStartsAt,
    saleEndsAt,
    unlockCode,
    donationMinAmount,
  };
}

/** form から 5 件分の EventRole 入力を読み出す */
function parseRoles(form: FormData): EventRoleInput[] {
  const out: EventRoleInput[] = [];
  for (let i = 0; i < 5; i++) {
    const row = parseRoleRow(form, i);
    if (row) out.push(row);
  }
  if (out.length === 0) {
    // フォールバック: 一般 (定員/料金は親 capacity に従う)
    out.push({
      name: "一般",
      pricingType: "free",
      price: 0,
      saleStartsAt: null,
      saleEndsAt: null,
      unlockCode: null,
      donationMinAmount: null,
    });
  }
  return out;
}

/* ============================================================
 * イベントタグ (Tag / EventTag)
 * ============================================================ */

/**
 * カンマ区切りのタグ入力をパースする。
 *
 * - 半角カンマ / 全角読点の両方を区切りとして受け付ける
 * - 前後空白除去・空要素除去・大文字小文字を無視した重複除去
 * - 1 件 50 文字まで、最大 10 件
 */
function parseTagsInput(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[,、]/)) {
    const name = part.trim();
    if (!name || name.length > 50) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
    if (out.length >= 10) break;
  }
  return out;
}

/**
 * Tag.slug の生成 (seed.ts の生成規則を踏襲しつつ日本語も許容)。
 * 記号・空白は `-` に落とし、全て潰れた場合は hex fallback で一意性を確保する。
 */
function tagSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `tag-${Buffer.from(name, "utf8").toString("hex").slice(0, 24)}`;
}

/**
 * イベントとタグ名リストの紐付けを同期する (トランザクション内で呼ぶ)。
 *
 * - 未知のタグ名は Tag を新規作成 (slug 衝突時は suffix を付与)
 * - mode="create": EventTag を単純追加 (新規イベント用)
 * - mode="replace": 既存 EventTag との差分を取り、外れたタグは削除
 * - Tag.usageCount は EventTag 作成時 increment / 削除時 decrement
 *   (duplicateEvent と同じ規約, data-model review Critical #5)
 */
async function syncEventTags(
  tx: Tx2,
  eventId: bigint,
  tagNames: string[],
  mode: "create" | "replace",
): Promise<void> {
  // タグ名 → Tag.id を解決 (無ければ作成)
  const tagIds: bigint[] = [];
  for (const name of tagNames) {
    let tag = await tx.tag.findUnique({ where: { name } });
    if (!tag) {
      let slug = tagSlug(name);
      const slugTaken = await tx.tag.findUnique({ where: { slug } });
      const id = await nextId(tx, "tag");
      if (slugTaken) slug = `${slug}-${id.toString()}`;
      tag = await tx.tag.create({
        data: { id, name, slug, usageCount: 0 },
      });
    }
    tagIds.push(tag.id);
  }

  const wanted = new Set(tagIds.map((id) => id.toString()));

  if (mode === "replace") {
    const existing = await tx.eventTag.findMany({ where: { eventId } });
    const existingIds = new Set(existing.map((e) => e.tagId.toString()));
    // 外れたタグを削除
    for (const et of existing) {
      if (!wanted.has(et.tagId.toString())) {
        await tx.eventTag.delete({
          where: { eventId_tagId: { eventId, tagId: et.tagId } },
        });
        await tx.tag.update({
          where: { id: et.tagId },
          data: { usageCount: { decrement: 1 } },
        });
      }
    }
    // 増えたタグを追加
    for (const tid of tagIds) {
      if (!existingIds.has(tid.toString())) {
        await tx.eventTag.create({ data: { eventId, tagId: tid } });
        await tx.tag.update({
          where: { id: tid },
          data: { usageCount: { increment: 1 } },
        });
      }
    }
    return;
  }

  // mode === "create": 新規イベントなので単純追加
  for (const tid of tagIds) {
    await tx.eventTag.create({ data: { eventId, tagId: tid } });
    await tx.tag.update({
      where: { id: tid },
      data: { usageCount: { increment: 1 } },
    });
  }
}

/* ============================================================
 * createEvent
 * ============================================================ */

export async function createEvent(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/event/create")}`);
  }

  // ---- レート制限 (user 単位: 5 回/時) ----
  try {
    assertRateLimit(
      `user:${user.id}:createEvent`,
      RATE_LIMITS.createResource,
    );
  } catch (e) {
    if (e instanceof RateLimitError) {
      throw new ActionError("rate_limited", e.message);
    }
    throw e;
  }

  const parsed = EventBaseSchema.safeParse({
    groupId: formValue(formData, "groupId"),
    title: formValue(formData, "title"),
    catchPhrase: formValue(formData, "catchPhrase"),
    description: formValueRaw(formData, "description"),
    coverImageUrl: formValue(formData, "coverImageUrl"),
    hashTag: formValue(formData, "hashTag"),
    eventFormat: formValue(formData, "eventFormat") || "offline",
    place: formValue(formData, "place"),
    address: formValue(formData, "address"),
    onlineUrl: formValue(formData, "onlineUrl"),
    startedAt: formValue(formData, "startedAt"),
    endedAt: formValue(formData, "endedAt"),
    acceptsFrom: formValue(formData, "acceptsFrom"),
    acceptsUntil: formValue(formData, "acceptsUntil"),
    capacity: formInt(formData, "capacity"),
    recruitmentMethod: formValue(formData, "recruitmentMethod") || "fcfs",
    lotteryAnnounceAt: formValue(formData, "lotteryAnnounceAt"),
    status: (formValue(formData, "status") || "draft") as "draft" | "published",
  });
  if (!parsed.success) {
    throw new ActionError(
      "invalid_input",
      parsed.error.issues[0]?.message ?? "入力内容が不正です",
    );
  }
  const data = parsed.data;
  const groupId = BigInt(data.groupId);

  // group 権限
  if (!(await isGroupAdmin(groupId, user.id))) {
    throw new ActionError("forbidden", "グループ管理者権限が必要です");
  }

  const startedAt = parseDateTimeLocal(data.startedAt);
  const endedAt = parseDateTimeLocal(data.endedAt);
  if (!startedAt || !endedAt) {
    throw new ActionError("invalid_input", "日時の形式が不正です");
  }
  if (endedAt <= startedAt) {
    throw new ActionError(
      "invalid_input",
      "終了日時は開始日時より後にしてください",
    );
  }

  const acceptsFrom = parseDateTimeLocal(data.acceptsFrom);
  const acceptsUntil = parseDateTimeLocal(data.acceptsUntil);
  const lotteryAnnounceAt = parseDateTimeLocal(data.lotteryAnnounceAt);

  const roles = parseRoles(formData);
  const tagNames = parseTagsInput(formValue(formData, "tags"));

  let newEventId: bigint = BigInt(0);
  const finalStatus = data.status === "published" ? "published" : "draft";
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const eventId = await nextEventId(tx);
    newEventId = eventId;
    await tx.event.create({
      data: {
        id: eventId,
        groupId,
        title: data.title,
        catchPhrase: data.catchPhrase || null,
        description: data.description || null,
        coverImageUrl: data.coverImageUrl || null,
        hashTag: data.hashTag || null,
        eventType: "participation",
        eventFormat: data.eventFormat,
        startedAt,
        endedAt,
        acceptsFrom,
        acceptsUntil,
        place: data.place || null,
        address: data.address || null,
        onlineUrl: data.onlineUrl || null,
        capacity: data.capacity ?? null,
        visibility: finalStatus === "published" ? "public" : "draft",
        status: finalStatus,
        recruitmentMethod: data.recruitmentMethod,
        lotteryAnnounceAt,
        ownerId: user.id,
        ownerDisplayName: user.displayName,
        publishedAt: finalStatus === "published" ? now : null,
      },
    });

    for (let i = 0; i < roles.length; i++) {
      const r = roles[i]!;
      await tx.eventRole.create({
        data: {
          id: await nextEventRoleId(tx),
          eventId,
          displayOrder: i + 1,
          name: r.name,
          capacity: r.capacity ?? null,
          recruitmentMethod: data.recruitmentMethod,
          pricingType: r.pricingType,
          price: r.price,
          currency: "JPY",
          saleStartsAt: r.saleStartsAt,
          saleEndsAt: r.saleEndsAt,
          unlockCode: r.unlockCode,
          donationMinAmount: r.donationMinAmount,
        },
      });
    }

    // タグ紐付け (入力タグを Tag に upsert して EventTag を作成)
    if (tagNames.length > 0) {
      await syncEventTags(tx, eventId, tagNames, "create");
    }

    // group.eventCount は status=published のみカウント (draft はカウント外)。
    // publishEvent でも increment するので、ここでは published で作成された場合のみ +1。
    if (finalStatus === "published") {
      await tx.group.update({
        where: { id: groupId },
        data: { eventCount: { increment: 1 } },
      });
    }
  });

  // 監査ログ
  void recordAudit({
    actorUserId: user.id,
    action: "event.create",
    targetType: "Event",
    targetId: newEventId,
    metadata: { groupId: groupId.toString(), status: finalStatus },
  });

  revalidatePath("/dashboard");
  revalidatePath("/explore");
  revalidatePath(`/event/${newEventId.toString()}`);
  redirect(`/event/${newEventId.toString()}`);
}

/* ============================================================
 * updateEvent
 * ============================================================ */

export async function updateEvent(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/dashboard")}`);
  }

  const eventIdRaw = formValue(formData, "eventId");
  if (!/^\d+$/.test(eventIdRaw))
    throw new ActionError("invalid_input", "イベント ID が不正です");
  const eventId = BigInt(eventIdRaw);

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new ActionError("not_found", "イベントが見つかりません");

  const isOwner = event.ownerId === user.id;
  const groupAdmin = await isGroupAdmin(event.groupId, user.id);
  if (!isOwner && !groupAdmin) {
    throw new ActionError("forbidden", "このイベントを編集する権限がありません");
  }

  const parsed = EventBaseSchema.safeParse({
    groupId: event.groupId.toString(),
    title: formValue(formData, "title"),
    catchPhrase: formValue(formData, "catchPhrase"),
    description: formValueRaw(formData, "description"),
    coverImageUrl: formValue(formData, "coverImageUrl"),
    hashTag: formValue(formData, "hashTag"),
    eventFormat: formValue(formData, "eventFormat") || event.eventFormat,
    place: formValue(formData, "place"),
    address: formValue(formData, "address"),
    onlineUrl: formValue(formData, "onlineUrl"),
    startedAt: formValue(formData, "startedAt"),
    endedAt: formValue(formData, "endedAt"),
    acceptsFrom: formValue(formData, "acceptsFrom"),
    acceptsUntil: formValue(formData, "acceptsUntil"),
    capacity: formInt(formData, "capacity"),
    recruitmentMethod:
      formValue(formData, "recruitmentMethod") || event.recruitmentMethod,
    approvalRequired: formValue(formData, "approvalRequired"),
    lotteryAnnounceAt: formValue(formData, "lotteryAnnounceAt"),
    status: (formValue(formData, "status") || event.status) as
      | "draft"
      | "published",
    themeTintColor: formValue(formData, "themeTintColor"),
    themeBackgroundStyle: ((): "solid" | "gradient" | "image" | undefined => {
      const v = formValue(formData, "themeBackgroundStyle");
      return v === "solid" || v === "gradient" || v === "image"
        ? v
        : undefined;
    })(),
    themeFontStyle: ((): "default" | "serif" | "mono" | undefined => {
      const v = formValue(formData, "themeFontStyle");
      return v === "default" || v === "serif" || v === "mono" ? v : undefined;
    })(),
    themeReset: formValue(formData, "themeReset"),
  });
  if (!parsed.success) {
    throw new Error(
      `invalid_input: ${parsed.error.issues[0]?.message ?? "unknown"}`,
    );
  }
  const data = parsed.data;

  const startedAt = parseDateTimeLocal(data.startedAt);
  const endedAt = parseDateTimeLocal(data.endedAt);
  if (!startedAt || !endedAt) throw new Error("invalid_dates");
  if (endedAt <= startedAt) throw new Error("ended_at_must_be_after_started_at");

  // テーマ設定の解決
  // - themeReset === "1" なら全フィールドを null に戻す
  // - そうでなければ tintColor が空文字なら null、指定なしならフィールド更新しない
  const themeReset = data.themeReset === "1";
  const themeUpdate: {
    themeTintColor?: string | null;
    themeBackgroundStyle?: string | null;
    themeFontStyle?: string | null;
  } = {};
  if (themeReset) {
    themeUpdate.themeTintColor = null;
    themeUpdate.themeBackgroundStyle = null;
    themeUpdate.themeFontStyle = null;
  } else {
    if (data.themeTintColor !== undefined) {
      themeUpdate.themeTintColor = data.themeTintColor || null;
    }
    if (data.themeBackgroundStyle !== undefined) {
      themeUpdate.themeBackgroundStyle = data.themeBackgroundStyle;
    }
    if (data.themeFontStyle !== undefined) {
      themeUpdate.themeFontStyle =
        data.themeFontStyle === "default" ? null : data.themeFontStyle;
    }
  }

  await prisma.event.update({
    where: { id: eventId },
    data: {
      title: data.title,
      catchPhrase: data.catchPhrase || null,
      description: data.description || null,
      coverImageUrl: data.coverImageUrl || null,
      hashTag: data.hashTag || null,
      eventFormat: data.eventFormat,
      place: data.place || null,
      address: data.address || null,
      onlineUrl: data.onlineUrl || null,
      startedAt,
      endedAt,
      acceptsFrom: parseDateTimeLocal(data.acceptsFrom),
      acceptsUntil: parseDateTimeLocal(data.acceptsUntil),
      capacity: data.capacity ?? null,
      recruitmentMethod: data.recruitmentMethod,
      approvalRequired: data.approvalRequired === "1",
      lotteryAnnounceAt: parseDateTimeLocal(data.lotteryAnnounceAt),
      ...themeUpdate,
    },
  });

  // ---- 参加枠 (EventRole) の設定更新 ----
  // form に eventRole[i].id が含まれる場合のみ、該当枠の販売設定
  // (name / capacity / pricingType / price / saleStartsAt / saleEndsAt /
  //  unlockCode / donationMinAmount) を更新する。
  // 旧フォーム / 既存テストはこれらのキーを送らないため、その場合は
  // 参加枠を一切変更しない (後方互換)。枠の削除は行わない (参加者が参照するため)。
  const roleUpdates: { id: bigint; input: EventRoleInput }[] = [];
  for (let i = 0; i < 10; i++) {
    const idRaw = formValue(formData, `eventRole[${i}].id`);
    if (!/^\d+$/.test(idRaw)) continue;
    const input = parseRoleRow(formData, i);
    if (!input) continue; // 枠名が空の行はスキップ (変更しない)
    roleUpdates.push({ id: BigInt(idRaw), input });
  }
  if (roleUpdates.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const { id, input } of roleUpdates) {
        const role = await tx.eventRole.findUnique({ where: { id } });
        // 他イベントの枠 id が紛れ込んでいた場合は無視 (認可済み event のみ更新)
        if (!role || role.eventId !== eventId) continue;
        await tx.eventRole.update({
          where: { id },
          data: {
            name: input.name,
            capacity: input.capacity ?? null,
            pricingType: input.pricingType,
            price: input.price,
            saleStartsAt: input.saleStartsAt,
            saleEndsAt: input.saleEndsAt,
            unlockCode: input.unlockCode,
            donationMinAmount: input.donationMinAmount,
          },
        });
      }
    });
  }

  // タグ同期: form に tags フィールドが存在する場合のみ差分反映する。
  // (旧フォーム / 既存テストは tags を送らないため、その場合はタグを変更しない)
  if (formData.has("tags")) {
    const tagNames = parseTagsInput(formValue(formData, "tags"));
    await prisma.$transaction(async (tx) => {
      await syncEventTags(tx, eventId, tagNames, "replace");
    });
    revalidatePath("/explore");
  }

  // 監査ログ
  void recordAudit({
    actorUserId: user.id,
    action: "event.update",
    targetType: "Event",
    targetId: eventId,
  });

  revalidatePath(`/event/${eventId.toString()}`);
  revalidatePath(`/event/${eventId.toString()}/edit`);
  revalidatePath("/dashboard");

  redirect(`/event/${eventId.toString()}`);
}

/* ============================================================
 * publishEvent
 * ============================================================ */

export async function publishEvent(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/dashboard")}`);
  }
  const eventIdRaw = formValue(formData, "eventId");
  if (!/^\d+$/.test(eventIdRaw)) throw new Error("invalid_event_id");
  const eventId = BigInt(eventIdRaw);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { group: true },
  });
  if (!event) throw new Error("event_not_found");

  const isOwner = event.ownerId === user.id;
  const groupAdmin = await isGroupAdmin(event.groupId, user.id);
  if (!isOwner && !groupAdmin) throw new Error("forbidden");

  const wasAlreadyPublished = event.status === "published";

  await prisma.$transaction(async (tx) => {
    await tx.event.update({
      where: { id: eventId },
      data: {
        status: "published",
        visibility: "public",
        publishedAt: event.publishedAt ?? new Date(),
      },
    });
    // Group.eventCount は status=published のみカウント (createEvent と整合)。
    // 初回公開のみ increment。draft -> published 切り替え時にも 1 度だけ +1 する。
    if (!wasAlreadyPublished) {
      await tx.group.update({
        where: { id: event.groupId },
        data: { eventCount: { increment: 1 } },
      });
    }
  });

  // Slack 通知: 初回公開時のみ。Group.slackWebhookUrl 未設定なら no-op。
  if (!wasAlreadyPublished) {
    await notifyEventPublished({
      webhookUrl: event.group.slackWebhookUrl,
      eventId: eventId.toString(),
      title: event.title,
      groupName: event.group.name,
      startedAt: event.startedAt,
    });
  }

  // グループメンバーへの新着イベント通知 (event_published): 初回公開時のみ。
  // - GroupMember.receiveAnnouncement=false / 退会済 (leftAt) / 公開者本人は対象外
  // - NotificationPreference (event_published × in_app/email) を尊重
  // - 冪等性: 同一 (recipientUserId, eventId, kind) の既存行があればスキップ
  // - 通知処理の失敗は公開処理自体を止めない (握りつぶしてログ)
  if (!wasAlreadyPublished) {
    try {
      const members = await prisma.groupMember.findMany({
        where: {
          groupId: event.groupId,
          leftAt: null,
          receiveAnnouncement: true,
          userId: { not: user.id },
        },
        select: {
          userId: true,
          user: { select: { email: true, status: true } },
        },
      });
      const recipients = members
        .filter((m) => m.user.status === "active")
        .map((m) => ({ userId: m.userId, email: m.user.email }));
      const eventUrl = `${resolveBaseUrl()}/event/${eventId.toString()}`;
      const mail = buildGroupMessageMailContent({
        groupName: event.group.name,
        subject: `新着イベント: ${event.title}`,
        body: [
          `${event.group.name} の新しいイベントが公開されました。`,
          "",
          `イベント名: ${event.title}`,
          `開催日時: ${formatEventDateJst(event.startedAt)}`,
        ].join("\n"),
        url: eventUrl,
      });
      const result = await fanoutNotifications({
        kind: "event_published",
        eventId,
        groupId: event.groupId,
        recipients,
        payload: { eventTitle: event.title, groupName: event.group.name },
        dedupeByEvent: true,
        buildMail: () => mail,
      });
      logger.info(
        {
          action: "event.publish.notify-members",
          eventId: eventId.toString(),
          ...result,
        },
        "event published notifications dispatched",
      );
    } catch (e) {
      logger.warn(
        {
          eventId: eventId.toString(),
          err: e instanceof Error ? e.message : String(e),
        },
        "event published member notification failed",
      );
    }
  }

  // 監査ログ
  void recordAudit({
    actorUserId: user.id,
    action: "event.publish",
    targetType: "Event",
    targetId: eventId,
    metadata: { firstPublish: !wasAlreadyPublished },
  });

  revalidatePath(`/event/${eventId.toString()}`);
  revalidatePath("/dashboard");
  revalidatePath("/explore");
  redirect(`/event/${eventId.toString()}`);
}

/* ============================================================
 * cancelEvent
 * ============================================================ */

export async function cancelEvent(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/dashboard")}`);
  }
  const eventIdRaw = formValue(formData, "eventId");
  if (!/^\d+$/.test(eventIdRaw)) throw new Error("invalid_event_id");
  const eventId = BigInt(eventIdRaw);

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("event_not_found");

  const isOwner = event.ownerId === user.id;
  const groupAdmin = await isGroupAdmin(event.groupId, user.id);
  if (!isOwner && !groupAdmin) throw new Error("forbidden");

  // status=published で計上していた eventCount を巻き戻す。
  // 既に cancelled なら no-op (同じ動作を何度走らせても安全)。
  const wasPublished = event.status === "published";
  await prisma.$transaction(async (tx) => {
    await tx.event.update({
      where: { id: eventId },
      data: { status: "cancelled" },
    });
    if (wasPublished) {
      await tx.group.update({
        where: { id: event.groupId },
        data: { eventCount: { decrement: 1 } },
      });
    }
  });

  // 参加者 (accepted + waiting) への中止通知 (event_cancelled)。
  // - NotificationPreference (event_cancelled × in_app/email) を尊重
  // - 冪等性: 同一 (recipientUserId, eventId, kind) の既存行があればスキップ
  //   (既に cancelled の event を再中止しても二重送信されない)
  // - form の `reason` (任意, 500 文字まで) があればメール / payload に含める
  // - 通知処理の失敗は中止処理自体を止めない (commit 済のため握りつぶしてログ)
  const cancelReason = formValue(formData, "reason").trim().slice(0, 500);
  try {
    const participants = await prisma.participant.findMany({
      where: { eventId, status: { in: ["accepted", "waiting"] } },
      select: {
        userId: true,
        user: { select: { email: true, status: true } },
      },
    });
    const recipients = participants
      .filter((p) => p.user.status === "active")
      .map((p) => ({ userId: p.userId, email: p.user.email }));
    const eventUrl = `${resolveBaseUrl()}/event/${eventId.toString()}`;
    const mail = buildEventCancelledMailContent({
      eventTitle: event.title,
      reason: cancelReason || undefined,
      eventUrl,
    });
    const result = await fanoutNotifications({
      kind: "event_cancelled",
      eventId,
      recipients,
      payload: {
        eventTitle: event.title,
        ...(cancelReason ? { reason: cancelReason } : {}),
      },
      dedupeByEvent: true,
      buildMail: () => mail,
    });
    logger.info(
      {
        action: "event.cancel.notify-participants",
        eventId: eventId.toString(),
        ...result,
      },
      "event cancelled notifications dispatched",
    );
  } catch (e) {
    logger.warn(
      {
        eventId: eventId.toString(),
        err: e instanceof Error ? e.message : String(e),
      },
      "event cancelled participant notification failed",
    );
  }

  // 有料参加者への自動返金 (イベント中止時)。
  // - 支払い済み (succeeded / partially_refunded) の Payment を持つ参加者を全額返金。
  // - refundPayment 内部で認可 (owner/GroupAdmin) と冪等 (残額 0 はスキップ) を担保。
  // - Stripe 未設定 (現地払い) 時は DB のみ更新。個別失敗は握りつぶしてログ。
  try {
    const paidParticipants = await prisma.participant.findMany({
      where: {
        eventId,
        payment: { is: { status: { in: ["succeeded", "partially_refunded"] } } },
      },
      select: { id: true },
    });
    for (const p of paidParticipants) {
      try {
        await refundPayment(p.id.toString(), {
          reason: cancelReason
            ? `イベント中止による自動返金: ${cancelReason}`
            : "イベント中止による自動返金",
        });
      } catch (e) {
        logger.warn(
          {
            eventId: eventId.toString(),
            participantId: p.id.toString(),
            err: e instanceof Error ? e.message : String(e),
          },
          "event cancel auto-refund failed for participant",
        );
      }
    }
  } catch (e) {
    logger.warn(
      {
        eventId: eventId.toString(),
        err: e instanceof Error ? e.message : String(e),
      },
      "event cancel auto-refund lookup failed",
    );
  }

  // 監査ログ
  void recordAudit({
    actorUserId: user.id,
    action: "event.cancel",
    targetType: "Event",
    targetId: eventId,
  });

  revalidatePath(`/event/${eventId.toString()}`);
  revalidatePath("/dashboard");
  redirect(`/event/${eventId.toString()}`);
}

/* ============================================================
 * 主催者ダッシュボード追加 Action 群
 *
 * - updateParticipantRole : 参加者の枠を変更
 * - removeParticipant     : 参加者を主催者強制で除外
 * - sendBlast             : 一斉メッセージ (Message 1 件 + Notification 多数)
 * - duplicateEvent        : イベントを draft で複製
 *
 * いずれも認可は `(event.ownerId === self) || GroupAdmin` を要求。
 * BigInt id 採番は既存ヘルパーと同じ `_max + 1` 方式 (seed.ts / event-actions と
 * 互換)。Notification の作成は in_app チャネル固定。実 SMTP 送信はモック
 * (console.log で代替)。
 * ============================================================ */

type Tx2 = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function nextNotificationId(tx: Tx2): Promise<bigint> {
  return nextId(tx, "notification");
}

async function nextMessageId(tx: Tx2): Promise<bigint> {
  return nextId(tx, "message");
}

/** event.ownerId === userId or GroupAdmin owner/admin */
async function canManageEvent(
  eventOwnerId: bigint,
  eventGroupId: bigint,
  userId: bigint,
): Promise<boolean> {
  if (eventOwnerId === userId) return true;
  return await isGroupAdmin(eventGroupId, userId);
}

/* ---------- updateParticipantRole ---------- */

export async function updateParticipantRole(
  formData: FormData,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/dashboard")}`);
  }
  const eventIdRaw = formValue(formData, "eventId");
  const participantIdRaw = formValue(formData, "participantId");
  const newRoleIdRaw = formValue(formData, "eventRoleId");
  if (
    !/^\d+$/.test(eventIdRaw) ||
    !/^\d+$/.test(participantIdRaw) ||
    !/^\d+$/.test(newRoleIdRaw)
  ) {
    throw new Error("invalid_input");
  }
  const eventId = BigInt(eventIdRaw);
  const participantId = BigInt(participantIdRaw);
  const newRoleId = BigInt(newRoleIdRaw);

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("event_not_found");
  if (!(await canManageEvent(event.ownerId, event.groupId, user.id))) {
    throw new Error("forbidden");
  }

  const role = await prisma.eventRole.findUnique({ where: { id: newRoleId } });
  if (!role || role.eventId !== eventId) {
    throw new Error("role_not_found");
  }
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
  });
  if (!participant || participant.eventId !== eventId) {
    throw new Error("participant_not_found");
  }

  await prisma.participant.update({
    where: { id: participantId },
    data: { eventRoleId: newRoleId },
  });

  revalidatePath(`/event/${eventIdRaw}/admin`);
  revalidatePath(`/event/${eventIdRaw}/admin/guests`);
}

/* ---------- removeParticipant ---------- */

export async function removeParticipant(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/dashboard")}`);
  }
  const eventIdRaw = formValue(formData, "eventId");
  const participantIdRaw = formValue(formData, "participantId");
  if (!/^\d+$/.test(eventIdRaw) || !/^\d+$/.test(participantIdRaw)) {
    throw new Error("invalid_input");
  }
  const eventId = BigInt(eventIdRaw);
  const participantId = BigInt(participantIdRaw);

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("event_not_found");
  if (!(await canManageEvent(event.ownerId, event.groupId, user.id))) {
    throw new Error("forbidden");
  }
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
  });
  if (!participant || participant.eventId !== eventId) {
    throw new Error("participant_not_found");
  }

  // 「削除」= status=cancelled に倒す。物理削除はしない (履歴保持)。
  await prisma.$transaction(async (tx) => {
    await tx.participant.update({
      where: { id: participantId },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
        waitingPosition: null,
      },
    });
    const accepted = await tx.participant.count({
      where: { eventId, status: "accepted" },
    });
    const waiting = await tx.participant.count({
      where: { eventId, status: "waiting" },
    });
    await tx.event.update({
      where: { id: eventId },
      data: { acceptedCount: accepted, waitingCount: waiting },
    });
  });

  revalidatePath(`/event/${eventIdRaw}/admin`);
  revalidatePath(`/event/${eventIdRaw}/admin/guests`);
}

/* ---------- sendBlast ---------- */

const BlastAudienceEnum = z.enum(["accepted", "waiting", "cancelled", "all"]);

export async function sendBlast(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/dashboard")}`);
  }
  const eventIdRaw = formValue(formData, "eventId");
  if (!/^\d+$/.test(eventIdRaw)) throw new Error("invalid_event_id");
  const eventId = BigInt(eventIdRaw);

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("event_not_found");
  if (!(await canManageEvent(event.ownerId, event.groupId, user.id))) {
    throw new Error("forbidden");
  }

  const subject = formValue(formData, "subject");
  const body = formValueRaw(formData, "body");
  const audienceRaw = formValue(formData, "audience");

  if (!subject || subject.length > 200) throw new Error("invalid_subject");
  if (!body || body.length > 20_000) throw new Error("invalid_body");
  const audienceParsed = BlastAudienceEnum.safeParse(audienceRaw);
  if (!audienceParsed.success) throw new Error("invalid_audience");
  const audience = audienceParsed.data;

  // 対象参加者の status
  const targetStatuses =
    audience === "all"
      ? ["accepted", "waiting", "cancelled", "pending", "attended", "no_show"]
      : audience === "accepted"
        ? ["accepted", "attended", "no_show"]
        : audience === "waiting"
          ? ["waiting", "pending"]
          : ["cancelled"];

  const recipients = await prisma.participant.findMany({
    where: { eventId, status: { in: targetStatuses } },
    select: { userId: true },
  });
  const uniqueRecipientIds = Array.from(
    new Set(recipients.map((r) => r.userId.toString())),
  ).map((s) => BigInt(s));

  // 実 SMTP 送信用に、ユニーク化したユーザーの email を引く
  const recipientUsers = uniqueRecipientIds.length
    ? await prisma.user.findMany({
        where: { id: { in: uniqueRecipientIds } },
        select: { email: true },
      })
    : [];

  await prisma.$transaction(async (tx) => {
    const messageId = await nextMessageId(tx);
    await tx.message.create({
      data: {
        id: messageId,
        eventId,
        groupId: event.groupId,
        senderUserId: user.id,
        audience,
        subject,
        body,
        recipientCount: uniqueRecipientIds.length,
        sentAt: new Date(),
      },
    });

    // N+1 解消 (data-model review Critical #4):
    // 受信者ごとに `notification.aggregate({_max:{id}})` + `notification.create` を
    // ループしていたのを、ループ外で 1 度だけ MAX(id) を取得 → メモリ上で連番を振り
    // 直し → createMany で 1 SQL に集約する。
    if (uniqueRecipientIds.length > 0) {
      const baseId = await nextNotificationId(tx);
      const payload = JSON.stringify({
        messageId: messageId.toString(),
        subject,
        audience,
      });
      const rows = uniqueRecipientIds.map((uid, i) => ({
        id: baseId + BigInt(i),
        recipientUserId: uid,
        kind: "host_blast",
        eventId,
        payload,
        channel: "in_app",
      }));
      await tx.notification.createMany({ data: rows });
    }
  });

  // SMTP / Resend / SendGrid いずれかへ送信。未設定なら sendMail 内で console フォールバック
  logger.info(
    {
      action: "event.blast",
      eventId: eventIdRaw,
      audience,
      recipients: uniqueRecipientIds.length,
      subject,
    },
    "blast queued",
  );
  // body を簡易 HTML 化 (改行を <br/> に)
  const htmlBody = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
  // Promise.all で並列送信。失敗しても sendMail 内部で吸収するので throw しない。
  const sendResults = await Promise.all(
    recipientUsers.map((u) =>
      sendMail({
        to: u.email,
        subject,
        text: body,
        html: `<div>${htmlBody}</div>`,
      }),
    ),
  );
  const provider = getMailProvider();
  let delivered = 0;
  for (const r of sendResults) if (r.delivered) delivered += 1;
  incrementCounter(
    METRIC_NAMES.MAIL_SENT_TOTAL,
    { provider, delivered: "true" },
    delivered,
  );
  if (sendResults.length - delivered > 0) {
    incrementCounter(
      METRIC_NAMES.MAIL_SENT_TOTAL,
      { provider, delivered: "false" },
      sendResults.length - delivered,
    );
  }

  // 監査ログ
  void recordAudit({
    actorUserId: user.id,
    action: "event.send-blast",
    targetType: "Event",
    targetId: eventId,
    metadata: { audience, recipientCount: uniqueRecipientIds.length },
  });

  revalidatePath(`/event/${eventIdRaw}/admin/blasts`);
  revalidatePath(`/event/${eventIdRaw}/admin`);
  redirect(`/event/${eventIdRaw}/admin/blasts?sent=1`);
}

/* ---------- sendDirectMessage ----------
 *
 * 主催者から個別参加者への 1:1 メッセージ送信。
 *
 * 既存 `sendBlast` (全体宛て) に対して、対象 1 名にしか飛ばさない軽量バージョン。
 * `Message.audience = "direct"` で記録し、受信者の通知センター
 * (`Notification.kind = "host_direct_message"`) にもエントリを追加する。
 *
 * 認可: 送信者は (event.ownerId === self) OR GroupAdmin。受信者は同 event の participant
 *       (status は問わない) であること。
 */

export async function sendDirectMessage(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/dashboard")}`);
  }
  const eventIdRaw = formValue(formData, "eventId");
  const participantIdRaw = formValue(formData, "participantId");
  const subject = formValue(formData, "subject");
  const body = formValueRaw(formData, "body");

  if (!/^\d+$/.test(eventIdRaw)) {
    throw new ActionError("invalid_input", "イベント ID が不正です");
  }
  if (!/^\d+$/.test(participantIdRaw)) {
    throw new ActionError("invalid_input", "参加者 ID が不正です");
  }
  if (!subject || subject.length > 200) {
    throw new ActionError(
      "invalid_input",
      "件名は 200 文字以内で入力してください",
    );
  }
  if (!body || body.length > 20_000) {
    throw new ActionError(
      "invalid_input",
      "本文は 20000 文字以内で入力してください",
    );
  }
  const eventId = BigInt(eventIdRaw);
  const participantId = BigInt(participantIdRaw);

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new ActionError("not_found", "イベントが見つかりません");
  if (!(await canManageEvent(event.ownerId, event.groupId, user.id))) {
    throw new ActionError("forbidden", "送信権限がありません");
  }

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: { user: true },
  });
  if (!participant || participant.eventId !== eventId) {
    throw new ActionError("not_found", "参加者が見つかりません");
  }

  await prisma.$transaction(async (tx) => {
    const messageId = await nextMessageId(tx);
    await tx.message.create({
      data: {
        id: messageId,
        eventId,
        groupId: event.groupId,
        senderUserId: user.id,
        audience: "direct",
        subject,
        body,
        recipientCount: 1,
        sentAt: new Date(),
      },
    });
    const notifId = await nextNotificationId(tx);
    await tx.notification.create({
      data: {
        id: notifId,
        recipientUserId: participant.userId,
        kind: "host_direct_message",
        eventId,
        payload: JSON.stringify({
          messageId: messageId.toString(),
          subject,
          excerpt: body.slice(0, 80),
        }),
        channel: "in_app",
      },
    });
  });

  // SMTP 送信 (失敗は無視 — sendMail 内部で吸収)
  await sendMail({
    to: participant.user.email,
    subject,
    text: body,
    html: `<div>${body
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>")}</div>`,
  });

  revalidatePath(`/event/${eventIdRaw}/admin/guests`);
  redirect(
    `/event/${eventIdRaw}/admin/guests?toast=direct-message-sent`,
  );
}

/* ---------- duplicateEvent ----------
 *
 * P2 拡張: 複製時のオプションをモーダルで細かく指定できるよう拡張。
 *
 * FormData で受け取るフィールド (boolean は `"1"` のみ true):
 *   - eventId              : 必須
 *   - includeTags          : "1" → true (default true, 旧フォーム互換)
 *   - includeRoles         : "1" → true (default true, 旧フォーム互換)
 *   - includeSurvey        : "1" → true (default false)
 *   - includePresentations : "1" → true (default false)
 *   - shiftDays            : 整数 (default 7)
 *
 * 互換性: 旧 form (eventId のみ送信) は `includeTags=true`, `includeRoles=true`,
 * `shiftDays=7` のデフォルトで動作する。
 */

const DUPLICATE_OPTION_KEYS = [
  "includeTags",
  "includeRoles",
  "includeSurvey",
  "includePresentations",
  "shiftDays",
] as const;

function hasAnyDuplicateOptionKey(form: FormData): boolean {
  for (const k of DUPLICATE_OPTION_KEYS) {
    if (form.has(k)) return true;
  }
  return false;
}

export async function duplicateEvent(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/dashboard")}`);
  }
  const eventIdRaw = formValue(formData, "eventId");
  if (!/^\d+$/.test(eventIdRaw)) throw new Error("invalid_event_id");
  const eventId = BigInt(eventIdRaw);

  const source = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      roles: { orderBy: { displayOrder: "asc" } },
      tags: true,
      surveys: { include: { questions: true } },
      presentations: true,
    },
  });
  if (!source) throw new Error("event_not_found");
  if (!(await canManageEvent(source.ownerId, source.groupId, user.id))) {
    throw new Error("forbidden");
  }

  // フォームからオプションを読み出す
  const explicitOpts = hasAnyDuplicateOptionKey(formData);
  const includeTags = explicitOpts
    ? formValue(formData, "includeTags") === "1"
    : true;
  const includeRoles = explicitOpts
    ? formValue(formData, "includeRoles") === "1"
    : true;
  const includeSurvey = formValue(formData, "includeSurvey") === "1";
  const includePresentations =
    formValue(formData, "includePresentations") === "1";
  const shiftDays = (() => {
    const raw = formValue(formData, "shiftDays");
    if (!raw) return 7;
    const n = Number(raw);
    if (!Number.isFinite(n)) return 7;
    // -3650 .. 3650 日に丸める (約10年)
    return Math.max(-3650, Math.min(3650, Math.floor(n)));
  })();

  // 開催日時を shiftDays 先 (or 前) にシフトしてコピー
  const dayMs = 24 * 60 * 60 * 1000;
  const shiftMs = shiftDays * dayMs;
  const newStartedAt = new Date(source.startedAt.getTime() + shiftMs);
  const newEndedAt = new Date(source.endedAt.getTime() + shiftMs);
  const newAcceptsFrom = source.acceptsFrom
    ? new Date(source.acceptsFrom.getTime() + shiftMs)
    : null;
  const newAcceptsUntil = source.acceptsUntil
    ? new Date(source.acceptsUntil.getTime() + shiftMs)
    : null;
  const newLotteryAnnounceAt = source.lotteryAnnounceAt
    ? new Date(source.lotteryAnnounceAt.getTime() + shiftMs)
    : null;

  let newId: bigint = BigInt(0);
  await prisma.$transaction(async (tx) => {
    const eid = await nextEventId(tx);
    newId = eid;
    await tx.event.create({
      data: {
        id: eid,
        groupId: source.groupId,
        title: `${source.title} (複製)`,
        catchPhrase: source.catchPhrase,
        description: source.description,
        coverImageUrl: source.coverImageUrl,
        hashTag: source.hashTag,
        eventType: source.eventType,
        eventFormat: source.eventFormat,
        startedAt: newStartedAt,
        endedAt: newEndedAt,
        acceptsFrom: newAcceptsFrom,
        acceptsUntil: newAcceptsUntil,
        place: source.place,
        address: source.address,
        lat: source.lat,
        lon: source.lon,
        onlineUrl: source.onlineUrl,
        capacity: source.capacity,
        visibility: "draft",
        status: "draft",
        recruitmentMethod: source.recruitmentMethod,
        lotteryAnnounceAt: newLotteryAnnounceAt,
        ownerId: user.id,
        ownerDisplayName: user.displayName,
        themeTintColor: source.themeTintColor,
        themeBackgroundStyle: source.themeBackgroundStyle,
        themeFontStyle: source.themeFontStyle,
        publishedAt: null,
      },
    });
    if (includeRoles) {
      for (let i = 0; i < source.roles.length; i++) {
        const r = source.roles[i]!;
        await tx.eventRole.create({
          data: {
            id: await nextEventRoleId(tx),
            eventId: eid,
            displayOrder: r.displayOrder,
            name: r.name,
            description: r.description,
            capacity: r.capacity,
            recruitmentMethod: r.recruitmentMethod,
            pricingType: r.pricingType,
            price: r.price,
            currency: r.currency,
            autoPromoteFromWaiting: r.autoPromoteFromWaiting,
            visibleAfterFull: r.visibleAfterFull,
            // 販売期間は開催日時と同様に shiftDays 分シフトしてコピー
            saleStartsAt: r.saleStartsAt
              ? new Date(r.saleStartsAt.getTime() + shiftMs)
              : null,
            saleEndsAt: r.saleEndsAt
              ? new Date(r.saleEndsAt.getTime() + shiftMs)
              : null,
            unlockCode: r.unlockCode,
            donationMinAmount: r.donationMinAmount,
          },
        });
      }
    } else {
      // ロールを複製しない場合でも最低 1 件 (「一般」) を作成し
      // Event の公開時の整合性を担保する
      await tx.eventRole.create({
        data: {
          id: await nextEventRoleId(tx),
          eventId: eid,
          displayOrder: 1,
          name: "一般",
          capacity: source.capacity ?? null,
          recruitmentMethod: source.recruitmentMethod,
          pricingType: "free",
          price: 0,
          currency: "JPY",
        },
      });
    }
    if (includeTags) {
      for (const t of source.tags) {
        await tx.eventTag.create({
          data: {
            eventId: eid,
            tagId: t.tagId,
          },
        });
        // Tag.usageCount は EventTag 作成時に increment、削除時に decrement する。
        // (data-model review Critical #5)
        await tx.tag.update({
          where: { id: t.tagId },
          data: { usageCount: { increment: 1 } },
        });
      }
    }

    if (includeSurvey) {
      for (const s of source.surveys) {
        const surveyId = await nextId(tx, "survey");
        await tx.survey.create({
          data: {
            id: surveyId,
            eventId: eid,
            title: s.title,
            trigger: s.trigger,
            required: s.required,
          },
        });
        for (const q of s.questions) {
          await tx.surveyQuestion.create({
            data: {
              id: await nextId(tx, "surveyQuestion"),
              surveyId,
              displayOrder: q.displayOrder,
              body: q.body,
              inputType: q.inputType,
              options: q.options,
              required: q.required,
            },
          });
        }
      }
    }

    if (includePresentations) {
      for (const p of source.presentations) {
        await tx.presentationMaterial.create({
          data: {
            id: await nextId(tx, "presentationMaterial"),
            eventId: eid,
            presenterUserId: p.presenterUserId,
            presenterDisplayName: p.presenterDisplayName,
            title: p.title,
            url: p.url,
            thumbnailUrl: p.thumbnailUrl,
            displayOrder: p.displayOrder,
          },
        });
      }
    }
    // 複製イベントは draft で作るため Group.eventCount は increment しない
    // (publishEvent 経由で初回公開時に +1 する)。
  });

  // 監査ログ
  void recordAudit({
    actorUserId: user.id,
    action: "event.duplicate",
    targetType: "Event",
    targetId: newId,
    metadata: { sourceEventId: eventId.toString() },
  });

  revalidatePath(`/event/${eventIdRaw}/admin/more`);
  revalidatePath("/dashboard");
  redirect(`/event/${newId.toString()}/edit`);
}

