/**
 * Approval Required 申込フロー (Luma 風) E2E。
 *
 * 1. 主催者 (events[0]/id=1 の owner) でログイン → /event/1/edit で
 *    「承認制にする」をチェック → 保存。
 * 2. 別ユーザー (test_user) でログイン → /event/1 → ボタンが
 *    「参加リクエストを送信」になっていることを確認 → 送信。
 *    → 「承認待ち」表示。
 * 3. 主催者で /event/1/admin/guests?status=approval_pending → 承認ボタンを押す。
 * 4. 別ユーザーで /event/1 をリロード → 「承認済」と表示される。
 *
 * 注: 主催者は seed の `fast_moon_169` (id=1) で、events[0] (id=1) の owner。
 * test_user は seed-test-user.ts で投入される独立アカウント。
 */
import path from "node:path";
import Database from "better-sqlite3";
import { test, expect } from "@playwright/test";
import { devLoginLegacy as devLogin } from "./_helpers/auth";

const HOST_USER = "fast_moon_169";
const APPLICANT_USER = "test_user";
// seed の event id=17 は owner=fast_moon_169 (= HOST_USER) かつ acceptsFrom が過去で
// 申込可能 + 空き枠あり。他の participate.spec.ts (id=11/22) と分離するため id=17 を使う。
const EVENT_ID = "17";

// dev.db への直接 reset 用パス (audit-log.spec.ts と同様の解決)。
const DB_PATH = path.resolve(__dirname, "../../web/dev.db");

/**
 * 本 spec はリトライ時の state contamination (前回 run で applicant が approved 済み)
 * で flake するため、各テスト開始前に APPLICANT_USER の EVENT_ID 上の Participant を
 * 削除しておく (= 「未申込」状態に戻す)。
 *
 * baseline DB に approved/pending な Participant が無いことが前提なので、
 * 削除のみで idempotent。
 */
function resetApplicantParticipation(): void {
  const db = new Database(DB_PATH);
  try {
    db.prepare(
      `DELETE FROM participants
       WHERE eventId = ?
         AND userId = (SELECT id FROM users WHERE nickname = ?)`,
    ).run(Number(EVENT_ID), APPLICANT_USER);
  } finally {
    db.close();
  }
}

test.describe("Approval Required 申込フロー", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
    // 前回 run の残骸 (approved Participant) で「承認待ち」が出ないケースを防ぐ。
    try {
      resetApplicantParticipation();
    } catch (e) {
      console.warn(`[approval-flow] resetApplicantParticipation failed: ${e}`);
    }
  });
  // approval-flow UI は mobile で button label の表示が分岐する。
  // 本スイートは desktop UI 検証として書かれているため mobile は対象外。
  test.beforeEach(async ({}, testInfo) => {
    test.skip(
      testInfo.project.name === "chromium-mobile",
      "本スイートは desktop UI 検証用 (mobile は別フロー)",
    );
  });

  test("主催者 → 承認制 ON → 別ユーザーで申請 → 承認 → 承認済表示", async ({
    page,
  }) => {
    // 1) 主催者: 承認制 ON
    await devLogin(page, HOST_USER, `/event/${EVENT_ID}/edit`);
    await expect(page.getByTestId("event-approval-required")).toBeVisible();
    const checkbox = page.getByTestId("event-approval-required");
    // 必要なら check
    if (!(await checkbox.isChecked())) {
      await checkbox.check();
    }
    await page.getByTestId("event-edit-save").click();
    await page.waitForURL((url) =>
      url.pathname.endsWith(`/event/${EVENT_ID}`),
    );
    await expect(page.getByTestId("approval-required-badge")).toBeVisible();

    // 主催者ログアウト
    await page.context().clearCookies();

    // 2) 別ユーザー: 参加リクエスト
    await devLogin(page, APPLICANT_USER, `/event/${EVENT_ID}`);
    const requestBtn = page
      .getByRole("button", { name: "参加リクエストを送信" })
      .first();
    await expect(requestBtn).toBeVisible();
    await requestBtn.click();
    await page.waitForLoadState("networkidle");
    // 念のため明示的にリロードして DB の最新状態を取得
    await page.goto(`/event/${EVENT_ID}`);

    // 承認待ち表示 (上部の自分の参加状況サマリ)
    await expect(page.getByTestId("my-participation-status")).toContainText(
      "承認待ち",
    );

    // 申請者ログアウト
    await page.context().clearCookies();

    // 3) 主催者: 承認
    await devLogin(
      page,
      HOST_USER,
      `/event/${EVENT_ID}/admin/guests?status=approval_pending`,
    );
    const approveBtn = page
      .getByRole("button", { name: "承認" })
      .first();
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();
    await page.waitForLoadState("networkidle");

    // 主催者ログアウト
    await page.context().clearCookies();

    // 4) 申請者: 承認済表示
    await devLogin(page, APPLICANT_USER, `/event/${EVENT_ID}`);
    await expect(page.getByTestId("my-participation-status")).toContainText(
      /承認済/,
    );

    // 後始末: 承認制 OFF に戻す
    await page.context().clearCookies();
    await devLogin(page, HOST_USER, `/event/${EVENT_ID}/edit`);
    const checkbox2 = page.getByTestId("event-approval-required");
    if (await checkbox2.isChecked()) {
      await checkbox2.uncheck();
    }
    await page.getByTestId("event-edit-save").click();
    await page.waitForLoadState("networkidle");
  });
});
