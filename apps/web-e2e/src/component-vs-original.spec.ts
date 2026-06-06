/**
 * クローンと本家 (connpass / luma) の "コンポーネント部分" を並列キャプチャするスイート。
 *
 * - 既存 `visual-compare.spec.ts` がページ全体の構造比較 (大局) を担うのに対し、
 *   こちらは個別コンポーネント単位での目視レポート用画像を生成する。
 * - 画像はピクセル差分しない (本家の実データと UI が違うため意味がない)。
 * - 出力先: `screenshots/components/comparison/{name}-{source}.png`
 *   - `clone`: tech-event 側
 *   - `connpass` / `luma`: それぞれの本家
 * - 本家の取得失敗 (ネットワーク不調, BOT 弾き) はテスト失敗にせず warn のみ。
 *   `screenshots/components/comparison/{name}-fetch.json` に取得ステータスを残す。
 */

import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const OUT_DIR = path.join(
  process.cwd(),
  "screenshots",
  "components",
  "comparison",
);

test.beforeAll(() => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
});

type Selector =
  | { kind: "css"; value: string }
  | { kind: "first-matching"; values: string[] };

type Target = {
  /** ファイル名 (英小文字) */
  name: string;
  /** クローン側の URL とセレクタ */
  clone: { url: string; selector: Selector };
  /** connpass 側の URL とセレクタ (省略可) */
  connpass?: { url: string; selector: Selector };
  /** luma 側の URL とセレクタ (省略可) */
  luma?: { url: string; selector: Selector };
};

/**
 * 比較対象のマッピング。
 * 本家のセレクタは構造が変わると壊れやすいので "first-matching" で複数候補を試す。
 */
const TARGETS: Target[] = [
  {
    name: "event-list-row",
    clone: {
      url: "/components",
      selector: { kind: "css", value: '[data-testid="section-event-list-row"]' },
    },
    connpass: {
      url: "https://connpass.com/",
      selector: {
        kind: "first-matching",
        values: [
          ".event_list .event",
          ".event_list",
          "main",
        ],
      },
    },
  },
  {
    name: "event-card-grid",
    clone: {
      url: "/components",
      selector: { kind: "css", value: '[data-testid="section-event-card"]' },
    },
    connpass: {
      url: "https://connpass.com/explore/",
      selector: {
        kind: "first-matching",
        values: [".event_list", "main"],
      },
    },
    luma: {
      url: "https://lu.ma/",
      selector: {
        kind: "first-matching",
        values: ["main", "body"],
      },
    },
  },
  {
    name: "pagination",
    clone: {
      url: "/components",
      selector: { kind: "css", value: '[data-testid="section-pagination"]' },
    },
    connpass: {
      url: "https://connpass.com/ranking/",
      selector: {
        kind: "first-matching",
        values: [".paging", "[class*='paging']", "main"],
      },
    },
  },
  {
    name: "breadcrumb",
    clone: {
      url: "/components",
      selector: { kind: "css", value: '[data-testid="section-breadcrumb"]' },
    },
    connpass: {
      url: "https://connpass.com/explore/",
      selector: {
        kind: "first-matching",
        values: [".breadcrumb", "[aria-label*='breadcrumb' i]", "main"],
      },
    },
  },
  {
    name: "tag-pill",
    clone: {
      url: "/components",
      selector: { kind: "css", value: '[data-testid="section-tag-pill"]' },
    },
    connpass: {
      url: "https://connpass.com/",
      selector: {
        kind: "first-matching",
        values: [".tag_list", "[class*='tag_list']", "main"],
      },
    },
  },
  {
    name: "search-box",
    clone: {
      url: "/components",
      selector: { kind: "css", value: '[data-testid="section-search-box"]' },
    },
    connpass: {
      url: "https://connpass.com/",
      selector: {
        kind: "first-matching",
        values: ["form[action*='search']", "header form", "header"],
      },
    },
    luma: {
      url: "https://lu.ma/discover",
      selector: {
        kind: "first-matching",
        values: ["input[type='search']", "main"],
      },
    },
  },
  {
    name: "group-card",
    clone: {
      url: "/components",
      selector: { kind: "css", value: '[data-testid="section-group-card"]' },
    },
    connpass: {
      url: "https://connpass.com/series/",
      selector: {
        kind: "first-matching",
        values: [".series_list", ".series_list .series", "main"],
      },
    },
  },
  {
    name: "participant-badge",
    clone: {
      url: "/components",
      selector: {
        kind: "css",
        value: '[data-testid="section-participant-badge"]',
      },
    },
    // 参加者リストは本家でも 1 イベントを開かないと見えないため省略
  },
  {
    name: "mini-calendar",
    clone: {
      url: "/components",
      selector: { kind: "css", value: '[data-testid="section-mini-calendar"]' },
    },
    luma: {
      url: "https://lu.ma/discover",
      selector: {
        kind: "first-matching",
        values: ["[role='grid']", "main"],
      },
    },
  },
];

