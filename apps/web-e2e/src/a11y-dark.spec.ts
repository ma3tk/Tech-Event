/**
 * 主要 5 ページの dark mode における axe-core a11y チェック。
 *
 * - light モード版は `a11y-pages.spec.ts` で別途実施 (壊さない)。
 * - dark テーマは `localStorage["tech-event:theme"] = "dark"` を addInitScript
 *   で先に注入してから navigation し、`<html data-theme="dark">` の状態で走査。
 * - `color-contrast` はデザイントークン調整中のため既知扱いで warn のみ。
 * - critical / serious の (既知デザインを除く) violations が 0 件であることをアサート。
 * - 結果は `screenshots/components/_axe-dark.json` に保存する。
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import path from "node:path";
import fs from "node:fs";

const KNOWN_DESIGN_VIOLATIONS = new Set<string>(["color-contrast"]);

const OUT_DIR = path.join(process.cwd(), "screenshots", "components");
const OUT_FILE = path.join(OUT_DIR, "_axe-dark.json");
const STORAGE_KEY = "tech-event:theme";

type PageSpec = {
  name: string;
  url: string;
  loginAs?: string;
};

// 主要 5 ページ (top / explore / event / group / user)
const PAGES: PageSpec[] = [
  { name: "top", url: "/" },
  { name: "explore", url: "/explore" },
  { name: "event-1", url: "/event/1" },
  { name: "group-findy", url: "/group/findy" },
  { name: "user-fast_moon_169", url: "/user/fast_moon_169" },
];

test.beforeAll(() => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
});

type Summary = {
  generatedAt: string;
  theme: "dark";
  pages: {
    name: string;
    url: string;
    finalUrl: string;
    resolvedTheme: string | null;
    violationCount: number;
    blockerCount: number;
    blockers: { id: string; impact: string | null; nodes: number }[];
    knownDesign: { id: string; nodes: number }[];
    minor: { id: string; impact: string | null; nodes: number }[];
  }[];
};

const summary: Summary = {
  generatedAt: new Date().toISOString(),
  theme: "dark",
  pages: [],
};

test.describe.configure({ mode: "serial" });

test.describe("主要ページの axe-core a11y チェック (dark)", () => {
  test.afterAll(() => {
    const merged = summary.pages.slice();
    if (fs.existsSync(OUT_FILE)) {
      try {
        const prev = JSON.parse(fs.readFileSync(OUT_FILE, "utf8")) as Summary;
        const names = new Set(merged.map((p) => p.name));
        for (const p of prev.pages) {
          if (!names.has(p.name)) merged.push(p);
        }
      } catch {
        /* 壊れていれば無視 */
      }
    }
    const out: Summary = {
      generatedAt: summary.generatedAt,
      theme: "dark",
      pages: merged,
    };
    fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2));
  });

  for (const spec of PAGES) {
    test(`a11y-dark: ${spec.name} (${spec.url})`, async ({ browser }) => {
      const ctx = await browser.newContext({ colorScheme: "dark" });
      await ctx.addInitScript(
        ([key, value]) => {
          try {
            window.localStorage.setItem(key, value);
          } catch {
            /* private mode 等は無視 */
          }
        },
        [STORAGE_KEY, "dark"] as const,
      );
      const page = await ctx.newPage();

      try {
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
        await page
          .waitForFunction(
            () =>
              document.documentElement.getAttribute("data-theme") === "dark",
            undefined,
            { timeout: 5_000 },
          )
          .catch(() => undefined);
        await page.waitForLoadState("networkidle").catch(() => undefined);

        const resolvedTheme = await page.evaluate(() =>
          document.documentElement.getAttribute("data-theme"),
        );

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
          resolvedTheme,
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
            `[a11y-dark:${spec.name}] blocker violations:\n` +
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
            `[a11y-dark:${spec.name}] 既知デザイン違反: ${knownDesign
              .map((v) => `${v.id}(${v.nodes.length})`)
              .join(", ")}`,
          );
        }
        if (minor.length > 0) {
          console.warn(
            `[a11y-dark:${spec.name}] minor/moderate: ${minor
              .map((v) => `${v.id}(${v.nodes.length})`)
              .join(", ")}`,
          );
        }

        expect(
          blockers.map((v) => v.id),
          `${spec.name} (dark): critical/serious 違反 (既知デザイン除く) は 0 件であるべき`,
        ).toEqual([]);
      } finally {
        await ctx.close();
      }
    });
  }
});
