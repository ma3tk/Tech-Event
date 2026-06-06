/**
 * Prometheus メトリクス公開エンドポイント。
 *
 *   GET /api/metrics
 *
 * 認証:
 *   - `METRICS_TOKEN` が設定されている場合、Authorization: Bearer <token> または
 *     `?token=...` クエリで一致する必要がある。
 *   - `METRICS_TOKEN` 未設定なら認証不要 (private network 上で運用する前提)。
 *
 * 形式: text/plain; version=0.0.4 (Prometheus exposition format)
 *
 * Grafana / Datadog / VictoriaMetrics 等のスクレイパが定期取得する想定。
 */
import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";

import { env } from "@/env";
import { renderMetrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function safeEquals(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function isAuthorized(request: NextRequest): boolean {
  const token = env.METRICS_TOKEN;
  if (!token) return true; // 未設定なら誰でも取得可
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    return safeEquals(header.slice("Bearer ".length), token);
  }
  const query = request.nextUrl.searchParams.get("token");
  if (query) return safeEquals(query, token);
  return false;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return new NextResponse("unauthorized", { status: 401 });
  }
  const body = renderMetrics();
  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": "text/plain; version=0.0.4; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
