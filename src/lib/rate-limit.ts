/**
 * In-memory レート制限ユーティリティ (汎用)。
 *
 * connpass クローンの「ログイン / Magic Link / 画像アップロード / Stripe Webhook /
 * コメント投稿 / グループ作成 / イベント作成」など、不特定の場所から呼べるよう
 * 抽象化したスライディングウィンドウ実装。
 *
 * - 本番想定では Redis / Upstash KV ベースのほうが望ましいが、tech-event は
 *   現状単一インスタンス + SQLite なので Map で十分。
 * - 並列インスタンス化時は globalThis 経由でプロセス内共有 (HMR 起動でも 1 つ)。
 * - 戻り値は `{ ok, remaining, resetAt, retryAfterSec }` で、429 を返す際の
 *   `Retry-After` ヘッダ秒数を直接取り出せる。
 *
 * 使い方:
 * ```ts
 * import { rateLimit, getRequestIp, buildRateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
 *
 * const ip = getRequestIp(request);
 * const r = rateLimit(`${ip}:login`, RATE_LIMITS.login);
 * if (!r.ok) return buildRateLimitResponse(r);
 * ```
 *
 * `RATE_LIMITS` プリセット:
 *   - login          : 5 回 / 5 分 / IP
 *   - magicLink      : 3 回 / 15 分 / IP
 *   - devLogin       : 10 回 / 分 / IP
 *   - imageUpload    : 20 回 / 時 / user
 *   - webhook        : 100 回 / 分 / IP (Stripe 側で 1 次防御あり)
 *   - comment        : 10 回 / 分 / user
 *   - createResource : 5 回 / 時 / user (group / event / calendar 作成)
 */
import { NextResponse } from "next/server";

/** 1 ウィンドウのリクエスト履歴 */
type Bucket = {
  /** ウィンドウ開始 (epoch ms) */
  windowStart: number;
  /** カウンタ */
  count: number;
};

/** ホットリロード対策で globalThis に Map を持つ */
function buckets(): Map<string, Bucket> {
  const g = globalThis as typeof globalThis & {
    __teRateLimitBuckets?: Map<string, Bucket>;
  };
  if (!g.__teRateLimitBuckets) {
    g.__teRateLimitBuckets = new Map<string, Bucket>();
  }
  return g.__teRateLimitBuckets;
}

export type RateLimitConfig = {
  /** ウィンドウ長 (ms) */
  windowMs: number;
  /** ウィンドウ内最大許可回数 */
  max: number;
};

export type RateLimitResult = {
  ok: boolean;
  /** 残り回数 (ok=false のときは 0) */
  remaining: number;
  /** ウィンドウ終了 epoch ms (このリセット時刻になればまた使える) */
  resetAt: number;
  /** 429 用 Retry-After 秒 (ok=true でも値は入る; ok=false 時に使う) */
  retryAfterSec: number;
};

/**
 * 固定ウィンドウ式のレート制限 (Sliding window light)。
 *
 * - 各 key につき直近の `windowMs` の中で `max` 回まで許可。
 * - max を超えた場合 `ok: false` + `retryAfterSec` を返す。
 *
 * key は呼び出し側で組み立てる:
 *   - `ip:routeName` (匿名ルート)
 *   - `userId:routeName` (認証済みルート)
 *
 * ※ dev では `RATE_LIMIT_RELAX=1` を渡せば 100 倍緩める (E2E や負荷確認用)。
 */
export function rateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const relax = isRelaxedEnv();
  const max = relax ? config.max * 100 : config.max;
  const windowMs = config.windowMs;

  const map = buckets();
  let bucket = map.get(key);

  // ウィンドウを過ぎていればリセット
  if (!bucket || now - bucket.windowStart >= windowMs) {
    bucket = { windowStart: now, count: 0 };
  }

  bucket.count += 1;
  map.set(key, bucket);

  const resetAt = bucket.windowStart + windowMs;
  const remaining = Math.max(0, max - bucket.count);
  const retryAfterMs = Math.max(0, resetAt - now);
  const retryAfterSec = Math.ceil(retryAfterMs / 1000);

  if (bucket.count > max) {
    return { ok: false, remaining: 0, resetAt, retryAfterSec };
  }

  return { ok: true, remaining, resetAt, retryAfterSec };
}

