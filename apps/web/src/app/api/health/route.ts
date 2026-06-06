/**
 * Health check endpoint.
 *
 * GET /api/health → 200 (or 503 if DB unreachable)
 *
 * 戻り値:
 *   {
 *     ok: boolean,
 *     version: string,         // package.json の version
 *     uptime: number,          // process.uptime() 秒
 *     db: "ok" | "error",      // SELECT 1 の結果
 *     dbLatencyMs?: number,    // 計測できた場合のみ
 *     dbError?: string,        // db = "error" のときのみ
 *     timestamp: string,       // ISO8601
 *   }
 *
 * 用途:
 *   - Vercel / Docker / ALB / k8s の liveness probe
 *   - 監視ツール (Datadog, Uptime Robot 等) からのポーリング
 *
 * NOTE: シークレットや内部情報を返さない (公開エンドポイント想定)。
 */
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// 必ず動的レンダリング (DB 接続を持つため CDN cache してはいけない)
export const dynamic = "force-dynamic";
export const revalidate = 0;

// package.json から読み込んだ version (build 時に埋め込み)
// 直接 import すると Next.js が json を bundle するので静的に解決される
import pkg from "../../../../package.json";
const VERSION = (pkg as { version?: string }).version ?? "0.0.0";

export async function GET(): Promise<NextResponse> {
  const startedAt = Date.now();
  let dbStatus: "ok" | "error" = "ok";
  let dbError: string | undefined;
  let dbLatencyMs: number | undefined;

  try {
    // SELECT 1 を $queryRawUnsafe で実行 (SQLite / Postgres どちらでも動く)
    const t0 = Date.now();
    await prisma.$queryRawUnsafe("SELECT 1");
    dbLatencyMs = Date.now() - t0;
  } catch (e) {
    dbStatus = "error";
    dbError = e instanceof Error ? e.message : String(e);
  }

  const body = {
    ok: dbStatus === "ok",
    version: VERSION,
    uptime: Math.round(process.uptime()),
    db: dbStatus,
    dbLatencyMs,
    ...(dbError ? { dbError } : {}),
    timestamp: new Date().toISOString(),
    elapsedMs: Date.now() - startedAt,
  };

  return NextResponse.json(body, {
    status: dbStatus === "ok" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
