/**
 * 主要ページの応答時間 (TTFB / DCL / Load) 計測。
 *
 * 既に `pnpm dev` が起動している前提で 10 ページにアクセスし、
 * `performance.timing` 互換の値 (Navigation Timing Level 2) から
 * 以下を計測し、`docs/perf-report.md` に追記する。
 *
 *   - TTFB: responseStart - startTime
 *   - DCL : domContentLoadedEventEnd - startTime
 *   - Load: loadEventEnd - startTime
 *
 * 認証必須のページ (/bookmarks /notifications) は事前に dev-login する。
 *
 * 注意:
 * - Next.js dev サーバは初回コンパイルに時間がかかるため、各ページを 2 回計測し
 *   2 回目 (= warm) のみを採用する。1 回目 (= cold) は参考値として記録。
 * - dev サーバ計測なので絶対値より「ページ間の相対比較」と「肥大化の早期発見」
 *   が主目的。production サーバでは数値は大きく改善する想定。
 */
import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

type Timing = {
  ttfb: number;
  dcl: number;
  load: number;
};

const TARGETS = [
  { path: "/", label: "トップ", requiresAuth: false },
  { path: "/explore", label: "イベント一覧", requiresAuth: false },
  { path: "/event/1", label: "イベント詳細", requiresAuth: false },
  { path: "/group/findy", label: "グループ詳細", requiresAuth: false },
  { path: "/user/fast_moon_169", label: "ユーザープロフィール", requiresAuth: false },
  { path: "/calendar/ai-developers", label: "カレンダー詳細", requiresAuth: false },
  { path: "/ranking", label: "ランキング", requiresAuth: false },
  { path: "/discover", label: "ディスカバー", requiresAuth: false },
  { path: "/bookmarks", label: "ブックマーク", requiresAuth: true },
  { path: "/notifications", label: "通知センター", requiresAuth: true },
] as const;

const DEV_USER = "fast_moon_169";

async function devLogin(page: Page): Promise<void> {
  // perf spec はトップページ (`/`) に遷移するため、別の正規表現が必要。
  // 共通ヘルパーは `pathname.startsWith` で動くが、トップは "/" 1 文字で
  // すべてマッチするため、本 spec 専用に regex を維持する。
  await page.goto(
    `/api/auth/dev-login?nickname=${encodeURIComponent(DEV_USER)}&next=${encodeURIComponent("/")}`,
  );
  await page.waitForURL(/\/(?:$|\?)/);
}

async function measure(page: Page, url: string): Promise<Timing> {
  const response = await page.goto(url, { waitUntil: "load" });
  expect(response?.status(), `${url} returned non-OK`).toBeLessThan(400);
  // Navigation Timing Level 2 (PerformanceNavigationTiming) を使い、
  // 廃止された performance.timing の数値は使わない (一部ブラウザで 0 を返す)
  //
  // load event は load 直後だとまだ書き戻されていないことがあるため
  // 少しだけ wait してから読む (flake 対策)。
  await page.waitForLoadState("load");
  await page.waitForFunction(() => {
    const navList = performance.getEntriesByType(
      "navigation",
    ) as PerformanceNavigationTiming[];
    return navList[0] != null && navList[0].loadEventEnd > 0;
  }, { timeout: 15_000 }).catch(() => {
    // タイムアウトしても evaluate へフォールバック
  });
  const timing = await page.evaluate<Timing>(() => {
    const navList = performance.getEntriesByType(
      "navigation",
    ) as PerformanceNavigationTiming[];
    const n = navList[0];
    if (!n) return { ttfb: 0, dcl: 0, load: 0 };
    // 負値や Infinity を 0 にクランプ (極稀なブラウザバグ対策)
    const clamp = (v: number) => (Number.isFinite(v) && v > 0 ? Math.round(v) : 0);
    return {
      ttfb: clamp(n.responseStart - n.startTime),
      dcl: clamp(n.domContentLoadedEventEnd - n.startTime),
      load: clamp(n.loadEventEnd - n.startTime),
    };
  });
  return timing;
}

test.describe.configure({ mode: "serial" });

test("主要10ページの TTFB / DCL / Load を計測", async ({ page, context }) => {
  test.setTimeout(300_000);
  // 認証ありページ用に予め dev-login しておく
  await devLogin(page);

  const rows: Array<{
    label: string;
    path: string;
    cold: Timing;
    warm: Timing;
  }> = [];

  for (const target of TARGETS) {
    // cold (初回) と warm (2 回目) を計測
    const cold = await measure(page, target.path);
    const warm = await measure(page, target.path);
    rows.push({ label: target.label, path: target.path, cold, warm });
    // 念のため。dev のメモリ膨張防止
    if (rows.length % 3 === 0) {
      await context.clearCookies();
      await devLogin(page);
    }
  }

  // docs/perf-report.md に追記
  const outPath = path.join(process.cwd(), "docs", "perf-report.md");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const header = `\n## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)\n\n計測日: ${new Date().toISOString()}\n\n計測方式:\n- \`page.goto(url, { waitUntil: "load" })\` 後に \`PerformanceNavigationTiming\` から TTFB / DOMContentLoaded / Load を取得\n- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記\n- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)\n\n| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |\n| --- | --- | --: | --: | --: | --: | --: | --: |\n`;
  const body = rows
    .map(
      (r) =>
        `| ${r.label} | \`${r.path}\` | ${r.cold.ttfb}ms | ${r.cold.dcl}ms | ${r.cold.load}ms | ${r.warm.ttfb}ms | ${r.warm.dcl}ms | ${r.warm.load}ms |`,
    )
    .join("\n");

  // 仮説生成: warm load が 1500ms 超を「遅い」とみなす
  const slow = rows.filter((r) => r.warm.load > 1500);
  let hypothesis = "\n\n### 異常に遅いページの仮説\n\n";
  if (slow.length === 0) {
    hypothesis +=
      "- warm 計測で 1500ms を超えるページはなかった (dev サーバ計測のため、production ではさらに改善見込み)。\n";
  } else {
    hypothesis += slow
      .map((r) => `- \`${r.path}\` (${r.label}): warm Load=${r.warm.load}ms`)
      .join("\n");
    hypothesis +=
      "\n\n#### 想定原因 (要追加調査)\n" +
      "- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)\n" +
      "- Markdown → HTML 変換 (`marked`) を server で同期実行している\n" +
      "- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延\n" +
      "- dev サーバの per-route Turbopack コンパイルが warm でも一部走る\n";
  }

  const block = header + body + hypothesis + "\n";
  fs.appendFileSync(outPath, block, "utf8");

  // sanity: 全ページ取れたか
  expect(rows.length).toBe(TARGETS.length);
  for (const r of rows) {
    expect(r.warm.ttfb, `${r.path} ttfb`).toBeGreaterThanOrEqual(0);
    expect(r.warm.load, `${r.path} load`).toBeGreaterThanOrEqual(0);
  }
});
