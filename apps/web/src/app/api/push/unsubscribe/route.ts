/**
 * POST /api/push/unsubscribe — Web Push 購読の解除。
 *
 * `PushToggle` が `subscription.unsubscribe()` 後に endpoint を POST する。
 *
 * - 認証必須。**自分の** 購読のみ削除できる (`deletePushSubscription` が
 *   userId 条件付きで deleteMany する)。
 * - endpoint が見つからない / 他人の購読でも 200 (`deleted: 0`) を返す
 *   (解除操作は冪等)。
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { isActionError } from "@/lib/action-error";
import {
  buildRateLimitResponse,
  getRequestIp,
  rateLimit,
  type RateLimitConfig,
} from "@/lib/rate-limit";
import { deletePushSubscription } from "@tech-event/web-feature-notification";

/** 購読解除: 30 回 / 分 / IP */
const UNSUBSCRIBE_LIMIT: RateLimitConfig = { windowMs: 60 * 1000, max: 30 };

/** body サイズ上限 */
const MAX_BODY_BYTES = 4096;

const UnsubscribeSchema = z.object({
  endpoint: z.string().url().max(2048),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = getRequestIp(req);
  const rl = rateLimit(`${ip}:push-unsubscribe`, UNSUBSCRIBE_LIMIT);
  if (!rl.ok) return buildRateLimitResponse(rl);

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, error: "payload too large" },
      { status: 413 },
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid JSON body" },
      { status: 400 },
    );
  }
  const parsed = UnsubscribeSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await deletePushSubscription(parsed.data.endpoint);
    return NextResponse.json({ ok: true, deleted: result.deleted });
  } catch (err) {
    if (isActionError(err)) {
      const status = err.code === "forbidden" ? 401 : 400;
      return NextResponse.json(
        { ok: false, error: err.code },
        { status },
      );
    }
    throw err;
  }
}
