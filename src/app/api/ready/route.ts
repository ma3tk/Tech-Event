/**
 * Readiness probe endpoint.
 *
 * GET /api/ready → 200 (起動完了) または 503 (まだ準備中)
 *
 * 用途:
 *   - Load Balancer / k8s readiness probe (起動直後の cold instance を hot 化する前の確認)
 *   - `/api/health` よりも軽量 (DB クエリを投げない)
 *
 * 戻り値:
 *   { ready: true, timestamp: string }
 *
 * `/api/health` との違い:
 *   - readiness: 「リクエストを受けられるか」(LB に in-rotation 入れて良いか)
 *   - liveness:  「プロセスが生きてるか」(再起動が必要か)
 *
 * 本実装は「Node プロセスが起動し、Next.js の route が呼べる」=「ready」と見なす。
 * 必要に応じて DB 起動待ちや migration 完了確認等のロジックを足す。
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ready: true,
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
