/**
 * GET /api/v2/users/
 *
 * connpass v2 互換のユーザー検索 (ニックネーム完全一致)。
 *
 * クエリ:
 *  - `nickname` (カンマ区切り複数可、最大 100)
 *  - `start` / `count` (ページング)
 *
 * 仕様要求: `{nickname, name (=displayName), description (=bio), affiliation,
 *           created_at, x_account, github_account}` を含む。
 * 加えて connpass v2 互換のため `id` / `url` / `image_url` / `display_name`
 * 等も返す。
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
  const nicknames = multi(searchParams, "nickname").slice(0, 100);
  const paging = parsePaging(searchParams);

  if (nicknames.length === 0) {
    return jsonResponse(
      serializeForApi({
        results_start: paging.start,
        results_returned: 0,
        results_available: 0,
        users: [],
      }),
    );
  }

  const where = {
    nickname: { in: nicknames },
    status: "active",
  };

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { id: "asc" },
      skip: paging.start - 1,
      take: paging.count,
    }),
  ]);

  const protocol = request.headers.get("x-forwarded-proto") ?? "http";
  const host = request.headers.get("host") ?? "localhost:3000";
  const base = `${protocol}://${host}`;

  const users = rows.map((u) => ({
    id: Number(u.id),
    nickname: u.nickname,
    name: u.displayName,
    display_name: u.displayName,
    description: u.bio,
    affiliation: u.affiliation,
    url: `${base}/user/${u.nickname}`,
    image_url: u.avatarUrl,
    created_at: u.createdAt.toISOString(),
    x_account: u.xAccount,
    github_account: u.githubAccount,
  }));

  return jsonResponse(
    serializeForApi({
      results_start: paging.start,
      results_returned: users.length,
      results_available: total,
      users,
    }),
  );
}
