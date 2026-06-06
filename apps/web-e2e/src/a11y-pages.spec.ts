/**
 * 主要ページの axe-core 一括 a11y チェック。
 *
 * 検証範囲: 10 ページ (top / explore / event / group / user / calendar /
 * ranking / login / signup / dashboard)。
 *
 * 重大度 `serious` / `critical` の violations が 0 件であることをアサート。
 * `color-contrast` はデザイントークン調整中のため warn 扱い (failure に積まない)。
 *
 * 全ページの violations サマリーを `screenshots/components/_axe-pages.json`
 * に出力 (差分追跡用)。
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import path from "node:path";
import fs from "node:fs";

/** デザインシステム調整中の既知違反 ID。failure には積まない (warn のみ)。 */
const KNOWN_DESIGN_VIOLATIONS = new Set<string>(["color-contrast"]);

const OUT_DIR = path.join(process.cwd(), "screenshots", "components");
const OUT_FILE = path.join(OUT_DIR, "_axe-pages.json");

type PageSpec = {
  /** 表示名 (レポート用) */
  name: string;
  /** Playwright URL */
  url: string;
  /** dashboard など認証が必要なら nickname を指定。空なら未ログインで開く */
  loginAs?: string;
};

const PAGES: PageSpec[] = [
  { name: "top", url: "/" },
  { name: "explore", url: "/explore" },
  { name: "event-1", url: "/event/1" },
  { name: "group-findy", url: "/group/findy" },
  { name: "user-fast_moon_169", url: "/user/fast_moon_169" },
  { name: "calendar-ai-developers", url: "/calendar/ai-developers" },
  { name: "ranking", url: "/ranking" },
  { name: "login", url: "/login" },
  { name: "signup", url: "/signup" },
  { name: "dashboard", url: "/dashboard", loginAs: "fast_moon_169" },
];

test.beforeAll(() => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
});

type Summary = {
  generatedAt: string;
  pages: {
    name: string;
    url: string;
    finalUrl: string;
    httpStatusOk: boolean;
    violationCount: number;
    blockerCount: number;
    blockers: { id: string; impact: string | null; nodes: number }[];
    knownDesign: { id: string; nodes: number }[];
    minor: { id: string; impact: string | null; nodes: number }[];
  }[];
};

const summary: Summary = {
  generatedAt: new Date().toISOString(),
  pages: [],
};

// 並列実行されると summary が worker ごとに分かれ、最後に書き込んだ
// worker の分だけが OUT_FILE に残る。本スイートはサマリーを 1 ファイルに
// 集約するのが目的なので serial 実行する (10 ページなので所要数十秒)。
test.describe.configure({ mode: "serial" });

test.describe("主要ページの axe-core a11y チェック", () => {
  test.afterAll(() => {
    // 既存ファイルとマージしてから書き出す。serial 実行で同 worker 内なら
    // summary だけで足りるが、保険として既存内容も読み込む。
    const merged = summary.pages.slice();
    if (fs.existsSync(OUT_FILE)) {
      try {
        const prev = JSON.parse(fs.readFileSync(OUT_FILE, "utf8")) as Summary;
        // 同名ページは新しいもので上書き
        const names = new Set(merged.map((p) => p.name));
        for (const p of prev.pages) {
          if (!names.has(p.name)) merged.push(p);
        }
      } catch {
        // 既存ファイルが壊れている場合は無視
      }
    }
    const out: Summary = {
      generatedAt: summary.generatedAt,
      pages: merged,
    };
    fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2));
  });

  for (const spec of PAGES) {
    test(`a11y: ${spec.name} (${spec.url})`, async ({ page, context }) => {
      await context.clearCookies();

      if (spec.loginAs) {
        await page.goto(
          `/api/auth/dev-login?nickname=${encodeURIComponent(
            spec.loginAs,
          )}&next=${encodeURIComponent(spec.url)}`,
          { waitUntil: "domcontentloaded" },
        );
      } else {
        await page.goto(spec.url, { waitUntil: "domcontentloaded" });
      }

      // SSR コンテンツの hydrate を少し待つ
      await page.waitForLoadState("networkidle").catch(() => undefined);

      // 期待外の /login リダイレクトが起きていないかを記録する。
      // - 自身が /login の場合は OK
      // - 認証なしページがログインに飛ばされた場合は NG とみなす
      const redirectedToLogin = page.url().includes("/login");
      const httpStatusOk = !redirectedToLogin || spec.url === "/login";

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const blockers = results.violations.filter(
        (v) =>
          (v.impact === "critical" || v.impact === "serious") &&
          !KNOWN_DESIGN_VIOLATIONS.has(v.id),
      );
      const knownDesign = results.violations.filter((v) =>
        KNOWN_DESIGN_VIOLATIONS.has(v.id),
      );
      const minor = results.violations.filter(
        (v) =>
          v.impact !== "critical" &&
          v.impact !== "serious" &&
          !KNOWN_DESIGN_VIOLATIONS.has(v.id),
      );

      summary.pages.push({
        name: spec.name,
        url: spec.url,
        finalUrl: page.url(),
        httpStatusOk,
        violationCount: results.violations.length,
        blockerCount: blockers.length,
        blockers: blockers.map((v) => ({
          id: v.id,
          impact: v.impact ?? null,
          nodes: v.nodes.length,
        })),
        knownDesign: knownDesign.map((v) => ({
          id: v.id,
          nodes: v.nodes.length,
        })),
        minor: minor.map((v) => ({
          id: v.id,
          impact: v.impact ?? null,
          nodes: v.nodes.length,
        })),
      });

      if (blockers.length > 0) {
        console.error(
          `[a11y:${spec.name}] blocker violations:\n` +
            blockers
              .map(
                (v) =>
                  `  - ${v.id} [${v.impact}] ${v.help}: ${v.nodes.length}件`,
              )
              .join("\n"),
        );
      }
      if (knownDesign.length > 0) {
        console.warn(
          `[a11y:${spec.name}] 既知デザイン違反: ${knownDesign
            .map((v) => `${v.id}(${v.nodes.length})`)
            .join(", ")}`,
        );
      }
      if (minor.length > 0) {
        console.warn(
          `[a11y:${spec.name}] minor/moderate: ${minor
            .map((v) => `${v.id}(${v.nodes.length})`)
            .join(", ")}`,
        );
      }

      expect(
        blockers.map((v) => v.id),
        `${spec.name}: critical/serious 違反 (既知デザイン除く) は 0 件であるべき`,
      ).toEqual([]);
    });
  }
});
