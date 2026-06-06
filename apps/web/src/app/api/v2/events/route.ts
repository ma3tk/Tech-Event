/**
 * GET /api/v2/events/
 *
 * connpass v2 互換のイベント検索 API。
 *
 * 対応クエリパラメータ:
 *  - `event_id`         : イベントID (カンマ区切り複数可)
 *  - `keyword`          : タイトル/キャッチ/概要/住所 への AND 部分一致 (カンマ区切り複数可)
 *  - `nickname`         : 参加者ニックネーム (カンマ区切り複数可)
 *  - `owner_nickname`   : 主催者ニックネーム (カンマ区切り複数可)
 *  - `group_id`         : グループID (カンマ区切り複数可)
 *  - `prefecture`       : 都道府県スラグ。`online` で online format に絞り込み
 *  - `online`           : "true"/"1" で online イベントのみに絞り込み (拡張)
 *  - `ym`               : `yyyymm` (開催年月。複数指定はカンマ区切り)
 *  - `ymd`              : `yyyymmdd` (開催年月日。複数指定はカンマ区切り)
 *  - `order`            : 1=updated_at desc, 2=started_at asc, 3=accepted desc
 *  - `start` / `count`  : ページング
 *
 * レスポンス: `{ results_start, results_returned, results_available, events: [...] }`
 *
 * 注: connpass の `prefecture` は都道府県スラグ enum (`tokyo` 等) だが、本実装の
 *     Event テーブルには都道府県カラムがないため、`address` への部分一致で代替する。
 *     完全な enum マッピングは要追加 (TODO)。
 */
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  corsPreflightResponse,
  guardRequest,
  jsonResponse,
  parsePaging,
  serializeForApi,
} from "@/lib/public-api";
import type { Prisma } from "@/generated/prisma";
import { searchEvents } from "@/lib/search";

export const dynamic = "force-dynamic";

/** クエリ文字列を「カンマ区切りまたは repeat」で配列化 */
function multi(searchParams: URLSearchParams, key: string): string[] {
  const all = searchParams.getAll(key);
  if (all.length === 0) return [];
  const out: string[] = [];
  for (const raw of all) {
    for (const v of raw.split(",")) {
      const trimmed = v.trim();
      if (trimmed) out.push(trimmed);
    }
  }
  return out;
}

/** "20260601" → Date 範囲 [start, end) */
function ymdToRange(ymd: string): { gte: Date; lt: Date } | null {
  const m = ymd.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const start = new Date(Date.UTC(y, mo - 1, d, 0, 0, 0));
  const end = new Date(Date.UTC(y, mo - 1, d + 1, 0, 0, 0));
  if (Number.isNaN(start.getTime())) return null;
  return { gte: start, lt: end };
}

/** "202606" → Date 範囲 [start, end) */
function ymToRange(ym: string): { gte: Date; lt: Date } | null {
  const m = ym.match(/^(\d{4})(\d{2})$/);
  if (!m) return null;
  const [y, mo] = [Number(m[1]), Number(m[2])];
  const start = new Date(Date.UTC(y, mo - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, mo, 1, 0, 0, 0));
  if (Number.isNaN(start.getTime())) return null;
  return { gte: start, lt: end };
}

export async function OPTIONS(): Promise<Response> {
  return corsPreflightResponse();
}

