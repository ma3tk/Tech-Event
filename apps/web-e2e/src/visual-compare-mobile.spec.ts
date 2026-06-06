/**
 * モバイル (chromium-mobile / iPhone 14 viewport) 用の視覚比較スイート。
 *
 * - 主要 7 ページのフルページスクショを `screenshots/mobile/clone/{slug}.png` に出力
 *   (`/`, `/explore`, `/event/1`, `/group/findy`, `/calendar/ai-developers`,
 *    `/discover`, `/bookmarks`)
 * - `toHaveScreenshot()` で各ページの視覚回帰ベースラインも保存
 *   (snapshots/mobile-{slug}.png)
 * - `/bookmarks` は認証必須なので dev-login (fast_moon_169) を通す
 *
 * デスクトッププロジェクトでは実行しない (mobile 専用)。
 */

import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const SCREENSHOT_DIR = path.join(
  process.cwd(),
  "screenshots",
  "mobile",
  "clone",
);

const DEV_USER = "fast_moon_169";

type Spec = {
  /** ファイル名 (拡張子なし) / snapshot キー */
  slug: string;
  /** 表示パス */
  url: string;
  /** 認証必須なら nickname */
  loginAs?: string;
  /** スクショ前に追加で待つロケータ (例: hero) */
  waitForTestId?: string;
};

const PAGES: Spec[] = [
  { slug: "top", url: "/" },
  { slug: "explore", url: "/explore" },
  { slug: "event-detail", url: "/event/1" },
  { slug: "group-detail", url: "/group/findy" },
  {
    slug: "calendar-ai",
    url: "/calendar/ai-developers",
    waitForTestId: "calendar-header",
  },
  { slug: "discover", url: "/discover", waitForTestId: "discover-page" },
  { slug: "bookmarks", url: "/bookmarks", loginAs: DEV_USER },
];

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

// 本スイートは chromium-mobile 専用。
// 他プロジェクトでは全テストをスキップ。
test.beforeEach(async ({}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-mobile",
    "本スイートは chromium-mobile (iPhone 14) 専用",
  );
});

for (const spec of PAGES) {
  test.describe(`mobile page: ${spec.slug}`, () => {
    test(`full-page スクショ ${spec.slug}.png を保存`, async ({
      page,
      context,
    }) => {
      await context.clearCookies();

      if (spec.loginAs) {
        await page.goto(
          `/api/auth/dev-login?nickname=${encodeURIComponent(
            spec.loginAs,
          )}&next=${encodeURIComponent(spec.url)}`,
          { waitUntil: "domcontentloaded" },
        );
        await page.waitForURL((u) => u.pathname.startsWith(spec.url));
      } else {
        await page.goto(spec.url, { waitUntil: "domcontentloaded" });
      }

      if (spec.waitForTestId) {
        await expect(page.getByTestId(spec.waitForTestId)).toBeVisible();
      } else {
        await expect(page.getByRole("banner")).toBeVisible();
      }

      // 画像の遅延ロード対策
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await page.waitForTimeout(300);

      const file = path.join(SCREENSHOT_DIR, `${spec.slug}.png`);
      await page.screenshot({ path: file, fullPage: true });
      expect(fs.existsSync(file), `${file} should exist`).toBe(true);
    });

    test(`視覚回帰ベースライン mobile-${spec.slug}.png`, async ({
      page,
      context,
    }) => {
      // CI (Linux) では darwin baseline しかないため skip。
      test.skip(
        process.env.CI === "true" && process.platform === "linux",
        "Linux 用 visual baseline 未生成のため CI では skip",
      );
      await context.clearCookies();
      if (spec.loginAs) {
        await page.goto(
          `/api/auth/dev-login?nickname=${encodeURIComponent(
            spec.loginAs,
          )}&next=${encodeURIComponent(spec.url)}`,
          { waitUntil: "domcontentloaded" },
        );
        await page.waitForURL((u) => u.pathname.startsWith(spec.url));
      } else {
        await page.goto(spec.url, { waitUntil: "domcontentloaded" });
      }

      if (spec.waitForTestId) {
        await expect(page.getByTestId(spec.waitForTestId)).toBeVisible();
      } else {
        await expect(page.getByRole("banner")).toBeVisible();
      }
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await page.waitForTimeout(300);

      // 視覚回帰: viewport 範囲だけを比較する (fullPage は時間/差分過多)
      // フォント/アイコンレンダリングや動的バッジで数千 px のずれが
      // 出ることがあるため、ピクセル比 5%, 絶対値 1 万 px までは許容する。
      await expect(page).toHaveScreenshot(`mobile-${spec.slug}.png`, {
        fullPage: false,
        animations: "disabled",
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 10000,
      });
    });
  });
}
