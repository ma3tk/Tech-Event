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
import { recordAudit } from "@/lib/audit";
import { isReservedSlug } from "@/lib/reserved-words";
import { assertRateLimit, RATE_LIMITS, RateLimitError } from "@/lib/rate-limit";
import { getString as formValue, getStringRaw as formValueRaw } from "@/lib/form-data";
import { SlugSchema, UrlOrEmpty, HexColorOrEmpty } from "@/lib/schemas";

/* ============================================================
 * 入力ヘルパー
 * ============================================================ */

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

  // ---- レート制限 (user 単位: 5 回/時) ----
  try {
    assertRateLimit(
      `user:${user.id}:createCalendar`,
      RATE_LIMITS.createResource,
    );
  } catch (e) {
    if (e instanceof RateLimitError) {
      redirectWithError(
        "/calendar/create",
        formData,
        "rate_limited",
        e.message,
      );
    }
    throw e;
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

  // 予約語チェック (システムパス衝突 / フィッシング対策)
  if (isReservedSlug(data.slug)) {
    redirectWithError(
      "/calendar/create",
      formData,
      "slug_reserved",
      `slug "${data.slug}" は予約語のため使用できません`,
    );
  }

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

  // 監査ログ
  void recordAudit({
    actorUserId: user.id,
    action: "calendar.create",
    targetType: "Calendar",
    targetId: BigInt(0),
    metadata: { slug: createdSlug ?? data.slug },
  });

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

  // 監査ログ
  void recordAudit({
    actorUserId: user.id,
    action: "calendar.subscribe",
    targetType: "Calendar",
    targetId: cal.id,
  });

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

  // フォームで任意の名前 / 説明文を渡せる (空ならデフォルト)
  const name = formValue(formData, "name") || "気になるイベント";
  const description =
    formValueRaw(formData, "description") ||
    "自分のブックマークから一括作成したカレンダー";

  // P2 拡張: 個別選択した eventIds が送られていれば、その部分集合のみ使う。
  // 未送信なら従来通り「自分の Bookmark 全件」を取り込む (旧 UI 互換)。
  const selectedRaw = formData.getAll("eventIds");
  const selected = selectedRaw
    .filter((v): v is string => typeof v === "string")
    .filter((v) => /^\d+$/.test(v))
    .map((v) => BigInt(v));

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: user.id },
    select: { eventId: true },
    orderBy: { createdAt: "desc" },
  });
  // 自分のブックマークと交差させる (任意の eventId を勝手に追加できないようにする)
  const ownEventIds = new Set(bookmarks.map((b) => b.eventId.toString()));
  const eventIds: bigint[] =
    selected.length > 0
      ? selected.filter((id) => ownEventIds.has(id.toString()))
      : bookmarks.map((b) => b.eventId);

  // 既存 calendar slug が指定された場合は「既存 calendar に追加」モードに切り替える。
  const existingSlugRaw = formValue(formData, "existingCalendarSlug");
  if (existingSlugRaw) {
    const existing = await prisma.calendar.findUnique({
      where: { slug: existingSlugRaw },
      select: { id: true, slug: true, ownerUserId: true },
    });
    if (!existing || existing.ownerUserId !== user.id) {
      // 不正な slug や他人の calendar への混入を防ぐ
      redirect(`/bookmarks?toast=calendar-add-forbidden`);
    } else {
      let added = 0;
      if (eventIds.length > 0) {
        await prisma.$transaction(async (tx) => {
          for (const eid of eventIds) {
            const exists = await tx.calendarEvent.findUnique({
              where: {
                calendarId_eventId: {
                  calendarId: existing.id,
                  eventId: eid,
                },
              },
              select: { calendarId: true },
            });
            if (exists) continue;
            await tx.calendarEvent.create({
              data: { calendarId: existing.id, eventId: eid },
            });
            added++;
          }
          if (added > 0) {
            await tx.calendar.update({
              where: { id: existing.id },
              data: { eventCount: { increment: added } },
            });
          }
        });
      }
      revalidatePath(`/calendar/${existing.slug}`);
      revalidatePath("/calendars");
      revalidatePath("/bookmarks");
      redirect(`/calendar/${existing.slug}?toast=bookmarks-added`);
    }
  }

  // 新規 calendar 作成
  const baseSlug = `bookmarks-${user.nickname}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const slug = `${baseSlug || "bookmarks"}-${Date.now()}`;

  let createdSlug = slug;
  await prisma.$transaction(async (tx) => {
    const calId = await nextCalendarId(tx);
    await tx.calendar.create({
      data: {
        id: calId,
        slug,
        name,
        description,
        coverImageUrl: null,
        tintColor: null,
        ownerUserId: user.id,
        subscriberCount: 0,
        eventCount: 0,
        status: "active",
      },
    });
    createdSlug = slug;

    if (eventIds.length > 0) {
      await tx.calendarEvent.createMany({
        data: eventIds.map((eid) => ({
          calendarId: calId,
          eventId: eid,
        })),
      });
      await tx.calendar.update({
        where: { id: calId },
        data: { eventCount: eventIds.length },
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
