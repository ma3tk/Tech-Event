/**
 * Insights 高度化 E2E。
 *
 * - 主催者で /event/1/admin/insights に着地
 * - 新セクション (所属企業 Top10 / 時間帯ヒートマップ / 直前キャンセル率 /
 *   出席率 / リピーター率) が表示される
 * - JSON エクスポートリンクが押せ、200 + application/json で返る
 */
import { test, expect } from "@playwright/test";
import { devLoginLegacy as devLogin } from "./_helpers/auth";

const DEV_USER = "fast_moon_169";
const EVENT_ID = "1";

test.describe("Insights (高度化)", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("主催者で Insights タブの新セクションが見える", async ({ page }) => {
    await devLogin(page, DEV_USER, `/event/${EVENT_ID}/admin/insights`);

    await expect(page.getByTestId("admin-panel-insights")).toBeVisible();

    // 既存セクション (parity 確認)
    await expect(page.getByTestId("admin-insights-timing")).toBeVisible();
    await expect(page.getByTestId("admin-insights-cancel-rate")).toBeVisible();
    await expect(page.getByTestId("admin-insights-peers")).toBeVisible();

    // 新セクション
    await expect(
      page.getByTestId("admin-insights-affiliations"),
    ).toBeVisible();
    await expect(page.getByTestId("admin-insights-hourly")).toBeVisible();
    await expect(page.getByTestId("admin-insights-last-minute")).toBeVisible();
    await expect(page.getByTestId("admin-insights-attendance")).toBeVisible();
    await expect(page.getByTestId("admin-insights-repeater")).toBeVisible();

    // エクスポートリンク
    await expect(page.getByTestId("insights-export-link")).toBeVisible();
  });

  test("JSON ダウンロードが成功する", async ({ page, request }) => {
    await devLogin(page, DEV_USER, `/event/${EVENT_ID}/admin/insights`);

    // ログイン状態の cookie を引き継いでリクエスト
    const cookies = await page.context().cookies();
    const cookieHeader = cookies
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const res = await request.get(
      `/event/${EVENT_ID}/admin/insights/export.json`,
      { headers: { cookie: cookieHeader } },
    );
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/json");
    const json = await res.json();
    expect(json).toHaveProperty("eventId", EVENT_ID);
    expect(json).toHaveProperty("totalParticipants");
    expect(json).toHaveProperty("affiliationsTop");
    expect(json).toHaveProperty("applyHourly");
    expect(Array.isArray(json.applyHourly)).toBeTruthy();
    expect(json.applyHourly).toHaveLength(24);
    expect(json).toHaveProperty("repeaterRate");
    expect(json).toHaveProperty("attendanceRate");
    expect(json).toHaveProperty("lastMinuteCancelRate");
  });

  test("未ログインで export.json は 401", async ({ request }) => {
    const res = await request.get(
      `/event/${EVENT_ID}/admin/insights/export.json`,
    );
    expect([401, 403, 404]).toContain(res.status());
  });
});
