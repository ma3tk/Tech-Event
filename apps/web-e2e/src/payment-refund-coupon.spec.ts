/**
 * 決済コア拡張 (返金 / クーポン) E2E。
 *
 * Stripe 未設定 (現地払いフォールバック) 前提で、DB 検証を中心に行う:
 *   1. クーポン発行 (admin/coupons UI) → DB に大文字正規化コードで保存され、
 *      検証プレビューで割引額 / 割引後金額が算出される
 *   2. 返金アクション (admin/refunds UI) → Payment.status が refunded に更新され、
 *      refundedAmount / refundReason / refundedAt が記録される
 *   3. webhook `checkout.session.completed` (coupon metadata 付き) →
 *      Payment.discountAmount / couponId + CouponRedemption + redeemedCount++
 *   4. webhook `charge.refunded` → Payment.status が refunded に更新される
 *
 * - dev-login は E2E 用固定ユーザー `test_user` を使用 (CLAUDE.md §3.4)。
 *   `test_user` を event 11 のグループ (groupId=3) の GroupAdmin に一時追加し、
 *   afterAll + 冪等クリーンアップで元に戻す。
 * - DB 状態に依存するため serial mode (CLAUDE.md §3.4)。
 * - 待機は全て locator-based (`waitForTimeout` 禁止)。
 */
import path from "node:path";
import Database from "better-sqlite3";
import { test, expect } from "@playwright/test";

import { devLogin } from "./_helpers/auth";
import { clickUntil } from "./_helpers/actions";

const DB_PATH = path.resolve(__dirname, "../../web/dev.db");

const EVENT_ID = 11;
const TEST_NICKNAME = "test_user";
const COUPON_CODE_INPUT = "e2e-off-1000"; // 小文字入力 → 大文字正規化を検証
const COUPON_CODE = "E2E-OFF-1000";
const WEBHOOK_COUPON_CODE = "E2E-WEBHOOK-500";
const ROLE_NAME = "E2E refund-coupon role";
const ROLE_PRICE = 5000;

test.describe.configure({ mode: "serial" });

/* ============================================================
 * SQLite 直接操作ヘルパー (stripe-payment.spec.ts と同型)
 * ============================================================ */

function withDb<T>(fn: (db: InstanceType<typeof Database>) => T): T {
  const db = new Database(DB_PATH);
  try {
    return fn(db);
  } finally {
    db.close();
  }
}

function getUserId(nickname: string): number {
  return withDb((db) => {
    const row = db
      .prepare(`SELECT id FROM users WHERE nickname = ? LIMIT 1`)
      .get(nickname) as { id: number } | undefined;
    if (!row) throw new Error(`user not found: ${nickname}`);
    return row.id;
  });
}

function getEventGroupId(eventId: number): number {
  return withDb((db) => {
    const row = db
      .prepare(`SELECT groupId FROM events WHERE id = ? LIMIT 1`)
      .get(eventId) as { groupId: number } | undefined;
    if (!row) throw new Error(`event not found: ${eventId}`);
    return row.groupId;
  });
}

/** test_user をイベントのグループ管理者に一時追加 (冪等)。追加したら true。 */
function ensureGroupAdmin(groupId: number, userId: number): boolean {
  return withDb((db) => {
    const existing = db
      .prepare(
        `SELECT id FROM group_admins WHERE groupId = ? AND userId = ? LIMIT 1`,
      )
      .get(groupId, userId) as { id: number } | undefined;
    if (existing) return false;
    const maxRow = db
      .prepare(`SELECT IFNULL(MAX(id), 0) as maxId FROM group_admins`)
      .get() as { maxId: number };
    db.prepare(
      `INSERT INTO group_admins (id, groupId, userId, role, addedAt)
       VALUES (?, ?, ?, 'admin', datetime('now'))`,
    ).run(maxRow.maxId + 1, groupId, userId);
    return true;
  });
}

function removeGroupAdmin(groupId: number, userId: number): void {
  withDb((db) => {
    db.prepare(
      `DELETE FROM group_admins WHERE groupId = ? AND userId = ?`,
    ).run(groupId, userId);
  });
}

