/**
 * ShareModal E2E。
 *
 * 検証項目:
 *   1. シェアトリガーボタンが描画される
 *   2. クリックでモーダルが開く (モバイルは navigator.share が無い前提)
 *   3. ESC キーで閉じる
 *   4. リンクコピーボタンを押すと clipboard に shareUrl が入る
 *   5. SNS 6 種類のリンクが描画されている
 *
 * モバイルでは navigator.share が自動で発火するためモーダルが開かない場合があるが、
 * Playwright の Chromium ではデフォルトで Web Share API が無い (or unsupported) ため、
 * フォールバックでモーダルが開く前提。
 */
import { test, expect } from "@playwright/test";

const EVENT_ID = "1";

test.describe("Share Modal", () => {
  test("シェアトリガーが表示される", async ({ page }) => {
    await page.goto(`/event/${EVENT_ID}`);
    // page には 2 つ以上のシェアトリガーが存在する可能性 (サイドバー + 将来追加)
    // 1 つ目を検証する
    const triggers = page.getByTestId("share-modal-trigger");
    await expect(triggers.first()).toBeVisible();
  });

  test("トリガークリックでモーダルが開き、ESC で閉じる", async ({ page }) => {
    // navigator.share を強制的に undefined 化してフォールバックを強制する
    await page.addInitScript(() => {
      // @ts-expect-error - 強制無効化
      delete (navigator as Navigator).share;
    });
    await page.goto(`/event/${EVENT_ID}`);

    const trigger = page.getByTestId("share-modal-trigger").first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const modal = page.getByTestId("share-modal");
    await expect(modal).toBeVisible();
    await expect(
      modal.getByRole("heading", { name: "イベントをシェア" }),
    ).toBeVisible();

    // SNS 6 種類のリンク
    const snsSection = page.getByTestId("share-modal-sns");
    await expect(snsSection).toBeVisible();
    for (const id of ["x", "facebook", "line", "discord", "slack", "email"]) {
      await expect(page.getByTestId(`share-modal-sns-${id}`)).toBeVisible();
    }

    // ESC で閉じる
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
  });

  test("コピーボタンで clipboard に shareUrl が入る", async ({
    page,
    context,
  }) => {
    // clipboard 権限を付与
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.addInitScript(() => {
      // @ts-expect-error - 強制無効化
      delete (navigator as Navigator).share;
    });
    await page.goto(`/event/${EVENT_ID}`);

    const trigger = page.getByTestId("share-modal-trigger").first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const urlInput = page.getByTestId("share-modal-url-input");
    await expect(urlInput).toBeVisible();
    const expected = await urlInput.inputValue();
    expect(expected).toMatch(/\/event\/1/);

    const copyBtn = page.getByTestId("share-modal-copy");
    await copyBtn.click();
    // ラベルが「コピー済」に変わる
    await expect(copyBtn).toContainText("コピー済");
    // clipboard 内容
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );
    expect(clipboardText).toBe(expected);
  });

  test("埋め込みコードのコピーが動作する", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.addInitScript(() => {
      // @ts-expect-error - 強制無効化
      delete (navigator as Navigator).share;
    });
    await page.goto(`/event/${EVENT_ID}`);

    const trigger = page.getByTestId("share-modal-trigger").first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const embedTextarea = page.getByTestId("share-modal-embed-code");
    const embedText = await embedTextarea.inputValue();
    expect(embedText).toMatch(/<iframe[^>]+\/event\/1[^>]+>/);

    await page.getByTestId("share-modal-embed-copy").click();
    await expect(page.getByTestId("share-modal-embed-copy")).toContainText(
      "コピー済",
    );
  });
});
