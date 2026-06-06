/**
 * High Contrast モードの E2E 検証。
 *
 * 1. Header の theme toggle から「High Contrast」を選んで `<html data-contrast="more">`
 *    が付与されること、localStorage `tech-event:contrast` = "more" になることを確認
 * 2. 「通常」に戻して `<html data-contrast="normal">` になることを確認
 * 3. リロード後も localStorage の選択値が維持されること
 * 4. 主要 3 ページ (top / explore / event 詳細) で High Contrast 適用後に
 *    axe-core の critical / serious 違反が 0 件であることを確認
 *
 * 既存の `e2e/a11y-pages.spec.ts` と同じく `color-contrast` 既知違反 ID は
 * 除外せずに **AAA-warm-up** として全件 fail させる方針 (High Contrast の
 * 目的そのものがコントラストを上げることなので、ここでは厳しめに見る)。
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const CONTRAST_STORAGE_KEY = "tech-event:contrast";

test.describe("Header High Contrast toggle", () => {
  // mobile では ThemeSwitcher が hidden md:flex 配下のため未表示。
  test.beforeEach(async ({}, testInfo) => {
    test.skip(
      testInfo.project.name === "chromium-mobile",
      "header の ThemeSwitcher は mobile では hidden md:flex 配下のため対象外",
    );
  });
  test("High Contrast 選択で html[data-contrast=more] になり localStorage に保存される", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const toggle = page.getByTestId("header-theme-toggle");
    await expect(toggle).toBeVisible();
    await toggle.click();

    const moreItem = page.getByTestId("contrast-more");
    await expect(moreItem).toBeVisible();
    await moreItem.click();

    await expect(page.locator("html")).toHaveAttribute("data-contrast", "more");

    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      CONTRAST_STORAGE_KEY,
    );
    expect(stored).toBe("more");
  });

  test("通常選択で html[data-contrast=normal] に戻る", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByTestId("header-theme-toggle").click();
    // Radix DropdownMenu の open animation 後に click (CI flake 対策)
    const moreItem = page.getByTestId("contrast-more");
    await expect(moreItem).toBeVisible();
    await moreItem.click();
    await expect(page.locator("html")).toHaveAttribute("data-contrast", "more");

    await page.getByTestId("header-theme-toggle").click();
    const normalItem = page.getByTestId("contrast-normal");
    await expect(normalItem).toBeVisible();
    await normalItem.click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-contrast",
      "normal",
    );

    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      CONTRAST_STORAGE_KEY,
    );
    expect(stored).toBe("normal");
  });

  test("リロード後も localStorage の選択値が維持される", async ({ browser }) => {
    const ctx = await browser.newContext({
      // newContext は config の use.baseURL を継承するが、明示の方が flake 耐性が上がる。
      baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    });
    const page = await ctx.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await page.getByTestId("header-theme-toggle").click();
    // Radix DropdownMenu の open animation を待ってから click する (CI flake 対策)
    const moreItem = page.getByTestId("contrast-more");
    await expect(moreItem).toBeVisible();
    await moreItem.click();
    await expect(page.locator("html")).toHaveAttribute("data-contrast", "more");

    await page.reload({ waitUntil: "domcontentloaded" });
    // mount 後の effect で localStorage を読んで more を再適用する
    await expect(page.locator("html")).toHaveAttribute("data-contrast", "more");
    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      CONTRAST_STORAGE_KEY,
    );
    expect(stored).toBe("more");

    await ctx.close();
  });
});

test.describe("High Contrast 主要ページ axe チェック", () => {
  const PAGES = [
    { name: "top", url: "/" },
    { name: "explore", url: "/explore" },
    { name: "event-1", url: "/event/1" },
  ];

  for (const spec of PAGES) {
    test(`${spec.name} (${spec.url}) で critical/serious=0`, async ({
      page,
      context,
    }) => {
      await context.clearCookies();

      // 事前に localStorage に "more" を入れてから navigation することで
      // 初回 paint から high-contrast を適用させる。
      await page.addInitScript(
        ({ key }) => {
          try {
            window.localStorage.setItem(key, "more");
          } catch {
            /* ignore */
          }
        },
        { key: CONTRAST_STORAGE_KEY },
      );

      await page.goto(spec.url, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await expect(page.locator("html")).toHaveAttribute(
        "data-contrast",
        "more",
      );

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const blockers = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      );

      if (blockers.length > 0) {
        console.error(
          `[high-contrast:${spec.name}] blockers:\n` +
            blockers
              .map(
                (v) =>
                  `  - ${v.id} [${v.impact}] ${v.help}: ${v.nodes.length}件`,
              )
              .join("\n"),
        );
      }

      expect(
        blockers.map((v) => v.id),
        `${spec.name}: high-contrast 中の critical/serious 違反は 0 件であるべき`,
      ).toEqual([]);
    });
  }
});
