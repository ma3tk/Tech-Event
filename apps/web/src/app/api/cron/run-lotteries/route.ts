/**
 * 抽選自動実行用の簡易バッチエンドポイント。
 *
 * `GET /api/cron/run-lotteries?secret=xxx`
 *
 * - `Event.recruitmentMethod === 'lottery'` かつ
 *   `lotteryAnnounceAt <= now` かつ
 *   `pending` 参加者を持つ EventRole が 1 つ以上ある event を抽出し、
 *   各イベントの全 lottery 枠で抽選 (`runLotteryForEvent`) を実行する。
 * - シークレットは環境変数 `CRON_SECRET` に置く。未設定なら 503 を返し disable。
 * - 戻り値は JSON: `{ processed: number, errors: [{ eventId, message }] }`
 *
 * NOTE: 実運用では Vercel Cron / Cloud Scheduler 等から定期的に叩く想定。
 * 本実装はシンプルな手動 / E2E 用バッチで、並列性は考慮しない。
 */

import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { runLotteryForEvent } from "@/app/actions/lottery-actions";

// 動的レンダリングが必要 (環境変数 / DB クエリに依存)
export const dynamic = "force-dynamic";

type ErrorEntry = { eventId: string; message: string };

export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "cron_disabled", reason: "CRON_SECRET is not set" },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const provided = url.searchParams.get("secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // lotteryAnnounceAt が過ぎている lottery 方式の event を抽出
  const candidates = await prisma.event.findMany({
    where: {
      recruitmentMethod: "lottery",
      lotteryAnnounceAt: { lte: now },
      // pending 参加者を持つ役割が 1 つ以上ある
      roles: {
        some: {
          recruitmentMethod: "lottery",
          participants: { some: { status: "pending" } },
        },
      },
    },
    select: { id: true },
  });

  const errors: ErrorEntry[] = [];
  let processed = 0;

  for (const c of candidates) {
    try {
      await prisma.$transaction(async (tx) => {
        await runLotteryForEvent(tx, c.id);
      });
      processed += 1;
    } catch (e) {
      errors.push({
        eventId: c.id.toString(),
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({ processed, errors });
}
