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
  // mobile では ThemeSwitcher 等が hidden md:flex 配下にあるため未表示。
  // dark mode の挙動自体は CSS variable 検証なので desktop で十分。
  test.beforeEach(async ({}, testInfo) => {
    test.skip(
      testInfo.project.name === "chromium-mobile",
      "header の ThemeSwitcher は mobile では hidden md:flex 配下のため対象外",
    );
  });
  test("ダーク選択で html[data-theme=dark] になり localStorage に保存される", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // React hydration が完了し Radix DropdownMenu の click ハンドラが
    // wire-up されるまで待つ。CI の Turbopack dev server で hydration が
    // 遅れると「ボタンは見えるが click しても open しない」flake になる。
    // networkidle まで待つことで _next/static/chunks の遅延ロードと
    // hydration の race を吸収する。
    await page.waitForLoadState("networkidle");

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
    // React hydration が完了し Radix DropdownMenu の click ハンドラが
    // wire-up されるまで待つ。CI の Turbopack dev server で hydration が
    // 遅れると「ボタンは見えるが click しても open しない」flake になる。
    // networkidle まで待つことで _next/static/chunks の遅延ロードと
    // hydration の race を吸収する。
    await page.waitForLoadState("networkidle");
    await page.getByTestId("header-theme-toggle").click();
    // Radix DropdownMenu の open animation 後に click (CI flake 対策)
    const darkItem = page.getByTestId("theme-dark");
    await expect(darkItem).toBeVisible();
    await darkItem.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.getByTestId("header-theme-toggle").click();
    const lightItem = page.getByTestId("theme-light");
    await expect(lightItem).toBeVisible();
    await lightItem.click();
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
    const ctx = await browser.newContext({
      colorScheme: "dark",
      baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    });
    const page = await ctx.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // React hydration が完了し Radix DropdownMenu の click ハンドラが
    // wire-up されるまで待つ。CI の Turbopack dev server で hydration が
    // 遅れると「ボタンは見えるが click しても open しない」flake になる。
    // networkidle まで待つことで _next/static/chunks の遅延ロードと
    // hydration の race を吸収する。
    await page.waitForLoadState("networkidle");

    await page.getByTestId("header-theme-toggle").click();
    const systemItem = page.getByTestId("theme-system");
    await expect(systemItem).toBeVisible();
    await systemItem.click();

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
    const ctx = await browser.newContext({
      baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    });
    const page = await ctx.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // React hydration が完了し Radix DropdownMenu の click ハンドラが
    // wire-up されるまで待つ。CI の Turbopack dev server で hydration が
    // 遅れると「ボタンは見えるが click しても open しない」flake になる。
    // networkidle まで待つことで _next/static/chunks の遅延ロードと
    // hydration の race を吸収する。
    await page.waitForLoadState("networkidle");

    await page.getByTestId("header-theme-toggle").click();
    const darkItem = page.getByTestId("theme-dark");
    await expect(darkItem).toBeVisible();
    await darkItem.click();
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
