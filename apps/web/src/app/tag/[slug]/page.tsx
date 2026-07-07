/**
 * タグ詳細ページ (Server Component)
 *
 * URL: `/tag/{slug}` (例: `/tag/python`)
 *
 * - そのタグが付いた公開イベント一覧 (新着順、20件/page + ページネーション)。
 *   絞り込みロジックは /explore の `?tag=` と同じ
 *   (`tags: { some: { tag: { slug } } }` + published / public)。
 * - フォロー / 解除ボタン (未ログインは /login 誘導) + フォロワー数。
 * - 関連タグ (EventTag 共起ベース `relatedTags()`) のチップ表示。
 *
 * Query:
 *  - page  1始まり
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Breadcrumb from "@/components/Breadcrumb";
import EventListRow from "@/components/EventListRow";
import Pagination from "@/components/Pagination";
import TagPill from "@/components/TagPill";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarX } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { toEventCardData } from "@/lib/event-card";
import type { Prisma } from "@/generated/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  DEFAULT_LOCALE,
  SITE_NAME,
  absoluteUrl,
} from "@/lib/seo";
import {
  countTagFollowers,
  getTagBySlug,
  isFollowingTag,
  relatedTags,
} from "@tech-event/web-feature-search";

import TagFollowButton from "../TagFollowButton";

const PAGE_SIZE = 20;
const RELATED_TAGS_LIMIT = 10;

type TagPageParams = Promise<{ slug: string }>;
type TagPageSearchParams = Promise<{ page?: string }>;

export async function generateMetadata({
  params,
}: {
  params: TagPageParams;
}): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const tag = await getTagBySlug(slug);
  if (!tag) {
    return { title: "タグが見つかりません" };
  }
  const title = `${tag.name} のイベント一覧`;
  const description = `「${tag.name}」タグが付いたIT勉強会・カンファレンス・ミートアップの一覧です。タグをフォローすると関連イベントを見つけやすくなります。`;
  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(`/tag/${tag.slug}`),
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/tag/${tag.slug}`),
      siteName: SITE_NAME,
      locale: DEFAULT_LOCALE,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

function parsePage(raw: string | undefined): number {
  const n = raw ? Number(raw) : 1;
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: TagPageParams;
  searchParams: TagPageSearchParams;
}) {
  const [{ slug: rawSlug }, sp] = await Promise.all([params, searchParams]);
  const slug = decodeURIComponent(rawSlug);
  const tag = await getTagBySlug(slug);
  if (!tag) notFound();

  const page = parsePage(sp.page);
  const user = await getCurrentUser();

  // /explore の `?tag=` 絞り込みと同じ条件 (published / public のみ)
  const where: Prisma.EventWhereInput = {
    status: "published",
    visibility: "public",
    tags: { some: { tag: { slug: tag.slug } } },
  };

  const [following, followerCount, related, total, rows] = await Promise.all([
    user ? isFollowingTag(user.id, tag.id) : Promise.resolve(false),
    countTagFollowers(tag.id),
    relatedTags(tag.id, RELATED_TAGS_LIMIT),
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        group: true,
        tags: { include: { tag: true } },
      },
    }),
  ]);

  const events = rows.map((e) => toEventCardData(e));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: "イベントを探す", href: "/explore" },
          { label: `タグ「${tag.name}」` },
        ]}
      />

      {/* ============ ヘッダー: タグ名 + フォロー ============ */}
      <header
        data-testid="tag-header"
        className="mt-4 flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 md:flex-row md:items-center md:justify-between"
      >
        <div className="min-w-0">
          <h1 className="flex items-center gap-1.5 text-xl font-bold text-foreground md:text-2xl">
            <span aria-hidden="true" className="text-muted-foreground">
              #
            </span>
            <span className="truncate">{tag.name}</span>
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            イベント{" "}
            <span className="font-semibold text-foreground">
              {new Intl.NumberFormat("ja-JP").format(total)}
            </span>{" "}
            件 ・ フォロワー{" "}
            <span
              data-testid="tag-follower-count"
              className="font-semibold text-foreground"
            >
              {new Intl.NumberFormat("ja-JP").format(followerCount)}
            </span>{" "}
            人
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <TagFollowButton
            tagId={tag.id.toString()}
            slug={tag.slug}
            following={following}
            loggedIn={user !== null}
          />
          <Link
            href={`/explore?tag=${encodeURIComponent(tag.slug)}`}
            className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-brand-orange-soft"
          >
            検索で絞り込む
          </Link>
        </div>
      </header>

      {/* ============ 関連タグ ============ */}
      {related.length > 0 && (
        <section
          aria-labelledby="related-tags-heading"
          data-testid="related-tags"
          className="mt-4 rounded-lg border border-border bg-surface p-4"
        >
          <h2
            id="related-tags-heading"
            className="mb-2 text-sm font-bold text-foreground"
          >
            関連タグ
          </h2>
          <p className="mb-2 text-xs text-muted-foreground">
            「{tag.name}」と同じイベントによく付けられているタグです。
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {related.map((r) => (
              <li key={r.slug}>
                <TagPill
                  label={r.name}
                  href={`/tag/${encodeURIComponent(r.slug)}`}
                  count={r.coOccurrence}
                  size="md"
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ============ イベント一覧 ============ */}
      <main aria-labelledby="tag-events-heading" className="mt-6 min-w-0">
        <h2
          id="tag-events-heading"
          className="mb-3 text-base font-bold text-foreground"
        >
          「{tag.name}」のイベント
        </h2>

        {events.length === 0 ? (
          <EmptyState
            icon={CalendarX}
            title="このタグのイベントはまだありません"
            description="フォローしておくと、今後このタグのイベントを見つけやすくなります。"
            action={
              <Link
                href="/explore"
                className="inline-flex h-9 items-center justify-center rounded-md border border-border-strong bg-background px-4 text-sm font-semibold text-foreground hover:bg-brand-orange-soft"
              >
                イベントを探す
              </Link>
            }
          />
        ) : (
          <ul
            data-testid="tag-event-list"
            className="divide-y divide-border rounded-md border border-border bg-surface"
          >
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
              currentPage={page}
              totalPages={totalPages}
              buildHref={(p: number) =>
                p > 1
                  ? `/tag/${encodeURIComponent(tag.slug)}?page=${p}`
                  : `/tag/${encodeURIComponent(tag.slug)}`
              }
            />
          </div>
        )}
      </main>
    </div>
  );
}
