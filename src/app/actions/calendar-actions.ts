"use server";

/**
 * Calendar (Luma 風キュレーション) の Server Actions。
 *
 * - 認証必須 (未ログインは `/login?next=...` へ)
 * - BigInt @id は既存パターンに合わせ `_max + 1` で採番
 * - 所有者のみ編集 / イベント追加削除可能
 * - subscribe / unsubscribe は誰でも可能 (ログイン必須)
 *
 * Group とは独立 (並列) に運用される軽量モデル。
 *  - Group = 会員制 / event 主催の場
 *  - Calendar = 任意の Event を「束ねて Subscribe させる」キュレーション
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { nextId } from "@/lib/id-gen";
import { buildRedirectUrlWithFormError } from "@/lib/action-error";

/* ============================================================
 * 入力ヘルパー
 * ============================================================ */

function formValue(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function formValueRaw(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
}

const SlugSchema = z
  .string()
  .min(3, "slug は 3 文字以上")
  .max(63, "slug は 63 文字以下")
  .regex(/^[a-z0-9-]+$/, "slug は半角英小文字・数字・ハイフンのみ");

const UrlOrEmpty = z
  .string()
  .max(2000)
  .refine((v) => v === "" || /^https?:\/\//.test(v), "URL は http(s):// で始める");

const HexColorOrEmpty = z
  .string()
  .max(20)
  .refine(
    (v) => v === "" || /^#[0-9a-fA-F]{3,8}$/.test(v),
    "カラーは #RGB / #RRGGBB 形式",
  );

const CalendarBaseSchema = z.object({
  name: z.string().min(1, "name は必須").max(120),
  description: z.string().max(20_000).optional().default(""),
  coverImageUrl: UrlOrEmpty.optional().default(""),
  tintColor: HexColorOrEmpty.optional().default(""),
});

const CreateCalendarSchema = CalendarBaseSchema.extend({
  slug: SlugSchema,
});

const UpdateCalendarSchema = CalendarBaseSchema.extend({
  calendarId: z.string().regex(/^\d+$/),
});

/* ============================================================
 * id 採番ヘルパー
 * ============================================================ */

async function nextCalendarId(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
): Promise<bigint> {
  return nextId(tx, "calendar");
}

async function nextCalendarSubscriptionId(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
): Promise<bigint> {
  return nextId(tx, "calendarSubscription");
}

/* ============================================================
 * エラーリダイレクト
 * ============================================================ */

/** 共通 `buildRedirectUrlWithFormError` (`@/lib/action-error`) を呼び出して redirect。 */
function redirectWithError(
  basePath: string,
  form: FormData,
  errorKey: string,
  errorMessage?: string,
): never {
  redirect(buildRedirectUrlWithFormError(basePath, form, errorKey, errorMessage));
}

/* ============================================================
 * 共通: calendar 取得 + 権限チェック
 * ============================================================ */

async function fetchCalendarBySlugOrId(opts: {
  slug?: string;
  id?: bigint;
}): Promise<{ id: bigint; slug: string; ownerUserId: bigint } | null> {
  if (opts.id !== undefined) {
    return prisma.calendar.findUnique({
      where: { id: opts.id },
      select: { id: true, slug: true, ownerUserId: true },
    });
  }
  if (opts.slug) {
    return prisma.calendar.findUnique({
      where: { slug: opts.slug },
      select: { id: true, slug: true, ownerUserId: true },
    });
  }
  return null;
}

/* ============================================================
 * createCalendar
 * ============================================================ */

export async function createCalendar(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/calendar/create")}`);
  }

  const parsed = CreateCalendarSchema.safeParse({
    slug: formValue(formData, "slug"),
    name: formValue(formData, "name"),
    description: formValueRaw(formData, "description"),
    coverImageUrl: formValue(formData, "coverImageUrl"),
    tintColor: formValue(formData, "tintColor"),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    redirectWithError(
      "/calendar/create",
      formData,
      "invalid_input",
      first?.message ?? "入力が不正です",
    );
  }
  const data = parsed.data;

  const dup = await prisma.calendar.findUnique({
    where: { slug: data.slug },
    select: { id: true },
  });
  if (dup) {
    redirectWithError(
      "/calendar/create",
      formData,
      "slug_taken",
      `slug "${data.slug}" は既に使われています`,
    );
  }

  let createdSlug: string | null = null;
  try {
    await prisma.$transaction(async (tx) => {
      const calId = await nextCalendarId(tx);
      await tx.calendar.create({
        data: {
          id: calId,
          slug: data.slug,
          name: data.name,
          description: data.description || null,
          coverImageUrl: data.coverImageUrl || null,
          tintColor: data.tintColor || null,
          ownerUserId: user.id,
          subscriberCount: 0,
          eventCount: 0,
          status: "active",
        },
      });
      createdSlug = data.slug;
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/UNIQUE|constraint|slug/i.test(msg)) {
      redirectWithError(
        "/calendar/create",
        formData,
        "slug_taken",
        `slug "${data.slug}" は既に使われています`,
      );
    }
    redirectWithError(
      "/calendar/create",
      formData,
      "internal_error",
      "カレンダーの作成に失敗しました",
    );
  }

  revalidatePath("/calendars");
  revalidatePath("/dashboard");
  revalidatePath("/");
  redirect(`/calendar/${createdSlug ?? data.slug}?toast=calendar-created`);
}

/* ============================================================
 * updateCalendar
 * ============================================================ */

export async function updateCalendar(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    const slug = formValue(formData, "slug");
    redirect(
      `/login?next=${encodeURIComponent(
        slug ? `/calendar/${slug}/edit` : "/calendars",
      )}`,
    );
  }

  const parsed = UpdateCalendarSchema.safeParse({
    calendarId: formValueRaw(formData, "calendarId"),
    name: formValue(formData, "name"),
    description: formValueRaw(formData, "description"),
    coverImageUrl: formValue(formData, "coverImageUrl"),
    tintColor: formValue(formData, "tintColor"),
  });
  if (!parsed.success) {
    throw new Error("invalid_input");
  }
  const data = parsed.data;
  const calendarId = BigInt(data.calendarId);

  const cal = await fetchCalendarBySlugOrId({ id: calendarId });
  if (!cal) throw new Error("calendar_not_found");
  if (cal.ownerUserId !== user.id) throw new Error("forbidden");

  await prisma.calendar.update({
    where: { id: calendarId },
    data: {
      name: data.name,
      description: data.description || null,
      coverImageUrl: data.coverImageUrl || null,
      tintColor: data.tintColor || null,
    },
  });

  revalidatePath(`/calendar/${cal.slug}`);
  revalidatePath(`/calendar/${cal.slug}/edit`);
  revalidatePath("/calendars");
  redirect(`/calendar/${cal.slug}`);
}

/* ============================================================
 * subscribe / unsubscribe
 * ============================================================ */

export async function subscribeCalendar(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  const slug = formValue(formData, "slug");
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(slug ? `/calendar/${slug}` : "/calendars")}`,
    );
  }

  const cal = await fetchCalendarBySlugOrId({ slug });
  if (!cal) throw new Error("calendar_not_found");

  const existing = await prisma.calendarSubscription.findUnique({
    where: { calendarId_userId: { calendarId: cal.id, userId: user.id } },
    select: { id: true },
  });
  if (!existing) {
    await prisma.$transaction(async (tx) => {
      const subId = await nextCalendarSubscriptionId(tx);
      await tx.calendarSubscription.create({
        data: {
          id: subId,
          calendarId: cal.id,
          userId: user.id,
        },
      });
      await tx.calendar.update({
        where: { id: cal.id },
        data: { subscriberCount: { increment: 1 } },
      });
    });
  }

  revalidatePath(`/calendar/${cal.slug}`);
  revalidatePath("/calendars");
  revalidatePath("/");
  redirect(`/calendar/${cal.slug}`);
}

export async function unsubscribeCalendar(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  const slug = formValue(formData, "slug");
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(slug ? `/calendar/${slug}` : "/calendars")}`,
    );
  }

  const cal = await fetchCalendarBySlugOrId({ slug });
  if (!cal) throw new Error("calendar_not_found");

  const existing = await prisma.calendarSubscription.findUnique({
    where: { calendarId_userId: { calendarId: cal.id, userId: user.id } },
    select: { id: true },
  });
  if (existing) {
    await prisma.$transaction(async (tx) => {
      await tx.calendarSubscription.delete({
        where: { calendarId_userId: { calendarId: cal.id, userId: user.id } },
      });
      await tx.calendar.update({
        where: { id: cal.id },
        data: { subscriberCount: { decrement: 1 } },
      });
    });
  }

  revalidatePath(`/calendar/${cal.slug}`);
  revalidatePath("/calendars");
  revalidatePath("/");
  redirect(`/calendar/${cal.slug}`);
}

