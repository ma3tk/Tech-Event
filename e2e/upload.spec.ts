/**
 * 画像アップロード E2E。
 *
 * シナリオ:
 *   1. dev-login で `fast_moon_169` (id=1, fast_moon_169 が複数イベントの owner)
 *      または既存 owner ユーザーでログイン
 *   2. /event/<id>/edit を開く (owner なので編集可)
 *   3. ImageUploader の file input に小さい PNG を流し込む
 *   4. /api/uploads/image が 200 を返し、hidden の coverImageUrl が `/uploads/...`
 *      で始まる URL に置き換わる
 *   5. フォーム送信せず、URL 抽出のみで検証 (フォーム保存は create-flow.spec.ts で別途検証)
 *
 * 認証必須エンドポイントの確認:
 *   - 未ログインの POST /api/uploads/image は 401
 */
import path from "node:path";
import Database from "better-sqlite3";
import { test, expect } from "@playwright/test";

const DB_PATH = path.resolve(process.cwd(), "dev.db");
const DEV_USER = "fast_moon_169";

/** dev.db から DEV_USER が owner の event id を 1 件取る (なければ null) */
function pickEventIdOwnedBy(nickname: string): string | null {
  const db = new Database(DB_PATH, { readonly: true });
  try {
    const row = db
      .prepare(
        `SELECT e.id AS id FROM events e
         JOIN users u ON u.id = e.ownerId
         WHERE u.nickname = ? AND e.status != 'cancelled'
         ORDER BY e.id ASC LIMIT 1`,
      )
      .get(nickname) as { id: bigint | number | string } | undefined;
    if (!row) return null;
    return String(row.id);
  } finally {
    db.close();
  }
}

/** 1x1 PNG (89 bytes) を構築する: アップロード対象として使う */
function tinyPngBuffer(): Buffer {
  // 標準的な 1x1 RGBA PNG
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  );
}

test.describe("画像アップロード", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("未ログインだと /api/uploads/image は 401 を返す", async ({ request }) => {
    const res = await request.post("/api/uploads/image", {
      multipart: {
        file: {
          name: "tiny.png",
          mimeType: "image/png",
          buffer: tinyPngBuffer(),
        },
        kind: "raw",
      },
    });
    expect(res.status()).toBe(401);
  });

  test("dev-login → イベント編集ページで画像アップロード → coverImageUrl が反映", async ({
    page,
  }) => {
    test.setTimeout(60_000);

    const eventId = pickEventIdOwnedBy(DEV_USER);
    test.skip(eventId === null, `no event owned by ${DEV_USER} in seed`);

    // 1. dev-login
    await page.goto(
      `/api/auth/dev-login?nickname=${encodeURIComponent(
        DEV_USER,
      )}&next=${encodeURIComponent(`/event/${eventId}/edit`)}`,
    );
    await page.waitForURL(new RegExp(`/event/${eventId}/edit`));
    await expect(page.getByTestId("event-edit-form")).toBeVisible();

    // 2. ImageUploader の file input に PNG を流し込む
    const fileInput = page.getByTestId("image-uploader-input-coverImageUrl");
    await fileInput.setInputFiles({
      name: "tiny.png",
      mimeType: "image/png",
      buffer: tinyPngBuffer(),
    });

    // 3. 状態が「アップロード完了」まで進むのを待つ (タイムアウト 15s)
    const status = page.getByTestId("image-uploader-status-coverImageUrl");
    await expect(status).toContainText(/アップロード完了|アップロード中|エラー/, {
      timeout: 15_000,
    });
    // 最終的に成功すること
    await expect(status).toContainText("アップロード完了", { timeout: 15_000 });

    // 4. hidden input の value が /uploads/ で始まる
    const hidden = page.getByTestId("image-uploader-hidden-coverImageUrl");
    const value = await hidden.inputValue();
    expect(value).toMatch(/^\/uploads\//);
    // 5. プレビュー img が表示される
    const preview = page.getByTestId("image-uploader-preview-coverImageUrl");
    await expect(preview).toBeVisible();
    const src = await preview.getAttribute("src");
    expect(src).toMatch(/^\/uploads\//);
  });
});
