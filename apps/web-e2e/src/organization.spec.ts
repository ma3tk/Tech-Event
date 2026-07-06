/**
 * Organization (org > calendar > event 階層) の E2E テスト。
 *
 * 検証項目:
 *  1. dev-login (test_user) → /org/create で org 作成 → /org/{slug} が表示される
 *  2. カレンダーを作成 → /org/{slug}/edit で org に割り当て → /org/{slug} に
 *     カレンダーが表示される → 解除で消える (個人カレンダーへの非破壊復帰)
 *
 * 注意:
 *  - DB 状態に依存するため serial mode + 専用ユーザー `test_user` を使う
 *    (fast_moon_169 は視覚回帰テストとデータ干渉するため使わない)
 *  - slug は timestamp + random でテスト毎にユニーク化
 *  - waitForTimeout 禁止 → waitForURL / locator-based 待機のみ
 */
import { test, expect } from "@playwright/test";
import { devLogin } from "./_helpers/auth";

const DEV_USER = "test_user";

/** ランダムな slug を生成 (3-63 文字, [a-z0-9-]) */
function randomSlug(prefix: string): string {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 6);
  return `${prefix}-${ts}-${rnd}`.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

test.describe("Organization 機能", () => {
  test.describe.configure({ mode: "serial" });

  // serial mode 内でテスト間共有する状態
  const orgSlug = randomSlug("te-org");
  const orgName = `E2E Org ${orgSlug}`;
  const calSlug = randomSlug("te-orgcal");
  const calName = `E2E OrgCal ${calSlug}`;

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("org 作成 → /org/{slug} に組織情報が表示される", async ({ page }) => {
    await devLogin(page, DEV_USER, { next: "/org/create" });

    // 作成フォームに入力
    await expect(page.getByTestId("org-create-form")).toBeVisible();
    await page.locator("#slug").fill(orgSlug);
    await page.locator("#name").fill(orgName);
    await page
      .locator("#description")
      .fill("E2E テスト用の Organization です。");
    await page.getByTestId("org-create-submit").click();

    // /org/{slug} に遷移して組織情報が出る
    await page.waitForURL(`**/org/${orgSlug}**`);
    await expect(page.getByTestId("org-name")).toHaveText(orgName);
    await expect(page.getByTestId("org-header")).toBeVisible();
    // カレンダー未割り当てなので空状態
    await expect(page.getByTestId("org-calendars-empty")).toBeVisible();
    // owner なので編集リンクが見える
    await expect(page.getByTestId("org-edit-link")).toBeVisible();
  });

  test("カレンダーを org に割り当て → org ページに表示 → 解除で消える", async ({
    page,
  }) => {
    // ---- 1. 割り当て用カレンダーを作成 ----
    await devLogin(page, DEV_USER, { next: "/calendar/create" });
    await expect(page.getByTestId("calendar-create-form")).toBeVisible();
    await page.locator("#slug").fill(calSlug);
    await page.locator("#name").fill(calName);
    await page.getByTestId("calendar-create-submit").click();
    await page.waitForURL(`**/calendar/${calSlug}**`);
    await expect(page.getByTestId("calendar-name")).toHaveText(calName);

    // ---- 2. org 編集ページで割り当て ----
    await page.goto(`/org/${orgSlug}/edit`);
    await expect(page.getByTestId("org-edit-form")).toBeVisible();
    await expect(
      page.getByTestId(`org-calendar-assign-row-${calSlug}`),
    ).toBeVisible();
    await page.getByTestId(`org-assign-${calSlug}`).click();

    // 割り当て後は同じ編集ページに toast クエリ付きで戻る。
    // 注意: `**/org/{slug}/edit**` は「現在の URL」にも一致して即時 resolve
    // してしまうため、redirect 先に固有の toast クエリまで含めて待つ。
    await page.waitForURL(`**/org/${orgSlug}/edit?toast=org-calendar-updated`);
    await expect(page.getByTestId(`org-unassign-${calSlug}`)).toBeVisible({
      timeout: 15_000,
    });

    // ---- 3. org 公開ページに割り当てたカレンダーが出る ----
    await page.goto(`/org/${orgSlug}`);
    await expect(page.getByTestId("org-calendars")).toBeVisible();
    await expect(
      page.getByTestId(`org-calendar-item-${calSlug}`),
    ).toBeVisible();

    // ---- 4. 解除すると org ページから消える (個人カレンダーへ復帰) ----
    await page.goto(`/org/${orgSlug}/edit`);
    await page.getByTestId(`org-unassign-${calSlug}`).click();
    // 直前の goto はクエリ無し URL なので toast クエリ付き URL への遷移を確実に待てる
    await page.waitForURL(`**/org/${orgSlug}/edit?toast=org-calendar-updated`);
    await expect(page.getByTestId(`org-assign-${calSlug}`)).toBeVisible({
      timeout: 15_000,
    });

    await page.goto(`/org/${orgSlug}`);
    await expect(
      page.getByTestId(`org-calendar-item-${calSlug}`),
    ).toHaveCount(0);

    // 非破壊性: 解除後もカレンダー自体は従来どおり表示できる
    const res = await page.goto(`/calendar/${calSlug}`);
    expect(res?.status()).toBe(200);
    await expect(page.getByTestId("calendar-name")).toHaveText(calName);
  });

  test("存在しない org slug は not-found", async ({ page }) => {
    // notFound() で 404 ステータスを返す一方、ストリーミング後の notFound()
    // ではクライアントフォールバックで not-found 表示になり、初期 HTTP は 200
    // になる場合がある (event-detail.spec.ts と同じ扱い)。
    // どちらでも 404 or 200 + not-found 表示で受け入れる。
    const res = await page.goto(`/org/${randomSlug("te-none")}`);
    const status = res?.status();
    if (status !== 404) {
      expect(status).toBe(200);
      await expect(page.getByTestId("not-found")).toBeVisible();
    }
  });
});
