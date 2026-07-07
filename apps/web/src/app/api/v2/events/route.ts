/**
 * GET /api/v2/events/
 *
 * connpass v2 互換のイベント検索 API。
 *
 * 対応クエリパラメータ:
 *  - `event_id`         : イベントID (カンマ区切り複数可)
 *  - `keyword`          : タイトル/キャッチ/概要/住所 への AND 部分一致 (カンマ区切り複数可)
 *  - `keyword_or`       : タイトル/キャッチ/概要/住所 への OR 部分一致 (カンマ区切り複数可)
 *  - `nickname`         : 参加者ニックネーム (カンマ区切り複数可)
 *  - `owner_nickname`   : 主催者ニックネーム (カンマ区切り複数可)
 *  - `group_id`         : グループID (カンマ区切り複数可)
 *  - `subdomain`        : グループ subdomain (カンマ区切り複数可)
 *  - `prefecture`       : 都道府県スラグ。`online` で online format に絞り込み
 *  - `online`           : "true"/"1" で online イベントのみに絞り込み (拡張)
 *  - `ym`               : `yyyymm` (開催年月。複数指定はカンマ区切り)
 *  - `ymd`              : `yyyymmdd` (開催年月日。複数指定はカンマ区切り)
 *  - `publish_ym`       : `yyyymm` (公開年月。複数指定はカンマ区切り)
 *  - `publish_ymd`      : `yyyymmdd` (公開年月日。複数指定はカンマ区切り)
 *  - `order`            : 1=updated_at desc, 2=started_at asc, 3=accepted desc
 *  - `start` / `count`  : ページング
 *
 * レスポンス: `{ results_start, results_returned, results_available, events: [...] }`
 *
 * 注: connpass の `prefecture` は都道府県スラグ enum (`tokyo` 等) だが、本実装の
 *     Event テーブルには都道府県カラムがないため、`address` への部分一致で代替する。
 *     完全な enum マッピングは要追加 (TODO)。
 *
 * POST /api/v2/events/
 *
 * イベント作成 (書き込み API)。
 *  - 認証: DB 発行キー (`ApiKey`) の write スコープ必須 (`guardRequestWithDb`)。
 *    env キー (`PUBLIC_API_KEY`) はユーザーに紐づかないため書き込み不可 (403)。
 *  - 認可: キー発行ユーザーが対象 group の owner/admin であること。
 *  - レスポンス: GET の events[] 要素と同じ形 (serializeForApi) を 201 で返す。
 */
