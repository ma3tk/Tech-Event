/**
 * グループ一覧ページ (Server Component)
 *
 * Query:
 *  - q     フリーワード (name / subtitle / description にマッチ)
 *  - order new(default) | popular   (新着=publishedAt降順, 人気=memberCount降順)
 *  - page  1始まり
 *
 * 20件/page で表示し、Pagination で前後ページへ遷移。
 */
import type { Metadata } from "next";
import Link from "next/link";

import Breadcrumb from "@/components/Breadcrumb";
import GroupCard from "@/components/GroupCard";
import Pagination from "@/components/Pagination";

import { prisma } from "@/lib/prisma";
import { toGroupCardData } from "@/lib/group-card";
import type { Prisma } from "@/generated/prisma";

const PAGE_SIZE = 20;

type GroupListSearchParams = {
  q?: string;
  order?: string;
  page?: string;
};

export const metadata: Metadata = {
  title: "グループ一覧 - tech-event",
  description: "IT勉強会を主催しているコミュニティを探せます。",
};

type ParsedFilters = {
  q?: string;
  order: "new" | "popular";
  page: number;
};

function parseFilters(sp: GroupListSearchParams): ParsedFilters {
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

function buildWhere(f: ParsedFilters): Prisma.GroupWhereInput {
  const where: Prisma.GroupWhereInput = { status: "active" };
  if (f.q) {
    where.OR = [
      { name: { contains: f.q } },
      { subtitle: { contains: f.q } },
      { description: { contains: f.q } },
    ];
  }
  return where;
}

function buildOrderBy(f: ParsedFilters): Prisma.GroupOrderByWithRelationInput {
  return f.order === "popular"
    ? { memberCount: "desc" }
    : { publishedAt: "desc" };
}

function buildHref(base: ParsedFilters, page: number): string {
  const u = new URLSearchParams();
  if (base.q) u.set("q", base.q);
  if (base.order !== "new") u.set("order", base.order);
  if (page > 1) u.set("page", page.toString());
  const q = u.toString();
  return q ? `/explore/groups?${q}` : "/explore/groups";
}

export default async function GroupsListPage({
  searchParams,
}: {
  searchParams: Promise<GroupListSearchParams>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const where = buildWhere(filters);
  const orderBy = buildOrderBy(filters);

  const [total, rows] = await Promise.all([
    prisma.group.count({ where }),
    prisma.group.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const groups = rows.map(toGroupCardData);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: "グループ一覧" },
        ]}
      />

      <header className="mt-4 mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">グループ一覧</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            該当{" "}
            <span className="text-brand-orange">
              {new Intl.NumberFormat("ja-JP").format(total)}
            </span>{" "}
            グループ
          </p>
        </div>

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
            メンバー数順
          </Link>
        </nav>
      </header>

      {/* 簡易検索フォーム */}
      <form
        role="search"
        action="/explore/groups"
        method="get"
        className="mb-6 flex gap-2"
      >
        <label htmlFor="group-search-q" className="sr-only">
          グループ名で検索
        </label>
        <input
          id="group-search-q"
          name="q"
          type="search"
          defaultValue={filters.q ?? ""}
          placeholder="グループ名・キーワードで検索"
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

      {groups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-lg font-semibold text-foreground">
            該当するグループが見つかりませんでした
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            条件を変えて再度お試しください。
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {groups.map((g) => (
            <li key={g.id}>
              <GroupCard group={g} />
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
