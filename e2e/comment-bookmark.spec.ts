/**
 * コメント投稿 / ブックマーク UI の E2E。
 *
 * 前提:
 *   - dev サーバが http://localhost:3000 で起動済み
 *   - シードユーザー `fast_moon_169` (id=1) が存在する
 *   - event id=1 は published かつコメント可能
 *
 * 検証項目:
 *   1. dev-login → /event/1 → コメント投稿 → 表示確認 → 削除 → 消失確認
 *   2. dev-login → /event/1 → ブックマーク ON → 「ブックマーク中」表示 → 解除
 */
import { test, expect } from "@playwright/test";
import { devLoginLegacy as devLogin } from "./_helpers/auth";

const DEV_USER = "fast_moon_169";
const EVENT_ID = "1";

test.describe("コメント投稿", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("コメント投稿 → 表示 → 削除 → 消失", async ({ page }) => {
    await devLogin(page, DEV_USER, `/event/${EVENT_ID}`);

    const unique = `e2e-comment-${Date.now()}`;
    const form = page.getByTestId("comment-post-form");
    await expect(form).toBeVisible();

    await form.locator("textarea[name=body]").fill(unique);
    await form.getByRole("button", { name: "投稿" }).click();

    await page.waitForLoadState("networkidle");

    // 投稿したコメントが画面に表示される
    await expect(page.locator(`text=${unique}`)).toBeVisible();

    // 自分のコメントには削除ボタンが付いている
    const deleteBtn = page
      .locator(`li:has-text("${unique}")`)
      .getByRole("button", { name: "削除" })
      .first();
    await expect(deleteBtn).toBeVisible();

    // 削除を実行
    await deleteBtn.click();
    await page.waitForLoadState("networkidle");

    // 投稿テキストが消えていること
    await expect(page.locator(`text=${unique}`)).toHaveCount(0);
  });
});

test.describe("ブックマーク", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("ブックマーク → 「ブックマーク中」表示 → 解除", async ({ page }) => {
    await devLogin(page, DEV_USER, `/event/${EVENT_ID}`);

    // 開始時の状態を確認: もし既に bookmarked ならまず解除する (テスト冪等性)
    const initial = page.getByTestId("bookmark-button");
    await expect(initial).toBeVisible();
    if ((await initial.getAttribute("data-bookmarked")) === "true") {
      await initial.click();
      await page.waitForLoadState("networkidle");
    }

    // 解除状態 (OFF) になっているはず
    const offButton = page.getByTestId("bookmark-button");
    await expect(offButton).toHaveAttribute("data-bookmarked", "false");

    // ON にする
    await offButton.click();
    await page.waitForLoadState("networkidle");

    const onButton = page.getByTestId("bookmark-button");
    await expect(onButton).toHaveAttribute("data-bookmarked", "true");
    await expect(onButton).toContainText("ブックマーク中");

    // 解除
    await onButton.click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("bookmark-button")).toHaveAttribute(
      "data-bookmarked",
      "false",
    );
  });

  test("未ログイン時はログインリンクが表示される", async ({ page }) => {
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByTestId("bookmark-login-link")).toBeVisible();
  });
});