/** 有料 (prepaid) role を event に用意する (冪等)。 */
function ensurePrepaidRole(eventId: number): number {
  return withDb((db) => {
    const row = db
      .prepare(
        `SELECT id FROM event_roles WHERE eventId = ? AND name = ? LIMIT 1`,
      )
      .get(eventId, ROLE_NAME) as { id: number } | undefined;
    if (row) return row.id;
    const maxRow = db
      .prepare(`SELECT IFNULL(MAX(id), 0) as maxId FROM event_roles`)
      .get() as { maxId: number };
    const roleId = maxRow.maxId + 1;
    db.prepare(
      `INSERT INTO event_roles (id, eventId, displayOrder, name, capacity, recruitmentMethod, pricingType, price, currency, autoPromoteFromWaiting, visibleAfterFull, createdAt, updatedAt)
       VALUES (?, ?, 98, ?, 100, 'fcfs', 'prepaid', ?, 'JPY', 1, 1, datetime('now'), datetime('now'))`,
    ).run(roleId, eventId, ROLE_NAME, ROLE_PRICE);
    return roleId;
  });
}

function fetchCoupon(code: string):
  | {
      id: number;
      code: string;
      scope: string;
      eventId: number | null;
      discountType: string;
      discountValue: number;
      redeemedCount: number;
      active: number;
    }
  | undefined {
  return withDb((db) =>
    db
      .prepare(
        `SELECT id, code, scope, eventId, discountType, discountValue, redeemedCount, active
         FROM coupons WHERE code = ? ORDER BY id DESC LIMIT 1`,
      )
      .get(code),
  ) as ReturnType<typeof fetchCoupon>;
}

function fetchPaymentByParticipant(participantId: number):
  | {
      id: number;
      status: string;
      amount: number;
      refundedAmount: number | null;
      refundReason: string | null;
      refundedAt: string | null;
      discountAmount: number | null;
      couponId: number | null;
      providerRefundId: string | null;
    }
  | undefined {
  return withDb((db) =>
    db
      .prepare(
        `SELECT id, status, amount, refundedAmount, refundReason, refundedAt, discountAmount, couponId, providerRefundId
         FROM payments WHERE participantId = ? LIMIT 1`,
      )
      .get(participantId),
  ) as ReturnType<typeof fetchPaymentByParticipant>;
}

function fetchParticipantId(
  eventId: number,
  eventRoleId: number,
  userId: number,
): number | undefined {
  const row = withDb((db) =>
    db
      .prepare(
        `SELECT id FROM participants WHERE eventId = ? AND eventRoleId = ? AND userId = ?
         ORDER BY id DESC LIMIT 1`,
      )
      .get(eventId, eventRoleId, userId),
  ) as { id: number } | undefined;
  return row?.id;
}

/** webhook で作った participant + payment (+ redemption) を削除して counter を戻す。 */
function cleanupParticipant(participantId: number): void {
  withDb((db) => {
    const row = db
      .prepare(
        `SELECT paymentId, eventId, status FROM participants WHERE id = ?`,
      )
      .get(participantId) as
      | { paymentId: number | null; eventId: number; status: string }
      | undefined;
    if (!row) return;
    if (row.paymentId != null) {
      db.prepare(
        `DELETE FROM coupon_redemptions WHERE paymentId = ?`,
      ).run(row.paymentId);
      db.prepare(`UPDATE participants SET paymentId = NULL WHERE id = ?`).run(
        participantId,
      );
      db.prepare(`DELETE FROM payments WHERE id = ?`).run(row.paymentId);
    }
    db.prepare(`DELETE FROM participants WHERE id = ?`).run(participantId);
    if (row.status === "accepted") {
      db.prepare(
        `UPDATE events SET acceptedCount = MAX(0, acceptedCount - 1) WHERE id = ?`,
      ).run(row.eventId);
    }
  });
}

/** テストで作った coupon (+ redemption) を削除する (冪等)。 */
function cleanupCoupon(code: string): void {
  withDb((db) => {
    const rows = db
      .prepare(`SELECT id FROM coupons WHERE code = ?`)
      .all(code) as Array<{ id: number }>;
    for (const row of rows) {
      db.prepare(`UPDATE payments SET couponId = NULL WHERE couponId = ?`).run(
        row.id,
      );
      db.prepare(`DELETE FROM coupon_redemptions WHERE couponId = ?`).run(
        row.id,
      );
      db.prepare(`DELETE FROM coupons WHERE id = ?`).run(row.id);
    }
  });
}

/* ============================================================
 * setup / teardown
 * ============================================================ */

let userId: number;
let groupId: number;
let roleId: number;
let addedGroupAdmin = false;

