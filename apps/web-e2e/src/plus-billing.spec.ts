/**
 * グループ Plus プラン課金 E2E。
 *
 * 検証範囲:
 *   1. `/group/[subdomain]/admin/billing` が表示され、Stripe /
 *      STRIPE_PLUS_PRICE_ID 未設定環境では「準備中」フォールバックが出ること
 *      (既存挙動 = Free プランのまま、機能制限なし)。
 *      あわせて /pricing の「グループをアップグレード」導線に
 *      作成したグループが表示されることを確認する。
 *   2. Webhook (`customer.subscription.created/updated`) で Group.plan が
 *      plus に更新され、`isGroupPlus` の機能ゲートが
 *      - planExpiresAt が未来 → Plus 表示 (解約ボタンあり)
 *      - planExpiresAt が過去 → Free 表示 (期限切れゲートが閉じる)
 *      で切り替わること。最後に UI から解約して Free に戻ることを確認する
 *      (Stripe 未設定環境では DB のみ更新のフォールバック)。
 *
 * NOTE:
 *   - Webhook は `STRIPE_WEBHOOK_SECRET` 未設定時に署名検証をスキップする
 *     dev フォールバックを使う (stripe-payment.spec.ts と同方針)。
 *   - グループはテストごとに新規作成するため他テストの固定ユーザー /
 *     seed データを汚さない。
 */
import path from "node:path";
import Database from "better-sqlite3";
import { test, expect, type Page } from "@playwright/test";
import { devLogin } from "./_helpers/auth";

const DB_PATH = path.resolve(__dirname, "../../web/dev.db");
const DEV_USER = "test_user";

const STRIPE_ENABLED = !!process.env.STRIPE_SECRET_KEY;
const PLUS_PRICE_CONFIGURED = STRIPE_ENABLED && !!process.env.STRIPE_PLUS_PRICE_ID;
const WEBHOOK_SIG_ENABLED = !!process.env.STRIPE_WEBHOOK_SECRET;

/** ランダムな subdomain を生成 (3-63 文字, [a-z0-9-]) */
function randomSubdomain(): string {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 6);
  return `pb-${ts}-${rnd}`.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

/** test_user でログインしてグループを 1 つ作成する */
async function createGroup(page: Page, subdomain: string): Promise<void> {
  await devLogin(page, DEV_USER, {
    next: "/group/create",
    skipWaitForUrl: true,
  });
  await page.waitForURL(/\/group\/create/);
  await expect(page.getByTestId("group-create-form")).toBeVisible();

  await page.locator("input#subdomain").fill(subdomain);
  await page.locator("input#name").fill(`Plus Billing E2E ${subdomain}`);

  await Promise.all([
    page.waitForURL(new RegExp(`/group/${subdomain}$`)),
    page.getByTestId("group-create-submit").click(),
  ]);
}

/** dev.db から groups.id を引く (webhook の metadata.groupId 突合用) */
function getGroupId(subdomain: string): string {
  const db = new Database(DB_PATH, { readonly: true });
  try {
    const row = db
      .prepare(`SELECT id FROM groups WHERE subdomain = ? LIMIT 1`)
      .get(subdomain) as { id: number | bigint } | undefined;
    if (!row) {
      throw new Error(`group not found in dev.db: ${subdomain}`);
    }
    return String(row.id);
  } finally {
    db.close();
  }
}

/** customer.subscription.* イベント JSON を webhook に POST する */
async function postSubscriptionEvent(
  page: Page,
  type:
    | "customer.subscription.created"
    | "customer.subscription.updated"
    | "customer.subscription.deleted",
  object: Record<string, unknown>,
): Promise<void> {
  const res = await page.request.post("/api/payments/webhook", {
    data: { type, data: { object } },
  });
  expect(res.ok()).toBeTruthy();
}

