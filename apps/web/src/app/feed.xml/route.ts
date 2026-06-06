/**
 * GET /feed.xml
 *
 * 直近 30 件の公開済みイベントを RSS 2.0 形式で返す。
 * Content-Type: application/rss+xml; charset=utf-8
 *
 * RSS リーダーや Google Discover、Slack のリンクプレビュー等から
 * 新着イベントを取得できるようにする目的。
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  BASE_URL,
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  absoluteUrl,
  escapeXml,
  truncateDescription,
} from "@/lib/seo";

export const revalidate = 600; // 10 分

const TAKE = 30;

export async function GET(): Promise<NextResponse> {
  const events = await prisma.event.findMany({
    where: {
      status: "published",
      visibility: "public",
      publishedAt: { not: null },
    },
    orderBy: { publishedAt: "desc" },
    take: TAKE,
    include: {
      group: { select: { name: true, subdomain: true } },
    },
  });

  const buildDate = new Date().toUTCString();
  const items = events.map((e) => {
    const url = absoluteUrl(`/event/${e.id.toString()}`);
    const pubDate = (e.publishedAt ?? e.updatedAt).toUTCString();
    const description = truncateDescription(
      e.catchPhrase ?? e.description ?? "",
    );
    return [
      `    <item>`,
      `      <title>${escapeXml(e.title)}</title>`,
      `      <link>${escapeXml(url)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
      `      <description>${escapeXml(description)}</description>`,
      `      <pubDate>${pubDate}</pubDate>`,
      `      <category>${escapeXml(e.group.name)}</category>`,
      `    </item>`,
    ].join("\n");
  });

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">`,
    `  <channel>`,
    `    <title>${escapeXml(SITE_NAME)} - 新着イベント</title>`,
    `    <link>${escapeXml(BASE_URL)}</link>`,
    `    <atom:link href="${escapeXml(absoluteUrl("/feed.xml"))}" rel="self" type="application/rss+xml" />`,
    `    <description>${escapeXml(DEFAULT_DESCRIPTION)}</description>`,
    `    <language>ja</language>`,
    `    <lastBuildDate>${buildDate}</lastBuildDate>`,
    ...items,
    `  </channel>`,
    `</rss>`,
  ].join("\n");

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=600",
    },
  });
}
