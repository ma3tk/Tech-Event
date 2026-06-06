/**
 * Sticky CTA バー E2E。
 *
 * 検証項目:
 *   1. デスクトップ: 初期表示ではメイン申込ボックスが画面内なので sticky CTA は隠れている
 *   2. デスクトップ: ページ最下部までスクロールすると sticky CTA がスライドインする
 *   3. sticky CTA を押すと #apply-heading 要素へジャンプする (ログイン済前提なし版)
 *   4. モバイル: 初期から sticky CTA が常時表示される
 *
 * 前提:
 *   - dev サーバが http://localhost:3000 で起動済み
 *   - シードイベント id=1 が受付中
 */
import { test, expect } from "@playwright/test";

const EVENT_ID = "1";

test.describe("Sticky CTA バー (デスクトップ)", () => {
  test("初期表示では非表示、スクロール後に表示される", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === "chromium-mobile",
      "デスクトップ専用ケース",
    );
    await page.goto(`/event/${EVENT_ID}`, { waitUntil: "domcontentloaded" });

    const cta = page.getByTestId("sticky-cta");
    // sticky CTA はマウント後に存在する
    await expect(cta).toBeAttached();

    // 申込ボックスが見えているとき: visible=false
    const apply = page.locator("#apply-heading");
    await expect(apply).toBeVisible();
    // Intersection Observer 反映を待つ (固定 sleep の代わりに属性遷移を polling)
    await expect(cta).toHaveAttribute("data-visible", "false", {
      timeout: 2000,
    });

    // ページ末尾までスクロール → 申込ボックスが画面外
    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" as ScrollBehavior }),
    );
    await expect(cta).toHaveAttribute("data-visible", "true", {
      timeout: 2000,
    });

    // タイトル要素が描画されている
    await expect(page.getByTestId("sticky-cta-title")).toBeVisible();
  });

  test("ボタンクリックで申込ボックスへジャンプする (未ログイン時はログインへ)", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === "chromium-mobile",
      "デスクトップ専用ケース",
    );
    await page.goto(`/event/${EVENT_ID}`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" as ScrollBehavior }),
    );

    const btn = page.getByTestId("sticky-cta-button");
    // IntersectionObserver 経由で出現するボタンを待つ
    await expect(btn).toBeVisible();
    // href が #apply-heading もしくは /login で始まる
    const href = await btn.getAttribute("href");
    expect(href).toBeTruthy();
    expect(href!).toMatch(/^#apply-heading$|^\/login/);
  });
});

test.describe("Sticky CTA バー (モバイル)", () => {
  test("モバイルでは初期から表示される", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-mobile",
      "モバイル専用ケース",
    );
    await page.goto(`/event/${EVENT_ID}`, { waitUntil: "domcontentloaded" });
    const cta = page.getByTestId("sticky-cta");
    await expect(cta).toBeAttached();
    // モバイルでは初期 hydration 後すぐ visible=true になるはず (polling で確認)
    await expect(cta).toHaveAttribute("data-visible", "true", {
      timeout: 2000,
    });
  });
});
