/**
 * Toast 通知 E2E
 *
 * Server Action を `<ActionForm>` でラップしたフォーム送信が完了すると、
 * `sonner` のトーストが表示されることを確認する。
 *
 * 検証項目:
 *   1. /event/<id> 参加申込 → 「✓ 参加申込しました」
 *   2. 参加キャンセル → 「ℹ︎ 参加をキャンセルしました」
 *   3. ブックマーク → 「♡ ブックマークしました」
 *   4. ブックマーク解除 → 「ℹ︎ ブックマークを解除しました」
 *
 * 注: sonner の出力は `[data-sonner-toast]` 要素で、role="status" として出る。
 */
import { test, expect } from "@playwright/test";
import { devLoginLegacy as devLogin } from "./_helpers/auth";

const DEV_USER = "fast_moon_169";
// participate.spec.ts と同じく id=11 を使う (確実に accepting カテゴリ)
const ACCEPTING_EVENT_ID = "11";

async function resetParticipation(
  page: import("@playwright/test").Page,
): Promise<void> {
  // 既に参加中ならキャンセルしておく。
  // Server Action の revalidate 再レンダリング完了は networkidle ではなく、
  // 「申込ボタン (= 未参加状態) が再描画される」ことを web-first assertion で待つ。
  const cancelBtn = page.getByRole("button", {
    name: /参加をキャンセル|補欠登録をキャンセル/,
  });
  if (await cancelBtn.first().isVisible().catch(() => false)) {
    await cancelBtn.first().click();
    await expect(
      page.getByRole("button", { name: "参加申込" }).first(),
    ).toBeVisible({ timeout: 15_000 });
  }
}

async function resetBookmark(
  page: import("@playwright/test").Page,
): Promise<void> {
  const btn = page.getByTestId("bookmark-button");
  if ((await btn.getAttribute("data-bookmarked")) === "true") {
    await btn.click();
    // data-bookmarked が "false" に確定するまで待つ (networkidle は HMR WS で
    // 永遠に待つ可能性があるため避ける)。
    await expect(page.getByTestId("bookmark-button")).toHaveAttribute(
      "data-bookmarked",
      "false",
      { timeout: 15_000 },
    );
  }
}

test.describe("Toast 通知 (Server Action ラッパ)", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("参加申込 → toast", async ({ page }) => {
    await devLogin(page, DEV_USER, `/event/${ACCEPTING_EVENT_ID}`);
    await resetParticipation(page);

    const joinBtn = page.getByRole("button", { name: "参加申込" });
    await expect(joinBtn.first()).toBeVisible();
    await joinBtn.first().click();

    // sonner toast 確認 (テキスト一致)
    await expect(
      page.locator("[data-sonner-toast]").filter({ hasText: "参加申込しました" }),
    ).toBeVisible({ timeout: 8000 });

    // テスト後のデータをクリーンアップ (visual テスト等が参加状態に影響されないため)
    await resetParticipation(page);
  });

  test("参加キャンセル → toast", async ({ page }) => {
    await devLogin(page, DEV_USER, `/event/${ACCEPTING_EVENT_ID}`);

    // まず申込状態を作る (毎テスト独立のため)
    await resetParticipation(page);
    const joinBtn = page.getByRole("button", { name: "参加申込" });
    if (await joinBtn.first().isVisible().catch(() => false)) {
      await joinBtn.first().click();
      // 申込確定 (= キャンセルボタンの再描画) を待ってから次の操作へ。
      await expect(
        page.getByRole("button", { name: "参加をキャンセル" }),
      ).toBeVisible({ timeout: 15_000 });
    }

    const cancelBtn = page.getByRole("button", { name: "参加をキャンセル" });
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    await expect(
      page
        .locator("[data-sonner-toast]")
        .filter({ hasText: "参加をキャンセルしました" }),
    ).toBeVisible({ timeout: 8000 });
  });

  test("ブックマーク → toast", async ({ page }) => {
    await devLogin(page, DEV_USER, `/event/${ACCEPTING_EVENT_ID}`);
    await resetBookmark(page);

    const offBtn = page.getByTestId("bookmark-button");
    await expect(offBtn).toHaveAttribute("data-bookmarked", "false");
    await offBtn.click();

    await expect(
      page
        .locator("[data-sonner-toast]")
        .filter({ hasText: "ブックマークしました" }),
    ).toBeVisible({ timeout: 8000 });

    // テスト後のデータをクリーンアップ
    await resetBookmark(page);
  });

  test("ブックマーク解除 → toast", async ({ page }) => {
    await devLogin(page, DEV_USER, `/event/${ACCEPTING_EVENT_ID}`);
    await resetBookmark(page);

    // まずブックマーク状態にする
    const offBtn = page.getByTestId("bookmark-button");
    if ((await offBtn.getAttribute("data-bookmarked")) === "false") {
      await offBtn.click();
      // data-bookmarked が "true" に確定するまで待つ。
      await expect(page.getByTestId("bookmark-button")).toHaveAttribute(
        "data-bookmarked",
        "true",
        { timeout: 15_000 },
      );
    }

    const onBtn = page.getByTestId("bookmark-button");
    await expect(onBtn).toHaveAttribute("data-bookmarked", "true");
    await onBtn.click();

    await expect(
      page
        .locator("[data-sonner-toast]")
        .filter({ hasText: "ブックマークを解除しました" }),
    ).toBeVisible({ timeout: 8000 });
  });
});
