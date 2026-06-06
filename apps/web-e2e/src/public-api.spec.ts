/**
 * 公開 REST API (`/api/v2/*`) の E2E テスト。
 *
 * 検証項目:
 *  - X-API-Key ヘッダなし → 401
 *  - User-Agent が空 → 403
 *  - 正規ヘッダ + ?keyword= → 200 + JSON 形式
 *  - レート制限: 同一キーで連続2回叩くと2回目が 429
 */
import { test, expect } from "@playwright/test";

const API_KEY = "dev-public-api-key-please-change";
const UA = "tech-event-e2e/1.0";

// 並列実行されると同一APIキーのレート制限が他テストと干渉して 429 が混入するので、
// dev 環境では `X-Test-Bypass-Rate-Limit: 1` を送信してバイパスする。
// (本番環境ではバイパスヘッダは無効化されているため安全)
//
// レート制限を意図的に確認するテストのみ、ヘッダを送らずデフォルト挙動とする。
const BYPASS_HEADERS = {
  "X-API-Key": API_KEY,
  "User-Agent": UA,
  "X-Test-Bypass-Rate-Limit": "1",
} as const;

// レート制限テスト自身は serial 実行にしておかないと他テストの 200 と衝突する。
test.describe.configure({ mode: "serial" });

test.describe("公開 REST API /api/v2", () => {
  test("X-API-Key なし → 401", async ({ request }) => {
    const res = await request.get("/api/v2/events/?keyword=AI", {
      headers: { "User-Agent": UA },
    });
    expect(res.status()).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("unauthorized");
  });

  test("User-Agent 不正 (空) → 403", async ({ request }) => {
    const res = await request.get("/api/v2/events/?keyword=AI", {
      headers: { "X-API-Key": API_KEY, "User-Agent": "" },
    });
    expect(res.status()).toBe(403);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("forbidden");
  });

  test("正規ヘッダ + ?keyword= → 200 + JSON 形式", async ({ request }) => {
    // Bypass ヘッダを使うのでレート制限と無関係に通る
    const res = await request.get("/api/v2/events/?keyword=AI&count=2", {
      headers: BYPASS_HEADERS,
    });
    expect(res.status()).toBe(200);
    expect(res.headers()["access-control-allow-origin"]).toBe("*");
    const body = (await res.json()) as {
      results_start: number;
      results_returned: number;
      results_available: number;
      events: unknown[];
    };
    expect(typeof body.results_start).toBe("number");
    expect(typeof body.results_returned).toBe("number");
    expect(typeof body.results_available).toBe("number");
    expect(Array.isArray(body.events)).toBe(true);
    expect(body.results_start).toBe(1);
    expect(body.results_returned).toBeLessThanOrEqual(2);
  });

  test("レート制限: 連続2回叩くと2回目が 429", async ({ request }) => {
    // 他テストとキーが共通なので、レート制限のウィンドウをずらす
    await new Promise((r) => setTimeout(r, 1100));

    // 1 回目: 200 (or 任意の成功)
    const first = await request.get("/api/v2/groups/?subdomain=findy", {
      headers: { "X-API-Key": API_KEY, "User-Agent": UA },
    });
    expect(first.status()).toBe(200);

    // 2 回目: 即座に叩く → 429
    const second = await request.get("/api/v2/groups/?subdomain=layerx", {
      headers: { "X-API-Key": API_KEY, "User-Agent": UA },
    });
    expect(second.status()).toBe(429);
    const body = (await second.json()) as { error: string };
    expect(body.error).toBe("rate_limited");
  });
});
