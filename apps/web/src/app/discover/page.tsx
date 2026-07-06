/**
 * Discover ページ (Server Component)
 *
 * Luma `/discover` 風の「興味から発見する」ハブ。既存 `/explore` (フィルタ+リスト型) は
 * そのまま残しつつ、より視覚的・回遊性重視のディスカバリ体験を提供する。
 *
 * Query:
 *   - view = popular | new | trending  (タブ。デフォルト: popular)
 *   - q    = フリーワード (Hero 検索ボックスから送信される。POST 先は /explore)
 *
 * セクション構成:
 *   1. Hero          : H1 + 大きい検索ボックス + Popular/New/Trending タブ
 *   2. カテゴリ大カード: 6 カテゴリ (AI / Web開発 / モバイル / セキュリティ / DevOps / データ分析)
 *   3. 都市別グリッド   : 東京 / 大阪 / 福岡 / オンライン (写真風カード)
 *   4. Featured       : 人気カレンダー (subscriberCount 降順 6 件)
 *   5. トレンド         : acceptedCount 降順 12 件 (本来は増加率ベースだが MVP では単純化)
 *   6. (ログイン時のみ) 購読カレンダーの今後のイベント
 *
 * 注意:
 *   - `/explore` の機能・UI には一切触れない。
 *   - カテゴリの `/explore?tag=` リンクは Tag テーブルから slug を解決して張る。
 */

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, Flame, ChevronRight } from "lucide-react";

import Breadcrumb from "@/components/Breadcrumb";
import EventListRow from "@/components/EventListRow";

