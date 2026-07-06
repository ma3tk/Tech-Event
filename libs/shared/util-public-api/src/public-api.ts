/**
 * 公開 REST API (`/api/v2/*`) 用の共通ヘルパー。
 *
 * - `validateApiAuth`: `X-API-Key` ヘッダと `User-Agent` ヘッダの検証
 *   - APIキー未指定 or 不一致 → `{ ok: false, error: "unauthorized" }`
 *   - User-Agent 未送信 or 空白 or "curl" 単独 → `{ ok: false, error: "forbidden" }`
 * - `validateApiAuthWithDb`: 上記に加えて DB 発行キー (`ApiKey` テーブル) も
 *   受け付ける async 版。env キー (`PUBLIC_API_KEY`) は従来通り有効 (両対応)。
 * - `rateLimit`: APIキー単位の簡易インメモリレート制限 (1 req/sec)
 * - `serializeForApi`: BigInt → Number, Date → ISO 文字列 への再帰変換
 * - `errorResponse` / `jsonResponse`: CORS ヘッダ込みの共通レスポンス生成
 *
 * 本ファイルは Edge runtime ではなく Node runtime 前提 (環境変数 `process.env` 使用)。
 *
 * connpass v2 と異なる点:
 *  - BigInt は **Number** にキャストして返す (connpass のフィールド `id` は integer)。
 *    JS の `Number.MAX_SAFE_INTEGER` (2^53-1) を超える ID は理論上発生しないが、
 *    超えるケースが想定される場合は呼び出し側で string 変換に切り替えること。
 */
import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";

import { prisma } from "@/lib/prisma";

/** 認証検証結果 */
export type AuthResult =
  | { ok: true; apiKey: string }
  | { ok: false; status: 401 | 403; error: string; message: string };

/** 環境変数からの API キー読込。未設定なら空文字 (= 常に 401) を返す。 */
function configuredApiKey(): string {
  return process.env.PUBLIC_API_KEY ?? "";
}

/**
 * timing-safe な文字列比較。長さ不一致でも一定時間 (短い方の長さ分) を消費する。
 * 比較対象は ASCII 想定 (API キー: hex / base64) なので Buffer 化して `timingSafeEqual`。
 */
function timingSafeStringEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  // 長さが異なる場合、短い側の長さで比較を強制し、結果は false を返す
  if (ba.length !== bb.length) {
    // 同じ長さの dummy で比較 (timing を一定化)
    const dummy = Buffer.alloc(ba.length, 0);
    try {
      timingSafeEqual(ba, dummy);
    } catch {
      // ignore
    }
    return false;
  }
  try {
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/**
 * `X-API-Key` + `User-Agent` ヘッダ検証。
 *
 * - `PUBLIC_API_KEY` 未設定の場合も 401 扱い (常に失敗) — 起動時の事故を防止するため
 * - User-Agent はトリム後の文字列で判定。"curl" 完全一致 (大文字小文字無視) も拒否
 *   (connpass で CloudFront 段が "curl/x.y.z" 等を弾く挙動を模倣)
 */
export function validateApiAuth(request: Request): AuthResult {
  const expected = configuredApiKey();
  const provided = request.headers.get("x-api-key") ?? "";
  const userAgent = (request.headers.get("user-agent") ?? "").trim();

  // User-Agent の検証を先に行う (connpass の CloudFront も先に弾く)
  if (userAgent === "" || userAgent.toLowerCase() === "curl") {
    return {
      ok: false,
      status: 403,
      error: "forbidden",
      message: "User-Agent header is required",
    };
  }

  if (expected === "" || provided === "" || !timingSafeStringEqual(provided, expected)) {
    return {
      ok: false,
      status: 401,
      error: "unauthorized",
      message: "Invalid or missing X-API-Key header",
    };
  }

  return { ok: true, apiKey: provided };
}

/* ============================================================
 * Rate limit (in-memory, key単位 1 req/sec)
 * ============================================================ */

const lastRequestAt: Map<string, number> = (() => {
  const g = globalThis as typeof globalThis & {
    __publicApiRateMap?: Map<string, number>;
  };
  if (!g.__publicApiRateMap) {
    g.__publicApiRateMap = new Map<string, number>();
  }
  return g.__publicApiRateMap;
})();

/** 最低間隔 (ms)。connpass と同じく 1 req / sec。 */
const RATE_LIMIT_INTERVAL_MS = 1000;

/**
 * key 単位レート制限。直近リクエストから `RATE_LIMIT_INTERVAL_MS` 未満なら拒否。
 * 返り値が `true` なら通過、`false` なら拒否 (429)。
 */
export function rateLimit(key: string): boolean {
  const now = Date.now();
  const last = lastRequestAt.get(key);
  if (last !== undefined && now - last < RATE_LIMIT_INTERVAL_MS) {
    return false;
  }
  lastRequestAt.set(key, now);
  return true;
}

/** テスト用: レート制限状態をリセット */
export function _resetRateLimitForTest(): void {
  lastRequestAt.clear();
}

/* ============================================================
 * BigInt / Date シリアライズ
 * ============================================================ */

/**
 * 再帰的に BigInt → Number, Date → ISO 文字列 に変換する。
 *
 * connpass v2 のフィールド (id 等) は integer なので Number に揃える。
 * ただし `Number.MAX_SAFE_INTEGER` (= 2^53 - 1) を超える BigInt は
 * `Number` キャストでサイレントに精度落ちするため、その範囲を超える値は
 * 文字列にフォールバックする (`value.toString()`)。
 *
 * 全エンドポイントで同じ規約に従うため、判定はこの 1 箇所に集約する。
 */
const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);
const MIN_SAFE_BIGINT = BigInt(Number.MIN_SAFE_INTEGER);