test.describe("グループ Plus 課金 (billing)", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("billing ページ表示 + Stripe 未設定なら「準備中」フォールバック + /pricing 導線", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const subdomain = randomSubdomain();
    await createGroup(page, subdomain);

    await page.goto(`/group/${subdomain}/admin/billing`);
    await expect(page.getByTestId("billing-heading")).toBeVisible();
    await expect(page.getByTestId("billing-plan-badge")).toHaveText("Free");
    await expect(page.getByTestId("billing-plan-limits")).toBeVisible();
    // 機能ゲートの比較表 (free 10 / plus 無制限 など) が描画される
    await expect(
      page.getByTestId("billing-limit-maxWebhookEndpoints"),
    ).toContainText("無制限");

    if (!PLUS_PRICE_CONFIGURED) {
      // Stripe / STRIPE_PLUS_PRICE_ID 未設定 → 「準備中」フォールバック
      await expect(page.getByTestId("billing-upgrade-disabled")).toBeVisible();
      await expect(page.getByTestId("billing-upgrade-disabled")).toContainText(
        "準備中",
      );
      await expect(page.getByTestId("billing-upgrade-button")).toHaveCount(0);
    } else {
      await expect(page.getByTestId("billing-upgrade-button")).toBeVisible();
    }

    // /pricing の「グループをアップグレード」導線に作成グループが出る
    await page.goto("/pricing");
    await expect(page.getByTestId("pricing-upgrade-groups")).toBeVisible();
    const groupLink = page.getByTestId(`pricing-upgrade-group-${subdomain}`);
    await expect(groupLink).toBeVisible();
    await expect(groupLink).toHaveAttribute(
      "href",
      `/group/${subdomain}/admin/billing`,
    );
  });

  test("webhook で Plus 化 → isGroupPlus ゲート (期限で開閉) → UI 解約で Free", async ({
    page,
  }) => {
    test.skip(
      STRIPE_ENABLED || WEBHOOK_SIG_ENABLED,
      "Stripe 設定済み環境では dev フォールバック (署名スキップ / DB のみ解約) が使えないためスキップ",
    );
    test.setTimeout(120_000);

    const subdomain = randomSubdomain();
    await createGroup(page, subdomain);
    const groupId = getGroupId(subdomain);
    const subscriptionId = `sub_e2e_${Date.now()}`;
    const futureEpoch = Math.floor(Date.now() / 1000) + 30 * 24 * 3600;
    const pastEpoch = Math.floor(Date.now() / 1000) - 24 * 3600;

    // ---- 1. created (active / 期限未来) → Plus ----
    await postSubscriptionEvent(page, "customer.subscription.created", {
      id: subscriptionId,
      status: "active",
      customer: "cus_e2e_plus",
      current_period_end: futureEpoch,
      metadata: { groupId },
    });

    await page.goto(`/group/${subdomain}/admin/billing`);
    await expect(page.getByTestId("billing-plan-badge")).toHaveText("Plus");
    await expect(page.getByTestId("billing-expires")).toBeVisible();
    await expect(page.getByTestId("billing-cancel-button")).toBeVisible();

    // ---- 2. updated (期限過去) → isGroupPlus=false → Free 表示 (ゲートが閉じる) ----
    await postSubscriptionEvent(page, "customer.subscription.updated", {
      id: subscriptionId,
      status: "active",
      customer: "cus_e2e_plus",
      current_period_end: pastEpoch,
      metadata: { groupId },
    });

    await page.goto(`/group/${subdomain}/admin/billing`);
    await expect(page.getByTestId("billing-plan-badge")).toHaveText("Free");
    await expect(page.getByTestId("billing-expired-note")).toBeVisible();

    // ---- 3. updated (期限未来) → Plus に戻す → UI から解約 → Free ----
    await postSubscriptionEvent(page, "customer.subscription.updated", {
      id: subscriptionId,
      status: "active",
      customer: "cus_e2e_plus",
      current_period_end: futureEpoch,
      metadata: { groupId },
    });

    await page.goto(`/group/${subdomain}/admin/billing`);
    await expect(page.getByTestId("billing-plan-badge")).toHaveText("Plus");

    await Promise.all([
      page.waitForURL(/billing=canceled_plan/),
      page.getByTestId("billing-cancel-button").click(),
    ]);
    await expect(page.getByTestId("billing-toast")).toBeVisible();
    await expect(page.getByTestId("billing-plan-badge")).toHaveText("Free");
    await expect(page.getByTestId("billing-cancel-button")).toHaveCount(0);
  });
});
