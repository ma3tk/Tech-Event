/**
 * Magic Link ログインの E2E。
 *
 * シナリオ:
 *   1. POST /api/auth/magic-link/request にメールアドレスを送る
 *      → 200 + {ok: true} を確認
 *   2. SQLite (`dev.db`) から該当 email の最新トークンを直接取得
 *      (実環境ではメール経由でユーザがリンクを踏むが、E2E では DB を直接見る)
 *   3. GET /api/auth/magic-link/verify?token=... を叩く
 *      → te_session cookie が発行され /dashboard へリダイレクトされる
 *
 * NOTE: `better-sqlite3` を直接使ってトークンを取得する。これは
 *   tech-event のメインアプリと同じ DB ファイルを参照している前提。
 */
import path from "node:path";
import Database from "better-sqlite3";
import { test, expect } from "@playwright/test";

// Nx 化で e2e は apps/web-e2e/ に切り出されたが、dev.db は apps/web/ にある。
// __dirname (apps/web-e2e/src) を基準に絶対パスで解決する。
const DB_PATH = path.resolve(__dirname, "../../web/dev.db");

type TokenRow = { id: string; email: string; expiresAt: number; usedAt: number | null };

function fetchLatestToken(email: string): TokenRow | undefined {
  const db = new Database(DB_PATH, { readonly: true });
  try {
    const row = db
      .prepare(
        `SELECT id, email, expiresAt, usedAt FROM magic_link_tokens WHERE email = ? ORDER BY createdAt DESC LIMIT 1`,
      )
      .get(email) as TokenRow | undefined;
    return row;
  } finally {
    db.close();
  }
}

test.describe("Magic Link ログイン", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("ログインページに Magic Link フォームが表示される", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByTestId("magic-link-section")).toBeVisible();
    await expect(page.getByTestId("magic-link-email")).toBeVisible();
    await expect(page.getByTestId("magic-link-submit")).toBeVisible();

    // 既存のメール+パスワードフォームも残っていること
    await expect(page.getByLabel("パスワード")).toBeVisible();
    // 既存の dev-login セクションも残っていること
    await expect(page.getByTestId("dev-login-section")).toBeVisible();
  });

  test("リクエスト → DB 経由でトークン取得 → 検証 → セッション発行", async ({
    request,
    page,
    context,
  }) => {
    const email = `magic-${Date.now()}@example.com`;

    // 1. リクエスト
    const reqRes = await request.post("/api/auth/magic-link/request", {
      data: { email },
      headers: { "Content-Type": "application/json" },
    });
    expect(reqRes.status()).toBe(200);
    const body = await reqRes.json();
    expect(body.ok).toBe(true);
    expect(body.message).toBe("メールを送信しました");

    // 2. DB から token を取得
    const row = fetchLatestToken(email);
    expect(row, "token row not found").toBeTruthy();
    expect(row!.email).toBe(email);
    expect(row!.usedAt).toBeNull();

    // 3. verify (リダイレクトに従う)
    const response = await page.goto(
      `/api/auth/magic-link/verify?token=${row!.id}`,
      { waitUntil: "domcontentloaded" },
    );
    expect(response).not.toBeNull();
    // dashboard にリダイレクト
    await expect(page).toHaveURL(/\/dashboard/);

    // 4. te_session cookie が発行されたこと
    const cookies = await context.cookies();
    const session = cookies.find((c) => c.name === "te_session");
    expect(session, "session cookie missing").toBeTruthy();
    expect(session!.value.length).toBeGreaterThan(0);
  });

  test("不正なトークンは 400 を返す", async ({ request }) => {
    const res = await request.get(
      "/api/auth/magic-link/verify?token=not-a-uuid",
    );
    expect(res.status()).toBe(400);
  });

  test("不正なメール形式は 400 を返す", async ({ request }) => {
    const res = await request.post("/api/auth/magic-link/request", {
      data: { email: "not-an-email" },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(400);
  });
});
