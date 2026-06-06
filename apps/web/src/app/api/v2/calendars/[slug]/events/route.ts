/**
 * GET /api/v2/calendars/[slug]/events/
 *
 * 指定 Calendar に含まれるイベント一覧 (公開 API)。
 *
 * クエリ:
 *  - `order`            : 1=startedAt asc(default), 2=updatedAt desc
 *  - `start` / `count`  : ページング
 */
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  corsPreflightResponse,
  errorResponse,
  guardRequest,
  jsonResponse,
  parsePaging,
  serializeForApi,
} from "@/lib/public-api";
import type { Prisma } from "@/generated/prisma";

export const dynamic = "force-dynamic";

export async function OPTIONS(): Promise<Response> {
  return corsPreflightResponse();
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const guard = guardRequest(request);
  if (guard) return guard;

  const { slug } = await context.params;

  const calendar = await prisma.calendar.findUnique({
    where: { slug },
    select: { id: true, slug: true, status: true },
  });
  if (!calendar || calendar.status !== "active") {
    return errorResponse(404, "not_found", "calendar not found");
  }

  const { searchParams } = new URL(request.url);
  const paging = parsePaging(searchParams);

  const order = searchParams.get("order") ?? "1";
  const orderBy: Prisma.CalendarEventOrderByWithRelationInput =
    order === "2"
      ? { event: { updatedAt: "desc" } }
      : { event: { startedAt: "asc" } };

  const where: Prisma.CalendarEventWhereInput = {
    calendarId: calendar.id,
    event: { status: { in: ["published", "closed"] } },
  };

  const [total, rows] = await Promise.all([
    prisma.calendarEvent.count({ where }),
    prisma.calendarEvent.findMany({
      where,
      orderBy,
      skip: paging.start - 1,
      take: paging.count,
      include: {
        event: { include: { group: true, owner: true } },
      },
    }),
  ]);

  const protocol = request.headers.get("x-forwarded-proto") ?? "http";
  const host = request.headers.get("host") ?? "localhost:3000";
  const base = `${protocol}://${host}`;

  const events = rows.map((ce) => {
    const e = ce.event;
    return {
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
      group: {
        id: Number(e.group.id),
        subdomain: e.group.subdomain,
        title: e.group.name,
        url: `${base}/group/${e.group.id.toString()}`,
      },
      address: e.address,
      place: e.place,
      owner_id: Number(e.ownerId),
      owner_nickname: e.owner.nickname,
      accepted: e.acceptedCount,
      waiting: e.waitingCount,
      added_at: ce.addedAt.toISOString(),
    };
  });

  return jsonResponse(
    serializeForApi({
      calendar_slug: calendar.slug,
      results_start: paging.start,
      results_returned: events.length,
      results_available: total,
      events,
    }),
  );
}
