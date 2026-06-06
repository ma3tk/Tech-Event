/**
 * マイページ (ダッシュボード) の E2E。
 *
 * シナリオ:
 *   dev-login → /dashboard → 各タブを開いて、参加予定 / 興味あり / 主催 /
 *   参加履歴 のいずれかの状態 (リスト or 空状態) が描画されることを確認する。
 *
 * 既存のシードデータでは fast_moon_169 (id=1) が多くのイベントの主催者・参加者
 * になっているため、空でない状態が見える前提でテストする。
 */
import { test, expect } from "@playwright/test";
import { devLoginLegacy as devLogin } from "./_helpers/auth";

const DEV_USER = "fast_moon_169";

test.describe("ダッシュボード", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("各タブを開いて主要セクションが見える", async ({ page }) => {
    await devLogin(page, DEV_USER, "/dashboard");

    // ようこそメッセージ
    await expect(page.locator("h1").first()).toBeVisible();

    // KPI サマリー
    await expect(page.getByTestId("dashboard-kpi")).toBeVisible();
    await expect(page.getByTestId("dashboard-kpi-参加予定")).toBeVisible();
    await expect(page.getByTestId("dashboard-kpi-ブックマーク")).toBeVisible();
    await expect(page.getByTestId("dashboard-kpi-主催")).toBeVisible();
    await expect(page.getByTestId("dashboard-kpi-累計参加")).toBeVisible();

    // タブ
    await expect(page.getByTestId("dashboard-tabs")).toBeVisible();

    // 右サイド: 未読通知 / おすすめ / アカウント
    await expect(page.getByTestId("dashboard-notifications")).toBeVisible();
    await expect(page.getByTestId("dashboard-recommended")).toBeVisible();
    await expect(page.getByTestId("dashboard-account")).toBeVisible();

    // upcoming タブ
    await page.getByTestId("dashboard-tab-upcoming").click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("dashboard-panel-upcoming")).toBeVisible();

    // bookmark タブ
    await page.getByTestId("dashboard-tab-bookmark").click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("dashboard-panel-bookmark")).toBeVisible();

    // managed タブ
    await page.getByTestId("dashboard-tab-managed").click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("dashboard-panel-managed")).toBeVisible();
    // 主催タブにはイベント作成 CTA がある
    await expect(page.getByTestId("dashboard-create-event")).toBeVisible();

    // history タブ
    await page.getByTestId("dashboard-tab-history").click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("dashboard-panel-history")).toBeVisible();
  });

  test("未ログインで /dashboard にアクセスすると /login にリダイレクト", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
