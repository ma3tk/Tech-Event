/**
 * Calendar 一覧ページ (Server Component)
 *
 * Query:
 *  - q     フリーワード (name / description にマッチ)
 *  - order new(default) | popular  (新着=createdAt降順, 人気=subscriberCount降順)
 *  - page  1始まり
 *
 * Luma の Calendar 一覧に相当する軽量キュレーション一覧。
 */
import type { Metadata } from "next";
import Link from "next/link";

import Breadcrumb from "@/components/Breadcrumb";
import Pagination from "@/components/Pagination";

import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo";
import { loadDict, t } from "@/lib/i18n";
import type { Prisma } from "@/generated/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type CalendarListSearchParams = {
  q?: string;
  order?: string;
  page?: string;
};

export const metadata: Metadata = {
  title: "カレンダー一覧 - tech-event",
  description:
    "テーマ別の技術カレンダーを購読して、興味のあるイベントの新着を逃さない。",
  alternates: { canonical: absoluteUrl("/calendars") },
};

type ParsedFilters = {
  q?: string;
  order: "new" | "popular";
  page: number;
};

function parseFilters(sp: CalendarListSearchParams): ParsedFilters {
  const order = sp.order === "popular" ? "popular" : "new";
  const page = (() => {
    const n = sp.page ? Number(sp.page) : 1;
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
  })();
  return {
    q: sp.q?.trim() || undefined,
    order,
    page,
  };
}

function buildWhere(f: ParsedFilters): Prisma.CalendarWhereInput {
  const where: Prisma.CalendarWhereInput = { status: "active" };
  if (f.q) {
    where.OR = [
      { name: { contains: f.q } },
      { description: { contains: f.q } },
      { slug: { contains: f.q } },
    ];
  }
  return where;
}

function buildOrderBy(
  f: ParsedFilters,
): Prisma.CalendarOrderByWithRelationInput {
  return f.order === "popular"
    ? { subscriberCount: "desc" }
    : { createdAt: "desc" };
}

function buildHref(base: ParsedFilters, page: number): string {
  const u = new URLSearchParams();
  if (base.q) u.set("q", base.q);
  if (base.order !== "new") u.set("order", base.order);
  if (page > 1) u.set("page", page.toString());
  const q = u.toString();
  return q ? `/calendars?${q}` : "/calendars";
}

export default async function CalendarsListPage({
  searchParams,
}: {
  searchParams: Promise<CalendarListSearchParams>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const where = buildWhere(filters);
  const orderBy = buildOrderBy(filters);

  const [total, rows] = await Promise.all([
    prisma.calendar.count({ where }),
    prisma.calendar.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { owner: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const { dict, locale } = await loadDict();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: t(dict, "calendar.title") },
        ]}
      />

      <header className="mt-4 mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            data-testid="calendars-title"
            className="text-2xl font-bold text-foreground"
          >
            {t(dict, "calendar.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            該当{" "}
            <span className="text-brand-orange">
              {new Intl.NumberFormat(locale === "en" ? "en-US" : "ja-JP").format(total)}
            </span>{" "}
            件のカレンダー
          </p>
        </div>

        <div className="flex items-center gap-3">
          <nav
            aria-label="表示順を変更"
            className="flex gap-3 text-sm text-muted-foreground"
          >
            <Link
              href={buildHref({ ...filters, order: "new", page: 1 }, 1)}
              aria-current={filters.order === "new" ? "page" : undefined}
              className={
                filters.order === "new"
                  ? "font-semibold text-brand-orange"
                  : "hover:text-foreground hover:underline"
              }
            >
              新着順
            </Link>
            <Link
              href={buildHref({ ...filters, order: "popular", page: 1 }, 1)}
              aria-current={filters.order === "popular" ? "page" : undefined}
              className={
                filters.order === "popular"
                  ? "font-semibold text-brand-orange"
                  : "hover:text-foreground hover:underline"
              }
            >
              購読者数順
            </Link>
          </nav>
          <Link
            href="/calendar/create"
            data-testid="calendars-create-link"
            className="inline-flex h-9 items-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white shadow hover:bg-brand-orange-hover"
          >
            カレンダーを作る
          </Link>
        </div>
      </header>

      {/* 検索フォーム */}
      <form
        role="search"
        action="/calendars"
        method="get"
        className="mb-6 flex gap-2"
      >
        <label htmlFor="calendar-search-q" className="sr-only">
          カレンダー名で検索
        </label>
        <input
          id="calendar-search-q"
          name="q"
          type="search"
          defaultValue={filters.q ?? ""}
          placeholder="カレンダー名・キーワードで検索"
          className="h-10 flex-1 rounded-md border border-border bg-surface px-3 text-sm placeholder:text-muted focus:border-brand-orange focus:outline-none"
        />
        {filters.order !== "new" && (
          <input type="hidden" name="order" value={filters.order} />
        )}
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white hover:bg-brand-orange-hover"
        >
          検索
        </button>
      </form>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-lg font-semibold text-foreground">
            該当するカレンダーが見つかりませんでした
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            条件を変えて再度お試しください。
          </p>
        </div>
      ) : (
        <ul
          data-testid="calendar-list"
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {rows.map((c) => (
            <li key={c.id.toString()}>
              <Link
                href={`/calendar/${c.slug}`}
                data-testid={`calendar-list-item-${c.slug}`}
                className="flex h-full overflow-hidden rounded-md border border-border bg-surface transition-colors hover:border-brand-orange"
              >
                <div
                  className="flex w-24 shrink-0 items-center justify-center text-xl font-bold text-white"
                  style={{ backgroundColor: c.tintColor ?? "#5b21b6" }}
                  aria-hidden="true"
                >
                  {c.name.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1 p-4">
                  <p className="text-xs text-muted-foreground">
                    /calendar/{c.slug}
                  </p>
                  <h2 className="line-clamp-1 text-base font-semibold text-foreground">
                    {c.name}
                  </h2>
                  {c.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {c.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    購読者 {new Intl.NumberFormat(locale === "en" ? "en-US" : "ja-JP").format(c.subscriberCount)} 人 ・
                    イベント {new Intl.NumberFormat(locale === "en" ? "en-US" : "ja-JP").format(c.eventCount)} 件
                  </p>
                </div>
              </Link>
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
    </div>
  );
}