import { prisma } from "@/lib/prisma";
import { toEventCardData } from "@/lib/event-card";
import { getCurrentUser } from "@/lib/auth";
import {
  DEFAULT_LOCALE,
  SITE_NAME,
  absoluteUrl,
} from "@/lib/seo";
import {
  DISCOVER_CATEGORIES,
  DISCOVER_CITIES,
  buildCategoryExploreHref,
  buildCityExploreHref,
  type DiscoverCategory,
  type DiscoverCity,
} from "@/lib/categories";
import { ONLINE_LOCATION, PREFECTURES } from "@/lib/prefectures";
import { loadDict, t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

/* ============================================================
 * メタ情報
 * ============================================================ */

const DISCOVER_TITLE = "Discover - 興味のあるテックイベントを発見しよう";
const DISCOVER_DESCRIPTION =
  "AI / Web / モバイル / セキュリティ / DevOps / データ分析。カテゴリ・都市・カレンダーから次に参加したいテックイベントを見つけよう。";

export const metadata: Metadata = {
  title: DISCOVER_TITLE,
  description: DISCOVER_DESCRIPTION,
  alternates: {
    canonical: absoluteUrl("/discover"),
  },
  openGraph: {
    title: DISCOVER_TITLE,
    description: DISCOVER_DESCRIPTION,
    url: absoluteUrl("/discover"),
    siteName: SITE_NAME,
    locale: DEFAULT_LOCALE,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: DISCOVER_TITLE,
    description: DISCOVER_DESCRIPTION,
  },
};

/* ============================================================
 * Query 解析
 * ============================================================ */

type DiscoverPageSearchParams = {
  view?: string;
  q?: string;
};

type DiscoverView = "popular" | "new" | "trending";

function parseView(raw: string | undefined): DiscoverView {
  if (raw === "new" || raw === "trending") return raw;
  return "popular";
}

/* ============================================================
 * データ取得
 * ============================================================ */

/**
 * 主要 6 カテゴリの `Tag.slug` と `Event` 件数を一括で解決する。
 *
 * - `tagName` (例: "AI", "セキュリティ") で Tag を検索し、見つかった ID で
 *   関連 Event 数 (published) を集計する。
 * - Tag が見つからなければ slug=フォールバック / count=0 で扱う。
 */
async function fetchCategoryStats(): Promise<
  Map<string, { resolvedSlug: string | undefined; eventCount: number }>
> {
  const names = DISCOVER_CATEGORIES.map((c) => c.tagName);
  const tags = await prisma.tag.findMany({
    where: { name: { in: [...names] } },
  });
  const byName = new Map(tags.map((t) => [t.name, t]));

  const result = new Map<
    string,
    { resolvedSlug: string | undefined; eventCount: number }
  >();

  // 件数は usageCount を使うと過去のものも含まれるため、
  // ここでは「公開中 (published) の Event タグ数」を Promise.all で並列集計。
  await Promise.all(
    DISCOVER_CATEGORIES.map(async (cat) => {
      const tag = byName.get(cat.tagName);
      if (!tag) {
        result.set(cat.slug, { resolvedSlug: undefined, eventCount: 0 });
        return;
      }
      const count = await prisma.event.count({
        where: {
          status: "published",
          visibility: "public",
          tags: { some: { tagId: tag.id } },
        },
      });
      result.set(cat.slug, { resolvedSlug: tag.slug, eventCount: count });
    }),
  );

  return result;
}

/**
 * 都市カードの開催数 (オンライン含む) を集計する。
 *
 * - prefecture: address に "東京都" 等を含む published イベント数
 * - online    : eventFormat が online/hybrid の published イベント数
 */
async function fetchCityStats(): Promise<Map<string, number>> {
  const PREFECTURE_LABELS: Record<string, string> = {
    tokyo: "東京都",
    osaka: "大阪府",
    fukuoka: "福岡県",
  };

  const entries = await Promise.all(
    DISCOVER_CITIES.map(async (city) => {
      if (city.filter.type === "online") {
        const count = await prisma.event.count({
          where: {
            status: "published",
            visibility: "public",
            eventFormat: { in: ["online", "hybrid"] },
          },
        });
        return [city.slug, count] as const;
      }
      const label = PREFECTURE_LABELS[city.filter.prefectureSlug];
      if (!label) return [city.slug, 0] as const;
      const count = await prisma.event.count({
        where: {
          status: "published",
          visibility: "public",
          address: { contains: label },
        },
      });
      return [city.slug, count] as const;
    }),
  );

  return new Map(entries);
}

/** Featured Calendars: subscriberCount 降順 6 件 */
async function fetchFeaturedCalendars() {
  return prisma.calendar.findMany({
    where: { status: "active" },
    orderBy: { subscriberCount: "desc" },
    take: 6,
  });
}

/**
 * トレンドイベント: acceptedCount 降順 12 件。
 *
 * 本来は「直近 N 日の増加率」が指標だが、MVP では単純に総参加数で代用。
 */
async function fetchTrendingEvents() {
  const rows = await prisma.event.findMany({
    where: {
      status: "published",
      visibility: "public",
      // 既に終わったイベントは除外して未来の盛り上がりに寄せる
      endedAt: { gte: new Date() },
    },
    orderBy: { acceptedCount: "desc" },
    take: 12,
    include: {
      group: true,
      tags: { include: { tag: true } },
    },
  });
  return rows.map((e) => toEventCardData(e));
}

/** ビュー別の「ヒーロー直下メインリスト」 (Popular / New / Trending) 8 件 */
async function fetchHeroEvents(view: DiscoverView) {
  const baseWhere = {
    status: "published" as const,
    visibility: "public" as const,
  };
  switch (view) {
    case "new": {
      const rows = await prisma.event.findMany({
        where: { ...baseWhere, publishedAt: { not: null } },
        orderBy: { publishedAt: "desc" },
        take: 8,
        include: { group: true, tags: { include: { tag: true } } },
      });
      return rows.map((e) => toEventCardData(e));
    }
    case "trending": {
      // 直近1週間で endedAt がまだ先のイベントを acceptedCount 順
      const rows = await prisma.event.findMany({
        where: {
          ...baseWhere,
          endedAt: { gte: new Date() },
          publishedAt: {
            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { acceptedCount: "desc" },
        take: 8,
        include: { group: true, tags: { include: { tag: true } } },
      });
      return rows.map((e) => toEventCardData(e));
    }
    case "popular":
    default: {
      const rows = await prisma.event.findMany({
        where: { ...baseWhere, endedAt: { gte: new Date() } },
        orderBy: { acceptedCount: "desc" },
        take: 8,
        include: { group: true, tags: { include: { tag: true } } },
      });
      return rows.map((e) => toEventCardData(e));
    }
  }
}

/**
 * ログインユーザーが購読しているカレンダーの「今後のイベント」最大 6 件。
 * 未ログイン / 購読なしなら null を返す。
 */
async function fetchSubscribedUpcoming(userId: bigint | undefined) {
  if (!userId) return null;
  const subs = await prisma.calendarSubscription.findMany({
    where: { userId },
    select: { calendarId: true },
  });
  if (subs.length === 0) return null;

  const calendarIds = subs.map((s) => s.calendarId);
  const rows = await prisma.event.findMany({
    where: {
      status: "published",
      visibility: "public",
      startedAt: { gte: new Date() },
      calendars: { some: { calendarId: { in: calendarIds } } },
    },
    orderBy: { startedAt: "asc" },
    take: 6,
    include: { group: true, tags: { include: { tag: true } } },
  });
  if (rows.length === 0) return null;
  return rows.map((e) => toEventCardData(e));
}

/* ============================================================
 * Page
 * ============================================================ */

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<DiscoverPageSearchParams>;
}) {
  const sp = await searchParams;
  const view = parseView(sp.view);
  const q = sp.q?.trim();

  const me = await getCurrentUser();

  const [
    categoryStats,
    cityStats,
    featuredCalendars,
    trendingEvents,
    heroEvents,
    subscribedUpcoming,
  ] = await Promise.all([
    fetchCategoryStats(),
    fetchCityStats(),
    fetchFeaturedCalendars(),
    fetchTrendingEvents(),
    fetchHeroEvents(view),
    fetchSubscribedUpcoming(me?.id),
  ]);

  const { dict, locale } = await loadDict();
  const discoverHeroTitle =
    locale === "en"
      ? t(dict, "discover.subtitle")
      : "興味のあるテックイベントを発見しよう";

  return (
    <div
      data-testid="discover-page"
      className="flex w-full flex-1 flex-col"
    >
      {/* ============ Hero ============ */}
      <section
        aria-labelledby="discover-hero-heading"
        className="bg-gradient-to-br from-violet-50 via-brand-orange-soft to-sky-50 dark:from-violet-950/30 dark:via-brand-orange-soft/30 dark:to-sky-950/30"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-10 sm:py-14">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange-soft px-3 py-1 text-xs font-semibold text-brand-orange">
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
            Discover
          </div>
          <h1
            id="discover-hero-heading"
            data-testid="discover-title"
            className="text-center text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl"
          >
            {discoverHeroTitle}
          </h1>
          <p className="max-w-2xl text-center text-sm text-muted-foreground sm:text-base">
            人気のカテゴリ、開催地、コミュニティから、次に参加したい
            勉強会・カンファレンスを直感的に見つけられます。
          </p>

          {/* 大きい検索ボックス (POST 先は /explore) */}
          <form
            role="search"
            method="get"
            action="/explore"
            className="flex w-full max-w-2xl items-center gap-2 rounded-full border border-border bg-surface p-1.5 shadow-sm focus-within:border-brand-orange"
          >
            <label htmlFor="discover-q" className="sr-only">
              キーワードでイベントを検索
            </label>
            <input
              id="discover-q"
              name="q"
              type="search"
              defaultValue={q ?? ""}
              placeholder="例: React, AI, セキュリティ"
              className="h-10 min-w-0 flex-1 rounded-full bg-transparent px-4 text-sm focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-full bg-brand-orange px-5 text-sm font-semibold text-white shadow-sm hover:bg-brand-orange-hover"
            >
              検索
            </button>
          </form>

          {/* Popular / New / Trending タブ */}
          {/* モバイルではタブ内テキストが詰まりやすいため、最大幅を制限せず
              flex で並べたまま左右の余白を抑える。3 タブなら 320px 幅でも収まる。 */}
          <nav
            aria-label="表示ビューを切り替え"
            role="tablist"
            data-testid="discover-view-tabs"
            className="inline-flex max-w-full items-center gap-1 overflow-x-auto whitespace-nowrap rounded-full border border-border bg-surface p-1 sm:max-w-none"
          >
            <ViewTab label="人気" view="popular" active={view === "popular"} />
            <ViewTab label="新着" view="new" active={view === "new"} />
            <ViewTab
              label="トレンド"
              view="trending"
              active={view === "trending"}
            />
          </nav>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Breadcrumb
          items={[
            { label: "ホーム", href: "/" },
            { label: "Discover" },
          ]}
        />

        {/* ============ 現在のビュー (Popular/New/Trending) のイベント ============ */}
        <section
          aria-labelledby="discover-hero-events-heading"
          data-testid="discover-hero-events"
          className="mt-6"
        >
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2
              id="discover-hero-events-heading"
              className="text-lg font-bold text-foreground sm:text-xl"
            >
              {view === "popular" && "今、人気のイベント"}
              {view === "new" && "新着のイベント"}
              {view === "trending" && "今、トレンドのイベント"}
            </h2>
            <Link
              href={
                view === "new"
                  ? "/explore?order=new"
                  : view === "trending"
                    ? "/explore?order=popular"
                    : "/explore?order=popular"
              }
              className="shrink-0 text-xs font-semibold text-link hover:underline"
            >
              すべて見る →
            </Link>
          </div>
          {heroEvents.length === 0 ? (
            <EmptyState message="該当するイベントがまだありません。" />
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border bg-surface">
              {heroEvents.map((e) => (
                <li key={e.id}>
                  <EventListRow event={e} compact />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ============ カテゴリ大カード (2x3) ============ */}
        <section
          aria-labelledby="discover-categories-heading"
          data-testid="discover-categories"
          className="mt-12"
        >
          <header className="mb-4 flex items-baseline justify-between gap-4">
            <h2
              id="discover-categories-heading"
              className="text-lg font-bold text-foreground sm:text-xl"
            >
              カテゴリから探す
            </h2>
            <p className="text-xs text-muted-foreground">
              気になる分野でドリルダウン
            </p>
          </header>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DISCOVER_CATEGORIES.map((cat) => {
              const stat = categoryStats.get(cat.slug);
              return (
                <li key={cat.slug} className="flex flex-col gap-1.5">
                  <CategoryCard
                    category={cat}
                    eventCount={stat?.eventCount ?? 0}
                    href={buildCategoryExploreHref(cat, stat?.resolvedSlug)}
                  />
                  {/* SEO ランディング (カテゴリ別 LP) への主導線 */}
                  <Link
                    href={`/discover/category/${cat.slug}`}
                    data-testid={`discover-category-lp-${cat.slug}`}
                    className="self-start text-xs font-semibold text-link hover:underline"
                  >
                    {cat.name}のイベント特集を見る →
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ============ 都市別グリッド ============ */}
        <section
          aria-labelledby="discover-cities-heading"
          data-testid="discover-cities"
          className="mt-12"
        >
          <header className="mb-4 flex items-baseline justify-between gap-4">
            <h2
              id="discover-cities-heading"
              className="text-lg font-bold text-foreground sm:text-xl"
            >
              開催地から探す
            </h2>
            <p className="text-xs text-muted-foreground">
              都市・オンラインから一発でフィルタ
            </p>
          </header>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {DISCOVER_CITIES.map((city) => (
              <li key={city.slug} className="flex flex-col gap-1.5">
                <CityCard
                  city={city}
                  eventCount={cityStats.get(city.slug) ?? 0}
                  href={buildCityExploreHref(city)}
                />
                {/* SEO ランディング (都市別 LP) への主導線 */}
                <Link
                  href={`/discover/${city.slug}`}
                  data-testid={`discover-city-lp-${city.slug}`}
                  className="self-start text-xs font-semibold text-link hover:underline"
                >
                  {city.name}のイベント特集を見る →
                </Link>
              </li>
            ))}
          </ul>

          {/* 47 都道府県 + オンラインの LP へのリンク集 (SEO クロール導線) */}
          <nav
            aria-label="都道府県別のイベント特集ページ"
            data-testid="discover-prefecture-links"
            className="mt-6"
          >
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              都道府県からイベント特集を探す
            </h3>
            <ul className="flex flex-wrap gap-2">
              {[ONLINE_LOCATION, ...PREFECTURES].map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/discover/${p.slug}`}
                    className="inline-flex h-8 items-center rounded-full border border-border bg-surface px-3 text-xs text-foreground transition-colors hover:border-brand-orange hover:text-brand-orange"
                  >
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </section>

        {/* ============ Featured Calendars ============ */}
        {featuredCalendars.length > 0 && (
          <section
            aria-labelledby="discover-calendars-heading"
            data-testid="discover-calendars"
            className="mt-12"
          >
            <header className="mb-4 flex items-baseline justify-between gap-4">
              <h2
                id="discover-calendars-heading"
                className="text-lg font-bold text-foreground sm:text-xl"
              >
                おすすめカレンダー
              </h2>
              <Link
                href="/calendars?order=popular"
                className="shrink-0 text-xs font-semibold text-link hover:underline"
              >
                すべて見る →
              </Link>
            </header>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featuredCalendars.map((c) => (
                <li key={c.id.toString()}>
                  <Link
                    href={`/calendar/${c.slug}`}
                    className="flex h-full overflow-hidden rounded-md border border-border bg-surface transition-colors hover:border-brand-orange"
                  >
                    <div
                      className="flex w-16 shrink-0 items-center justify-center text-xl font-bold text-white"
                      style={{ backgroundColor: c.tintColor ?? "#5b21b6" }}
                      aria-hidden="true"
                    >
                      {c.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1 p-3">
                      <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
                        {c.name}
                      </h3>
                      {c.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {c.description}
                        </p>
                      )}
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        購読 {new Intl.NumberFormat(locale === "en" ? "en-US" : "ja-JP").format(c.subscriberCount)} ・
                        イベント {new Intl.NumberFormat(locale === "en" ? "en-US" : "ja-JP").format(c.eventCount)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ============ トレンドイベント ============ */}
        {trendingEvents.length > 0 && (
          <section
            aria-labelledby="discover-trending-heading"
            data-testid="discover-trending"
            className="mt-12"
          >
            <header className="mb-4 flex items-baseline justify-between gap-4">
              <div className="flex items-center gap-2">
                <Flame
                  aria-hidden="true"
                  className="h-5 w-5 text-brand-orange"
                />
                <h2
                  id="discover-trending-heading"
                  className="text-lg font-bold text-foreground sm:text-xl"
                >
                  トレンドイベント
                </h2>
              </div>
              <Link
                href="/explore?order=popular"
                className="shrink-0 text-xs font-semibold text-link hover:underline"
              >
                すべて見る →
              </Link>
            </header>
            <ul className="divide-y divide-border rounded-md border border-border bg-surface">
              {trendingEvents.map((e) => (
                <li key={e.id}>
                  <EventListRow event={e} compact />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ============ ログイン時のみ: 購読カレンダーからの新着 ============ */}
        {subscribedUpcoming && subscribedUpcoming.length > 0 && (
          <section
            aria-labelledby="discover-subscribed-heading"
            data-testid="discover-subscribed"
            className="mt-12"
          >
            <header className="mb-4 flex items-baseline justify-between gap-4">
              <h2
                id="discover-subscribed-heading"
                className="text-lg font-bold text-foreground sm:text-xl"
              >
                最近フォローしたカレンダーから
              </h2>
              <Link
                href="/dashboard"
                className="shrink-0 text-xs font-semibold text-link hover:underline"
              >
                すべて見る →
              </Link>
            </header>
            <ul className="divide-y divide-border rounded-md border border-border bg-surface">
              {subscribedUpcoming.map((e) => (
                <li key={e.id}>
                  <EventListRow event={e} compact />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

/* ============================================================
 * 内部 UI ヘルパー
 * ============================================================ */

function ViewTab({
  label,
  view,
  active,
}: {
  label: string;
  view: DiscoverView;
  active: boolean;
}) {
  return (
    <Link
      role="tab"
      aria-selected={active}
      data-testid={`discover-view-tab-${view}`}
      href={`/discover?view=${view}`}
      className={
        active
          ? "inline-flex h-8 items-center rounded-full bg-brand-orange px-4 text-sm font-semibold text-white"
          : "inline-flex h-8 items-center rounded-full px-4 text-sm text-foreground hover:bg-brand-orange-soft"
      }
    >
      {label}
    </Link>
  );
}

function CategoryCard({
  category,
  eventCount,
  href,
}: {
  category: DiscoverCategory;
  eventCount: number;
  href: string;
}) {
  const Icon = category.icon;
  return (
    <Link
      href={href}
      data-testid={`discover-category-${category.slug}`}
      className="group relative flex h-32 overflow-hidden rounded-xl border border-border text-white transition-transform hover:-translate-y-0.5"
      style={{
        background: `linear-gradient(135deg, ${category.gradientFrom} 0%, ${category.gradientTo} 100%)`,
      }}
    >
      <div className="relative z-10 flex w-full flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
            <Icon aria-hidden="true" className="h-5 w-5" />
          </span>
          <ChevronRight
            aria-hidden="true"
            className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100"
          />
        </div>
        <div>
          <h3 className="text-lg font-bold tracking-tight">{category.name}</h3>
          <p className="mt-0.5 text-xs opacity-90">{category.description}</p>
          <p className="mt-1.5 text-[11px] opacity-80">
            {new Intl.NumberFormat("ja-JP").format(eventCount)} 件のイベント
          </p>
        </div>
      </div>
      {/* 装飾の半透明アイコン (右下) */}
      <Icon
        aria-hidden="true"
        className="absolute -bottom-4 -right-4 h-28 w-28 opacity-10"
      />
    </Link>
  );
}

function CityCard({
  city,
  eventCount,
  href,
}: {
  city: DiscoverCity;
  eventCount: number;
  href: string;
}) {
  // 写真は picsum.photos で seed 固定 (SSR キャッシュ安定)
  const photoUrl = `https://picsum.photos/seed/${city.photoSeed}/600/400`;
  return (
    <Link
      href={href}
      data-testid={`discover-city-${city.slug}`}
      className="group relative flex aspect-[4/3] overflow-hidden rounded-xl border border-border text-white transition-transform hover:-translate-y-0.5"
    >
      <Image
        src={photoUrl}
        alt=""
        fill
        sizes="(max-width: 640px) 50vw, 200px"
        className="object-cover transition-transform group-hover:scale-105"
      />
      {/* グラデーションオーバーレイ */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
      />
      <div className="relative z-10 mt-auto w-full p-3">
        <h3 className="text-base font-bold tracking-tight">{city.name}</h3>
        <p className="text-[11px] opacity-90">
          {new Intl.NumberFormat("ja-JP").format(eventCount)} 件のイベント
        </p>
      </div>
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-dashed border-border bg-surface p-6 text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}

