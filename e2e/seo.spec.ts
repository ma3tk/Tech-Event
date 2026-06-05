/**
 * SEO 関連 E2E スモークテスト。
 *
 * - sitemap.xml / robots.txt / feed.xml が 200 で返ること
 * - イベント詳細ページに OG メタタグと JSON-LD が出ること
 * - イベント詳細の OG 画像エンドポイントが image/* を返すこと
 */
import { test, expect } from "@playwright/test";

test("/sitemap.xml が urlset を含み、十分な数の <url> を持つ", async ({
  request,
}) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toContain("<urlset");
  const urlCount = (body.match(/<url>/g) ?? []).length;
  expect(urlCount).toBeGreaterThanOrEqual(30);
});

test("/robots.txt が Disallow: /dashboard を含む", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toContain("Disallow: /dashboard");
});

test("/feed.xml が rss を含む", async ({ request }) => {
  const res = await request.get("/feed.xml");
  expect(res.status()).toBe(200);
  const contentType = res.headers()["content-type"] ?? "";
  expect(contentType).toContain("application/rss+xml");
  const body = await res.text();
  expect(body).toContain("<rss");
  expect(body).toContain("<channel>");
});

test("/event/1 の HTML に og:title と JSON-LD が含まれる", async ({
  page,
}) => {
  const response = await page.goto("/event/1", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBeLessThan(400);
  const ogTitle = page.locator('meta[property="og:title"]');
  await expect(ogTitle).toHaveCount(1);
  await expect(ogTitle).toHaveAttribute("content", /.+/);
  const jsonLd = page.locator('script[type="application/ld+json"]');
  // 少なくとも 1 つは JSON-LD が存在
  expect(await jsonLd.count()).toBeGreaterThanOrEqual(1);
});

test("/event/1/opengraph-image が image/* を返す", async ({ request }) => {
  const res = await request.get("/event/1/opengraph-image");
  expect(res.status()).toBe(200);
  const contentType = res.headers()["content-type"] ?? "";
  expect(contentType.startsWith("image/")).toBe(true);
});
