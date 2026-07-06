/**
 * 都市 (都道府県) 別 SEO ランディングページ (Server Component)
 *
 * URL: `/discover/{city}` (例: `/discover/tokyo`, `/discover/online`)
 *
 * Luma の discover 都市別ページ (lu.ma/discover/tokyo 等) を参考にした
 * SEO 向け静的ランディング。既存 `/explore?prefecture=` のフィルタ検索は
 * そのまま残し、本ページは「検索エンジンからの入り口 + 回遊ハブ」を担う。
 *
 * 対応スラグ:
 *   - 47 都道府県 (connpass 互換 slug、`@/lib/prefectures` の PREFECTURES)
 *   - `online` (オンライン開催 = eventFormat online/hybrid)
 *   - それ以外は notFound()
 *
 * SEO:
 *   - generateMetadata で title / description / canonical / OG / Twitter
 *   - JSON-LD: ItemList (開催予定イベント) + CollectionPage
 *   - Breadcrumb (BreadcrumbList JSON-LD は Breadcrumb コンポーネント内蔵)
 *   - 他都道府県 LP への内部リンク (クロール導線)
 *
 * データ取得は既存パターンを踏襲 (status=published / visibility=public のみ)。
 * 都道府県は address 部分一致、オンラインは eventFormat in (online, hybrid)。
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Globe, SlidersHorizontal } from "lucide-react";

import Breadcrumb from "@/components/Breadcrumb";
import EventListRow from "@/components/EventListRow";

import { prisma } from "@/lib/prisma";
import { toEventCardData } from "@/lib/event-card";
import { safeJsonLd } from "@/lib/markdown";
import { DEFAULT_LOCALE, SITE_NAME, absoluteUrl } from "@/lib/seo";
import { PREFECTURES, ONLINE_LOCATION } from "@/lib/prefectures";

export const dynamic = "force-dynamic";

/** 開催予定リストの最大件数 (SEO LP としては 1 ページ完結) */
const UPCOMING_TAKE = 30;
/** 過去イベントの参考表示件数 */
const PAST_TAKE = 10;

/* ============================================================
 * City 解決
 * ============================================================ */

type CityDef = {
  /** URL スラグ (例: "tokyo" / "online") */
  slug: string;
  /** 正式表示名 (例: "東京都" / "オンライン") */
  label: string;
  /** 見出し用の開催地表現 (例: "東京都" / "オンライン開催") */
  heading: string;
  isOnline: boolean;
};

/** slug から都市定義を解決する。未対応 slug は null。 */
function resolveCity(slug: string): CityDef | null {
  if (slug === ONLINE_LOCATION.slug) {
    return {
      slug,
      label: ONLINE_LOCATION.label,
      heading: "オンライン開催",
      isOnline: true,
    };
  }
  const pref = PREFECTURES.find((p) => p.slug === slug);
  if (!pref) return null;
  return { slug, label: pref.label, heading: pref.label, isOnline: false };
}

/** published + public の共通 where。 */
function cityWhere(city: CityDef) {
  return city.isOnline
    ? {
        status: "published" as const,
        visibility: "public" as const,
        eventFormat: { in: ["online", "hybrid"] },
      }
    : {
        status: "published" as const,
        visibility: "public" as const,
        address: { contains: city.label },
      };
}

/** explore へのディープリンク (既存フィルタクエリを維持)。 */
function cityExploreHref(city: CityDef): string {
  return city.isOnline
    ? "/explore?online=1"
    : `/explore?prefecture=${encodeURIComponent(city.slug)}`;
}

/* ============================================================
 * Metadata
 * ============================================================ */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: slug } = await params;
  const city = resolveCity(slug);
  if (!city) return { title: "ページが見つかりません" };

  const title = `${city.heading}のテックイベント・勉強会一覧`;
  const description = city.isOnline
    ? `オンラインで参加できるテックイベント・勉強会・カンファレンスの一覧。自宅から参加できる IT 勉強会を ${SITE_NAME} で見つけよう。`
    : `${city.label}で開催されるテックイベント・IT勉強会・カンファレンスの一覧。${city.label}のエンジニア向けイベントを開催日順に ${SITE_NAME} でチェックしよう。`;
  const canonical = absoluteUrl(`/discover/${city.slug}`);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: DEFAULT_LOCALE,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/* ============================================================
 * Page
 * ============================================================ */

