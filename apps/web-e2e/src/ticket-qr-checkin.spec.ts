/**
 * チケット QR + QR チェックイン E2E。
 *
 * 対象:
 *   - `/event/[id]/ticket`  — 参加者本人のチケット QR (署名付きトークン) 表示
 *   - `/event/[id]/admin/check-in` — QR スキャナセクション (手動入力フォールバック経由で
 *     `checkInByQrToken` の署名検証 → チェックインを検証)
 *
 * カメラ (getUserMedia + BarcodeDetector) は E2E 実機不可のため、
 * スキャナが検出トークンを渡すのと同一の Server Action 経路である
 * 「手動入力フォールバック」で署名トークンの受理 / 改ざん拒否を検証する。
 *
 * トークン形式 (libs/web/feature-event/src/checkin-actions.ts と一致):
 *   `<participantId>.<base64url(HMAC-SHA256("qr-checkin.v1." + participantId, AUTH_SECRET))>`
 *
 * 前提 / 隔離:
 *   - 固定ユーザー `test_user` を使用 (dev-login)。
 *   - 対象イベントは id=13 (他 spec 未使用)。participant 行 / group_admins 行は
 *     spec 内で dev.db に直接 insert し、afterAll で削除して原状復帰する
 *     (participant-transactional.spec.ts / payment-refund-coupon.spec.ts と同パターン)。
 *   - 固定ユーザーの状態を変更するため serial + desktop のみで実行。
 */
import { createHmac } from "node:crypto";
import path from "node:path";
import Database from "better-sqlite3";
import { test, expect, type Locator } from "@playwright/test";
import { devLoginLegacy as devLogin } from "./_helpers/auth";

const USER = "test_user";
const EVENT_ID = 13; // seed: "Tech Talk: セキュリティ の現在地" (groupId=5, allowQrCheckIn=1)

const DB_PATH = path.resolve(__dirname, "../../web/dev.db");

/* ============================================================
 * dev.db helpers
 * ============================================================ */

function withDb<T>(fn: (db: InstanceType<typeof Database>) => T): T {
  const db = new Database(DB_PATH);
  try {
    return fn(db);
  } finally {
    db.close();
  }
}

function resolveUserId(nickname: string): number {
  return withDb((db) => {
    const row = db
      .prepare(`SELECT id FROM users WHERE nickname = ?`)
      .get(nickname) as { id: number } | undefined;
    if (!row) throw new Error(`user not found in dev.db: ${nickname}`);
    return row.id;
  });
}

function getEventGroupId(eventId: number): number {
  return withDb((db) => {
    const row = db
      .prepare(`SELECT groupId FROM events WHERE id = ?`)
      .get(eventId) as { groupId: number } | undefined;
    if (!row) throw new Error(`event not found in dev.db: ${eventId}`);
    return row.groupId;
  });
}

/**
 * test_user を EVENT_ID の accepted 参加者として登録し participantId を返す (冪等)。
 * 既存行があれば accepted に戻して再利用する。
 */
function ensureAcceptedParticipant(eventId: number, userId: number): number {
  return withDb((db) => {
    const existing = db
      .prepare(
        `SELECT id FROM participants WHERE eventId = ? AND userId = ? LIMIT 1`,
      )
      .get(eventId, userId) as { id: number } | undefined;
    if (existing) {
      db.prepare(
        `UPDATE participants SET status = 'accepted', checkInAt = NULL, checkInMethod = NULL WHERE id = ?`,
      ).run(existing.id);
      return existing.id;
    }
    const role = db
      .prepare(
        `SELECT id FROM event_roles WHERE eventId = ? ORDER BY displayOrder ASC LIMIT 1`,
      )
      .get(eventId) as { id: number } | undefined;
    if (!role) throw new Error(`event_roles not found for event ${eventId}`);
    const now = new Date().toISOString();
    // 他 spec / アプリ側の join と id 採番が競合し得るので UNIQUE 失敗時はずらして retry
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const maxRow = db
        .prepare(`SELECT IFNULL(MAX(id), 0) AS maxId FROM participants`)
        .get() as { maxId: number };
      const id = maxRow.maxId + 1 + attempt;
      try {
        db.prepare(
          `INSERT INTO participants
             (id, eventId, eventRoleId, userId, status, nominated, appliedAt, acceptedAt, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, 'accepted', 0, ?, ?, ?, ?)`,
        ).run(id, eventId, role.id, userId, now, now, now, now);
        return id;
      } catch (e) {
        lastError = e;
      }
    }
    throw new Error(`participant insert failed after retries: ${lastError}`);
  });
}

