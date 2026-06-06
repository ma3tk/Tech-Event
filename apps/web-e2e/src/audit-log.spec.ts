/**
 * AuditLog E2E。
 *
 * セキュリティレビュー Medium #31 対応:
 *  - 主要 Server Action / API が `AuditLog` テーブルへ書き込むかを E2E で確認する。
 *
 * 戦略:
 *  - dev-login で `test_user` (E2E 専用) としてログインする (記録 1 件)
 *  - logout する (記録 1 件)
 *  - ログイン前後で AuditLog の行数差をチェック
 *  - SQLite を `better-sqlite3` で直接読み、`actorUserId` 一致の最新行を確認
 *
 * 並列実行で他テストの AuditLog 書き込みが混ざる可能性があるため、actorUserId =
 * test_user に絞って件数差 >= 2 を確認する (login / logout)。
 */
import path from "node:path";
import Database from "better-sqlite3";
import { test, expect } from "@playwright/test";
import { devLogin, DEFAULT_DEV_USER } from "./_helpers/auth";

// Nx 化で e2e は apps/web-e2e/ に切り出されたが、dev.db は apps/web/ にある。
// __dirname (apps/web-e2e/src) を基準に絶対パスで解決する。
const DB_PATH = path.resolve(__dirname, "../../web/dev.db");

type CountRow = { c: number };
type AuditRow = {
  id: number;
  actorUserId: number | null;
  action: string;
  targetType: string;
};

function getUserIdByNickname(nickname: string): number | null {
  const db = new Database(DB_PATH, { readonly: true });
  try {
    const row = db
      .prepare(`SELECT id FROM users WHERE nickname = ?`)
      .get(nickname) as { id: number | bigint } | undefined;
    if (!row) return null;
    return Number(row.id);
  } finally {
    db.close();
  }
}

function countAuditFor(userId: number, sinceId: number): number {
  const db = new Database(DB_PATH, { readonly: true });
  try {
    const row = db
      .prepare(
        `SELECT COUNT(*) as c FROM audit_logs WHERE actorUserId = ? AND id > ?`,
      )
      .get(userId, sinceId) as CountRow | undefined;
    return row?.c ?? 0;
  } finally {
    db.close();
  }
}

function maxAuditId(): number {
  const db = new Database(DB_PATH, { readonly: true });
  try {
    const row = db
      .prepare(`SELECT COALESCE(MAX(id), 0) as c FROM audit_logs`)
      .get() as CountRow | undefined;
    return row?.c ?? 0;
  } finally {
    db.close();
  }
}

function findAuditActions(userId: number, sinceId: number): string[] {
  const db = new Database(DB_PATH, { readonly: true });
  try {
    const rows = db
      .prepare(
        `SELECT id, actorUserId, action, targetType FROM audit_logs WHERE actorUserId = ? AND id > ?`,
      )
      .all(userId, sinceId) as AuditRow[];
    return rows.map((r) => r.action);
  } finally {
    db.close();
  }
}

test.describe("AuditLog", () => {
  test("dev-login → logout で audit_logs に 2 件以上記録される", async ({
    page,
  }) => {
    // 1. test_user の id を取得 (E2E 専用ユーザー)
    const userId =
      getUserIdByNickname("test_user") ?? getUserIdByNickname(DEFAULT_DEV_USER);
    expect(userId, "test_user が seed されていません").toBeTruthy();

    const baseId = maxAuditId();

    // 2. dev-login (login が記録される)
    await devLogin(page, "test_user", { next: "/dashboard" });
    // 監査ログは fire-and-forget で記録されるため、書き込み完了を少し待つ
    await page.waitForTimeout(300);

    // 3. logout は page (= cookie 付きコンテキスト) から POST する
    //    request.post はブラウザの cookie を持たないため、page.request を使う。
    const logoutRes = await page.request.post("/api/auth/logout", {
      data: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    expect(logoutRes.status()).toBe(200);
    await page.waitForTimeout(300);

    // 4. AuditLog の差分を検証
    const newCount = countAuditFor(userId!, baseId);
    const actions = findAuditActions(userId!, baseId);

    // login と logout が少なくとも 1 件ずつ含まれる
    expect(newCount, `期待値 >= 2, 実際 ${newCount} 件`).toBeGreaterThanOrEqual(
      2,
    );
    expect(actions).toContain("login");
    expect(actions).toContain("logout");
  });

  test("ログイン失敗時にも audit_logs に login.failed が記録される", async ({
    request,
  }) => {
    const baseId = maxAuditId();

    // 存在しないメールでログイン試行 → 401
    const res = await request.post("/api/auth/login", {
      data: { email: "audit-nonexistent@example.com", password: "wrong" },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(401);

    // login.failed が記録されているか確認 (actorUserId なし = null)
    const db = new Database(DB_PATH, { readonly: true });
    try {
      const row = db
        .prepare(
          `SELECT COUNT(*) as c FROM audit_logs WHERE id > ? AND action = 'login.failed'`,
        )
        .get(baseId) as CountRow | undefined;
      expect(row?.c ?? 0).toBeGreaterThanOrEqual(1);
    } finally {
      db.close();
    }
  });
});
