import { test, expect } from "@playwright/test";

/**
 * Storybook docs / story の runtime rendering 検証 spec
 *
 * 背景:
 *   - 過去に `apps/web/storybook-static` のビルドは成功するが、
 *     iframe.html で「No Preview」または React error が出るバグがあった
 *     (e.g. async Server Component を直接 story 化、MDX 内の `{open|full|...}` 等で
 *     bare な JSX 式と誤認識される、など)
 *   - build/index.json のチェックでは検出できなかった
 *   - 本 spec で 主要 component の docs / story を **実 rendering 検証** する
 *
 * 起動条件:
 *   - 環境変数 `STORYBOOK_BASE_URL` (デフォルト `http://localhost:6006`) で
 *     Storybook (dev or static serve) に到達できること
 *   - CI では `pnpm nx run web:build-storybook` → static を `python3 -m http.server`
 *     で serve した上で本 spec を実行する (.github/workflows/ci.yml の storybook-rendering job)
 *
 * 検証内容:
 *   - 「No Preview」のメッセージが visible でないこと
 *   - Storybook の `.sb-errordisplay` (rendering error) が visible でないこと
 *   - 主要 component (Button / EventCard / EventStatusBadge / Breadcrumb / Header / Footer) の
 *     docs page で `#storybook-docs` ノードに何らかの content が描画されていること
 *   - story page で実 component DOM (button / [role] 等) が存在すること
 *   - console error が 0 件 であること (React hydration error / 参照エラー検出)
 */

const SB_BASE = process.env.STORYBOOK_BASE_URL ?? "http://localhost:6006";

// 代表 component の docs page (attached-mdx)。
// "No Preview" は本来 attached-mdx で出るべきでない。
const DOCS_TARGETS: { id: string; title: string }[] = [
  { id: "ui-button--docs", title: "Button" },
  { id: "ui-card--docs", title: "Card" },
  { id: "ui-badge--docs", title: "Badge" },
  { id: "ui-input--docs", title: "Input" },
  { id: "components-eventcard--docs", title: "EventCard" },
  { id: "components-eventstatusbadge--docs", title: "EventStatusBadge" },
  { id: "components-breadcrumb--docs", title: "Breadcrumb" },
  { id: "components-header--docs", title: "Header" },
  { id: "components-footer--docs", title: "Footer" },
];

// 代表 story page (story view). MDX を経由せず autogen story が直接表示できること。
//
// 注: 各 story の `Default` 名は project 固有 (EventCard は ListDefault / GridDefault)。
// id は index.json で実在を確認したものを利用する。
const STORY_TARGETS: { id: string; expectSelector: string }[] = [
  { id: "ui-button--default", expectSelector: "button" },
  // Badge は <span> (text-only). class でなく要素名 + 文字で確認。
  { id: "ui-badge--default", expectSelector: "span" },
  // EventCard は <div role="article"> (not <article>). role 属性で検索する。
  { id: "components-eventcard--list-default", expectSelector: '[role="article"]' },
  { id: "components-footer--default", expectSelector: "footer, [role='contentinfo']" },
];

test.beforeAll(async ({ request }) => {
  // Storybook (dev / static) に index.json が到達できるか軽量チェック
  const r = await request.get(`${SB_BASE}/index.json`, { failOnStatusCode: false });
  if (!r.ok()) {
    throw new Error(
      `Storybook is not reachable at ${SB_BASE}/index.json (status ${r.status()}). ` +
        `Set STORYBOOK_BASE_URL env var, or run \`pnpm storybook\` (dev) / \`pnpm build-storybook\` + serve (static).`,
    );
  }
});

for (const { id, title } of DOCS_TARGETS) {
  test(`@smoke @sb-rendering Storybook docs renders: ${id}`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => {
      if (m.type() === "error") consoleErrors.push(`console.error: ${m.text()}`);
    });

    const url = `${SB_BASE}/iframe.html?id=${id}&viewMode=docs`;
    const response = await page.goto(url, { waitUntil: "load" });
    expect(response?.status(), `${id} returned non-OK`).toBeLessThan(400);

    // Storybook の preview が hydrate するまで待つ (sb-show-main は preview ready のシグナル)
    await page
      .waitForFunction(
        () => document.body.classList.contains("sb-show-main") || document.querySelector("#storybook-docs"),
        { timeout: 15_000 },
      )
      .catch(() => undefined);

    // No Preview が visible でないこと (= attached-mdx が正しく解決された)
    await expect(
      page.locator(".sb-nopreview"),
      `${id}: "No Preview" が表示されている (MDX attach or stories glob が壊れている)`,
    ).not.toBeVisible();

    // Rendering error が出ていないこと (React error / undefined ref 等)
    await expect(
      page.locator(".sb-errordisplay"),
      `${id}: Storybook の error display が表示されている (rendering error)`,
    ).not.toBeVisible();

    // docs page なので component の title (= title="Components/EventCard" などの最終セグメント) が
    // ページ内に出現すること
    await expect(page.locator("body"), `${id}: docs content にタイトル "${title}" が現れない`).toContainText(title);

    // page-level error (uncaught exception / minified React error など) が 0 件であること
    expect(consoleErrors, `${id}: console error がある:\n${consoleErrors.join("\n")}`).toEqual([]);
  });
}

for (const { id, expectSelector } of STORY_TARGETS) {
  test(`@smoke @sb-rendering Storybook story renders: ${id}`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => {
      if (m.type() === "error") consoleErrors.push(`console.error: ${m.text()}`);
    });

    const url = `${SB_BASE}/iframe.html?id=${id}&viewMode=story`;
    const response = await page.goto(url, { waitUntil: "load" });
    expect(response?.status()).toBeLessThan(400);

    await page
      .waitForFunction(() => document.body.classList.contains("sb-show-main"), { timeout: 15_000 })
      .catch(() => undefined);

    await expect(
      page.locator(".sb-nopreview"),
      `${id}: "No Preview" が表示されている`,
    ).not.toBeVisible();
    await expect(
      page.locator(".sb-errordisplay"),
      `${id}: rendering error が出ている`,
    ).not.toBeVisible();

    // story 内で期待 DOM が描画されていること。Storybook addon (controls 等) が
    // `<button>Set string</button>` のような hidden 要素を生やすので、
    // story root (`#storybook-root`) 配下に限定する。
    await expect(
      page.locator(`#storybook-root ${expectSelector}`).first(),
      `${id}: 期待 selector "${expectSelector}" が #storybook-root 配下に見つからない`,
    ).toBeVisible({ timeout: 5_000 });

    expect(consoleErrors, `${id}: console error がある:\n${consoleErrors.join("\n")}`).toEqual([]);
  });
}
