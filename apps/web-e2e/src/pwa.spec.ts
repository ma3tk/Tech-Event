/**
 * PWA 対応の E2E。
 *
 * - /manifest.webmanifest が 200 + 必須フィールド (name / short_name /
 *   start_url / display / theme_color / background_color / icons 192+512)
 * - /sw.js が 200 + キャッシュロジック (caches.open / offline.html /
 *   バージョン付きキャッシュ名 / activate での旧キャッシュ削除) を含む
 * - /offline.html が 200 でブランドページを返す
 * - トップページの <head> に manifest link + theme-color meta が出力される
 *
 * NOTE: Service Worker の実登録 (navigator.serviceWorker.register) は
 *   production ビルド限定 + E2E 環境で不安定なため、ここでは
 *   manifest / 静的ファイル配信の検証を中心にする (タスク方針通り)。
 */
import { test, expect } from "@playwright/test";

interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

test.describe("PWA", () => {
  test("/manifest.webmanifest が 200 + 必須フィールドを含む", async ({
    request,
  }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.status()).toBe(200);

    // content-type に依存せず本文を JSON として検証する
    const manifest = JSON.parse(await res.text()) as {
      name: string;
      short_name: string;
      start_url: string;
      scope: string;
      display: string;
      theme_color: string;
      background_color: string;
      description: string;
      icons: ManifestIcon[];
    };

    expect(manifest.name).toContain("tech-event");
    expect(manifest.short_name).toBe("tech-event");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(manifest.background_color).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(manifest.description.length).toBeGreaterThan(0);

    // installability 要件: 192x192 と 512x512 のアイコン
    expect(Array.isArray(manifest.icons)).toBe(true);
    const sizes = manifest.icons.map((icon) => icon.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
    // maskable アイコンも 1 つ以上
    expect(
      manifest.icons.some((icon) => icon.purpose === "maskable"),
    ).toBe(true);

    // 参照先アイコンが実際に配信されること
    for (const icon of manifest.icons) {
      const iconRes = await request.get(icon.src);
      expect(iconRes.status(), `${icon.src} should be served`).toBe(200);
    }
  });

  test("/sw.js が 200 + キャッシュロジックを含む", async ({ request }) => {
    const res = await request.get("/sw.js");
    expect(res.status()).toBe(200);

    const contentType = res.headers()["content-type"] ?? "";
    expect(contentType).toContain("javascript");

    const body = await res.text();
    // precache + offline fallback
    expect(body).toContain("caches.open");
    expect(body).toContain("/offline.html");
    // install / activate / fetch の 3 イベントを扱う
    expect(body).toContain('addEventListener("install"');
    expect(body).toContain('addEventListener("activate"');
    expect(body).toContain('addEventListener("fetch"');
    // バージョン付きキャッシュ名 + 旧キャッシュ削除
    expect(body).toContain("VERSION");
    expect(body).toContain("caches.delete");
    // 情報漏洩防止: API に介入しない旨のガードが存在する
    expect(body).toContain("/api/");
  });

  test("/offline.html が 200 でオフラインページを返す", async ({
    request,
  }) => {
    const res = await request.get("/offline.html");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("オフラインです");
    expect(body).toContain("tech-event");
  });

  test("トップページの head に manifest link + theme-color meta が出力される", async ({
    page,
  }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute(
      "href",
      "/manifest.webmanifest",
    );

    // viewport export による theme-color meta (light/dark の 2 つ)
    const themeColorCount = await page
      .locator('meta[name="theme-color"]')
      .count();
    expect(themeColorCount).toBeGreaterThanOrEqual(1);
  });
});
