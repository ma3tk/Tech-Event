/**
 * Web Push 購読の E2E。
 *
 * 1. `/settings/notifications` に Push トグルセクションが表示される。
 *    E2E 環境は `NEXT_PUBLIC_VAPID_PUBLIC_KEY` 未設定のため
 *    「未対応」表示 + ボタン無効 (disabled) になる。
 * 2. `POST /api/push/subscribe` に購読 JSON を投げると PushSubscription が
 *    作成される (201 created)。同一 endpoint の再 POST は upsert (200)。
 *    `POST /api/push/unsubscribe` で `deleted: 1` が返る = DB に行が
 *    実在していたことの検証。未ログインは 401。
 *
 * DB 書き込みがあるため固定ユーザー `test_user` + serial mode を使う
 * (CLAUDE.md §3.4)。endpoint はプロジェクト名 + タイムスタンプで一意化し、
 * desktop / mobile の並列実行でも衝突しない。
 */
import { test, expect } from "@playwright/test";
import { devLoginLegacy as devLogin } from "./_helpers/auth";

const TEST_USER = "test_user";

test.describe.configure({ mode: "serial" });

test.describe("Web Push 購読", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("settings/notifications に Push トグルが表示される (VAPID 未設定時は無効表示)", async ({
    page,
  }) => {
    await devLogin(page, TEST_USER, "/settings/notifications");

    // Push トグルセクションが存在する
    const section = page.getByTestId("push-toggle-section");
    await expect(section).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "ブラウザのプッシュ通知" }),
    ).toBeVisible();

    // E2E 環境は NEXT_PUBLIC_VAPID_PUBLIC_KEY 未設定 → 「未対応」表示
    await expect(page.getByTestId("push-toggle-unavailable")).toBeVisible();
    await expect(page.getByTestId("push-toggle-unavailable")).toContainText(
      "未対応",
    );

    // ボタンは disabled (誤操作でエラーにならない)
    await expect(page.getByTestId("push-toggle")).toBeDisabled();

    // 既存の通知設定 UI (kind × channel の grid) が壊れていないこと
    await expect(
      page.getByTestId("notification-preferences-form"),
    ).toBeVisible();
  });

  test("subscribe route に購読 JSON を POST すると PushSubscription が作成される", async ({
    page,
  }) => {
    await devLogin(page, TEST_USER, "/settings/notifications");

    // 一意な endpoint (desktop / mobile の並列実行でも衝突しない)
    const endpoint = `https://push.example.com/e2e/${test.info().project.name}-${Date.now()}`;
    const subscriptionJson = {
      endpoint,
      expirationTime: null,
      keys: {
        p256dh: "BE2E-test-p256dh-key-base64url",
        auth: "e2e-test-auth-secret",
      },
    };

    // 新規作成 → 201 { ok: true, created: true }
    const createRes = await page.request.post("/api/push/subscribe", {
      data: subscriptionJson,
    });
    expect(createRes.status()).toBe(201);
    const created = (await createRes.json()) as {
      ok: boolean;
      created: boolean;
    };
    expect(created.ok).toBe(true);
    expect(created.created).toBe(true);

    // 同一 endpoint の再 POST は upsert → 200 { created: false }
    const upsertRes = await page.request.post("/api/push/subscribe", {
      data: subscriptionJson,
    });
    expect(upsertRes.status()).toBe(200);
    const upserted = (await upsertRes.json()) as {
      ok: boolean;
      created: boolean;
    };
    expect(upserted.ok).toBe(true);
    expect(upserted.created).toBe(false);

    // unsubscribe で deleted=1 → DB に行が実在していたことの検証 + 後片付け
    const deleteRes = await page.request.post("/api/push/unsubscribe", {
      data: { endpoint },
    });
    expect(deleteRes.status()).toBe(200);
    const deleted = (await deleteRes.json()) as {
      ok: boolean;
      deleted: number;
    };
    expect(deleted.ok).toBe(true);
    expect(deleted.deleted).toBe(1);
  });

  test("未ログインの subscribe POST は 401", async ({ page }) => {
    const res = await page.request.post("/api/push/subscribe", {
      data: {
        endpoint: "https://push.example.com/e2e/unauthorized",
        keys: { p256dh: "x", auth: "y" },
      },
    });
    expect(res.status()).toBe(401);
  });
});
