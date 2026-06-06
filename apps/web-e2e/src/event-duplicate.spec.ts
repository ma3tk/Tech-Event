/**
 * イベント複製モーダルの E2E。
 *
 * 既存 `duplicateEvent` Server Action を旧 form (eventId のみ) でも互換動作するように
 * 保ちつつ、新規モーダルからは includeTags / includeRoles / includeSurvey /
 * includePresentations / shiftDays の細かい設定を送れる。
 *
 * シナリオ:
 *  1. test_user で /event/<own-event>/admin/more を開く
 *  2. モーダルを開いて全 ON で「複製してdraft作成」
 *  3. /edit に遷移し、タイトルが「... (複製)」になっていることを確認
 *  4. 別のイベントで全 OFF (タグ/ロール解除) + shiftDays=0 で同じく動作確認
 *
 * 注意: test_user 専用 event を使うため、まず create-flow を流して作成 → そこから複製。
 * シンプル化のため、seed の event id=1 (owner=fast_moon_169) を使い fast_moon_169 で
 * dev-login する。fast_moon_169 が他テストと並走するリスクはあるが、複製は draft 作成
 * (副作用は新イベント追加だけで他テストへの干渉なし)。
 */
import { test, expect } from "@playwright/test";

import { devLoginLegacy as devLogin } from "./_helpers/auth";

const OWNER = "fast_moon_169";
const EVENT_ID = "1"; // seed: owner = fast_moon_169

test.describe("イベント複製モーダル", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("全オプション ON で複製 → 編集ページに遷移", async ({ page }) => {
    await devLogin(page, OWNER, `/event/${EVENT_ID}/admin/more`);
    await expect(page.getByTestId("admin-more-duplicate")).toBeVisible();

    // モーダルを開く
    await page.getByTestId("admin-more-duplicate-button").click();
    await expect(page.getByTestId("admin-more-duplicate-modal")).toBeVisible();

    // 各オプションのデフォルト (Roles / Tags は true, Survey / Presentations は false)
    await expect(page.getByTestId("duplicate-opt-roles")).toBeChecked();
    await expect(page.getByTestId("duplicate-opt-tags")).toBeChecked();
    await expect(page.getByTestId("duplicate-opt-survey")).not.toBeChecked();
    await expect(
      page.getByTestId("duplicate-opt-presentations"),
    ).not.toBeChecked();

    // 全部 ON にする
    await page.getByTestId("duplicate-opt-survey").check();
    await page.getByTestId("duplicate-opt-presentations").check();

    // shiftDays を 14 に変更
    await page.getByTestId("duplicate-opt-shift-days").fill("14");

    // 送信
    await page.getByTestId("admin-more-duplicate-submit").click();

    // /event/<new>/edit へ遷移
    await page.waitForURL(/\/event\/\d+\/edit/);
    // タイトル入力に「(複製)」が含まれる
    const titleInput = page.locator('input[name="title"]').first();
    await expect(titleInput).toBeVisible();
    const titleVal = await titleInput.inputValue();
    expect(titleVal).toContain("(複製)");
  });

  test("全オプション OFF + shiftDays=0 で複製 → 編集ページに遷移", async ({
    page,
  }) => {
    await devLogin(page, OWNER, `/event/${EVENT_ID}/admin/more`);
    await page.getByTestId("admin-more-duplicate-button").click();
    await expect(page.getByTestId("admin-more-duplicate-modal")).toBeVisible();

    // 全 OFF
    await page.getByTestId("duplicate-opt-roles").uncheck();
    await page.getByTestId("duplicate-opt-tags").uncheck();
    await page.getByTestId("duplicate-opt-shift-days").fill("0");

    await page.getByTestId("admin-more-duplicate-submit").click();
    await page.waitForURL(/\/event\/\d+\/edit/);
    const titleInput = page.locator('input[name="title"]').first();
    const titleVal = await titleInput.inputValue();
    expect(titleVal).toContain("(複製)");
  });
});
