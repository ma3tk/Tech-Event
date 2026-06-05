/**
 * 料金プランページ E2E。
 *
 * - `/pricing` が 200 + 3 プランを表示
 * - 12 項目の機能比較表が表示される
 * - FAQ アコーディオンが折りたたみ可能
 */
import { test, expect } from "@playwright/test";

test.describe("/pricing ページ", () => {
  test("200 で 3 プラン (Free / Plus / Enterprise) が表示される", async ({
    page,
  }) => {
    const res = await page.goto("/pricing", {
      waitUntil: "domcontentloaded",
    });
    expect(res?.status()).toBeLessThan(400);

    await expect(page.getByTestId("pricing-page")).toBeVisible();
    await expect(page.getByTestId("plan-free")).toBeVisible();
    await expect(page.getByTestId("plan-plus")).toBeVisible();
    await expect(page.getByTestId("plan-enterprise")).toBeVisible();

    // 各プランの CTA リンク
    await expect(page.getByTestId("plan-cta-free")).toHaveAttribute(
      "href",
      "/signup",
    );
    await expect(page.getByTestId("plan-cta-plus")).toHaveAttribute(
      "href",
      /\/signup\?plan=plus/,
    );
    await expect(page.getByTestId("plan-cta-enterprise")).toHaveAttribute(
      "href",
      /\/contact/,
    );
  });

  test("12 項目の機能比較表が表示される", async ({ page }) => {
    await page.goto("/pricing", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("pricing-features")).toBeVisible();
    // 0..11 の 12 行
    for (let i = 0; i < 12; i++) {
      await expect(page.getByTestId(`pricing-feature-${i}`)).toBeVisible();
    }
  });

  test("FAQ が折りたたみ可能", async ({ page }) => {
    await page.goto("/pricing", { waitUntil: "domcontentloaded" });
    const item = page.getByTestId("pricing-faq-item-0");
    await expect(item).toBeVisible();

    // 初期は閉じている (open 属性なし)
    await expect(item).not.toHaveAttribute("open", /.+/);

    // summary をクリックして開く
    await item.locator("summary").click();
    await expect(item).toHaveAttribute("open", "");

    // もう一度クリックで閉じる
    await item.locator("summary").click();
    await expect(item).not.toHaveAttribute("open", /.+/);
  });

  test("Header / Footer に /pricing リンクが追加されている", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // Header: デスクトップナビの "料金プラン" リンク
    const headerLink = page.getByRole("link", { name: "料金プラン" }).first();
    await expect(headerLink).toBeVisible();
    await expect(headerLink).toHaveAttribute("href", "/pricing");
  });
});
