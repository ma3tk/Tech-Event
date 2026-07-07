/**
 * Insights ファネル + 流入経路/UTM E2E。
 *
 * - イベント詳細ページを開くと `/api/track/view` beacon が記録される
 * - 主催者の Insights にファネル (Page views → RSVP → Check-in) が表示され、
 *   閲覧数が 1 以上になる
 * - UTM 付きで閲覧すると utm_source / utm_medium / utm_campaign が
 *   流入経路セクションに集計表示される
 * - 認可: 主催者でもグループ管理者でもない test_user では insights は 404
 *
 * EventView 書き込みを伴う (DB 状態依存) ため serial mode で実行する。
 */
import { test, expect, type Page } from "@playwright/test";
import { devLoginLegacy as devLogin, loginByCookie } from "./_helpers/auth";

// event 1 の主催者 (seed: fast_moon_169 = users[0])
const OWNER_USER = "fast_moon_169";
// E2E 用固定ユーザー (event 1 の主催者/グループ管理者ではない)
const NON_OWNER_USER = "test_user";
const EVENT_ID = "1";

test.describe.configure({ mode: "serial" });

/** イベント詳細ページを開き、閲覧 beacon の完了 (2xx) まで待つ */
async function visitEventAndTrack(page: Page, path: string): Promise<void> {
  const trackResponse = page.waitForResponse(
    (res) =>
      res.url().includes("/api/track/view") &&
      res.request().method() === "POST" &&
      res.status() >= 200 &&
      res.status() < 300,
  );
  await page.goto(path);
  await expect(page.getByTestId("event-detail-root")).toBeVisible();
  await trackResponse;
}

test.describe("Insights ファネル + 流入経路", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("イベント閲覧が記録され、Insights にファネル数値が表示される", async ({
    page,
  }) => {
    // 1) 匿名でイベント詳細を閲覧 → beacon が記録される
    await visitEventAndTrack(page, `/event/${EVENT_ID}`);

    // 2) 主催者で Insights を開く
    await devLogin(page, OWNER_USER, `/event/${EVENT_ID}/admin/insights`);
    await expect(page.getByTestId("admin-panel-insights")).toBeVisible();

    // 3) ファネルセクション: views / rsvp / checkin の 3 段 + 転換率
    const funnel = page.getByTestId("admin-insights-funnel");
    await expect(funnel).toBeVisible();

    const viewsText = await page
      .getByTestId("insights-funnel-views")
      .innerText();
    const views = Number(viewsText.trim());
    expect(Number.isFinite(views)).toBeTruthy();
    expect(views).toBeGreaterThanOrEqual(1);

    await expect(page.getByTestId("insights-funnel-rsvp")).toBeVisible();
    await expect(page.getByTestId("insights-funnel-checkin")).toBeVisible();
    await expect(
      page.getByTestId("insights-funnel-overall-rate"),
    ).toContainText("%");

    // 既存セクションが壊れていないこと (削減禁止の regression ガード)
    await expect(page.getByTestId("admin-insights-timing")).toBeVisible();
    await expect(page.getByTestId("admin-insights-peers")).toBeVisible();
  });

  test("UTM 付き閲覧が流入経路 (utm_source/medium/campaign) に集計される", async ({
    page,
  }) => {
    const source = "e2e_twitter";
    const medium = "e2e_social";
    const campaign = "e2e_launch";

    // 1) UTM パラメータ付きでイベント詳細を閲覧
    await visitEventAndTrack(
      page,
      `/event/${EVENT_ID}?utm_source=${source}&utm_medium=${medium}&utm_campaign=${campaign}`,
    );

    // 2) 主催者で Insights を開く
    await devLogin(page, OWNER_USER, `/event/${EVENT_ID}/admin/insights`);
    await expect(page.getByTestId("admin-panel-insights")).toBeVisible();

    // 3) 流入経路セクションに UTM 値が表示される
    const sources = page.getByTestId("admin-insights-sources");
    await expect(sources).toBeVisible();
    await expect(
      page.getByTestId("insights-sources-utm-source"),
    ).toContainText(source);
    await expect(
      page.getByTestId("insights-sources-utm-medium"),
    ).toContainText(medium);
    await expect(
      page.getByTestId("insights-sources-utm-campaign"),
    ).toContainText(campaign);

    // referrer リスト (直接アクセス含む) も描画されていること
    await expect(page.getByTestId("insights-sources-referrers")).toBeVisible();
  });

  test("認可: 主催者でない test_user は insights を見られない (404)", async ({
    page,
    context,
  }) => {
    await loginByCookie(context, NON_OWNER_USER);
    await page.goto(`/event/${EVENT_ID}/admin/insights`);

    // notFound() は streaming 後に throw されると HTTP status が 200 のまま
    // not-found UI を描画するため、repo 既存パターン (discover-lp.spec.ts) に
    // 倣い not-found マーカーで判定する。
    await expect(
      page
        .locator(
          'meta[name="next-error"][content="not-found"], [data-testid="not-found"]',
        )
        .first(),
    ).toBeAttached();
    await expect(page.getByTestId("admin-panel-insights")).toHaveCount(0);
  });

  test("beacon API: 実在しない eventId は 404、閲覧記録はされない", async ({
    request,
  }) => {
    const res = await request.post("/api/track/view", {
      data: { eventId: "999999999" },
    });
    expect(res.status()).toBe(404);

    const bad = await request.post("/api/track/view", {
      data: { eventId: "not-a-number" },
    });
    expect(bad.status()).toBe(400);
  });
});
