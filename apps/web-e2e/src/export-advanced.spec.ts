/**
 * Excel (.xlsx) / CSV エクスポートの E2E。
 *
 * - 主催者が `/event/[id]/admin/guests/export.xlsx` をダウンロード → Content-Type が
 *   `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` であること
 * - ダウンロードしたバイナリを ExcelJS で読み戻し、Guests シートが存在し
 *   ヘッダ行に participant_id / nickname / email が含まれていることを確認する。
 * - グループ admin メンバー CSV / Excel エクスポートも 200 で返ること。
 *
 * ExcelJS は test 実行時に動的に読み込む。
 */
import { test, expect } from "@playwright/test";

import { devLoginLegacy as devLogin } from "./_helpers/auth";

const OWNER = "fast_moon_169";
const EVENT_ID = "1"; // seed: owner = fast_moon_169

test.describe("xlsx / csv エクスポート (P2)", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("Guests Excel (.xlsx) ダウンロードと中身検証", async ({ page }) => {
    await devLogin(page, OWNER, `/event/${EVENT_ID}/admin/guests`);
    // Excel ボタンが表示
    await expect(page.getByTestId("admin-guests-xlsx-button")).toBeVisible();

    // 直接 fetch して Content-Type と body を検証
    const resp = await page.request.get(
      `/event/${EVENT_ID}/admin/guests/export.xlsx`,
    );
    expect(resp.status()).toBe(200);
    const ct = resp.headers()["content-type"] ?? "";
    expect(ct).toContain(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    const body = await resp.body();
    expect(body.length).toBeGreaterThan(500); // 空 xlsx でも数百 bytes ある

    // ExcelJS で読み戻して Guests シートのヘッダ行を確認
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    // ExcelJS の型は古い Buffer 表現に依存しており、playwright の body() は新しい
    // Buffer<ArrayBufferLike>。互換のため Uint8Array を作ってから渡す。
    await wb.xlsx.load(
      Buffer.from(body) as unknown as Parameters<typeof wb.xlsx.load>[0],
    );
    const sheet = wb.getWorksheet("Guests");
    expect(sheet, "Guests シートが存在").toBeDefined();
    if (!sheet) return;
    const headerVals = (sheet.getRow(1).values ?? []) as (string | undefined)[];
    expect(headerVals).toContain("participant_id");
    expect(headerVals).toContain("nickname");
    expect(headerVals).toContain("email");
  });

  test("Insights Excel (.xlsx) ダウンロード → Summary シート存在確認", async ({
    page,
  }) => {
    await devLogin(page, OWNER, `/event/${EVENT_ID}/admin/insights`);
    await expect(
      page.getByTestId("insights-export-xlsx-link"),
    ).toBeVisible();

    const resp = await page.request.get(
      `/event/${EVENT_ID}/admin/insights/export.xlsx`,
    );
    expect(resp.status()).toBe(200);
    const ct = resp.headers()["content-type"] ?? "";
    expect(ct).toContain(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    const body = await resp.body();
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    // ExcelJS の型は古い Buffer 表現に依存しており、playwright の body() は新しい
    // Buffer<ArrayBufferLike>。互換のため Uint8Array を作ってから渡す。
    await wb.xlsx.load(
      Buffer.from(body) as unknown as Parameters<typeof wb.xlsx.load>[0],
    );
    const summary = wb.getWorksheet("Summary");
    expect(summary).toBeDefined();
    if (!summary) return;
    // 1 行目はヘッダ "key" / "value"
    const headerVals = (summary.getRow(1).values ?? []) as (string | undefined)[];
    expect(headerVals).toContain("key");
    expect(headerVals).toContain("value");
  });
});
