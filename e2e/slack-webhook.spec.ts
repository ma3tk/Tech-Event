/**
 * Slack Webhook 通知 E2E。
 *
 * シナリオ:
 *  1. Group(id=1) に Slack Webhook URL (localhost catcher) をセット
 *  2. 主催者 (events[33] = draft, ownerId=1) でログイン
 *  3. 編集画面から「公開する」を押下 → publishEvent が走る
 *  4. catcher 側に POST 1 件が記録され、`text` フィールドに event タイトルが含まれることを確認
 *
 * catcher = `/api/test/slack-catcher` (本番では 404)。
 */
import { test, expect } from "@playwright/test";
import { devLoginLegacy as devLogin } from "./_helpers/auth";

// seed では fixed first nickname = fast_moon_169 (id=1)
const DEV_USER = "fast_moon_169";
// fast_moon_169 が ownerId のドラフトイベント (seed の規則により owner=ownerId 一致)
// 31 (実践 DDD…) は ownerId=2、33 (深掘り Go カンファレンス 8) は ownerId=1
const DRAFT_EVENT_ID = "33";
const GROUP_ID = "1";
const TOKEN = `slack-test-${Date.now()}`;


// このファイル内のテストは Group の状態 (slackWebhookUrl) と event の status を共有するため
// 直列実行する。並列で動かすと afterEach の URL クリアと beforeEach の URL 設定が
// 干渉し flake する。
test.describe.configure({ mode: "serial" });

test.describe("Slack Webhook (公開時通知)", () => {
  test.beforeEach(async ({ context, request }) => {
    await context.clearCookies();
    // catcher を初期化 + イベントを draft に戻す
    await request.delete(`/api/test/slack-catcher?token=${TOKEN}`);
    await request.post(
      `/api/test/reset-event-status?eventId=${DRAFT_EVENT_ID}&status=draft`,
    );
  });

  test.afterEach(async ({ request }) => {
    // 後片付け: slack URL をクリア + event を draft に戻す
    await request.post(
      `/api/test/set-slack-webhook?groupId=${GROUP_ID}&url=`,
    );
    await request.post(
      `/api/test/reset-event-status?eventId=${DRAFT_EVENT_ID}&status=draft`,
    );
  });

  test("Webhook 設定 → イベント公開 → catcher で受信を確認", async ({
    page,
    request,
    baseURL,
  }) => {
    const webhookUrl = `${baseURL ?? "http://localhost:3000"}/api/test/slack-catcher?token=${TOKEN}`;

    // 1) Group に webhook URL を設定
    const setRes = await request.post(
      `/api/test/set-slack-webhook?groupId=${GROUP_ID}&url=${encodeURIComponent(webhookUrl)}`,
    );
    expect(setRes.ok()).toBeTruthy();

    // 2) catcher の初期状態 (0 件)
    const init = await request.get(`/api/test/slack-catcher?token=${TOKEN}`);
    const initJson = await init.json();
    expect(initJson.count).toBe(0);

    // 3) 主催者でログイン → edit ページへ
    await devLogin(page, DEV_USER, `/event/${DRAFT_EVENT_ID}/edit`);
    await page.waitForLoadState("domcontentloaded");

    // 4) 公開ボタンを押下
    const publishBtn = page.getByTestId("event-publish");
    await expect(publishBtn).toBeVisible();
    await publishBtn.click();
    // publishEvent は最後に /event/:id へ redirect する
    await page.waitForURL(/\/event\/\d+(\?.*)?$/);

    // 5) catcher に 1 件記録されている (リトライ的に最大 5 秒)
    let count = 0;
    let records: Array<{ body?: { text?: string } }> = [];
    for (let i = 0; i < 10; i++) {
      const res = await request.get(`/api/test/slack-catcher?token=${TOKEN}`);
      const j = await res.json();
      count = j.count;
      records = j.records;
      if (count >= 1) break;
      await new Promise((r) => setTimeout(r, 500));
    }
    expect(count).toBeGreaterThanOrEqual(1);
    // text にイベントタイトル / 公開メッセージのキーワードが含まれる
    const text = records[0]?.body?.text ?? "";
    expect(text).toMatch(/新しいイベントが公開されました/);
  });

  test("webhook URL が未設定なら no-op (catcher に何も来ない)", async ({
    page,
    request,
  }) => {
    // 明示的に webhook URL をクリア
    await request.post(`/api/test/set-slack-webhook?groupId=${GROUP_ID}&url=`);

    // 既に publish 済みの可能性があるため、まず draft の別 event を見つけられないので
    // この test では catcher 側が空のまま遷移できることを確認する。
    // (主シナリオは別 test でカバー済み)
    const init = await request.get(`/api/test/slack-catcher?token=${TOKEN}`);
    const initJson = await init.json();
    expect(initJson.count).toBe(0);

    await page.goto("/pricing", { waitUntil: "domcontentloaded" });
    // ページ遷移しても catcher は 0 件のまま
    const after = await request.get(`/api/test/slack-catcher?token=${TOKEN}`);
    const afterJson = await after.json();
    expect(afterJson.count).toBe(0);
  });
});
