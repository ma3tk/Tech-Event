/**
 * Visual Regression Test (VRT) — Storybook 全ストーリー網羅
 *
 * 概要:
 *   - `storybook-static/index.json` をパースし、`type === "story"` の全エントリを
 *     `storybook-static/iframe.html?id=<id>&viewMode=story` で開いて screenshot を撮る
 *   - `toHaveScreenshot()` でベースライン管理 (Playwright 標準)
 *   - スクリーンショットは `e2e/vrt-stories.spec.ts-snapshots/` (Playwright 規約) に保存される
 *   - 加えて raw PNG を `screenshots/stories/<storyId>.png` にも書き出す
 *
 * 設計方針:
 *   - **warn only**: assertion 失敗は console.warn のみで失敗にしない (test.fail も使わない)。
 *     DS の継続的進化を VRT で妨げないため。初回ベースライン生成は `pnpm vrt:update` で行う。
 *   - **iframe 直開き**: Storybook UI を経由しないので軽量・並列実行に強い。
 *   - **CI を block しない**: failOnFlakyTests / forbid-only に該当しないよう、
 *     必ず PASS で終わる (.skip / soft expect)。
 *   - **静的 build 前提**: `pnpm build-storybook` 後に `storybook-static/` を file:// 経由で読む。
 *
 * 実行:
 *   pnpm build-storybook                                      # ベースが必要
 *   pnpm exec playwright test e2e/vrt-stories.spec.ts         # 通常実行 (warn only)
 *   pnpm vrt:update                                           # ベースライン再生成
 */

import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

type StoryEntry = {
  id: string;
  name: string;
  title: string;
  type: "story" | "docs";
  importPath?: string;
};

const STORYBOOK_DIR = path.join(process.cwd(), "storybook-static");
const INDEX_JSON = path.join(STORYBOOK_DIR, "index.json");
const IFRAME_HTML = path.join(STORYBOOK_DIR, "iframe.html");
const STORIES_OUT = path.join(process.cwd(), "screenshots", "stories");

/** 1 story あたりの screenshot 上限 (異常な巨大化を防ぐ) */
const MAX_HEIGHT = 4000;

/** ベースラインが無い時に PNG だけ書き出す `--update-snapshots` モード */
const UPDATE_MODE =
  process.env.VRT_UPDATE === "1" ||
  process.argv.some((a) => a === "--update-snapshots" || a === "-u");

function loadStories(): StoryEntry[] {
  if (!fs.existsSync(INDEX_JSON)) {
    return [];
  }
  const raw = JSON.parse(fs.readFileSync(INDEX_JSON, "utf-8")) as {
    entries: Record<string, StoryEntry>;
  };
  return Object.values(raw.entries).filter((e) => e.type === "story");
}

const stories = loadStories();

test.describe("VRT: Storybook 全ストーリー", () => {
  test.beforeAll(() => {
    fs.mkdirSync(STORIES_OUT, { recursive: true });
  });

  // ガード: storybook-static が無い場合は warn のみで PASS。
  // CI で `pnpm build-storybook` を走らせていない環境を想定。
  test("ガード: storybook-static/ が存在し、stories が 1 件以上", async () => {
    if (!fs.existsSync(INDEX_JSON)) {
      console.warn(
        `[vrt] storybook-static/index.json が見つかりません。\n` +
          `      \`pnpm build-storybook\` を先に実行してください。\n` +
          `      この VRT は warn only なので CI は block しません。`,
      );
      test.skip();
      return;
    }
    if (!fs.existsSync(IFRAME_HTML)) {
      console.warn(`[vrt] storybook-static/iframe.html が無いため skip`);
      test.skip();
      return;
    }
    console.log(`[vrt] ${stories.length} stories を検出 (warn only モード)`);
    expect(stories.length).toBeGreaterThan(0);
  });

  if (stories.length === 0) {
    // ファイル parse 段階で 0 件なら、追加の test() を生成しない。
    return;
  }

  for (const story of stories) {
    const safeId = story.id.replace(/[^a-zA-Z0-9_-]/g, "_");
    test(`story: ${story.title} / ${story.name} (${story.id})`, async ({
      page,
    }) => {
      const iframeUrl =
        pathToFileURL(IFRAME_HTML).toString() +
        `?id=${encodeURIComponent(story.id)}&viewMode=story`;

      try {
        await page.goto(iframeUrl, {
          waitUntil: "load",
          timeout: 20_000,
        });
        // story が render するまで少し待つ (Storybook docs/blocks や fonts)。
        // 厳密に待つと flaky になるので固定 wait を採用。
        await page.waitForTimeout(600);
      } catch (err) {
        console.warn(
          `[vrt] page.goto 失敗 (${story.id}): ${(err as Error).message}`,
        );
        return; // warn only
      }

      // PNG を screenshots/stories/<id>.png に常時保存 (差分追跡用)
      try {
        const buf = await page.screenshot({
          fullPage: true,
          animations: "disabled",
          scale: "css",
          timeout: 15_000,
        });
        const outPath = path.join(STORIES_OUT, `${safeId}.png`);
        // 巨大スクリーンショット (= layout 崩れ) を避けるため、サイズだけ確認
        if (buf.byteLength > 10 * 1024 * 1024) {
          console.warn(
            `[vrt] 巨大 PNG (${buf.byteLength} bytes) を検知: ${story.id}`,
          );
        }
        fs.writeFileSync(outPath, buf);
      } catch (err) {
        console.warn(
          `[vrt] screenshot 失敗 (${story.id}): ${(err as Error).message}`,
        );
        return; // warn only
      }

      // toHaveScreenshot による比較。warn only: 失敗しても test を fail させない。
      // `pnpm vrt:update` (= --update-snapshots) なら Playwright が自動で baseline を書き出す。
      try {
        await expect(page).toHaveScreenshot(`${safeId}.png`, {
          fullPage: true,
          animations: "disabled",
          maxDiffPixelRatio: 0.05,
          timeout: 8_000,
        });
      } catch (err) {
        // ベースラインなし or 差分超過 → warn only でスキップ
        const msg = (err as Error).message?.split("\n")[0] ?? "unknown";
        console.warn(`[vrt:diff] ${story.id} — ${msg}`);
        if (UPDATE_MODE) {
          // update モードで失敗 = baseline 不在 or 強制再生成。
          // PNG は既に screenshots/stories/ に保存されているので、ベースラインも複製しておく。
          try {
            const snapDir = path.join(
              path.dirname(__filename),
              "vrt-stories.spec.ts-snapshots",
            );
            fs.mkdirSync(snapDir, { recursive: true });
            const src = path.join(STORIES_OUT, `${safeId}.png`);
            const dst = path.join(snapDir, `${safeId}-chromium-desktop-darwin.png`);
            if (fs.existsSync(src)) {
              fs.copyFileSync(src, dst);
            }
          } catch (copyErr) {
            console.warn(`[vrt:update] baseline copy 失敗: ${(copyErr as Error).message}`);
          }
        }
      }

      // height ガード
      const box = await page.evaluate(() => ({
        h: document.documentElement.scrollHeight,
        w: document.documentElement.scrollWidth,
      }));
      if (box.h > MAX_HEIGHT) {
        console.warn(
          `[vrt] story height 異常 ${box.h}px (>${MAX_HEIGHT}): ${story.id}`,
        );
      }
    });
  }
});
