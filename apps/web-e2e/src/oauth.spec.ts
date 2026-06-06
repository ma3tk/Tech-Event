/**
 * OAuth (next-auth v5 / Auth.js) ログインの E2E。
 *
 * 検証範囲:
 *   1. /login に 3 つの OAuth ボタン (Twitter / Facebook / GitHub) が描画される
 *   2. それぞれを submit すると `/api/auth/signin/<provider>` へ POST されることを確認
 *      (実際の OAuth Provider へのリダイレクトは Client ID/Secret 未設定 dev 環境では
 *       完走しないため、初手のリダイレクト発火だけを観測する)
 *
 * NOTE:
 *   実 OAuth provider との通信はモックせず、ボタンの存在 / 送信先 URL の確認に留める。
 *   Auth.js v5 では `signIn(provider)` Server Action が `/api/auth/signin/<provider>`
 *   への遷移を起こす設計になっており、Provider のクライアント設定が無くても
 *   一旦そこまでは進む。
 */
import { test, expect } from "@playwright/test";

const PROVIDERS: Array<"twitter" | "facebook" | "github"> = [
  "twitter",
  "facebook",
  "github",
];

test.describe("OAuth ログインボタン", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("ログインページに 3 つの OAuth ボタンが表示される", async ({ page }) => {
    await page.goto("/login");
    for (const p of PROVIDERS) {
      const btn = page.getByTestId(`oauth-signin-${p}`);
      await expect(btn).toBeVisible();
    }
    // 既存ログイン手段が壊れていないことの確認
    await expect(page.getByLabel("パスワード")).toBeVisible();
    await expect(page.getByTestId("magic-link-section")).toBeVisible();
  });

  test("各 OAuth ボタンクリックで `/api/auth/signin/<provider>` へ遷移する", async ({
    page,
  }) => {
    for (const p of PROVIDERS) {
      await page.goto("/login");
      const btn = page.getByTestId(`oauth-signin-${p}`);
      await expect(btn).toBeVisible();

      // Server Action は最終的に NextAuth.js のサインインフローへ進む。
      // dev 環境では Provider 側の clientId が無いため completing redirect は
      // 期待しないが、`/api/auth/signin/<provider>` へ向けたリクエストが
      // 発生することは観測できる。
      const signinReqPromise = page.waitForRequest(
        (req) =>
          req.url().includes(`/api/auth/signin/${p}`) ||
          req.url().includes(`/api/auth/callback/${p}`),
        { timeout: 10_000 },
      );

      // クリック (フォーム submit を起こすがエラーで止まる場合があるので catch)
      await btn.click().catch(() => undefined);

      try {
        const req = await signinReqPromise;
        expect(req.url()).toContain(`/api/auth/`);
      } catch (e) {
        // Server Action 経由だと waitForRequest が拾えないことがあるので、
        // 最終 URL が provider 関連エンドポイントに進んでいるかフォールバック確認。
        const finalUrl = page.url();
        expect(
          finalUrl.includes("/api/auth/") || finalUrl.includes(p),
          `expected redirect to provider ${p}, got ${finalUrl}: ${e instanceof Error ? e.message : ""}`,
        ).toBeTruthy();
      }
    }
  });

  test("/api/auth/providers が 3 プロバイダ + credentials を返す", async ({
    request,
  }) => {
    // Auth.js v5 はこの endpoint で provider 一覧を返す
    const res = await request.get("/api/auth/providers");
    expect(res.status()).toBe(200);
    const body = (await res.json()) as Record<
      string,
      { id: string; name: string; type: string }
    >;
    expect(body.twitter?.id).toBe("twitter");
    expect(body.facebook?.id).toBe("facebook");
    expect(body.github?.id).toBe("github");
    expect(body.credentials?.id).toBe("credentials");
  });
});