/** 古い bucket を間引く (1000 件超えたら) */
export function pruneExpired(now: number = Date.now()): void {
  const map = buckets();
  if (map.size < 1000) return;
  for (const [k, v] of map.entries()) {
    // 最も長いウィンドウでも 1 時間なので、超過後は削除
    if (now - v.windowStart > 60 * 60 * 1000) {
      map.delete(k);
    }
  }
}

/** dev/test での緩和 */
function isRelaxedEnv(): boolean {
  if (process.env.NODE_ENV === "test") return true;
  // dev で E2E 並列走行時の誤検知防止
  if (process.env.NODE_ENV !== "production") {
    if (process.env.RATE_LIMIT_RELAX === "1") return true;
    // dev デフォルトでも 10 倍まで許容
    return true;
  }
  return false;
}

/** テスト用: 状態を初期化する */
export function _resetRateLimit(): void {
  buckets().clear();
}

/**
 * リクエストから IP を取り出す。
 * - X-Forwarded-For 先頭 → X-Real-IP → "unknown" の順。
 * - 単一インスタンス想定なので strict なスプーフ対策は別途必要。
 */
export function getRequestIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

/**
 * 429 レスポンスを Retry-After 付きで返すヘルパー。
 */
export function buildRateLimitResponse(
  r: RateLimitResult,
  body?: Record<string, unknown>,
): NextResponse {
  const res = NextResponse.json(
    {
      error: "rate_limited",
      message: "リクエストが多すぎます。しばらく待ってからお試しください。",
      retryAfterSec: r.retryAfterSec,
      ...(body ?? {}),
    },
    { status: 429 },
  );
  res.headers.set("Retry-After", String(Math.max(1, r.retryAfterSec)));
  res.headers.set("X-RateLimit-Remaining", String(r.remaining));
  res.headers.set("X-RateLimit-Reset", String(Math.floor(r.resetAt / 1000)));
  return res;
}

/** 既定のレート制限プリセット */
export const RATE_LIMITS = {
  /** ログイン: 5 回 / 5 分 / IP */
  login: { windowMs: 5 * 60 * 1000, max: 5 } satisfies RateLimitConfig,
  /** Magic Link 発行: 3 回 / 15 分 / IP */
  magicLink: { windowMs: 15 * 60 * 1000, max: 3 } satisfies RateLimitConfig,
  /** Dev login: 10 回 / 分 / IP */
  devLogin: { windowMs: 60 * 1000, max: 10 } satisfies RateLimitConfig,
  /** 画像アップロード: 20 回 / 時 / user */
  imageUpload: { windowMs: 60 * 60 * 1000, max: 20 } satisfies RateLimitConfig,
  /** Stripe Webhook (念のため): 100 回 / 分 / IP */
  webhook: { windowMs: 60 * 1000, max: 100 } satisfies RateLimitConfig,
  /** コメント投稿: 10 回 / 分 / user */
  comment: { windowMs: 60 * 1000, max: 10 } satisfies RateLimitConfig,
  /** グループ/イベント/カレンダー作成: 5 回 / 時 / user */
  createResource: { windowMs: 60 * 60 * 1000, max: 5 } satisfies RateLimitConfig,
} as const;

/** ActionError (Server Action 用) に投げる軽量例外 */
export class RateLimitError extends Error {
  retryAfterSec: number;
  constructor(retryAfterSec: number) {
    super(
      `リクエストが多すぎます。${retryAfterSec} 秒後に再度お試しください。`,
    );
    this.name = "RateLimitError";
    this.retryAfterSec = retryAfterSec;
  }
}

/**
 * Server Action 用ヘルパー: rate limit を判定し、超過時は `RateLimitError` を投げる。
 * Server Action では Request オブジェクトが取れないので key 構築は呼び出し側で行う。
 *
 * 例:
 * ```ts
 * assertRateLimit(`user:${user.id}:postComment`, RATE_LIMITS.comment);
 * ```
 */
export function assertRateLimit(
  key: string,
  config: RateLimitConfig,
): void {
  const r = rateLimit(key, config);
  if (!r.ok) {
    throw new RateLimitError(r.retryAfterSec);
  }
}
