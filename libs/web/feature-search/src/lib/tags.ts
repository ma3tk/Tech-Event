/**
 * タグ関連のクエリヘルパー (タグフォロー / 関連タグ / タグサジェスト)。
 *
 * Server Action は `tag-follow-actions.ts` に分離してある。本モジュールは
 * 読み取り専用クエリのみで、Server Component から直接 await して使う想定
 * (`"use server"` を付けないことで、クライアントから任意引数で叩ける
 * エンドポイントとして公開されないようにしている)。
 *
 * - `getTagBySlug(slug)`          : slug → Tag (見つからなければ null)
 * - `isFollowingTag(userId, tagId)`: フォロー済みか
 * - `listFollowedTags(userId)`    : フォロー中タグ一覧 (新しい順、件数付き)
 * - `countTagFollowers(tagId)`    : タグのフォロワー数
 * - `relatedTags(tagId, limit)`   : EventTag 共起ベースの関連タグ
 * - `suggestTags(query, limit)`   : 前方一致 + usageCount 順のサジェスト
 */

import { prisma } from "@/lib/prisma";

/** 一覧/チップ表示に必要な最小限のタグ情報 */
export interface TagSummary {
  id: bigint;
  name: string;
  slug: string;
  usageCount: number;
}

/** 関連タグ (共起回数付き) */
export interface RelatedTag extends TagSummary {
  /** 同じイベントに一緒に付けられていた回数 (共起イベント数) */
  coOccurrence: number;
}

/** フォロー中タグ (フォロー日時 + フォロワー数付き) */
export interface FollowedTag extends TagSummary {
  followedAt: Date;
  followerCount: number;
}

/** slug からタグを 1 件引く。存在しなければ null。 */
export async function getTagBySlug(slug: string): Promise<TagSummary | null> {
  const s = slug.trim();
  if (!s) return null;
  const tag = await prisma.tag.findUnique({
    where: { slug: s },
    select: { id: true, name: true, slug: true, usageCount: true },
  });
  return tag;
}

/** userId が tagId をフォロー済みか。 */
export async function isFollowingTag(
  userId: bigint,
  tagId: bigint,
): Promise<boolean> {
  const row = await prisma.tagFollow.findUnique({
    where: { userId_tagId: { userId, tagId } },
    select: { id: true },
  });
  return row !== null;
}

/** タグのフォロワー数。 */
export async function countTagFollowers(tagId: bigint): Promise<number> {
  return prisma.tagFollow.count({ where: { tagId } });
}

/**
 * ユーザーのフォロー中タグ一覧 (フォローした順の降順)。
 *
 * `/following/tags` ページで使う。フォロワー数は `_count` で同時取得する。
 */
export async function listFollowedTags(userId: bigint): Promise<FollowedTag[]> {
  const rows = await prisma.tagFollow.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      tag: {
        select: {
          id: true,
          name: true,
          slug: true,
          usageCount: true,
          _count: { select: { followers: true } },
        },
      },
    },
  });
  return rows.map((r) => ({
    id: r.tag.id,
    name: r.tag.name,
    slug: r.tag.slug,
    usageCount: r.tag.usageCount,
    followedAt: r.createdAt,
    followerCount: r.tag._count.followers,
  }));
}

/**
 * relatedTags — EventTag の共起 (co-occurrence) ベースの関連タグ算出。
 *
 * アルゴリズム:
 *  1. 対象タグが付いているイベント id を収集 (直近 `MAX_COOCCURRENCE_EVENTS` 件)
 *  2. それらのイベントに付いている「対象タグ以外」のタグを groupBy で集計
 *  3. 共起イベント数の降順 → usageCount の降順で上位 `limit` 件を返す
 *
 * raw SQL を使わず Prisma の `groupBy` で完結させているため、
 * SQLite / PostgreSQL の両スキーマでそのまま動く。
 */
export async function relatedTags(
  tagId: bigint,
  limit = 10,
): Promise<RelatedTag[]> {
  const take = Math.min(Math.max(1, limit), 50);

  // 1. 対象タグが付いているイベント id (集計コスト上限のため件数を制限)
  const MAX_COOCCURRENCE_EVENTS = 1000;
  const eventRows = await prisma.eventTag.findMany({
    where: { tagId },
    select: { eventId: true },
    take: MAX_COOCCURRENCE_EVENTS,
  });
  if (eventRows.length === 0) return [];
  const eventIds = eventRows.map((r) => r.eventId);

  // 2. 同じイベントに付いている他タグを共起回数で集計
  const grouped = await prisma.eventTag.groupBy({
    by: ["tagId"],
    where: { eventId: { in: eventIds }, tagId: { not: tagId } },
    _count: { eventId: true },
    orderBy: [{ _count: { eventId: "desc" } }, { tagId: "asc" }],
    take,
  });
  if (grouped.length === 0) return [];

  // 3. タグ本体を引いて共起回数を合成 (groupBy の順序を維持)
  const tagIds = grouped.map((g) => g.tagId);
  const tags = await prisma.tag.findMany({
    where: { id: { in: tagIds } },
    select: { id: true, name: true, slug: true, usageCount: true },
  });
  const byId = new Map(tags.map((t) => [t.id.toString(), t]));

  const result: RelatedTag[] = [];
  for (const g of grouped) {
    const tag = byId.get(g.tagId.toString());
    if (!tag) continue;
    result.push({ ...tag, coOccurrence: g._count.eventId });
  }
  // 共起数が同じもの同士は usageCount 降順に並べ替え (人気タグを優先)
  result.sort(
    (a, b) => b.coOccurrence - a.coOccurrence || b.usageCount - a.usageCount,
  );
  return result;
}

/**
 * suggestTags — タグ名 / slug の前方一致 + usageCount 降順のサジェスト。
 *
 * - `query` は trim して使用。空なら空配列 (呼び出し側で人気タグ表示などに
 *   フォールバックする想定)。
 * - name (表示名, 例 "Next.js") と slug (例 "next-js") の両方に前方一致させる
 *   ため、「next」でも「Next」でもヒットする (SQLite の LIKE は ASCII
 *   大文字小文字を区別しない)。
 */
export async function suggestTags(
  query: string,
  limit = 8,
): Promise<TagSummary[]> {
  const q = (query ?? "").trim();
  if (!q) return [];
  const take = Math.min(Math.max(1, limit), 50);
  return prisma.tag.findMany({
    where: {
      OR: [
        { name: { startsWith: q } },
        { slug: { startsWith: q.toLowerCase() } },
      ],
    },
    orderBy: [{ usageCount: "desc" }, { name: "asc" }],
    take,
    select: { id: true, name: true, slug: true, usageCount: true },
  });
}
