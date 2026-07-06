/**
 * /discover/[city] + /discover/category/[slug] (SEO ランディングページ) の E2E テスト。
 *
 * 検証観点:
 *  1. 都市 LP (/discover/tokyo) が 200 で開き、H1 / metadata title / イベント一覧が見える
 *  2. 都市 LP に JSON-LD (ItemList) と explore へのディープリンクがある
 *  3. オンライン LP (/discover/online) が開きイベントが見える
 *  4. カテゴリ LP (/discover/category/ai) が 200 で開き、H1 / metadata title / イベント一覧が見える
 *  5. 存在しない都市 / カテゴリは 404
 *  6. /discover トップから LP へのリンク導線が機能する
 *
 * すべて locator-based 待機 (waitForTimeout 禁止)。
 */

import { test, expect, type Page } from "@playwright/test";

/**
 * notFound() の検証ヘルパー。
 *
 * loading.tsx (App Router) が Suspense fallback として streaming される関係で、
 * HTTP ステータスは streaming 開始時点で確定する。Next.js 16 では notFound() で
 * 404 ステータスを返す一方、ストリーミング後の notFound() ではクライアント
 * フォールバックで not-found 表示になり、初期 HTTP は 200 になる場合がある。
 * どちらでも「404 or 200 + not-found 表示」で受け入れる (event-detail.spec.ts と同じ方式)。
 */
async function expectNotFound(page: Page, url: string): Promise<void> {
  const response = await page.goto(url, { waitUntil: "domcontentloaded" });
  const status = response?.status() ?? 0;
  if (status !== 404) {
    const hasNotFound = await page
      .locator(
        'meta[name="next-error"][content="not-found"], [data-testid="not-found"]',
      )
      .first()
      .count();
    expect(hasNotFound, `${url} should render not-found`).toBeGreaterThan(0);
  } else {
    expect(status).toBe(404);
  }
}

test.describe("Discover 都市別 LP", () => {
  test("都市 LP (/discover/tokyo) が開きイベントと metadata title が見える", async ({
    page,
  }) => {
    const response = await page.goto("/discover/tokyo", {
      waitUntil: "domcontentloaded",
    });
    expect(
      response?.status(),
      "/discover/tokyo should return 2xx/3xx",
    ).toBeLessThan(400);

    // metadata title (layout の template で "| tech-event" が付く)
    await expect(page).toHaveTitle(/東京都のテックイベント・勉強会一覧/);

    // H1
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "東京都のテックイベント・勉強会",
      }),
    ).toBeVisible();

    // 開催予定イベントの一覧 (seed に東京都の published イベントが存在する)
    const list = page.getByTestId("discover-city-events");
    await expect(list).toBeVisible();
    expect(await list.locator("li").count()).toBeGreaterThan(0);

    // Breadcrumb (ホーム > Discover > 東京都)
    const breadcrumb = page.getByRole("navigation", {
      name: "パンくずリスト",
    });
    await expect(breadcrumb.getByRole("link", { name: "Discover" })).toBeVisible();

    // JSON-LD (ItemList) が埋め込まれている
    const jsonLdTexts = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const hasItemList = jsonLdTexts.some((t) => {
      try {
        const parsed = JSON.parse(t) as {
          "@type"?: string;
          mainEntity?: { "@type"?: string };
        };
        return (
          parsed["@type"] === "CollectionPage" &&
          parsed.mainEntity?.["@type"] === "ItemList"
        );
      } catch {
        return false;
      }
    });
    expect(hasItemList, "CollectionPage + ItemList JSON-LD should exist").toBe(
      true,
    );

    // explore へのディープリンク (既存フィルタクエリ維持)
    await expect(
      page.getByTestId("discover-city-explore-link"),
    ).toHaveAttribute("href", "/explore?prefecture=tokyo");
  });

  test("オンライン LP (/discover/online) が開きイベントが見える", async ({
    page,
  }) => {
    const response = await page.goto("/discover/online", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBeLessThan(400);

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "オンライン開催のテックイベント・勉強会",
      }),
    ).toBeVisible();

    const list = page.getByTestId("discover-city-events");
    await expect(list).toBeVisible();
    expect(await list.locator("li").count()).toBeGreaterThan(0);

    await expect(
      page.getByTestId("discover-city-explore-link"),
    ).toHaveAttribute("href", "/explore?online=1");
  });

  test("存在しない都市 (/discover/atlantis) は 404", async ({ page }) => {
    await expectNotFound(page, "/discover/atlantis");
  });

  test("都市 LP に他の開催地への内部リンクがある", async ({ page }) => {
    await page.goto("/discover/tokyo", { waitUntil: "domcontentloaded" });
    const others = page.getByTestId("discover-city-others");
    await expect(others).toBeVisible();
    // 大阪府へのリンクから遷移できる
    await others.getByRole("link", { name: "大阪府" }).click();
    await page.waitForURL(/\/discover\/osaka/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "大阪府のテックイベント・勉強会",
      }),
    ).toBeVisible();
  });
});

