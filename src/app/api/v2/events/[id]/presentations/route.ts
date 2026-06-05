/**
 * GET /api/v2/events/{id}/presentations/
 *
 * 指定イベントの発表資料一覧。
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

export const dynamic = "force-dynamic";

export async function OPTIONS(): Promise<Response> {
  return corsPreflightResponse();
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const guard = guardRequest(request);
  if (guard) return guard;

  const { id: idRaw } = await context.params;
  const idNum = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(idNum) || idNum < 1) {
    return errorResponse(400, "bad_request", "Invalid event id");
  }
  const eventId = BigInt(idNum);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true },
  });
  if (!event) {
    return errorResponse(404, "not_found", `Event ${idRaw} not found`);
  }

  const { searchParams } = new URL(request.url);
  const paging = parsePaging(searchParams);

  const where = { eventId };

  const [total, rows] = await Promise.all([
    prisma.presentationMaterial.count({ where }),
    prisma.presentationMaterial.findMany({
      where,
      orderBy: [{ displayOrder: "asc" }, { postedAt: "asc" }],
      skip: paging.start - 1,
      take: paging.count,
      include: { presenter: true },
    }),
  ]);

  const presentations = rows.map((p) => {
    const presenter = p.presenter
      ? { id: Number(p.presenter.id), nickname: p.presenter.nickname }
      : null;
    return {
      // 投稿者と発表者の区別が schema に無いため、両者ともに presenter を入れる
      user: presenter,
      url: p.url,
      name: p.title,
      presenter,
      presentation_type: classifyPresentationType(p.url),
      created_at: p.postedAt.toISOString(),
    };
  });

  return jsonResponse(
    serializeForApi({
      results_start: paging.start,
      results_returned: presentations.length,
      results_available: total,
      presentations,
    }),
  );
}

function classifyPresentationType(url: string): string {
  const lower = url.toLowerCase();
  if (
    lower.includes("speakerdeck.com") ||
    lower.includes("slideshare.net") ||
    lower.includes("docswell.com")
  ) {
    return "slide";
  }
  if (
    lower.includes("youtube.com") ||
    lower.includes("youtu.be") ||
    lower.includes("vimeo.com")
  ) {
    return "movie";
  }
  if (lower.includes("github.com") || lower.includes("gitlab.com")) {
    return "code";
  }
  return "blog";
}
