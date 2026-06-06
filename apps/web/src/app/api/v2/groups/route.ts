/**
 * GET /api/v2/groups/
 *
 * connpass v2 互換のグループ検索。
 *
 * クエリ:
 *  - `subdomain` (必須、完全一致、カンマ区切り複数可、最大100)
 *  - `start` / `count` (ページング)
 *
 * connpass と同じく `subdomain` の指定が無ければ常に空配列を返す
 * (全件取得は不可)。
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
  const subdomains = multi(searchParams, "subdomain").slice(0, 100);
  const paging = parsePaging(searchParams);

  if (subdomains.length === 0) {
    return jsonResponse(
      serializeForApi({
        results_start: paging.start,
        results_returned: 0,
        results_available: 0,
        groups: [],
      }),
    );
  }

  const where = {
    subdomain: { in: subdomains },
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
