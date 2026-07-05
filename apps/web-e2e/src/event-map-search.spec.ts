/**
 * connpass ギャップ実装の E2E テスト:
 *  1. イベント詳細ページの会場地図 (OpenStreetMap iframe 埋め込み)
 *  2. /explore の都道府県セレクト (47 都道府県 + オンライン + 海外)
 *  3. 公開 API /api/v2/events の keyword_or (OR 検索) パラメータ
 *
 * API テストは public-api.spec.ts と同様に X-Test-Bypass-Rate-Limit ヘッダで
 * レート制限をバイパスする (本番では無効化されるため安全)。
 */
import { test, expect } from "@playwright/test";

const API_KEY = "dev-public-api-key-please-change";
const UA = "tech-event-e2e/1.0";

const BYPASS_HEADERS = {
  "X-API-Key": API_KEY,
  "User-Agent": UA,
  "X-Test-Bypass-Rate-Limit": "1",
} as const;

type ApiEvent = {
  id: number;
  title: string;
  lat: number | string | null;
  lon: number | string | null;
  group: { subdomain: string | null };
};

type ApiEventsResponse = {
  results_start: number;
  results_returned: number;
  results_available: number;
  events: ApiEvent[];
};

test.describe("会場地図 (OpenStreetMap 埋め込み)", () => {
  test("lat/lon を持つイベント詳細に地図 iframe と「大きい地図で見る」リンクが表示される", async ({
    page,
    request,
  }) => {
    // 公開 API から lat/lon を持つイベントを 1 件特定する (seed 依存を最小化)
    const res = await request.get("/api/v2/events/?count=100", {
      headers: BYPASS_HEADERS,
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as ApiEventsResponse;
    const withGeo = body.events.find((e) => e.lat != null && e.lon != null);
    expect(
      withGeo,
      "lat/lon を持つ seed イベントが存在すること",
    ).toBeTruthy();

    await page.goto(`/event/${withGeo!.id}`);

    // 会場セクションの地図 iframe (OSM export/embed.html + marker)
    const map = page.getByTestId("venue-map");
    await expect(map).toBeVisible();
    await expect(map).toHaveAttribute(
      "src",
      /https:\/\/www\.openstreetmap\.org\/export\/embed\.html\?bbox=.+&layer=mapnik&marker=/,
    );
    await expect(map).toHaveAttribute("loading", "lazy");

    // 地図下の外部リンク (OSM / Google Maps)
    const osmLink = page.getByRole("link", {
      name: /大きい地図で見る \(OpenStreetMap\)/,
    });
    await expect(osmLink).toBeVisible();
    await expect(osmLink).toHaveAttribute(
      "href",
      /https:\/\/www\.openstreetmap\.org\/\?mlat=/,
    );
    const gmapLink = page.getByRole("link", { name: /Google マップで開く/ });
    await expect(gmapLink).toBeVisible();
    await expect(gmapLink).toHaveAttribute(
      "href",
      /https:\/\/www\.google\.com\/maps\?q=/,
    );
  });
});

test.describe("/explore 都道府県セレクト", () => {
  test("開催地セレクトが 47 都道府県 + オンライン + 海外 を網羅している", async ({
    page,
  }) => {
    await page.goto("/explore");

    const select = page.locator("#filter-pref");
    await expect(select).toBeVisible();

    // 指定なし (1) + 47 都道府県 + オンライン + 海外 = 50 options
    await expect(select.locator("option")).toHaveCount(50);

    // 47 都道府県が connpass 互換スラグで揃っていることを代表値で検証
    await expect(select.locator('option[value="hokkaido"]')).toHaveText(
      "北海道",
    );
    await expect(select.locator('option[value="tokyo"]')).toHaveText("東京都");
    await expect(select.locator('option[value="tottori"]')).toHaveText(
      "鳥取県",
    );
    await expect(select.locator('option[value="okinawa"]')).toHaveText(
      "沖縄県",
    );
    await expect(select.locator('option[value="online"]')).toHaveText(
      "オンライン",
    );
    await expect(select.locator('option[value="overseas"]')).toHaveText(
      "海外",
    );

    // 既存クエリ `?prefecture=tokyo` の後方互換: 選択状態が復元され、絞り込みが効く
    await page.goto("/explore?prefecture=tokyo");
    await expect(page.locator("#filter-pref")).toHaveValue("tokyo");
    await expect(page.locator("#results-heading")).toBeVisible();
  });
});

test.describe("公開 API /api/v2/events keyword_or", () => {
  test("keyword_or は OR 検索としてヒットし、単一キーワードの上位集合になる", async ({
    request,
  }) => {
    // 個別キーワードでのヒット数
    const resA = await request.get("/api/v2/events/?keyword=AI&count=1", {
      headers: BYPASS_HEADERS,
    });
    expect(resA.status()).toBe(200);
    const bodyA = (await resA.json()) as ApiEventsResponse;

    const resB = await request.get("/api/v2/events/?keyword=Python&count=1", {
      headers: BYPASS_HEADERS,
    });
    expect(resB.status()).toBe(200);
    const bodyB = (await resB.json()) as ApiEventsResponse;

    // OR 検索: A OR B のヒット数は max(A, B) 以上になる
    const resOr = await request.get(
      "/api/v2/events/?keyword_or=AI,Python&count=5",
      { headers: BYPASS_HEADERS },
    );
    expect(resOr.status()).toBe(200);
    const bodyOr = (await resOr.json()) as ApiEventsResponse;
    expect(bodyOr.results_available).toBeGreaterThanOrEqual(
      Math.max(bodyA.results_available, bodyB.results_available),
    );

    // レスポンス JSON 形状は既存互換 (results_* + events[])
    expect(typeof bodyOr.results_start).toBe("number");
    expect(typeof bodyOr.results_returned).toBe("number");
    expect(Array.isArray(bodyOr.events)).toBe(true);
  });

  test("subdomain 指定で該当グループのイベントのみ返る", async ({
    request,
  }) => {
    const res = await request.get(
      "/api/v2/events/?subdomain=findy&count=100",
      { headers: BYPASS_HEADERS },
    );
    expect(res.status()).toBe(200);
    const body = (await res.json()) as ApiEventsResponse;
    expect(body.results_available).toBeGreaterThan(0);
    for (const e of body.events) {
      expect(e.group.subdomain).toBe("findy");
    }
  });

  test("publish_ym 形式不正は無視され、正しい形式では publishedAt で絞り込まれる", async ({
    request,
  }) => {
    // 全件数 (基準)
    const resAll = await request.get("/api/v2/events/?count=1", {
      headers: BYPASS_HEADERS,
    });
    expect(resAll.status()).toBe(200);
    const bodyAll = (await resAll.json()) as ApiEventsResponse;

    // 形式不正 (`12-04` 等) は条件として無視 → 全件と同数
    const resInvalid = await request.get(
      "/api/v2/events/?publish_ym=12-04&count=1",
      { headers: BYPASS_HEADERS },
    );
    expect(resInvalid.status()).toBe(200);
    const bodyInvalid = (await resInvalid.json()) as ApiEventsResponse;
    expect(bodyInvalid.results_available).toBe(bodyAll.results_available);

    // 未来すぎる公開年月ではヒット 0
    const resFuture = await request.get(
      "/api/v2/events/?publish_ym=209901&count=1",
      { headers: BYPASS_HEADERS },
    );
    expect(resFuture.status()).toBe(200);
    const bodyFuture = (await resFuture.json()) as ApiEventsResponse;
    expect(bodyFuture.results_available).toBe(0);
  });
});
