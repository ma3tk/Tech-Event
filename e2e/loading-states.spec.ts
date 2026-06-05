/**
 * loading.tsx E2E
 *
 * 各主要ルートに `loading.tsx` (App Router convention) が設置されていることを
 * 確認する。Next.js 16 (React 19 useTransition ベース) のクライアントサイド遷移時は
 * 前ページを保持する挙動のため、loading.tsx skeleton は client navigation で
 * 必ずしも表示されない (UX 上の最適化)。
 *
 * 安定性のため、本テストは以下の二段構えで検証する:
 *   1. HTTP fetch (`page.request.get`) で SSR HTML に skeleton が含まれることを確認
 *      → streaming SSR の前段で flush される data-testid を直接検証
 *   2. レスポンスを遅延させた状態で page.goto し、skeleton or 本コンテンツの
 *      いずれかが表示される (= ページが反応している) ことを確認
 *
 * これにより RSC streaming のタイミング race を排除し、flake を 0 に近づける。
 */
import { test, expect } from "@playwright/test";
import { devLoginLegacy } from "./_helpers/auth";

const DEV_USER = "fast_moon_169";

async function devLogin(
  page: import("@playwright/test").Page,
  nickname: string,
  nextPath: string,
): Promise<void> {
  await devLoginLegacy(page, nickname, nextPath);
  // loading.tsx の skeleton 検証用に DOMContentLoaded まで待ってから帰す
  await page.waitForLoadState("domcontentloaded");
}

/**
 * 全てのリクエストを遅延させて、streaming SSR が loading.tsx skeleton を
 * 先に flush するだけの猶予を確保する。
 */
async function delayResponsesFor(
  page: import("@playwright/test").Page,
  pathPattern: RegExp,
  delayMs: number,
): Promise<void> {
  await page.route(pathPattern, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.continue();
  });
}

test.describe("loading.tsx スケルトン表示", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("/discover の loading.tsx skeleton が SSR で配信される", async ({
    page,
  }) => {
    const response = await page.request.get("/discover");
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html).toContain('data-testid="loading-discover"');

    // 遅延ロードで skeleton or 本コンテンツが見える猶予を作る
    await delayResponsesFor(page, /\/discover(\?.*)?$/, 800);
    await page.goto("/discover", { waitUntil: "commit" });
    await expect
      .poll(
        async () => {
          const skel = await page.getByTestId("loading-discover").count();
          const heading = await page.getByRole("heading").count();
          return skel + heading;
        },
        { timeout: 15_000 },
      )
      .toBeGreaterThan(0);
  });

  test("/explore の loading.tsx skeleton が SSR で配信される", async ({
    page,
  }) => {
    const response = await page.request.get("/explore");
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html).toContain('data-testid="loading-explore"');

    await delayResponsesFor(page, /\/explore(\?.*)?$/, 800);
    await page.goto("/explore", { waitUntil: "commit" });
    await expect
      .poll(
        async () => {
          const skel = await page.getByTestId("loading-explore").count();
          const heading = await page.getByRole("heading").count();
          return skel + heading;
        },
        { timeout: 15_000 },
      )
      .toBeGreaterThan(0);
  });

  test("/dashboard の loading.tsx skeleton が SSR で配信される", async ({
    page,
  }) => {
    await devLogin(page, DEV_USER, "/");
    await page.waitForLoadState("networkidle");

    const cookies = await page.context().cookies();
    const cookieHeader = cookies
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
    const response = await page.request.get("/dashboard", {
      headers: { cookie: cookieHeader },
    });
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html).toContain('data-testid="loading-dashboard"');

    await delayResponsesFor(page, /\/dashboard(\?.*)?$/, 800);
    await page.goto("/dashboard", { waitUntil: "commit" });
    await expect
      .poll(
        async () => {
          const skel = await page.getByTestId("loading-dashboard").count();
          const heading = await page.getByRole("heading").count();
          return skel + heading;
        },
        { timeout: 15_000 },
      )
      .toBeGreaterThan(0);
  });

  test("/event/[id] の loading.tsx が DOM に存在する (ResourceTiming で確認)", async ({
    page,
  }) => {
    // Next.js 16 の useTransition ベース router では、Link クリック時に
    // loading.tsx の skeleton を表示せずに前ページを保持することがある
    // (UX 上は望ましい)。そのため本テストでは loading.tsx の DOM 存在を
    // ResourceTiming + 静的 HTML レベルで検証する。
    //
    // /event/1 を fetch して HTML に skeleton 要素 (`loading-event-detail`)
    // が含まれていれば、loading.tsx が build & route に組み込まれていると
    // 判断する。
    const response = await page.request.get("/event/1");
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    // streaming SSR では loading.tsx の HTML が先に flush される
    expect(html).toContain('data-testid="loading-event-detail"');
  });
});
