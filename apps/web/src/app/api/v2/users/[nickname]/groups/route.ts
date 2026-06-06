/**
 * GET /api/v2/users/{nickname}/groups/
 *
 * 指定ユーザーが所属しているグループ一覧。`/api/v2/groups/` と同じ GroupSchema を返す。
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

  // メンバー (leftAt が null) + 管理者 (group_admins) のグループを和集合で取得
  const where = {
    OR: [
      {
        members: {
          some: { userId: user.id, leftAt: null },
        },
      },
      {
        admins: {
          some: { userId: user.id },
        },
      },
    ],
    status: "active",
  };

  const [total, rows] = await Promise.all([
    prisma.group.count({ where }),
    prisma.group.findMany({
      where,
      orderBy: { id: "asc" },
      skip: paging.start - 1,
      take: paging.count,
    }),
  ]);

  const protocol = request.headers.get("x-forwarded-proto") ?? "http";
  const host = request.headers.get("host") ?? "localhost:3000";
  const base = `${protocol}://${host}`;

  const groups = rows.map((g) => ({
    id: Number(g.id),
    subdomain: g.subdomain,
    title: g.name,
    sub_title: g.subtitle,
    url: `${base}/group/${g.id.toString()}`,
    description: g.description,
    owner_text: g.organization,
    image_url: g.thumbnailUrl ?? g.coverImageUrl,
    website_url: g.websiteUrl,
    website_name: g.organization,
    twitter_username: g.xAccount,
    facebook_url: g.facebookUrl,
    member_users_count: g.memberCount,
  }));

  return jsonResponse(
    serializeForApi({
      results_start: paging.start,
      results_returned: groups.length,
      results_available: total,
      groups,
    }),
  );
}
