/**
 * API キー管理 + 公開 API 書き込みエンドポイントの E2E。
 *
 * 検証項目:
 *  1. /settings/api-keys でキー発行 → 生キーが 1 回だけ表示 → 一覧に prefix →
 *     失効で「失効済み」になり API アクセスが 401 になる
 *  2. 発行キーで POST /api/v2/events → 201 (イベント作成成功)、
 *     続けて POST /api/v2/events/{id}/participants → 201 (ゲスト追加)。
 *     無効キーでは 401。
 *
 * 前提:
 *  - dev サーバ起動済み + `test_user` (prisma/seed-test-user.ts) 投入済み。
 *  - test_user はイベント作成対象のグループをテスト内で UI から新規作成する
 *    (create-flow.spec.ts と同じ規約。seed ユーザーのデータを汚さない)。
 *
 * DB 状態 (API キー / グループ / イベント作成) に依存するため serial mode。
 * 待機はすべて locator ベース (waitForTimeout 禁止)。
 */
import { test, expect } from "@playwright/test";
import { devLogin } from "./_helpers/auth";

const DEV_USER = "test_user";
const UA = "tech-event-e2e/1.0";

/** レート制限バイパス付きの API ヘッダ (dev のみ有効。public-api.spec.ts と同じ) */
function apiHeaders(apiKey: string): Record<string, string> {
  return {
    "X-API-Key": apiKey,
    "User-Agent": UA,
    "X-Test-Bypass-Rate-Limit": "1",
    "Content-Type": "application/json",
  };
}

/** ランダムな subdomain (create-flow.spec.ts と同じ生成規約) */
function randomSubdomain(): string {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 6);
  return `te-key-${ts}-${rnd}`.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