export default async function DiscoverCityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: slug } = await params;
  const city = resolveCity(slug);
  if (!city) notFound();

  const now = new Date();
  const where = cityWhere(city);

  const [upcomingRows, pastRows, totalCount] = await Promise.all([
    prisma.event.findMany({
      where: { ...where, startedAt: { gte: now } },
      orderBy: { startedAt: "asc" },
      take: UPCOMING_TAKE,
      include: { group: true, tags: { include: { tag: true } } },
    }),
    prisma.event.findMany({
      where: { ...where, endedAt: { lt: now } },
      orderBy: { startedAt: "desc" },
      take: PAST_TAKE,
      include: { group: true, tags: { include: { tag: true } } },
    }),
    prisma.event.count({ where }),
  ]);

  const upcoming = upcomingRows.map((e) => toEventCardData(e));
  const past = pastRows.map((e) => toEventCardData(e));

  // JSON-LD: CollectionPage + ItemList (開催予定イベント)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${city.heading}のテックイベント・勉強会一覧`,
    url: absoluteUrl(`/discover/${city.slug}`),
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: absoluteUrl("/"),
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: upcoming.length,
      itemListElement: upcomingRows.map((e, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: e.title,
        url: absoluteUrl(`/event/${e.id.toString()}`),
      })),
    },
  };

  const Icon = city.isOnline ? Globe : MapPin;
  const exploreHref = cityExploreHref(city);

  return (
    <div
      data-testid="discover-city-page"
      className="flex w-full flex-1 flex-col"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      {/* ============ Hero ============ */}
      <section
        aria-labelledby="discover-city-heading"
        className="bg-gradient-to-br from-violet-50 via-brand-orange-soft to-sky-50 dark:from-violet-950/30 dark:via-brand-orange-soft/30 dark:to-sky-950/30"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-4 py-8 sm:py-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange-soft px-3 py-1 text-xs font-semibold text-brand-orange">
            <Icon aria-hidden="true" className="h-3.5 w-3.5" />
            {city.isOnline ? "オンライン" : "開催地"}
          </div>
          <h1
            id="discover-city-heading"
            data-testid="discover-city-title"
            className="text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl"
          >
            {city.heading}のテックイベント・勉強会
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            {city.isOnline
              ? "自宅やオフィスから参加できるオンライン開催の IT 勉強会・カンファレンスを開催日順にまとめています。"
              : `${city.label}で開催されるエンジニア向けの勉強会・ミートアップ・カンファレンスを開催日順にまとめています。`}
            {totalCount > 0 && (
              <>
                {" "}
                現在 {new Intl.NumberFormat("ja-JP").format(totalCount)}{" "}
                件のイベントが公開中です。
              </>
            )}
          </p>
          <Link
            href={exploreHref}
            data-testid="discover-city-explore-link"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-brand-orange hover:text-brand-orange"
          >
            <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
            条件を絞って探す
          </Link>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Breadcrumb
          items={[
            { label: "ホーム", href: "/" },
            { label: "Discover", href: "/discover" },
            { label: city.heading },
          ]}
        />

        {/* ============ 開催予定 ============ */}
        <section
          aria-labelledby="discover-city-upcoming-heading"
          data-testid="discover-city-upcoming"
          className="mt-6"
        >
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2
              id="discover-city-upcoming-heading"
              className="text-lg font-bold text-foreground sm:text-xl"
            >
              開催予定のイベント
            </h2>
            <Link
              href={exploreHref}
              className="shrink-0 text-xs font-semibold text-link hover:underline"
            >
              すべて見る →
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p
              data-testid="discover-city-empty"
              className="rounded-md border border-dashed border-border bg-surface p-6 text-center text-sm text-muted-foreground"
            >
              {city.heading}
              で開催予定のイベントはまだありません。
              <Link href="/explore" className="ml-1 text-link hover:underline">
                すべてのイベントを見る
              </Link>
            </p>
          ) : (
            <ul
              data-testid="discover-city-events"
              className="divide-y divide-border rounded-md border border-border bg-surface"
            >
              {upcoming.map((e) => (
                <li key={e.id}>
                  <EventListRow event={e} compact />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ============ 過去のイベント ============ */}
        {past.length > 0 && (
          <section
            aria-labelledby="discover-city-past-heading"
            data-testid="discover-city-past"
            className="mt-12"
          >
            <h2
              id="discover-city-past-heading"
              className="mb-3 text-lg font-bold text-foreground sm:text-xl"
            >
              最近終了したイベント
            </h2>
            <ul className="divide-y divide-border rounded-md border border-border bg-surface">
              {past.map((e) => (
                <li key={e.id}>
                  <EventListRow event={e} compact />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ============ 他の開催地 (内部リンク / SEO 回遊) ============ */}
        <nav
          aria-labelledby="discover-city-others-heading"
          data-testid="discover-city-others"
          className="mt-12"
        >
          <h2
            id="discover-city-others-heading"
            className="mb-3 text-lg font-bold text-foreground sm:text-xl"
          >
            他の開催地から探す
          </h2>
          <ul className="flex flex-wrap gap-2">
            {[ONLINE_LOCATION, ...PREFECTURES]
              .filter((p) => p.slug !== city.slug)
              .map((p) => (
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
      </div>
    </div>
  );
}
