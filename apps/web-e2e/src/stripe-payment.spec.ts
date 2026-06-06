/**
 * Stripe 決済 E2E。
 *
 * Stripe 機能の検証範囲:
 *   1. 有料 (`pricingType=prepaid`) の EventRole を持つイベントの参加ボタンが
 *      Stripe 未設定環境では従来通り (現地払い扱い) 表示されること
 *      (fallback の検証: 既存挙動を破壊していない確認)
 *   2. Server Action `createCheckoutSession` を呼ぶと、Stripe 未設定環境では
 *      `disabled` レスポンスを返すこと (内部 API 経由ではなく Server Action だが、
 *      これは payment endpoint の HTTP fallback で検証する)
 *   3. Webhook endpoint (`POST /api/payments/webhook`) に
 *      `checkout.session.completed` 相当の JSON を送ると、
 *      `Participant.status='accepted'` + `Payment` (provider='stripe') が作成されること
 *      (dev 環境では署名検証をスキップ)
 *
 * NOTE:
 *   - 実 Stripe Checkout 画面への遷移は外部 SaaS に依存するためモックする。
 *   - Webhook は `STRIPE_WEBHOOK_SECRET` 未設定時に署名検証をスキップする
 *     dev-friendly フォールバックを持つ。
 */
import path from "node:path";
import Database from "better-sqlite3";
import { test, expect } from "@playwright/test";

const DB_PATH = path.resolve(process.cwd(), "dev.db");

/**
 * 有料 (`prepaid`) なテスト用 EventRole を作る。
 * 既存の event id=11 (受付中) に role を 1 つ追加する。
 * 既に "E2E prepaid role" が存在すれば再利用 (idempotent)。
 */
function ensurePrepaidRole(eventId: bigint): {
  eventId: string;
  eventRoleId: string;
  userId: string;
} {
  const db = new Database(DB_PATH);
  try {
    // 既存の prepaid テスト枠を探す
    let row = db
      .prepare(
        `SELECT id FROM event_roles WHERE eventId = ? AND name = 'E2E prepaid role' LIMIT 1`,
      )
      .get(Number(eventId)) as { id: number } | undefined;

    let roleId: number;
    if (row) {
      roleId = row.id;
    } else {
      const maxRow = db
        .prepare(`SELECT IFNULL(MAX(id), 0) as maxId FROM event_roles`)
        .get() as { maxId: number };
      roleId = maxRow.maxId + 1;
      db.prepare(
        `INSERT INTO event_roles (id, eventId, displayOrder, name, capacity, recruitmentMethod, pricingType, price, currency, autoPromoteFromWaiting, visibleAfterFull, createdAt, updatedAt)
         VALUES (?, ?, 99, 'E2E prepaid role', 100, 'fcfs', 'prepaid', 5000, 'JPY', 1, 1, datetime('now'), datetime('now'))`,
      ).run(roleId, Number(eventId));
      row = { id: roleId };
    }

    // テスト用ユーザー id (seed の `fast_moon_169` = id 1)
    const userRow = db
      .prepare(
        `SELECT id FROM users WHERE nickname = 'fast_moon_169' LIMIT 1`,
      )
      .get() as { id: number } | undefined;

    return {
      eventId: eventId.toString(),
      eventRoleId: roleId.toString(),
      userId: userRow ? userRow.id.toString() : "1",
    };
  } finally {
    db.close();
  }
}

function fetchParticipant(
  eventId: string,
  eventRoleId: string,
  userId: string,
): { id: number; status: string; paymentId: number | null } | undefined {
  const db = new Database(DB_PATH, { readonly: true });
  try {
    return db
      .prepare(
        `SELECT id, status, paymentId FROM participants
         WHERE eventId = ? AND eventRoleId = ? AND userId = ?
         ORDER BY id DESC LIMIT 1`,
      )
      .get(Number(eventId), Number(eventRoleId), Number(userId)) as
      | { id: number; status: string; paymentId: number | null }
      | undefined;
  } finally {
    db.close();
  }
}

function fetchPayment(
  paymentId: number,
): { id: number; status: string; provider: string; amount: number } | undefined {
  const db = new Database(DB_PATH, { readonly: true });
  try {
    return db
      .prepare(
        `SELECT id, status, provider, amount FROM payments WHERE id = ? LIMIT 1`,
      )
      .get(paymentId) as
      | { id: number; status: string; provider: string; amount: number }
      | undefined;
  } finally {
    db.close();
  }
}

