/**
 * タグフォロー / 関連タグ / タグ詳細ページの E2E。
 *
 * カバレッジ:
 *  1. 未ログイン: タグ詳細のフォローボタンが /login 誘導リンクになる
 *  2. タグ詳細に関連タグ (EventTag 共起) が表示され、クリックで遷移できる
 *  3. /explore?tag= のタグフォロー導線が表示される
 *  4. フォロー → /following/tags に表示 → 解除 → 一覧から消える (dev-login: test_user)
 *
 * 実装ノート:
 *  - `test_user` (seed-test-user.ts の E2E 固定ユーザー) を使い、seed ユーザー
 *    (fast_moon_169 等) のフォロー状態を汚さない。
 *  - フォロー状態は同一ユーザーで共有されるため serial mode で実行。
 *  - フォローボタンは ActionForm ("use client") の submit。hydration race による
 *    dead-click を吸収するため clickUntil (locator-based リトライ) を使う
 *    (waitForTimeout 禁止 — CLAUDE.md §3.1 / §6.4)。
 */
import { test, expect, type Page } from "@playwright/test";
import { devLogin } from "./_helpers/auth";
import { clickUntil } from "./_helpers/actions";

// seed 済みタグ (TAGS_SEED): Python は 9 件の公開イベントに付いていて、
// AI / 機械学習 等との共起があるため関連タグ表示の検証に使える。
const TAG_SLUG = "python";
const TAG_NAME = "Python";

// test_user のフォロー状態をテスト間で共有するため serial で実行する。
test.describe.configure({ mode: "serial" });

/** タグ詳細ページでフォロー解除済み状態に整地する (ログイン済み前提) */
async function ensureUnfollowed(page: Page): Promise<void> {
  await page.goto(`/tag/${TAG_SLUG}`, { waitUntil: "domcontentloaded" });
  const btn = page.getByTestId("tag-follow-button");
  await expect(btn).toBeVisible();
  if ((await btn.getAttribute("data-following")) === "false") return;
  await clickUntil(btn, async () => {
    await expect(page.getByTestId("tag-follow-button")).toHaveAttribute(
      "data-following",
      "false",
    );
  });
}

test.describe("タグフォロー", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("未ログイン: タグ詳細のフォローボタンは /login 誘導リンク", async ({
    page,
  }) => {
    await page.goto(`/tag/${TAG_SLUG}`, { waitUntil: "domcontentloaded" });

    // ヘッダー (タグ名 + フォロワー数) が表示される
    const header = page.getByTestId("tag-header");
    await expect(header).toBeVisible();
    await expect(header).toContainText(TAG_NAME);
    await expect(page.getByTestId("tag-follower-count")).toBeVisible();

    // フォローボタンはログイン誘導リンク (next=/tag/{slug})
    const loginLink = page.getByTestId("tag-follow-button-login");
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute(
      "href",
      /\/login\?next=%2Ftag%2Fpython/,
    );
  });

  test("タグ詳細に関連タグ (共起タグ) が表示され、クリックで遷移できる", async ({
    page,
  }) => {
    await page.goto(`/tag/${TAG_SLUG}`, { waitUntil: "domcontentloaded" });

    const related = page.getByTestId("related-tags");
    await expect(related).toBeVisible();
    await expect(related).toContainText("関連タグ");

    // 共起タグチップが 1 件以上あり、リンク先は /tag/{slug}
    const chips = related.locator('a[href^="/tag/"]');
    expect(await chips.count()).toBeGreaterThan(0);

    // 先頭の関連タグをクリックすると別のタグ詳細ページに遷移する
    await chips.first().click();
    await expect(page).toHaveURL(/\/tag\/(?!python$).+/);
    await expect(page.getByTestId("tag-header")).toBeVisible();
  });

  test("/explore?tag= にタグフォロー導線が表示される", async ({ page }) => {
    await page.goto(`/explore?tag=${TAG_SLUG}`, {
      waitUntil: "domcontentloaded",
    });

    const cta = page.getByTestId("explore-tag-follow");
    await expect(cta).toBeVisible();
    await expect(cta).toContainText(TAG_NAME);
    await expect(cta).toContainText("フォロワー");

    // タグページへのリンクからタグ詳細に遷移できる
    await cta.getByRole("link", { name: "タグページへ →" }).click();
    await expect(page).toHaveURL(new RegExp(`/tag/${TAG_SLUG}$`));
    await expect(page.getByTestId("tag-header")).toContainText(TAG_NAME);
  });

  test("フォロー → /following/tags に表示 → 解除で一覧から消える", async ({
    page,
  }) => {
    await devLogin(page, "test_user", { next: `/tag/${TAG_SLUG}` });

    // 前回実行の残骸があっても通るように未フォロー状態に整地
    await ensureUnfollowed(page);

    // フォロー: data-following が true に切り替わるまで待つ
    await clickUntil(page.getByTestId("tag-follow-button"), async () => {
      await expect(page.getByTestId("tag-follow-button")).toHaveAttribute(
        "data-following",
        "true",
      );
    });

    // フォロー中一覧に出る
    await page.goto("/following/tags", { waitUntil: "domcontentloaded" });
    const item = page.locator(
      `[data-testid="followed-tag-item"][data-tag-slug="${TAG_SLUG}"]`,
    );
    await expect(item).toBeVisible();
    await expect(item).toContainText(TAG_NAME);

    // 解除: 一覧から消えるまで待つ
    await clickUntil(item.getByTestId("followed-tag-unfollow"), async () => {
      await expect(
        page.locator(
          `[data-testid="followed-tag-item"][data-tag-slug="${TAG_SLUG}"]`,
        ),
      ).toHaveCount(0);
    });

    // タグ詳細に戻っても未フォロー状態
    await page.goto(`/tag/${TAG_SLUG}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("tag-follow-button")).toHaveAttribute(
      "data-following",
      "false",
    );
  });
});
