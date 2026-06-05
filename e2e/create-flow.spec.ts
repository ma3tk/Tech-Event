/**
 * グループ作成・イベント作成・編集フロー E2E
 *
 * 前提:
 *   - dev サーバが http://localhost:3000 で起動済み
 *   - シードユーザー `fast_moon_169` (id=1) でログインできる
 *
 * 検証:
 *   1. dev-login → /group/create でフォーム入力 → 作成成功 → /group/<subdomain> へ遷移
 *   2. 続けて /event/create でイベント作成 → 公開 → 一覧 (グループページ) に表示
 *   3. 編集ページ access、タイトル更新、保存後反映
 */
import { test, expect } from "@playwright/test";
import { devLogin as devLoginShared } from "./_helpers/auth";

// 注意: visual-compare-dark.spec.ts は /user/fast_moon_169 のスナップショットを
// 取得しているため、create-flow はそのユーザーで動かすと「主催イベント」カードが
// テスト中に増減して flake する。専用ユーザー `test_user` (seed-test-user.ts で投入)
// を使い、視覚回帰テストとデータ干渉しないようにする。
const DEV_USER = "test_user";

/** ランダムな subdomain を生成 (3-63 文字, [a-z0-9-]) */
function randomSubdomain(): string {
  // テスト毎にユニーク化するため timestamp + random
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 6);
  return `te-${ts}-${rnd}`.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

// dev-login ヘルパーは `_helpers/auth.ts` に統合済み。
// この spec は URL 待機を行わない (goto して終わり) ため、
// `skipWaitForUrl: true` を付けた薄いラッパとして公開する。
async function devLogin(
  page: import("@playwright/test").Page,
  nickname: string,
  nextPath: string,
): Promise<void> {
  await devLoginShared(page, nickname, { next: nextPath, skipWaitForUrl: true });
}

/** datetime-local 用文字列を生成: 今日から +offsetDays */
function plusDaysLocal(offsetDays: number, hour = 19, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate(),
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

test.describe("グループ・イベント作成フロー", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("グループ作成 → イベント作成 → 公開 → 編集 → タイトル反映", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    const subdomain = randomSubdomain();
    const groupName = `E2E Test Group ${subdomain}`;
    const eventTitle = `E2E Test Event ${Date.now()}`;
    const updatedTitle = `${eventTitle} (更新済)`;

    // ============ 1. dev-login & グループ作成 ============
    await devLogin(page, DEV_USER, "/group/create");
    await page.waitForURL(/\/group\/create/);

    await expect(page.getByTestId("group-create-form")).toBeVisible();

    await page.locator("input#subdomain").fill(subdomain);
    await page.locator("input#name").fill(groupName);
    await page
      .locator("input#subtitle")
      .fill("E2E でつくられたテスト用グループ");
    await page
      .locator("textarea#description")
      .fill("# テスト\nこれは Playwright で作成されたグループです。");

    await Promise.all([
      page.waitForURL(new RegExp(`/group/${subdomain}$`)),
      page.getByTestId("group-create-submit").click(),
    ]);

    // グループ詳細ページに遷移している (ヘッダーの h1 を一意に絞る)
    await expect(page.locator("h1").first()).toContainText(groupName);

    // ============ 2. イベント作成 ============
    await page.goto(`/event/create?group=${subdomain}`);
    await expect(page.getByTestId("event-create-form")).toBeVisible();

    // groupId select を確認 (自動で当該グループが選択されている)
    const groupSelect = page.locator("select#groupId");
    const groupSelectValue = await groupSelect.inputValue();
    expect(groupSelectValue).toMatch(/^\d+$/);
    // 表示テキストにグループ名が含まれている
    const selectedText = await groupSelect
      .locator("option:checked")
      .textContent();
    expect(selectedText).toContain(groupName);

    await page.locator("input#title").fill(eventTitle);
    await page
      .locator("input#catchPhrase")
      .fill("Playwright で公開されたテストイベント");
    await page
      .locator("textarea#description")
      .fill("## 概要\nこれはテストイベントです。");

    await page.locator("input#startedAt").fill(plusDaysLocal(7, 19, 0));
    await page.locator("input#endedAt").fill(plusDaysLocal(7, 21, 0));
    await page.locator("input#capacity").fill("30");

    // 参加枠 1 のみ入力 (defaultValue で「一般」が入っている)
    await page.locator("input[name='eventRole[0].capacity']").fill("30");

    // 公開ボタン押下 → /event/<id> に遷移
    await Promise.all([
      page.waitForURL(/\/event\/\d+$/),
      page.getByTestId("event-publish").click(),
    ]);

    const eventDetailUrl = page.url();
    const eventIdMatch = eventDetailUrl.match(/\/event\/(\d+)/);
    expect(eventIdMatch).not.toBeNull();
    const eventId = eventIdMatch![1]!;

    // イベント詳細ページにタイトルが表示されている
    await expect(page.locator("h1").first()).toContainText(eventTitle);

    // グループページの「開催予定」一覧に新イベントが現れる
    await page.goto(`/group/${subdomain}`);
    await expect(page.locator("body")).toContainText(eventTitle);

    // ============ 3. 編集ページで title 更新 ============
    await page.goto(`/event/${eventId}/edit`);
    await expect(page.getByTestId("event-edit-form")).toBeVisible();
    await page.locator("input#title").fill(updatedTitle);

    await Promise.all([
      page.waitForURL(new RegExp(`/event/${eventId}$`)),
      page.getByTestId("event-edit-save").click(),
    ]);

    // 編集後、イベント詳細ページに反映
    await expect(page.locator("h1").first()).toContainText(updatedTitle);
  });
});

test.describe("ヘッダーの主催導線", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("ログイン後ヘッダーに『イベントを作る』リンクが現れる", async ({
    page,
  }, testInfo) => {
    await devLogin(page, DEV_USER, "/dashboard");
    await page.waitForURL(/\/dashboard/);
    if (testInfo.project.name === "chromium-mobile") {
      // モバイルではハンバーガーを開いて確認 (デスクトップ専用 CTA は md:hidden)
      await page.getByRole("button", { name: /メニューを開く/ }).click();
      await expect(
        page.getByTestId("header-create-event-mobile"),
      ).toBeVisible();
    } else {
      await expect(page.getByTestId("header-create-event")).toBeVisible();
    }
  });
});
