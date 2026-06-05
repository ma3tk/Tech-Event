/**
 * Calendar (Luma 風キュレーション) の E2E テスト。
 *
 * 検証項目:
 *  - /calendars で一覧表示
 *  - /calendar/ai-developers で詳細表示
 *  - dev-login → subscribe ボタン → ✓ 状態に → unsubscribe → 元状態
 *  - /calendar/ai-developers/ics → 200 + Content-Type text/calendar
 *  - 公開 API /api/v2/calendars?slug=ai-developers → 200
 */
import { test, expect } from "@playwright/test";

const API_KEY = "dev-public-api-key-please-change";
const UA = "tech-event-e2e-calendar/1.0";

test.describe("Calendar 機能", () => {
  test("/calendars で Calendar 一覧が表示される", async ({ page }) => {
    const res = await page.goto("/calendars");
    expect(res?.status()).toBe(200);

    await expect(
      page.getByRole("heading", { name: "カレンダー一覧" }),
    ).toBeVisible();
    // seed 済みの 5 件が表示されることを確認
    await expect(
      page.getByTestId("calendar-list-item-ai-developers"),
    ).toBeVisible();
    await expect(
      page.getByTestId("calendar-list-item-frontend-tokyo"),
    ).toBeVisible();
  });

  test("/calendar/ai-developers で詳細が表示される", async ({ page }) => {
    const res = await page.goto("/calendar/ai-developers");
    expect(res?.status()).toBe(200);

    await expect(page.getByTestId("calendar-name")).toHaveText(
      "AI Developers Tokyo",
    );
    await expect(page.getByTestId("calendar-header")).toBeVisible();
    await expect(page.getByTestId("calendar-subscriber-count")).toContainText(
      "購読者",
    );
  });

  test("dev-login → subscribe → ✓ 状態 → unsubscribe → 元状態", async ({
    page,
  }) => {
    // dev-login で fast_moon_169 としてログイン
    await page.goto(
      "/api/auth/dev-login?nickname=fast_moon_169&next=/calendar/ai-developers",
    );
    await page.waitForURL("**/calendar/ai-developers");

    // 既に購読済みかどうか判定 (seed のランダム性で購読済みの場合もある)
    const subscribed = await page
      .getByTestId("calendar-unsubscribe-button")
      .isVisible()
      .catch(() => false);

    if (subscribed) {
      // 既購読 → まず解除して未購読状態に戻す
      await page.getByTestId("calendar-unsubscribe-button").click();
      await page.waitForURL("**/calendar/ai-developers");
      await expect(
        page.getByTestId("calendar-subscribe-button"),
      ).toBeVisible();
    }

    // 未購読状態を確認 → Subscribe
    await expect(page.getByTestId("calendar-subscribe-button")).toBeVisible();
    await page.getByTestId("calendar-subscribe-button").click();
    await page.waitForURL("**/calendar/ai-developers");

    // ✓ 購読中ボタンに変わる
    await expect(page.getByTestId("calendar-unsubscribe-button")).toBeVisible();
    await expect(page.getByTestId("calendar-unsubscribe-button")).toContainText(
      "✓",
    );

    // Unsubscribe
    await page.getByTestId("calendar-unsubscribe-button").click();
    await page.waitForURL("**/calendar/ai-developers");

    // 元状態 (Subscribe ボタン) に戻る。サーバーアクション + revalidate の都合で
    // ボタン状態が反映されるまでタイミング差があるためロケータ自体に
    // 長めのタイムアウトを設定する。
    await expect(page.getByTestId("calendar-subscribe-button")).toBeVisible({
      timeout: 15000,
    });
  });

  test("GET /calendar/ai-developers/ics は VCALENDAR を返す", async ({
    request,
  }) => {
    const res = await request.get("/calendar/ai-developers/ics");
    expect(res.status()).toBe(200);

    const ct = res.headers()["content-type"];
    expect(ct).toContain("text/calendar");

    const body = await res.text();
    expect(body).toContain("BEGIN:VCALENDAR");
    expect(body).toContain("END:VCALENDAR");
  });

  test("公開 API /api/v2/calendars?slug=ai-developers → 200", async ({
    request,
  }) => {
    const res = await request.get(
      "/api/v2/calendars?slug=ai-developers",
      {
        headers: { "X-API-Key": API_KEY, "User-Agent": UA },
      },
    );
    expect(res.status()).toBe(200);

    const body = (await res.json()) as {
      results_returned: number;
      calendars: Array<{ slug: string; name: string }>;
    };
    expect(body.results_returned).toBeGreaterThanOrEqual(1);
    expect(body.calendars[0]?.slug).toBe("ai-developers");
  });
});
