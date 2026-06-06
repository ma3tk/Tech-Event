/**
 * iCalendar (.ics) ダウンロード E2E。
 *
 * 検証項目:
 *   - GET /event/1/ics で
 *       - HTTP 200
 *       - Content-Type に `text/calendar` を含む
 *       - 本文に `BEGIN:VCALENDAR` と `SUMMARY:` を含む
 *   - GET /group/findy/ics で
 *       - Content-Type に `text/calendar` を含む
 *       - 本文に `BEGIN:VCALENDAR` を含む
 */
import { test, expect } from "@playwright/test";

test.describe("iCal ダウンロード", () => {
  test("GET /event/1/ics は VCALENDAR を返す", async ({ request }) => {
    const res = await request.get("/event/1/ics");
    expect(res.status()).toBe(200);

    const ct = res.headers()["content-type"];
    expect(ct).toContain("text/calendar");

    const body = await res.text();
    expect(body).toContain("BEGIN:VCALENDAR");
    expect(body).toContain("END:VCALENDAR");
    expect(body).toContain("SUMMARY:");
    expect(body).toContain("DTSTART:");
    expect(body).toContain("DTEND:");
    expect(body).toContain("UID:");
    // CRLF 改行
    expect(body).toContain("\r\n");
    // UTC 形式 (YYYYMMDDTHHMMSSZ)
    expect(body).toMatch(/DTSTART:\d{8}T\d{6}Z/);
  });

  test("GET /group/findy/ics はグループ VCALENDAR を返す", async ({
    request,
  }) => {
    const res = await request.get("/group/findy/ics");
    expect(res.status()).toBe(200);

    const ct = res.headers()["content-type"];
    expect(ct).toContain("text/calendar");

    const body = await res.text();
    expect(body).toContain("BEGIN:VCALENDAR");
    expect(body).toContain("END:VCALENDAR");
  });

  test("存在しないイベントは 404", async ({ request }) => {
    const res = await request.get("/event/99999/ics");
    expect(res.status()).toBe(404);
  });
});
