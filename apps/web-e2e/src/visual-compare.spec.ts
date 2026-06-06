import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

// connpass本家とクローンサイトの同一カテゴリページのスクショを並べて取得する。
// ピクセル差分まではしない (ロゴ・本物のイベントタイトルが違うので意味がない)
// 「主要セクションが同等数あるか」「fold above の構造一致」を目視確認するための画像を生成する。

// 認証必須ページは `needsAuth: true` を立てて dev-login 経由で先にセッションを張る。
const PAIRS: {
  name: string;
  clone: string;
  original: string;
  needsAuth?: boolean;
}[] = [
  // 既存 9 ペア
  { name: "top", clone: "/", original: "https://connpass.com/" },
  { name: "explore", clone: "/explore", original: "https://connpass.com/explore/" },
  { name: "ranking", clone: "/ranking", original: "https://connpass.com/ranking/" },
  { name: "login", clone: "/login", original: "https://connpass.com/login/" },
  { name: "series", clone: "/series", original: "https://connpass.com/series/" },
  { name: "event-detail", clone: "/event/1", original: "https://setk.connpass.com/event/356828/" },
  { name: "group-detail", clone: "/group/findy", original: "https://findy.connpass.com/" },
  { name: "user-profile", clone: "/user/fast_moon_169", original: "https://connpass.com/user/haru860/" },
  { name: "signup", clone: "/signup", original: "https://connpass.com/signup/" },
  // 新規追加ページ (connpass 側に直接対応がないものは「カテゴリ/お知らせ/カレンダー一覧」に近い URL で対照)
  { name: "discover", clone: "/discover", original: "https://connpass.com/explore/" },
  { name: "calendar-ai", clone: "/calendar/ai-developers", original: "https://connpass.com/explore/" },
  { name: "calendars", clone: "/calendars", original: "https://connpass.com/series/" },
  { name: "bookmarks", clone: "/bookmarks", original: "https://connpass.com/dashboard/", needsAuth: true },
  { name: "notifications", clone: "/notifications", original: "https://connpass.com/dashboard/", needsAuth: true },
  { name: "user-timeline", clone: "/user/fast_moon_169?view=timeline", original: "https://connpass.com/user/haru860/" },
  { name: "group-timeline", clone: "/group/findy?view=timeline", original: "https://findy.connpass.com/" },
];

const DEV_NICKNAME = "fast_moon_169";

const SCREENSHOT_DIR = path.join(process.cwd(), "screenshots");

test.beforeAll(async () => {
  for (const sub of ["clone", "connpass"]) {
    fs.mkdirSync(path.join(SCREENSHOT_DIR, sub), { recursive: true });
  }
});

// Playwright config の `use.baseURL` は `browser.newContext()` には自動継承されない。
// CI で `page.goto("/")` を呼ぶと "Invalid URL" になるため、env override も含めて
// 明示的に baseURL を context に渡す。
const E2E_BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

for (const pair of PAIRS) {
  test(`screenshot pair: ${pair.name}`, async ({ browser }) => {
    test.setTimeout(120_000);
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 1600 },
      baseURL: E2E_BASE_URL,
    });
    const page = await ctx.newPage();

    // 認証が必要な clone ページは dev-login 経由でセッションを張ってから遷移する。
    // dev-login 自体が next 指定先 (= 本来の clone URL) にリダイレクトしてくれるため、
    // ここでは dev-login URL に goto するだけで両方済む。
    try {
      if (pair.needsAuth) {
        const loginUrl = `/api/auth/dev-login?nickname=${encodeURIComponent(
          DEV_NICKNAME,
        )}&next=${encodeURIComponent(pair.clone)}`;
        await page.goto(loginUrl, { waitUntil: "domcontentloaded" });
      } else {
        await page.goto(pair.clone, { waitUntil: "domcontentloaded" });
      }
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, "clone", `${pair.name}.png`),
        fullPage: true,
      });
    } catch (e) {
      console.warn(`clone側の取得失敗 (${pair.name}): ${e}`);
    }

    // 本家 connpass (取得失敗時は warn のみ)
    try {
      await page.goto(pair.original, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.waitForTimeout(1200);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, "connpass", `${pair.name}.png`),
        fullPage: true,
      });
    } catch (e) {
      console.warn(`connpass本家の取得失敗 (${pair.name}): ${e}`);
    }
    await ctx.close();
    expect(fs.existsSync(path.join(SCREENSHOT_DIR, "clone", `${pair.name}.png`))).toBe(true);
  });
}