export function serializeForApi(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") {
    // 精度ロス防止: MAX_SAFE_INTEGER 範囲外は string にフォールバック
    if (value > MAX_SAFE_BIGINT || value < MIN_SAFE_BIGINT) {
      return value.toString();
    }
    return Number(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map((v) => serializeForApi(v));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = serializeForApi(v);
    }
    return out;
  }
  return value;
}

/* ============================================================
 * Response helpers (CORS 付与)
 * ============================================================ */

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "X-API-Key, Content-Type, User-Agent, X-Test-Bypass-Rate-Limit",
};

/** CORS ヘッダ付き JSON レスポンス */
export function jsonResponse(
  body: unknown,
  init?: { status?: number },
): NextResponse {
  const res = NextResponse.json(body as Parameters<typeof NextResponse.json>[0], {
    status: init?.status ?? 200,
  });
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    res.headers.set(k, v);
  }
  return res;
}

/** エラーレスポンス共通ヘルパー */
export function errorResponse(
  status: number,
  error: string,
  message: string,
): NextResponse {
  return jsonResponse({ error, message }, { status });
}

/** OPTIONS (CORS preflight) 用 */
export function corsPreflightResponse(): NextResponse {
  const res = new NextResponse(null, { status: 204 });
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    res.headers.set(k, v);
  }
  return res;
}

/* ============================================================
 * ページング共通
 * ============================================================ */

export type Paging = { start: number; count: number };

/** `start` (1-origin) / `count` (1..100) パースの共通ロジック。不正値はデフォルト適用。 */
export function parsePaging(searchParams: URLSearchParams): Paging {
  const startRaw = searchParams.get("start");
  const countRaw = searchParams.get("count");
  const startParsed = startRaw ? Number.parseInt(startRaw, 10) : 1;
  const countParsed = countRaw ? Number.parseInt(countRaw, 10) : 10;
  const start = Number.isFinite(startParsed) && startParsed >= 1 ? startParsed : 1;
  const count = Number.isFinite(countParsed) && countParsed >= 1
    ? Math.min(countParsed, 100)
    : 10;
  return { start, count };
}

/* ============================================================
 * 認証 + レート制限 を一括で行うショートカット
 * ============================================================ */

/**
 * テスト環境かどうかを判定し、レート制限のバイパスが許可されているかを返す。
 *
 * - `NODE_ENV === "test"` のとき: 常に true (Vitest など)
 * - `process.env.PUBLIC_API_ALLOW_TEST_BYPASS === "1"` かつ dev/test 環境:
 *   `X-Test-Bypass-Rate-Limit: 1` ヘッダ送信時にバイパス可
 *
 * 本番環境 (NODE_ENV === "production") ではヘッダがあってもバイパスしない。
 */
function shouldBypassRateLimit(request: Request): boolean {
  if (process.env.NODE_ENV === "test") return true;
  // dev では Playwright E2E が並列実行されるためバイパスヘッダを許可
  if (process.env.NODE_ENV !== "production") {
    const header = request.headers.get("x-test-bypass-rate-limit");
    if (header === "1") return true;
  }
  return false;
}

/**
 * `validateApiAuth` → `rateLimit` の両方を実行し、失敗時は NextResponse、
 * 成功時は `null` を返す。route handler の冒頭で `if (err) return err` で使う。
 */
export function guardRequest(request: Request): NextResponse | null {
  const auth = validateApiAuth(request);
  if (!auth.ok) {
    return errorResponse(auth.status, auth.error, auth.message);
  }
  if (shouldBypassRateLimit(request)) {
    return null;
  }
  if (!rateLimit(auth.apiKey)) {
    return errorResponse(429, "rate_limited", "Too many requests (1 req/sec)");
  }
  return null;
}

/* ============================================================
 * DB 発行 API キー (`ApiKey` テーブル) 対応の認証 (async)
 *
 * 既存の同期 `validateApiAuth` / `guardRequest` は env キー
 * (`PUBLIC_API_KEY`) 専用のまま **完全に維持** し、書き込み系など
 * userId / scope が必要なエンドポイントは以下の async 版を使う。
 * env キーも従来通り受け付ける (両対応) が、ユーザーに紐づかないため
 * `userId` は付かず scope は read のみとする。
 * ============================================================ */

/** ユーザー発行 API キーの生キー接頭辞 (生キー = `te_live_` + 32byte hex) */
export const API_KEY_RAW_PREFIX = "te_live_";