/** ISO 8601 文字列: 今日から +offsetDays (UTC) */
function plusDaysIso(offsetDays: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

/**
 * /settings/api-keys で write スコープ付きキーを UI から発行し、生キーを返す。
 */
async function issueApiKeyViaUi(
  page: import("@playwright/test").Page,
  name: string,
): Promise<string> {
  await page.goto("/settings/api-keys");
  await expect(page.getByTestId("api-key-create-form")).toBeVisible();

  await page.getByTestId("api-key-name").fill(name);
  await page.getByTestId("api-key-scope-write").check();
  await page.getByTestId("api-key-create-submit").click();

  // 生キーは発行直後のみ表示される
  await expect(page.getByTestId("api-key-raw")).toBeVisible();
  const rawKey = (await page.getByTestId("api-key-raw").textContent())?.trim();
  expect(rawKey).toBeTruthy();
  expect(rawKey!).toMatch(/^te_live_[0-9a-f]{64}$/);
  return rawKey!;
}

// API キー発行・失効・イベント作成が互いに DB 状態を共有するため serial
test.describe.configure({ mode: "serial" });

test.describe("API キー管理 + 書き込み API", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("キー発行 → 生キー 1 回表示 + prefix 一覧 → 失効 → 401", async ({
    page,
    request,
  }) => {
    const keyName = `e2e-revoke-${Date.now()}`;
    await devLogin(page, DEV_USER, { next: "/settings/api-keys" });

    const rawKey = await issueApiKeyViaUi(page, keyName);
    const prefix = rawKey.slice(0, 12);

    // 一覧: 発行したキーの行に prefix (先頭 12 文字) が表示される
    const row = page
      .locator('[data-testid^="api-key-row-"]')
      .filter({ hasText: keyName });
    await expect(row).toBeVisible();
    await expect(row.locator('[data-testid^="api-key-prefix-"]')).toHaveText(
      `${prefix}…`,
    );
    await expect(row.locator('[data-testid^="api-key-status-"]')).toHaveText(
      "有効",
    );

    // 発行キーで認証が通る (書き込みエンドポイントに空 body → 認証 OK / body 不正の 400)。
    // 既存 GET 群は env キー専用のまま (後方互換のため無変更) なので、
    // DB キーの有効性チェックは guardRequestWithDb を使う POST 側で行う。
    const authedRes = await request.post("/api/v2/events", {
      headers: apiHeaders(rawKey),
      data: {},
    });
    expect(authedRes.status()).toBe(400);
    const authedBody = (await authedRes.json()) as { error: string };
    expect(authedBody.error).toBe("bad_request");

    // 失効
    await row.locator('[data-testid^="api-key-revoke-"]').click();
    await expect(row.locator('[data-testid^="api-key-status-"]')).toHaveText(
      "失効済み",
    );

    // 失効後は同じキーが 401 になる
    const revokedRes = await request.post("/api/v2/events", {
      headers: apiHeaders(rawKey),
      data: {},
    });
    expect(revokedRes.status()).toBe(401);
  });

  test("発行キーで POST /api/v2/events → 201 + ゲスト追加、無効キー → 401", async ({
    page,
    request,
  }) => {
    test.setTimeout(90_000);

    // ---- 1. test_user でグループ作成 (owner になる) ----
    const subdomain = randomSubdomain();
    const groupName = `E2E API Key Group ${subdomain}`;
    await devLogin(page, DEV_USER, { next: "/group/create" });
    await expect(page.getByTestId("group-create-form")).toBeVisible();
    await page.locator("input#subdomain").fill(subdomain);
    await page.locator("input#name").fill(groupName);
    await Promise.all([
      page.waitForURL(new RegExp(`/group/${subdomain}$`)),
      page.getByTestId("group-create-submit").click(),
    ]);

    // group_id を公開 API (env キー) から取得 — env キーは従来通り有効 (後方互換)
    const groupsRes = await request.get(
      `/api/v2/groups/?subdomain=${subdomain}`,
      { headers: apiHeaders("dev-public-api-key-please-change") },
    );
    expect(groupsRes.status()).toBe(200);
    const groupsBody = (await groupsRes.json()) as {
      groups: { id: number }[];
    };
    expect(groupsBody.groups.length).toBe(1);
    const groupId = groupsBody.groups[0]!.id;

    // ---- 2. write スコープ付きキーを発行 ----
    const rawKey = await issueApiKeyViaUi(page, `e2e-write-${Date.now()}`);

    // ---- 3. 発行キーで POST /api/v2/events → 201 ----
    const title = `E2E API Created Event ${Date.now()}`;
    const createRes = await request.post("/api/v2/events", {
      headers: apiHeaders(rawKey),
      data: {
        group_id: groupId,
        title,
        catch: "API キー経由で作成",
        description: "POST /api/v2/events の E2E テストで作成されたイベント",
        started_at: plusDaysIso(7, 10),
        ended_at: plusDaysIso(7, 12),
        limit: 20,
        status: "published",
      },
    });
    expect(createRes.status()).toBe(201);
    const created = (await createRes.json()) as {
      id: number;
      title: string;
      group: { id: number; subdomain: string };
      open_status: string;
      accepted: number;
    };
    expect(created.title).toBe(title);
    expect(typeof created.id).toBe("number");
    expect(created.group.id).toBe(groupId);
    expect(created.group.subdomain).toBe(subdomain);
    expect(created.accepted).toBe(0);

    // ---- 4. POST /api/v2/events/{id}/participants でゲスト追加 → 201 ----
    const addRes = await request.post(
      `/api/v2/events/${created.id}/participants`,
      {
        headers: apiHeaders(rawKey),
        data: { nickname: DEV_USER },
      },
    );
    expect(addRes.status()).toBe(201);
    const participant = (await addRes.json()) as {
      event_id: number;
      nickname: string;
      status: string;
    };
    expect(participant.event_id).toBe(created.id);
    expect(participant.nickname).toBe(DEV_USER);
    expect(participant.status).toBe("accepted");

    // 同じユーザーの重複追加は 409
    const dupRes = await request.post(
      `/api/v2/events/${created.id}/participants`,
      {
        headers: apiHeaders(rawKey),
        data: { nickname: DEV_USER },
      },
    );
    expect(dupRes.status()).toBe(409);

    // ---- 5. 無効キー (未発行の te_live_...) では 401 ----
    const bogusKey = `te_live_${"0".repeat(64)}`;
    const unauthorizedRes = await request.post("/api/v2/events", {
      headers: apiHeaders(bogusKey),
      data: {
        group_id: groupId,
        title: "should not be created",
        started_at: plusDaysIso(8, 10),
        ended_at: plusDaysIso(8, 12),
      },
    });
    expect(unauthorizedRes.status()).toBe(401);

    // ---- 6. env キー (userId なし / read 専用) では write 不可 = 403 ----
    const envKeyRes = await request.post("/api/v2/events", {
      headers: apiHeaders("dev-public-api-key-please-change"),
      data: {
        group_id: groupId,
        title: "should not be created either",
        started_at: plusDaysIso(8, 10),
        ended_at: plusDaysIso(8, 12),
      },
    });
    expect(envKeyRes.status()).toBe(403);
  });
});
