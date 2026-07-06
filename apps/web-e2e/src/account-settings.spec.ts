/**
 * アカウント設定まわりの E2E。
 *
 * 対象:
 *   1. パスワードリセット要求 (`/account/password_reset`)
 *      - フォーム送信で「メールを送信しました」が出る (enumeration 対策で常に成功表示)
 *   2. パスワードリセット実行 (`/account/password_reset/[token]`)
 *      - DB に直接ユーザー + トークン (sha256 ハッシュ) を投入し、
 *        新パスワード設定 → /login?reset=1 → 新パスワードでログインまで確認
 *   3. プロフィール編集 (`/settings/profile`)
 *      - dev-login (`test_user`) で bio / 所属を更新し、保存メッセージと反映を確認
 *   4. 退会確認 (`/account/withdraw`)
 *      - 専用に投入したユーザーで確認ページ → 同意 → 実行 → セッション破棄を確認
 *
 * DB 直接操作は magic-link.spec.ts / stripe-payment.spec.ts と同じ better-sqlite3
 * パターン。global-teardown が baseline を復元するため、投入したユーザーは残らない。
 * fullyParallel 前提のため、各テストは専用データで自己完結させる
 * (test_user のプロフィール編集も nickname / displayName は変更しない)。
 */
import { createHash } from "node:crypto";
import path from "node:path";
import Database from "better-sqlite3";
import { test, expect } from "@playwright/test";

import { devLogin, loginByCookie } from "./_helpers/auth";

const DB_PATH = path.resolve(__dirname, "../../web/dev.db");

/** dev.db にテスト専用ユーザーを直接投入する (Prisma は DateTime を epoch ms で保存) */
function insertUser(input: {
  nickname: string;
  email: string;
}): { id: bigint } {
  const db = new Database(DB_PATH);
  try {
    const row = db
      .prepare("SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM users")
      .get() as { nextId: number | bigint };
    const id = BigInt(row.nextId);
    const now = Date.now();
    db.prepare(
      `INSERT INTO users (id, nickname, displayName, email, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 'active', ?, ?)`,
    ).run(id, input.nickname, `E2E ${input.nickname}`, input.email, now, now);
    return { id };
  } finally {
    db.close();
  }
}

/** パスワードリセットトークンを直接投入する (DB には sha256 ハッシュを保存) */
function insertResetToken(userId: bigint, rawToken: string): void {
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const db = new Database(DB_PATH);
  try {
    const row = db
      .prepare(
        "SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM password_reset_tokens",
      )
      .get() as { nextId: number | bigint };
    const now = Date.now();
    db.prepare(
      `INSERT INTO password_reset_tokens (id, userId, tokenHash, expiresAt, usedAt, createdAt)
       VALUES (?, ?, ?, ?, NULL, ?)`,
    ).run(BigInt(row.nextId), userId, tokenHash, now + 60 * 60 * 1000, now);
  } finally {
    db.close();
  }
}

