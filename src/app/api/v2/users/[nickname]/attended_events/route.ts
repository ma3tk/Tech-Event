/**
 * GET /api/v2/users/{nickname}/attended_events/
 *
 * 指定ユーザーが参加した (accepted / attended) イベント一覧。並び順は appliedAt 降順。
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
import { deriveBaseUrl, toApiEvent } from "@/lib/public-api-mappers";

export const dynamic = "force-dynamic";

export async function OPTIONS(): Promise<Response> {
  return corsPreflightResponse();
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ nickname: string }> },
): Promise<Response> {
  const guard = guardRequest(request);
  if (guard) return guard;

  const { nickname } = await context.params;
  const { searchParams } = new URL(request.url);
  const paging = parsePaging(searchParams);

  const user = await prisma.user.findUnique({
    where: { nickname },
    select: { id: true },
  });
  if (!user) {
    return errorResponse(404, "not_found", `User '${nickname}' not found`);
  }

  const where = {
    participants: {
      some: {
        userId: user.id,
        status: { in: ["accepted", "attended"] },
      },
    },
  };

  const [total, rows] = await Promise.all([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip: paging.start - 1,
      take: paging.count,
      include: { group: true, owner: true },
    }),
  ]);

  const base = deriveBaseUrl(request);
  const events = rows.map((e) => toApiEvent(e, base));

  return jsonResponse(
    serializeForApi({
      results_start: paging.start,
      results_returned: events.length,
      results_available: total,
      events,
    }),
  );
}
