/**
 * ゲスト個別招待 + One-Tap RSVP の E2E。
 *
 * シナリオ:
 *   0. (setup) test_user がグループ + 公開イベントを UI から作成
 *   1. 招待送信: /event/{id}/admin/guests の「ゲストを招待」フォームから
 *      email を送信 → 結果バナー + 招待一覧に pending (招待中) 行が表示される
 *   2. One-Tap RSVP: dev.db に sha256(生トークン) の Invitation を直接投入し
 *      (magic-link.spec と同じ DB 直接操作パターン)、/rsvp/{生トークン} を開いて
 *      確認ボタンを押す → イベントページへ redirect + DB 上で
 *      Invitation.status=accepted / Participant 作成 / User 自動作成を検証
 *   3. 無効トークンはエラーページ (トークンを消費しない)
 *
 * DB 状態 (作成イベント id) をテスト間で共有するため serial mode。
 * dev.db への書き込みは globalTeardown の baseline 復元で巻き戻る。
 */
import { createHash, randomBytes } from "node:crypto";
import path from "node:path";

import { test, expect } from "@playwright/test";
import Database from "better-sqlite3";

import { devLogin } from "./_helpers/auth";

test.describe.configure({ mode: "serial" });

const DEV_USER = "test_user";
const DEV_DB_PATH = path.resolve(__dirname, "../../web/dev.db");