export async function GET(request: NextRequest): Promise<Response> {
  const guard = guardRequest(request);
  if (guard) return guard;

  const { searchParams } = new URL(request.url);
  const paging = parsePaging(searchParams);

  // 絞り込み条件構築
  const where: Prisma.EventWhereInput = {
    status: { in: ["published", "closed"] },
  };
  const andConditions: Prisma.EventWhereInput[] = [];

  // event_id
  const eventIds = multi(searchParams, "event_id")
    .map((v) => {
      const n = Number.parseInt(v, 10);
      return Number.isFinite(n) ? BigInt(n) : null;
    })
    .filter((v): v is bigint => v !== null);
  if (eventIds.length > 0) {
    where.id = { in: eventIds };
  }

  // group_id
  const groupIds = multi(searchParams, "group_id")
    .map((v) => {
      const n = Number.parseInt(v, 10);
      return Number.isFinite(n) ? BigInt(n) : null;
    })
    .filter((v): v is bigint => v !== null);
  if (groupIds.length > 0) {
    where.groupId = { in: groupIds };
  }

  // keyword: SQLite FTS5 (events_fts) を使った全文検索。
  // 複数 keyword は SPACE 区切りで joinして AND マッチを掛ける (`searchEvents`内部で
  // 自動的に AND 連結する)。FTS5 未対応のビルドでは LIKE フォールバックする。
  const keywords = multi(searchParams, "keyword");
  if (keywords.length > 0) {
    const ids = await searchEvents(keywords.join(" "), { limit: 1000 });
    if (ids !== null) {
      // 0 件の場合は空集合を AND して必ず 0 件にする
      andConditions.push({ id: { in: ids } });
    }
  }

  // owner_nickname: ownerユーザーのnickname
  const ownerNicknames = multi(searchParams, "owner_nickname");
  if (ownerNicknames.length > 0) {
    andConditions.push({
      owner: { nickname: { in: ownerNicknames } },
    });
  }

  // nickname: 参加者 (accepted) のnickname
  const nicknames = multi(searchParams, "nickname");
  if (nicknames.length > 0) {
    andConditions.push({
      participants: {
        some: {
          status: { in: ["accepted", "attended"] },
          user: { nickname: { in: nicknames } },
        },
      },
    });
  }

  // ym / ymd
  const ymRanges = multi(searchParams, "ym")
    .map(ymToRange)
    .filter((r): r is { gte: Date; lt: Date } => r !== null);
  const ymdRanges = multi(searchParams, "ymd")
    .map(ymdToRange)
    .filter((r): r is { gte: Date; lt: Date } => r !== null);
  const dateRanges = [...ymRanges, ...ymdRanges];
  if (dateRanges.length > 0) {
    andConditions.push({
      OR: dateRanges.map((r) => ({
        startedAt: { gte: r.gte, lt: r.lt },
      })),
    });
  }

  // online / prefecture
  const onlineParam = searchParams.get("online");
  const prefecture = searchParams.get("prefecture");
  if (
    onlineParam === "true" ||
    onlineParam === "1" ||
    prefecture === "online"
  ) {
    andConditions.push({ eventFormat: "online" });
  } else if (prefecture) {
    // 簡易: address に部分一致 (本来は都道府県カラム導入推奨)
    andConditions.push({ address: { contains: prefecture } });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  // 並び順
  const order = searchParams.get("order") ?? "1";
  let orderBy: Prisma.EventOrderByWithRelationInput | Prisma.EventOrderByWithRelationInput[];
  if (order === "2") {
    orderBy = { startedAt: "asc" };
  } else if (order === "3") {
    orderBy = { acceptedCount: "desc" };
  } else {
    orderBy = { updatedAt: "desc" };
  }

  const [total, rows] = await Promise.all([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      orderBy,
      skip: paging.start - 1,
      take: paging.count,
      include: {
        group: true,
        owner: true,
      },
    }),
  ]);

  const protocol = request.headers.get("x-forwarded-proto") ?? "http";
  const host = request.headers.get("host") ?? "localhost:3000";
  const base = `${protocol}://${host}`;

  const events = rows.map((e) => ({
    id: Number(e.id),
    title: e.title,
    catch: e.catchPhrase,
    description: e.description,
    url: `${base}/event/${e.id.toString()}`,
    image_url: e.coverImageUrl,
    hash_tag: e.hashTag,
    started_at: e.startedAt.toISOString(),
    ended_at: e.endedAt.toISOString(),
    published_at: e.publishedAt ? e.publishedAt.toISOString() : null,
    limit: e.capacity,
    event_type: e.eventType,
    open_status: deriveOpenStatus(e.status, e.startedAt, e.endedAt),
    group: {
      id: Number(e.group.id),
      subdomain: e.group.subdomain,
      title: e.group.name,
      url: `${base}/group/${e.group.id.toString()}`,
    },
    address: e.address,
    place: e.place,
    lat: e.lat,
    lon: e.lon,
    owner_id: Number(e.ownerId),
    owner_nickname: e.owner.nickname,
    owner_display_name: e.ownerDisplayName ?? e.owner.displayName,
    accepted: e.acceptedCount,
    waiting: e.waitingCount,
    updated_at: e.updatedAt.toISOString(),
  }));

  return jsonResponse(
    serializeForApi({
      results_start: paging.start,
      results_returned: events.length,
      results_available: total,
      events,
    }),
  );
}

function deriveOpenStatus(
  status: string,
  startedAt: Date,
  endedAt: Date,
): string {
  if (status === "cancelled") return "cancelled";
  const now = Date.now();
  if (now < startedAt.getTime()) return "preopen";
  if (now > endedAt.getTime()) return "close";
  return "open";
}
