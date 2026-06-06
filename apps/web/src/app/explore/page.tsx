/**
 * イベント検索/一覧ページ (Server Component)
 *
 * Query:
 *  - q          フリーワード (title / catchPhrase / description にマッチ)
 *  - prefecture 都道府県スラッグ (address LIKE)
 *  - online     "1" のときオフライン除外
 *  - order      new(default) | popular | started_at
 *  - tag        タグ slug
 *  - page       1始まり
 *
 * 左サイドに検索フィルタパネル、メインにコンパクトリスト一覧 (20件/page) + ページネーション。
 * すべて Prisma 直接呼び出し。Prisma の Event は `toEventCardData()` で
 * UI 用 EventCardData に変換して `<EventListRow>` に渡す。
 */
import type { Metadata } from "next";
import Link from "next/link";

import EventListRow from "@/components/EventListRow";
import Pagination from "@/components/Pagination";
import Breadcrumb from "@/components/Breadcrumb";
import SearchHintsModal from "@/components/SearchHintsModal";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchX } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { toEventCardData } from "@/lib/event-card";
import type { Prisma } from "@/generated/prisma";
import {
  DEFAULT_LOCALE,
  SITE_NAME,
  absoluteUrl,
} from "@/lib/seo";
import { applyFtsWhere } from "@/lib/search";

const PAGE_SIZE = 20;

/* ============================================================
 * 都道府県スラッグ -> 表示名のテーブル (47 都道府県の代表的なもの)
 *
 * フィルタ UI のセレクトオプションと、住所文字列マッチ用の正規化に使う。
 * ============================================================ */
const PREFECTURES = [
  { slug: "hokkaido", label: "北海道" },
  { slug: "tohoku", label: "東北" },
  { slug: "tokyo", label: "東京都" },
  { slug: "kanagawa", label: "神奈川県" },
  { slug: "chiba", label: "千葉県" },
  { slug: "saitama", label: "埼玉県" },
  { slug: "aichi", label: "愛知県" },
  { slug: "osaka", label: "大阪府" },
  { slug: "kyoto", label: "京都府" },
  { slug: "hyogo", label: "兵庫県" },
  { slug: "fukuoka", label: "福岡県" },
] as const;

type ExplorePageSearchParams = {
  q?: string;
  prefecture?: string;
  online?: string;
  order?: string;
  tag?: string;
  page?: string;
};

const EXPLORE_TITLE = "イベントを探す";
const EXPLORE_DESCRIPTION =
  "全国のIT勉強会・カンファレンス・ミートアップを地域・タグ・キーワードで検索できます。";

export const metadata: Metadata = {
  title: EXPLORE_TITLE,
  description: EXPLORE_DESCRIPTION,
  alternates: {
    canonical: absoluteUrl("/explore"),
  },
  openGraph: {
    title: EXPLORE_TITLE,
    description: EXPLORE_DESCRIPTION,
    url: absoluteUrl("/explore"),
    siteName: SITE_NAME,
    locale: DEFAULT_LOCALE,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: EXPLORE_TITLE,
    description: EXPLORE_DESCRIPTION,
  },
};

/* ============================================================
 * Query 解析
 * ============================================================ */

type ParsedFilters = {
  q?: string;
  prefecture?: string;
  online: boolean;
  order: "new" | "popular" | "started_at";
  tag?: string;
  page: number;
};

function parseFilters(sp: ExplorePageSearchParams): ParsedFilters {
  const order =
    sp.order === "popular" || sp.order === "started_at" ? sp.order : "new";
  const page = (() => {
    const n = sp.page ? Number(sp.page) : 1;
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
  })();
  return {
    q: sp.q?.trim() || undefined,
    prefecture: sp.prefecture?.trim() || undefined,
    online: sp.online === "1",
    order,
    tag: sp.tag?.trim() || undefined,
    page,
  };
}

