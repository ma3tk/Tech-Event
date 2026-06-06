/**
 * イベントテーマカスタマイズの E2E。
 *
 * シナリオ:
 *   1. DB に直接 themeTintColor を書き込み、テスト対象イベントを準備
 *   2. /event/[id] を開いて CSS 変数 `--event-tint` が注入されていることを
 *      `getComputedStyle` 相当の `window.getComputedStyle` で確認
 *   3. 後始末で tint を null に戻す
 *
 * 既存テストで使われている event id=1 を対象にする (smoke.spec.ts 参照)。
 */
import path from "node:path";
import Database from "better-sqlite3";
import { test, expect } from "@playwright/test";

// Nx 化で e2e は apps/web-e2e/ に切り出されたが、dev.db は apps/web/ にある。
// __dirname (apps/web-e2e/src) を基準に絶対パスで解決することで、Playwright を
// どこから起動しても同じ DB を参照する。
const DB_PATH = path.resolve(__dirname, "../../web/dev.db");
// 他テスト (comment-bookmark, participate, lottery 等) と衝突しないよう
// 専用の event id を使う (event 8 はどのテストにも未使用)
const TARGET_EVENT_ID = 8;
const TINT_COLOR = "#5b21b6";

function setTheme(
  id: number,
  tint: string | null,
  bg: string | null,
  font: string | null,
): void {
  const db = new Database(DB_PATH);
  try {
    db.prepare(
      `UPDATE events
       SET "themeTintColor" = ?, "themeBackgroundStyle" = ?, "themeFontStyle" = ?
       WHERE id = ?`,
    ).run(tint, bg, font, id);
  } finally {
    db.close();
  }
}

test.describe.configure({ mode: "serial" });

test.describe("イベントテーマカスタマイズ", () => {
  test.afterAll(() => {
    // 後始末: 元の状態 (null) に戻す
    setTheme(TARGET_EVENT_ID, null, null, null);
  });

  test("themeTintColor が CSS 変数 --event-tint として注入される", async ({
    page,
  }) => {
    // テスト直前に DB に tint を書き込み (worker 間隔離のため beforeAll ではなく
    // 各テスト内で設定する)
    setTheme(TARGET_EVENT_ID, TINT_COLOR, "solid", "default");

    const res = await page.goto(`/event/${TARGET_EVENT_ID}`);
    expect(res?.status()).toBe(200);

    const root = page.getByTestId("event-detail-root");
    await expect(root).toBeVisible();

    // data-event-themed が true
    await expect(root).toHaveAttribute("data-event-themed", "true");

    // getComputedStyle で --event-tint が tint 色になっていること
    const tint = await root.evaluate(
      (el) => getComputedStyle(el).getPropertyValue("--event-tint").trim(),
    );
    expect(tint.toLowerCase()).toBe(TINT_COLOR.toLowerCase());

    // HERO 帯にも tint が反映 (背景色が #1f3c66 ではなくなっている)
    const heroBg = await page
      .getByTestId("event-hero")
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    // rgb(91, 33, 182) が #5b21b6 に対応
    expect(heroBg.replace(/\s/g, "")).toContain("rgb(91,33,182)");
  });

  test("themeTintColor 未設定 (null) なら従来テーマ", async ({ page }) => {
    setTheme(TARGET_EVENT_ID, null, null, null);
    const res = await page.goto(`/event/${TARGET_EVENT_ID}`);
    expect(res?.status()).toBe(200);
    const root = page.getByTestId("event-detail-root");
    await expect(root).toHaveAttribute("data-event-themed", "false");
    const tint = await root.evaluate(
      (el) => getComputedStyle(el).getPropertyValue("--event-tint").trim(),
    );
    expect(tint).toBe("");
  });
});
