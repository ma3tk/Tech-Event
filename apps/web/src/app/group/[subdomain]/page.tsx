/**
 * グループ詳細ページ
 *
 * URL: `/group/{subdomain}` (例: `/group/bpstudy`)
 *
 * Server Component で Prisma から下記を取得:
 * - グループ基本情報 (subdomain で検索)
 * - 開催予定イベント (status=published かつ startedAt >= now)
 * - 過去のイベント (endedAt < now) を最新 6 件
 * - メンバー抜粋 (24 名)
 * - 管理者一覧
 * - 直近開催 / 人気タグ / 最新発表資料 (サイドバー)
 *
 * 該当データが無ければ `notFound()` を呼ぶ。
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { renderMarkdown, safeJsonLd } from "@/lib/markdown";
import { prisma } from "@/lib/prisma";
import {
  serializeGroup,
  serializeEvent,
  serializeUser,
  serializeTag,
  serializePresentationMaterial,
  type SerializedGroup,
  type SerializedUser,
} from "@/lib/serialize";
import { cn } from "@/lib/cn";
import { formatEventDateShort, formatNumber, formatAcceptedRatio, truncate } from "@/lib/utils";
import {
  DEFAULT_LOCALE,
  SITE_NAME,
  absoluteUrl,
  truncateDescription,
} from "@/lib/seo";
import { toEventCardData } from "@/lib/event-card";
import EventTimeline from "@/components/EventTimeline";
import type { EventCardData } from "@/components/EventCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<Metadata> {
  const { subdomain } = await params;
  const group = await prisma.group.findUnique({
    where: { subdomain },
    select: {
      name: true,
      subtitle: true,
      description: true,
      coverImageUrl: true,
      thumbnailUrl: true,
    },
  });
  if (!group) return { title: "グループが見つかりません" };

  const description = truncateDescription(
    group.subtitle ?? group.description ?? `${group.name} のグループページ`,
  );
  const canonical = absoluteUrl(`/group/${subdomain}`);
  const ogImage = group.coverImageUrl ?? group.thumbnailUrl ?? undefined;

  return {
    title: group.name,
    description,
    alternates: {
      canonical,
      types: {
        "application/rss+xml": [
          {
            url: absoluteUrl(`/group/${subdomain}/feed.xml`),
            title: `${group.name} の新着イベント`,
          },
        ],
      },
    },
    openGraph: {
      title: `${group.name}`,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: DEFAULT_LOCALE,
      type: "website",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: group.name,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

type PageProps = {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ tab?: string; view?: string }>;
};

const GROUP_TABS = [
  { key: "upcoming", label: "開催予定" },
  { key: "past", label: "過去のイベント" },
  { key: "members", label: "メンバー" },
  { key: "admins", label: "管理者" },
  { key: "about", label: "グループについて" },
] as const;
type GroupTab = (typeof GROUP_TABS)[number]["key"];

function parseGroupTab(raw: string | undefined): GroupTab {
  if (!raw) return "upcoming";
  return (GROUP_TABS.find((t) => t.key === raw)?.key ?? "upcoming") as GroupTab;
}

type GroupView = "classic" | "timeline";

function parseGroupView(raw: string | undefined): GroupView {
  if (raw === "timeline") return "timeline";
  return "classic";
}

export default async function GroupDetailPage({ params, searchParams }: PageProps) {
  const { subdomain } = await params;
  const sp = await searchParams;
  const activeTab = parseGroupTab(sp.tab);
  const activeView = parseGroupView(sp.view);

  // ============ メイン: グループ ============
  const groupRow = await prisma.group.findUnique({
    where: { subdomain },
  });
  if (!groupRow || groupRow.status !== "active") {
    notFound();
  }

  const group = serializeGroup(groupRow);
  const now = new Date();

  // ============ 開催予定 / 過去イベント ============
  // - timeline view では月見出し付きで広めに取得する。
  // - classic view では従来通り upcoming=10件 / past=6件 で表示。
  const PAST_TAKE = activeView === "timeline" ? 30 : 6;
  const UPCOMING_TAKE = activeView === "timeline" ? 30 : 10;
  const [upcomingRows, pastRows] = await Promise.all([
    prisma.event.findMany({
      where: {
        groupId: groupRow.id,
        status: "published",
        startedAt: { gte: now },
      },
      orderBy: { startedAt: "asc" },
      take: UPCOMING_TAKE,
      include: {
        group: true,
        tags: { include: { tag: true } },
      },
    }),
    prisma.event.findMany({
      where: {
        groupId: groupRow.id,
        endedAt: { lt: now },
      },
      orderBy: { startedAt: "desc" },
      take: PAST_TAKE,
      include: {
        group: true,
        tags: { include: { tag: true } },
      },
    }),
  ]);
  const upcomingEvents = upcomingRows.map(serializeEvent);
  const pastEvents = pastRows.map(serializeEvent);
  // タイムライン用 EventCardData
  const upcomingEventCards = upcomingRows.map((e) => toEventCardData(e, now));
  const pastEventCards = pastRows.map((e) => toEventCardData(e, now));

  // 会場の都道府県集計 (都市マップ風プレースホルダ用)
  const prefectureCount = new Map<string, number>();
  for (const e of [...upcomingRows, ...pastRows]) {
    if (e.eventFormat === "online") continue;
    const pref = e.place ?? e.address ?? null;
    if (!pref) continue;
    prefectureCount.set(pref, (prefectureCount.get(pref) ?? 0) + 1);
  }
  const prefectures = Array.from(prefectureCount.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  // ============ メンバー / 管理者 ============
  const [memberRows, adminRows] = await Promise.all([
    prisma.groupMember.findMany({
      where: { groupId: groupRow.id, leftAt: null },
      orderBy: { joinedAt: "desc" },
      take: 24,
      include: { user: true },
    }),
    prisma.groupAdmin.findMany({
      where: { groupId: groupRow.id },
      orderBy: { addedAt: "asc" },
      include: { user: true },
    }),
  ]);

  const members = memberRows.map((m) => ({
    joinedAt: m.joinedAt.toISOString(),
    user: serializeUser(m.user),
  }));
  const admins = adminRows.map((a) => ({
    role: a.role,
    user: serializeUser(a.user),
  }));

  // ============ timeline view 用: メンバーを「最近の活動順」に並び替える ============
  // 「最近の活動」= このグループのイベントへの最新の participant.appliedAt
  let membersByRecentActivity: typeof members = members;
  if (activeView === "timeline") {
    const memberUserIds = memberRows.map((m) => m.userId);
    if (memberUserIds.length > 0) {
      const recentParticipations = await prisma.participant.findMany({
        where: {
          userId: { in: memberUserIds },
          event: { groupId: groupRow.id },
        },
        select: { userId: true, appliedAt: true },
        orderBy: { appliedAt: "desc" },
      });
      const lastActivity = new Map<string, Date>();
      for (const p of recentParticipations) {
        const key = p.userId.toString();
        if (!lastActivity.has(key)) {
          lastActivity.set(key, p.appliedAt);
        }
      }
      membersByRecentActivity = [...members].sort((a, b) => {
        const ta = lastActivity.get(a.user.id)?.getTime() ?? 0;
        const tb = lastActivity.get(b.user.id)?.getTime() ?? 0;
        if (ta === tb) {
          return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
        }
        return tb - ta;
      });
    }
  }

  // ============ サイドバー: 直近開催 (3 件) ============
  const nextUpEvents = upcomingEvents.slice(0, 3);

  // ============ サイドバー: 人気タグ ============
  // このグループのイベントに紐付くタグを集計
  const tagAggRows = await prisma.eventTag.findMany({
    where: { event: { groupId: groupRow.id } },
    include: { tag: true },
  });
  const tagCount = new Map<string, { name: string; slug: string; count: number }>();
  for (const row of tagAggRows) {
    const key = row.tag.slug;
    const cur = tagCount.get(key);
    if (cur) {
      cur.count += 1;
    } else {
      tagCount.set(key, { name: row.tag.name, slug: row.tag.slug, count: 1 });
    }
  }
  const popularTags = Array.from(tagCount.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  // ============ サイドバー: 最新発表資料 ============
  const presentationRows = await prisma.presentationMaterial.findMany({
    where: { event: { groupId: groupRow.id } },
    orderBy: { postedAt: "desc" },
    take: 5,
    include: {
      event: { select: { id: true, title: true } },
    },
  });
  const presentations = presentationRows.map((p) => ({
    ...serializePresentationMaterial(p),
    eventTitle: p.event.title,
    eventId: p.event.id.toString(),
  }));

  // ============ description Markdown -> HTML (DOMPurify sanitize 済み) ============
  const descriptionHtml = renderMarkdown(group.description);

  // ============ 統計 ============
  const memberCount = group.memberCount;
  const eventCount = group.eventCount;
  const presentationCount = group.presentationCount;

  // ============ JSON-LD: Organization ============
  const groupUrl = absoluteUrl(`/group/${group.subdomain}`);
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: group.name,
    url: groupUrl,
    description: truncateDescription(
      group.subtitle ?? group.description ?? `${group.name} のグループページ`,
    ),
    logo: group.thumbnailUrl ?? undefined,
    image: group.coverImageUrl ?? group.thumbnailUrl ?? undefined,
    sameAs: [
      group.websiteUrl,
      group.xAccount ? `https://x.com/${group.xAccount}` : null,
      group.facebookUrl,
    ].filter((v): v is string => typeof v === "string" && v.length > 0),
  };

  // ============ timeline view ============
  if (activeView === "timeline") {
    return (
      <GroupTimelineView
        group={group}
        orgJsonLd={orgJsonLd}
        upcomingEventCards={upcomingEventCards}
        pastEventCards={pastEventCards}
        members={membersByRecentActivity}
        admins={admins}
        memberCount={memberCount}
        eventCount={eventCount}
        prefectures={prefectures}
        descriptionHtml={descriptionHtml}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-background" data-view="classic">
      {/* JSON-LD: Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(orgJsonLd) }}
      />
      {/* ============ view 切替トグル ============ */}
      <div className="mx-auto w-full max-w-6xl px-6 pt-4">
        <GroupViewToggle subdomain={group.subdomain} activeView="classic" />
      </div>
      {/* ============ カバーヘッダ ============ */}
      <header
        className="relative w-full"
        style={{ backgroundColor: group.backgroundColor ?? "#1f63c1" }}
      >
        {group.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={group.coverImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
        ) : null}
        <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 text-white sm:flex-row sm:items-end">
          {group.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={group.thumbnailUrl}
              alt={group.name}
              className="h-28 w-28 rounded-lg border-4 border-white object-cover shadow-lg"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-lg border-4 border-white bg-white text-3xl font-bold text-zinc-900 shadow-lg">
              {group.name.slice(0, 1)}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold leading-tight drop-shadow-sm">
              {group.name}
            </h1>
            {group.subtitle && (
              <p className="mt-1 text-base opacity-90">{group.subtitle}</p>
            )}
            {group.organization && (
              <p className="mt-2 text-sm opacity-90">主催: {group.organization}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <span>メンバー {formatNumber(memberCount)} 人</span>
              <span>開催 {formatNumber(eventCount)} 回</span>
              <span>資料 {formatNumber(presentationCount)} 件</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center rounded-md bg-white px-5 py-2 text-sm font-semibold text-brand-orange shadow hover:bg-zinc-100"
              >
                メンバーになる
              </button>
              {group.xAccount && (
                <a
                  href={`https://x.com/${group.xAccount}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-md bg-white/15 px-3 py-2 text-sm font-medium text-white hover:bg-white/25"
                >
                  X @{group.xAccount}
                </a>
              )}
              {group.facebookUrl && (
                <a
                  href={group.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-md bg-white/15 px-3 py-2 text-sm font-medium text-white hover:bg-white/25"
                >
                  Facebook
                </a>
              )}
              {group.websiteUrl && (
                <a
                  href={group.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-md bg-white/15 px-3 py-2 text-sm font-medium text-white hover:bg-white/25"
                >
                  公式サイト
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ============ タブナビゲーション (sticky, URL ?tab= と同期) ============ */}
      <nav
        aria-label="グループ内ナビゲーション"
        role="tablist"
        className="sticky top-0 z-10 border-b border-border bg-surface"
      >
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6">
          {GROUP_TABS.map((t) => {
            const active = t.key === activeTab;
            return (
              <Link
                key={t.key}
                href={`/group/${group.subdomain}?tab=${t.key}`}
                role="tab"
                aria-selected={active}
                className={cn(
                  "whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium",
                  active
                    ? "border-brand-orange text-brand-orange"
                    : "border-transparent text-muted-foreground hover:border-brand-orange hover:text-foreground",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ============ 本体 (activeTabに応じた実フィルタ表示) ============ */}
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 lg:flex-row">
        <div className="flex-1 space-y-12">
          {/* ----- 開催予定 ----- */}
          {activeTab === "upcoming" && (
            <section id="upcoming">
              <h2 className="mb-4 text-xl font-bold">開催予定のイベント</h2>
              {upcomingEvents.length === 0 ? (
                <p className="rounded-md border border-border bg-surface p-6 text-sm text-muted-foreground">
                  開催予定のイベントはありません。
                </p>
              ) : (
                <ul className="space-y-3">
                  {upcomingEvents.map((e) => (
                    <li key={e.id}>
                      <EventCardRow
                        event={e}
                        groupName={group.name}
                        groupSubdomain={group.subdomain}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* ----- 過去のイベント ----- */}
          {activeTab === "past" && (
            <section id="past">
              <h2 className="mb-4 text-xl font-bold">過去のイベント</h2>
              {pastEvents.length === 0 ? (
                <p className="rounded-md border border-border bg-surface p-6 text-sm text-muted-foreground">
                  過去のイベントはまだありません。
                </p>
              ) : (
                <ul className="space-y-3">
                  {pastEvents.map((e) => (
                    <li key={e.id}>
                      <EventCardRow
                        event={e}
                        groupName={group.name}
                        groupSubdomain={group.subdomain}
                        isPast
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* ----- メンバー ----- */}
          {activeTab === "members" && (
            <section id="members">
              <h2 className="mb-4 text-xl font-bold">
                メンバー <span className="text-sm font-normal text-muted-foreground">({formatNumber(memberCount)} 人)</span>
              </h2>
              {members.length === 0 ? (
                <p className="rounded-md border border-border bg-surface p-6 text-sm text-muted-foreground">
                  まだメンバーがいません。
                </p>
              ) : (
                <ul className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
                  {members.map((m) => (
                    <li key={m.user.id} className="text-center">
                      <Link
                        href={`/user/${m.user.nickname}`}
                        className="flex flex-col items-center gap-1"
                      >
                        <AvatarCircle
                          url={m.user.avatarUrl}
                          name={m.user.displayName}
                          size={56}
                        />
                        <span className="line-clamp-1 text-xs font-medium">
                          {m.user.displayName}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* ----- 管理者 ----- */}
          {activeTab === "admins" && (
            <section id="admins">
              <h2 className="mb-4 text-xl font-bold">管理者</h2>
              {admins.length === 0 ? (
                <p className="rounded-md border border-border bg-surface p-6 text-sm text-muted-foreground">
                  管理者の情報がありません。
                </p>
              ) : (
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {admins.map((a) => (
                    <li
                      key={a.user.id}
                      className="flex items-center gap-3 rounded-md border border-border bg-surface p-3"
                    >
                      <AvatarCircle
                        url={a.user.avatarUrl}
                        name={a.user.displayName}
                        size={48}
                      />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/user/${a.user.nickname}`}
                          className="block font-semibold text-foreground hover:text-link"
                        >
                          {a.user.displayName}
                        </Link>
                        <p className="line-clamp-1 text-xs text-muted-foreground">
                          @{a.user.nickname}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-xs font-medium",
                          a.role === "owner"
                            ? "bg-brand-orange-soft text-brand-orange"
                            : "bg-surface-muted text-muted-foreground"
                        )}
                      >
                        {a.role === "owner" ? "オーナー" : "管理者"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* ----- グループ説明 ----- */}
          {activeTab === "about" && (
            <section id="about">
              <h2 className="mb-4 text-xl font-bold">グループについて</h2>
              {descriptionHtml ? (
                <article
                  className="prose prose-zinc max-w-none rounded-md border border-border bg-surface p-6 text-sm leading-7"
                  // 内部Markdownのみ。XSSリスクは marked のサニタイズに任せている。
                  dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                />
              ) : (
                <p className="rounded-md border border-border bg-surface p-6 text-sm text-muted-foreground">
                  グループの説明はまだ登録されていません。
                </p>
              )}
            </section>
          )}
        </div>

        {/* ============ サイドバー ============ */}
        <aside className="w-full shrink-0 space-y-6 lg:w-80">
          {/* ----- 直近開催 ----- */}
          <div className="rounded-md border border-border bg-surface p-4">
            <h3 className="mb-3 text-sm font-bold text-foreground">直近開催</h3>
            {nextUpEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground">予定なし</p>
            ) : (
              <ul className="space-y-3">
                {nextUpEvents.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/event/${e.id}`}
                      className="block hover:opacity-80"
                    >
                      <p className="text-xs text-muted-foreground">
                        {formatEventDateShort(e.startedAt)}
                      </p>
                      <p className="line-clamp-2 text-sm font-medium text-foreground">
                        {e.title}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ----- 人気タグ ----- */}
          <div className="rounded-md border border-border bg-surface p-4">
            <h3 className="mb-3 text-sm font-bold text-foreground">人気タグ</h3>
            {popularTags.length === 0 ? (
              <p className="text-xs text-muted-foreground">タグがありません</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {popularTags.map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={`/event?tag=${encodeURIComponent(t.slug)}`}
                      className="inline-block rounded-full bg-surface-muted px-3 py-1 text-xs text-muted-foreground hover:bg-border"
                    >
                      #{t.name}
                      <span className="ml-1 text-muted-foreground">{t.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ----- 最新発表資料 ----- */}
          <div className="rounded-md border border-border bg-surface p-4">
            <h3 className="mb-3 text-sm font-bold text-foreground">最新の発表資料</h3>
            {presentations.length === 0 ? (
              <p className="text-xs text-muted-foreground">資料がありません</p>
            ) : (
              <ul className="space-y-3">
                {presentations.map((p) => (
                  <li key={p.id}>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block hover:opacity-80"
                    >
                      <p className="line-clamp-2 text-sm font-medium text-foreground">
                        {p.title}
                      </p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {p.presenterDisplayName ?? "発表者"} ・ {truncate(p.eventTitle, 30)}
                      </p>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}

/* ============================================================
 * 小さな下請けコンポーネント
 * ============================================================ */

function AvatarCircle({
  url,
  name,
  size,
}: {
  url: string | null;
  name: string;
  size: number;
}) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-border-strong font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name.slice(0, 1)}
    </div>
  );
}

/**
 * グループページの中で使うイベント行カード。
 *
 * a11y: 旧実装は外側の `<Link href="/event/...">` の中に `<Link href="/group/...">`
 * (グループ名へのリンク) をネストしており、HTML5 では `<a>` 内に
 * インタラクティブコンテンツを置けないルールに違反していた。
 * 対策として `<article>` でラップし、タイトル行の `<Link>` に
 * `before:absolute before:inset-0` を当てる stretched link パターンを採用。
 * グループ名リンクは `relative z-10` で前面に出して通常リンクとして機能させる。
 */
function EventCardRow({
  event,
  groupName,
  groupSubdomain,
  isPast = false,
}: {
  event: {
    id: string;
    title: string;
    startedAt: string;
    endedAt: string;
    coverImageUrl: string | null;
    catchPhrase: string | null;
    place: string | null;
    eventFormat: string;
    capacity: number | null;
    acceptedCount: number;
    status: string;
  };
  groupName: string;
  groupSubdomain: string;
  isPast?: boolean;
}) {
  const titleId = `gevr-${event.id}-title`;
  return (
    <article
      aria-labelledby={titleId}
      className="group relative flex gap-4 rounded-md border border-border bg-surface p-4 transition-colors hover:border-brand-orange"
    >
      {event.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.coverImageUrl}
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
          {formatEventDateShort(event.startedAt)}
          {" ・ "}
          <Link
            href={`/group/${groupSubdomain}`}
            className="relative z-10 text-link hover:text-link-hover"
          >
            {groupName}
          </Link>
        </p>
        <h3
          id={titleId}
          className="line-clamp-2 text-base font-semibold text-foreground group-hover:text-brand-orange"
        >
          <Link
            href={`/event/${event.id}`}
            className="before:absolute before:inset-0 before:content-[''] before:rounded-md focus-visible:outline-none"
          >
            {event.title}
          </Link>
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{event.eventFormat === "online" ? "オンライン" : event.place ?? "会場未定"}</span>
          <span>・</span>
          <span>{formatAcceptedRatio(event.acceptedCount, event.capacity)}</span>
          {isPast && (
            <span className="rounded bg-status-ended-bg px-2 py-0.5 text-status-ended-fg">
              終了
            </span>
          )}
          {!isPast && event.status === "cancelled" && (
            <span className="rounded bg-status-cancelled-bg px-2 py-0.5 text-status-cancelled-fg">
              中止
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

/* ============================================================
 * View 切替トグル (timeline / classic)
 * ============================================================ */

function GroupViewToggle({
  subdomain,
  activeView,
}: {
  subdomain: string;
  activeView: GroupView;
}) {
  return (
    <div
      className="flex items-center justify-end"
      data-testid="group-view-toggle"
    >
      <div
        role="tablist"
        aria-label="表示モード切替"
        className="inline-flex rounded-md border border-border bg-surface p-0.5 text-xs"
      >
        <Link
          href={`/group/${subdomain}?view=classic`}
          role="tab"
          aria-selected={activeView === "classic"}
          data-testid="group-view-toggle-classic"
          className={
            activeView === "classic"
              ? "rounded px-3 py-1.5 font-bold text-white bg-brand-orange"
              : "rounded px-3 py-1.5 font-medium text-muted-foreground hover:text-foreground"
          }
        >
          クラシック
        </Link>
        <Link
          href={`/group/${subdomain}?view=timeline`}
          role="tab"
          aria-selected={activeView === "timeline"}
          data-testid="group-view-toggle-timeline"
          className={
            activeView === "timeline"
              ? "rounded px-3 py-1.5 font-bold text-white bg-brand-orange"
              : "rounded px-3 py-1.5 font-medium text-muted-foreground hover:text-foreground"
          }
        >
          タイムライン
        </Link>
      </div>
    </div>
  );
}

/* ============================================================
 * Luma 風 グループタイムラインビュー
 *
 * - 開催予定 / 過去イベントを `EventTimeline` で月見出し付きに表示
 * - メンバー一覧は「最近の活動順」
 * - 会場の都道府県集計を都市マップ風プレースホルダで表示
 * ============================================================ */

function GroupTimelineView({
  group,
  orgJsonLd,
  upcomingEventCards,
  pastEventCards,
  members,
  admins,
  memberCount,
  eventCount,
  prefectures,
  descriptionHtml,
}: {
  group: SerializedGroup;
  orgJsonLd: Record<string, unknown>;
  upcomingEventCards: EventCardData[];
  pastEventCards: EventCardData[];
  members: Array<{ joinedAt: string; user: SerializedUser }>;
  admins: Array<{ role: string; user: SerializedUser }>;
  memberCount: number;
  eventCount: number;
  prefectures: Array<{ name: string; count: number }>;
  descriptionHtml: string;
}) {
  // Subscriber 数 (将来の Subscribe 機能用プレースホルダ)
  const subscriberCount = memberCount;

  return (
    <div
      className="flex flex-1 flex-col bg-background"
      data-view="timeline"
      data-testid="group-timeline-view"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(orgJsonLd) }}
      />

      {/* ============ 軽量マストヘッド (カバーは細め) ============ */}
      <header
        className="relative w-full"
        style={{ backgroundColor: group.backgroundColor ?? "#1f63c1" }}
        data-testid="group-timeline-header"
      >
        {group.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={group.coverImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-50"
          />
        ) : null}
        <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-3 px-6 py-8 text-center text-white">
          {group.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={group.thumbnailUrl}
              alt={group.name}
              className="h-20 w-20 rounded-lg border-2 border-white object-cover shadow"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-white bg-white text-2xl font-bold text-zinc-900 shadow">
              {group.name.slice(0, 1)}
            </div>
          )}
          <h1 className="text-2xl font-bold leading-tight drop-shadow-sm">
            {group.name}
          </h1>
          {group.subtitle && (
            <p className="text-sm opacity-90">{group.subtitle}</p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs">
            <span>
              <span className="font-bold">{formatNumber(subscriberCount)}</span>
              <span className="ml-1 opacity-80">サブスクライバー</span>
            </span>
            <span>
              <span className="font-bold">{formatNumber(eventCount)}</span>
              <span className="ml-1 opacity-80">イベント</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              className="inline-flex items-center rounded-md bg-white px-4 py-1.5 text-sm font-semibold text-brand-orange shadow hover:bg-zinc-100"
            >
              Subscribe
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-6">
        {/* ============ view 切替トグル ============ */}
        <GroupViewToggle subdomain={group.subdomain} activeView="timeline" />

        {/* ============ 都市マップ風プレースホルダ ============ */}
        <section
          className="mt-4 rounded-md border border-border bg-surface p-4"
          data-testid="group-timeline-map"
          aria-label="開催地マップ (集計)"
        >
          <h2 className="mb-2 text-sm font-bold text-foreground">
            主な開催地{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (会場の都道府県集計)
            </span>
          </h2>
          {prefectures.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              開催地データはまだありません
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {prefectures.map((p) => (
                <li
                  key={p.name}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-orange-soft px-3 py-1 text-xs font-medium text-brand-orange"
                  data-testid={`group-timeline-prefecture-${p.name}`}
                >
                  <span>{p.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {p.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ============ 開催予定 ============ */}
        <div className="mt-8">
          <EventTimeline
            heading="開催予定のイベント"
            events={upcomingEventCards}
            emptyMessage="開催予定のイベントはありません"
            stickyTopPx={0}
          />
        </div>

        {/* ============ 過去 ============ */}
        <div className="mt-8">
          <EventTimeline
            heading="過去のイベント"
            events={pastEventCards}
            emptyMessage="過去のイベントはまだありません"
            stickyTopPx={0}
          />
        </div>

        {/* ============ メンバー (最近の活動順) ============ */}
        <section
          className="mt-10"
          data-testid="group-timeline-members"
          aria-labelledby="group-timeline-members-h"
        >
          <h2
            id="group-timeline-members-h"
            className="mb-3 text-xl font-bold text-foreground"
          >
            メンバー (最近の活動順){" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({formatNumber(memberCount)} 人)
            </span>
          </h2>
          {members.length === 0 ? (
            <p className="rounded-md border border-border bg-surface p-6 text-sm text-muted-foreground">
              まだメンバーがいません
            </p>
          ) : (
            <ul className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
              {members.map((m) => (
                <li key={m.user.id} className="text-center">
                  <Link
                    href={`/user/${m.user.nickname}`}
                    className="flex flex-col items-center gap-1"
                  >
                    <AvatarCircle
                      url={m.user.avatarUrl}
                      name={m.user.displayName}
                      size={56}
                    />
                    <span className="line-clamp-1 text-xs font-medium">
                      {m.user.displayName}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ============ 管理者 ============ */}
        <section className="mt-10" data-testid="group-timeline-admins">
          <h2 className="mb-3 text-xl font-bold text-foreground">管理者</h2>
          {admins.length === 0 ? (
            <p className="rounded-md border border-border bg-surface p-6 text-sm text-muted-foreground">
              管理者の情報がありません
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {admins.map((a) => (
                <li
                  key={a.user.id}
                  className="flex items-center gap-3 rounded-md border border-border bg-surface p-3"
                >
                  <AvatarCircle
                    url={a.user.avatarUrl}
                    name={a.user.displayName}
                    size={48}
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/user/${a.user.nickname}`}
                      className="block font-semibold text-foreground hover:text-link"
                    >
                      {a.user.displayName}
                    </Link>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      @{a.user.nickname}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-xs font-medium",
                      a.role === "owner"
                        ? "bg-brand-orange-soft text-brand-orange"
                        : "bg-surface-muted text-muted-foreground",
                    )}
                  >
                    {a.role === "owner" ? "オーナー" : "管理者"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ============ グループ説明 ============ */}
        {descriptionHtml && (
          <section className="mt-10" data-testid="group-timeline-about">
            <h2 className="mb-3 text-xl font-bold text-foreground">
              グループについて
            </h2>
            <article
              className="prose prose-zinc max-w-none rounded-md border border-border bg-surface p-6 text-sm leading-7"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          </section>
        )}
      </main>
    </div>
  );
}
