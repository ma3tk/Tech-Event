/**
 * グループ一覧ページ (= 「シリーズ」一覧)
 *
 * URL: `/series?q={keyword}&order={new|member|event}&page={n}`
 *
 * - キーワード検索: 名前 / サブタイトル / 説明への部分一致
 * - 並び順: 新着 / メンバー数 / イベント数
 * - ページネーション: 20 件/ページ
 */

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { serializeGroup } from "@/lib/serialize";
import { cn } from "@/lib/cn";
import { formatNumber, truncate } from "@/lib/utils";
import type { Prisma } from "@/generated/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type SearchParams = Promise<{
  q?: string;
  order?: string;
  page?: string;
}>;

export default async function GroupListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const order = (sp.order ?? "new") as "new" | "member" | "event";
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  // ============ where ============
  const where: Prisma.GroupWhereInput = {
    status: "active",
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { subtitle: { contains: q } },
            { description: { contains: q } },
          ],
        }
      : {}),
  };

  // ============ orderBy ============
  let orderBy: Prisma.GroupOrderByWithRelationInput;
  switch (order) {
    case "member":
      orderBy = { memberCount: "desc" };
      break;
    case "event":
      orderBy = { eventCount: "desc" };
      break;
    case "new":
    default:
      orderBy = { publishedAt: "desc" };
      break;
  }

  const [total, rows] = await Promise.all([
    prisma.group.count({ where }),
    prisma.group.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  const groups = rows.map(serializeGroup);
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const baseQuery = (overrides: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    const merged = { q, order, page, ...overrides };
    if (merged.q) params.set("q", String(merged.q));
    if (merged.order && merged.order !== "new") params.set("order", String(merged.order));
    if (merged.page && Number(merged.page) > 1) params.set("page", String(merged.page));
    const qs = params.toString();
    return qs ? `/series?${qs}` : "/series";
  };

  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold">グループを探す</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {q
            ? `「${q}」の検索結果: ${formatNumber(total)} 件`
            : `${formatNumber(total)} 件のグループ`}
        </p>

        {/* ============ 検索バー ============ */}
        <form action="/series" method="get" className="mt-4 flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="キーワードで検索"
            className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-brand-orange focus:outline-none"
          />
          {order && order !== "new" && (
            <input type="hidden" name="order" value={order} />
          )}
          <button
            type="submit"
            className="rounded-md bg-brand-orange px-4 py-2 text-sm font-semibold text-white hover:bg-brand-orange-hover"
          >
            検索
          </button>
        </form>

        {/* ============ 並び替えタブ ============ */}
        <nav className="mt-6 flex gap-1 border-b border-border">
          {[
            { key: "new", label: "新着順" },
            { key: "member", label: "メンバー数" },
            { key: "event", label: "開催数" },
          ].map((t) => (
            <Link
              key={t.key}
              href={baseQuery({ order: t.key, page: 1 })}
              className={cn(
                "border-b-2 px-4 py-2 text-sm font-medium",
                order === t.key
                  ? "border-brand-orange text-brand-orange"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {/* ============ 一覧 ============ */}
        {groups.length === 0 ? (
          <div className="mt-12 rounded-md border border-border bg-surface p-12 text-center">
            <p className="text-sm text-muted-foreground">
              条件に合うグループは見つかりませんでした。
            </p>
            {q && (
              <Link
                href="/series"
                className="mt-3 inline-block text-sm text-link hover:text-link-hover"
              >
                条件をリセット
              </Link>
            )}
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {groups.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/group/${g.subdomain}`}
                  className="flex h-full gap-4 rounded-md border border-border bg-surface p-4 transition hover:border-brand-orange"
                >
                  {g.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={g.thumbnailUrl}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md text-xl font-bold text-white"
                      style={{ backgroundColor: g.backgroundColor ?? "#1f63c1" }}
                    >
                      {g.name.slice(0, 1)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-1 text-base font-semibold text-foreground">
                      {g.name}
                    </h2>
                    {g.subtitle && (
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {g.subtitle}
                      </p>
                    )}
                    {g.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {truncate(g.description.replace(/[#*_>\[\]`]/g, ""), 100)}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>メンバー {formatNumber(g.memberCount)}</span>
                      <span>開催 {formatNumber(g.eventCount)}</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* ============ ページネーション ============ */}
        {lastPage > 1 && (
          <Pagination current={page} last={lastPage} buildHref={(p) => baseQuery({ page: p })} />
        )}
      </div>
    </div>
  );
}

function Pagination({
  current,
  last,
  buildHref,
}: {
  current: number;
  last: number;
  buildHref: (page: number) => string;
}) {
  const pages: number[] = [];
  const start = Math.max(1, current - 2);
  const end = Math.min(last, current + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav
      aria-label="ページネーション"
      className="mt-8 flex flex-wrap items-center justify-center gap-1"
    >
      {current > 1 && (
        <Link
          href={buildHref(current - 1)}
          className="rounded border border-border bg-surface px-3 py-2 text-sm hover:bg-zinc-50"
        >
          « 前へ
        </Link>
      )}
      {start > 1 && (
        <>
          <Link
            href={buildHref(1)}
            className="rounded border border-border bg-surface px-3 py-2 text-sm hover:bg-zinc-50"
          >
            1
          </Link>
          {start > 2 && <span className="px-2 text-muted-foreground">…</span>}
        </>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={buildHref(p)}
          aria-current={p === current ? "page" : undefined}
          className={cn(
            "rounded border px-3 py-2 text-sm",
            p === current
              ? "border-brand-orange bg-brand-orange text-white"
              : "border-border bg-surface hover:bg-zinc-50"
          )}
        >
          {p}
        </Link>
      ))}
      {end < last && (
        <>
          {end < last - 1 && <span className="px-2 text-muted-foreground">…</span>}
          <Link
            href={buildHref(last)}
            className="rounded border border-border bg-surface px-3 py-2 text-sm hover:bg-zinc-50"
          >
            {last}
          </Link>
        </>
      )}
      {current < last && (
        <Link
          href={buildHref(current + 1)}
          className="rounded border border-border bg-surface px-3 py-2 text-sm hover:bg-zinc-50"
        >
          次へ »
        </Link>
      )}
    </nav>
  );
}
