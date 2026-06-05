/**
 * GET /api/v2/calendars/
 *
 * Calendar 検索 (公開 API)。
 *
 * クエリ:
 *  - `slug`    (slug 完全一致、カンマ区切り複数可、最大 100)
 *  - `keyword` (name / description / slug への AND 部分一致、カンマ区切り複数可)
 *  - `start` / `count` (ページング)
 *
 * `slug` も `keyword` も無い場合は subscriberCount 降順で先頭ページを返す
 * (Group API とは違い、Calendar はキュレーション目的なので全件閲覧を許す)。
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

export const dynamic = "force-dynamic";

function multi(searchParams: URLSearchParams, key: string): string[] {
  const all = searchParams.getAll(key);
  const out: string[] = [];
  for (const raw of all) {
    for (const v of raw.split(",")) {
      const t = v.trim();
      if (t) out.push(t);
    }
  }
  return out;
}

export async function OPTIONS(): Promise<Response> {
  return corsPreflightResponse();
}

export async function GET(request: NextRequest): Promise<Response> {
  const guard = guardRequest(request);
  if (guard) return guard;

  const { searchParams } = new URL(request.url);
  const slugs = multi(searchParams, "slug").slice(0, 100);
  const keywords = multi(searchParams, "keyword");
  const paging = parsePaging(searchParams);

  const where: Prisma.CalendarWhereInput = { status: "active" };
  if (slugs.length > 0) {
    where.slug = { in: slugs };
  }
  if (keywords.length > 0) {
    where.AND = keywords.map((kw) => ({
      OR: [
        { name: { contains: kw } },
        { description: { contains: kw } },
        { slug: { contains: kw } },
      ],
    }));
  }

  const [total, rows] = await Promise.all([
    prisma.calendar.count({ where }),
    prisma.calendar.findMany({
      where,
      orderBy: { subscriberCount: "desc" },
      skip: paging.start - 1,
      take: paging.count,
      include: {
        owner: {
          select: { id: true, nickname: true, displayName: true },
        },
      },
    }),
  ]);

  const protocol = request.headers.get("x-forwarded-proto") ?? "http";
  const host = request.headers.get("host") ?? "localhost:3000";
  const base = `${protocol}://${host}`;

  const calendars = rows.map((c) => ({
    id: Number(c.id),
    slug: c.slug,
    name: c.name,
    description: c.description,
    cover_image_url: c.coverImageUrl,
    tint_color: c.tintColor,
    url: `${base}/calendar/${c.slug}`,
    ics_url: `${base}/calendar/${c.slug}/ics`,
    feed_url: `${base}/calendar/${c.slug}/feed.xml`,
    subscriber_count: c.subscriberCount,
    event_count: c.eventCount,
    owner: {
      id: Number(c.owner.id),
      nickname: c.owner.nickname,
      display_name: c.owner.displayName,
    },
    created_at: c.createdAt.toISOString(),
    updated_at: c.updatedAt.toISOString(),
  }));

  return jsonResponse(
    serializeForApi({
      results_start: paging.start,
      results_returned: calendars.length,
      results_available: total,
      calendars,
    }),
  );
}