function buildWhere(f: ParsedFilters): Prisma.EventWhereInput {
  const where: Prisma.EventWhereInput = {
    status: "published",
    visibility: "public",
  };

  // キーワード検索は SQLite FTS5 (events_fts) を利用する。
  // ここでは追加条件のみを組み立て、`searchEvents()` の結果を applyFtsWhere で
  // 後段の Prisma クエリに AND 合成する (ExplorePage 本体で実行)。

  if (f.online) {
    where.eventFormat = { in: ["online", "hybrid"] };
  }

  // 都道府県は online との両立を許容 (hybrid 開催を考慮)
  if (f.prefecture) {
    const label =
      PREFECTURES.find((p) => p.slug === f.prefecture)?.label ?? f.prefecture;
    where.address = { contains: label };
  }

  if (f.tag) {
    where.tags = { some: { tag: { slug: f.tag } } };
  }

  // started_at 並び順では「これから始まる」イベントのみ対象にする。
  if (f.order === "started_at") {
    where.startedAt = { gte: new Date() };
  }

  return where;
}

function buildOrderBy(f: ParsedFilters): Prisma.EventOrderByWithRelationInput {
  switch (f.order) {
    case "popular":
      return { acceptedCount: "desc" };
    case "started_at":
      return { startedAt: "asc" };
    case "new":
    default:
      return { publishedAt: "desc" };
  }
}

/** クエリを保ったままページ番号だけを差し替える URL を作る */
function buildHref(base: ParsedFilters, page: number): string {
  const u = new URLSearchParams();
  if (base.q) u.set("q", base.q);
  if (base.prefecture) u.set("prefecture", base.prefecture);
  if (base.online) u.set("online", "1");
  if (base.order !== "new") u.set("order", base.order);
  if (base.tag) u.set("tag", base.tag);
  if (page > 1) u.set("page", page.toString());
  const q = u.toString();
  return q ? `/explore?${q}` : "/explore";
}