function removeParticipant(eventId: number, userId: number): void {
  withDb((db) => {
    db.prepare(
      `DELETE FROM participants WHERE eventId = ? AND userId = ?`,
    ).run(eventId, userId);
  });
}

/** test_user をイベントのグループ管理者に一時追加 (冪等)。 */
function ensureGroupAdmin(groupId: number, userId: number): void {
  withDb((db) => {
    const existing = db
      .prepare(
        `SELECT id FROM group_admins WHERE groupId = ? AND userId = ? LIMIT 1`,
      )
      .get(groupId, userId) as { id: number } | undefined;
    if (existing) return;
    const maxRow = db
      .prepare(`SELECT IFNULL(MAX(id), 0) AS maxId FROM group_admins`)
      .get() as { maxId: number };
    db.prepare(
      `INSERT INTO group_admins (id, groupId, userId, role, addedAt)
       VALUES (?, ?, ?, 'admin', datetime('now'))`,
    ).run(maxRow.maxId + 1, groupId, userId);
  });
}

function removeGroupAdmin(groupId: number, userId: number): void {
  withDb((db) => {
    db.prepare(
      `DELETE FROM group_admins WHERE groupId = ? AND userId = ?`,
    ).run(groupId, userId);
  });
}

function fetchParticipantRow(participantId: number): {
  status: string;
  checkInMethod: string | null;
} | null {
  return withDb((db) => {
    const row = db
      .prepare(
        `SELECT status, checkInMethod FROM participants WHERE id = ?`,
      )
      .get(participantId) as
      | { status: string; checkInMethod: string | null }
      | undefined;
    return row ?? null;
  });
}

/* ============================================================
 * QR トークン (checkin-actions.ts の signQrParticipantId と同一形式)
 * ============================================================ */

function base64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function buildQrToken(participantId: number): string {
  // util-auth-session の getSessionSecret() fallback と一致させる (dev / E2E 環境)
  const secret = process.env.AUTH_SECRET ?? "dev-auth-secret-please-change";
  const idStr = String(participantId);
  const sig = base64url(
    createHmac("sha256", secret).update(`qr-checkin.v1.${idStr}`).digest(),
  );
  return `${idStr}.${sig}`;
}

/** 署名末尾 1 文字を書き換えた改ざんトークン */
function tamperToken(token: string): string {
  const last = token.slice(-1);
  return token.slice(0, -1) + (last === "A" ? "B" : "A");
}

/**
 * 手動入力フォームにトークンを入力して submit する。
 *
 * 手動入力は React controlled input のため、hydration 前に fill すると
 * state に反映されず submit ボタンが disabled のままになる。
 * 「fill → submit が enabled になる」まで retry して hydration race を吸収する
 * (locator-based 待機、waitForTimeout 不使用)。
 */
async function submitManualToken(
  input: Locator,
  submit: Locator,
  token: string,
): Promise<void> {
  await expect(async () => {
    await input.fill(token);
    await expect(submit).toBeEnabled({ timeout: 1_000 });
  }).toPass({ timeout: 20_000 });
  await submit.click();
}

/* ============================================================
 * tests
 * ============================================================ */

// 固定ユーザー (test_user) の participant / group_admins 状態を変更するため serial 固定
test.describe.configure({ mode: "serial" });

