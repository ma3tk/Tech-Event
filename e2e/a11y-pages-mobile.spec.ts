/**
 * モバイル viewport (chromium-mobile / iPhone 14) で主要 5 ページの
 * axe-core a11y 走査を行うスイート。
 *
 * `a11y-pages.spec.ts` (デスクトップ/モバイル両 project で実行) と異なり、
 * 本スイートは:
 *   - chromium-mobile プロジェクト限定で実行
 *   - ハンバーガーメニュー展開時 (top のみ追加) の a11y もチェック
 *   - critical / serious violations が 0 件であること (color-contrast は既知)
 *
 * 対象 5 ページ: top / explore / event/1 / discover / calendar/ai-developers
 */

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const KNOWN_DESIGN_VIOLATIONS = new Set<string>(["color-contrast"]);

type PageSpec = {
  name: string;
  url: string;
};

const PAGES: PageSpec[] = [
  { name: "mobile-top", url: "/" },
  { name: "mobile-explore", url: "/explore" },
  { name: "mobile-event-1", url: "/event/1" },
  { name: "mobile-discover", url: "/discover" },
  { name: "mobile-calendar-ai-developers", url: "/calendar/ai-developers" },
];

test.beforeEach(async ({}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-mobile",
    "本スイートは chromium-mobile (iPhone 14) 専用",
  );
});

test.describe("モバイル主要 5 ページ axe a11y", () => {
  for (const spec of PAGES) {
    test(`a11y (mobile): ${spec.name} (${spec.url})`, async ({
      page,
      context,
    }) => {
      await context.clearCookies();
      await page.goto(spec.url, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => undefined);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const blockers = results.violations.filter(
        (v) =>
          (v.impact === "critical" || v.impact === "serious") &&
          !KNOWN_DESIGN_VIOLATIONS.has(v.id),
      );

      if (blockers.length > 0) {
        // eslint-disable-next-line no-console
        console.error(
          `[a11y mobile:${spec.name}] blockers:\n` +
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
        `${spec.name}: critical/serious 違反 (既知デザイン除く) は 0 件であるべき`,
      ).toEqual([]);
    });
  }

  test("a11y (mobile): top のハンバーガーメニュー展開時も violations 0", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => undefined);

    // ハンバーガーを開く
    const btn = page.getByRole("button", { name: /メニューを開く/ });
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(page.getByTestId("header-mobile-menu")).toHaveAttribute(
      "data-open",
      "true",
    );

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blockers = results.violations.filter(
      (v) =>
        (v.impact === "critical" || v.impact === "serious") &&
        !KNOWN_DESIGN_VIOLATIONS.has(v.id),
    );
    expect(
      blockers.map((v) => v.id),
      "ハンバーガー展開時: critical/serious 違反は 0 件であるべき",
    ).toEqual([]);
  });
});
