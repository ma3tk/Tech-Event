/**
 * カテゴリ (技術領域) 別 SEO ランディングページ (Server Component)
 *
 * URL: `/discover/category/{slug}` (例: `/discover/category/ai`)
 *
 * Luma の discover カテゴリ別ページ (lu.ma/category/ai 等) を参考にした
 * SEO 向けランディング。既存 `/explore?tag=` のフィルタ検索はそのまま残し、
 * 本ページは「検索エンジンからの入り口 + 回遊ハブ」を担う。
 *
 * 対応スラグ:
 *   - `DISCOVER_CATEGORIES` (@/lib/categories) の 6 カテゴリ
 *     (ai / web / mobile / security / devops / data)
 *   - それ以外は notFound()
 *
 * SEO:
 *   - generateMetadata で title / description / canonical / OG / Twitter
 *   - JSON-LD: CollectionPage + ItemList (開催予定イベント)
 *   - Breadcrumb (BreadcrumbList JSON-LD は Breadcrumb コンポーネント内蔵)
 *   - 他カテゴリ LP への内部リンク (クロール導線)
 *
 * データ取得は `/discover` トップと同じパターン:
 * `Tag.name` (代表タグ名) で Tag を解決し、published + public のイベントを
 * 開催日順に表示する。Tag が DB に無い場合は空リスト (カテゴリ自体は有効)。
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

import Breadcrumb from "@/components/Breadcrumb";
import EventListRow from "@/components/EventListRow";

import { prisma } from "@/lib/prisma";
import { toEventCardData } from "@/lib/event-card";
import { safeJsonLd } from "@/lib/markdown";
import { DEFAULT_LOCALE, SITE_NAME, absoluteUrl } from "@/lib/seo";
import {
  DISCOVER_CATEGORIES,
  buildCategoryExploreHref,
  type DiscoverCategory,
} from "@/lib/categories";

export const dynamic = "force-dynamic";

/** 開催予定リストの最大件数 (SEO LP としては 1 ページ完結) */
const UPCOMING_TAKE = 30;
/** 過去イベントの参考表示件数 */
const PAST_TAKE = 10;

/* ============================================================
 * カテゴリ解決
 * ============================================================ */

function resolveCategory(slug: string): DiscoverCategory | null {
  return DISCOVER_CATEGORIES.find((c) => c.slug === slug) ?? null;
}

/* ============================================================
 * Metadata
 * ============================================================ */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = resolveCategory(slug);
  if (!category) return { title: "ページが見つかりません" };

  const title = `${category.name}のテックイベント・勉強会一覧`;
  const description = `${category.name} (${category.description}) のテックイベント・IT勉強会・カンファレンスの一覧。${category.name}のエンジニア向けイベントを開催日順に ${SITE_NAME} でチェックしよう。`;
  const canonical = absoluteUrl(`/discover/category/${category.slug}`);

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

export default async function DiscoverCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = resolveCategory(slug);
  if (!category) notFound();

  const now = new Date();

  // 代表タグ名で Tag を解決 (discover トップと同じ方式)
  const tag = await prisma.tag.findFirst({
    where: { name: category.tagName },
  });

  const where = tag
    ? {
        status: "published" as const,
        visibility: "public" as const,
        tags: { some: { tagId: tag.id } },
      }
    : null;

  const [upcomingRows, pastRows, totalCount] = where
    ? await Promise.all([
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
      ])
    : [[], [], 0];

  const upcoming = upcomingRows.map((e) => toEventCardData(e));
  const past = pastRows.map((e) => toEventCardData(e));

  // JSON-LD: CollectionPage + ItemList (開催予定イベント)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name}のテックイベント・勉強会一覧`,
    url: absoluteUrl(`/discover/category/${category.slug}`),
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

  const Icon = category.icon;
  const exploreHref = buildCategoryExploreHref(category, tag?.slug);

  return (
    <div
      data-testid="discover-category-page"
      className="flex w-full flex-1 flex-col"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      {/* ============ Hero (カテゴリのグラデーション) ============ */}
      <section
        aria-labelledby="discover-category-heading"
        className="text-white"
        style={{
          background: `linear-gradient(135deg, ${category.gradientFrom} 0%, ${category.gradientTo} 100%)`,
        }}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-4 py-8 sm:py-10">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
            <Icon aria-hidden="true" className="h-5 w-5" />
          </span>
          <h1
            id="discover-category-heading"
            data-testid="discover-category-title"
            className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl"
          >
            {category.name}のテックイベント・勉強会
          </h1>
          <p className="max-w-2xl text-sm opacity-90 sm:text-base">
            {category.description}。{category.name}
            に関するエンジニア向けの勉強会・ミートアップ・カンファレンスを開催日順にまとめています。
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
            data-testid="discover-category-explore-link"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/90 px-4 text-sm font-semibold text-gray-900 shadow-sm transition-colors hover:bg-white"
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
            { label: category.name },
          ]}
        />

        {/* ============ 開催予定 ============ */}
        <section
          aria-labelledby="discover-category-upcoming-heading"
          data-testid="discover-category-upcoming"
          className="mt-6"
        >
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2
              id="discover-category-upcoming-heading"
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
              data-testid="discover-category-empty"
              className="rounded-md border border-dashed border-border bg-surface p-6 text-center text-sm text-muted-foreground"
            >
              {category.name}
              の開催予定イベントはまだありません。
              <Link href="/explore" className="ml-1 text-link hover:underline">
                すべてのイベントを見る
              </Link>
            </p>
          ) : (
            <ul
              data-testid="discover-category-events"
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
            aria-labelledby="discover-category-past-heading"
            data-testid="discover-category-past"
            className="mt-12"
          >
            <h2
              id="discover-category-past-heading"
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

        {/* ============ 他のカテゴリ (内部リンク / SEO 回遊) ============ */}
        <nav
          aria-labelledby="discover-category-others-heading"
          data-testid="discover-category-others"
          className="mt-12"
        >
          <h2
            id="discover-category-others-heading"
            className="mb-3 text-lg font-bold text-foreground sm:text-xl"
          >
            他のカテゴリから探す
          </h2>
          <ul className="flex flex-wrap gap-2">
            {DISCOVER_CATEGORIES.filter((c) => c.slug !== category.slug).map(
              (c) => (
                <li key={c.slug}>
                  <Link
                    href={`/discover/category/${c.slug}`}
                    className="inline-flex h-8 items-center rounded-full border border-border bg-surface px-3 text-xs text-foreground transition-colors hover:border-brand-orange hover:text-brand-orange"
                  >
                    {c.name}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>
      </div>
    </div>
  );
}
