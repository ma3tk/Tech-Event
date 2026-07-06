/**
 * Calendar Membership Tiers (有料 / 承認制カレンダー購読) の E2E テスト。
 *
 * 検証項目:
 *  1. owner (test_user) がカレンダー作成 → manage で承認制 tier を作成
 *     → 公開ページに tier が表示される
 *  2. 無料購読の後方互換: tier があるカレンダーでも従来の Subscribe ボタンで
 *     即時購読 → 解除が従来どおり動く (tierId 無し経路は無変更)
 *  3. 承認フロー: subscriber (fast_moon_169) が tier 購読 → 承認待ち (pending)
 *     → owner が manage で承認 → subscriber 側で 購読中 (active) になる
 *
 * 注意:
 *  - DB 状態に依存するため serial mode。owner は E2E 用固定ユーザー test_user
 *  - カレンダー slug は timestamp + random でテスト毎にユニーク化
 *    (fast_moon_169 は既存 VRT データと干渉しない新規カレンダーのみ購読)
 *  - waitForTimeout 禁止 → waitForURL / locator-based 待機のみ
 */
import { test, expect } from "@playwright/test";
import { devLogin } from "./_helpers/auth";

const OWNER = "test_user";
const SUBSCRIBER = "fast_moon_169";

/** ランダムな slug を生成 (3-63 文字, [a-z0-9-]) */
function randomSlug(prefix: string): string {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 6);
  return `${prefix}-${ts}-${rnd}`.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

test.describe("Calendar Membership Tiers", () => {
  test.describe.configure({ mode: "serial" });

  const calSlug = randomSlug("te-tiercal");
  const calName = `E2E TierCal ${calSlug}`;
  const tierName = "Insider (承認制)";

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("owner がカレンダー作成 → 承認制 tier 作成 → 公開ページに表示", async ({
    page,
  }) => {
    // ---- 1. カレンダー作成 ----
    await devLogin(page, OWNER, { next: "/calendar/create" });
    await expect(page.getByTestId("calendar-create-form")).toBeVisible();
    await page.locator("#slug").fill(calSlug);
    await page.locator("#name").fill(calName);
    await page.getByTestId("calendar-create-submit").click();
    await page.waitForURL(`**/calendar/${calSlug}**`);
    await expect(page.getByTestId("calendar-name")).toHaveText(calName);

    // tier 無しの間は tier セクションが出ない (従来 UI のみ)
    await expect(page.getByTestId("calendar-tiers-section")).toHaveCount(0);

    // ---- 2. manage で承認制 tier を作成 ----
    await page.goto(`/calendar/${calSlug}/manage`);
    await expect(page.getByTestId("calendar-tier-create-form")).toBeVisible();
    // 承認待ちリクエストはまだ 0 件
    await expect(page.getByTestId("calendar-pending-subs-empty")).toBeVisible();

    await page.getByTestId("calendar-tier-name-input").fill(tierName);
    await page.getByTestId("calendar-tier-price-input").fill("0");
    await page.getByTestId("calendar-tier-approval-checkbox").check();
    await page.getByTestId("calendar-tier-create-submit").click();
    await page.waitForURL(`**/calendar/${calSlug}/manage?notice=tier-created`);

    await expect(page.getByTestId("calendar-manage-notice")).toBeVisible();
    const tierRow = page.locator('[data-testid^="calendar-tier-row-"]');
    await expect(tierRow).toHaveCount(1);
    // 行内は編集フォーム (input) なので value で検証する
    await expect(tierRow.first().locator('input[name="name"]')).toHaveValue(
      tierName,
    );

    // ---- 3. 公開ページに tier が表示される ----
    await page.goto(`/calendar/${calSlug}`);
    await expect(page.getByTestId("calendar-tiers-section")).toBeVisible();
    const tierItem = page.locator('[data-testid^="calendar-tier-item-"]');
    await expect(tierItem).toHaveCount(1);
    await expect(tierItem.first()).toContainText(tierName);
    await expect(
      page.locator('[data-testid^="calendar-tier-approval-badge-"]'),
    ).toHaveText("承認制");
  });

  test("後方互換: tier があっても従来の無料購読 → 解除がそのまま動く", async ({
    page,
  }) => {
    await devLogin(page, SUBSCRIBER, { next: `/calendar/${calSlug}` });
    await expect(page.getByTestId("calendar-name")).toHaveText(calName);

    // 従来の Subscribe ボタン (tierId 無し経路) で即時購読
    await expect(page.getByTestId("calendar-subscribe-button")).toBeVisible();
    await page.getByTestId("calendar-subscribe-button").click();
    await page.waitForURL(`**/calendar/${calSlug}`);
    // 直前の URL が同一パスのため waitForURL は即時 resolve し得る。
    // locator 側の長め timeout で server action + revalidate 完了を待つ。
    await expect(page.getByTestId("calendar-unsubscribe-button")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("calendar-unsubscribe-button")).toContainText(
      "✓",
    );

    // 解除で元状態に戻る (revalidate のタイミング差を考慮して長め timeout)
    await page.getByTestId("calendar-unsubscribe-button").click();
    await page.waitForURL(`**/calendar/${calSlug}`);
    await expect(page.getByTestId("calendar-subscribe-button")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("承認フロー: tier 購読 → pending → owner 承認 → active", async ({
    page,
  }) => {
    // ---- 1. subscriber が承認制 tier で購読リクエスト ----
    await devLogin(page, SUBSCRIBER, { next: `/calendar/${calSlug}` });
    await expect(page.getByTestId("calendar-tiers-section")).toBeVisible();

    const tierSubscribe = page.locator(
      '[data-testid^="calendar-tier-subscribe-"]',
    );
    await expect(tierSubscribe).toHaveCount(1);
    await tierSubscribe.first().click();

    // pending 状態: 案内バナー + 承認待ちバッジ (Subscribe ボタンは消える)
    await page.waitForURL(`**/calendar/${calSlug}?membership=pending`);
    await expect(page.getByTestId("calendar-membership-banner")).toBeVisible();
    await expect(page.getByTestId("calendar-pending-badge")).toBeVisible();
    await expect(page.getByTestId("calendar-subscribe-button")).toHaveCount(0);
    await expect(page.getByTestId("calendar-unsubscribe-button")).toHaveCount(0);

    // ---- 2. owner が manage で承認 ----
    await page.context().clearCookies();
    await devLogin(page, OWNER, { next: `/calendar/${calSlug}/manage` });
    await expect(
      page.getByTestId(`calendar-pending-sub-${SUBSCRIBER}`),
    ).toBeVisible();
    await page.getByTestId(`calendar-approve-sub-${SUBSCRIBER}`).click();
    await page.waitForURL(
      `**/calendar/${calSlug}/manage?notice=subscription-approved`,
    );
    await expect(page.getByTestId("calendar-pending-subs-empty")).toBeVisible();

    // ---- 3. subscriber 側で active (購読中) になっている ----
    await page.context().clearCookies();
    await devLogin(page, SUBSCRIBER, { next: `/calendar/${calSlug}` });
    await expect(page.getByTestId("calendar-unsubscribe-button")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("calendar-pending-badge")).toHaveCount(0);
    // active のみ計上の subscriberCount が 1 になっている
    await expect(page.getByTestId("calendar-subscriber-count")).toContainText(
      "購読者 1 人",
    );
  });
});
