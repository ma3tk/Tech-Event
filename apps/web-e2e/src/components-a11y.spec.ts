/**
 * `/components` ショーケースに対する axe-core 自動 a11y チェック。
 *
 * - 全 violations を取得し、JSON スナップショットを `screenshots/components/_axe.json`
 *   に出力する (差分追跡用)
 * - critical / serious レベルの違反 (= ブロッカー) が 0 件であることをアサート
 * - 例外: `color-contrast` は既存デザイントークン (status-* 色) の見直し要件で
 *   別途トラッキング中のため、本テストでは警告に降格する。新規の構造的違反のみ失敗扱い。
 * - 軽微な (minor / moderate) は警告として console.warn に出すのみで失敗にしない
 *   → デザイン調整中の noise を避けるため。要件が厳格化したら閾値を下げる。
 */

/** デザインシステム調整中の既知違反 ID。failure には積まない (warn のみ)。 */
const KNOWN_DESIGN_VIOLATIONS = new Set<string>(["color-contrast"]);

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import path from "node:path";
import fs from "node:fs";

const OUT_DIR = path.join(process.cwd(), "screenshots", "components");

test.beforeAll(() => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
});

test("/components: axe-core violations が critical/serious=0", async ({
  page,
}) => {
  await page.goto("/components", { waitUntil: "domcontentloaded" });

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  // 全 violations を JSON で保存 (差分監視用)
  fs.writeFileSync(
    path.join(OUT_DIR, "_axe.json"),
    JSON.stringify(
      {
        url: results.url,
        timestamp: results.timestamp,
        violations: results.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          helpUrl: v.helpUrl,
          nodeCount: v.nodes.length,
          targets: v.nodes.map((n) => n.target).slice(0, 5),
        })),
        passes: results.passes.length,
        incomplete: results.incomplete.length,
      },
      null,
      2,
    ),
  );

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

  if (knownDesign.length > 0) {
    console.warn(
      `[a11y] 既知デザイン違反 (デザインシステム側で追跡): ${knownDesign
        .map((v) => `${v.id}(${v.nodes.length})`)
        .join(", ")}`,
    );
  }

  if (minor.length > 0) {
    console.warn(
      `[a11y] minor/moderate violations: ${minor
        .map((v) => `${v.id}(${v.nodes.length})`)
        .join(", ")}`,
    );
  }

  if (blockers.length > 0) {
    console.error(
      `[a11y] blocker violations:\n` +
        blockers
          .map(
            (v) =>
              `  - ${v.id} [${v.impact}] ${v.help}: ${v.nodes.length}件`,
          )
          .join("\n"),
    );
  }

  expect(
    blockers.map((v) => v.id),
    "critical/serious 違反 (既知デザイン除く) は 0 件であるべき",
  ).toEqual([]);
});

test("/components: section ごとに axe (代表セクションのみ)", async ({
  page,
}) => {
  await page.goto("/components", { waitUntil: "domcontentloaded" });

  // 代表的な 3 セクションだけ個別 scope で axe を走らせる (スピード優先)
  const sections = [
    "section-event-status-badge",
    "section-pagination",
    "section-breadcrumb",
  ];

  for (const id of sections) {
    const results = await new AxeBuilder({ page })
      .include(`[data-testid="${id}"]`)
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const blockers = results.violations.filter(
      (v) =>
        (v.impact === "critical" || v.impact === "serious") &&
        !KNOWN_DESIGN_VIOLATIONS.has(v.id),
    );

    expect(
      blockers.map((v) => v.id),
      `${id} に critical/serious 違反`,
    ).toEqual([]);
  }
});
