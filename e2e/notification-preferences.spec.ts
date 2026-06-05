/**
 * 通知設定 UI (`/settings/notifications`) の E2E。
 *
 * - dev-login → /settings/notifications に遷移
 * - スイッチを操作 (1 つ OFF) して保存 → リダイレクト後に「設定を保存しました」
 *   バナーが表示される
 * - 再描画後、操作したスイッチが OFF のままになっている (永続化確認)
 */
import { test, expect } from "@playwright/test";
import { devLoginLegacy as devLogin } from "./_helpers/auth";

const DEV_USER = "fast_moon_169";

test.describe("/settings/notifications", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("未ログインなら /login コンテンツへ遷移", async ({ page }) => {
    // Next.js の Server Component redirect は streaming で /login の HTML を返す。
    // URL 自体は /settings/notifications のままになるケースがあるため、
    // ページに「ログイン」見出しが出るかどうかで判定する。
    await page.goto("/settings/notifications");
    await expect(
      page.getByRole("heading", { name: /ログイン/ }).first(),
    ).toBeVisible();
  });

  test("dev-login → スイッチ操作 → 永続化", async ({ page }) => {
    await devLogin(page, DEV_USER, "/settings/notifications");

    // フォームと表示
    await expect(
      page.getByTestId("notification-preferences-form"),
    ).toBeVisible();

    // event_published × email スイッチの状態を確認 (既定 ON だが
    // 前テスト残骸で OFF になっている可能性があるため両ケースを扱う)
    const toggle = page.getByTestId(
      "notification-pref-switch-event_published-email",
    );
    await expect(toggle).toBeVisible();
    const wasChecked = await toggle.isChecked();

    // 1 度反転して保存
    if (wasChecked) {
      await toggle.uncheck();
    } else {
      await toggle.check();
    }
    await page.getByTestId("notification-preferences-save").click();
    await page.waitForLoadState("networkidle");

    // 保存後バナーが表示される
    await expect(page.getByTestId("notification-settings-saved")).toBeVisible();

    // 永続化確認: スイッチが反転した状態を保っている
    const toggleAfter = page.getByTestId(
      "notification-pref-switch-event_published-email",
    );
    if (wasChecked) {
      await expect(toggleAfter).not.toBeChecked();
    } else {
      await expect(toggleAfter).toBeChecked();
    }

    // 元に戻す (他テストへの影響を最小化)
    if (wasChecked) {
      await toggleAfter.check();
    } else {
      await toggleAfter.uncheck();
    }
    await page.getByTestId("notification-preferences-save").click();
    await page.waitForLoadState("networkidle");
  });
});
