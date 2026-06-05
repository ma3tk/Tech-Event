/**
 * 埋め込みウィジェットの E2E。
 *
 * - /embed/event/[id] が 200 + 必要要素を含むこと
 * - /event/[id]/embed-code が text/plain で iframe スニペットを返すこと
 * - /embed/calendar/[subdomain] が 200 で描画されること
 */
import { test, expect } from "@playwright/test";

test.describe("イベント埋め込みウィジェット", () => {
  test("/embed/event/1 が 200 + 必要要素を描画", async ({ page }) => {
    const response = await page.goto("/embed/event/1");
    expect(response?.status()).toBe(200);

    // ミニマルレイアウト本体
    await expect(page.getByTestId("embed-root")).toBeVisible();
    await expect(page.getByTestId("embed-event-card")).toBeVisible();

    // タイトル
    await expect(page.getByTestId("embed-event-title")).toBeVisible();

    // CTA: 詳細リンクが target="_blank"
    const cta = page.getByTestId("embed-event-cta");
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("target", "_blank");
    await expect(cta).toHaveAttribute("href", "/event/1");

    // グローバルヘッダー/フッターは出ない (Header の banner role は無い)
    expect(await page.locator("[role=banner]").count()).toBe(0);
    expect(await page.locator("[role=contentinfo]").count()).toBe(0);
  });

  test("/event/1/embed-code が text/plain + iframe スニペットを返す", async ({
    request,
  }) => {
    const res = await request.get("/event/1/embed-code");
    expect(res.status()).toBe(200);
    const contentType = res.headers()["content-type"] ?? "";
    expect(contentType).toContain("text/plain");

    const body = await res.text();
    expect(body).toContain("<iframe");
    expect(body).toContain("/embed/event/1");
    expect(body).toContain("title=");
  });
});

test.describe("カレンダー埋め込みウィジェット", () => {
  test("/embed/calendar/findy が 200 で描画", async ({ page }) => {
    const response = await page.goto("/embed/calendar/findy");
    expect(response?.status()).toBe(200);
    await expect(page.getByTestId("embed-root")).toBeVisible();
    await expect(page.getByTestId("embed-calendar")).toBeVisible();
    await expect(page.getByTestId("embed-calendar-title")).toBeVisible();
  });

  test("存在しないグループは 404", async ({ page }) => {
    const response = await page.goto(
      "/embed/calendar/this-group-does-not-exist",
    );
    // loading.tsx (App Router) の Suspense fallback で streaming される関係で
    // HTTP ステータスは 200 + クライアントフォールバックで not-found 表示に
    // なる場合がある。どちらでも受け入れる。
    const status = response?.status() ?? 0;
    if (status === 404) {
      expect(status).toBe(404);
    } else {
      await page.waitForLoadState("domcontentloaded");
      const html = await page.content();
      // next-error="not-found" メタ or NEXT_HTTP_ERROR_FALLBACK;404 マーカ
      expect(html).toMatch(/next-error.*not-found|NEXT_HTTP_ERROR_FALLBACK;404/);
    }
  });
});