test.describe("パスワードリセット", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("要求フォーム: メール送信完了メッセージが表示される", async ({
    page,
  }) => {
    await page.goto("/account/password_reset");
    await expect(page.getByTestId("password-reset-title")).toBeVisible();

    await page
      .getByTestId("password-reset-email")
      .fill(`pwreset-${Date.now()}@example.com`);
    await page.getByTestId("password-reset-submit").click();

    // enumeration 対策で未登録メールでも常に成功表示
    await expect(page.getByTestId("password-reset-sent")).toBeVisible();
    await expect(page).toHaveURL(/sent=1/);
  });

  test("ログインページからリンクで遷移できる", async ({ page }) => {
    await page.goto("/login");
    await page
      .getByRole("link", { name: "パスワードを忘れた方はこちら" })
      .click();
    await expect(page).toHaveURL(/\/account\/password_reset/);
    await expect(page.getByTestId("password-reset-email")).toBeVisible();
  });

  test("トークンで新パスワードを設定し、新パスワードでログインできる", async ({
    page,
  }) => {
    const stamp = Date.now();
    const email = `pwreset-full-${stamp}@example.com`;
    const { id: userId } = insertUser({
      nickname: `pwreset_${stamp}`,
      email,
    });
    // 生トークンはテスト側で生成し、DB には sha256 ハッシュのみ入れる (実装と同じ方式)
    const rawToken = createHash("sha256")
      .update(`raw-${stamp}`)
      .digest("hex"); // 64 hex 文字ならなんでもよい
    insertResetToken(userId, rawToken);

    const newPassword = `NewPassw0rd-${stamp}`;
    await page.goto(`/account/password_reset/${rawToken}`);
    await expect(page.getByTestId("password-reset-new-title")).toBeVisible();
    await page.getByTestId("password-reset-new-password").fill(newPassword);
    await page
      .getByTestId("password-reset-new-password-confirm")
      .fill(newPassword);
    await page.getByTestId("password-reset-new-submit").click();

    // /login?reset=1 に遷移して完了メッセージ
    await expect(page).toHaveURL(/\/login\?reset=1/);
    await expect(page.getByTestId("login-password-reset-done")).toBeVisible();

    // 新パスワードでログインできる
    // (メール入力欄は magic-link フォームにもあるため、パスワードログインフォームに限定)
    const loginForm = page.locator('form[action="/api/auth/login"]');
    await loginForm.locator('input[name="email"]').fill(email);
    await loginForm.locator('input[name="password"]').fill(newPassword);
    await loginForm.getByRole("button", { name: "ログインする" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("使用済み・不正トークンはエラーを表示する", async ({ page }) => {
    // DB に存在しない 64 hex トークン
    const bogus = "0".repeat(64);
    await page.goto(`/account/password_reset/${bogus}`);
    await page.getByTestId("password-reset-new-password").fill("password123");
    await page
      .getByTestId("password-reset-new-password-confirm")
      .fill("password123");
    await page.getByTestId("password-reset-new-submit").click();

    await expect(page.getByTestId("password-reset-error")).toBeVisible();
    await expect(page.getByTestId("password-reset-error")).toContainText(
      "無効",
    );
  });
});

test.describe("プロフィール編集", () => {
  test("test_user で bio / 所属を更新して保存できる", async ({ page }) => {
    await devLogin(page, "test_user", { next: "/settings/profile" });
    await expect(page.getByTestId("profile-form")).toBeVisible();

    // nickname / displayName は他テストと共有しているため変更しない
    await expect(page.getByTestId("profile-nickname")).toHaveValue(
      "test_user",
    );

    const stamp = Date.now();
    const newBio = `E2E で更新した自己紹介 (${stamp})`;
    const newAffiliation = `E2E株式会社 ${stamp}`;

    // フルスイート並列 (CI) では textarea のハイドレーション完了前に fill が走ると
    // seed 値がクリアされず prepend されて保存されることがある。
    // clear→fill→値確認を toPass でリトライし、ハイドレーション後の安定入力を保証する。
    const fillStable = async (testId: string, value: string): Promise<void> => {
      const loc = page.getByTestId(testId);
      await expect(loc).toBeVisible();
      await expect(async () => {
        await loc.fill("");
        await loc.fill(value);
        await expect(loc).toHaveValue(value, { timeout: 1000 });
      }).toPass({ timeout: 10_000 });
    };
    await fillStable("profile-bio", newBio);
    await fillStable("profile-affiliation", newAffiliation);
    await fillStable("profile-githubAccount", "e2e-octocat");
    await page.getByTestId("profile-save").click();

    // 保存メッセージ + 再表示で値が反映されている
    await expect(page.getByTestId("profile-settings-saved")).toBeVisible();
    await expect(page.getByTestId("profile-bio")).toHaveValue(newBio);
    await expect(page.getByTestId("profile-affiliation")).toHaveValue(
      newAffiliation,
    );
  });

  test("未ログインは /login にリダイレクトされる", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await page.goto("/settings/profile");
    await expect(page).toHaveURL(/\/login\?next=/);
  });

  test("不正なニックネームはエラーメッセージを表示する", async ({ page }) => {
    await devLogin(page, "test_user", { next: "/settings/profile" });
    await expect(page.getByTestId("profile-form")).toBeVisible();

    // 既存 seed ユーザーの nickname と衝突させる (fast_moon_169 は seed 固定)
    await page.getByTestId("profile-nickname").fill("fast_moon_169");
    await page.getByTestId("profile-save").click();

    await expect(page.getByTestId("profile-settings-error")).toBeVisible();
    await expect(page.getByTestId("profile-settings-error")).toContainText(
      "既に使われています",
    );
  });
});

test.describe("退会", () => {
  test("確認ページ → 同意 → 実行でセッションが破棄される", async ({
    page,
    context,
  }) => {
    // 他テストと衝突しないよう専用ユーザーを投入して退会させる
    const stamp = Date.now();
    const nickname = `withdraw_${stamp}`;
    insertUser({ nickname, email: `withdraw-${stamp}@example.com` });

    await loginByCookie(context, nickname);
    await page.goto("/account/withdraw");
    await expect(page.getByTestId("withdraw-title")).toBeVisible();
    await expect(page.getByTestId("withdraw-confirm")).toBeVisible();

    await page.getByTestId("withdraw-confirm").check();
    await page.getByTestId("withdraw-submit").click();

    // /login?withdrawn=1 に遷移して完了メッセージ
    await expect(page).toHaveURL(/\/login\?withdrawn=1/);
    await expect(page.getByTestId("login-withdrawn-done")).toBeVisible();

    // セッションは無効 (認証必須ページは /login に戻される)
    await page.goto("/settings/profile");
    await expect(page).toHaveURL(/\/login\?next=/);

    // 公開プロフィールも非表示 (既存 withdrawn 分岐: notFound)
    // NOTE: dynamic ページの notFound() は streaming で 200 になり得るため
    // HTTP status ではなく 404 コンテンツで検証する
    await page.goto(`/user/${nickname}`);
    await expect(
      page.getByText("ページが見つかりません"),
    ).toBeVisible();
  });

  test("未ログインは /login にリダイレクトされる", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await page.goto("/account/withdraw");
    await expect(page).toHaveURL(/\/login\?next=/);
  });
});
