/**
 * 抽選 (lottery) E2E
 *
 * 前提:
 *   - dev サーバが http://localhost:3000 で起動済み
 *   - シードが投入済み (`pnpm seed`)
 *   - event id=41 は抽選方式 (recruitmentMethod='lottery') かつ未抽選
 *     - capacity=5、pending 0 で開始 (E2E 前提条件)
 *     - lotteryAnnounceAt は未来日時
 *     - owner は user id=2 (`calm_owl_42`)
 *   - シードユーザー `fast_moon_169` (id=1) は event 41 に未参加
 *   - シードユーザー `calm_owl_42` (id=2) が event 41 の主催者
 *
 * 検証項目:
 *   1. dev-login (fast_moon_169) → /event/41 → 「抽選に申し込む」→
 *      「抽選申込中 (発表: YYYY/MM/DD)」表示
 *   2. dev-login (calm_owl_42) → /event/41/admin → 「今すぐ抽選を実行」→
 *      自分の status が accepted または waiting に確定する
 */
import { test, expect } from "@playwright/test";
import { devLoginLegacy as devLogin } from "./_helpers/auth";

const APPLICANT_USER = "fast_moon_169";
const ORGANIZER_USER = "calm_owl_42";
const LOTTERY_EVENT_ID = "41";

// 同一の event id 41 / user 1 を共有して操作するため、テストを直列実行する。
test.describe.configure({ mode: "serial" });

test.describe("抽選方式の参加申込", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("抽選方式のイベントに申込 → 「抽選申込中」表示", async ({ page }) => {
    await devLogin(page, APPLICANT_USER, `/event/${LOTTERY_EVENT_ID}`);

    // 既存の申込が残っていれば取り消す (テストの再実行に備える)
    const cancelBtnPre = page.getByRole("button", {
      name: /申込をキャンセル|参加をキャンセル|補欠登録をキャンセル/,
    });
    if (await cancelBtnPre.first().isVisible().catch(() => false)) {
      await cancelBtnPre.first().click();
      // 抽選申込ボタン (= 未申込状態) が再描画されるまで待つ。
      await expect(
        page.getByRole("button", { name: "抽選に申し込む" }).first(),
      ).toBeVisible({ timeout: 15_000 });
    }

    // 抽選方式の表示
    await expect(page.getByTestId("recruitment-method-lottery")).toBeVisible();
    await expect(page.getByTestId("lottery-announce-at")).toBeVisible();

    // 「抽選に申し込む」ボタン
    const applyBtn = page.getByRole("button", { name: "抽選に申し込む" });
    await expect(applyBtn.first()).toBeVisible();

    await applyBtn.first().click();

    // 「抽選申込中」表示 (Server Action の revalidate 完了を web-first assertion で待つ)
    await expect(page.getByTestId("lottery-pending-label")).toContainText(
      /抽選申込中/,
      { timeout: 15_000 },
    );
    await expect(page.getByTestId("my-participation-status")).toContainText(
      /抽選申込中/,
    );

    // 後始末 (キャンセル: 未申込状態に戻るまで待つ)
    await page.getByRole("button", { name: "申込をキャンセル" }).click();
    await expect(
      page.getByRole("button", { name: "抽選に申し込む" }).first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("主催者による抽選実行", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("主催者が「今すぐ抽選を実行」を押すと自分の status が確定する", async ({
    page,
  }) => {
    // 1. 申込者として申込 (fast_moon_169)
    await devLogin(page, APPLICANT_USER, `/event/${LOTTERY_EVENT_ID}`);

    // 既存申込があればキャンセル
    const cancelBtnPre = page.getByRole("button", {
      name: /申込をキャンセル|参加をキャンセル|補欠登録をキャンセル/,
    });
    if (await cancelBtnPre.first().isVisible().catch(() => false)) {
      await cancelBtnPre.first().click();
      await expect(
        page.getByRole("button", { name: "抽選に申し込む" }).first(),
      ).toBeVisible({ timeout: 15_000 });
    }

    const applyBtn = page.getByRole("button", { name: "抽選に申し込む" });
    await expect(applyBtn.first()).toBeVisible();
    await applyBtn.first().click();

    await expect(page.getByTestId("lottery-pending-label")).toContainText(
      /抽選申込中/,
      { timeout: 15_000 },
    );

    // 2. 主催者にログインし直して、管理画面で抽選実行
    await page.context().clearCookies();
    await devLogin(
      page,
      ORGANIZER_USER,
      `/event/${LOTTERY_EVENT_ID}/admin`,
    );

    // 「今すぐ抽選を実行」ボタンが見える
    const runBtn = page.getByTestId("run-lottery-button");
    await expect(runBtn).toBeVisible();
    // runLottery は Server Action (POST)。ボタン自体は実行後も enabled のままで
    // UI 変化が乏しいため、Server Action の POST レスポンス完了を待って
    // DB コミットを保証する (networkidle に依存しない)。
    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.request().method() === "POST" &&
          r.url().includes(`/event/${LOTTERY_EVENT_ID}/admin`) &&
          r.status() < 400,
        { timeout: 15_000 },
      ),
      runBtn.click(),
    ]);

    // 3. 申込者のセッションに戻って参加状況を確認
    await page.context().clearCookies();
    await devLogin(page, APPLICANT_USER, `/event/${LOTTERY_EVENT_ID}`);

    // status が accepted (当選) または waiting (落選=補欠) のいずれか
    const statusBox = page.getByTestId("my-participation-status");
    await expect(statusBox).toBeVisible();
    await expect(statusBox).toContainText(/参加確定|抽選結果: 当選|補欠登録中|抽選結果: 落選/);

    // 後始末
    const cancelBtn = page.getByRole("button", {
      name: /参加をキャンセル|補欠登録をキャンセル/,
    });
    if (await cancelBtn.first().isVisible().catch(() => false)) {
      await cancelBtn.first().click();
      // キャンセル確定 (= キャンセルボタンの消失) を web-first で待つ。
      // networkidle は dev server の HMR WebSocket で到達しない場合がある。
      await expect(cancelBtn.first()).toBeHidden({ timeout: 15_000 });
    }
  });
});
