/**
 * ブックマーク → カレンダー UX 改善の E2E。
 *
 * 既存 P1 機能 (`全件をカレンダーに追加`) は維持しつつ、新規モーダルで:
 *  - 個別 / 全選択 / 全解除
 *  - 新規カレンダー名 / 説明文入力
 *  - 「カレンダーに追加」で新規 calendar が作成され、選択した eventIds のみが添付される
 *
 * シナリオ:
 *  1. fast_moon_169 で /bookmarks にアクセス (seed Bookmark がある想定)
 *  2. 「全選択」「全解除」が動くこと
 *  3. 3 件 (もしくは Bookmark 全件中 3 件以内) を選択 → モーダルを開く
 *  4. 名前を変更 → カレンダーに追加 → /calendar/<slug> へ遷移
 *
 * 注意: seed 状態に依存。Bookmark が 0 件のユーザーだとボタン非表示でテストできないので
 * fast_moon_169 (seed の user1) を使う。
 */
import { test, expect } from "@playwright/test";

import { devLoginLegacy as devLogin } from "./_helpers/auth";

const USER = "fast_moon_169";

test.describe("ブックマーク → カレンダー UX (P2)", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("選択 → 新規カレンダー作成 → 遷移完了", async ({ page }) => {
    // 事前: seed には fast_moon_169 用 Bookmark が無いので、まず 1 件ブックマークしておく。
    await devLogin(page, USER, `/event/2`);
    const form = page.getByTestId("bookmark-form-off").first();
    if (await form.count()) {
      await form.locator('button[type="submit"]').first().click();
      await page.waitForLoadState("domcontentloaded").catch(() => undefined);
    }

    await page.goto("/bookmarks");
    const tool = page.getByTestId("bookmarks-calendar-tool");
    // それでも Bookmark が 0 件なら skip
    if ((await tool.count()) === 0) {
      test.skip(true, "Bookmark の作成 UI が seed と異なる (テスト対象外)");
      return;
    }
    await expect(tool).toBeVisible();

    // 全選択
    await page.getByTestId("bookmarks-select-all").click();
    // 選択件数 > 0 を確認
    const countText = await page
      .getByTestId("bookmarks-selected-count")
      .textContent();
    const initialCount = Number((countText ?? "0").trim()) || 0;
    expect(initialCount).toBeGreaterThan(0);

    // 全解除 → 0
    await page.getByTestId("bookmarks-select-none").click();
    await expect(page.getByTestId("bookmarks-selected-count")).toHaveText("0");

    // 最大 3 件を個別選択 (DOM 上の bookmark 行)
    const checkboxes = page.locator(
      'input[type="checkbox"][data-bookmark-event-id]',
    );
    const total = await checkboxes.count();
    const target = Math.min(3, total);
    for (let i = 0; i < target; i++) {
      await checkboxes.nth(i).check();
    }
    await expect(page.getByTestId("bookmarks-selected-count")).toHaveText(
      String(target),
    );

    // モーダルを開く
    await page
      .getByTestId("bookmarks-create-calendar-from-selection")
      .click();
    await expect(page.getByTestId("bookmarks-calendar-modal")).toBeVisible();

    // 名前を上書き
    const name = `e2e-bookmarks-${Date.now()}`;
    await page.getByTestId("bookmarks-calendar-name").fill(name);

    // 追加
    await page.getByTestId("bookmarks-calendar-submit").click();

    // /calendar/<slug> ページに遷移する
    await page.waitForURL(/\/calendar\/bookmarks-/, { timeout: 15_000 });
    await expect(page.locator("h1")).toBeVisible();
  });
});
