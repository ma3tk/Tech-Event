/**
 * セッション管理ヘルパー。
 *
 * セキュリティ上の理由から、`te_session` Cookie は HMAC-SHA256 で署名する。
 * Cookie の生値は `<userId>.<signature>` の形 (signature は base64url)。
 *
 * - `setSessionCookie(userId)` で署名付き Cookie を発行。
 * - `getCurrentUser()` は署名を検証し、改ざんされた cookie を弾く。
 * - 旧形式 (純粋な数値 `User.id` のみ) は環境変数 `LEGACY_SESSION_FALLBACK=1` の
 *   ときのみ受け入れる (migration 期間)。デフォルトは旧形式を拒否。
 *
 * cookie 属性: HttpOnly / SameSite=Lax / Path=/ / secure (production のみ)。
 */
import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth as nextAuth } from "@/auth";
import type { User } from "@/generated/prisma";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SEC,
  signUserId,
  buildSessionCookieValue as buildSessionCookieValueImpl,
} from "@/lib/auth-session";

// 後方互換のため再 export (既存 import 元を破壊しない)
export { SESSION_COOKIE_NAME, buildSessionCookieValueImpl as buildSessionCookieValue };

/** 旧形式 (純数値) 受入を許可するか — 環境変数で制御 */
function isLegacySessionFallbackEnabled(): boolean {
  return process.env.LEGACY_SESSION_FALLBACK === "1";
}

/**
 * Cookie 値をパースしてユーザー ID を返す。
 *
 * - 形式: `<userId>.<signature>` (推奨)
 *   - signature を検証して一致すれば userId を返す。
 * - 旧形式: `<userId>` (純数値)
 *   - `LEGACY_SESSION_FALLBACK=1` のときのみ受け入れる。それ以外は null。
 * - 検証失敗 / 不正値は null。
 */
function parseAndVerifySessionValue(raw: string): bigint | null {
  if (!raw) return null;

  const dotIdx = raw.indexOf(".");
  if (dotIdx > 0) {
    const userIdStr = raw.slice(0, dotIdx);
    const sig = raw.slice(dotIdx + 1);
    if (!/^\d+$/.test(userIdStr) || !sig) return null;
    const expected = signUserId(userIdStr);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    try {
      if (!timingSafeEqual(a, b)) return null;
    } catch {
      return null;
    }
    try {
      return BigInt(userIdStr);
    } catch {
      return null;
    }
  }

  // 旧形式 (純数値)
  if (!isLegacySessionFallbackEnabled()) {
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        "[auth] rejecting legacy unsigned te_session cookie (set LEGACY_SESSION_FALLBACK=1 to allow during migration)",
      );
    }
    return null;
  }
  if (!/^\d+$/.test(raw)) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

/**
 * 現在のリクエストに紐づくユーザーを取得する。
 *
 * - 1st: Auth.js v5 (next-auth) のセッション (`session.user.id`) を最優先
 * - 2nd: `te_session` cookie (署名検証付き) にフォールバック
 *
 * いずれでも見つからない / 退会済みなら null。検証失敗 cookie は無視される。
 */
export async function getCurrentUser(): Promise<User | null> {
  // 1) next-auth のセッション
  // 循環依存は `@/lib/auth-session` (定数のみ) を間に挟むことで解消したので、
  // ここでは `@/auth` を通常 import で参照する (動的 import は不要)。
  let userIdFromAuthJs: bigint | null = null;
  try {
    const session = await nextAuth();
    const sid =
      session && session.user
        ? (session.user as { id?: string }).id
        : undefined;
    if (sid && /^\d+$/.test(sid)) {
      userIdFromAuthJs = BigInt(sid);
    }
  } catch {
    // next-auth が初期化されていない/エラーでも cookie fallback に進む
  }

  if (userIdFromAuthJs != null) {
    const u = await prisma.user.findUnique({
      where: { id: userIdFromAuthJs },
    });
    if (u && u.status === "active") return u;
  }

  // 2) te_session cookie (署名検証)
  const c = await cookies();
  const raw = c.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) return null;

  const userId = parseAndVerifySessionValue(raw);
  if (userId == null) {
    // 改ざん検知時は cookie を削除して未認証扱い
    try {
      c.set(SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        secure: process.env.NODE_ENV === "production",
      });
    } catch {
      // Server Component から呼ばれて set 不可な場合は無視
    }
    return null;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  if (user.status !== "active") return null;
  return user;
}

/**
 * セッション cookie をセットする (HMAC 署名付き)。
 * Server Action / Route Handler 内で利用可能。
 */
export async function setSessionCookie(userId: bigint | string): Promise<void> {
  const c = await cookies();
  const value = buildSessionCookieValueImpl(userId);
  c.set(SESSION_COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
    secure: process.env.NODE_ENV === "production",
  });
}

/**
 * セッション cookie を削除する。
 */
export async function clearSessionCookie(): Promise<void> {
  const c = await cookies();
  c.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
}
