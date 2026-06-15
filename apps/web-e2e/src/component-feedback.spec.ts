/**
 * Component Feedback サブシステム E2E。
 *
 * - POST /api/component-feedback: Zod 検証 / 保存 / CORS preflight
 * - /admin/component-feedback: 未ログインは /login へ、ログイン中は集計表示
 *
 * 投稿経路は Storybook (別オリジン) の HTML フォームだが、ここでは API を直接叩いて
 * バックエンド契約を固定する。
 */
import { test, expect } from "@playwright/test";
import { devLoginLegacy as devLogin } from "./_helpers/auth";

const DEV_USER = "test_user";

test.describe("Component Feedback API", () => {
  test("正規 POST → 201 で保存される", async ({ request }) => {
    const res = await request.post("/api/component-feedback", {
      data: {
        component: "Button",
        rating: 5,
        comment: "E2E からの投稿",
        sourceUrl: "http://localhost:6006/x",
      },
    });
    expect(res.status()).toBe(201);
    const body = (await res.json()) as { ok?: boolean; id?: string };
    expect(body.ok).toBe(true);
    expect(body.id).toBeTruthy();
  });

  test("rating 範囲外 → 400 (Zod)", async ({ request }) => {
    const res = await request.post("/api/component-feedback", {
      data: { component: "Button", rating: 9 },
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { ok?: boolean };
    expect(body.ok).toBe(false);
  });

  test("component 欠落 → 400", async ({ request }) => {
    const res = await request.post("/api/component-feedback", {
      data: { rating: 3 },
    });
    expect(res.status()).toBe(400);
  });

  test("OPTIONS preflight → CORS ヘッダを返す", async ({ request }) => {
    const res = await request.fetch("/api/component-feedback", {
      method: "OPTIONS",
      headers: { Origin: "http://localhost:6006" },
    });
    expect(res.status()).toBe(204);
    expect(res.headers()["access-control-allow-origin"]).toBe(
      "http://localhost:6006",
    );
  });
});

test.describe("Component Feedback 管理画面", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("未ログインは /login へリダイレクト", async ({ page }) => {
    await page.goto("/admin/component-feedback");
    await expect(page).toHaveURL(/\/login/);
  });

  test("ログイン中は集計が表示される", async ({ page }) => {
    await devLogin(page, DEV_USER, "/admin/component-feedback");
    await expect(
      page.getByRole("heading", { name: "コンポーネントフィードバック" }),
    ).toBeVisible();
    await expect(page.getByText("コンポーネント別サマリ")).toBeVisible();
  });
});
