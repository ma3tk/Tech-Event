/**
 * セッション関連の最小定数 & プリミティブヘルパー。
 *
 * `@/lib/auth` と `@/auth` (next-auth) の循環依存を避けるためのファイル分離。
 *
 * - 旧構成: `auth.ts` (next-auth) → `@/lib/auth` (SESSION_COOKIE_NAME 等) →
 *   `getCurrentUser()` 内で `await import("@/auth")` (= ランタイム動的解決)
 * - 新構成: `auth.ts` (next-auth) も `@/lib/auth` も、共通の定数と署名ヘルパーを
 *   本ファイルから取得する。これにより `@/lib/auth` から `@/auth` を通常 import
 *   しても循環せず、動的 import が不要になる。
 *
 * 本ファイル自身は次のものだけに依存する: Node `crypto`、`process.env`。
 * `next/headers` や Prisma へは依存しないため、edge / node 双方で利用可能。
 */
import { createHmac } from "node:crypto";

/** te_session Cookie 名 */
export const SESSION_COOKIE_NAME = "te_session";

/** 30 日 (秒) */
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30;

/**
 * 署名に使うシークレットを取得する。
 *
 * - production で未設定なら throw (起動時 fail-close)。
 * - 非 production では dev フォールバック値を使う (開発ローカル用)。
 */
export function getSessionSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length > 0) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set in production");
  }
  return "dev-auth-secret-please-change";
}

/** base64url エンコード (RFC 4648) */
function base64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** userId 文字列に対する HMAC-SHA256 署名 (base64url) を返す */
export function signUserId(userId: string): string {
  const h = createHmac("sha256", getSessionSecret()).update(userId).digest();
  return base64url(h);
}

/** Cookie に書き込む値 (`<userId>.<signature>`) を生成 */
export function buildSessionCookieValue(userId: bigint | string): string {
  const idStr =
    typeof userId === "bigint" ? userId.toString() : String(userId);
  const sig = signUserId(idStr);
  return `${idStr}.${sig}`;
}