/** 一覧表示用に保存する生キーの先頭文字数 (`ApiKey.prefix`) */
export const API_KEY_PREFIX_LENGTH = 12;

/** API キーのスコープ */
export type ApiScope = "read" | "write";

/**
 * `ApiKey.scopes` カラム (カンマ区切り文字列) → `ApiScope[]`。
 * 未知の値は無視し、重複は除去する。
 */
export function parseApiScopes(raw: string): ApiScope[] {
  const out: ApiScope[] = [];
  for (const part of raw.split(",")) {
    const s = part.trim();
    if ((s === "read" || s === "write") && !out.includes(s)) {
      out.push(s);
    }
  }
  return out;
}

/**
 * 生 API キーの sha256 hex ハッシュ。`ApiKey.keyHash` と同一形式。
 *
 * 生キーは DB に保存せず、このハッシュで検索・照合する
 * (等値比較を DB の UNIQUE index lookup に置き換えることで
 *  生キー同士の文字列比較そのものを行わない)。
 */
export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

/** DB キー対応の認証検証結果 */
export type DbAuthResult =
  | {
      ok: true;
      /**
       * レート制限などに使う識別子。
       * env キー: 生キーそのまま (既存 `validateApiAuth` と同じ挙動) /
       * DB キー: keyHash (生キーを持ち回らない)
       */
      apiKey: string;
      /** このキーに許可されたスコープ */
      scopes: ApiScope[];
      /** DB キーの場合のみ: 発行ユーザーの id */
      userId?: bigint;
      /** どちらの方式で認証されたか */
      source: "env" | "db";
    }
  | { ok: false; status: 401 | 403; error: string; message: string };

/** `DbAuthResult` の成功側だけを取り出した型 */
export type DbAuthOk = Extract<DbAuthResult, { ok: true }>;

/**
 * `X-API-Key` の検証 (env キー + DB 発行キーの両対応)。
 *
 * 1. User-Agent / env キー検証は既存 `validateApiAuth` に委譲
 *    - env キー一致 → `source: "env"` (userId なし / scope は read のみ)
 *    - User-Agent 不正 (403) → そのまま失敗
 * 2. env キー不一致 (401) の場合、`te_live_` 接頭辞のキーであれば
 *    sha256 ハッシュで `ApiKey` テーブルを検索
 *    - `revokedAt` が null のキーのみ有効
 *    - ヒットしたら `lastUsedAt` を更新 (失敗してもリクエストは通す)
 */
export async function validateApiAuthWithDb(
  request: Request,
): Promise<DbAuthResult> {
  const envResult = validateApiAuth(request);
  if (envResult.ok) {
    // env キーはユーザーに紐づかないため read 専用として扱う
    return {
      ok: true,
      apiKey: envResult.apiKey,
      scopes: ["read"],
      source: "env",
    };
  }
  // User-Agent 違反 (403) は DB キーでも同様に拒否
  if (envResult.status === 403) {
    return envResult;
  }

  const provided = request.headers.get("x-api-key") ?? "";
  if (!provided.startsWith(API_KEY_RAW_PREFIX)) {
    return envResult; // 401 unauthorized
  }

  const keyHash = hashApiKey(provided);
  const row = await prisma.apiKey.findUnique({ where: { keyHash } });
  if (!row || row.revokedAt !== null) {
    return {
      ok: false,
      status: 401,
      error: "unauthorized",
      message: "Invalid or missing X-API-Key header",
    };
  }

  // lastUsedAt 更新はベストエフォート (失敗してもリクエスト自体は成功させる)
  void prisma.apiKey
    .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {
      /* ignore */
    });

  return {
    ok: true,
    apiKey: keyHash,
    scopes: parseApiScopes(row.scopes),
    userId: row.userId,
    source: "db",
  };
}

/**
 * `validateApiAuthWithDb` → scope 検証 → `rateLimit` を一括で行うガード。
 *
 * 失敗時は `{ ok: false, response }` (そのまま return できる NextResponse)、
 * 成功時は `{ ok: true, auth }` を返す。
 *
 * ```ts
 * const guard = await guardRequestWithDb(request, "write");
 * if (!guard.ok) return guard.response;
 * const { userId } = guard.auth;
 * ```
 */
export async function guardRequestWithDb(
  request: Request,
  requiredScope: ApiScope = "read",
): Promise<
  { ok: true; auth: DbAuthOk } | { ok: false; response: NextResponse }
> {
  const auth = await validateApiAuthWithDb(request);
  if (!auth.ok) {
    return {
      ok: false,
      response: errorResponse(auth.status, auth.error, auth.message),
    };
  }
  if (!auth.scopes.includes(requiredScope)) {
    return {
      ok: false,
      response: errorResponse(
        403,
        "insufficient_scope",
        `API key does not have the "${requiredScope}" scope`,
      ),
    };
  }
  if (!shouldBypassRateLimit(request) && !rateLimit(auth.apiKey)) {
    return {
      ok: false,
      response: errorResponse(429, "rate_limited", "Too many requests (1 req/sec)"),
    };
  }
  return { ok: true, auth };
}
