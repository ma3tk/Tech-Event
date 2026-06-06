/**
 * Calendar 詳細ページ (Server Component)
 *
 * URL: `/calendar/{slug}` (例: `/calendar/ai-developers`)
 *
 * 含まれるイベント一覧、購読 / 購読解除ボタン、カバー、購読者数、
 * iCal / RSS リンク、所有者の場合は管理 / 編集リンクを表示する。
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { renderMarkdown } from "@/lib/markdown";
import { Calendar as CalendarIcon, Users, ExternalLink } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  subscribeCalendar,
  unsubscribeCalendar,
} from "@/app/actions/calendar-actions";
import {
  DEFAULT_LOCALE,
  SITE_NAME,
  absoluteUrl,
  truncateDescription,
} from "@/lib/seo";
import { formatEventDateShort, formatNumber, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cal = await prisma.calendar.findUnique({
    where: { slug },
    select: { name: true, description: true, coverImageUrl: true },
  });
  if (!cal) return { title: "カレンダーが見つかりません" };

  const description = truncateDescription(
    cal.description ?? `${cal.name} の購読型カレンダー`,
  );
  const canonical = absoluteUrl(`/calendar/${slug}`);
  return {
    title: cal.name,
    description,
    alternates: {
      canonical,
      types: {
        "application/rss+xml": [
          {
            url: absoluteUrl(`/calendar/${slug}/feed.xml`),
            title: `${cal.name} の新着イベント`,
          },
        ],
      },
    },
    openGraph: {
      title: cal.name,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: DEFAULT_LOCALE,
      type: "website",
      images: cal.coverImageUrl ? [{ url: cal.coverImageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: cal.name,
      description,
      images: cal.coverImageUrl ? [cal.coverImageUrl] : undefined,
    },
  };
}

export default async function CalendarDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const calRow = await prisma.calendar.findUnique({
    where: { slug },
    include: { owner: true },
  });
  if (!calRow || calRow.status !== "active") {
    notFound();
  }

  const currentUser = await getCurrentUser();

  const [calendarEvents, mySub] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: { calendarId: calRow.id },
      orderBy: { event: { startedAt: "asc" } },
      include: {
        event: {
          include: { group: true },
        },
      },
    }),
    currentUser
      ? prisma.calendarSubscription.findUnique({
          where: {
            calendarId_userId: {
              calendarId: calRow.id,
              userId: currentUser.id,
            },
          },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  const now = new Date();
  const upcoming = calendarEvents.filter((ce) => ce.event.endedAt >= now);
  const past = calendarEvents.filter((ce) => ce.event.endedAt < now);

  const isSubscribed = !!mySub;
  const isOwner = currentUser?.id === calRow.ownerUserId;
  const tintColor = calRow.tintColor ?? "#5b21b6";

  const descriptionHtml = renderMarkdown(calRow.description);

  return (
    <div className="flex flex-1 flex-col bg-background">
      {/* ============ カバーヘッダ ============ */}
      <header
        className="relative w-full"
        style={{ backgroundColor: tintColor }}
        data-testid="calendar-header"
      >
        {calRow.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={calRow.coverImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
        ) : null}
        <div className="relative mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-white sm:flex-row sm:items-end">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border-4 border-white bg-white text-3xl font-bold shadow-lg" style={{ color: tintColor }}>
            {calRow.name.slice(0, 1)}
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wider opacity-90">
              Calendar
            </p>
            <h1
              data-testid="calendar-name"
              className="text-3xl font-bold leading-tight drop-shadow-sm"
            >
              {calRow.name}
            </h1>
            <p className="mt-2 text-sm opacity-90">
              主催: {calRow.owner.displayName}
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <span
                data-testid="calendar-subscriber-count"
                className="inline-flex items-center gap-1"
              >
                <Users aria-hidden="true" className="h-4 w-4" />
                購読者 {formatNumber(calRow.subscriberCount)} 人
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarIcon aria-hidden="true" className="h-4 w-4" />
                イベント {formatNumber(calRow.eventCount)} 件
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {isSubscribed ? (
                <form action={unsubscribeCalendar}>
                  <input type="hidden" name="slug" value={calRow.slug} />
                  <button
                    type="submit"
                    data-testid="calendar-unsubscribe-button"
                    className="inline-flex items-center gap-1 rounded-md bg-white/20 px-5 py-2 text-sm font-semibold text-white shadow ring-1 ring-white hover:bg-white/30"
                  >
                    ✓ 購読中 (解除する)
                  </button>
                </form>
              ) : (
                <form action={subscribeCalendar}>
                  <input type="hidden" name="slug" value={calRow.slug} />
                  <button
                    type="submit"
                    data-testid="calendar-subscribe-button"
                    className="inline-flex items-center rounded-md bg-white px-5 py-2 text-sm font-semibold shadow hover:bg-zinc-100"
                    style={{ color: tintColor }}
                  >
                    Subscribe
                  </button>
                </form>
              )}
              <Link
                href={`/calendar/${calRow.slug}/ics`}
                className="inline-flex items-center gap-1 rounded-md bg-white/15 px-3 py-2 text-sm font-medium text-white hover:bg-white/25"
              >
                iCal で取得
              </Link>
              <Link
                href={`/calendar/${calRow.slug}/feed.xml`}
                className="inline-flex items-center gap-1 rounded-md bg-white/15 px-3 py-2 text-sm font-medium text-white hover:bg-white/25"
              >
                RSS
              </Link>
              {isOwner && (
                <>
                  <Link
                    href={`/calendar/${calRow.slug}/manage`}
                    data-testid="calendar-manage-link"
                    className="inline-flex items-center gap-1 rounded-md bg-white/15 px-3 py-2 text-sm font-medium text-white hover:bg-white/25"
                  >
                    イベントを管理
                  </Link>
                  <Link
                    href={`/calendar/${calRow.slug}/edit`}
                    className="inline-flex items-center gap-1 rounded-md bg-white/15 px-3 py-2 text-sm font-medium text-white hover:bg-white/25"
                  >
                    編集
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ============ 本体 (イベント一覧 + 説明) ============ */}
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 lg:flex-row">
        <div className="flex-1 space-y-12">
          <section id="upcoming">
            <h2 className="mb-4 text-xl font-bold">開催予定のイベント</h2>
            {upcoming.length === 0 ? (
              <p className="rounded-md border border-border bg-surface p-6 text-sm text-muted-foreground">
                開催予定のイベントはまだありません。
              </p>
            ) : (
              <ul data-testid="calendar-upcoming-events" className="space-y-3">
                {upcoming.map((ce) => (
                  <li key={ce.event.id.toString()}>
                    <EventRow event={ce.event} tintColor={tintColor} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {past.length > 0 && (
            <section id="past">
              <h2 className="mb-4 text-xl font-bold">過去のイベント</h2>
              <ul className="space-y-3">
                {past.slice(0, 10).map((ce) => (
                  <li key={ce.event.id.toString()}>
                    <EventRow event={ce.event} tintColor={tintColor} isPast />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {descriptionHtml && (
            <section id="about">
              <h2 className="mb-4 text-xl font-bold">このカレンダーについて</h2>
              <article
                className="prose prose-zinc max-w-none rounded-md border border-border bg-surface p-6 text-sm leading-7"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            </section>
          )}
        </div>

        {/* ============ サイドバー ============ */}
        <aside className="w-full shrink-0 space-y-6 lg:w-80">
          <div className="rounded-md border border-border bg-surface p-4">
            <h3 className="mb-3 text-sm font-bold text-foreground">
              このカレンダーを購読
            </h3>
            <p className="text-xs text-muted-foreground">
              購読すると新着イベントの通知や iCal フィードが利用できます
              (購読は無料・ワンクリック)。
            </p>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-1">
                <ExternalLink aria-hidden="true" className="h-3 w-3" />
                <a
                  href={`/calendar/${calRow.slug}/ics`}
                  className="text-link hover:underline"
                >
                  iCal フィード (.ics)
                </a>
              </li>
              <li className="flex items-center gap-1">
                <ExternalLink aria-hidden="true" className="h-3 w-3" />
                <a
                  href={`/calendar/${calRow.slug}/feed.xml`}
                  className="text-link hover:underline"
                >
                  RSS フィード
                </a>
              </li>
            </ul>
          </div>

          <div className="rounded-md border border-border bg-surface p-4">
            <h3 className="mb-2 text-sm font-bold text-foreground">主催者</h3>
            <Link
              href={`/user/${calRow.owner.nickname}`}
              className="flex items-center gap-2"
            >
              {calRow.owner.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={calRow.owner.avatarUrl}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-border-strong font-bold text-white">
                  {calRow.owner.displayName.slice(0, 1)}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">
                  {calRow.owner.displayName}
                </span>
                <span className="block text-xs text-muted-foreground">
                  @{calRow.owner.nickname}
                </span>
              </span>
            </Link>
          </div>
        </aside>
      </main>

      {/* モバイル専用: 画面下部に固定された Subscribe/Unsubscribe バー */}
      {/* ヒーロー内の同等ボタンはデスクトップで完結するが、モバイルではスクロール後に
          見えなくなるため、画面下に固定して常時アクセスできるようにする。 */}
      <div
        data-testid="calendar-mobile-sticky-cta"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] backdrop-blur-sm sm:hidden"
      >
        {isSubscribed ? (
          <form action={unsubscribeCalendar} className="w-full">
            <input type="hidden" name="slug" value={calRow.slug} />
            <button
              type="submit"
              data-testid="calendar-subscribe-button-mobile"
              className="inline-flex h-11 w-full items-center justify-center rounded-md border border-border bg-surface text-sm font-semibold text-foreground shadow-sm"
              style={{ color: tintColor }}
            >
              ✓ 購読中 (解除する)
            </button>
          </form>
        ) : (
          <form action={subscribeCalendar} className="w-full">
            <input type="hidden" name="slug" value={calRow.slug} />
            <button
              type="submit"
              data-testid="calendar-subscribe-button-mobile"
              className="inline-flex h-11 w-full items-center justify-center rounded-md text-sm font-semibold text-white shadow-sm"
              style={{ backgroundColor: tintColor }}
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
      {/* モバイル時、本文の最後に sticky bar の高さ分だけ空白を確保する */}
      <div aria-hidden="true" className="h-16 sm:hidden" />
    </div>
  );
}

function EventRow({
  event,
  tintColor,
  isPast = false,
}: {
  event: {
    id: bigint;
    title: string;
    startedAt: Date;
    endedAt: Date;
    coverImageUrl: string | null;
    place: string | null;
    eventFormat: string;
    capacity: number | null;
    acceptedCount: number;
    status: string;
    group: { name: string; subdomain: string };
  };
  tintColor: string;
  isPast?: boolean;
}) {
  return (
    <Link
      href={`/event/${event.id.toString()}`}
      className="flex gap-4 rounded-md border border-border bg-surface p-4 transition-colors hover:border-brand-orange"
      style={{ borderLeft: `4px solid ${tintColor}` }}
    >
      {event.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.coverImageUrl}
          alt=""
          className="h-20 w-20 shrink-0 rounded-md object-cover"
        />
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-surface-muted text-xs text-muted-foreground">
          No Image
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">
          {formatEventDateShort(event.startedAt.toISOString())} ・{" "}
          <span className="text-link hover:text-link-hover">
            {event.group.name}
          </span>
        </p>
        <h3 className="line-clamp-2 text-base font-semibold text-foreground">
          {event.title}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>
            {event.eventFormat === "online"
              ? "オンライン"
              : truncate(event.place ?? "会場未定", 30)}
          </span>
          {event.capacity != null && (
            <>
              <span>・</span>
              <span>
                {event.acceptedCount}/{event.capacity} 人
              </span>
            </>
          )}
          {isPast && (
            <span className="rounded bg-status-ended-bg px-2 py-0.5 text-status-ended-fg">
              終了
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
