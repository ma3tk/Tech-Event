/**
 * /discover (Luma 風) ページの E2E テスト。
 *
 * 検証観点:
 *  1. /discover が 200 で開き、主要セクション (カテゴリ / 都市 / カレンダー / トレンド) が見える
 *  2. カテゴリカードのクリックで `/explore?tag=...` へ遷移する
 *  3. 都市カードのクリックで `/explore?prefecture=...` または `/explore?online=1` へ遷移する
 *  4. ビュータブ (Popular / New / Trending) で URL の `?view=` が切り替わる
 *  5. 既存 `/explore` の動作は壊れていない (簡易リグレッション)
 *  6. `/discover` のフルページスクショを `screenshots/clone/discover.png` に保存
 */

import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const SCREENSHOT_DIR = path.join(process.cwd(), "screenshots", "clone");

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

test.describe("Discover ページ", () => {
  test("ページが 200 で開き主要セクションが見える", async ({ page }) => {
    const response = await page.goto("/discover", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status(), "/discover should return 2xx/3xx").toBeLessThan(
      400,
    );

    // ヘッダーとフッターが共通描画されていること
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();

    // Hero 見出し
    await expect(
      page.getByRole("heading", {
        name: "興味のあるテックイベントを発見しよう",
      }),
    ).toBeVisible();

    // 各セクション (testid ベース)
    await expect(page.getByTestId("discover-page")).toBeVisible();
    await expect(page.getByTestId("discover-view-tabs")).toBeVisible();
    await expect(page.getByTestId("discover-categories")).toBeVisible();
    await expect(page.getByTestId("discover-cities")).toBeVisible();
    await expect(page.getByTestId("discover-calendars")).toBeVisible();
    await expect(page.getByTestId("discover-trending")).toBeVisible();

    // 6 カテゴリのカードが全て描画される
    for (const slug of ["ai", "web", "mobile", "security", "devops", "data"]) {
      await expect(page.getByTestId(`discover-category-${slug}`)).toBeVisible();
    }

    // 4 都市のカードが全て描画される
    for (const slug of ["tokyo", "osaka", "fukuoka", "online"]) {
      await expect(page.getByTestId(`discover-city-${slug}`)).toBeVisible();
    }
  });

  test("カテゴリカードのクリックで /explore?tag=... に遷移する", async ({
    page,
  }) => {
    await page.goto("/discover", { waitUntil: "domcontentloaded" });
    const aiCard = page.getByTestId("discover-category-ai");
    await expect(aiCard).toBeVisible();
    await aiCard.click();
    await page.waitForURL(/\/explore\?tag=/);
    expect(page.url()).toContain("/explore");
    expect(page.url()).toMatch(/tag=/);
    // 遷移先 (Explore) でも H1 / Breadcrumb が出ること
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("都市カードのクリックで /explore?prefecture=... に遷移する", async ({
    page,
  }) => {
    await page.goto("/discover", { waitUntil: "domcontentloaded" });
    const tokyoCard = page.getByTestId("discover-city-tokyo");
    await expect(tokyoCard).toBeVisible();
    await tokyoCard.click();
    await page.waitForURL(/\/explore\?prefecture=tokyo/);
    expect(page.url()).toContain("/explore?prefecture=tokyo");
  });

  test("オンラインカードのクリックで /explore?online=1 に遷移する", async ({
    page,
  }) => {
    await page.goto("/discover", { waitUntil: "domcontentloaded" });
    const onlineCard = page.getByTestId("discover-city-online");
    await expect(onlineCard).toBeVisible();
    await onlineCard.click();
    await page.waitForURL(/\/explore\?online=1/);
    expect(page.url()).toContain("/explore?online=1");
  });

  test("Popular/New/Trending タブ切替で URL の view が変わる", async ({
    page,
  }) => {
    await page.goto("/discover", { waitUntil: "domcontentloaded" });

    // 初期は popular (デフォルト)
    const popularTab = page.getByTestId("discover-view-tab-popular");
    await expect(popularTab).toHaveAttribute("aria-selected", "true");

    // New に切替
    await page.getByTestId("discover-view-tab-new").click();
    await page.waitForURL(/\/discover\?view=new/);
    await expect(
      page.getByTestId("discover-view-tab-new"),
    ).toHaveAttribute("aria-selected", "true");

    // Trending に切替
    await page.getByTestId("discover-view-tab-trending").click();
    await page.waitForURL(/\/discover\?view=trending/);
    await expect(
      page.getByTestId("discover-view-tab-trending"),
    ).toHaveAttribute("aria-selected", "true");
  });

  test("Header に Discover リンクが追加され、既存 イベントを探す も残っている", async ({
    page,
  }, testInfo) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    if (testInfo.project.name === "chromium-mobile") {
      // モバイルではハンバーガーを開いて確認
      await page.getByRole("button", { name: /メニューを開く/ }).click();
      const menu = page.getByTestId("header-mobile-menu");
      await expect(menu.getByRole("link", { name: "Discover" })).toBeVisible();
      await expect(
        menu.getByRole("link", { name: "イベントを探す" }),
      ).toBeVisible();
    } else {
      const header = page.getByRole("banner");
      await expect(
        header.getByRole("link", { name: "Discover" }).first(),
      ).toBeVisible();
      await expect(
        header.getByRole("link", { name: "イベントを探す" }).first(),
      ).toBeVisible();
    }
  });

  test("トップページに Discover CTA バナーがあり /discover に遷移する", async ({
    page,
  }) => {
    // CI dev サーバの turbopack 初回コンパイルで `/discover` の navigation が
    // 60s を超えることがあるため timeout を 180s に伸ばす。
    test.setTimeout(180_000);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const cta = page.getByTestId("home-discover-cta");
    await expect(cta).toBeVisible();
    await cta.click();
    await page.waitForURL(/\/discover/, { timeout: 120_000 });
    expect(page.url()).toContain("/discover");
  });

  test("既存 /explore は引き続き 200 で開く (リグレッション)", async ({
    page,
  }) => {
    const res = await page.goto("/explore", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("/discover のフルページスクショを保存", async ({ page }) => {
    await page.goto("/discover", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.fonts.ready);
    const file = path.join(SCREENSHOT_DIR, "discover.png");
    await page.screenshot({ path: file, fullPage: true });
    expect(fs.existsSync(file)).toBe(true);
  });
});
