/**
 * Luma 風 timeline view の E2E。
 *
 * 検証:
 *   1. /user/fast_moon_169 → デフォルトで timeline 表示、月見出しが描画される
 *   2. /user/fast_moon_169?view=classic → クラシック UI が出る (タブナビ等)
 *   3. /group/findy?view=timeline → timeline UI で月見出しが出る
 *   4. /group/findy (デフォルト) → classic UI のまま
 *
 * 既存テスト破壊防止:
 *   - dashboard.spec.ts / event-detail.spec.ts は別ページ
 *   - ?view= 指定は新規クエリのため既存テストには影響しない
 */
import { test, expect } from "@playwright/test";

const TIMELINE_USER = "fast_moon_169";
const TIMELINE_GROUP = "findy";

test.describe("ユーザープロフィール timeline view", () => {
  test("デフォルトで timeline view が表示され、月見出しが 2 つ以上ある", async ({
    page,
  }) => {
    await page.goto(`/user/${TIMELINE_USER}`);

    // timeline ビューのコンテナ
    await expect(page.getByTestId("user-timeline-view")).toBeVisible();
    await expect(page.getByTestId("user-timeline-header")).toBeVisible();

    // view 切替トグル
    const toggle = page.getByTestId("user-view-toggle");
    await expect(toggle).toBeVisible();

    // Hosting / Going / Hosted / Materials のセクション見出しが存在
    await expect(
      page.getByRole("heading", { name: /Hosting/ }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /Going/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Hosted/ })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Materials/ }),
    ).toBeVisible();

    // 月見出しが 2 つ以上 (fast_moon_169 は seed で複数月にまたがる主催/参加履歴を持つ)
    const monthHeadings = page.getByTestId("event-timeline-month-heading");
    const count = await monthHeadings.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // 月見出しのテキスト形式 (例: "2026年06月")
    const firstText = (await monthHeadings.first().innerText()).trim();
    expect(firstText).toMatch(/\d{4}年\d{2}月/);
  });

  test("?view=classic で従来タブ表示に切替", async ({ page }) => {
    await page.goto(`/user/${TIMELINE_USER}?view=classic`);

    // classic ビューでは timeline コンテナは出ない
    await expect(page.getByTestId("user-timeline-view")).toHaveCount(0);

    // 従来のタブ ("参加履歴", "主催イベント" 等) が見える
    await expect(page.getByRole("tab", { name: "参加履歴" })).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "主催イベント" }),
    ).toBeVisible();

    // 切替トグル自体は classic でも見える
    await expect(page.getByTestId("user-view-toggle")).toBeVisible();
  });

  test("切替トグルから timeline → classic の往復ができる", async ({
    page,
  }) => {
    await page.goto(`/user/${TIMELINE_USER}`);
    await expect(page.getByTestId("user-timeline-view")).toBeVisible();

    // classic に切替
    await page.getByTestId("user-view-toggle-classic").click();
    await expect(page).toHaveURL(/view=classic/);
    await expect(page.getByRole("tab", { name: "参加履歴" })).toBeVisible();

    // 戻る
    await page.getByTestId("user-view-toggle-timeline").click();
    await expect(page).toHaveURL(/view=timeline/);
    await expect(page.getByTestId("user-timeline-view")).toBeVisible();
  });
});

test.describe("グループ詳細 timeline view", () => {
  test("?view=timeline で月見出し付きタイムラインが描画される", async ({
    page,
  }) => {
    await page.goto(`/group/${TIMELINE_GROUP}?view=timeline`);

    await expect(page.getByTestId("group-timeline-view")).toBeVisible();
    await expect(page.getByTestId("group-timeline-header")).toBeVisible();

    // 都市マップ風プレースホルダ
    await expect(page.getByTestId("group-timeline-map")).toBeVisible();

    // 月見出しが 1 つ以上
    const monthHeadings = page.getByTestId("event-timeline-month-heading");
    expect(await monthHeadings.count()).toBeGreaterThanOrEqual(1);

    // 開催予定 / 過去のイベントの見出し
    await expect(
      page.getByRole("heading", { name: /開催予定のイベント/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /過去のイベント/ }),
    ).toBeVisible();

    // メンバー一覧 (最近の活動順)
    await expect(page.getByTestId("group-timeline-members")).toBeVisible();
  });

  test("デフォルトの /group/findy は classic UI を維持する", async ({
    page,
  }) => {
    await page.goto(`/group/${TIMELINE_GROUP}`);

    // timeline コンテナは出ない
    await expect(page.getByTestId("group-timeline-view")).toHaveCount(0);

    // 既存タブが見える
    await expect(page.getByRole("tab", { name: "開催予定" })).toBeVisible();

    // 切替トグルは見える
    await expect(page.getByTestId("group-view-toggle")).toBeVisible();
  });
});