/* ============================================================
 * Page
 * ============================================================ */

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<ExplorePageSearchParams>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const baseWhere = buildWhere(filters);
  // FTS5 (events_fts) を使って keyword 検索の id 集合を where に AND 合成する。
  // 空クエリなら baseWhere をそのまま使う (= 全件対象)。
  const where = filters.q
    ? await applyFtsWhere(filters.q, baseWhere)
    : baseWhere;
  const orderBy = buildOrderBy(filters);

  const [total, rows, weeklyRows] = await Promise.all([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        group: true,
        tags: { include: { tag: true } },
      },
    }),
    // 右サイドバー: 今週おすすめイベント (acceptedCount 上位 3 件、開催日が直近1週間)
    prisma.event.findMany({
      where: {
        status: "published",
        visibility: "public",
        startedAt: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { acceptedCount: "desc" },
      take: 3,
      include: {
        group: true,
        tags: { include: { tag: true } },
      },
    }),
  ]);

  const events = rows.map((e) => toEventCardData(e));
  const weeklyRecommended = weeklyRows.map((e) => toEventCardData(e));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: "イベントを探す" },
        ]}
      />

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)_240px]">
        {/* ============ 左サイドバー: 検索フィルタ ============ */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <SearchFilterPanel filters={filters} />
        </aside>

        {/* ============ メイン: 結果 ============ */}
        <main aria-labelledby="results-heading" className="min-w-0">
          <header className="mb-3 flex items-end justify-between gap-4">
            <h1
              id="results-heading"
              className="text-xl font-bold text-foreground md:text-2xl"
            >
              {filters.q ? (
                <>
                  「{filters.q}」の検索結果{" "}
                  <span
                    className="text-muted-foreground"
                    data-testid="search-hit-count"
                  >
                    {new Intl.NumberFormat("ja-JP").format(total)}件ヒット
                  </span>
                </>
              ) : (
                <>
                  該当{" "}
                  <span className="text-brand-orange">
                    {new Intl.NumberFormat("ja-JP").format(total)}
                  </span>
                  件のイベント
                </>
              )}
            </h1>
            <SearchHintsModal />
          </header>

          {/* ソートタブ (常時表示・URLと同期) */}
          <nav
            aria-label="表示順を変更"
            role="tablist"
            className="mb-3 flex gap-1 border-b border-border text-sm"
          >
            <SortTab
              label="新着"
              active={filters.order === "new"}
              href={buildHref({ ...filters, order: "new", page: 1 }, 1)}
            />
            <SortTab
              label="人気"
              active={filters.order === "popular"}
              href={buildHref({ ...filters, order: "popular", page: 1 }, 1)}
            />
            <SortTab
              label="開催日が近い順"
              active={filters.order === "started_at"}
              href={buildHref(
                { ...filters, order: "started_at", page: 1 },
                1,
              )}
            />
          </nav>

          {/* 検索語が指定されている場合は、検索キーワードのハイライト pill を上部に表示 */}
          {filters.q && (
            <p
              className="mb-3 text-xs text-muted-foreground"
              data-testid="search-keyword-highlight"
            >
              検索キーワード:{" "}
              {filters.q
                .split(/[\s　]+/)
                .filter((t) => t.length > 0)
                .map((token, i) => (
                  <mark
                    key={`${token}-${i}`}
                    className="mr-1 inline-block rounded-sm bg-brand-orange-soft px-1.5 py-0.5 font-semibold text-brand-orange"
                  >
                    {token}
                  </mark>
                ))}
            </p>
          )}

          {events.length === 0 ? (
            <EmptyResult filters={filters} />
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border bg-surface">
              {events.map((event) => (
                <li key={event.id}>
                  <EventListRow event={event} />
                </li>
              ))}
            </ul>
          )}

          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={filters.page}
                totalPages={totalPages}
                buildHref={(p: number) => buildHref(filters, p)}
              />
            </div>
          )}
        </main>

        {/* ============ 右サイドバー (lg+のみ表示) ============ */}
        <aside
          aria-label="補助情報"
          className="hidden flex-col gap-4 lg:flex lg:sticky lg:top-4 lg:self-start"
        >
          {/* 広告バナー枠 (プレースホルダ) */}
          <div
            aria-label="広告枠"
            className="flex h-32 items-center justify-center rounded-md border border-dashed border-border bg-brand-orange-soft/30 text-center"
          >
            <div className="px-3 text-xs text-muted-foreground">
              <p className="font-bold text-foreground">広告</p>
              <p className="mt-1">
                tech-event は無料で
                <br />
                イベントを掲載できます
              </p>
            </div>
          </div>

          {/* 今週おすすめのイベント */}
          {weeklyRecommended.length > 0 && (
            <section
              aria-labelledby="weekly-rec-heading"
              className="rounded-md border border-border bg-surface p-3"
            >
              <h2
                id="weekly-rec-heading"
                className="mb-2 text-sm font-bold text-foreground"
              >
                今週おすすめのイベント
              </h2>
              <ul className="flex flex-col gap-2">
                {weeklyRecommended.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={e.href ?? `/event/${e.id}`}
                      className="block leading-snug hover:text-link"
                    >
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(e.startedAt).toLocaleDateString("ja-JP", {
                          month: "numeric",
                          day: "numeric",
                          weekday: "short",
                        })}
                      </p>
                      <p className="line-clamp-2 text-xs font-medium text-foreground hover:text-link">
                        {e.title}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 公式SNSをフォロー */}
          <section
            aria-labelledby="follow-sns-heading"
            className="rounded-md border border-border bg-surface p-3"
          >
            <h2
              id="follow-sns-heading"
              className="mb-2 text-sm font-bold text-foreground"
            >
              公式SNSをフォロー
            </h2>
            <ul className="flex flex-col gap-1.5 text-xs">
              <li>
                <a
                  href="https://x.com/tech_event"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 w-full items-center justify-center rounded-md border border-border bg-background px-3 hover:bg-brand-orange-soft/50"
                >
                  X (旧 Twitter)
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/tech_event"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 w-full items-center justify-center rounded-md border border-border bg-background px-3 hover:bg-brand-orange-soft/50"
                >
                  Facebook
                </a>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

/* ============================================================
 * 検索フィルタパネル (このページ内に閉じた Server Component)
 *
 * - `<form method="get" action="/explore">` で JS なしでも動く
 * - 現在の絞り込みを `defaultValue` / `defaultChecked` / `selected` で復元
 * ============================================================ */

function SearchFilterPanel({ filters }: { filters: ParsedFilters }) {
  return (
    <form
      role="search"
      action="/explore"
      method="get"
      aria-label="イベント検索フィルタ"
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">絞り込み</h2>
        <Link
          href="/explore"
          className="text-xs text-link hover:underline"
          aria-label="絞り込みをリセット"
        >
          リセット
        </Link>
      </div>

      {/* キーワード */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="filter-q"
          className="text-xs font-semibold text-muted-foreground"
        >
          キーワード
        </label>
        <input
          id="filter-q"
          type="search"
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="例: React, AWS"
          className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:border-brand-orange focus:outline-none"
        />
      </div>

      {/* 都道府県 */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="filter-pref"
          className="text-xs font-semibold text-muted-foreground"
        >
          開催地
        </label>
        <select
          id="filter-pref"
          name="prefecture"
          defaultValue={filters.prefecture ?? ""}
          className="h-9 rounded-md border border-border bg-background px-2 text-sm focus:border-brand-orange focus:outline-none"
        >
          <option value="">指定なし</option>
          {PREFECTURES.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* オンライン */}
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-xs font-semibold text-muted-foreground">
          開催形式
        </legend>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="online"
            value="1"
            defaultChecked={filters.online}
            className="h-4 w-4 rounded border-border accent-brand-orange"
          />
          オンラインのみ
        </label>
      </fieldset>

      {/* タグ */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="filter-tag"
          className="text-xs font-semibold text-muted-foreground"
        >
          タグ (slug)
        </label>
        <input
          id="filter-tag"
          type="text"
          name="tag"
          defaultValue={filters.tag ?? ""}
          placeholder="例: python"
          className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:border-brand-orange focus:outline-none"
        />
      </div>

      {/* 並び順 */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="filter-order"
          className="text-xs font-semibold text-muted-foreground"
        >
          表示順
        </label>
        <select
          id="filter-order"
          name="order"
          defaultValue={filters.order}
          className="h-9 rounded-md border border-border bg-background px-2 text-sm focus:border-brand-orange focus:outline-none"
        >
          <option value="new">新着順</option>
          <option value="popular">人気順</option>
          <option value="started_at">開催日順</option>
        </select>
      </div>

      <button
        type="submit"
        className="inline-flex h-10 w-full items-center justify-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white hover:bg-brand-orange-hover"
      >
        絞り込む
      </button>
    </form>
  );
}

/* ============================================================
 * 内部 UI ヘルパー
 * ============================================================ */

/**
 * ソートタブ。connpass 本家の「新着 / 人気 / 開催日」と同等。
 * URL `?order=` と同期し、アクティブはオレンジ下線+太字。
 */
function SortTab({
  label,
  active,
  href,
}: {
  label: string;
  active: boolean;
  href: string;
}) {
  return (
    <Link
      role="tab"
      aria-selected={active}
      href={href}
      className={
        active
          ? "border-b-2 border-brand-orange px-4 py-2 text-sm font-bold text-brand-orange"
          : "border-b-2 border-transparent px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
      }
    >
      {label}
    </Link>
  );
}

function EmptyResult({ filters }: { filters: ParsedFilters }) {
  const hasFilters = !!(
    filters.q ||
    filters.tag ||
    filters.prefecture ||
    filters.online
  );
  return (
    <EmptyState
      icon={SearchX}
      title="該当するイベントが見つかりませんでした"
      description="検索条件を変えて再度お試しください。"
      action={
        hasFilters ? (
          <Link
            href="/explore"
            className="inline-flex h-9 items-center justify-center rounded-md border border-border-strong bg-background px-4 text-sm font-semibold text-foreground hover:bg-brand-orange-soft"
          >
            検索条件をリセット
          </Link>
        ) : undefined
      }
    />
  );
}
