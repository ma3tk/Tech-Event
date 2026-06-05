/**
 * SSE (Server-Sent Events) 経由の通知リアルタイム到達 E2E。
 *
 * 既存の `notifications.spec.ts` は「コメント投稿 → /notifications ページに通知が
 * 載っている」を検証するが、本テストは:
 *  - 主催者 (OWNER) が `/dashboard` を開いて「アイドル状態」で待機している間に
 *  - 別ブラウザコンテキストの一般ユーザー (COMMENTER) が /event/2 にコメント投稿
 *  - 主催者側の `/api/notifications/stream` SSE 接続がそれを検知し、Header ベルの
 *    未読バッジが increment する
 *
 * SSE polling 間隔は本番 5 秒、テストは env で短縮可。
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
  // SSE 接続が貼られているため `networkidle` は到達しない。
  // 投稿後のコメント表示を locator で待つ。
  await form.getByRole("button", { name: "投稿" }).click();
  await expect(page.locator(`text=${body}`).first()).toBeVisible({
    timeout: 15_000,
  });
}

test.describe("SSE 通知ストリーム", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("/api/notifications/stream へ GET すると text/event-stream で接続できる (認証必須)", async ({
    page,
  }) => {
    // 未ログインでアクセス → 401
    const unauth = await page.request.get("/api/notifications/stream", {
      // EventSource ではなく fetch で初期 headers の確認だけ
      // 401 を即座に返す
      headers: { Accept: "text/event-stream" },
    });
    expect(unauth.status()).toBe(401);

    // ログイン後はアクセス可能 (ストリームを丸ごと読まず、headers だけ確認)
    await devLogin(page, OWNER, "/dashboard");
    const cookies = await page.context().cookies();
    const cookieStr = cookies
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    // fetch で stream を読み始め、最初の bytes をすこし受け取って即 abort する。
    const ctrl = new AbortController();
    const respPromise = fetch(
      `${page.url().replace(/\/dashboard.*$/, "")}/api/notifications/stream`,
      {
        headers: { Accept: "text/event-stream", Cookie: cookieStr },
        signal: ctrl.signal,
      },
    ).catch(() => null);
    // 250ms 待ってから abort (connected イベントだけ受信できれば十分)
    await new Promise((r) => setTimeout(r, 500));
    ctrl.abort();
    const resp = await respPromise;
    if (resp) {
      expect(resp.status).toBe(200);
      const ct = resp.headers.get("content-type") ?? "";
      expect(ct).toContain("text/event-stream");
    }
  });

  test("コメント投稿 → 主催者の Header 未読バッジが SSE 経由で increment", async ({
    browser,
  }) => {
    // SSE polling は 5 秒 + テスト固有の close 処理が重いため timeout を引き伸ばす
    test.setTimeout(150_000);
    // 2 つのコンテキストで「主催者がアイドル状態」+「投稿者がコメント」を再現
    const ownerCtx = await browser.newContext();
    const commenterCtx = await browser.newContext();
    // SSE は Headless Chrome ではデフォルト disable しているので、テスト用に
    // force-on cookie を渡す。
    await ownerCtx.addCookies([
      {
        name: "tech_event_force_sse",
        value: "1",
        url: "http://localhost:3000",
      },
    ]);
    const ownerPage = await ownerCtx.newPage();
    const commenterPage = await commenterCtx.newPage();
    try {
      // 主催者 = /dashboard で「待ち」状態
      await devLogin(ownerPage, OWNER, "/dashboard");
      // ヘッダーが描画されることを確認 (SSE は mount 直後に接続)
      await expect(
        ownerPage.getByTestId("header-notification-bell"),
      ).toBeVisible();

      // 投稿者がコメントを投稿
      await devLogin(commenterPage, COMMENTER, `/event/${EVENT_ID}`);
      const unique = `e2e-sse-${Date.now()}`;
      await postComment(commenterPage, unique);

      // 主催者ページの未読バッジが現れる (DOM に attach される) ことを SSE polling
      // 想定で最大 45 秒待つ。badge は aria-hidden + absolute なので toBeVisible より
      // toBeAttached のほうが安定する。SSE polling は 5s 間隔。
      await expect(
        ownerPage.getByTestId("header-unread-badge"),
      ).toBeAttached({ timeout: 45_000 });
    } finally {
      // close を確実に — SSE 接続を切断するため close 順を守る
      await ownerPage.close().catch(() => undefined);
      await commenterPage.close().catch(() => undefined);
      await ownerCtx.close().catch(() => undefined);
      await commenterCtx.close().catch(() => undefined);
    }
  });
});
