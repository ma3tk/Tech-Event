/**
 * 参加者向けトランザクション通知 (join_confirmed / waitlisted) E2E。
 *
 * 対象配線 (libs/web/feature-event/src/lib/participant-notify.ts):
 *   - joinEvent 成功 (fcfs 空きあり) → 本人へ in-app `join_confirmed` 通知
 *   - joinEvent 成功 (fcfs 満員)     → 本人へ in-app `waitlisted` 通知
 *   - cancelParticipation           → 本人へキャンセル完了メール (in-app 行なし)
 *
 * 検証方法:
 *   - メール送信の検証は `E2E_MAIL_CAPTURE=1` + `getCapturedMailsForTesting()`
 *     (libs/shared/util-storage/src/mailer.ts) が in-process の in-memory 受信箱
 *     のみで、E2E の webServer (playwright.config.ts) は capture を有効化しておらず
 *     取得用の test endpoint も無いため、cross-process では assert できない。
 *     → 代わりに Notification 行の生成を DB (dev.db) + 通知センター UI で検証する。
 *   - DB 直読は _helpers/auth.ts / approval-flow.spec.ts と同じ better-sqlite3
 *     readonly 接続のパターン。UI 側の状態変化 (ボタン表示) を待ってから読むので
 *     Server Action の commit 完了後になる (waitForTimeout 不使用)。
 *
 * 前提:
 *   - dev サーバ + seed 済み (`pnpm seed` → global-setup が test_user を投入)
 *   - event id=11: accepting カテゴリで空きあり (fcfs)。seed 経過日数によらず
 *     受付中が保証されるのは id=11 のみ (participate.spec.ts と同じ理由)。
 *     participate.spec.ts は fast_moon_169、本 spec は test_user なので
 *     participant 行は競合しない (カウンタ更新は tx の atomic increment)。
 *   - event id=22: E2E 用満員イベント (capacity 15 / 単一ロール)
 *
 * 注: 本 spec は固定ユーザー `test_user` の参加状態を変更するため
 *     desktop / mobile 両プロジェクトの同時実行で自分自身と競合する。
 *     approval-flow.spec.ts と同様に desktop のみで実行する。
 */
import path from "node:path";
import Database from "better-sqlite3";
import { test, expect } from "@playwright/test";
import { devLoginLegacy as devLogin } from "./_helpers/auth";
import { clickUntil } from "./_helpers/actions";

const USER = "test_user";
const ACCEPTING_EVENT_ID = 11;
const FULL_EVENT_ID = 22;

const DB_PATH = path.resolve(__dirname, "../../web/dev.db");

/** nickname → users.id (dev.db 直読)。 */
function resolveUserId(nickname: string): number {
  const db = new Database(DB_PATH, { readonly: true });
  try {
    const row = db
      .prepare("SELECT id FROM users WHERE nickname = ?")
      .get(nickname) as { id: number | bigint } | undefined;
    if (!row) throw new Error(`user not found in dev.db: ${nickname}`);
    return Number(row.id);
  } finally {
    db.close();
  }
}

/** (recipient, event, kind) の Notification 行数を dev.db から取得。 */
function countNotifications(
  nickname: string,
  eventId: number,
  kind: string,
): number {
  const userId = resolveUserId(nickname);
  const db = new Database(DB_PATH, { readonly: true });
  try {
    const row = db
      .prepare(
        `SELECT COUNT(*) AS c FROM notifications
         WHERE recipientUserId = ? AND eventId = ? AND kind = ?`,
      )
      .get(userId, eventId, kind) as { c: number };
    return row.c;
  } finally {
    db.close();
  }
}

/** 最新 1 件の Notification 行 (payload / channel / sentAt) を取得。 */
function fetchLatestNotification(
  nickname: string,
  eventId: number,
  kind: string,
): {
  payload: { eventTitle?: string };
  channel: string;
  sentAt: number | string | null;
} | null {
  const userId = resolveUserId(nickname);
  const db = new Database(DB_PATH, { readonly: true });
  try {
    const row = db
      .prepare(
        `SELECT payload, channel, sentAt FROM notifications
         WHERE recipientUserId = ? AND eventId = ? AND kind = ?
         ORDER BY id DESC LIMIT 1`,
      )
      .get(userId, eventId, kind) as
      | { payload: string; channel: string; sentAt: number | string | null }
      | undefined;
    if (!row) return null;
    return {
      payload: JSON.parse(row.payload) as { eventTitle?: string },
      channel: row.channel,
      sentAt: row.sentAt,
    };
  } finally {
    db.close();
  }
}

/**
 * retry 時の state contamination 対策: test_user の対象イベント上の
 * Participant / Notification を消して「未参加・未通知」状態に戻す
 * (approval-flow.spec.ts の resetApplicantParticipation と同じパターン)。
 * joinEvent の定員判定は participants の live count なので削除だけで整合する。
 */
