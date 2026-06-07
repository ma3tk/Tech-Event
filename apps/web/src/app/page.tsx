/**
 * トップページ (Server Component)。connpass 本家の 2 カラム構成に寄せた版。
 *
 * - 圧縮ヒーロー (1段、見出し28px、検索ボックスは横長スリム)
 * - メイン本体は 2 カラム (main:right = 2:1)
 *   - メイン: おすすめグループ + 新着イベント + グループ別の新着 + タグから探す
 *   - 右サイドバー: 会員登録CTA / 最近見たイベント / イベントカレンダー / 人気のタグ
 * - 3ステップ説明セクションは削除 (本家トップに無いため)
 */
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import EventListRow from "@/components/EventListRow";
import TagPill from "@/components/TagPill";
import SearchBox from "@/components/SearchBox";
import MiniCalendar from "@/components/MiniCalendar";
import RecentlyViewedEvents from "@/components/RecentlyViewedEvents";

import { prisma } from "@/lib/prisma";
import { safeJsonLd } from "@/lib/markdown";
import { toEventCardData } from "@/lib/event-card";
import { toGroupCardData } from "@/lib/group-card";
import { loadDict, t } from "@/lib/i18n";
import {
  BASE_URL,
  DEFAULT_LOCALE,
  SITE_NAME,
  absoluteUrl,
} from "@/lib/seo";

const HOME_TITLE = `${SITE_NAME} - エンジニアをつなぐIT勉強会支援プラットフォーム`;
const HOME_DESCRIPTION =
  "tech-event はIT勉強会・カンファレンスの告知、参加申込、コミュニティ運営をワンストップで支援するプラットフォームです。";

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: absoluteUrl("/"),
    siteName: SITE_NAME,
    locale: DEFAULT_LOCALE,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
};

// トップ用 JSON-LD: WebSite + SearchAction (検索ボックスサジェスト)
const HOME_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: BASE_URL,
  description: HOME_DESCRIPTION,
  inLanguage: "ja",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/explore?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

/** 新着イベント: publishedAt 降順 8 件 */
async function fetchRecentEvents() {
  const rows = await prisma.event.findMany({
    where: {
      status: "published",
      visibility: "public",
      publishedAt: { not: null },
    },
    orderBy: { publishedAt: "desc" },
    take: 8,
    include: {
      group: true,
      tags: { include: { tag: true } },
    },
  });
  return rows.map((e) => toEventCardData(e));
}

/** おすすめグループ: memberCount 降順 8 件 (ロゴ並び用) */
async function fetchRecommendedGroups() {
  const rows = await prisma.group.findMany({
    where: { status: "active" },
    orderBy: { memberCount: "desc" },
    take: 8,
  });
  return rows.map(toGroupCardData);
}

/** 人気のカレンダー: subscriberCount 降順 4 件 (Luma 風キュレーション) */
async function fetchPopularCalendars() {
  const rows = await prisma.calendar.findMany({
    where: { status: "active" },
    orderBy: { subscriberCount: "desc" },
    take: 4,
  });
  return rows.map((c) => ({
    id: c.id.toString(),
    slug: c.slug,
    name: c.name,
    description: c.description,
    tintColor: c.tintColor,
    subscriberCount: c.subscriberCount,
    eventCount: c.eventCount,
  }));
}

/** グループ別の新着: 直近 publishedAt があるグループから 1 件ずつ抜粋 */
async function fetchGroupHighlights() {
  const rows = await prisma.event.findMany({
    where: {
      status: "published",
      visibility: "public",
      publishedAt: { not: null },
    },
    orderBy: { publishedAt: "desc" },
    take: 30,
    include: {
      group: true,
      tags: { include: { tag: true } },
    },
  });
  const seen = new Set<string>();
  const picked: typeof rows = [];
  for (const e of rows) {
    const gid = e.group.id.toString();
    if (seen.has(gid)) continue;
    seen.add(gid);
    picked.push(e);
    if (picked.length >= 6) break;
  }
  return picked.map((e) => toEventCardData(e));
}

/** 人気のタグ: usageCount 降順 (右サイド/フッタ両方で使う) */
async function fetchPopularTags(take: number) {
  const rows = await prisma.tag.findMany({
    orderBy: { usageCount: "desc" },
    take,
  });
  return rows.map((t) => ({
    id: t.id.toString(),
    name: t.name,
    slug: t.slug,
    usageCount: t.usageCount,
  }));
}

