/**
 * GET /api/jobs/:id?queue=participation
 *
 * BullMQ job の状態を返す軽量 endpoint。client polling 用。
 *
 * Query parameters:
 *   queue  どのキューを参照するか (省略時は participation)
 *
 * Response:
 *   200  { id, state, progress, returnvalue, failedReason, attemptsMade }
 *   401  未認証
 *   403  自分の job でない
 *   404  job が見つからない (期限切れ / 別キュー / 存在しない)
 *   503  REDIS_URL 未設定 (inline モードでは job id は存在しない)
 *
 * セキュリティ:
 *   - 認証必須 (`getCurrentUser`)。
 *   - 申込 (`participation`) の jobId は `join:<userId>:<eventId>:<eventRoleId>`
 *     形式で固定されており、`userId` 部分が自分と一致する場合のみ閲覧を許可する。
 *   - lottery / notification の job は管理者専用 (本 PR では参照させない)。
 */
import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  isRedisEnabled,
  getParticipationJobStatus,
  QUEUE_NAMES,
} from "@tech-event/shared-data-access-queue";

export const dynamic = "force-dynamic";

const ALLOWED_QUEUES = new Set<string>([QUEUE_NAMES.participation]);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  // 認可: participation job は jobId = `join:<userId>:<eventId>:<eventRoleId>` の
  // 形式で固定されている。先頭の userId が自分と一致しない job は参照不可。
  // (inline / queue mode の両方で同様にチェック)
  const expectedPrefix = `join:${user.id.toString()}:`;
  if (!id.startsWith(expectedPrefix)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (!isRedisEnabled()) {
    // inline mode: job は実体を持たないため、即時 completed を返す。
    // (client は polling せず Server Action の戻り値で判定するのが望ましい)
    return NextResponse.json(
      {
        id,
        state: "completed",
        mode: "inline",
        note: "REDIS_URL not configured; assume inline completion",
      },
      { status: 200 },
    );
  }

  const url = new URL(request.url);
  const queue = url.searchParams.get("queue") ?? QUEUE_NAMES.participation;

  if (!ALLOWED_QUEUES.has(queue)) {
    return NextResponse.json({ error: "queue_not_allowed" }, { status: 400 });
  }

  const status = await getParticipationJobStatus(id);
  if (!status) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(status, { status: 200 });
}