/** datetime-local 用文字列を生成: 今日から +offsetDays */
function plusDaysLocal(offsetDays: number, hour = 19, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate(),
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** ランダムな subdomain を生成 (3-63 文字, [a-z0-9-]) */
function randomSubdomain(): string {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 6);
  return `te-inv-${ts}-${rnd}`.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * dev.db に Invitation 行を直接投入する (実運用では招待メール経由だが、
 * E2E では生トークンを知る必要があるため sha256 を計算して直接 INSERT)。
 * id は他 worker (desktop/mobile 並走) と衝突しないよう epoch ms + 乱数。
 */
function insertInvitation(params: {
  eventId: number;
  email: string;
  tokenHash: string;
  expiresAtMs: number;
}): number {
  const db = new Database(DEV_DB_PATH);
  try {
    const id = Date.now() + Math.floor(Math.random() * 1_000_000);
    db.prepare(
      `INSERT INTO invitations (id, eventId, email, tokenHash, status, expiresAt, createdAt)
       VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
    ).run(id, params.eventId, params.email, params.tokenHash, params.expiresAtMs, Date.now());
    return id;
  } finally {
    db.close();
  }
}

type InvitationRow = {
  status: string;
  acceptedAt: number | null;
};

function fetchInvitation(id: number): InvitationRow | undefined {
  const db = new Database(DEV_DB_PATH, { readonly: true });
  try {
    return db
      .prepare(`SELECT status, acceptedAt FROM invitations WHERE id = ?`)
      .get(id) as InvitationRow | undefined;
  } finally {
    db.close();
  }
}

function fetchParticipantByEmail(
  eventId: number,
  email: string,
): { status: string } | undefined {
  const db = new Database(DEV_DB_PATH, { readonly: true });
  try {
    return db
      .prepare(
        `SELECT p.status FROM participants p
           JOIN users u ON u.id = p.userId
          WHERE p.eventId = ? AND u.email = ?`,
      )
      .get(eventId, email) as { status: string } | undefined;
  } finally {
    db.close();
  }
}

// serial mode (同一 worker) 前提でテスト間共有するモジュール変数
let eventId = "";

test.describe("ゲスト個別招待 + One-Tap RSVP", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("setup: test_user がグループ + 公開イベントを作成", async ({ page }) => {
    test.setTimeout(120_000);

    const subdomain = randomSubdomain();
    const eventTitle = `E2E Invite Event ${Date.now()}`;

    // ---- グループ作成 ----
    await devLogin(page, DEV_USER, { next: "/group/create" });
    await expect(page.getByTestId("group-create-form")).toBeVisible();
    await page.locator("input#subdomain").fill(subdomain);
    await page.locator("input#name").fill(`E2E Invite Group ${subdomain}`);
    await Promise.all([
      page.waitForURL(new RegExp(`/group/${subdomain}$`)),
      page.getByTestId("group-create-submit").click(),
    ]);

    // ---- イベント作成 (デフォルト無料枠のまま公開) ----
    await page.goto(`/event/create?group=${subdomain}`);
    await expect(page.getByTestId("event-create-form")).toBeVisible();
    await page.locator("input#title").fill(eventTitle);
    await page.locator("input#startedAt").fill(plusDaysLocal(14, 19, 0));
    await page.locator("input#endedAt").fill(plusDaysLocal(14, 21, 0));
    await Promise.all([
      page.waitForURL(/\/event\/\d+$/),
      page.getByTestId("event-publish").click(),
    ]);

    const m = page.url().match(/\/event\/(\d+)/);
    expect(m).not.toBeNull();
    eventId = m![1]!;
  });

  test("招待送信 → 招待一覧に pending (招待中) が表示される", async ({
    page,
  }) => {
    expect(eventId, "setup で eventId が取れていること").not.toBe("");
    const inviteEmail = `invitee-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 6)}@example.com`;

    await devLogin(page, DEV_USER, {
      next: `/event/${eventId}/admin/guests`,
      skipWaitForUrl: true,
    });
    await expect(page.getByTestId("admin-panel-guests")).toBeVisible();

    // 既存の参加者管理 UI が壊れていないこと
    await expect(page.getByTestId("admin-guests-table")).toBeVisible();
    await expect(page.getByTestId("admin-guests-filter")).toBeVisible();

    // 招待フォームに email を入れて送信
    await expect(page.getByTestId("admin-invite-form")).toBeVisible();
    await page.getByTestId("admin-invite-emails").fill(inviteEmail);
    await Promise.all([
      page.waitForURL(/invited=1/),
      page.getByTestId("admin-invite-submit").click(),
    ]);

    // 結果バナー + 一覧に pending 表示
    await expect(page.getByTestId("admin-invite-result")).toContainText(
      "1 件の招待を送信しました",
    );
    const table = page.getByTestId("admin-invitations-table");
    await expect(table).toBeVisible();
    const row = table.locator("tr", { hasText: inviteEmail });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText("招待中");

    // 再送 → 行は pending のまま残る
    await expect(
      row.locator("[data-testid^='admin-invitation-resend-']"),
    ).toBeVisible();
    await row.locator("[data-testid^='admin-invitation-resend-']").click();
    await expect(table.locator("tr", { hasText: inviteEmail })).toHaveCount(1);

    // 取消 → 行が消える
    const rowAfterResend = table.locator("tr", { hasText: inviteEmail });
    await rowAfterResend
      .locator("[data-testid^='admin-invitation-cancel-']")
      .click();
    await expect(table.locator("tr", { hasText: inviteEmail })).toHaveCount(0);
  });

  test("One-Tap RSVP: トークンで確認 → 参加登録 + accepted 化", async ({
    page,
    context,
  }) => {
    expect(eventId, "setup で eventId が取れていること").not.toBe("");

    // DB に sha256 ハッシュを直接投入 (生トークンはテストだけが知る)
    const rawToken = randomBytes(32).toString("hex");
    const rsvpEmail = `rsvp-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 6)}@example.com`;
    const invitationId = insertInvitation({
      eventId: Number(eventId),
      email: rsvpEmail,
      tokenHash: sha256Hex(rawToken),
      expiresAtMs: Date.now() + 14 * 24 * 60 * 60 * 1000,
    });

    // 未ログイン状態で One-Tap RSVP リンクを開く → 確認ページ
    await page.goto(`/rsvp/${rawToken}`);
    await expect(page.getByTestId("rsvp-confirm-title")).toBeVisible();
    await expect(page.locator("body")).toContainText(rsvpEmail);

    // 確定ボタン → イベントページへ redirect
    await Promise.all([
      page.waitForURL(new RegExp(`/event/${eventId}\\?rsvp=accepted`)),
      page.getByTestId("rsvp-confirm").click(),
    ]);

    // セッション cookie (te_session) が発行され、招待 email のユーザーとしてログイン済み
    const cookies = await context.cookies();
    const session = cookies.find((c) => c.name === "te_session");
    expect(session, "session cookie missing").toBeTruthy();
    expect(session!.value.length).toBeGreaterThan(0);

    // DB 検証: Invitation accepted + Participant 作成 (User は email から自動作成)
    const inv = fetchInvitation(invitationId);
    expect(inv?.status).toBe("accepted");
    expect(inv?.acceptedAt).not.toBeNull();

    const participant = fetchParticipantByEmail(Number(eventId), rsvpEmail);
    expect(participant, "participant row not found").toBeTruthy();
    expect(participant!.status).toBe("accepted");

    // 再度同じトークンを開くと「受付済み」表示 (トークン再利用不可)
    await page.goto(`/rsvp/${rawToken}`);
    await expect(page.getByTestId("rsvp-error-title")).toContainText(
      "受付済み",
    );
  });

  test("無効なトークンはエラーページを返す", async ({ page }) => {
    // 形式不正 (64 hex でない)
    await page.goto("/rsvp/not-a-valid-token");
    await expect(page.getByTestId("rsvp-error-title")).toContainText(
      "無効な招待リンク",
    );

    // 形式は正しいが存在しないトークン
    await page.goto(`/rsvp/${randomBytes(32).toString("hex")}`);
    await expect(page.getByTestId("rsvp-error-title")).toContainText(
      "招待が見つかりません",
    );
  });
});
