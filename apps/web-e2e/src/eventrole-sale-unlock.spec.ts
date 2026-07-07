/**
 * 参加枠の販売期間 (Early Bird) / Unlock Code (招待コード限定枠) E2E
 *
 * 前提:
 *   - dev サーバが http://localhost:3000 で起動済み
 *   - E2E 用固定ユーザー `test_user` (prisma/seed-test-user.ts) が存在する
 *
 * 検証:
 *   0. (setup) test_user でグループ + イベントを作成
 *      - 枠 0「Early Bird」: saleEndsAt が過去 (= 販売期間外)
 *      - 枠 1「招待枠」: unlockCode 設定
 *   1. 販売期間外の枠は /event/{id}/apply で「販売期間外」表示 + 申込ボタン無効化
 *   2. Unlock Code 不一致 → error=unlock で弾かれ、申込されない
 *   3. Unlock Code 一致 → 申込成功 (参加確定)
 *
 * DB 状態 (作成イベント / role id) をテスト間で共有するため serial mode。
 * role id は dev.db (better-sqlite3, readonly) から引く (auth ヘルパーと同じ流儀)。
 */
import path from "node:path";

import { test, expect } from "@playwright/test";
import Database from "better-sqlite3";

import { devLogin } from "./_helpers/auth";
import { clickUntil } from "./_helpers/actions";

test.describe.configure({ mode: "serial" });

const DEV_USER = "test_user";
const UNLOCK_CODE = "E2E-UNLOCK-SECRET";
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
  return `te-su-${ts}-${rnd}`.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

/** dev.db から該当イベントの role を displayOrder 順に引く */
function fetchRoleIds(eventId: string): { name: string; id: string }[] {
  const db = new Database(DEV_DB_PATH, { readonly: true });
  try {
    const rows = db
      .prepare(
        "SELECT id, name FROM event_roles WHERE eventId = ? ORDER BY displayOrder ASC",
      )
      .all(BigInt(eventId)) as { id: number | bigint; name: string }[];
    return rows.map((r) => ({ id: String(r.id), name: r.name }));
  } finally {
    db.close();
  }
}

// serial mode (同一 worker) 前提でテスト間共有するモジュール変数
let eventId = "";
let earlyBirdRoleId = "";
let unlockRoleId = "";

