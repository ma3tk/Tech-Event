/**
 * 開催前リマインダー cron (`/api/cron/run-reminders`) の smoke E2E。
 *
 * - CRON_SECRET はサーバプロセスの環境変数。CI (`ci.yml` / `e2e-full.yml`) では
 *   `ci-cron-secret` が設定される。ローカルで未設定の場合、route は 503
 *   (cron_disabled) を返すため、テストは環境に応じて分岐する。
 * - 検証項目:
 *    1. secret 無しで叩くと 200 にならない (401 = 不一致 / 503 = 未設定)
 *    2. 誤った secret でも 200 にならない
 *    3. 正しい secret (process.env.CRON_SECRET が既知のとき) なら 200 で
 *       件数レポート (`created` / `skipped` / `errors`) を返す
 *    4. 同一 secret で 2 回叩いても 2 回目は新規作成 0 (冪等性 — Notification 行での dedup)
 */
import path from "node:path";
import Database from "better-sqlite3";
import { test, expect } from "@playwright/test";

const CRON_PATH = "/api/cron/run-reminders";
// _helpers/auth.ts と同じ解決方法 (apps/web-e2e/src → apps/web/dev.db)
const DEV_DB_PATH = path.resolve(__dirname, "../../web/dev.db");
// playwright.config.ts の webServer は process.env をそのまま継承するため、
// テストプロセスから見える CRON_SECRET = サーバ側 CRON_SECRET。
const CRON_SECRET = process.env.CRON_SECRET;

test.describe("cron: /api/cron/run-reminders", () => {
  test("secret 無しでは 200 を返さない (401 or 503)", async ({ request }) => {
    const res = await request.get(CRON_PATH);
    expect([401, 503]).toContain(res.status());
    const body = await res.json();
    expect(["unauthorized", "cron_disabled"]).toContain(body.error);
  });

  test("誤った secret では 200 を返さない (401 or 503)", async ({ request }) => {
    const res = await request.get(
      `${CRON_PATH}?secret=definitely-wrong-secret`,
    );
    expect([401, 503]).toContain(res.status());
  });

  test("正しい secret なら 200 で件数レポートを返す", async ({ request }) => {
    test.skip(!CRON_SECRET, "CRON_SECRET 未設定環境では skip (route は 503)");

    const res = await request.get(
      `${CRON_PATH}?secret=${encodeURIComponent(CRON_SECRET ?? "")}`,
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.mode === "queued" || body.mode === "inline").toBe(true);
    expect(typeof body.created).toBe("number");
    expect(typeof body.skipped).toBe("number");
    expect(Array.isArray(body.errors)).toBe(true);
    expect(body.errors).toHaveLength(0);
  });

  test("2 回連続で叩いても冪等 (同一 user×event×kind の重複行が出来ない)", async ({
    request,
  }) => {
    test.skip(!CRON_SECRET, "CRON_SECRET 未設定環境では skip (route は 503)");

    const url = `${CRON_PATH}?secret=${encodeURIComponent(CRON_SECRET ?? "")}`;
    const first = await request.get(url);
    expect(first.status()).toBe(200);

    const second = await request.get(url);
    expect(second.status()).toBe(200);
    const body = await second.json();
    expect(body.errors).toHaveLength(0);

    // 冪等性の本質的な不変条件を DB レベルで検証する:
    // (recipientUserId, eventId, kind) が重複する reminder 行は存在してはならない。
    // (`created === 0` の比較は、並走する他 spec が新しい accepted 参加者を
    //  作ると flake するため、重複ゼロ検証に置き換えている)
    const db = new Database(DEV_DB_PATH, { readonly: true });
    try {
      const dup = db
        .prepare(
          `SELECT recipientUserId, eventId, kind, COUNT(*) AS c
             FROM notifications
            WHERE kind IN ('reminder_24h', 'reminder_1h')
            GROUP BY recipientUserId, eventId, kind
           HAVING c > 1`,
        )
        .all();
      expect(dup).toHaveLength(0);
    } finally {
      db.close();
    }
  });
});