async function resolveSelector(
  page: import("@playwright/test").Page,
  sel: Selector,
): Promise<string | null> {
  if (sel.kind === "css") return sel.value;
  for (const v of sel.values) {
    try {
      const cnt = await page.locator(v).count();
      if (cnt > 0) return v;
    } catch {
      /* ignore */
    }
  }
  return null;
}

for (const target of TARGETS) {
  test(`pair: ${target.name}`, async ({ browser }) => {
    test.setTimeout(120_000);
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 1600 },
      locale: "ja-JP",
      timezoneId: "Asia/Tokyo",
    });
    const page = await ctx.newPage();
    const meta: Record<string, { ok: boolean; reason?: string }> = {};

    // ============ Clone ============
    try {
      await page.goto(target.clone.url, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);
      const sel = await resolveSelector(page, target.clone.selector);
      if (!sel) throw new Error("no matching selector on clone");
      const el = page.locator(sel).first();
      await el.scrollIntoViewIfNeeded();
      await el.screenshot({
        path: path.join(OUT_DIR, `${target.name}-clone.png`),
        animations: "disabled",
      });
      meta.clone = { ok: true };
    } catch (e) {
      meta.clone = { ok: false, reason: String(e) };
      // クローン側の失敗はスイートの問題なので致命扱い
      throw e;
    }

    // ============ connpass ============
    if (target.connpass) {
      try {
        await page.goto(target.connpass.url, {
          waitUntil: "domcontentloaded",
          timeout: 30_000,
        });
        await page.waitForTimeout(1200);
        const sel = await resolveSelector(page, target.connpass.selector);
        if (!sel) throw new Error("no matching selector on connpass");
        const el = page.locator(sel).first();
        await el.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => undefined);
        await el.screenshot({
          path: path.join(OUT_DIR, `${target.name}-connpass.png`),
        });
        meta.connpass = { ok: true };
      } catch (e) {
        console.warn(`[connpass:${target.name}] 取得失敗: ${e}`);
        meta.connpass = { ok: false, reason: String(e) };
      }
    }

    // ============ luma ============
    if (target.luma) {
      try {
        await page.goto(target.luma.url, {
          waitUntil: "domcontentloaded",
          timeout: 30_000,
        });
        await page.waitForTimeout(1200);
        const sel = await resolveSelector(page, target.luma.selector);
        if (!sel) throw new Error("no matching selector on luma");
        const el = page.locator(sel).first();
        await el.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => undefined);
        await el.screenshot({
          path: path.join(OUT_DIR, `${target.name}-luma.png`),
        });
        meta.luma = { ok: true };
      } catch (e) {
        console.warn(`[luma:${target.name}] 取得失敗: ${e}`);
        meta.luma = { ok: false, reason: String(e) };
      }
    }

    fs.writeFileSync(
      path.join(OUT_DIR, `${target.name}-fetch.json`),
      JSON.stringify(meta, null, 2),
    );

    await ctx.close();
    expect(
      fs.existsSync(path.join(OUT_DIR, `${target.name}-clone.png`)),
      "clone スクショは必ず作成されるはず",
    ).toBe(true);
  });
}
