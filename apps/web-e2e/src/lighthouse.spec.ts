/**
 * Lighthouse 計測 E2E
 *
 * 主要 10 ページに対し、Lighthouse 4 カテゴリ
 * (Performance / Accessibility / Best Practices / SEO) を計測する。
 *
 * 結果は `docs/lighthouse-report.md` に追記する。
 *
 * 仕様:
 * - 失敗時は warn のみ。`expect` の失敗で test を fail させない。
 *   (dev server / 計測ばらつき / network jitter で flake しがちなため、
 *    あくまで「現時点のスナップショット」として記録するのが目的。)
 * - chromium-desktop プロジェクトでのみ実行する (mobile はスキップ)。
 * - 環境変数 `LIGHTHOUSE_RUN=1` 指定時のみ実行する (CI で重い計測を skip 可能)。
 *
 * 実装手法:
 *   chrome-launcher で別プロセスとして Chrome を起動 → lighthouse CLI を
 *   programmatic に呼ぶ。Playwright のページとは分離する (lighthouse が
 *   コントロールする方が安定する)。
 */
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const TARGETS: { path: string; label: string }[] = [
  { path: "/", label: "トップ" },
  { path: "/explore", label: "イベント一覧" },
  { path: "/event/1", label: "イベント詳細" },
  { path: "/group/findy", label: "グループ詳細" },
  { path: "/user/fast_moon_169", label: "ユーザープロフィール" },
  { path: "/calendar/ai-developers", label: "カレンダー詳細" },
  { path: "/ranking", label: "ランキング" },
  { path: "/discover", label: "ディスカバー" },
  { path: "/bookmarks", label: "ブックマーク" },
  { path: "/notifications", label: "通知センター" },
];

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const SHOULD_RUN = process.env.LIGHTHOUSE_RUN === "1";

type CategoryKey = "performance" | "accessibility" | "best-practices" | "seo";

type Row = {
  label: string;
  path: string;
  scores: Partial<Record<CategoryKey, number>>;
  error?: string;
};

test.describe.configure({ mode: "serial" });