function resetParticipantState(eventId: number): void {
  const db = new Database(DB_PATH);
  try {
    const userId = resolveUserId(USER);
    db.prepare(
      `DELETE FROM participants WHERE eventId = ? AND userId = ?`,
    ).run(eventId, userId);
    db.prepare(
      `DELETE FROM notifications WHERE eventId = ? AND recipientUserId = ?`,
    ).run(eventId, userId);
  } finally {
    db.close();
  }
}

// test_user の participant 状態を変更するため serial 固定 (flake 防止)
test.describe.configure({ mode: "serial" });

test.describe("参加者向けトランザクション通知", () => {
  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name === "chromium-mobile",
      "固定ユーザー (test_user) の状態を変更するため desktop のみで実行 (approval-flow と同方式)",
    );
    await context.clearCookies();
    // 前回 run / retry の残骸を掃除して冪等にする
    for (const id of [ACCEPTING_EVENT_ID, FULL_EVENT_ID]) {
      try {
        resetParticipantState(id);
      } catch (e) {
        console.warn(`[participant-transactional] reset failed (event=${id}): ${e}`);
      }
    }
  });

  test("申込完了 → join_confirmed 通知が作成され通知センターに表示される", async ({
    page,
  }) => {
    await devLogin(page, USER, `/event/${ACCEPTING_EVENT_ID}`);

    // 事前状態: 未参加 (beforeEach で reset 済み) → 参加申込ボタン
    const joinBtn = page.getByRole("button", { name: "参加申込" }).first();
    await expect(joinBtn).toBeVisible();

    // 申込 (hydration race は clickUntil で吸収)
    await clickUntil(joinBtn, async () => {
      await expect(page.getByTestId("my-participation-status")).toContainText(
        "参加確定中",
      );
    });

    // --- DB: join_confirmed 通知行が作成されている (in_app チャネル) ---
    expect(
      countNotifications(USER, ACCEPTING_EVENT_ID, "join_confirmed"),
    ).toBeGreaterThan(0);
    const row = fetchLatestNotification(
      USER,
      ACCEPTING_EVENT_ID,
      "join_confirmed",
    );
    expect(row?.payload.eventTitle).toBeTruthy();
    expect(row?.channel).toBe("in_app");
    // email pref はデフォルト有効 → sentAt (メール送信マーカー) がセットされる
    expect(row?.sentAt).not.toBeNull();

    // --- UI: 通知センターに「参加申込が完了しました」行が出る ---
    await page.goto("/notifications");
    await expect(page.getByTestId("notifications-list")).toBeVisible();
    await expect(
      page
        .getByTestId("notifications-row")
        .filter({ hasText: "への参加申込が完了しました" })
        .first(),
    ).toBeVisible();

    // --- キャンセル完了 (メールのみ / in-app 行は作らない配線) ---
    await page.goto(`/event/${ACCEPTING_EVENT_ID}`);
    const cancelBtn = page.getByRole("button", { name: "参加をキャンセル" });
    await clickUntil(cancelBtn, async () => {
      await expect(
        page.getByRole("button", { name: "参加申込" }).first(),
      ).toBeVisible();
    });

    // キャンセルで本人向けの新しい in-app 通知 kind は増えない
    // (主催者向け participant_cancelled は owner 宛なので test_user には付かない)
    expect(
      countNotifications(USER, ACCEPTING_EVENT_ID, "participant_cancelled"),
    ).toBe(0);
    // join_confirmed 行は残ったまま (既存機能を壊していない)
    expect(
      countNotifications(USER, ACCEPTING_EVENT_ID, "join_confirmed"),
    ).toBeGreaterThan(0);
  });

  test("満員イベントへの申込 → waitlisted 通知が作成される", async ({
    page,
  }) => {
    await devLogin(page, USER, `/event/${FULL_EVENT_ID}`);

    // 満員イベントなので補欠登録ボタン
    const waitlistBtn = page
      .getByRole("button", { name: "補欠登録する" })
      .first();
    await expect(waitlistBtn).toBeVisible();

    await clickUntil(waitlistBtn, async () => {
      await expect(page.getByTestId("my-participation-status")).toContainText(
        "補欠登録中",
      );
    });

    // --- DB: waitlisted 通知行 ---
    expect(
      countNotifications(USER, FULL_EVENT_ID, "waitlisted"),
    ).toBeGreaterThan(0);

    // --- UI: 通知センターに「満席のため補欠登録されました」行 ---
    await page.goto("/notifications");
    await expect(page.getByTestId("notifications-list")).toBeVisible();
    await expect(
      page
        .getByTestId("notifications-row")
        .filter({ hasText: "満席のため補欠登録されました" })
        .first(),
    ).toBeVisible();

    // 後始末: 補欠登録をキャンセルして未参加状態に戻す
    await page.goto(`/event/${FULL_EVENT_ID}`);
    const cancelBtn = page.getByRole("button", {
      name: "補欠登録をキャンセル",
    });
    await clickUntil(cancelBtn, async () => {
      await expect(
        page.getByRole("button", { name: "補欠登録する" }).first(),
      ).toBeVisible();
    });
  });
});