test.beforeAll(() => {
  userId = getUserId(TEST_NICKNAME);
  groupId = getEventGroupId(EVENT_ID);
  addedGroupAdmin = ensureGroupAdmin(groupId, userId);
  roleId = ensurePrepaidRole(EVENT_ID);
  // 前回 run の残骸を冪等クリーンアップ
  cleanupCoupon(COUPON_CODE);
  cleanupCoupon(WEBHOOK_COUPON_CODE);
  const stale = fetchParticipantId(EVENT_ID, roleId, userId);
  if (stale !== undefined) cleanupParticipant(stale);
});

test.afterAll(() => {
  const p = fetchParticipantId(EVENT_ID, roleId, userId);
  if (p !== undefined) cleanupParticipant(p);
  cleanupCoupon(COUPON_CODE);
  cleanupCoupon(WEBHOOK_COUPON_CODE);
  if (addedGroupAdmin) removeGroupAdmin(groupId, userId);
});

/* ============================================================
 * 1. クーポン発行 → 検証プレビューで割引額算出
 * ============================================================ */

test("クーポン発行 → 大文字正規化で保存され、検証プレビューで割引額が算出される", async ({
  page,
}) => {
  await devLogin(page, TEST_NICKNAME, {
    next: `/event/${EVENT_ID}/admin/coupons`,
  });
  await expect(page.getByTestId("coupon-create-form")).toBeVisible();

  // ---- 発行 (小文字で入力 → 大文字正規化を検証) ----
  await page.getByTestId("coupon-code-input").fill(COUPON_CODE_INPUT);
  await page.getByTestId("coupon-type-select").selectOption("fixed");
  await page.getByTestId("coupon-value-input").fill("1000");
  await clickUntil(page.getByTestId("coupon-create-submit"), async () => {
    await expect(page.getByTestId("coupon-created-banner")).toBeVisible();
  });

  // 一覧に正規化済みコードで表示される
  await expect(page.getByTestId(`coupon-row-${COUPON_CODE}`)).toBeVisible();

  // ---- DB 検証 ----
  const coupon = fetchCoupon(COUPON_CODE);
  expect(coupon, "coupon should be stored with normalized code").toBeTruthy();
  expect(coupon!.scope).toBe("event");
  expect(coupon!.eventId).toBe(EVENT_ID);
  expect(coupon!.discountType).toBe("fixed");
  expect(coupon!.discountValue).toBe(1000);
  expect(coupon!.active).toBe(1);

  // ---- 検証プレビュー: 5000 円に適用 → 割引 1000 / 割引後 4000 ----
  await page.getByTestId("coupon-validate-code-input").fill(COUPON_CODE_INPUT);
  await page
    .getByTestId("coupon-validate-price-input")
    .fill(String(ROLE_PRICE));
  await clickUntil(page.getByTestId("coupon-validate-submit"), async () => {
    await expect(page.getByTestId("coupon-validate-result")).toBeVisible();
  });
  await expect(page.getByTestId("coupon-validate-discount")).toHaveText(
    "¥1,000",
  );
  await expect(page.getByTestId("coupon-validate-final")).toHaveText("¥4,000");
});

test("無効なコードは検証プレビューでエラー表示", async ({ page }) => {
  await devLogin(page, TEST_NICKNAME, {
    next: `/event/${EVENT_ID}/admin/coupons`,
  });
  await page.getByTestId("coupon-validate-code-input").fill("NO-SUCH-CODE");
  await page
    .getByTestId("coupon-validate-price-input")
    .fill(String(ROLE_PRICE));
  await clickUntil(page.getByTestId("coupon-validate-submit"), async () => {
    await expect(page.getByTestId("coupon-validate-result")).toBeVisible();
  });
  await expect(page.getByTestId("coupon-validate-result")).toContainText(
    "見つかりません",
  );
});

/* ============================================================
 * 2. 返金アクション → Payment.status 更新
 * ============================================================ */

