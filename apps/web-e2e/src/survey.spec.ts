/**
 * イベントアンケート (Survey) の E2E
 *
 * フロー:
 *   1. 主催者 (fast_moon_169) で新しいイベントを作成
 *   2. /event/{id}/edit で質問を追加 (text, required)
 *   3. 別ユーザー (calm_owl_42) で /event/{id} に行く → 「参加申込」が
 *      /event/{id}/apply に遷移する
 *   4. 質問に回答して送信 → /event/{id} に戻り、参加確定中になる
 *   5. 主催者で /event/{id}/admin/survey に行く → 回答が見える
 *
 * 既存の seed イベントは Survey 未設定なので participate.spec.ts はそのまま
 * 動く前提。新規に作成するイベントだけ Survey を持たせる。
 */
import { test, expect } from "@playwright/test";
import { devLoginLegacy as devLogin } from "./_helpers/auth";

// 注: visual-compare-dark.spec.ts が /user/fast_moon_169 のスナップショットを撮るため、
// テスト中に同ユーザーの主催イベントを増やすと user-profile-dark が flake する。
// 専用ユーザー `test_user` (seed-test-user.ts で投入) を使う。
const OWNER = "test_user";
const APPLICANT = "calm_owl_42";


function plusDaysLocal(offsetDays: number, hour = 19, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate(),
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function randomSubdomain(): string {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 6);
  return `tesv-${ts}-${rnd}`.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

test.describe("申込時アンケート (Survey)", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("主催者が質問追加 → 申込者がフォームで回答 → 主催者が回答を確認", async ({
    page,
    browser,
  }) => {
    test.setTimeout(120_000);

    // ============ 1. 主催者でグループ + イベントを新規作成 ============
    const subdomain = randomSubdomain();
    const groupName = `Survey Test Group ${subdomain}`;
    const eventTitle = `Survey Test Event ${Date.now()}`;

    await devLogin(page, OWNER, "/group/create");
    await page.locator("input#subdomain").fill(subdomain);
    await page.locator("input#name").fill(groupName);
    await Promise.all([
      page.waitForURL(new RegExp(`/group/${subdomain}$`)),
      page.getByTestId("group-create-submit").click(),
    ]);

    await page.goto(`/event/create?group=${subdomain}`);
    await page.locator("input#title").fill(eventTitle);
    await page.locator("input#startedAt").fill(plusDaysLocal(7, 19, 0));
    await page.locator("input#endedAt").fill(plusDaysLocal(7, 21, 0));
    await page.locator("input#capacity").fill("30");
    await page.locator("input[name='eventRole[0].capacity']").fill("30");

    await Promise.all([
      page.waitForURL(/\/event\/\d+$/),
      page.getByTestId("event-publish").click(),
    ]);

    const eventUrl = page.url();
    const eventIdMatch = eventUrl.match(/\/event\/(\d+)/);
    expect(eventIdMatch).not.toBeNull();
    const eventId = eventIdMatch![1]!;

    // ============ 2. 質問追加 ============
    await page.goto(`/event/${eventId}/edit`);
    const surveySection = page.getByTestId("survey-section");
    await expect(surveySection).toBeVisible();

    // 質問追加フォームで text/required を追加
    await page.getByTestId("survey-add-body").fill("ご経験年数を教えてください");
    await page
      .getByTestId("survey-add-input-type")
      .selectOption("text");
    await page.getByTestId("survey-add-required").check();
    await Promise.all([
      page.waitForLoadState("networkidle"),
      page.getByTestId("survey-add-submit").click(),
    ]);

    // 一覧に出現したことを確認 (input value で確認)
    await page.reload();
    await expect(page.getByTestId("survey-question-list")).toBeVisible();
    await expect(
      page.locator(
        "[data-testid=survey-question-list] input[name='body']",
      ).first(),
    ).toHaveValue("ご経験年数を教えてください");

    // ============ 3. 別アカウントで参加申込 (別 context) ============
    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    await devLogin(page2, APPLICANT, `/event/${eventId}`);

    // 「参加申込」リンクが /apply に遷移する
    const applyBtn = page2.getByTestId("register-state-open").first();
    await expect(applyBtn).toBeVisible();

    await Promise.all([
      page2.waitForURL(new RegExp(`/event/${eventId}/apply`)),
      applyBtn.click(),
    ]);

    // フォームに回答
    await expect(page2.getByTestId("apply-form")).toBeVisible();
    const questionInput = page2.locator(
      'input[name^="answer-"]',
    ).first();
    await questionInput.fill("5 年程度です");

    // 送信
    await Promise.all([
      page2.waitForURL(new RegExp(`/event/${eventId}(\\?.*)?$`)),
      page2.getByTestId("apply-submit").click(),
    ]);

    // 参加確定中表示
    await expect(
      page2.getByTestId("my-participation-status"),
    ).toContainText("参加確定中");

    await ctx2.close();

    // ============ 4. 主催者として /admin/survey で回答を確認 ============
    await page.goto(`/event/${eventId}/admin/survey`);
    await expect(page.getByTestId("survey-results")).toBeVisible();
    // 回答テキストが見える
    await expect(
      page.locator("text=5 年程度です").first(),
    ).toBeVisible();

    // CSV エクスポートリンクが存在
    await expect(page.getByTestId("survey-csv-export")).toBeVisible();
  });
});
