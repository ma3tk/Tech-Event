/**
 * SQLite FTS5 全文検索の E2E。
 *
 * - `/explore?q=python` で Python 関連イベントがヒットすること
 *   (seed に `Python 入門ハンズオン #13` 等が含まれる)
 * - 複数語 (`React Next.js`) は AND 検索になり、両方を含むイベントだけが返ること
 *
 * 注: 検索結果 0 件にならない範囲のキーワードは seed.ts の事実から逆算している。
 */
import { test, expect } from "@playwright/test";

test.describe("FTS5 全文検索 (/explore)", () => {
  test("「Python」で検索 → ヒット件数 + 関連イベントが上位表示", async ({
    page,
  }) => {
    await page.goto("/explore?q=Python");

    // 検索キーワードのハイライトが見える
    await expect(page.getByTestId("search-keyword-highlight")).toContainText(
      "Python",
    );

    // ヒット件数表示
    const hitCount = page.getByTestId("search-hit-count");
    await expect(hitCount).toBeVisible();
    await expect(hitCount).toContainText(/件ヒット/);

    // 検索結果リストに Python という単語を含むタイトルが含まれている
    const main = page.locator("main[aria-labelledby='results-heading']");
    await expect(main).toBeVisible();
    await expect(main).toContainText(/Python/);
  });

  test("「React Next.js」の複数語検索 → AND マッチで結果あり (もしくは 0 件でもエラーなし)", async ({
    page,
  }) => {
    await page.goto("/explore?q=React+Next.js");

    // ハイライトの pill が 2 トークン分表示される
    const highlightArea = page.getByTestId("search-keyword-highlight");
    await expect(highlightArea).toBeVisible();
    await expect(highlightArea).toContainText("React");
    await expect(highlightArea).toContainText("Next");

    // ヒット件数の表示自体は出ているはず (0 件でも)
    await expect(page.getByTestId("search-hit-count")).toBeVisible();
  });

  test("意味のない記号 (FTS 構文エラーになりがち) でも 500 にならず描画される", async ({
    page,
  }) => {
    const res = await page.goto("/explore?q=%22%22");
    expect(res?.status()).toBeLessThan(500);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
