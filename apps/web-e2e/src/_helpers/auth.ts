/**
 * E2E 共通: dev-login ヘルパー。
 *
 * 各 spec で個別に定義していた `devLogin(page, nickname, nextPath)` を
 * 共通化したもの。`/api/auth/dev-login` は dev / test 環境でのみ有効な
 * バックドアで、nickname → User.id をマッピングしてセッション cookie を
 * 発行する。
 *
 * 戻り値はなく、ページ遷移完了後に解決する。
 *
 * CI 用フォールバック: Turbopack の app-route compile が初回 hit で間に合わない
 * (or env が ENABLE_DEV_LOGIN を読めない) ケースが起きると dev-login は 404 を返す。
 * `loginByCookie(...)` で session cookie を直接合成してフォールバックできる。
 */
import { createHmac } from "node:crypto";
import Database from "better-sqlite3";
import path from "node:path";
import type { BrowserContext, Page } from "@playwright/test";

/** デフォルトの dev-login ユーザー (seed: id=1) */
export const DEFAULT_DEV_USER = "fast_moon_169";

export interface DevLoginOptions {
  /** リダイレクト先パス (デフォルト: "/dashboard") */
  next?: string;
  /** 遷移後の URL チェックをスキップしたい時 (デフォルト false) */
  skipWaitForUrl?: boolean;
}

/**
 * `/api/auth/dev-login?nickname=...&next=...` にアクセスして
 * セッション cookie を発行し、`next` で指定したページに遷移する。
 *
 * @param page Playwright Page
 * @param nickname dev-login で受け入れる seed ユーザー nickname (デフォルト: `fast_moon_169`)
 * @param opts 追加オプション (`next`, `skipWaitForUrl`)
 */
export async function devLogin(
  page: Page,
  nickname: string = DEFAULT_DEV_USER,
  opts: DevLoginOptions = {},
): Promise<void> {
  const nextPath = opts.next ?? "/dashboard";
  // CI で Turbopack の app-route compile timing もしくは env 伝搬の問題で
  // /api/auth/dev-login が 404 を返す事象があるため、まず session cookie を
  // 直接合成して context にセットし、page.goto で nextPath に直接アクセスする。
  // cookie 合成失敗時 (dev.db に user がいない等) は従来通り HTTP route に fallback。
  try {
    await loginByCookie(page.context(), nickname);
    await page.goto(nextPath);
  } catch (e) {
    console.warn(
      `[devLogin] loginByCookie failed (${e}). dev-login HTTP route にフォールバック。`,
    );
    await page.goto(
      `/api/auth/dev-login?nickname=${encodeURIComponent(
        nickname,
      )}&next=${encodeURIComponent(nextPath)}`,
    );
    if (!opts.skipWaitForUrl) {
      // `[/]` を `\/` にエスケープして RegExp として渡す
      await page.waitForURL(new RegExp(nextPath.replace(/[/]/g, "\\/")));
    }
  }
}

/**
 * 後方互換: 旧シグネチャ (page, nickname, nextPath) でも呼べるラッパ。
 *
 * 旧実装は以下のような細かい違いを持っていたが、概ね「nextPath で示すパスに
 * 遷移するまで待つ」という挙動。差分は許容して、pathname プレフィックス一致
 * (=サブパスやクエリ付き URL も OK) で待つ統一実装にする。
 *
 * 既存 spec を段階的に置換するための互換層。
 */
export async function devLoginLegacy(
  page: Page,
  nickname: string,
  nextPath: string,
): Promise<void> {
  // cookie 合成優先、失敗時 HTTP route fallback (devLogin と同じパターン)
  try {
    await loginByCookie(page.context(), nickname);
    await page.goto(nextPath);
  } catch (e) {
    console.warn(
      `[devLoginLegacy] loginByCookie failed (${e}). dev-login HTTP route にフォールバック。`,
    );
    const url = `/api/auth/dev-login?nickname=${encodeURIComponent(
      nickname,
    )}&next=${encodeURIComponent(nextPath)}`;
    await page.goto(url);
    const expectedPathname = nextPath.split("?")[0]!;
    await page.waitForURL((u) => u.pathname.startsWith(expectedPathname));
  }
}

// ============================================================
// loginByCookie — dev-login HTTP route を経由せず session cookie を直接合成。
// CI で Turbopack の app-route compile が間に合わず dev-login が 404 を返す
// 状況のフォールバックとして使う。形式は `<userId>.<HMAC-SHA256(userId, AUTH_SECRET)>`
// (`libs/shared/util-auth-session/src/auth-session.ts` の signUserId に一致)。
// ============================================================
const SESSION_COOKIE_NAME = "te_session";
const DEV_DB_PATH = path.resolve(__dirname, "../../../web/dev.db");

function base64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function signUserId(userId: string, secret: string): string {
  const h = createHmac("sha256", secret).update(userId).digest();
  return base64url(h);
}

function buildSessionCookieValue(userId: string | bigint, secret: string): string {
  const idStr = typeof userId === "bigint" ? userId.toString() : userId;
  return `${idStr}.${signUserId(idStr, secret)}`;
}

function resolveUserId(nickname: string): string {
  const db = new Database(DEV_DB_PATH, { readonly: true });
  try {
    const row = db
      .prepare("SELECT id FROM users WHERE nickname = ?")
      .get(nickname) as { id: number | bigint } | undefined;
    if (!row) {
      // 診断: テーブル内容を log してから throw する
      let usersInDb: { nickname: string }[] = [];
      try {
        usersInDb = db
          .prepare("SELECT nickname FROM users LIMIT 10")
          .all() as { nickname: string }[];
      } catch {
        // テーブルがない場合
      }
      throw new Error(
        `[loginByCookie] user not found in dev.db: ${nickname}. DB_PATH=${DEV_DB_PATH}, users sample=${JSON.stringify(usersInDb)}`,
      );
    }
    return String(row.id);
  } finally {
    db.close();
  }
}

/**
 * BrowserContext に te_session cookie を直接セットする。
 * dev-login HTTP route を呼ばないため、Turbopack compile timing や env 未伝搬の
 * 影響を受けず CI でも安定する。
 *
 * @param context Playwright BrowserContext
 * @param nickname dev.db に存在する user nickname (デフォルト: `fast_moon_169`)
 */
export async function loginByCookie(
  context: BrowserContext,
  nickname: string = DEFAULT_DEV_USER,
): Promise<void> {
  // util-auth-session.ts の getSessionSecret() の fallback と完全一致させる必要がある
  // (cookie の HMAC 署名を server 側で verify するため)
  const secret = process.env.AUTH_SECRET ?? "dev-auth-secret-please-change";
  const userId = resolveUserId(nickname);
  const value = buildSessionCookieValue(userId, secret);
  await context.addCookies([
    {
      name: SESSION_COOKIE_NAME,
      value,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      // production フラグは false (Playwright は http://localhost に対して secure を許容しない)
      secure: false,
    },
  ]);
}