/* ============================================================
 * addEventToCalendar / removeEventFromCalendar (所有者のみ)
 * ============================================================ */

const EventIdSchema = z.string().regex(/^\d+$/);

export async function addEventToCalendar(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  const slug = formValue(formData, "slug");
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(
        slug ? `/calendar/${slug}/manage` : "/calendars",
      )}`,
    );
  }

  const cal = await fetchCalendarBySlugOrId({ slug });
  if (!cal) throw new Error("calendar_not_found");
  if (cal.ownerUserId !== user.id) throw new Error("forbidden");

  const eventIdRaw = formValue(formData, "eventId");
  const parsed = EventIdSchema.safeParse(eventIdRaw);
  if (!parsed.success) {
    redirectWithError(
      `/calendar/${cal.slug}/manage`,
      formData,
      "invalid_event_id",
      "イベントIDを正しく入力してください",
    );
  }
  const eventId = BigInt(parsed.data!);

  const ev = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true },
  });
  if (!ev) {
    redirectWithError(
      `/calendar/${cal.slug}/manage`,
      formData,
      "event_not_found",
      "指定したイベントが存在しません",
    );
  }

  const existing = await prisma.calendarEvent.findUnique({
    where: { calendarId_eventId: { calendarId: cal.id, eventId } },
    select: { calendarId: true },
  });
  if (!existing) {
    await prisma.$transaction(async (tx) => {
      await tx.calendarEvent.create({
        data: {
          calendarId: cal.id,
          eventId,
        },
      });
      await tx.calendar.update({
        where: { id: cal.id },
        data: { eventCount: { increment: 1 } },
      });
    });
  }

  revalidatePath(`/calendar/${cal.slug}`);
  revalidatePath(`/calendar/${cal.slug}/manage`);
  redirect(`/calendar/${cal.slug}/manage`);
}

/* ============================================================
 * createCalendarFromBookmarks
 *
 * 自分のブックマーク一覧を「気になる」カレンダーとして一括取り込みする
 * 専用 Action。`/bookmarks` ページの「気になるをカレンダーに追加」ボタンから利用。
 *
 * - 認証必須。未ログインは `/login?next=/bookmarks` へ
 * - 自分の Bookmark を全件取得し、新規 Calendar (slug は自動生成) を作って
 *   一括で CalendarEvent を追加する
 * - 完了後は新カレンダーの詳細ページへリダイレクト
 * ============================================================ */
export async function createCalendarFromBookmarks(
  formData: FormData,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/bookmarks")}`);
  }

  // フォームで任意の名前を渡せる (空ならデフォルト)
  const name = formValue(formData, "name") || "気になるイベント";

  // slug 衝突回避のため `bookmarks-<nickname>-<unix>` を採番
  const baseSlug = `bookmarks-${user.nickname}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const slug = `${baseSlug || "bookmarks"}-${Date.now()}`;

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: user.id },
    select: { eventId: true },
    orderBy: { createdAt: "desc" },
  });

  let createdSlug = slug;
  await prisma.$transaction(async (tx) => {
    const calId = await nextCalendarId(tx);
    await tx.calendar.create({
      data: {
        id: calId,
        slug,
        name,
        description: "自分のブックマークから一括作成したカレンダー",
        coverImageUrl: null,
        tintColor: null,
        ownerUserId: user.id,
        subscriberCount: 0,
        eventCount: 0,
        status: "active",
      },
    });
    createdSlug = slug;

    // CalendarEvent (中間テーブル) は auto id なし: createMany でまとめて追加
    if (bookmarks.length > 0) {
      // skipDuplicates 相当: ユーザー Bookmark なら同一 (calendarId,eventId) は無いはず
      await tx.calendarEvent.createMany({
        data: bookmarks.map((b) => ({
          calendarId: calId,
          eventId: b.eventId,
        })),
      });
      await tx.calendar.update({
        where: { id: calId },
        data: { eventCount: bookmarks.length },
      });
    }
  });

  revalidatePath("/calendars");
  revalidatePath("/bookmarks");
  revalidatePath("/dashboard");
  redirect(`/calendar/${createdSlug}`);
}

export async function removeEventFromCalendar(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  const slug = formValue(formData, "slug");
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(
        slug ? `/calendar/${slug}/manage` : "/calendars",
      )}`,
    );
  }

  const cal = await fetchCalendarBySlugOrId({ slug });
  if (!cal) throw new Error("calendar_not_found");
  if (cal.ownerUserId !== user.id) throw new Error("forbidden");

  const eventIdRaw = formValue(formData, "eventId");
  const parsed = EventIdSchema.safeParse(eventIdRaw);
  if (!parsed.success) {
    redirectWithError(
      `/calendar/${cal.slug}/manage`,
      formData,
      "invalid_event_id",
      "イベントIDを正しく入力してください",
    );
  }
  const eventId = BigInt(parsed.data!);

  const existing = await prisma.calendarEvent.findUnique({
    where: { calendarId_eventId: { calendarId: cal.id, eventId } },
    select: { calendarId: true },
  });
  if (existing) {
    await prisma.$transaction(async (tx) => {
      await tx.calendarEvent.delete({
        where: { calendarId_eventId: { calendarId: cal.id, eventId } },
      });
      await tx.calendar.update({
        where: { id: cal.id },
        data: { eventCount: { decrement: 1 } },
      });
    });
  }

  revalidatePath(`/calendar/${cal.slug}`);
  revalidatePath(`/calendar/${cal.slug}/manage`);
  redirect(`/calendar/${cal.slug}/manage`);
}
