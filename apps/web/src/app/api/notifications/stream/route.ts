/**
 * 通知の Server-Sent Events (SSE) ストリーム。
 *
 * `GET /api/notifications/stream`
 *
 * - 認証必須 (未ログインは 401)。
 * - `Content-Type: text/event-stream` で接続を維持し、新規通知が到着すると
 *   `event: new-notification\ndata: <json>\n\n` を push する。
 * - ローカル開発・PoC レベルでは「5 秒ごとに DB を polling して新着 id を検出」する
 *   実装で十分。本番では Redis pub/sub などにスケールアウトすべき
 *   (README の `## P2 UX 強化` 節も参照)。
 * - 接続時に `event: connected` (現在の未読数) を返し、polling 中も 25 秒に 1 度
 *   `event: ping` を送って proxy が idle 切断するのを防ぐ。
 * - クライアントが close すると AbortSignal がトリガーされ、interval を clear する。
 */
import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Edge ではなく Node.js runtime で動かす (`prisma` の都合)。 */
export const runtime = "nodejs";
/** SSE はキャッシュさせない */
export const dynamic = "force-dynamic";

/** polling 間隔 (ms)。テストで上書きできるよう env で fallback。 */
const POLL_INTERVAL_MS = Number(
  process.env.SSE_NOTIFICATION_POLL_MS ?? "5000",
);
/** keep-alive ping 間隔 (ms) */
const KEEPALIVE_MS = 25_000;

type ChannelControl = ReadableStreamDefaultController<Uint8Array>;

function sseEncode(event: string, data: unknown): Uint8Array {
  const payload =
    typeof data === "string" ? data : JSON.stringify(data ?? null);
  // SSE: event: <name>\n data: <json>\n\n
  return new TextEncoder().encode(`event: ${event}\ndata: ${payload}\n\n`);
}

export async function GET(req: NextRequest): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = user.id;

  // 起点となる id (これより大きい id が新着)
  let lastSeenId: bigint = await prisma.notification
    .aggregate({
      _max: { id: true },
      where: { recipientUserId: userId },
    })
    .then((r) => (r._max.id ?? BigInt(0)) as bigint)
    .catch(() => BigInt(0));

  const stream = new ReadableStream<Uint8Array>({
    async start(controller: ChannelControl) {
      // 接続時に現在の未読数を 1 度だけ流す。クライアントはこれを「初期同期」に使う。
      try {
        const unreadCount = await prisma.notification.count({
          where: { recipientUserId: userId, readAt: null },
        });
        controller.enqueue(
          sseEncode("connected", {
            unreadCount,
            lastSeenId: lastSeenId.toString(),
          }),
        );
      } catch {
        controller.enqueue(sseEncode("connected", { unreadCount: 0 }));
      }

      let closed = false;
      const closeAll = (): void => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* 既に閉じている */
        }
      };

      const tick = async (): Promise<void> => {
        if (closed) return;
        try {
          const fresh = await prisma.notification.findMany({
            where: {
              recipientUserId: userId,
              id: { gt: lastSeenId },
            },
            orderBy: { id: "asc" },
            take: 50,
          });
          if (fresh.length > 0) {
            // 最後の id を更新
            const last = fresh[fresh.length - 1];
            if (last) lastSeenId = last.id;
            const unreadCount = await prisma.notification.count({
              where: { recipientUserId: userId, readAt: null },
            });
            for (const n of fresh) {
              controller.enqueue(
                sseEncode("new-notification", {
                  id: n.id.toString(),
                  kind: n.kind,
                  eventId: n.eventId?.toString() ?? null,
                  payload: n.payload,
                  createdAt: n.createdAt.toISOString(),
                  unreadCount,
                }),
              );
            }
          }
        } catch (e) {
          // DB エラーは fatal 扱いせず continue (一時的な接続エラーかもしれない)
          // eslint-disable-next-line no-console
          console.warn("[sse] poll failed", (e as Error).message);
        }
      };

      const pollTimer = setInterval(() => {
        void tick();
      }, POLL_INTERVAL_MS);
      const pingTimer = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(sseEncode("ping", { ts: Date.now() }));
        } catch {
          closeAll();
        }
      }, KEEPALIVE_MS);

      // クライアント切断を検出 (Next の req.signal を購読)
      req.signal.addEventListener("abort", () => {
        clearInterval(pollTimer);
        clearInterval(pingTimer);
        closeAll();
      });
    },
    cancel(): void {
      // クライアント側 close 時、ReadableStream.cancel が呼ばれる
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