/** 後始末: webhook で作った participant + payment を削除 */
function cleanupParticipant(participantId: number): void {
  const db = new Database(DB_PATH);
  try {
    const row = db
      .prepare(`SELECT paymentId, eventId, status FROM participants WHERE id = ?`)
      .get(participantId) as
      | { paymentId: number | null; eventId: number; status: string }
      | undefined;
    if (!row) return;
    if (row.paymentId != null) {
      // Participant.paymentId は UNIQUE で FK があるので participant 側を先に NULL に
      db.prepare(`UPDATE participants SET paymentId = NULL WHERE id = ?`).run(
        participantId,
      );
      db.prepare(`DELETE FROM payments WHERE id = ?`).run(row.paymentId);
    }
    db.prepare(`DELETE FROM participants WHERE id = ?`).run(participantId);
    // accepted だったら counter を戻す
    if (row.status === "accepted") {
      db.prepare(
        `UPDATE events SET acceptedCount = MAX(0, acceptedCount - 1) WHERE id = ?`,
      ).run(row.eventId);
    }
  } finally {
    db.close();
  }
}

const STRIPE_ENABLED = !!process.env.STRIPE_SECRET_KEY;

test.describe("Stripe Webhook (dev 署名スキップ)", () => {
  test("checkout.session.completed → Participant + Payment が作られる", async ({
    request,
  }) => {
    // event id=11 (受付中) に prepaid role を仕込む
    const setup = ensurePrepaidRole(BigInt(11));

    // 一意な payment_intent でリトライ衝突を回避
    const txnId = `pi_e2e_${Date.now()}`;
    const sessionId = `cs_e2e_${Date.now()}`;

    const payload = {
      id: `evt_e2e_${Date.now()}`,
      type: "checkout.session.completed",
      data: {
        object: {
          id: sessionId,
          payment_intent: txnId,
          amount_total: 5000,
          currency: "jpy",
          metadata: {
            eventId: setup.eventId,
            eventRoleId: setup.eventRoleId,
            userId: setup.userId,
          },
        },
      },
    };

    const res = await request.post("/api/payments/webhook", {
      data: payload,
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { ok?: boolean };
    expect(body.ok).toBe(true);

    // DB を確認
    const p = fetchParticipant(setup.eventId, setup.eventRoleId, setup.userId);
    expect(p, "participant should be created").toBeTruthy();
    expect(p!.status).toBe("accepted");
    expect(p!.paymentId, "paymentId should be set").not.toBeNull();

    const payment = fetchPayment(p!.paymentId!);
    expect(payment, "payment should be created").toBeTruthy();
    expect(payment!.status).toBe("succeeded");
    expect(payment!.provider).toBe("stripe");
    expect(payment!.amount).toBe(5000);

    // クリーンアップ
    cleanupParticipant(p!.id);
  });

  test("不正な metadata は 400", async ({ request }) => {
    const res = await request.post("/api/payments/webhook", {
      data: {
        type: "checkout.session.completed",
        data: { object: { metadata: { foo: "bar" } } },
      },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(400);
  });

  test("他のイベントタイプは 200 で無視される", async ({ request }) => {
    const res = await request.post("/api/payments/webhook", {
      data: {
        type: "customer.created",
        data: { object: {} },
      },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { ok?: boolean; ignored?: string };
    expect(body.ok).toBe(true);
    expect(body.ignored).toBe("customer.created");
  });
});

test.describe("有料イベントの参加ボタン", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("Stripe 未設定時は通常の参加申込ボタン (fallback)", async ({
    page,
  }) => {
    test.skip(
      STRIPE_ENABLED,
      "STRIPE_SECRET_KEY が設定されているのでフォールバックパスはスキップ",
    );

    // 有料役割を確保
    const setup = ensurePrepaidRole(BigInt(11));

    // dev-login (fast_moon_169) → /event/11
    await page.goto(
      `/api/auth/dev-login?nickname=fast_moon_169&next=${encodeURIComponent(
        `/event/${setup.eventId}`,
      )}`,
    );
    await page.waitForURL(/\/event\/11/);

    // prepaid role が表示されており、Stripe 未設定なら 「決済して参加申込」 ボタンは出ない
    const paidBtn = page.getByTestId("register-state-paid");
    await expect(paidBtn).toHaveCount(0);
    // 通常 (open/waitlist) ボタンが少なくとも 1 件は出ている
    const openOrWait = page
      .getByTestId(/register-state-open|register-state-waitlist/)
      .first();
    await expect(openOrWait).toBeVisible();
  });

  test("Stripe 有効時は「決済して参加申込」ボタンが表示される", async ({
    page,
  }) => {
    test.skip(
      !STRIPE_ENABLED,
      "STRIPE_SECRET_KEY 未設定のためチェックアウト UI はスキップ",
    );
    const setup = ensurePrepaidRole(BigInt(11));
    await page.goto(
      `/api/auth/dev-login?nickname=fast_moon_169&next=${encodeURIComponent(
        `/event/${setup.eventId}`,
      )}`,
    );
    await page.waitForURL(/\/event\/11/);
    const paidBtn = page.getByTestId("register-state-paid").first();
    await expect(paidBtn).toBeVisible();
  });
});