test("返金アクション → Payment.status が refunded に更新される", async ({
  page,
  request,
}) => {
  // ---- webhook 経由で支払い済み参加者を作る (Stripe 未設定 dev フォールバック) ----
  const txnId = `pi_e2e_refund_${Date.now()}`;
  const res = await request.post("/api/payments/webhook", {
    data: {
      id: `evt_e2e_refund_${Date.now()}`,
      type: "checkout.session.completed",
      data: {
        object: {
          id: `cs_e2e_refund_${Date.now()}`,
          payment_intent: txnId,
          amount_total: ROLE_PRICE,
          currency: "jpy",
          metadata: {
            eventId: String(EVENT_ID),
            eventRoleId: String(roleId),
            userId: String(userId),
          },
        },
      },
    },
    headers: { "Content-Type": "application/json" },
  });
  expect(res.status()).toBe(200);

  const participantId = fetchParticipantId(EVENT_ID, roleId, userId);
  expect(participantId, "participant should exist").toBeTruthy();
  const before = fetchPaymentByParticipant(participantId!);
  expect(before?.status).toBe("succeeded");

  // ---- 返金管理 UI から全額返金 ----
  await devLogin(page, TEST_NICKNAME, {
    next: `/event/${EVENT_ID}/admin/refunds`,
  });
  const row = page.getByTestId(`refund-row-${userId}`);
  await expect(row).toBeVisible();

  await page.getByTestId(`refund-reason-${userId}`).fill("E2E 返金テスト");
  await clickUntil(page.getByTestId(`refund-submit-${userId}`), async () => {
    await expect(page.getByTestId("refund-success-banner")).toBeVisible();
  });

  // UI 上のステータスが 返金済み になる
  await expect(page.getByTestId(`refund-status-${userId}`)).toHaveText(
    "返金済み",
  );

  // ---- DB 検証 ----
  const after = fetchPaymentByParticipant(participantId!);
  expect(after, "payment should exist").toBeTruthy();
  expect(after!.status).toBe("refunded");
  expect(after!.refundedAmount).toBe(ROLE_PRICE);
  expect(after!.refundReason).toBe("E2E 返金テスト");
  expect(after!.refundedAt).not.toBeNull();

  cleanupParticipant(participantId!);
});

/* ============================================================
 * 3. 領収データ発行 (本人のみ / 採番冪等)
 * ============================================================ */

test("領収データ: 支払い済み本人が取得でき、領収番号が採番される (再取得で同番号)", async ({
  page,
  request,
}) => {
  // ---- webhook で支払い済み参加者を作る ----
  const txnId = `pi_e2e_receipt_${Date.now()}`;
  const res = await request.post("/api/payments/webhook", {
    data: {
      id: `evt_e2e_receipt_${Date.now()}`,
      type: "checkout.session.completed",
      data: {
        object: {
          id: `cs_e2e_receipt_${Date.now()}`,
          payment_intent: txnId,
          amount_total: ROLE_PRICE,
          currency: "jpy",
          metadata: {
            eventId: String(EVENT_ID),
            eventRoleId: String(roleId),
            userId: String(userId),
          },
        },
      },
    },
    headers: { "Content-Type": "application/json" },
  });
  expect(res.status()).toBe(200);
  const participantId = fetchParticipantId(EVENT_ID, roleId, userId);
  expect(participantId).toBeTruthy();

  // ---- 本人で領収データ取得 (宛名をクエリ指定) ----
  await devLogin(page, TEST_NICKNAME, { next: "/dashboard" });
  await page.goto(
    `/event/${EVENT_ID}/receipt?name=${encodeURIComponent("株式会社テスト")}`,
  );
  await expect(page.getByTestId("receipt")).toBeVisible();
  await expect(page.getByTestId("receipt-number")).toHaveText(
    new RegExp(`No\\. R-${EVENT_ID}-\\d{4}`),
  );
  await expect(page.getByTestId("receipt-name")).toHaveText("株式会社テスト");
  await expect(page.getByTestId("receipt-amount")).toContainText("¥5,000");
  await expect(page.getByTestId("receipt-issuer")).not.toBeEmpty();
  const firstNumber = await page.getByTestId("receipt-number").innerText();

  // ---- DB 検証: receiptNumber / receiptName / receiptIssuedAt が記録される ----
  const payRow = withDb((db) =>
    db
      .prepare(
        `SELECT receiptNumber, receiptName, receiptIssuedAt FROM payments WHERE participantId = ? LIMIT 1`,
      )
      .get(participantId),
  ) as
    | {
        receiptNumber: string | null;
        receiptName: string | null;
        receiptIssuedAt: string | null;
      }
    | undefined;
  expect(payRow?.receiptNumber).toMatch(new RegExp(`^R-${EVENT_ID}-\\d{4}$`));
  expect(payRow?.receiptName).toBe("株式会社テスト");
  expect(payRow?.receiptIssuedAt).not.toBeNull();

  // ---- 再取得しても同じ領収番号 (冪等) ----
  await page.goto(`/event/${EVENT_ID}/receipt`);
  await expect(page.getByTestId("receipt-number")).toHaveText(firstNumber);
  // 宛名は前回指定した値が保持される
  await expect(page.getByTestId("receipt-name")).toHaveText("株式会社テスト");

  cleanupParticipant(participantId!);
});

