/**
 * E2E 共通: dev-login ヘルパー。
 *
 * 各 spec で個別に定義していた `devLogin(page, nickname, nextPath)` を
 * 共通化したもの。`/api/auth/dev-login` は dev / test 環境でのみ有効な
 * バックドアで、nickname → User.id をマッピングしてセッション cookie を
 * 発行する。
 *
 * 戻り値はなく、ページ遷移完了後に解決する。
 */
import type { Page } from "@playwright/test";

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
  const url = `/api/auth/dev-login?nickname=${encodeURIComponent(
    nickname,
  )}&next=${encodeURIComponent(nextPath)}`;
  await page.goto(url);
  // クエリを含む nextPath にも対応するため pathname プレフィックス一致で待つ
  const expectedPathname = nextPath.split("?")[0]!;
  await page.waitForURL((u) => u.pathname.startsWith(expectedPathname));
}
