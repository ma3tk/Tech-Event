import { test, expect } from "@playwright/test";

/**
 * Dark mode toggle の挙動を E2E で確認する。
 *
 * - Header の `data-testid="header-theme-toggle"` ボタンが存在しクリック可能
 * - 「ダーク」選択で `<html data-theme="dark">` になる
 * - 「ライト」選択で `<html data-theme="light">` に戻る
 * - 「システム」選択で OS の `prefers-color-scheme` に追従する
 *   (Playwright の `emulateMedia` で dark を強制)
 * - 選択値は localStorage `tech-event:theme` に永続化される
 * - リロード後も保持されている
 */

const STORAGE_KEY = "tech-event:theme";

test.describe("Header dark mode toggle", () => {
  test("ダーク選択で html[data-theme=dark] になり localStorage に保存される", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const toggle = page.getByTestId("header-theme-toggle");
    await expect(toggle).toBeVisible();
    await toggle.click();

    const darkItem = page.getByTestId("theme-dark");
    await expect(darkItem).toBeVisible();
    await darkItem.click();

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      STORAGE_KEY,
    );
    expect(stored).toBe("dark");
  });

  test("ライト選択で html[data-theme=light] に戻る", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByTestId("header-theme-toggle").click();
    await page.getByTestId("theme-dark").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.getByTestId("header-theme-toggle").click();
    await page.getByTestId("theme-light").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      STORAGE_KEY,
    );
    expect(stored).toBe("light");
  });

  test("システム選択で prefers-color-scheme に追従する", async ({
    browser,
  }) => {
    // dark を OS が好む状態でコンテキストを起こす
    const ctx = await browser.newContext({ colorScheme: "dark" });
    const page = await ctx.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await page.getByTestId("header-theme-toggle").click();
    await page.getByTestId("theme-system").click();

    // system + OS=dark → resolved=dark
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      STORAGE_KEY,
    );
    expect(stored).toBe("system");

    // OS 設定を light に変えると追従する
    await page.emulateMedia({ colorScheme: "light" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await ctx.close();
  });

  test("リロード後も localStorage の選択値が維持される", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await page.getByTestId("header-theme-toggle").click();
    await page.getByTestId("theme-dark").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.reload({ waitUntil: "domcontentloaded" });
    // mount 後の effect で localStorage を読んで dark を再適用する
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      STORAGE_KEY,
    );
    expect(stored).toBe("dark");

    await ctx.close();
  });
});
