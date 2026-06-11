/**
 * 参加申込フロー E2E。
 *
 * 前提:
 *   - dev サーバが http://localhost:3000 で起動済み
 *   - シードが投入済み (`pnpm seed`)
 *   - シードユーザー `fast_moon_169` (id=1) が event id=11 / id=22 に未参加
 *   - event id=11 は受付中で空きあり (シードの accepting カテゴリ初頭)
 *   - event id=22 は満員 (capacity=15 / accepted=15) で role id=32 も満員
 *
 * 検証項目:
 *   1. dev-login → /event/11 → 参加申込 → 「参加をキャンセル」表示
 *   2. キャンセル → 「参加申込」表示に戻る
 *   3. dev-login → /event/22 (満員) → 補欠登録 → 補欠登録中表示
 *
 * 注: event id=1 は category="future" で acceptsFrom が未来日のため、Luma 参考の
 *     register-state-pre-acceptance に該当する (本来 accepting を想定していた古い
 *     コメントは更新済み)。
 */
import { test, expect } from "@playwright/test";
import { devLoginLegacy as devLogin } from "./_helpers/auth";

// 同じ user (fast_moon_169) で同じ event 群 (11/22) に対し
// participant 状態を変更するため、ワーカ並列実行で race が起きる。
// describe 内 serial に固定して flake を防ぐ。
test.describe.configure({ mode: "serial" });

const DEV_USER = "fast_moon_169";
// シードの accepting カテゴリは index 10〜19 (= event id 11〜20)。
// acceptsFrom が過去のため確実に申込可能。
const ACCEPTING_EVENT_ID = "11";
const FULL_EVENT_ID = "22";


test.describe("参加申込フロー (Server Action)", () => {
  test.beforeEach(async ({ context }) => {
    // テスト間でセッションが残らないようにクリア
    await context.clearCookies();
  });

  test("受付中イベントへの申込 → キャンセル", async ({ page }) => {
    await devLogin(page, DEV_USER, `/event/${ACCEPTING_EVENT_ID}`);

    // 既にこのテストで申込済みの場合に備えて、最初に状態を判定
    // 「参加をキャンセル」ボタンがあれば押して未参加状態に戻す
    const cancelBtnPre = page.getByRole("button", {
      name: /参加をキャンセル|補欠登録をキャンセル/,
    });
    if (await cancelBtnPre.first().isVisible().catch(() => false)) {
      await cancelBtnPre.first().click();
      // 未参加状態 (= 申込ボタン再描画) に戻るまで待つ。
      await expect(
        page.getByRole("button", { name: "参加申込" }).first(),
      ).toBeVisible({ timeout: 15_000 });
    }

    // 申込ボタンが出ているはず
    const joinBtn = page.getByRole("button", { name: "参加申込" });
    await expect(joinBtn.first()).toBeVisible();

    // 参加申込 (Server Action の revalidate 完了は status 表示で待つ)
    await joinBtn.first().click();

    // 参加をキャンセルボタンが出ている
    await expect(
      page.getByRole("button", { name: "参加をキャンセル" }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("my-participation-status")).toContainText(
      "参加確定中",
    );

    // キャンセル
    await page.getByRole("button", { name: "参加をキャンセル" }).click();

    // 申込ボタンに戻っている
    await expect(
      page.getByRole("button", { name: "参加申込" }).first(),
    ).toBeVisible();
    await expect(
      page.getByTestId("my-participation-status"),
    ).toBeHidden();
  });

  test("満員イベントへの申込は補欠登録になる", async ({ page }) => {
    await devLogin(page, DEV_USER, `/event/${FULL_EVENT_ID}`);

    // 前回テストの残りキャンセル
    const cancelBtnPre = page.getByRole("button", {
      name: /参加をキャンセル|補欠登録をキャンセル/,
    });
    if (await cancelBtnPre.first().isVisible().catch(() => false)) {
      await cancelBtnPre.first().click();
      // 補欠登録ボタン (= 未参加状態) が再描画されるまで待つ。
      await expect(
        page.getByRole("button", { name: "補欠登録する" }).first(),
      ).toBeVisible({ timeout: 15_000 });
    }

    // 満員なので「補欠登録する」ボタンが出ている
    const waitlistBtn = page.getByRole("button", { name: "補欠登録する" });
    await expect(waitlistBtn.first()).toBeVisible();

    await waitlistBtn.first().click();

    // 補欠登録中表示
    await expect(page.getByTestId("my-participation-status")).toContainText(
      "補欠登録中",
      { timeout: 15_000 },
    );
    await expect(
      page.getByRole("button", { name: "補欠登録をキャンセル" }),
    ).toBeVisible();

    // 後始末 (未参加状態に戻るまで待つ)
    await page.getByRole("button", { name: "補欠登録をキャンセル" }).click();
    await expect(
      page.getByRole("button", { name: "補欠登録する" }).first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("ログインページの開発用リンク", () => {
  test("dev-login リンクが表示され、クリックでログイン状態になる", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await page.goto("/login");

    // 開発環境ならセクションが表示されている
    await expect(page.getByTestId("dev-login-section")).toBeVisible();
    await expect(
      page.getByTestId(`dev-login-${DEV_USER}`),
    ).toBeVisible();
  });
});
