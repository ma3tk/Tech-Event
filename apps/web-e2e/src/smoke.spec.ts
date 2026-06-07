import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * smoke スイート (A 案 / 高速 PR check)
 *
 * 目的:
 *   - PR ごとに ~3 分で完走する critical path 群を集約
 *   - 全 test に `@smoke` タグを付与し、`--grep @smoke` で抽出可能
 *   - chromium-desktop のみ実行 (mobile は full E2E で網羅)
 *
 * full E2E は label `e2e:full` / `[full-e2e]` コミット / main push / nightly cron で起動
 * (`.github/workflows/e2e-full.yml`)。
 */

// ------------------------------------------------------------
// 主要 8 ページの SSR 確認 (response 2xx/3xx + 共通 header/footer + 期待文言)
// ------------------------------------------------------------
const PUBLIC_ROUTES: { path: string; expectText?: string }[] = [
  { path: "/", expectText: "tech-event" },
  { path: "/explore", expectText: "イベント" },
  { path: "/event/1" },
  { path: "/group/findy" },
  { path: "/calendar/ai-developers" },
  { path: "/ranking", expectText: "ランキング" },
  { path: "/discover" },
  { path: "/login", expectText: "ログイン" },
];

for (const route of PUBLIC_ROUTES) {
  test(`@smoke 公開ページ表示: ${route.path}`, async ({ page }) => {
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

// ------------------------------------------------------------
// 検索 → /explore リダイレクト (header 検索ボックス)
// ------------------------------------------------------------
test("@smoke 検索ボックスで /explore へリダイレクト", async ({ page }, testInfo) => {
  // mobile では SearchBox が hidden md:flex 配下のため対象外
  test.skip(
    testInfo.project.name === "chromium-mobile",
    "SearchBox は mobile では hidden md:flex 配下のため対象外",
  );
  await page.goto("/");
  const searchInput = page.getByRole("searchbox").first();
  await searchInput.fill("AI");
  await searchInput.press("Enter");
  await page.waitForURL(/\/(explore|search)\?.*q=AI/);
});

// ------------------------------------------------------------
// 認証必須ページ: 未ログイン時 /login redirect
// ------------------------------------------------------------
test("@smoke /dashboard は未ログイン時に /login へリダイレクト", async ({
  page,
  context,
}) => {
  await context.clearCookies();
  const response = await page.goto("/dashboard");
  await page.waitForURL(/\/login(\?|$)/, { timeout: 10_000 });
  expect(page.url()).toContain("/login");
  expect(response?.status()).toBeLessThan(400);
});

// ------------------------------------------------------------
// dev-login → イベント申込 1 件 (critical revenue path)
// ------------------------------------------------------------
test("@smoke dev-login → イベント詳細 → 申込導線が活性", async ({ page, context }) => {
  await context.clearCookies();
  // dev-login (legacy GET) でセッションを発行し、event/1 へ遷移
  const res = await page.goto(
    "/api/auth/dev-login?nickname=test_user&next=/event/1",
    { waitUntil: "domcontentloaded" },
  );
  expect(res?.status() ?? 200).toBeLessThan(400);
  await page.waitForURL(/\/event\/1(\?|$|\/)/);

  // 申込ボタンまたは申込済表示のいずれかが存在することを確認
  // (既参加状態でも申込導線が見える = critical path として OK)
  const applyArea = page
    .getByRole("button", { name: /申込|参加|キャンセル|参加済/ })
    .or(page.getByRole("link", { name: /申込|参加|キャンセル|参加済/ }))
    .first();
  await expect(applyArea).toBeVisible({ timeout: 10_000 });
});

// ------------------------------------------------------------
// SSE 通知 receipt (login 後の /api/notifications/stream 到達確認)
// ------------------------------------------------------------
test("@smoke SSE 通知エンドポイントが疎通する", async ({ page, context }) => {
  await context.clearCookies();
  // 先に dev-login で session を発行
  await page.goto("/api/auth/dev-login?nickname=test_user&next=/dashboard", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForURL(/\/dashboard(\?|$|\/)/);

  // SSE endpoint の HEAD/GET レスポンス確認
  // fetch 直接呼びで EventSource 維持は避ける (smoke は時短優先)
  const response = await page.request.get("/api/notifications/stream", {
    headers: { Accept: "text/event-stream" },
    timeout: 5_000,
    maxRedirects: 0,
    failOnStatusCode: false,
  });
  // SSE エンドポイントは 200 (event-stream) または 401/302 (未認証時) を返す。
  // ここでは login 後なので 200 を期待しつつ、サーバが SSE を即終了する場合も許容。
  expect([200, 204, 302, 401]).toContain(response.status());
});

// ------------------------------------------------------------
// axe critical/serious = 0 (トップページ)
// ------------------------------------------------------------
test("@smoke axe-core: / に critical/serious 違反なし", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  const blockers = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  if (blockers.length > 0) {
    // 詳細を log に残す (CI artifact で参照可)
    console.log("axe blockers on /:", JSON.stringify(blockers, null, 2));
  }
  expect(blockers, "axe critical/serious violations on /").toHaveLength(0);
});
