/**
 * POST /api/push/subscribe — Web Push 購読の登録。
 *
 * `PushToggle` (Client Component) が `registration.pushManager.subscribe()` の
 * 結果 (`PushSubscription.toJSON()`) をそのまま POST する。
 *
 * 設計 (CLAUDE.md §6.3 / §7 準拠):
 * - 認証必須 (te_session)。未ログインは 401。
 * - Zod で入力検証 (endpoint URL + keys.p256dh / keys.auth)。
 * - 保存本体は `savePushSubscription` (feature-notification の Server Action、
 *   endpoint unique upsert + `nextId(tx, "pushSubscription")` 採番)。
 * - IP 単位の rate limit (購読登録は高頻度に起きない)。
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
import { savePushSubscription } from "@tech-event/web-feature-notification";

/** 購読登録: 30 回 / 分 / IP (通常は端末ごとに 1 回きり) */
const SUBSCRIBE_LIMIT: RateLimitConfig = { windowMs: 60 * 1000, max: 30 };

/** body サイズ上限 (PushSubscription JSON は高々 1KB 程度) */
const MAX_BODY_BYTES = 8192;

/** ブラウザの `PushSubscription.toJSON()` 形式 */
const SubscribeSchema = z.object({
  endpoint: z.string().url().max(2048),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(512),
  }),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = getRequestIp(req);
  const rl = rateLimit(`${ip}:push-subscribe`, SUBSCRIBE_LIMIT);
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
  const parsed = SubscribeSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await savePushSubscription({
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    });
    return NextResponse.json(
      { ok: true, created: result.created },
      { status: result.created ? 201 : 200 },
    );
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
