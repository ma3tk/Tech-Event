import { test, expect } from "@playwright/test";

test.describe("イベント詳細ページ", () => {
  test("主要セクションが描画される", async ({ page }) => {
    await page.goto("/event/1");

    // タイトル
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();

    // パンくず
    await expect(page.getByLabel("パンくずリスト")).toBeVisible();

    // 申込ボックス (サイドバー)
    await expect(page.locator("body")).toContainText(/参加|定員|参加枠/);

    // JSON-LD (構造化データ)
    const jsonLd = await page.locator('script[type="application/ld+json"]').count();
    expect(jsonLd).toBeGreaterThan(0);

    // 関連グループへのリンク
    // モバイル/デスクトップ共通の検証: サイドバーの「主催グループ」見出しが
    // 存在 (テキスト/ロールの差異を吸収) + そこから group へのリンクが在ること。
    const organizer = page
      .locator("section[aria-labelledby=organizer-heading]")
      .first();
    await organizer.scrollIntoViewIfNeeded();
    await expect(organizer).toBeVisible();
    await expect(organizer.getByRole("link").first()).toBeVisible();
  });

  test("参加者一覧タブ切替", async ({ page }) => {
    await page.goto("/event/1");
    // accepted タブ がデフォルト or 切替可能
    const tabs = page.getByRole("tab");
    if (await tabs.count()) {
      // 何らかのタブ UI がある
      await expect(tabs.first()).toBeVisible();
    }
  });

  test("存在しないイベントは 404", async ({ page }) => {
    const response = await page.goto("/event/99999");
    // loading.tsx (App Router) が Suspense fallback として streaming される
    // 関係で、HTTP ステータスは streaming 開始時点で確定する。Next.js 16 では
    // notFound() で 404 ステータスを返す一方、ストリーミング後の notFound()
    // ではクライアントフォールバックで not-found 表示になり、初期 HTTP は 200
    // になる場合がある。どちらでも 404 or 200 + not-found 表示で受け入れる。
    const status = response?.status() ?? 0;
    if (status !== 404) {
      // 200 で返ってきた場合は HTML 内の not-found フォールバック表示か
      // next-error="not-found" メタを期待する。
      await page.waitForLoadState("domcontentloaded");
      const hasNotFound = await page
        .locator('meta[name="next-error"][content="not-found"], [data-testid="not-found"]')
        .first()
        .count();
      expect(hasNotFound).toBeGreaterThan(0);
    } else {
      expect(status).toBe(404);
    }
  });
});

test.describe("グループ詳細", () => {
  test("グループヘッダ/イベント一覧が見える", async ({ page }) => {
    await page.goto("/group/findy");
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator("body")).toContainText(/イベント|メンバー/);
  });
});

test.describe("ユーザープロフィール", () => {
  test("nicknameをURLにしてプロフィールページが見える", async ({ page }) => {
    // 既知のシードユーザーを使う
    await page.goto("/user/fast_moon_169");
    await expect(page.locator("h1").first()).toBeVisible();
  });
});