test.describe("Discover カテゴリ別 LP", () => {
  test("カテゴリ LP (/discover/category/ai) が開きイベントと metadata title が見える", async ({
    page,
  }) => {
    const response = await page.goto("/discover/category/ai", {
      waitUntil: "domcontentloaded",
    });
    expect(
      response?.status(),
      "/discover/category/ai should return 2xx/3xx",
    ).toBeLessThan(400);

    // metadata title
    await expect(page).toHaveTitle(/AIのテックイベント・勉強会一覧/);

    // H1
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "AIのテックイベント・勉強会",
      }),
    ).toBeVisible();

    // 開催予定イベントの一覧 (seed に AI タグ付き published イベントが存在する)
    const list = page.getByTestId("discover-category-events");
    await expect(list).toBeVisible();
    expect(await list.locator("li").count()).toBeGreaterThan(0);

    // JSON-LD (ItemList)
    const jsonLdTexts = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const hasItemList = jsonLdTexts.some((t) => {
      try {
        const parsed = JSON.parse(t) as {
          "@type"?: string;
          mainEntity?: { "@type"?: string };
        };
        return (
          parsed["@type"] === "CollectionPage" &&
          parsed.mainEntity?.["@type"] === "ItemList"
        );
      } catch {
        return false;
      }
    });
    expect(hasItemList, "CollectionPage + ItemList JSON-LD should exist").toBe(
      true,
    );

    // explore へのディープリンク (tag クエリ維持)
    await expect(
      page.getByTestId("discover-category-explore-link"),
    ).toHaveAttribute("href", /\/explore\?tag=/);
  });

  test("存在しないカテゴリ (/discover/category/quantum) は 404", async ({
    page,
  }) => {
    await expectNotFound(page, "/discover/category/quantum");
  });

  test("カテゴリ LP に他カテゴリへの内部リンクがある", async ({ page }) => {
    await page.goto("/discover/category/ai", {
      waitUntil: "domcontentloaded",
    });
    const others = page.getByTestId("discover-category-others");
    await expect(others).toBeVisible();
    await others.getByRole("link", { name: "セキュリティ" }).click();
    await page.waitForURL(/\/discover\/category\/security/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "セキュリティのテックイベント・勉強会",
      }),
    ).toBeVisible();
  });
});

test.describe("Discover トップ → LP 導線", () => {
  test("都市カード横のリンクから都市 LP へ遷移できる", async ({ page }) => {
    await page.goto("/discover", { waitUntil: "domcontentloaded" });
    const lpLink = page.getByTestId("discover-city-lp-tokyo");
    await expect(lpLink).toBeVisible();
    await lpLink.click();
    await page.waitForURL(/\/discover\/tokyo/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "東京都のテックイベント・勉強会",
      }),
    ).toBeVisible();
  });

  test("カテゴリカード横のリンクからカテゴリ LP へ遷移できる", async ({
    page,
  }) => {
    await page.goto("/discover", { waitUntil: "domcontentloaded" });
    const lpLink = page.getByTestId("discover-category-lp-ai");
    await expect(lpLink).toBeVisible();
    await lpLink.click();
    await page.waitForURL(/\/discover\/category\/ai/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "AIのテックイベント・勉強会",
      }),
    ).toBeVisible();
  });

  test("47 都道府県のリンク集 (discover-prefecture-links) が表示される", async ({
    page,
  }) => {
    await page.goto("/discover", { waitUntil: "domcontentloaded" });
    const nav = page.getByTestId("discover-prefecture-links");
    await expect(nav).toBeVisible();
    // 47 都道府県 + オンライン = 48 リンク
    expect(await nav.getByRole("link").count()).toBe(48);
  });
});
