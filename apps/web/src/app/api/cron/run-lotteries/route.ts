/**
 * 抽選自動実行用の簡易バッチエンドポイント。
 *
 * `GET /api/cron/run-lotteries?secret=xxx`
 *
 * - `Event.recruitmentMethod === 'lottery'` かつ
 *   `lotteryAnnounceAt <= now` かつ
 *   `pending` 参加者を持つ EventRole が 1 つ以上ある event を抽出する。
 * - 候補 event ごとに `lottery` キューに job を投入し、実処理は worker が行う。
 *   `REDIS_URL` 未設定なら従来通り同期で `runLotteryForEvent` を呼ぶ (fallback)。
 * - シークレットは環境変数 `CRON_SECRET` に置く。未設定なら 503 を返し disable。
 * - 戻り値は JSON: `{ enqueued: number, inlineProcessed: number, errors: [...] }`
 *
 * NOTE: 実運用では Vercel Cron / Cloud Scheduler 等から定期的に叩く想定。
 * queue 化により本 endpoint は「候補抽出 + enqueue」しか行わなくなり、
 * 1 リクエストの処理時間が短くなる (worker 側で並列実行される)。
 */

import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { runLotteryForEvent } from "@/app/actions/lottery-actions";
import { sendLotteryResultNotifications } from "@tech-event/web-feature-host-dashboard";
import { enqueueLottery, isRedisEnabled } from "@tech-event/shared-data-access-queue";

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
  let enqueued = 0;
  let inlineProcessed = 0;

  for (const c of candidates) {
    try {
      const result = await enqueueLottery(
        { eventId: c.id.toString() },
        async () => {
          // fallback: REDIS_URL 未設定なら従来通り同期で実行
          await prisma.$transaction(async (tx) => {
            await runLotteryForEvent(tx, c.id);
          });
          // 抽選結果の参加者通知 (payload 補完 + 抽選結果メール)。
          // 冪等 (Notification.sentAt マーカー) なので再実行しても二重送信しない。
          // 通知の失敗は抽選確定自体を巻き戻さない (errors に積むだけ)。
          try {
            await sendLotteryResultNotifications(c.id);
          } catch (e) {
            errors.push({
              eventId: c.id.toString(),
              message: `notify_failed: ${e instanceof Error ? e.message : String(e)}`,
            });
          }
        },
      );
      if (result.mode === "queued") {
        enqueued++;
      } else {
        inlineProcessed++;
      }
    } catch (e) {
      errors.push({
        eventId: c.id.toString(),
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({
    mode: isRedisEnabled() ? "queued" : "inline",
    enqueued,
    inlineProcessed,
    // 後方互換: 既存テストが `processed` を見る可能性に備え、合計値も返す
    processed: enqueued + inlineProcessed,
    errors,
  });
}
