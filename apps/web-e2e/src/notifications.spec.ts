/**
 * 通知センター (`/notifications`) の E2E。
 *
 * シナリオ:
 *  1. fast_moon_169 (user1) で /event/2 (owner = calm_owl_42) にコメント投稿。
 *     → 主催者 calm_owl_42 宛にサイト内通知が作成される。
 *  2. calm_owl_42 でログインし直す。
 *  3. /notifications を開き、投稿したコメントの抜粋が含まれる通知行を確認。
 *  4. 行の「既読にする」を押すと、対象行が既読 (data-unread="false") になる。
 *  5. もう 1 件コメントを増やしてから「すべて既読にする」で全行が既読化されることを確認。
 *
 * 前提: dev サーバ稼働中。シードユーザー / event id=2 が存在する。
 */
import { test, expect, type Page } from "@playwright/test";
import { devLoginLegacy as devLogin } from "./_helpers/auth";

const COMMENTER = "fast_moon_169"; // user 1
const OWNER = "calm_owl_42"; // user 2 (owner of event 2)
const EVENT_ID = "2";

async function postComment(page: Page, body: string): Promise<void> {
  const form = page.getByTestId("comment-post-form");
  await expect(form).toBeVisible();
  await form.locator("textarea[name=body]").fill(body);
  await form.getByRole("button", { name: "投稿" }).click();
  await page.waitForLoadState("networkidle");
  await expect(page.locator(`text=${body}`).first()).toBeVisible();
}

test.describe("通知センター", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("コメントで生成された通知を主催者が確認 → 個別既読 → 一括既読", async ({
    page,
    context,
  }) => {
    // 1) コメンタとしてログインしてコメント投稿
    await devLogin(page, COMMENTER, `/event/${EVENT_ID}`);
    const unique1 = `e2e-notif-${Date.now()}-1`;
    await postComment(page, unique1);

    // 2) 主催者でログインし直し
    await context.clearCookies();
    await devLogin(page, OWNER, "/notifications");

    // 3) コメントの抜粋を含む通知行が見える
    await expect(page.getByTestId("notifications-list")).toBeVisible();
    const targetRow = page
      .getByTestId("notifications-row")
      .filter({ hasText: unique1 })
      .first();
    await expect(targetRow).toBeVisible();
    await expect(targetRow).toHaveAttribute("data-unread", "true");

    // 4) その行の「既読にする」で既読化
    await targetRow.getByTestId("notifications-mark-read").click();
    await page.waitForLoadState("networkidle");

    const readRow = page
      .getByTestId("notifications-row")
      .filter({ hasText: unique1 })
      .first();
    await expect(readRow).toBeVisible();
    await expect(readRow).toHaveAttribute("data-unread", "false");

    // 5) もう 1 件コメント → 主催者で再度未読が生まれることを確認 → 一括既読
    await context.clearCookies();
    await devLogin(page, COMMENTER, `/event/${EVENT_ID}`);
    const unique2 = `e2e-notif-${Date.now()}-2`;
    await postComment(page, unique2);

    await context.clearCookies();
    await devLogin(page, OWNER, "/notifications");

    // 未読がある状態なので「すべて既読にする」ボタンが表示される
    const markAll = page.getByTestId("notifications-mark-all-read");
    await expect(markAll).toBeVisible();
    await markAll.click();
    await page.waitForLoadState("networkidle");

    // すべての行が data-unread="false" になっている (1 件以上ある場合)
    const rows = page.getByTestId("notifications-row");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toHaveAttribute("data-unread", "false");
    }

    // 「すべて既読にする」ボタンも消えている
    await expect(
      page.getByTestId("notifications-mark-all-read"),
    ).toHaveCount(0);
  });

  test("未ログインで /notifications にアクセスすると /login にリダイレクト", async ({
    page,
  }) => {
    await page.goto("/notifications");
    await expect(page).toHaveURL(/\/login/);
  });
});
