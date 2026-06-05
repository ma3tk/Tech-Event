/**
 * MarkdownEditor の E2E
 *
 * - /event/create でログイン後、description で「**太字**」を入力
 *   → プレビューに <strong> が現れる
 * - ツールバーの「太字」ボタンで textarea の値が ** ** で囲まれる
 */
import { test, expect } from "@playwright/test";
import { devLoginLegacy as devLogin } from "./_helpers/auth";

const DEV_USER = "fast_moon_169";

test.describe("MarkdownEditor (description)", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("テキスト入力でプレビューに <strong> が表示される", async ({ page }) => {
    await devLogin(page, DEV_USER, "/event/create");

    const editorRoot = page.getByTestId("event-description-editor-root");
    await expect(editorRoot).toBeVisible();

    const textarea = page.getByTestId("event-description-editor-textarea");
    await textarea.fill("**太字** プレーン");

    // プレビュー側に strong タグがある
    const preview = page.getByTestId("event-description-editor-preview");
    await expect(preview.locator("strong")).toContainText("太字");

    // 文字数カウントが更新されている
    const count = page.getByTestId("event-description-editor-count");
    await expect(count).toContainText("/");
  });

  test("ツールバーの太字ボタンで選択範囲を ** で囲める", async ({ page }) => {
    await devLogin(page, DEV_USER, "/event/create");

    const textarea = page.getByTestId("event-description-editor-textarea");
    await textarea.fill("選択範囲のテスト");

    // textarea 全体を選択
    await textarea.focus();
    // 全体を選択 (SelectAll)
    await page.keyboard.press(
      process.platform === "darwin" ? "Meta+A" : "Control+A",
    );

    // 太字ボタンを押す
    await page.getByTestId("event-description-editor-btn-bold").click();

    // value が **...** で囲まれている
    const value = await textarea.inputValue();
    expect(value).toBe("**選択範囲のテスト**");

    // プレビューにも strong が反映される
    const preview = page.getByTestId("event-description-editor-preview");
    await expect(preview.locator("strong")).toContainText("選択範囲のテスト");
  });
});
