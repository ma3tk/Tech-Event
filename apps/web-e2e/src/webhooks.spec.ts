/**
 * Outbound Webhook 管理 E2E
 *
 * 前提:
 *   - dev サーバが http://localhost:3000 で起動済み (webServer 設定で自動起動)
 *   - 専用ユーザー `test_user` (prisma/seed-test-user.ts) でログインする
 *
 * 検証:
 *   1. グループ作成 → /group/<subdomain>/admin/webhooks でエンドポイント追加
 *      → 一覧表示 (URL / 購読イベント / 有効) → 無効化 → 削除で空に戻る
 *   2. SSRF 防御: private IP / localhost 宛の URL は拒否され、一覧に追加されない
 *
 * 実配信 (HTTP POST) はローカル受信サーバが必要なため対象外とし、
 * エンドポイント CRUD の DB 記録が UI に反映されることを検証する。
 */
import { test, expect, type Page } from "@playwright/test";
import { devLogin } from "./_helpers/auth";

const DEV_USER = "test_user";

/** ランダムな subdomain を生成 (3-63 文字, [a-z0-9-]) */
function randomSubdomain(): string {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 6);
  return `wh-${ts}-${rnd}`.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

/** test_user でログインしてグループを 1 つ作成し、webhooks 管理ページを開く */
async function createGroupAndOpenWebhooks(
  page: Page,
  subdomain: string,
): Promise<void> {
  await devLogin(page, DEV_USER, {
    next: "/group/create",
    skipWaitForUrl: true,
  });
  await page.waitForURL(/\/group\/create/);
  await expect(page.getByTestId("group-create-form")).toBeVisible();

  await page.locator("input#subdomain").fill(subdomain);
  await page.locator("input#name").fill(`Webhook E2E Group ${subdomain}`);

  await Promise.all([
    page.waitForURL(new RegExp(`/group/${subdomain}$`)),
    page.getByTestId("group-create-submit").click(),
  ]);

  await page.goto(`/group/${subdomain}/admin/webhooks`);
  await expect(page.getByTestId("group-webhooks-heading")).toBeVisible();
}

test.describe("Outbound Webhook 管理", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("エンドポイント追加 → 一覧表示 → 無効化 → 削除で空に戻る", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const subdomain = randomSubdomain();
    await createGroupAndOpenWebhooks(page, subdomain);

    // ============ 1. 初期は空 ============
    await expect(page.getByTestId("group-webhooks-heading")).toContainText(
      "0件",
    );
    await expect(page.getByTestId("webhook-empty")).toBeVisible();

    // ============ 2. エンドポイント追加 (両イベント購読) ============
    const url = `https://example.com/hooks/e2e-${subdomain}`;
    await page.getByTestId("webhook-add-url").fill(url);
    await expect(
      page.getByTestId("webhook-add-event-guest.registered"),
    ).toBeChecked();
    await expect(
      page.getByTestId("webhook-add-event-event.published"),
    ).toBeChecked();
    await Promise.all([
      page.waitForURL(/toast=webhook-created/),
      page.getByTestId("webhook-add-submit").click(),
    ]);

    await expect(page.getByTestId("webhook-toast")).toBeVisible();
    await expect(page.getByTestId("group-webhooks-heading")).toContainText(
      "1件",
    );
    const table = page.getByTestId("group-webhooks-table");
    await expect(table).toContainText(url);
    await expect(table).toContainText("guest.registered");
    await expect(table).toContainText("event.published");

    const row = page.locator('[data-testid^="webhook-row-"]');
    await expect(row).toHaveCount(1);
    const endpointId = (await row.getAttribute("data-testid"))!.replace(
      "webhook-row-",
      "",
    );
    await expect(
      page.getByTestId(`webhook-active-${endpointId}`),
    ).toHaveText("有効");

    // ============ 3. 無効化 ============
    await Promise.all([
      page.waitForURL(/toast=webhook-toggled/),
      page.getByTestId(`webhook-toggle-${endpointId}`).click(),
    ]);
    await expect(
      page.getByTestId(`webhook-active-${endpointId}`),
    ).toHaveText("無効");

    // ============ 4. 削除 → 空状態に戻る ============
    await Promise.all([
      page.waitForURL(/toast=webhook-deleted/),
      page.getByTestId(`webhook-delete-${endpointId}`).click(),
    ]);
    await expect(page.getByTestId("webhook-empty")).toBeVisible();
    await expect(page.getByTestId("group-webhooks-heading")).toContainText(
      "0件",
    );
  });

  test("SSRF 防御: private IP / localhost 宛の URL は拒否される", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const subdomain = randomSubdomain();
    await createGroupAndOpenWebhooks(page, subdomain);

    const forbiddenUrls = [
      "http://169.254.169.254/latest/meta-data", // クラウドメタデータ
      "https://127.0.0.1/hook", // loopback IP
      "http://localhost:3000/hook", // localhost ホスト名
      "http://192.168.1.10/hook", // private IP (RFC1918)
    ];

    for (const url of forbiddenUrls) {
      await page.getByTestId("webhook-add-url").fill(url);
      await Promise.all([
        page.waitForURL(/error=/),
        page.getByTestId("webhook-add-submit").click(),
      ]);
      await expect(page.getByTestId("webhook-error")).toBeVisible();
      await expect(page.getByTestId("webhook-error")).toContainText(
        "登録できません",
      );
      // 一覧には追加されていない (DB に記録されない)
      await expect(page.getByTestId("webhook-empty")).toBeVisible();
      await expect(page.getByTestId("group-webhooks-heading")).toContainText(
        "0件",
      );
    }
  });
});