import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  corsPreflightResponse,
  errorResponse,
  guardRequest,
  guardRequestWithDb,
  jsonResponse,
  parsePaging,
  serializeForApi,
} from "@/lib/public-api";
import { nextId, withRetry } from "@/lib/id-gen";
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

  // keyword_or: 各キーワードを OR 部分一致。`searchEvents` の検索演算子 `OR` を
  // 利用するため、各キーワードをフレーズ quote して `OR` で連結する
  // (FTS5 / LIKE フォールバック両対応)。
  const keywordsOr = multi(searchParams, "keyword_or");
  if (keywordsOr.length > 0) {
    const orQuery = keywordsOr
      .map((k) => `"${k.replace(/"/g, '""')}"`)
      .join(" OR ");
    const ids = await searchEvents(orQuery, { limit: 1000 });
    if (ids !== null) {
      andConditions.push({ id: { in: ids } });
    }
  }

  // subdomain: グループの subdomain
  const subdomains = multi(searchParams, "subdomain");
  if (subdomains.length > 0) {
    andConditions.push({
      group: { subdomain: { in: subdomains } },
    });
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

  // publish_ym / publish_ymd: 公開日時 (publishedAt) に対する範囲絞り込み。
  // 開催日 (ym/ymd) とは独立した条件として AND 合成する (connpass v2 準拠)。
  const publishYmRanges = multi(searchParams, "publish_ym")
    .map(ymToRange)
    .filter((r): r is { gte: Date; lt: Date } => r !== null);
  const publishYmdRanges = multi(searchParams, "publish_ymd")
    .map(ymdToRange)
    .filter((r): r is { gte: Date; lt: Date } => r !== null);
  const publishRanges = [...publishYmRanges, ...publishYmdRanges];
  if (publishRanges.length > 0) {
    andConditions.push({
      OR: publishRanges.map((r) => ({
        publishedAt: { gte: r.gte, lt: r.lt },
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

/* ============================================================
 * POST /api/v2/events/ — イベント作成
 * ============================================================ */

/**
 * 作成リクエストボディ (JSON)。フィールド名は GET レスポンス (connpass v2 互換)
 * の snake_case に揃える。`limit` = 定員 (connpass の `limit` と同義)。
 */
const CreateEventBodySchema = z.object({
  group_id: z.union([
    z.number().int().positive(),
    z.string().regex(/^\d+$/, "group_id must be a positive integer"),
  ]),
  title: z.string().trim().min(1).max(200),
  catch: z.string().max(300).optional(),
  description: z.string().max(50_000).optional(),
  event_format: z.enum(["offline", "online", "hybrid"]).default("offline"),
  place: z.string().max(200).optional(),
  address: z.string().max(300).optional(),
  online_url: z
    .string()
    .url()
    .max(500)
    .refine(
      (u) => u.startsWith("http://") || u.startsWith("https://"),
      "online_url must be an http(s) URL",
    )
    .optional(),
  hash_tag: z.string().max(120).optional(),
  started_at: z.string().min(1),
  ended_at: z.string().min(1),
  limit: z.number().int().min(0).max(100_000).optional(),
  status: z.enum(["draft", "published"]).default("published"),
});

/** ISO 8601 (またはパース可能な日時文字列) → Date。不正なら null。 */
function parseIsoDate(raw: string): Date | null {
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function POST(request: NextRequest): Promise<Response> {
  // 認証 + write スコープ + レート制限。
  // env キー (PUBLIC_API_KEY) は read 専用なのでここで 403 になる。
  const guard = await guardRequestWithDb(request, "write");
  if (!guard.ok) return guard.response;
  const { auth } = guard;

  if (auth.userId === undefined) {
    return errorResponse(
      403,
      "forbidden",
      "This API key is not associated with a user account",
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return errorResponse(400, "bad_request", "Request body must be valid JSON");
  }

  const parsed = CreateEventBodySchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return errorResponse(
      400,
      "bad_request",
      `${issue?.path.join(".") || "body"}: ${issue?.message ?? "invalid"}`,
    );
  }
  const body = parsed.data;

  const startedAt = parseIsoDate(body.started_at);
  const endedAt = parseIsoDate(body.ended_at);
  if (!startedAt || !endedAt) {
    return errorResponse(
      400,
      "bad_request",
      "started_at / ended_at must be valid ISO 8601 datetimes",
    );
  }
  if (endedAt <= startedAt) {
    return errorResponse(
      400,
      "bad_request",
      "ended_at must be after started_at",
    );
  }

  const groupId = BigInt(body.group_id);
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    return errorResponse(404, "not_found", `Group ${groupId.toString()} not found`);
  }

  // 認可: キー発行ユーザーが group の owner/admin であること (Server 側で厳格チェック)
  const admin = await prisma.groupAdmin.findUnique({
    where: { groupId_userId: { groupId, userId: auth.userId } },
  });
  if (!admin || (admin.role !== "owner" && admin.role !== "admin")) {
    return errorResponse(
      403,
      "forbidden",
      "API key user must be an owner or admin of the target group",
    );
  }

  const owner = await prisma.user.findUnique({ where: { id: auth.userId } });
  if (!owner || owner.status !== "active") {
    return errorResponse(403, "forbidden", "API key user is not active");
  }

  const now = new Date();
  const isPublished = body.status === "published";

  // 採番レース (P2002) は withRetry で吸収 (feature-host-dashboard createEvent と同じ規約)
  const created = await withRetry(() =>
    prisma.$transaction(async (tx) => {
      const eventId = await nextId(tx, "event");
      const event = await tx.event.create({
        data: {
          id: eventId,
          groupId,
          title: body.title,
          catchPhrase: body.catch || null,
          description: body.description || null,
          hashTag: body.hash_tag || null,
          eventType: "participation",
          eventFormat: body.event_format,
          startedAt,
          endedAt,
          place: body.place || null,
          address: body.address || null,
          onlineUrl: body.online_url || null,
          capacity: body.limit ?? null,
          visibility: isPublished ? "public" : "draft",
          status: body.status,
          recruitmentMethod: "fcfs",
          ownerId: owner.id,
          ownerDisplayName: owner.displayName,
          publishedAt: isPublished ? now : null,
        },
      });
      // デフォルト参加枠 (UI の createEvent と同じフォールバック「一般」)
      await tx.eventRole.create({
        data: {
          id: await nextId(tx, "eventRole"),
          eventId,
          displayOrder: 1,
          name: "一般",
          capacity: body.limit ?? null,
          pricingType: "free",
          price: 0,
        },
      });
      return event;
    }),
  );

  // レスポンスは GET の events[] 要素と同じ形 (フィールド・命名を揃える)
  const protocol = request.headers.get("x-forwarded-proto") ?? "http";
  const host = request.headers.get("host") ?? "localhost:3000";
  const base = `${protocol}://${host}`;

  return jsonResponse(
    serializeForApi({
      id: Number(created.id),
      title: created.title,
      catch: created.catchPhrase,
      description: created.description,
      url: `${base}/event/${created.id.toString()}`,
      image_url: created.coverImageUrl,
      hash_tag: created.hashTag,
      started_at: created.startedAt.toISOString(),
      ended_at: created.endedAt.toISOString(),
      published_at: created.publishedAt
        ? created.publishedAt.toISOString()
        : null,
      limit: created.capacity,
      event_type: created.eventType,
      open_status: deriveOpenStatus(
        created.status,
        created.startedAt,
        created.endedAt,
      ),
      group: {
        id: Number(group.id),
        subdomain: group.subdomain,
        title: group.name,
        url: `${base}/group/${group.id.toString()}`,
      },
      address: created.address,
      place: created.place,
      lat: created.lat,
      lon: created.lon,
      owner_id: Number(created.ownerId),
      owner_nickname: owner.nickname,
      owner_display_name: created.ownerDisplayName ?? owner.displayName,
      accepted: created.acceptedCount,
      waiting: created.waitingCount,
      updated_at: created.updatedAt.toISOString(),
    }),
    { status: 201 },
  );
}
