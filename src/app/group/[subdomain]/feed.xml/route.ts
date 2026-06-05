/**
 * GET /group/[subdomain]/feed.xml
 *
 * 指定グループの直近 30 件の公開済みイベントを RSS 2.0 形式で返す。
 * Content-Type: application/rss+xml; charset=utf-8
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  SITE_NAME,
  absoluteUrl,
  escapeXml,
  truncateDescription,
} from "@/lib/seo";

export const revalidate = 600;

const TAKE = 30;

export async function GET(
  _request: Request,
  context: { params: Promise<{ subdomain: string }> },
): Promise<NextResponse> {
  const { subdomain } = await context.params;

  const group = await prisma.group.findUnique({
    where: { subdomain },
    select: { id: true, name: true, subdomain: true, description: true, status: true },
  });
  if (!group || group.status !== "active") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const events = await prisma.event.findMany({
    where: {
      groupId: group.id,
      status: "published",
      visibility: "public",
      publishedAt: { not: null },
    },
    orderBy: { publishedAt: "desc" },
    take: TAKE,
  });

  const groupUrl = absoluteUrl(`/group/${group.subdomain}`);
  const feedUrl = absoluteUrl(`/group/${group.subdomain}/feed.xml`);
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
      `      <category>${escapeXml(group.name)}</category>`,
      `    </item>`,
    ].join("\n");
  });

  const channelDescription = truncateDescription(
    group.description ?? `${group.name} の新着イベント`,
  );

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">`,
    `  <channel>`,
    `    <title>${escapeXml(`${group.name} - ${SITE_NAME}`)}</title>`,
    `    <link>${escapeXml(groupUrl)}</link>`,
    `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
    `    <description>${escapeXml(channelDescription)}</description>`,
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
