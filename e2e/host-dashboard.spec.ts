/**
 * 主催者ダッシュボード (Luma 風 6 タブ) の E2E。
 *
 * シナリオ:
 *  1. dev-login (fast_moon_169 = users[0] = events[1] の主催者) で /event/1/admin に着地
 *  2. 6 タブ (Overview / Guests / Registration / Blasts / Insights / More) が見える
 *  3. 各タブをクリックして遷移確認 (data-testid="admin-panel-{key}" が表示)
 *  4. Guests: フィルタ・検索が動く / CSV エクスポート (200)
 *  5. Blasts: メッセージ送信 → 履歴に表示
 *
 * 主催者ロール:
 *   seed.ts で events[0] (id=1) は groups[0] に属し、その owner は users[0]
 *   = fast_moon_169。
 */
import { test, expect } from "@playwright/test";
import { devLoginLegacy as devLogin } from "./_helpers/auth";

const DEV_USER = "fast_moon_169";
const EVENT_ID = "1";

test.describe("主催者ダッシュボード (6 タブ)", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("6 タブが描画され、各タブに遷移できる", async ({ page }) => {
    await devLogin(page, DEV_USER, `/event/${EVENT_ID}/admin`);

    // タブが見える
    await expect(page.getByTestId("admin-tabs")).toBeVisible();
    for (const key of [
      "overview",
      "guests",
      "registration",
      "blasts",
      "insights",
      "more",
    ]) {
      await expect(page.getByTestId(`admin-tab-${key}`)).toBeVisible();
    }

    // Overview がデフォルト表示
    await expect(page.getByTestId("admin-panel-overview")).toBeVisible();
    await expect(page.getByTestId("admin-stats")).toBeVisible();
    await expect(page.getByTestId("admin-recent-signups")).toBeVisible();
    await expect(page.getByTestId("admin-quick-actions")).toBeVisible();

    // Guests へ
    await page.getByTestId("admin-tab-guests").click();
    await page.waitForURL((url) =>
      url.pathname.endsWith(`/event/${EVENT_ID}/admin/guests`),
    );
    await expect(page.getByTestId("admin-panel-guests")).toBeVisible();

    // Registration へ
    await page.getByTestId("admin-tab-registration").click();
    await page.waitForURL((url) =>
      url.pathname.endsWith(`/event/${EVENT_ID}/admin/registration`),
    );
    await expect(page.getByTestId("admin-panel-registration")).toBeVisible();

    // Blasts へ
    await page.getByTestId("admin-tab-blasts").click();
    await page.waitForURL((url) =>
      url.pathname.endsWith(`/event/${EVENT_ID}/admin/blasts`),
    );
    await expect(page.getByTestId("admin-panel-blasts")).toBeVisible();

    // Insights へ
    await page.getByTestId("admin-tab-insights").click();
    await page.waitForURL((url) =>
      url.pathname.endsWith(`/event/${EVENT_ID}/admin/insights`),
    );
    await expect(page.getByTestId("admin-panel-insights")).toBeVisible();

    // More へ
    await page.getByTestId("admin-tab-more").click();
    await page.waitForURL((url) =>
      url.pathname.endsWith(`/event/${EVENT_ID}/admin/more`),
    );
    await expect(page.getByTestId("admin-panel-more")).toBeVisible();
    // 出席管理リンクが残っていること
    await expect(page.getByTestId("admin-more-checkin-link")).toBeVisible();
  });

  test("Guests でフィルタ・検索・CSV エクスポートが動く", async ({ page }) => {
    await devLogin(page, DEV_USER, `/event/${EVENT_ID}/admin/guests`);

    await expect(page.getByTestId("admin-panel-guests")).toBeVisible();
    await expect(page.getByTestId("admin-guests-table")).toBeVisible();

    // フィルタ: 参加確定
    await page.getByTestId("admin-guests-filter-accepted").click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/status=accepted/);

    // 検索ボックスに何か入力 (該当なしでも 200 で表示されることを確認)
    await page
      .getByTestId("admin-guests-search-input")
      .fill("__unlikely_query__");
    await page
      .getByTestId("admin-guests-search-form")
      .locator("button[type=submit]")
      .click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("admin-panel-guests")).toBeVisible();

    // CSV エクスポート (ルートが 200 で text/csv を返すこと)
    // page.context().request を使うことでブラウザの cookie が引き継がれる
    const res = await page
      .context()
      .request.get(`/event/${EVENT_ID}/admin/guests/export.csv`);
    expect(res.status()).toBe(200);
    const ct = res.headers()["content-type"] ?? "";
    expect(ct).toContain("text/csv");
    const body = await res.text();
    // ヘッダ行
    expect(body).toContain("participant_id,user_id,nickname");
  });

  test("Blasts でメッセージ送信 → 履歴に表示される", async ({ page }) => {
    await devLogin(page, DEV_USER, `/event/${EVENT_ID}/admin/blasts`);
    await expect(page.getByTestId("admin-panel-blasts")).toBeVisible();

    const subject = `E2E テスト件名 ${Date.now()}`;
    const body = "これは E2E から送信された一斉メッセージです。";

    await page.getByTestId("admin-blasts-audience").selectOption("accepted");
    await page.getByTestId("admin-blasts-subject").fill(subject);
    await page.getByTestId("admin-blasts-body").fill(body);
    await page.getByTestId("admin-blasts-submit").click();

    // sendBlast 完了後は ?sent=1 にリダイレクトされる
    await page.waitForURL(/sent=1/);
    await expect(page.getByTestId("admin-blasts-sent-banner")).toBeVisible();
    await expect(page.getByTestId("admin-blasts-history")).toBeVisible();
    // 履歴に送信した subject が含まれる
    await expect(page.locator("text=" + subject).first()).toBeVisible();
  });

  test("未ログインで /event/1/admin にアクセスすると /login にリダイレクト", async ({
    page,
  }) => {
    await page.goto(`/event/${EVENT_ID}/admin`);
    await expect(page).toHaveURL(/\/login/);
  });
});