test("主要10ページの Lighthouse スコア (Performance/A11y/BP/SEO)", async () => {
  test.skip(
    !SHOULD_RUN,
    "Lighthouse 計測は LIGHTHOUSE_RUN=1 環境変数指定時のみ実行する",
  );
  test.setTimeout(20 * 60 * 1000); // 20 min: 10 page × 数十秒

  // chrome-launcher と lighthouse は ESM dynamic import で読み込む
  // (Playwright + tsx 経由でも問題なく動く)
  const chromeLauncher = await import("chrome-launcher");
  const lighthouseMod = await import("lighthouse");
  const lighthouse =
    (lighthouseMod as unknown as { default?: typeof lighthouseMod }).default ??
    lighthouseMod;

  // Cookie 取得用に dev-login しておく (Playwright page 経由)
  // → 認証必須ページ用に Set-Cookie ヘッダを extraHeaders で渡す
  let authCookieHeader = "";
  {
    // 軽量 HTTP fetch で dev-login のみ実施し、Set-Cookie を取り出す
    const res = await fetch(
      `${BASE_URL}/api/auth/dev-login?nickname=fast_moon_169&next=/`,
      { redirect: "manual" },
    );
    const setCookie = res.headers.get("set-cookie") ?? "";
    // "name=value; Path=/; HttpOnly" のような形式から name=value 部分のみ
    authCookieHeader = setCookie
      .split(/,(?=[^ ]+=)/)
      .map((c) => c.split(";")[0]?.trim())
      .filter(Boolean)
      .join("; ");
  }

  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
  });

  const rows: Row[] = [];

  try {
    for (const target of TARGETS) {
      const url = `${BASE_URL}${target.path}`;
      try {
        const result = await (
          lighthouse as unknown as (
            url: string,
            options: Record<string, unknown>,
            config?: unknown,
          ) => Promise<{
            lhr: {
              categories: Record<
                string,
                { score: number | null; title: string }
              >;
            } | null;
          } | undefined>
        )(url, {
          port: chrome.port,
          output: "json" as const,
          logLevel: "error" as const,
          onlyCategories: [
            "performance",
            "accessibility",
            "best-practices",
            "seo",
          ],
          formFactor: "desktop",
          throttling: {
            rttMs: 40,
            throughputKbps: 10 * 1024,
            cpuSlowdownMultiplier: 1,
            requestLatencyMs: 0,
            downloadThroughputKbps: 0,
            uploadThroughputKbps: 0,
          },
          screenEmulation: {
            mobile: false,
            width: 1280,
            height: 800,
            deviceScaleFactor: 1,
            disabled: false,
          },
          extraHeaders: authCookieHeader
            ? { Cookie: authCookieHeader }
            : undefined,
          maxWaitForLoad: 60_000,
        });

        const lhr = result?.lhr;
        if (!lhr) {
          rows.push({
            label: target.label,
            path: target.path,
            scores: {},
            error: "no lhr",
          });
          continue;
        }
        const scores: Row["scores"] = {};
        for (const key of [
          "performance",
          "accessibility",
          "best-practices",
          "seo",
        ] as const) {
          const s = lhr.categories[key]?.score;
          if (typeof s === "number") {
            scores[key] = Math.round(s * 100);
          }
        }
        rows.push({ label: target.label, path: target.path, scores });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        rows.push({
          label: target.label,
          path: target.path,
          scores: {},
          error: msg.slice(0, 200),
        });
        // warn-only: continue
        console.warn(`[lighthouse] ${target.path} failed: ${msg}`);
      }
    }
  } finally {
    await chrome.kill();
  }

  // ====== レポート出力 ======
  const date = new Date().toISOString();
  const outPath = path.join(process.cwd(), "docs", "lighthouse-report.md");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  let body = "";
  if (!fs.existsSync(outPath)) {
    body += `# Lighthouse スコアレポート\n\n`;
    body += `主要 10 ページに対する Lighthouse 計測結果 (chromium-desktop / headless)。\n\n`;
  }
  body += `\n## 計測 ${date}\n\n`;
  body += `| ページ | パス | Performance | Accessibility | Best Practices | SEO |\n`;
  body += `| --- | --- | --: | --: | --: | --: |\n`;
  for (const r of rows) {
    const fmt = (k: CategoryKey) =>
      r.scores[k] != null ? `${r.scores[k]}` : "-";
    body += `| ${r.label} | \`${r.path}\` | ${fmt("performance")} | ${fmt(
      "accessibility",
    )} | ${fmt("best-practices")} | ${fmt("seo")} |`;
    if (r.error) body += ` <!-- error: ${r.error} -->`;
    body += `\n`;
  }
  // 平均
  const avg = (k: CategoryKey) => {
    const vals = rows
      .map((r) => r.scores[k])
      .filter((v): v is number => typeof v === "number");
    if (vals.length === 0) return "-";
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length).toString();
  };
  body += `\n**平均**: Performance=${avg("performance")} / A11y=${avg(
    "accessibility",
  )} / BP=${avg("best-practices")} / SEO=${avg("seo")}\n`;

  // 目標達成判定 (warn のみ)
  const targets: Record<CategoryKey, number> = {
    performance: 80,
    accessibility: 95,
    "best-practices": 90,
    seo: 95,
  };
  const failures: string[] = [];
  for (const r of rows) {
    for (const k of [
      "performance",
      "accessibility",
      "best-practices",
      "seo",
    ] as const) {
      const v = r.scores[k];
      if (typeof v === "number" && v < targets[k]) {
        failures.push(`- ${r.path} ${k}=${v} < ${targets[k]}`);
      }
    }
  }
  if (failures.length > 0) {
    body += `\n### 目標未達 (warn-only)\n\n`;
    body += failures.join("\n") + "\n";
  } else {
    body += `\n目標スコアを全項目で達成。\n`;
  }

  fs.appendFileSync(outPath, body, "utf8");

  // 1 件でも実計測が取れていれば pass (warn-only ポリシー)
  const ok = rows.some((r) => Object.keys(r.scores).length > 0);
  expect(ok, "少なくとも 1 ページの Lighthouse 計測は成功すべき").toBe(true);
});
