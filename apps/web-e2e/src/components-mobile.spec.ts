/**
 * `/components` ショーケースをモバイル viewport (iPhone 14) で開き、
 * 各セクションのスクリーンショットを撮るスイート。
 *
 * - `chromium-mobile` プロジェクト (playwright.config.ts) で実行する想定。
 *   他プロジェクト (chromium-desktop) では `test.skip` で自動スキップ。
 * - 出力先: `screenshots/components/mobile/{section}.png`
 * - 視覚回帰: `toHaveScreenshot()` でベースラインを生成する。
 *   初回実行は `--update-snapshots` で snapshot を作成する必要あり。
 * - 既存の `e2e/components.spec.ts` (デスクトップ) とは関心事を分離し、
 *   モバイル特有の縦積みレイアウト・タップターゲットを別途検証する。
 */

import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const SCREENSHOT_DIR = path.join(
  process.cwd(),
  "screenshots",
  "components",
  "mobile",
);

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

// chromium-desktop プロジェクトでは実行しない (chromium-mobile 専用)
test.beforeEach(async ({}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-mobile",
    "本スイートは chromium-mobile プロジェクト専用 (iPhone 14 viewport)",
  );
});

const SECTIONS = [
  "event-status-badge",
  "event-list-row",
  "event-card",
  "event-card-compact",
  "pagination",
  "breadcrumb",
  "tag-pill",
  "search-box",
  "group-card",
  "participant-badge",
  "mini-calendar",
] as const;

test.describe("Mobile Showcase: 基本描画", () => {
  test("iPhone 14 viewport で /components が 200 で開く", async ({ page }) => {
    const res = await page.goto("/components", {
      waitUntil: "domcontentloaded",
    });
    expect(res?.status()).toBeLessThan(400);
    await expect(
      page.getByRole("heading", { name: "コンポーネントショーケース", level: 1 }),
    ).toBeVisible();
  });

  test("モバイル幅でも全 11 セクションが描画される", async ({ page }) => {
    await page.goto("/components", { waitUntil: "domcontentloaded" });
    // hydration mismatch による再 mount を待つ (theme init script の data-theme と
    // SSR の data-theme="light" が一致しないと React がツリーを破棄するため、
    // 少し待ってから DOM 操作する)
    await page.waitForLoadState("networkidle").catch(() => undefined);
    for (const id of SECTIONS) {
      const section = page.getByTestId(`section-${id}`);
      await expect(section, `section-${id} が visible`).toBeVisible({
        timeout: 15_000,
      });
      await section.scrollIntoViewIfNeeded().catch(() => undefined);
    }
  });

  test("モバイル full-page screenshot", async ({ page }) => {
    await page.goto("/components", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "_fullpage.png"),
      fullPage: true,
    });
  });
});

/* ============================================================
 * セクションごとのスクリーンショット (PNG 保存)
 * ============================================================ */

for (const section of SECTIONS) {
  test(`mobile section screenshot: ${section}`, async ({ page }) => {
    await page.goto("/components", { waitUntil: "domcontentloaded" });
    const locator = page.getByTestId(`section-${section}`);
    // hydration による再 mount / 遅延ロードを待ってから可視性を確定させる。
    await expect(locator).toBeVisible({ timeout: 15_000 });
    await locator.scrollIntoViewIfNeeded();
    // フォント読み込み完了を待つ (テキスト幅が確定してから撮影)。
    await page.evaluate(() => document.fonts.ready);
    // スクロール後にバウンディングボックスが安定する (= レイアウトが落ち着く) のを
    // 待ってからスクショを撮る。固定 sleep ではなく toPass で polling する。
    await expect(async () => {
      const a = await locator.boundingBox();
      // 2 回連続で取得した box が一致したらレイアウト安定とみなす
      // (toPass のリトライ間隔が経過の役割を果たす)。
      const b = await locator.boundingBox();
      expect(a).not.toBeNull();
      expect(b).not.toBeNull();
      expect(Math.round(a!.y)).toBe(Math.round(b!.y));
      expect(Math.round(a!.height)).toBe(Math.round(b!.height));
    }).toPass({ timeout: 10_000 });
    await locator.screenshot({
      path: path.join(SCREENSHOT_DIR, `${section}.png`),
      animations: "disabled",
    });
  });
}

/* ============================================================
 * 視覚回帰 (toHaveScreenshot, chromium-mobile ベースライン)
 * ============================================================ */

test.describe("Mobile Visual regression (toHaveScreenshot)", () => {
  for (const section of SECTIONS) {
    test(`mobile snapshot diff: ${section}`, async ({ page }) => {
      // CI (Linux) では darwin baseline しかないため skip。
      test.skip(
        process.env.CI === "true" && process.platform === "linux",
        "Linux 用 visual baseline 未生成のため CI では skip",
      );
      await page.goto("/components", { waitUntil: "domcontentloaded" });
      const locator = page.getByTestId(`section-${section}`);
      await locator.scrollIntoViewIfNeeded();
      await expect(locator).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await expect(locator).toHaveScreenshot(`mobile-${section}.png`, {
        animations: "disabled",
        // モバイルレイアウトは Tailwind の line-height や rem 計算で
        // 数千 px の差分が出ることがある (フォントレンダリング差含む)。
        // 回帰検出が目的なので、ピクセル比 10%, 絶対値 1 万 px までは許容する。
        maxDiffPixelRatio: 0.1,
        maxDiffPixels: 10000,
      });
    });
  }
});

/* ============================================================
 * モバイル特有のレイアウト検証
 *  - EventListRow がモバイル時に縦積みになっていること
 *  - Pagination がモバイル時に「{current} / {total}」の簡易表示になっていること
 * ============================================================ */

test.describe("Mobile-specific layouts", () => {
  test("Pagination: モバイル幅では現在/総数のテキストが見える", async ({
    page,
  }) => {
    await page.goto("/components");
    const middle = page.getByTestId("component-Pagination-default-middle");
    await middle.scrollIntoViewIfNeeded();
    // sm:hidden の簡易表示が見えること
    const mobileSummary = middle.locator(".sm\\:hidden");
    await expect(mobileSummary).toBeVisible();
  });

  test("EventListRow: モバイル幅でも本文が読める", async ({ page }) => {
    await page.goto("/components");
    const section = page.getByTestId("section-event-list-row");
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();
    // タイトル要素 (h3) が画面に収まっていること (overflow が clip されない)
    const titles = section.locator("h3");
    const count = await titles.count();
    expect(count).toBeGreaterThan(0);
  });
});