test.describe("チケット QR + QR チェックイン", () => {
  let userId: number;
  let groupId: number;
  let participantId: number;
  /** desktop で実際にセットアップした場合のみ afterAll で掃除する */
  let didSetup = false;

  test.beforeAll(() => {
    userId = resolveUserId(USER);
    groupId = getEventGroupId(EVENT_ID);
  });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name === "chromium-mobile",
      "固定ユーザー (test_user) の状態を変更するため desktop のみで実行 (participant-transactional と同方式)",
    );
    await context.clearCookies();
    // retry / 前回 run の残骸を掃除して冪等にする
    participantId = ensureAcceptedParticipant(EVENT_ID, userId);
    ensureGroupAdmin(groupId, userId);
    didSetup = true;
  });

  test.afterAll(() => {
    // mobile プロジェクトは beforeEach の skip でセットアップ前に抜けるため
    // didSetup=false のまま (desktop 実行中に mobile 側 afterAll が行を消す競合を防ぐ)
    if (!didSetup) return;
    // 原状復帰 (spec が dev.db に足した行のみ削除)
    try {
      removeParticipant(EVENT_ID, userId);
      removeGroupAdmin(groupId, userId);
    } catch (e) {
      console.warn(`[ticket-qr-checkin] cleanup failed: ${e}`);
    }
  });

  test("参加者本人のチケットページに QR (SVG) と署名トークンが表示される", async ({
    page,
  }) => {
    await devLogin(page, USER, `/event/${EVENT_ID}/ticket`);

    // QR は qrcode-svg が生成した SVG として表示される
    const qr = page.getByTestId("ticket-qr");
    await expect(qr).toBeVisible();
    await expect(qr.locator("svg")).toBeVisible();

    // フォールバック用のチケットコードは署名付きトークンそのもの
    const expected = buildQrToken(participantId);
    await expect(page.getByTestId("ticket-token")).toHaveText(expected);
  });

  test("改ざんトークンは拒否され、正規の署名トークンでチェックインできる", async ({
    page,
  }) => {
    const validToken = buildQrToken(participantId);

    await devLogin(page, USER, `/event/${EVENT_ID}/admin/check-in`);

    // allowQrCheckIn=true なのでスキャナセクションが表示される
    const section = page.getByTestId("qr-scanner-section");
    await expect(section).toBeVisible();

    const input = page.getByTestId("qr-manual-input");
    const submit = page.getByTestId("qr-manual-submit");
    const result = page.getByTestId("qr-scan-result");

    // 1) 改ざんトークン (署名 1 文字書き換え) → 拒否
    await submitManualToken(input, submit, tamperToken(validToken));
    await expect(result).toHaveAttribute("data-kind", "error");
    await expect(result).toContainText("無効なトークン");

    // DB 上も accepted のまま (チェックインされていない)
    expect(fetchParticipantRow(participantId)).toEqual({
      status: "accepted",
      checkInMethod: null,
    });

    // 2) 正規トークン → チェックイン成功
    // (万一 click が二重発火した場合は 2 回目が already 扱いになるため両方許容)
    await submitManualToken(input, submit, validToken);
    await expect(result).toHaveAttribute("data-kind", /^(ok|already)$/);
    await expect(result).toContainText(/チェックイン(しました|済み)/);

    // DB: attended + checkInMethod='qr' (Server Action の commit 完了は
    // 成功メッセージ表示後だが、念のため toPass で polling)
    await expect(() => {
      expect(fetchParticipantRow(participantId)).toEqual({
        status: "attended",
        checkInMethod: "qr",
      });
    }).toPass({ timeout: 10_000 });

    // 3) チケットページ側も「チェックイン済み」表示に変わる
    await page.goto(`/event/${EVENT_ID}/ticket`);
    await expect(page.getByTestId("ticket-attended")).toBeVisible();
  });
});
