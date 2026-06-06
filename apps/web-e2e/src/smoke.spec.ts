import { test, expect } from "@playwright/test";

// 公開ページが全て2xx/3xxで表示されることを確認する基本スモークテスト
const PUBLIC_ROUTES: { path: string; expectText?: string }[] = [
  { path: "/", expectText: "tech-event" },
  { path: "/explore", expectText: "イベント" },
  { path: "/explore/groups", expectText: "グループ" },
  { path: "/series", expectText: "グループ" },
  { path: "/event/1" },
  { path: "/event/2" },
  { path: "/group/findy" },
  { path: "/group/layerx" },
  { path: "/ranking", expectText: "ランキング" },
  { path: "/login", expectText: "ログイン" },
  { path: "/signup", expectText: "登録" },
  { path: "/about" },
  { path: "/terms" },
  { path: "/privacy" },
];

for (const route of PUBLIC_ROUTES) {
  test(`公開ページ表示: ${route.path}`, async ({ page }) => {
    const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
    expect(response?.status(), `${route.path} returned non-OK`).toBeLessThan(400);
    if (route.expectText) {
      await expect(page.locator("body")).toContainText(route.expectText);
    }
    // ヘッダーとフッターが共通描画されていること
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });
}

test("検索ボックスで /explore へリダイレクト", async ({ page }) => {
  await page.goto("/");
  const searchInput = page.getByRole("searchbox").first();
  await searchInput.fill("AI");
  await searchInput.press("Enter");
  await page.waitForURL(/\/(explore|search)\?.*q=AI/);
});

test("/dashboard は未ログイン時に /login へリダイレクト", async ({ page, context }) => {
  await context.clearCookies();
  const response = await page.goto("/dashboard");
  // Server Component が redirect()。loading.tsx が間に挟まる場合は
  // クライアント側リダイレクトが完了するのを待つ。
  await page.waitForURL(/\/login(\?|$)/, { timeout: 10_000 });
  expect(page.url()).toContain("/login");
  expect(response?.status()).toBeLessThan(400);
});
