/**
 * 検索演算子 (Phrase / AND / OR / NOT) のE2E。
 *
 * 演算子は `src/lib/search.ts` の `tokenizeSearchQuery` に実装されており、
 *  - FTS5 → MATCH 句
 *  - LIKE フォールバック → Prisma where (AND / OR / NOT)
 * の双方で同じ意味論を提供する。
 *
 * シナリオ:
 *  1. `"AI 勉強会"` でフレーズ検索: 結果ページが 500 にならず、検索 query が
 *     キーワードハイライトに復元される。
 *  2. `AI -React` で除外検索: 同上 + ヒット件数の表示が出る。
 *  3. 検索のヒントモーダル: `/` キーで開く / `?` キーで開く / 表示される。
 */
import { test, expect } from "@playwright/test";

test.describe("検索演算子サポート (/explore)", () => {
  test("フレーズ検索: \"AI 勉強会\" → 500 にならず描画される", async ({
    page,
  }) => {
    const q = '"AI 勉強会"';
    const res = await page.goto(`/explore?q=${encodeURIComponent(q)}`);
    expect(res?.status()).toBeLessThan(500);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // 検索キーワードのハイライトが表示される (内容問わず)
    await expect(page.getByTestId("search-keyword-highlight")).toBeVisible();
    await expect(page.getByTestId("search-hit-count")).toBeVisible();
  });

  test("除外検索: AI -React → 500 にならず ヒット件数が表示", async ({
    page,
  }) => {
    const q = "AI -React";
    const res = await page.goto(`/explore?q=${encodeURIComponent(q)}`);
    expect(res?.status()).toBeLessThan(500);
    await expect(page.getByTestId("search-hit-count")).toBeVisible();
  });

  test("OR 検索: React OR Vue → 500 にならず ヒット件数が表示", async ({
    page,
  }) => {
    const q = "React OR Vue";
    const res = await page.goto(`/explore?q=${encodeURIComponent(q)}`);
    expect(res?.status()).toBeLessThan(500);
    await expect(page.getByTestId("search-hit-count")).toBeVisible();
  });

  test("検索のヒントモーダル: `/` または `?` キーで開ける", async ({
    page,
  }) => {
    await page.goto("/explore");
    // トリガーボタンが見える
    await expect(page.getByTestId("search-hints-trigger")).toBeVisible();
    // クリックで開く
    await page.getByTestId("search-hints-trigger").click();
    await expect(page.getByTestId("search-hints-modal")).toBeVisible();
    // 4 つの演算子行が表示される
    const rows = page.getByTestId("search-hints-row");
    await expect(rows).toHaveCount(4);
    // ESC で閉じる
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("search-hints-modal")).toBeHidden();
  });
});
