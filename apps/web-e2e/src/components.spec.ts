/**
 * コンポーネントショーケース (`/components`) に対する視覚 + 機能検証スイート。
 *
 * - 全セクションの testid が存在することを確認
 * - 主要セクションごとのスクリーンショットを `screenshots/components/{name}.png` に保存
 * - クリッカブル要素のキーボードフォーカス可能性を検証
 * - hover 挙動 (TagPill removable など) のスモークチェック
 * - ステータスバッジのテキスト・aria-current などのアサーション
 * - Playwright の `toHaveScreenshot()` でセクション単位の視覚回帰
 *
 * 既存の e2e/visual-compare.spec.ts (本家との比較) とは別の関心を持つため、
 * URL もスクショ保存先も分離している。
 */

import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const SCREENSHOT_DIR = path.join(
  process.cwd(),
  "screenshots",
  "components",
);

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

test.describe("Showcase: 描画", () => {
  test("ページが 200 で開きヘッダが描画される", async ({ page }) => {
    const res = await page.goto("/components", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBeLessThan(400);
    await expect(
      page.getByRole("heading", { name: "コンポーネントショーケース", level: 1 }),
    ).toBeVisible();
    await expect(page.getByTestId("components-showcase")).toBeVisible();
  });

  test("全 11 セクションの testid が存在する", async ({ page }) => {
    await page.goto("/components");
    const ids = [
      "section-event-status-badge",
      "section-event-list-row",
      "section-event-card",
      "section-event-card-compact",
      "section-pagination",
      "section-breadcrumb",
      "section-tag-pill",
      "section-search-box",
      "section-group-card",
      "section-participant-badge",
      "section-mini-calendar",
    ];
    for (const id of ids) {
      await expect(page.getByTestId(id), `${id} missing`).toBeVisible();
    }
  });

  test("フルページスクショ", async ({ page }) => {
    await page.goto("/components", { waitUntil: "domcontentloaded" });
    // フォントとレイアウト確定を待ってからスクショ (固定 sleep より安定)
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "_fullpage.png"),
      fullPage: true,
    });
  });
});

/* ============================================================
 * セクションごとのスクリーンショット
 * ============================================================ */

const SECTIONS = [
  "event-status-badge",
  "event-list-row",
  "event-card",
  "event-card-compact",
  "pagination",
  "breadcrumb",
  "tag-pill",
  "search-box",
  "group-card",
  "participant-badge",
  "mini-calendar",
] as const;

for (const section of SECTIONS) {
  test(`section screenshot: ${section}`, async ({ page }) => {
    await page.goto("/components", { waitUntil: "domcontentloaded" });
    const locator = page.getByTestId(`section-${section}`);
    await locator.scrollIntoViewIfNeeded();
    // section が可視 + フォントが読み込み済みであることを確認してから撮影
    await expect(locator).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await locator.screenshot({
      path: path.join(SCREENSHOT_DIR, `${section}.png`),
      animations: "disabled",
    });
  });
}

/* ============================================================
 * 機能アサーション
 * ============================================================ */

test.describe("EventStatusBadge: ラベル文言", () => {
  test("status=open は '募集中' と表示される", async ({ page }) => {
    await page.goto("/components");
    const cell = page.getByTestId(
      "component-EventStatusBadge-subtle-md-open",
    );
    await expect(cell).toContainText("募集中");
  });

  test("全 8 status のラベルが対応している", async ({ page }) => {
    await page.goto("/components");
    const expectations: Array<{ status: string; label: string }> = [
      { status: "upcoming", label: "開催前" },
      { status: "open", label: "募集中" },
      { status: "full", label: "満員" },
      { status: "waitlist", label: "補欠登録受付中" },
      { status: "closed", label: "募集締切" },
      { status: "cancelled", label: "中止" },
      { status: "ended", label: "終了" },
      { status: "ongoing", label: "開催中" },
    ];
    for (const { status, label } of expectations) {
      const cell = page.getByTestId(
        `component-EventStatusBadge-subtle-md-${status}`,
      );
      await expect(cell, `${status} の表示`).toContainText(label);
    }
  });
});

test.describe("Pagination: aria-current / disabled", () => {
  test("現在ページが aria-current='page'", async ({ page }) => {
    await page.goto("/components");
    const middle = page.getByTestId("component-Pagination-default-middle");
    // デスクトップ表示の現在ページボタン (aria-label で識別、モバイル用の
    // 簡易表示 span と区別する)
    const current = middle.locator(
      "[aria-current='page'][aria-label='現在のページ、5ページ目']",
    );
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText("5");
  });

  test("最初のページでは '前へ' が aria-disabled", async ({ page }) => {
    await page.goto("/components");
    const first = page.getByTestId("component-Pagination-default-first");
    const prev = first.locator("[aria-label='前のページに移動']");
    await expect(prev).toHaveAttribute("aria-disabled", "true");
  });

  test("最終ページでは '次へ' が aria-disabled", async ({ page }) => {
    await page.goto("/components");
    const last = page.getByTestId("component-Pagination-default-last");
    const next = last.locator("[aria-label='次のページに移動']");
    await expect(next).toHaveAttribute("aria-disabled", "true");
  });
});