/* ============================================================
 * 4. webhook: クーポン metadata → 割引記録 + CouponRedemption
 * ============================================================ */

test("webhook: coupon metadata 付き checkout 完了 → 割引記録 + redemption 作成", async ({
  page,
  request,
}) => {
  // ---- クーポンを UI から発行 (500 円引き) ----
  await devLogin(page, TEST_NICKNAME, {
    next: `/event/${EVENT_ID}/admin/coupons`,
  });
  await page.getByTestId("coupon-code-input").fill(WEBHOOK_COUPON_CODE);
  await page.getByTestId("coupon-type-select").selectOption("fixed");
  await page.getByTestId("coupon-value-input").fill("500");
  await clickUntil(page.getByTestId("coupon-create-submit"), async () => {
    await expect(page.getByTestId("coupon-created-banner")).toBeVisible();
  });
  const coupon = fetchCoupon(WEBHOOK_COUPON_CODE);
  expect(coupon).toBeTruthy();
  expect(coupon!.redeemedCount).toBe(0);

  // ---- webhook: 割引後金額 4500 + coupon metadata ----
  const txnId = `pi_e2e_coupon_${Date.now()}`;
  const res = await request.post("/api/payments/webhook", {
    data: {
      id: `evt_e2e_coupon_${Date.now()}`,
      type: "checkout.session.completed",
      data: {
        object: {
          id: `cs_e2e_coupon_${Date.now()}`,
          payment_intent: txnId,
          amount_total: ROLE_PRICE - 500,
          currency: "jpy",
          metadata: {
            eventId: String(EVENT_ID),
            eventRoleId: String(roleId),
            userId: String(userId),
            couponId: String(coupon!.id),
            discountAmount: "500",
          },
        },
      },
    },
    headers: { "Content-Type": "application/json" },
  });
  expect(res.status()).toBe(200);

  // ---- DB 検証: Payment に割引記録 + redemption + redeemedCount++ ----
  const participantId = fetchParticipantId(EVENT_ID, roleId, userId);
  expect(participantId).toBeTruthy();
  const payment = fetchPaymentByParticipant(participantId!);
  expect(payment).toBeTruthy();
  expect(payment!.amount).toBe(ROLE_PRICE - 500);
  expect(payment!.discountAmount).toBe(500);
  expect(payment!.couponId).toBe(coupon!.id);

  const redemption = withDb((db) =>
    db
      .prepare(
        `SELECT id, userId, amount FROM coupon_redemptions WHERE couponId = ? AND paymentId = ? LIMIT 1`,
      )
      .get(coupon!.id, payment!.id),
  ) as { id: number; userId: number; amount: number } | undefined;
  expect(redemption, "redemption should be created").toBeTruthy();
  expect(redemption!.userId).toBe(userId);
  expect(redemption!.amount).toBe(500);

  const couponAfter = fetchCoupon(WEBHOOK_COUPON_CODE);
  expect(couponAfter!.redeemedCount).toBe(1);

  // ---- 4. webhook: charge.refunded → refunded に更新 ----
  const refundRes = await request.post("/api/payments/webhook", {
    data: {
      id: `evt_e2e_charge_refunded_${Date.now()}`,
      type: "charge.refunded",
      data: {
        object: {
          id: `ch_e2e_${Date.now()}`,
          payment_intent: txnId,
          amount_refunded: ROLE_PRICE - 500,
          refunds: { data: [{ id: `re_e2e_${Date.now()}` }] },
        },
      },
    },
    headers: { "Content-Type": "application/json" },
  });
  expect(refundRes.status()).toBe(200);
  const refundBody = (await refundRes.json()) as { refund?: string };
  expect(refundBody.refund).toBe("refunded");

  const refunded = fetchPaymentByParticipant(participantId!);
  expect(refunded!.status).toBe("refunded");
  expect(refunded!.refundedAmount).toBe(ROLE_PRICE - 500);
  expect(refunded!.providerRefundId).toMatch(/^re_e2e_/);

  cleanupParticipant(participantId!);
});
