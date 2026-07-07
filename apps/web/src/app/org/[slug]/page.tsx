/**
 * Organization 公開ページ (Server Component)
 *
 * URL: `/org/{slug}`
 *
 * org > calendar > event 階層のトップ。組織情報・配下カレンダー一覧・
 * 配下カレンダーの今後のイベントを集約表示する。
 * 個人カレンダー (organizationId = null) はここには出ない (従来ページのまま)。
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Calendar as CalendarIcon, Users } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { renderMarkdown } from "@/lib/markdown";
import { listOrgCalendars } from "@tech-event/web-feature-calendar";
import {
  DEFAULT_LOCALE,
  SITE_NAME,
  absoluteUrl,
  truncateDescription,
} from "@/lib/seo";
import { formatEventDateShort, formatNumber, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const org = await prisma.organization.findUnique({
    where: { slug },
    select: { name: true, description: true, logoUrl: true },
  });
  if (!org) return { title: "Organization が見つかりません" };

  const description = truncateDescription(
    org.description ?? `${org.name} のイベントカレンダー`,
  );
  const canonical = absoluteUrl(`/org/${slug}`);
  return {
    title: org.name,
    description,
    alternates: { canonical },
    openGraph: {
      title: org.name,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: DEFAULT_LOCALE,
      type: "website",
      images: org.logoUrl ? [{ url: org.logoUrl }] : undefined,
    },
    twitter: {
      card: "summary",
      title: org.name,
      description,
      images: org.logoUrl ? [org.logoUrl] : undefined,
    },
  };
}

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const org = await prisma.organization.findUnique({
    where: { slug },
    include: { owner: true },
  });
  if (!org) notFound();

  const currentUser = await getCurrentUser();
  const isOwner = currentUser?.id === org.ownerUserId;

  const now = new Date();
  const [calendars, upcomingRows] = await Promise.all([
    listOrgCalendars(org.id),
    prisma.calendarEvent.findMany({
      where: {
        calendar: { organizationId: org.id, status: "active" },
        event: { endedAt: { gte: now } },
      },
      orderBy: { event: { startedAt: "asc" } },
      include: {
        event: { include: { group: true } },
        calendar: { select: { slug: true, name: true, tintColor: true } },
      },
    }),
  ]);

  // 同一イベントが複数カレンダーに属する場合は最初の 1 件に集約
  const seen = new Set<string>();
  const upcoming = upcomingRows.filter((row) => {
    const key = row.event.id.toString();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const descriptionHtml = renderMarkdown(org.description);
  const totalEvents = calendars.reduce((sum, c) => sum + c.eventCount, 0);
  const totalSubscribers = calendars.reduce(
    (sum, c) => sum + c.subscriberCount,
    0,
  );

  return (
    <div className="flex flex-1 flex-col bg-background">
      {/* ============ ヘッダ ============ */}
      <header
        className="border-b border-border bg-surface"
        data-testid="org-header"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center">
          {org.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={org.logoUrl}
              alt=""
              className="h-20 w-20 shrink-0 rounded-2xl border border-border object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface-muted">
              <Building2
                aria-hidden="true"
                className="h-10 w-10 text-muted-foreground"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Organization
            </p>
            <h1 data-testid="org-name" className="text-3xl font-bold leading-tight">
              {org.name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span
                data-testid="org-calendar-count"
                className="inline-flex items-center gap-1"
              >
                <CalendarIcon aria-hidden="true" className="h-4 w-4" />
                カレンダー {formatNumber(calendars.length)} 件 / イベント{" "}
                {formatNumber(totalEvents)} 件
              </span>
              <span className="inline-flex items-center gap-1">
                <Users aria-hidden="true" className="h-4 w-4" />
                購読者合計 {formatNumber(totalSubscribers)} 人
              </span>
            </div>
            {isOwner && (
              <div className="mt-3">
                <Link
                  href={`/org/${org.slug}/edit`}
                  data-testid="org-edit-link"
                  className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-brand-orange-soft"
                >
                  組織を編集
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ============ 本体 ============ */}
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 lg:flex-row">
        <div className="flex-1 space-y-12">
          {/* ---- 配下カレンダー ---- */}
          <section id="calendars">
            <h2 className="mb-4 text-xl font-bold">カレンダー</h2>
            {calendars.length === 0 ? (
              <p
                data-testid="org-calendars-empty"
                className="rounded-md border border-border bg-surface p-6 text-sm text-muted-foreground"
              >
                この組織のカレンダーはまだありません。
              </p>
            ) : (
              <ul
                data-testid="org-calendars"
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                {calendars.map((cal) => (
                  <li key={cal.id.toString()}>
                    <Link
                      href={`/calendar/${cal.slug}`}
                      data-testid={`org-calendar-item-${cal.slug}`}
                      className="flex h-full flex-col rounded-md border border-border bg-surface p-4 transition-colors hover:border-brand-orange"
                      style={{
                        borderLeft: `4px solid ${cal.tintColor ?? "#5b21b6"}`,
                      }}
                    >
                      <h3 className="text-base font-semibold text-foreground">
                        {cal.name}
                      </h3>
                      {cal.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {truncate(cal.description, 120)}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">
                        購読者 {formatNumber(cal.subscriberCount)} 人 ・ イベント{" "}
                        {formatNumber(cal.eventCount)} 件
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ---- 今後のイベント (配下カレンダー集約) ---- */}
          <section id="upcoming">
            <h2 className="mb-4 text-xl font-bold">開催予定のイベント</h2>
            {upcoming.length === 0 ? (
              <p className="rounded-md border border-border bg-surface p-6 text-sm text-muted-foreground">
                開催予定のイベントはまだありません。
              </p>
            ) : (
              <ul data-testid="org-upcoming-events" className="space-y-3">
                {upcoming.map((row) => (
                  <li key={row.event.id.toString()}>
                    <Link
                      href={`/event/${row.event.id.toString()}`}
                      className="flex gap-4 rounded-md border border-border bg-surface p-4 transition-colors hover:border-brand-orange"
                      style={{
                        borderLeft: `4px solid ${row.calendar.tintColor ?? "#5b21b6"}`,
                      }}
                    >
                      {row.event.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.event.coverImageUrl}
                          alt=""
                          className="h-20 w-20 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-surface-muted text-xs text-muted-foreground">
                          No Image
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">
                          {formatEventDateShort(
                            row.event.startedAt.toISOString(),
                          )}{" "}
                          ・ {row.calendar.name}
                        </p>
                        <h3 className="line-clamp-2 text-base font-semibold text-foreground">
                          {row.event.title}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {row.event.eventFormat === "online"
                              ? "オンライン"
                              : truncate(row.event.place ?? "会場未定", 30)}
                          </span>
                          {row.event.capacity != null && (
                            <>
                              <span>・</span>
                              <span>
                                {row.event.acceptedCount}/{row.event.capacity} 人
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ---- 説明 ---- */}
          {descriptionHtml && (
            <section id="about">
              <h2 className="mb-4 text-xl font-bold">この組織について</h2>
              <article
                data-testid="org-description"
                className="prose prose-zinc max-w-none rounded-md border border-border bg-surface p-6 text-sm leading-7"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            </section>
          )}
        </div>

        {/* ============ サイドバー ============ */}
        <aside className="w-full shrink-0 space-y-6 lg:w-80">
          <div className="rounded-md border border-border bg-surface p-4">
            <h3 className="mb-2 text-sm font-bold text-foreground">運営者</h3>
            <Link
              href={`/user/${org.owner.nickname}`}
              className="flex items-center gap-2"
            >
              {org.owner.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={org.owner.avatarUrl}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-border-strong font-bold text-white">
                  {org.owner.displayName.slice(0, 1)}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">
                  {org.owner.displayName}
                </span>
                <span className="block text-xs text-muted-foreground">
                  @{org.owner.nickname}
                </span>
              </span>
            </Link>
          </div>
        </aside>
      </main>
    </div>
  );
}