test.describe("Breadcrumb: aria-current", () => {
  test("最終要素のみ aria-current='page'", async ({ page }) => {
    await page.goto("/components");
    const long = page.getByTestId("component-Breadcrumb-default-long");
    const currents = long.locator("[aria-current='page']");
    await expect(currents).toHaveCount(1);
    await expect(currents).toHaveText("Reactパフォーマンス勉強会");
  });
});

test.describe("MiniCalendar: 年月表記", () => {
  test("今月の年月が正しく表示される", async ({ page }) => {
    await page.goto("/components");
    const cell = page.getByTestId("component-MiniCalendar-default-thisMonth");
    const now = new Date();
    // baseDate=今月 (デフォルト)。Asia/Tokyo locale でレンダされる前提で、
    // 端境の翌日リスクは小さいが念のためどちらの値も許容する。
    const candidates = [
      `${now.getFullYear()}年${now.getMonth() + 1}月`,
    ];
    let matched = false;
    for (const text of candidates) {
      if ((await cell.getByText(text).count()) > 0) {
        matched = true;
        break;
      }
    }
    expect(matched, `expected calendar to contain one of ${candidates}`).toBe(
      true,
    );
  });

  test("固定月 (2026/07) のラベルが '2026年7月'", async ({ page }) => {
    await page.goto("/components");
    const cell = page.getByTestId(
      "component-MiniCalendar-default-fixedMonth",
    );
    await expect(cell).toContainText("2026年7月");
  });
});

test.describe("TagPill: removable / selectable", () => {
  test("filter+removable は × ボタンを持ち、hover でクリックできる", async ({
    page,
  }) => {
    await page.goto("/components");
    const cell = page.getByTestId("component-TagPill-filter-removable");
    const removeBtn = cell.getByRole("button", { name: /タグを削除/ });
    await expect(removeBtn).toBeVisible();
    await removeBtn.hover();
    // クリックしても要素は (デモなので) 消えない。例外なく押せることを確認。
    await removeBtn.click();
  });

  test("selectable + selected には aria-pressed=true", async ({ page }) => {
    await page.goto("/components");
    const cell = page.getByTestId("component-TagPill-selectable-selected");
    const btn = cell.getByRole("button");
    await expect(btn).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("SearchBox: フォーカス可能", () => {
  test("検索 input にフォーカスでき、submit ボタンも focusable", async ({
    page,
  }) => {
    await page.goto("/components");
    const cell = page.getByTestId("component-SearchBox-hero-default");
    const input = cell.getByRole("searchbox");
    await input.focus();
    await expect(input).toBeFocused();
    const submit = cell.getByRole("button", { name: "検索" });
    await submit.focus();
    await expect(submit).toBeFocused();
  });
});

test.describe("キーボード操作", () => {
  test("TagPill selectable ボタンが focusable", async ({ page }) => {
    await page.goto("/components");
    const target = page
      .getByTestId("component-TagPill-selectable-md")
      .getByRole("button");
    await target.scrollIntoViewIfNeeded();
    await target.focus();
    await expect(target).toBeFocused();
  });

  test("Pagination のページリンクが focusable (current 以外)", async ({
    page,
  }, testInfo) => {
    await page.goto("/components");
    const middle = page.getByTestId("component-Pagination-default-middle");
    if (testInfo.project.name === "chromium-mobile") {
      // モバイル幅では数字リンク (`hidden sm:list-item`) は表示されないため、
      // 「次のページ」リンクが focusable であることを確認する。
      const next = middle.getByRole("link", { name: /次のページ/ });
      await next.scrollIntoViewIfNeeded();
      await next.focus();
      await expect(next).toBeFocused();
    } else {
      // 現在ページ (5) 以外の数字リンクは <a>。最初の "1" リンクにフォーカス。
      const link = middle.getByRole("link", { name: /1ページ目/ });
      await link.scrollIntoViewIfNeeded();
      await link.focus();
      await expect(link).toBeFocused();
    }
  });

  test("Breadcrumb の最初のリンクが focusable", async ({ page }) => {
    await page.goto("/components");
    const bc = page.getByTestId("component-Breadcrumb-default-long");
    const link = bc.getByRole("link", { name: "ホーム" });
    await link.scrollIntoViewIfNeeded();
    await link.focus();
    await expect(link).toBeFocused();
  });
});

/* ============================================================
 * 視覚回帰 (Playwright toHaveScreenshot)
 *  - threshold 0.1 で運用
 *  - 初回実行時はスナップショットが無いため pass しないので、
 *    `--update-snapshots` で生成する必要がある。
 *  - chromium-desktop プロジェクトのみで実施 (mobile はレイアウト差が大きいため)
 * ============================================================ */

test.describe("Visual regression (toHaveScreenshot)", () => {
  for (const section of SECTIONS) {
    test(`snapshot diff: ${section}`, async ({ page }, testInfo) => {
      // 視覚回帰は chromium-desktop のみで実施
      test.skip(
        testInfo.project.name !== "chromium-desktop",
        "視覚回帰は chromium-desktop のみで実行",
      );
      await page.goto("/components", { waitUntil: "domcontentloaded" });
      const locator = page.getByTestId(`section-${section}`);
      await locator.scrollIntoViewIfNeeded();
      await expect(locator).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await expect(locator).toHaveScreenshot(`${section}.png`, {
        animations: "disabled",
        maxDiffPixelRatio: 0.1,
      });
    });
  }
});
