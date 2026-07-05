/**
 * グループブラックリスト管理 + イベントタグ付与 E2E
 *
 * 前提:
 *   - dev サーバが http://localhost:3000 で起動済み (webServer 設定で自動起動)
 *   - 専用ユーザー `test_user` (prisma/seed-test-user.ts) でログインする
 *   - BL 対象にはシード固定ユーザー `fast_moon_169` (id=1) を使う
 *
 * 検証:
 *   1. グループ作成 → /group/<subdomain>/admin/blacklist でユーザー追加 → 一覧表示 → 解除
 *   2. イベント作成時にタグを付与 → /explore?tag=<slug> で絞り込みヒット
 *      → 編集ページでタグを変更 → 新タグで絞り込みヒット / 旧タグは 0 件
 */
import { test, expect, type Page } from "@playwright/test";
import { devLogin } from "./_helpers/auth";

const DEV_USER = "test_user";
const BLACKLIST_TARGET = "fast_moon_169";

/** ランダムな subdomain を生成 (3-63 文字, [a-z0-9-]) */
function randomSubdomain(): string {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 6);
  return `bt-${ts}-${rnd}`.toLowerCase().replace(/[^a-z0-9-]/g, "");
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

/** test_user でログインしてグループを 1 つ作成し、subdomain を返す */
async function createGroup(page: Page, subdomain: string): Promise<void> {
  await devLogin(page, DEV_USER, { next: "/group/create", skipWaitForUrl: true });
  await page.waitForURL(/\/group\/create/);
  await expect(page.getByTestId("group-create-form")).toBeVisible();

  await page.locator("input#subdomain").fill(subdomain);
  await page.locator("input#name").fill(`BL/Tag E2E Group ${subdomain}`);

  await Promise.all([
    page.waitForURL(new RegExp(`/group/${subdomain}$`)),
    page.getByTestId("group-create-submit").click(),
  ]);
}

test.describe("グループブラックリスト管理", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("BL 追加 → 一覧に表示 → 解除で空に戻る", async ({ page }) => {
    test.setTimeout(90_000);
    const subdomain = randomSubdomain();
    await createGroup(page, subdomain);

    // ============ 1. BL 管理ページを開く (初期は空) ============
    await page.goto(`/group/${subdomain}/admin/blacklist`);
    await expect(page.getByTestId("group-blacklist-heading")).toBeVisible();
    await expect(page.getByTestId("group-blacklist-heading")).toContainText(
      "0人",
    );
    await expect(page.getByTestId("blacklist-empty")).toBeVisible();

    // ============ 2. fast_moon_169 を追加 ============
    await page.getByTestId("blacklist-add-nickname").fill(BLACKLIST_TARGET);
    await page
      .getByTestId("blacklist-add-reason")
      .fill("E2E テスト用の登録です");
    await Promise.all([
      page.waitForURL(/toast=blacklist-added/),
      page.getByTestId("blacklist-add-submit").click(),
    ]);

    await expect(page.getByTestId("blacklist-toast")).toBeVisible();
    const row = page.getByTestId(`blacklist-row-${BLACKLIST_TARGET}`);
    await expect(row).toBeVisible();
    await expect(row).toContainText(`@${BLACKLIST_TARGET}`);
    await expect(row).toContainText("E2E テスト用の登録です");
    await expect(page.getByTestId("group-blacklist-heading")).toContainText(
      "1人",
    );

    // ============ 3. 解除 → 空状態に戻る ============
    await Promise.all([
      page.waitForURL(/toast=blacklist-removed/),
      page.getByTestId(`blacklist-remove-${BLACKLIST_TARGET}`).click(),
    ]);
    await expect(page.getByTestId("blacklist-empty")).toBeVisible();
    await expect(page.getByTestId("group-blacklist-heading")).toContainText(
      "0人",
    );
  });
});

test.describe("イベントタグ付与 → /explore タグ絞り込み", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("作成時にタグ付与 → explore でヒット → 編集でタグ変更 → 反映", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const subdomain = randomSubdomain();
    const uniq = `${Date.now().toString(36)}${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    // タグ名 = slug になる形式 (小文字英数字 + ハイフン) にして
    // /explore?tag=<slug> で直接絞り込めるようにする
    const tagA = `e2e-tag-a-${uniq}`;
    const tagB = `e2e-tag-b-${uniq}`;
    const eventTitle = `BL/Tag E2E Event ${uniq}`;

    await createGroup(page, subdomain);

    // ============ 1. タグ付きでイベント作成 → 公開 ============
    await page.goto(`/event/create?group=${subdomain}`);
    await expect(page.getByTestId("event-create-form")).toBeVisible();

    await page.locator("input#title").fill(eventTitle);
    await page.locator("input#startedAt").fill(plusDaysLocal(7, 19, 0));
    await page.locator("input#endedAt").fill(plusDaysLocal(7, 21, 0));
    await page.getByTestId("event-tags-input").fill(`${tagA}, React`);

    await Promise.all([
      page.waitForURL(/\/event\/\d+$/),
      page.getByTestId("event-publish").click(),
    ]);
    const eventIdMatch = page.url().match(/\/event\/(\d+)/);
    expect(eventIdMatch).not.toBeNull();
    const eventId = eventIdMatch![1]!;

    // ============ 2. /explore?tag=<tagA> でヒットする ============
    await page.goto(`/explore?tag=${tagA}`);
    await expect(page.locator("#results-heading")).toContainText("該当 1");
    await expect(page.locator("#main")).toContainText(eventTitle);

    // ============ 3. 編集ページでタグを変更 (tagA → tagB) ============
    await page.goto(`/event/${eventId}/edit`);
    await expect(page.getByTestId("event-edit-form")).toBeVisible();
    // 作成時のタグがフォームに復元されている
    await expect(page.getByTestId("event-tags-input")).toHaveValue(
      new RegExp(tagA),
    );
    await page.getByTestId("event-tags-input").fill(tagB);
    await Promise.all([
      page.waitForURL(new RegExp(`/event/${eventId}$`)),
      page.getByTestId("event-edit-save").click(),
    ]);

    // 新タグでヒット
    await page.goto(`/explore?tag=${tagB}`);
    await expect(page.locator("#results-heading")).toContainText("該当 1");
    await expect(page.locator("#main")).toContainText(eventTitle);

    // 旧タグでは 0 件 (紐付け解除が反映されている)
    await page.goto(`/explore?tag=${tagA}`);
    await expect(page.locator("#results-heading")).toContainText("該当 0");
    await expect(page.locator("#main")).not.toContainText(eventTitle);
  });
});