test.describe("参加枠の販売期間 / Unlock Code", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("setup: 販売期間外枠 + 招待コード枠つきイベントを作成", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    const subdomain = randomSubdomain();
    const groupName = `E2E SaleUnlock ${subdomain}`;
    const eventTitle = `E2E Sale/Unlock Event ${Date.now()}`;

    // ---- グループ作成 ----
    await devLogin(page, DEV_USER, { next: "/group/create" });
    await expect(page.getByTestId("group-create-form")).toBeVisible();
    await page.locator("input#subdomain").fill(subdomain);
    await page.locator("input#name").fill(groupName);
    await Promise.all([
      page.waitForURL(new RegExp(`/group/${subdomain}$`)),
      page.getByTestId("group-create-submit").click(),
    ]);

    // ---- イベント作成 ----
    await page.goto(`/event/create?group=${subdomain}`);
    await expect(page.getByTestId("event-create-form")).toBeVisible();
    await page.locator("input#title").fill(eventTitle);
    await page.locator("input#startedAt").fill(plusDaysLocal(14, 19, 0));
    await page.locator("input#endedAt").fill(plusDaysLocal(14, 21, 0));

    // 枠 0: Early Bird (販売終了が昨日 = 販売期間外)
    await page.locator("input[name='eventRole[0].name']").fill("Early Bird");
    await page.locator("input[name='eventRole[0].capacity']").fill("10");
    await page
      .getByTestId("event-role-0-sale-ends-at")
      .fill(plusDaysLocal(-1, 12, 0));

    // 枠 1: 招待枠 (unlockCode 設定)
    await page.locator("input[name='eventRole[1].name']").fill("招待枠");
    await page.locator("input[name='eventRole[1].capacity']").fill("10");
    await page.getByTestId("event-role-1-unlock-code").fill(UNLOCK_CODE);

    // 公開して /event/{id} へ遷移
    await Promise.all([
      page.waitForURL(/\/event\/\d+$/),
      page.getByTestId("event-publish").click(),
    ]);
    const m = page.url().match(/\/event\/(\d+)/);
    expect(m).not.toBeNull();
    eventId = m![1]!;

    // role id を dev.db から解決
    const roles = fetchRoleIds(eventId);
    const earlyBird = roles.find((r) => r.name === "Early Bird");
    const unlockRole = roles.find((r) => r.name === "招待枠");
    expect(earlyBird, "Early Bird 枠が作成されている").toBeTruthy();
    expect(unlockRole, "招待枠が作成されている").toBeTruthy();
    earlyBirdRoleId = earlyBird!.id;
    unlockRoleId = unlockRole!.id;
  });

  test("販売期間外の枠は申込不可 (販売期間外表示 + ボタン無効化)", async ({
    page,
  }) => {
    expect(eventId, "setup でイベントが作成済み").not.toBe("");

    await devLogin(page, DEV_USER, {
      next: `/event/${eventId}/apply?eventRoleId=${earlyBirdRoleId}`,
      skipWaitForUrl: true,
    });

    // 「販売期間外」アラートが表示される
    await expect(page.getByTestId("apply-sale-closed")).toBeVisible();
    await expect(page.getByTestId("apply-sale-closed")).toContainText(
      "販売期間外",
    );

    // 申込ボタンは無効化されている
    const submit = page.getByTestId("apply-submit");
    await expect(submit).toBeVisible();
    await expect(submit).toBeDisabled();
    await expect(submit).toContainText("販売期間外");
  });

  test("Unlock Code 不一致では申込できない", async ({ page }) => {
    expect(eventId, "setup でイベントが作成済み").not.toBe("");

    await devLogin(page, DEV_USER, {
      next: `/event/${eventId}/apply?eventRoleId=${unlockRoleId}`,
      skipWaitForUrl: true,
    });

    // 招待コード入力欄が表示される
    const codeInput = page.getByTestId("apply-unlock-code");
    await expect(codeInput).toBeVisible();

    // 不一致コードで送信 → error=unlock で apply に戻される
    await codeInput.fill("WRONG-CODE");
    await clickUntil(page.getByTestId("apply-submit"), async () => {
      await expect(page.getByTestId("apply-unlock-error")).toBeVisible();
    });
    await expect(page.getByTestId("apply-unlock-error")).toContainText(
      "招待コードが一致しません",
    );

    // 申込されていない (イベントページに参加ステータスが無い)
    await page.goto(`/event/${eventId}`);
    await expect(page.getByTestId("event-detail-root")).toBeVisible();
    await expect(page.getByTestId("my-participation-status")).toBeHidden();
  });

  test("Unlock Code 一致で申込できる", async ({ page }) => {
    expect(eventId, "setup でイベントが作成済み").not.toBe("");

    await devLogin(page, DEV_USER, {
      next: `/event/${eventId}/apply?eventRoleId=${unlockRoleId}`,
      skipWaitForUrl: true,
    });

    const codeInput = page.getByTestId("apply-unlock-code");
    await expect(codeInput).toBeVisible();

    // 一致コードで送信 → 申込成功 → /event/{id}?applied=1 へ
    await codeInput.fill(UNLOCK_CODE);
    await clickUntil(page.getByTestId("apply-submit"), async () => {
      await expect(page.getByTestId("my-participation-status")).toBeVisible();
    });
    await expect(page.getByTestId("my-participation-status")).toContainText(
      "参加確定中",
    );

    // 後始末: 参加をキャンセルして test_user を未参加状態に戻す
    const cancelBtn = page.getByRole("button", { name: "参加をキャンセル" });
    await clickUntil(cancelBtn, async () => {
      await expect(page.getByTestId("my-participation-status")).toBeHidden();
    });
  });
});
