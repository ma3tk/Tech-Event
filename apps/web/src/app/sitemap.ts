/**
 * Next.js convention: 動的 sitemap.xml の生成。
 *
 * 含める URL:
 * - 静的ページ (/, /explore, /series, /ranking, /login, /signup, /about, /terms, /privacy)
 * - Discover LP (/discover/[city] 47 都道府県 + online、/discover/category/[slug] 6 カテゴリ)
 * - イベント詳細 (/event/[id]) — 公開済み 1000 件まで
 * - グループ詳細 (/group/[subdomain]) — active 全件
 * - ユーザープロフィール (/user/[nickname]) — active 5000 件まで
 *
 * lastmod は updatedAt、priority は重要度に応じて (top=1.0, event detail=0.8, etc) 設定。
 *
 * Next.js が自動的に XML へシリアライズし `/sitemap.xml` で配信する。
 */
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo";
import { DISCOVER_CATEGORIES } from "@/lib/categories";
import { ONLINE_LOCATION, PREFECTURES } from "@/lib/prefectures";

// SQLite の都合上 take は控えめにし、頻繁に再生成しないよう ISR 寄りで運用想定。
const EVENT_TAKE = 1000;
const USER_TAKE = 5000;

export const revalidate = 3600; // 1 時間ごとに再生成

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ============ 静的ページ ============
  const staticEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: absoluteUrl("/explore"), lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: absoluteUrl("/discover"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/calendars"), lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: absoluteUrl("/series"), lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: absoluteUrl("/ranking"), lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: absoluteUrl("/login"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/signup"), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: absoluteUrl("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/terms"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  // ============ Discover LP (都市 / カテゴリ別 SEO ランディング) ============
  const discoverCityEntries: MetadataRoute.Sitemap = [
    ONLINE_LOCATION,
    ...PREFECTURES,
  ].map((p) => ({
    url: absoluteUrl(`/discover/${p.slug}`),
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.7,
  }));
  const discoverCategoryEntries: MetadataRoute.Sitemap =
    DISCOVER_CATEGORIES.map((c) => ({
      url: absoluteUrl(`/discover/category/${c.slug}`),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    }));

  // ============ イベント詳細 ============
  const events = await prisma.event.findMany({
    where: {
      status: { in: ["published", "closed"] },
      visibility: "public",
    },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: EVENT_TAKE,
  });
  const eventEntries: MetadataRoute.Sitemap = events.map((e) => ({
    url: absoluteUrl(`/event/${e.id.toString()}`),
    lastModified: e.updatedAt,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  // ============ グループ詳細 ============
  const groups = await prisma.group.findMany({
    where: { status: "active" },
    select: { subdomain: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
  const groupEntries: MetadataRoute.Sitemap = groups.map((g) => ({
    url: absoluteUrl(`/group/${g.subdomain}`),
    lastModified: g.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // ============ ユーザープロフィール ============
  const users = await prisma.user.findMany({
    where: { status: "active" },
    select: { nickname: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: USER_TAKE,
  });
  const userEntries: MetadataRoute.Sitemap = users.map((u) => ({
    url: absoluteUrl(`/user/${u.nickname}`),
    lastModified: u.updatedAt,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  // ============ カレンダー詳細 ============
  const calendars = await prisma.calendar.findMany({
    where: { status: "active" },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
  const calendarEntries: MetadataRoute.Sitemap = calendars.map((c) => ({
    url: absoluteUrl(`/calendar/${c.slug}`),
    lastModified: c.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    ...staticEntries,
    ...discoverCityEntries,
    ...discoverCategoryEntries,
    ...eventEntries,
    ...groupEntries,
    ...userEntries,
    ...calendarEntries,
  ];
}
