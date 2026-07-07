/**
 * 主催者/グループ発の通知配線 E2E。
 *
 * 検証シナリオ:
 *   1. グループ一斉メッセージ:
 *      test_user がグループを作成 → メンバー管理ページの導線から
 *      /group/<sub>/admin/broadcast を開き件名/本文を送信 →
 *      送信完了バナー + 自身 (作成時に自動でメンバー登録される) の
 *      通知センターに `group_message` 通知が表示される。
 *   2. イベント中止:
 *      test_user がグループ + 公開イベントを作成 → fast_moon_169 が参加申込 →
 *      test_user が admin/more から中止 → fast_moon_169 の通知センターに
 *      `event_cancelled` (「〜が中止になりました」) 通知が表示される。
 *
 * 前提:
 *   - dev サーバ稼働中 + seed 投入済み (`test_user` は seed-test-user.ts で投入)
 *   - リソース (グループ subdomain / イベントタイトル) は毎回ユニークに
 *     生成するため、他テスト・再実行と干渉しない。
 */
import { test, expect, type Page } from "@playwright/test";
import { devLogin as devLoginShared } from "./_helpers/auth";

const OWNER = "test_user";
const PARTICIPANT = "fast_moon_169";

async function devLogin(
  page: Page,
  nickname: string,
  nextPath: string,
): Promise<void> {
  await devLoginShared(page, nickname, { next: nextPath, skipWaitForUrl: true });
}

/** ランダムな subdomain を生成 (3-63 文字, [a-z0-9-]) */
function randomSubdomain(): string {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 6);
  return `te-bc-${ts}-${rnd}`.toLowerCase().replace(/[^a-z0-9-]/g, "");
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

/** グループを UI から作成して subdomain を返す */
async function createGroup(page: Page, subdomain: string): Promise<string> {
  const groupName = `E2E Broadcast Group ${subdomain}`;
  await page.goto("/group/create");
  await expect(page.getByTestId("group-create-form")).toBeVisible();
  await page.locator("input#subdomain").fill(subdomain);
  await page.locator("input#name").fill(groupName);
  await Promise.all([
    page.waitForURL(new RegExp(`/group/${subdomain}`)),
    page.getByTestId("group-create-submit").click(),
  ]);
  return groupName;
}

test.describe("主催者/グループ発の通知配線", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("グループ一斉メッセージ送信 → メンバーの通知センターに表示", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    const subdomain = randomSubdomain();
    const subject = `E2E 一斉メッセージ ${Date.now()}`;
    const body = "これは E2E テストからの一斉メッセージです。\n2 行目もあります。";

    // 1) グループ作成 (作成者は owner + 初期メンバーとして登録される)
    await devLogin(page, OWNER, "/group/create");
    const groupName = await createGroup(page, subdomain);

    // 2) メンバー管理ページからの導線リンクで broadcast ページへ
    await page.goto(`/group/${subdomain}/admin/members`);
    await expect(page.getByTestId("group-members-heading")).toBeVisible();
    await page.getByTestId("group-broadcast-link").click();
    await page.waitForURL(new RegExp(`/group/${subdomain}/admin/broadcast`));
    await expect(page.getByTestId("group-broadcast-form")).toBeVisible();

    // 3) 件名 / 本文を入力して送信
    await page.getByTestId("group-broadcast-subject").fill(subject);
    await page.getByTestId("group-broadcast-body").fill(body);
    await Promise.all([
      page.waitForURL(/\?sent=1/),
      page.getByTestId("group-broadcast-submit").click(),
    ]);
    await expect(
      page.getByTestId("group-broadcast-sent-banner"),
    ).toBeVisible();

    // 送信履歴にも表示される
    await expect(page.getByTestId("group-broadcast-history")).toContainText(
      subject,
    );

    // 4) 通知センターに group_message 通知が表示される
    //    (送信者自身もメンバーなので受信対象)
    await page.goto("/notifications");
    await expect(page.getByTestId("notifications-list")).toBeVisible();
    const row = page
      .getByTestId("notifications-row")
      .filter({ hasText: subject })
      .first();
    await expect(row).toBeVisible();
    await expect(row).toContainText(groupName);
  });

  test("イベント中止 → 参加者の通知センターに中止通知が表示", async ({
    page,
    context,
  }) => {
    test.setTimeout(150_000);

    const subdomain = randomSubdomain();
    const eventTitle = `E2E Cancel Event ${Date.now()}`;

    // 1) 主催者: グループ + 公開イベントを作成
    await devLogin(page, OWNER, "/group/create");
    await createGroup(page, subdomain);

    await page.goto(`/event/create?group=${subdomain}`);
    await expect(page.getByTestId("event-create-form")).toBeVisible();
    await page.locator("input#title").fill(eventTitle);
    await page.locator("input#startedAt").fill(plusDaysLocal(7, 19, 0));
    await page.locator("input#endedAt").fill(plusDaysLocal(7, 21, 0));
    await page.locator("input#capacity").fill("30");
    await Promise.all([
      page.waitForURL(/\/event\/\d+$/),
      page.getByTestId("event-publish").click(),
    ]);
    const eventIdMatch = page.url().match(/\/event\/(\d+)/);
    expect(eventIdMatch).not.toBeNull();
    const eventId = eventIdMatch![1]!;

    // 2) 参加者: イベントに参加申込 (accepted)
    await context.clearCookies();
    await devLogin(page, PARTICIPANT, `/event/${eventId}`);
    const joinBtn = page.getByRole("button", { name: "参加申込" });
    await expect(joinBtn.first()).toBeVisible();
    await joinBtn.first().click();
    await expect(page.getByTestId("my-participation-status")).toContainText(
      "参加確定中",
      { timeout: 15_000 },
    );

    // 3) 主催者: admin/more からイベントを中止
    await context.clearCookies();
    await devLogin(page, OWNER, `/event/${eventId}/admin/more`);
    const cancelBtn = page.getByTestId("admin-more-cancel-button");
    await expect(cancelBtn).toBeVisible();
    await Promise.all([
      page.waitForURL(new RegExp(`/event/${eventId}$`)),
      cancelBtn.click(),
    ]);

    // 4) 参加者: 通知センターに event_cancelled 通知が表示される
    await context.clearCookies();
    await devLogin(page, PARTICIPANT, "/notifications");
    await expect(page.getByTestId("notifications-list")).toBeVisible();
    const row = page
      .getByTestId("notifications-row")
      .filter({ hasText: eventTitle })
      .filter({ hasText: "中止" })
      .first();
    await expect(row).toBeVisible();
  });
});
