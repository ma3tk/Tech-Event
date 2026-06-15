/**
 * `/bookmarks` 専用ページの E2E。
 *
 * - dev-login で `fast_moon_169` としてログイン
 * - 数件のイベントを bookmark してから /bookmarks に遷移
 * - 一覧の表示と削除挙動を確認
 *
 * 並列実行時に他テストのブックマーク状態と干渉しないように、テスト先頭で
 * 自分の Bookmark を空にしておく (event 詳細ページの toggle で OFF にする
 * のは手間なので、一覧から「解除」を順次クリックして整地する)。
 */
import { test, expect } from "@playwright/test";
import { devLoginLegacy as devLogin } from "./_helpers/auth";
import { clickUntil } from "./_helpers/actions";

// 並列実行中に fast_moon_169 を使う他テスト (comment-bookmark など) と
// 同一ユーザーの Bookmark 状態を奪い合うと不安定になるので、別シードユーザー
// `calm_owl_42` (id=2) を使う。
const DEV_USER = "calm_owl_42";
// EVENT_IDS は calm_owl_42 が owner / 参加 していないイベントを選ぶ。
// (event 2 は calm_owl_42 が owner → 除外)
const EVENT_IDS = ["3", "4", "5"] as const;

// 同一ユーザーの bookmark 状態を共有するので、ファイル内テスト同士は serial で。
test.describe.configure({ mode: "serial" });

async function ensureBookmarked(
  page: import("@playwright/test").Page,
  eventId: string,
): Promise<void> {
  await page.goto(`/event/${eventId}`, { waitUntil: "domcontentloaded" });
  const btn = page.getByTestId("bookmark-button");
  await expect(btn).toBeVisible();
  if ((await btn.getAttribute("data-bookmarked")) === "true") return;
  // bookmark-button は ActionForm ("use client") の submit ボタン。
  // hydration 途中の click は dead-click になり得るため clickUntil でリトライしつつ
  // data-bookmarked が "true" に確定するまで待つ
  // (`networkidle` は Next dev サーバの HMR WS で永遠に待つため避ける)。
  await clickUntil(btn, async () => {
    await expect(page.getByTestId("bookmark-button")).toHaveAttribute(
      "data-bookmarked",
      "true",
    );
  });
}

async function clearAllBookmarks(
  page: import("@playwright/test").Page,
): Promise<void> {
  for (let i = 0; i < 20; i++) {
    await page.goto("/bookmarks", { waitUntil: "domcontentloaded" });
    const removeBtnLocator = page.getByTestId("bookmarks-remove");
    const count = await removeBtnLocator.count();
    if (count === 0) return;
    // bookmarks-remove も ActionForm の submit。hydration race を吸収するため
    // clickUntil で「bookmark-item の件数が count 未満になる」を outcome として待つ
    // (= 削除が確実に DOM に反映されるまでリトライ)。最後の 1 件削除時は空状態でも OK。
    await clickUntil(removeBtnLocator.first(), async () => {
      const remaining = await page.getByTestId("bookmark-item").count();
      expect(remaining).toBeLessThan(count);
    });
  }
}

test.describe("/bookmarks ページ", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("未ログインは /login へリダイレクト", async ({ page }) => {
    await page.goto("/bookmarks");
    await expect(page).toHaveURL(/\/login/);
  });

  test("複数 bookmark → /bookmarks 表示 → 削除", async ({ page }) => {
    await devLogin(page, DEV_USER, "/dashboard");

    // 既存 Bookmark を全削除して状態を揃える
    await clearAllBookmarks(page);

    // 3 件のイベントを bookmark する
    for (const id of EVENT_IDS) {
      await ensureBookmarked(page, id);
    }

    // /bookmarks に遷移し、3 件以上表示されていることを確認
    await page.goto("/bookmarks", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("bookmarks-heading")).toBeVisible();

    const items = page.getByTestId("bookmark-item");
    await expect(items).toHaveCount(EVENT_IDS.length);

    // 一括カレンダー化ボタンが表示されている
    await expect(page.getByTestId("bookmarks-create-calendar")).toBeVisible();

    // 1 件削除すると、件数が 1 減ること。
    // ActionForm submit の hydration race を吸収するため clickUntil でリトライしつつ待つ。
    await clickUntil(
      page.getByTestId("bookmarks-remove").first(),
      async () => {
        await expect(page.getByTestId("bookmark-item")).toHaveCount(
          EVENT_IDS.length - 1,
        );
      },
    );

    // 残りを掃除しておく (副作用最小化)
    await clearAllBookmarks(page);
    await expect(page.getByTestId("bookmarks-empty")).toBeVisible();
  });
});
