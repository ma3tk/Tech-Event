/**
 * Register Button 7 状態の網羅 E2E。
 *
 * Luma 参考の state machine 強化により、追加された 3 状態 (pre-acceptance / ended /
 * cancelled) を含む全 7 状態を data-testid="register-state-{state}" で確認する。
 *
 * 検証する 7 状態:
 *   1. register-state-pre-acceptance      受付開始前 (acceptsFrom > now)
 *   2. register-state-ended               イベント終了後
 *   3. register-state-cancelled           Event.status = cancelled
 *   4. register-state-not-logged-in       未ログイン (= ログインしての参加申込)
 *   5. register-state-open                ログイン済 + 受付中 + 未参加 (参加申込)
 *   6. register-state-cancel-accepted     ログイン済 + 既に参加確定 (参加をキャンセル)
 *   7. register-state-lottery             ログイン済 + 抽選方式の枠 (抽選に申し込む)
 *
 * シード前提:
 *   - event id 1, 5: pre-acceptance (acceptsFrom 未来)
 *   - event id 12 (accepting カテゴリ): not-logged-in / open
 *     (event id 11 は他の参加申込 E2E と衝突を避けるため使わない)
 *   - event id 36-38: closed (ended)
 *   - event id 39-40: cancelled
 *   - event id 41: lottery
 *
 * dev-login が必要な 3 ケース (open / cancel-accepted / lottery) は
 * テスト間でステートを残しがちなので、各テストの冒頭でリセット処理を入れる。
 */
import { test, expect } from "@playwright/test";
import { devLoginLegacy as devLogin } from "./_helpers/auth";

// 内部で event 41 (lottery) の状態を弄るため、lottery.spec と並走しないように
// このスペック内は serial 実行に固定する。
test.describe.configure({ mode: "serial" });

const DEV_USER = "fast_moon_169";
const OPEN_EVENT_ID = "12";


test.describe("Register button: 全 7 状態の網羅", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("1. pre-acceptance: acceptsFrom が未来の受付前", async ({ page }) => {
    // event 1 は acceptsFrom が未来なので pre-acceptance
    await page.goto("/event/1");
    const btn = page.getByTestId("register-state-pre-acceptance");
    await expect(btn.first()).toBeVisible();
    await expect(btn.first()).toContainText(/受付開始/);
    await expect(btn.first()).toHaveAttribute("aria-disabled", "true");
  });

  test("2. ended: イベント終了後", async ({ page }) => {
    // event 36 は closed (= 過去開催)
    await page.goto("/event/36");
    const btn = page.getByTestId("register-state-ended");
    await expect(btn.first()).toBeVisible();
    await expect(btn.first()).toContainText("終了しました");
    await expect(btn.first()).toHaveAttribute("aria-disabled", "true");
  });

  test("3. cancelled: Event.status = cancelled", async ({ page }) => {
    // event 39 / 40 は cancelled
    await page.goto("/event/40");
    const btn = page.getByTestId("register-state-cancelled");
    await expect(btn.first()).toBeVisible();
    await expect(btn.first()).toContainText("中止されました");
    await expect(btn.first()).toHaveAttribute("aria-disabled", "true");
  });

  test("4. not-logged-in: 未ログイン", async ({ page }) => {
    // event 11 は受付中 / 未ログイン
    await page.goto(`/event/${OPEN_EVENT_ID}`);
    const link = page.getByTestId("register-state-not-logged-in");
    await expect(link.first()).toBeVisible();
    await expect(link.first()).toContainText("ログインして参加");
    // /login にリンクが向いている
    const href = await link.first().getAttribute("href");
    expect(href).toMatch(/^\/login\?next=/);
  });

  test("5. open: ログイン済 + 受付中 + 未参加", async ({ page }) => {
    await devLogin(page, DEV_USER, `/event/${OPEN_EVENT_ID}`);
    await page.waitForLoadState("networkidle");
    // 既に参加済みなら一度キャンセルしてから検証
    const cancelBtn = page.getByTestId("register-state-cancel-accepted");
    if (await cancelBtn.first().isVisible().catch(() => false)) {
      await cancelBtn.first().click();
      await page.waitForLoadState("networkidle");
      await page.waitForLoadState("domcontentloaded");
    }
    const open = page.getByTestId("register-state-open");
    await expect(open.first()).toBeVisible({ timeout: 10_000 });
    await expect(open.first()).toContainText("参加申込");
  });

  test("6. cancel-accepted: ログイン済 + 既に参加確定", async ({ page }) => {
    await devLogin(page, DEV_USER, `/event/${OPEN_EVENT_ID}`);
    await page.waitForLoadState("networkidle");

    // 順序保証: test 5 が cancel/open 状態のどちらで終わったか不明なので
    // ボタンの「現在状態」を確認してから必要な操作だけ行う。
    // - open  -> click して accepted へ遷移
    // - cancel-accepted -> 既に望ましい状態
    // 最大 2 回まで状態遷移を許す (open -> accepted)
    let attempts = 0;
    while (attempts < 3) {
      const cancelVisible = await page
        .getByTestId("register-state-cancel-accepted")
        .first()
        .isVisible()
        .catch(() => false);
      if (cancelVisible) break;
      const openVisible = await page
        .getByTestId("register-state-open")
        .first()
        .isVisible()
        .catch(() => false);
      if (openVisible) {
        await page.getByTestId("register-state-open").first().click();
        // server action 完了まで待つ
        await page.waitForLoadState("networkidle");
        await page.waitForLoadState("domcontentloaded");
      } else {
        // 一瞬の race: 何も visible じゃないなら register-state-* のいずれかが
        // 描画されるまで wait してから再判定する (固定 sleep より flake が少ない)
        await page
          .locator('[data-testid^="register-state-"]')
          .first()
          .waitFor({ state: "visible", timeout: 1000 })
          .catch(() => {
            // 出ない場合は次のループへ (attempts でリミット)
          });
      }
      attempts++;
    }

    const cancel = page.getByTestId("register-state-cancel-accepted");
    await expect(cancel.first()).toBeVisible({ timeout: 10_000 });
    await expect(cancel.first()).toContainText("参加をキャンセル");

    // クリーンアップ: 後続テストへの影響を避けるためにキャンセルしておく
    await cancel.first().click();
    await page.waitForLoadState("networkidle");
  });

  test("7. lottery: ログイン済 + 抽選方式の枠", async ({ page }) => {
    // event 41 は lottery / 未参加
    await devLogin(page, DEV_USER, "/event/41");
    // 既に抽選申込中ならキャンセル
    const pendingBtn = page.getByTestId("register-state-cancel-pending");
    if (await pendingBtn.first().isVisible().catch(() => false)) {
      await pendingBtn.first().click();
      await page.waitForLoadState("networkidle");
    }
    const lottery = page.getByTestId("register-state-lottery");
    await expect(lottery.first()).toBeVisible();
    await expect(lottery.first()).toContainText("抽選に申し込む");
  });
});