/** 今月の開催日セット (YYYY-MM-DD) */
async function fetchUpcomingEventDates(): Promise<Set<string>> {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  const rows = await prisma.event.findMany({
    where: {
      status: "published",
      visibility: "public",
      startedAt: { gte: firstOfMonth, lte: lastOfNextMonth },
    },
    select: { startedAt: true },
  });
  const set = new Set<string>();
  for (const r of rows) {
    const d = r.startedAt;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    set.add(`${y}-${m}-${day}`);
  }
  return set;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ hero?: string }>;
}) {
  // CLAUDE.md §1.1: 既存ヒーローを ?hero=classic で保持。デフォルトは Luma 寄り。
  const params = (await searchParams) ?? {};
  const heroMode: "luma" | "classic" = params.hero === "classic" ? "classic" : "luma";

  const [
    recent,
    groups,
    groupHighlights,
    tagsSidebar,
    tagsFooter,
    eventDates,
    popularCalendars,
  ] = await Promise.all([
    fetchRecentEvents(),
    fetchRecommendedGroups(),
    fetchGroupHighlights(),
    fetchPopularTags(10),
    fetchPopularTags(20),
    fetchUpcomingEventDates(),
    fetchPopularCalendars(),
  ]);

  const { dict, locale } = await loadDict();

  // sessionStorage が空のときに見せるサンプル (新着直近 3 件)
  const recentlyViewedFallback = recent.slice(0, 3).map((e) => ({
    id: e.id,
    title: e.title,
    href: e.href ?? `/event/${e.id}`,
    startedAt: e.startedAt,
  }));

  return (
    <div className="flex w-full flex-1 flex-col">
      {/* JSON-LD: WebSite + SearchAction */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(HOME_JSON_LD) }}
      />
      {/* ============ Hero (Luma 寄り or classic 圧縮版) ============
       *
       * デフォルトは Luma 風 (purple-50 -> orange-50 -> pink-50 グラデ、
       * 見出し 36-44px、検索ボックス大きめ rounded-2xl + shadow-soft)。
       * `?hero=classic` で従来の圧縮ヒーローにフォールバック。
       */}
      {heroMode === "classic" ? (
        <section
          data-testid="home-hero"
          data-hero-variant="classic"
          className="bg-gradient-to-b from-brand-orange-soft to-background"
        >
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-5 sm:py-6">
            <h1 className="text-center text-[22px] font-bold leading-tight tracking-tight text-foreground sm:text-[26px] md:text-[28px]">
              エンジニアをつなぐ IT勉強会支援プラットフォーム
            </h1>
            <p className="text-center text-xs text-muted-foreground sm:text-sm">
              勉強会・カンファレンスを探して、ワンクリックで申し込み。
            </p>
            <div className="w-full max-w-2xl">
              <SearchBox
                variant="header"
                action="/explore"
                placeholder="キーワードでイベントを検索"
                className="!max-w-none"
              />
            </div>
          </div>
        </section>
      ) : (
        <section
          data-testid="home-hero"
          data-hero-variant="luma"
          // Luma 風 上下グラデ: purple-50 → orange-50 → pink-50。
          // accent-purple-soft / brand-orange-soft / accent-pink-soft は
          // 各 theme で AA 互換の淡色にマッピング済み。
          className="relative overflow-hidden bg-gradient-to-b from-accent-purple-soft via-brand-orange-soft to-accent-pink-soft"
        >
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 px-4 py-10 sm:py-14 md:py-16">
            <h1 className="text-center text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-[40px] md:text-[44px]">
              エンジニアをつなぐ
              <br className="sm:hidden" />
              IT勉強会支援プラットフォーム
            </h1>
            <p className="max-w-xl text-center text-sm text-muted-foreground sm:text-base">
              勉強会・カンファレンスを探して、ワンクリックで申し込み。
              <br className="hidden sm:block" />
              主催者は数分でイベント募集ページを公開できます。
            </p>
            {/* Luma 風 検索ボックス: rounded-2xl + shadow-soft + 余裕のあるパディング */}
            <div className="w-full max-w-2xl rounded-2xl bg-surface p-2 shadow-soft-lg ring-1 ring-border">
              <SearchBox
                variant="header"
                action="/explore"
                placeholder="キーワード / グループ / タグでイベントを検索"
                className="!max-w-none"
              />
            </div>
            {popularCalendars.length > 0 && (
              <p className="text-xs text-muted-foreground">
                人気のカレンダーを下にスクロール ↓
              </p>
            )}
          </div>
        </section>
      )}

      {/* ============ Discover への CTA バナー ============
       * Luma 風の「興味から発見する」エクスペリエンスへの導線。
       * ヒーロー直下に大きめに配置し、Explore (フィルタ型) と Discover (発見型) の
       * 両入口を一目で見せる。
       */}
      <section
        aria-label="Discover の紹介"
        className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:py-6">
          <div className="flex items-start gap-3">
            <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur sm:inline-flex">
              {/* lucide の Sparkles を直接 SVG で描画 (Client Component を増やさないため) */}
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                <path d="M5 3v4" />
                <path d="M19 17v4" />
                <path d="M3 5h4" />
                <path d="M17 19h4" />
              </svg>
            </span>
            <div>
              <p className="text-base font-bold sm:text-lg">
                興味のあるテックイベントを発見しよう
              </p>
              <p className="text-xs text-white/90 sm:text-sm">
                AI / Web / モバイル / セキュリティ / DevOps / データ分析。
                カテゴリ・都市・カレンダーから探す新しい体験。
              </p>
            </div>
          </div>
          <Link
            href="/discover"
            data-testid="home-discover-cta"
            className="inline-flex h-10 shrink-0 items-center rounded-full bg-white px-5 text-sm font-semibold text-violet-700 shadow-sm hover:bg-violet-50"
          >
            Discover を見る →
          </Link>
        </div>
      </section>

      {/* ============ メイン (2カラム main:right = 2:1) ============ */}
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          {/* ============ メインカラム ============ */}
          <div className="flex min-w-0 flex-col gap-8">
            {/* ----- おすすめグループ (ロゴ8件横並び) ----- */}
            <section aria-labelledby="rec-groups-heading">
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <h2
                  id="rec-groups-heading"
                  className="text-base font-bold text-foreground sm:text-lg"
                >
                  おすすめグループ
                </h2>
                <Link
                  href="/explore/groups"
                  className="shrink-0 text-xs font-semibold text-link hover:underline"
                >
                  もっと見る →
                </Link>
              </div>
              {groups.length === 0 ? (
                <EmptyState message="グループはまだありません。" />
              ) : (
                <ul className="grid grid-cols-4 gap-2 sm:grid-cols-8 sm:gap-3">
                  {groups.map((g) => (
                    <li key={g.id}>
                      <Link
                        href={g.url ?? `/group/${g.id}`}
                        className="flex flex-col items-center gap-1 rounded-md border border-border bg-surface p-2 text-center transition-colors hover:bg-brand-orange-soft/40"
                      >
                        <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded border border-border bg-surface">
                          {g.logoUrl ? (
                            <Image
                              src={g.logoUrl}
                              alt=""
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-bold text-brand-orange">
                              {g.name.slice(0, 1)}
                            </span>
                          )}
                        </span>
                        <span className="line-clamp-2 text-[11px] font-medium text-foreground">
                          {g.name}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ----- 人気のカレンダー (Luma 風 Calendar 概念) ----- */}
            {popularCalendars.length > 0 && (
              <section aria-labelledby="popular-calendars-heading">
                <div className="mb-3 flex items-baseline justify-between gap-4">
                  <h2
                    id="popular-calendars-heading"
                    className="text-base font-bold text-foreground sm:text-lg"
                  >
                    人気のカレンダー
                  </h2>
                  <Link
                    href="/calendars"
                    className="shrink-0 text-xs font-semibold text-link hover:underline"
                  >
                    もっと見る →
                  </Link>
                </div>
                <ul
                  data-testid="home-popular-calendars"
                  // Luma 風: 大判 cover (16:9) + rounded-2xl + shadow-soft。
                  // classic モードでも互換: 4 列まで自動で詰まる。
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                  {popularCalendars.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/calendar/${c.slug}`}
                        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-soft-md transition-[transform,box-shadow] duration-normal ease-out hover:-translate-y-1 hover:shadow-soft-lg"
                      >
                        <div
                          // 大判 cover (Luma 風): aspect 16:9 + gradient で柔らかさ
                          className="relative flex aspect-video items-center justify-center text-3xl font-bold text-white"
                          style={{
                            background: `linear-gradient(135deg, ${c.tintColor ?? "#5b21b6"} 0%, ${c.tintColor ?? "#5b21b6"}cc 100%)`,
                          }}
                          aria-hidden="true"
                        >
                          <span className="drop-shadow-sm transition-transform duration-normal ease-out group-hover:scale-110">
                            {c.name.slice(0, 1)}
                          </span>
                        </div>
                        <div className="flex flex-1 flex-col p-4">
                          <span className="line-clamp-2 text-sm font-semibold text-foreground sm:text-base">
                            {c.name}
                          </span>
                          <span className="mt-auto pt-2 text-[11px] text-muted-foreground">
                            購読 {new Intl.NumberFormat(locale === "en" ? "en-US" : "ja-JP").format(c.subscriberCount)} ・
                            イベント {new Intl.NumberFormat(locale === "en" ? "en-US" : "ja-JP").format(c.eventCount)}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* ----- 新着イベント ----- */}
            <section aria-labelledby="recent-heading">
              <div className="mb-2 flex items-baseline justify-between gap-4">
                <div>
                  <h2
                    id="recent-heading"
                    data-testid="home-new-events-heading"
                    className="text-lg font-bold text-foreground sm:text-xl"
                  >
                    {t(dict, "top.newEvents")}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    最近公開されたばかりのイベント
                  </p>
                </div>
                <Link
                  href="/explore?order=new"
                  className="shrink-0 text-xs font-semibold text-link hover:underline"
                >
                  もっと見る →
                </Link>
              </div>
              {recent.length === 0 ? (
                <EmptyState message="新着イベントはまだありません。" />
              ) : (
                <ul className="divide-y divide-border rounded-md border border-border bg-surface">
                  {recent.map((event) => (
                    <li key={event.id}>
                      <EventListRow event={event} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ----- グループ別の新着 (コンパクト) ----- */}
            {groupHighlights.length > 0 && (
              <section aria-labelledby="group-highlights-heading">
                <div className="mb-2 flex items-baseline justify-between gap-4">
                  <h2
                    id="group-highlights-heading"
                    className="text-base font-bold text-foreground sm:text-lg"
                  >
                    グループ別の新着
                  </h2>
                  <Link
                    href="/explore/groups"
                    className="shrink-0 text-xs font-semibold text-link hover:underline"
                  >
                    もっと見る →
                  </Link>
                </div>
                <ul className="divide-y divide-border rounded-md border border-border bg-surface">
                  {groupHighlights.map((event) => (
                    <li key={event.id}>
                      <EventListRow event={event} compact />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* ----- タグから探す (フッタ寄り、全タグ) ----- */}
            <section aria-labelledby="tags-heading" className="rounded-md border border-border bg-surface p-4">
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <h2
                  id="tags-heading"
                  className="text-base font-bold text-foreground sm:text-lg"
                >
                  タグから探す
                </h2>
                <p className="text-xs text-muted-foreground">
                  よく使われている技術タグ
                </p>
              </div>
              {tagsFooter.length === 0 ? (
                <EmptyState message="タグはまだ登録されていません。" />
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {tagsFooter.map((t) => (
                    <li key={t.id}>
                      <TagPill
                        label={t.name}
                        href={`/explore?tag=${encodeURIComponent(t.slug)}`}
                        count={t.usageCount}
                        size="sm"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* ============ 右サイドバー ============ */}
          <aside
            aria-label="サイドバー"
            className="flex w-full flex-col gap-4 lg:sticky lg:top-4 lg:self-start"
          >
            {/* ----- 会員登録 CTA (赤系背景) ----- */}
            <section
              aria-labelledby="signup-cta-heading"
              className="rounded-md border border-brand-red bg-brand-red-soft p-4"
            >
              <h3
                id="signup-cta-heading"
                className="text-sm font-bold text-brand-red-hover"
              >
                会員登録
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-foreground">
                tech-event は無料で会員登録できます。イベント参加・主催の
                どちらにも便利です。
              </p>
              <Link
                href="/signup"
                className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-md bg-brand-red px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-red-hover"
              >
                新規会員登録 (無料)
              </Link>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                すでに会員の方は
                <Link
                  href="/login"
                  className="ml-1 font-semibold text-link underline underline-offset-2 hover:no-underline"
                >
                  ログイン
                </Link>
              </p>
            </section>

            {/* ----- 最近見たイベント (Client Component) ----- */}
            <RecentlyViewedEvents fallback={recentlyViewedFallback} />

            {/* ----- イベントカレンダー (今月) ----- */}
            <MiniCalendar eventDates={eventDates} />

            {/* ----- 人気のタグ (Top10) ----- */}
            <section
              aria-labelledby="popular-tags-heading"
              className="rounded-md border border-border bg-surface p-4"
            >
              <h3
                id="popular-tags-heading"
                className="mb-2 text-sm font-bold text-foreground"
              >
                人気のタグ
              </h3>
              {tagsSidebar.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  タグがありません。
                </p>
              ) : (
                <ul className="flex flex-wrap gap-1.5">
                  {tagsSidebar.map((t) => (
                    <li key={t.id}>
                      <TagPill
                        label={t.name}
                        href={`/explore?tag=${encodeURIComponent(t.slug)}`}
                        size="sm"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * 内部 UI ヘルパー
 * ============================================================ */

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-dashed border-border bg-surface p-6 text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}
