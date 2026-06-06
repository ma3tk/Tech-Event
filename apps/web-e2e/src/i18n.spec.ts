/**
 * i18n (日本語/英語) スモーク E2E。
 *
 * - `?lang=en` を付けてアクセスするとヘッダのナビが英語になり、cookie が保存される
 * - cookie 切替後、再ロード (`?lang=` 無し) しても英語が維持される
 * - `?lang=ja` で日本語に戻せる
 */
import { test, expect } from "@playwright/test";

test.describe("i18n: 言語切替 (ja/en)", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  // i18n 検証は header の nav リンク / LanguageSwitcher が常時可視な
  // desktop でのみ行う。mobile では同じ要素はハンバーガーメニュー内に
  // 隠れているため、本スイートの対象外とする (mobile-specific i18n は
  // 別途モバイルメニューの展開シナリオで担保すべき)。
  test.beforeEach(async ({}, testInfo) => {
    test.skip(
      testInfo.project.name === "chromium-mobile",
      "本スイートは chromium-desktop 専用 (mobile では nav 要素が隠れる)",
    );
  });

  test("?lang=en で Header が英語化され、再ロードしても保持される", async ({
    page,
    context,
  }) => {
    // 1) ?lang=en で top へ
    await page.goto("/?lang=en", { waitUntil: "domcontentloaded" });

    // Header のナビ "Explore" が見える (日本語 "イベントを探す" ではない)
    const explore = page.getByRole("link", { name: /^Explore$/ });
    await expect(explore).toBeVisible();

    // ログインボタンも英語
    await expect(
      page.getByRole("link", { name: /^Log in$/ }).first(),
    ).toBeVisible();

    // cookie が保存されていることを確認
    const cookies = await context.cookies();
    const localeCookie = cookies.find((c) => c.name === "tech_event_locale");
    expect(localeCookie?.value).toBe("en");

    // 2) ?lang= なしで再ロードしても英語のまま
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("link", { name: /^Explore$/ }),
    ).toBeVisible();

    // 3) ?lang=ja で日本語に戻せる
    await page.goto("/?lang=ja", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("link", { name: "イベントを探す" }),
    ).toBeVisible();
  });

  test("Login ページの見出しが lang に応じて切り替わる", async ({ page }) => {
    await page.goto("/login?lang=en", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("login-title")).toHaveText(/Log in/i);

    await page.goto("/login?lang=ja", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("login-title")).toHaveText("ログイン");
  });

  test("LanguageSwitcher が Header に表示される", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("language-switcher").first()).toBeVisible();
  });
});
