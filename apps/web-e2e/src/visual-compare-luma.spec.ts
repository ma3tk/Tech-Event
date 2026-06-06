import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

// Luma本家とクローンサイトの同一カテゴリページのスクショを並べて取得する。
// connpass版と同様に「主要セクションが同等数あるか」を目視確認するための画像を生成する。
// Luma側はURLが変動 / 404になり得るため、取得失敗時は warn のみで test fail にはしない。

// 認証必須ページは `needsAuth: true` を立てる。
const PAIRS: {
  name: string;
  clone: string;
  luma: string;
  fallbacks?: string[];
  needsAuth?: boolean;
}[] = [
  // 既存 6 ペア
  { name: "top", clone: "/", luma: "https://luma.com/" },
  { name: "discover", clone: "/explore", luma: "https://luma.com/discover" },
  {
    name: "event-detail",
    clone: "/event/1",
    luma: "https://luma.com/ai-tinkerers",
    fallbacks: ["https://luma.com/openai", "https://luma.com/sf"],
  },
  {
    name: "calendar",
    clone: "/group/findy",
    luma: "https://luma.com/tokyo",
    fallbacks: ["https://luma.com/sf"],
  },
  {
    name: "user-profile",
    clone: "/user/fast_moon_169",
    luma: "https://luma.com/peterm",
    fallbacks: ["https://luma.com/user/usr-xxx"],
  },
  { name: "signin", clone: "/login", luma: "https://luma.com/signin" },
  // 新規追加 7 ペア (Luma 側に近い対応物がない場合は discover や tokyo を流用)
  {
    name: "discover-page",
    clone: "/discover",
    luma: "https://luma.com/discover",
  },
  {
    name: "calendar-ai",
    clone: "/calendar/ai-developers",
    luma: "https://luma.com/ai",
    fallbacks: ["https://luma.com/sf"],
  },
  {
    name: "calendars",
    clone: "/calendars",
    luma: "https://luma.com/discover/calendars",
    fallbacks: ["https://luma.com/discover"],
  },
  {
    name: "bookmarks",
    clone: "/bookmarks",
    luma: "https://luma.com/home",
    fallbacks: ["https://luma.com/discover"],
    needsAuth: true,
  },
  {
    name: "notifications",
    clone: "/notifications",
    luma: "https://luma.com/home",
    fallbacks: ["https://luma.com/discover"],
    needsAuth: true,
  },
  {
    name: "user-timeline",
    clone: "/user/fast_moon_169?view=timeline",
    luma: "https://luma.com/peterm",
    fallbacks: ["https://luma.com/discover"],
  },
  {
    name: "group-timeline",
    clone: "/group/findy?view=timeline",
    luma: "https://luma.com/tokyo",
    fallbacks: ["https://luma.com/sf"],
  },
];

const DEV_NICKNAME = "fast_moon_169";

const SCREENSHOT_DIR = path.join(process.cwd(), "screenshots");

test.beforeAll(async () => {
  for (const sub of ["clone", "luma"]) {
    fs.mkdirSync(path.join(SCREENSHOT_DIR, sub), { recursive: true });
  }
});

for (const pair of PAIRS) {
  test(`luma screenshot pair: ${pair.name}`, async ({ browser }) => {
    // 本テストは luma.com (外部) を撮影してクローンと並べる比較ツール。
    // CI では外部ネットワークが不安定 + そもそも CI 緑判定に不要なので skip。
    // ローカル `pnpm vrt:luma` 等で意図的に走らせる用途。
    test.skip(
      process.env.CI === "true",
      "外部 (luma.com) アクセスを含むため CI では skip",
    );
    test.setTimeout(120_000);
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 1600 },
      // Playwright config の use.baseURL は newContext には自動継承されない。
      baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    });
    const page = await ctx.newPage();

    // クローン側 (luma比較用なのでファイル名を別にして既存と共存させる)
    const cloneFile = path.join(SCREENSHOT_DIR, "clone", `${pair.name}-luma.png`);
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
      await page.screenshot({ path: cloneFile, fullPage: true });
    } catch (e) {
      console.warn(`clone側の取得失敗 (${pair.name}): ${e}`);
    }

    // Luma 本家 (主URL → fallback の順で試す)
    const lumaFile = path.join(SCREENSHOT_DIR, "luma", `${pair.name}.png`);
    const candidates = [pair.luma, ...(pair.fallbacks ?? [])];
    let captured = false;
    for (const url of candidates) {
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25_000 });
        await page.waitForTimeout(2_000);
        await page.screenshot({ path: lumaFile, fullPage: true });
        captured = true;
        break;
      } catch (e) {
        console.warn(`Luma本家の取得失敗 (${pair.name} / ${url}): ${e}`);
      }
    }
    if (!captured) {
      console.warn(`Luma本家を全候補で取得できず (${pair.name})`);
    }
    await ctx.close();

    // clone 側だけは存在を期待 (これすら失敗するならテスト失敗で問題ない)
    expect(fs.existsSync(cloneFile)).toBe(true);
  });
}
