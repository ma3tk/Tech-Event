/**
 * ユーザープロフィールページ
 *
 * URL: `/user/{nickname}` (例: `/user/haru860`)
 *
 * Server Component で Prisma から下記を取得:
 * - ユーザー基本情報 (nickname で検索)
 * - 参加履歴 (status accepted/attended のイベント, 時系列降順)
 * - 主催イベント (ownerId == user.id)
 * - 発表資料一覧
 * - 所属グループ一覧
 *
 * 該当ユーザーが無い / withdrawn の場合は `notFound()`。
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { renderMarkdown, safeJsonLd } from "@/lib/markdown";
import { prisma } from "@/lib/prisma";
import {
  serializeUser,
  serializeEvent,
  serializeGroup,
  serializePresentationMaterial,
} from "@/lib/serialize";
import {
  formatEventDateShort,
  formatNumber,
  formatAcceptedRatio,
  truncate,
} from "@/lib/utils";
import {
  DEFAULT_LOCALE,
  SITE_NAME,
  absoluteUrl,
  truncateDescription,
} from "@/lib/seo";
import { toEventCardData } from "@/lib/event-card";
import EventTimeline from "@/components/EventTimeline";
import type { EventCardData } from "@/components/EventCard";
import type {
  SerializedGroup,
  SerializedPresentationMaterial,
} from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ nickname: string }>;
}): Promise<Metadata> {
  const { nickname } = await params;
  const user = await prisma.user.findUnique({
    where: { nickname },
    select: {
      displayName: true,
      bio: true,
      affiliation: true,
      avatarUrl: true,
      status: true,
    },
  });
  if (!user || user.status === "withdrawn") {
    return { title: "ユーザーが見つかりません" };
  }

  const description = truncateDescription(
    user.bio ??
      [user.affiliation, `${user.displayName} のプロフィール`]
        .filter((v) => !!v)
        .join(" / "),
  );
  const canonical = absoluteUrl(`/user/${nickname}`);
  const ogImage = user.avatarUrl ?? undefined;

  return {
    title: user.displayName,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: user.displayName,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: DEFAULT_LOCALE,
      type: "profile",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: user.displayName,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

type PageProps = {
  params: Promise<{ nickname: string }>;
  searchParams: Promise<{ tab?: string; view?: string }>;
};

const USER_TABS = [
  { key: "joined", label: "参加履歴" },
  { key: "owned", label: "主催イベント" },
  { key: "presentations", label: "発表資料" },
  { key: "groups", label: "所属グループ" },
] as const;
type UserTab = (typeof USER_TABS)[number]["key"];

function parseUserTab(raw: string | undefined): UserTab {
  if (!raw) return "joined";
  return (USER_TABS.find((t) => t.key === raw)?.key ?? "joined") as UserTab;
}

type UserView = "classic" | "timeline";

function parseUserView(raw: string | undefined): UserView {
  if (raw === "classic") return "classic";
  return "timeline";
}

export default async function UserProfilePage({ params, searchParams }: PageProps) {
  const { nickname } = await params;
  const sp = await searchParams;
  const activeTab = parseUserTab(sp.tab);
  const activeView = parseUserView(sp.view);

  const userRow = await prisma.user.findUnique({
    where: { nickname },
  });
  if (!userRow || userRow.status === "withdrawn") {
    notFound();
  }
  const user = serializeUser(userRow);

  // ============ 参加履歴 ============
  const participantRows = await prisma.participant.findMany({
    where: {
      userId: userRow.id,
      status: { in: ["accepted", "attended"] },
    },
    orderBy: { appliedAt: "desc" },
    take: 30,
    include: {
      event: {
        include: {
          group: true,
          tags: { include: { tag: true } },
        },
      },
    },
  });
  const joinedEvents = participantRows.map((p) => ({
    status: p.status,
    appliedAt: p.appliedAt.toISOString(),
    event: serializeEvent(p.event),
    groupName: p.event.group.name,
    groupSubdomain: p.event.group.subdomain,
  }));
  // タイムライン用 (EventCardData)
  const joinedEventCards = participantRows.map((p) => toEventCardData(p.event));

  // ============ 主催イベント ============
  const ownedRows = await prisma.event.findMany({
    where: { ownerId: userRow.id },
    orderBy: { startedAt: "desc" },
    take: 12,
    include: {
      group: true,
      tags: { include: { tag: true } },
    },
  });
  const ownedEvents = ownedRows.map((e) => ({
    ...serializeEvent(e),
    groupName: e.group.name,
    groupSubdomain: e.group.subdomain,
  }));
  // タイムライン用 (Hosting=未来 / Hosted=過去 に分割)
  const nowForUser = new Date();
  const hostingEventCards = ownedRows
    .filter((e) => e.startedAt >= nowForUser)
    .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime())
    .map((e) => toEventCardData(e, nowForUser));
  const hostedEventCards = ownedRows
    .filter((e) => e.startedAt < nowForUser)
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
    .map((e) => toEventCardData(e, nowForUser));

  // ============ 発表資料 ============
  const presentationRows = await prisma.presentationMaterial.findMany({
    where: { presenterUserId: userRow.id },
    orderBy: { postedAt: "desc" },
    take: 20,
    include: {
      event: { select: { id: true, title: true } },
    },
  });
  const presentations = presentationRows.map((p) => ({
    ...serializePresentationMaterial(p),
    eventTitle: p.event.title,
    eventId: p.event.id.toString(),
  }));

  // ============ 所属グループ ============
  const groupMemberRows = await prisma.groupMember.findMany({
    where: { userId: userRow.id, leftAt: null },
    orderBy: { joinedAt: "desc" },
    include: { group: true },
  });
  const groups = groupMemberRows.map((m) => serializeGroup(m.group));

  // ============ 統計 ============
  const [participatedCount, ownedCount, presentationCount, groupCount] =
    await Promise.all([
      prisma.participant.count({
        where: {
          userId: userRow.id,
          status: { in: ["accepted", "attended"] },
        },
      }),
      prisma.event.count({ where: { ownerId: userRow.id } }),
      prisma.presentationMaterial.count({
        where: { presenterUserId: userRow.id },
      }),
      prisma.groupMember.count({
        where: { userId: userRow.id, leftAt: null },
      }),
    ]);

  const bioHtml = renderMarkdown(user.bio);

  // ============ JSON-LD: Person ============
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: user.displayName,
    alternateName: user.nickname,
    url: absoluteUrl(`/user/${user.nickname}`),
    description: truncateDescription(user.bio ?? `${user.displayName} のプロフィール`),
    image: user.avatarUrl ?? undefined,
    affiliation: user.affiliation
      ? { "@type": "Organization", name: user.affiliation }
      : undefined,
    sameAs: [
      user.websiteUrl,
      user.xAccount ? `https://x.com/${user.xAccount}` : null,
      user.facebookAccount
        ? `https://www.facebook.com/${user.facebookAccount}`
        : null,
      user.githubAccount ? `https://github.com/${user.githubAccount}` : null,
    ].filter((v): v is string => typeof v === "string" && v.length > 0),
  };

  // ============ view 切替 (timeline / classic) ============
  // timeline view では Luma 風セクション (Hosting / Going / Hosted / Materials) を表示。
  // classic view では従来の tab + リスト UI を維持。
  if (activeView === "timeline") {
    return (
      <UserProfileTimelineView
        user={user}
        bioHtml={bioHtml}
        personJsonLd={personJsonLd}
        hostingEventCards={hostingEventCards}
        goingEventCards={joinedEventCards}
        hostedEventCards={hostedEventCards}
        groups={groups}
        presentations={presentations}
        participatedCount={participatedCount}
        ownedCount={ownedCount}
        presentationCount={presentationCount}
        groupCount={groupCount}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-background" data-view="classic">
      {/* JSON-LD: Person */}
      <script
        type="application/ld+json"
        // nosemgrep: typescript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml -- safeJsonLd() でエスケープ済みの JSON-LD 構造化データ。ユーザー入力を含まない。
        dangerouslySetInnerHTML={{ __html: safeJsonLd(personJsonLd) }}
      />
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        {/* ============ view 切替トグル ============ */}
        <ViewToggle nickname={user.nickname} activeView="classic" />

        {/* ============ プロフィールヘッダ ============ */}
        <header className="rounded-lg border border-border bg-surface p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <AvatarCircle
              url={user.avatarUrl}
              name={user.displayName}
              size={120}
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-tight">{user.displayName}</h1>
              <p className="mt-1 text-sm text-muted-foreground">@{user.nickname}</p>
              {user.affiliation && (
                <p className="mt-2 text-sm">所属: {user.affiliation}</p>
              )}
              {user.location && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {user.location}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                {user.xAccount && (
                  <a
                    href={`https://x.com/${user.xAccount}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-zinc-100 px-3 py-1.5 hover:bg-zinc-200"
                  >
                    X @{user.xAccount}
                  </a>
                )}
                {user.facebookAccount && (
                  <a
                    href={`https://www.facebook.com/${user.facebookAccount}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-zinc-100 px-3 py-1.5 hover:bg-zinc-200"
                  >
                    Facebook
                  </a>
                )}
                {user.githubAccount && (
                  <a
                    href={`https://github.com/${user.githubAccount}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-zinc-100 px-3 py-1.5 hover:bg-zinc-200"
                  >
                    GitHub
                  </a>
                )}
                {user.websiteUrl && (
                  <a
                    href={user.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-zinc-100 px-3 py-1.5 hover:bg-zinc-200"
                  >
                    Web
                  </a>
                )}
              </div>
              {bioHtml && (
                <article
                  className="prose prose-zinc mt-4 max-w-none text-sm leading-7"
                  // bioHtml は renderMarkdown() (marked + isomorphic-dompurify) で sanitize 済み。
                  // nosemgrep: typescript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml -- renderMarkdown() で DOMPurify sanitize 済みの HTML。
                  dangerouslySetInnerHTML={{ __html: bioHtml }}
                />
              )}
            </div>
          </div>
        </header>

        {/* ============ タブナビゲーション (sticky, URL ?tab= と同期) ============ */}
        <nav
          aria-label="ユーザープロフィール内ナビゲーション"
          role="tablist"
          className="sticky top-0 z-10 mt-6 border-b border-border bg-background"
        >
          <div className="flex gap-1 overflow-x-auto">
            {USER_TABS.map((t) => {
              const active = t.key === activeTab;
              return (
                <Link
                  key={t.key}
                  href={`/user/${user.nickname}?tab=${t.key}`}
                  role="tab"
                  aria-selected={active}
                  className={
                    active
                      ? "whitespace-nowrap border-b-2 border-brand-orange px-4 py-3 text-sm font-bold text-brand-orange"
                      : "whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:border-brand-orange hover:text-foreground"
                  }
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ============ 本体 (activeTabに応じた実フィルタ表示) ============ */}
        <div className="mt-6 flex flex-col gap-8 lg:flex-row">
          <div className="flex-1 space-y-10">
            {/* ----- 参加履歴 ----- */}
            {activeTab === "joined" && (
              <section>
                <h2 className="mb-4 text-xl font-bold">
                  参加履歴{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({formatNumber(participatedCount)} 件)
                  </span>
                </h2>
                {joinedEvents.length === 0 ? (
                  <p className="rounded-md border border-border bg-surface p-6 text-sm text-muted-foreground">
                    参加履歴はまだありません。
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {joinedEvents.map((j) => (
                      <li key={j.event.id}>
                        <EventRow
                          event={j.event}
                          groupName={j.groupName}
                          groupSubdomain={j.groupSubdomain}
                          statusBadge={
                            j.status === "attended" ? "出席済" : "参加確定"
                          }
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {/* ----- 主催イベント ----- */}
            {activeTab === "owned" && (
              <section>
                <h2 className="mb-4 text-xl font-bold">
                  主催イベント{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({formatNumber(ownedCount)} 件)
                  </span>
                </h2>
                {ownedEvents.length === 0 ? (
                  <p className="rounded-md border border-border bg-surface p-6 text-sm text-muted-foreground">
                    主催イベントはありません。
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {ownedEvents.map((e) => (
                      <li key={e.id}>
                        <EventRow
                          event={e}
                          groupName={e.groupName}
                          groupSubdomain={e.groupSubdomain}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {/* ----- 発表資料 ----- */}
            {activeTab === "presentations" && (
              <section>
                <h2 className="mb-4 text-xl font-bold">
                  発表資料{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({formatNumber(presentationCount)} 件)
                  </span>
                </h2>
                {presentations.length === 0 ? (
                  <p className="rounded-md border border-border bg-surface p-6 text-sm text-muted-foreground">
                    発表資料はありません。
                  </p>
                ) : (
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {presentations.map((p) => (
                      <li
                        key={p.id}
                        className="rounded-md border border-border bg-surface p-4"
                      >
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block hover:opacity-80"
                        >
                          {p.thumbnailUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.thumbnailUrl}
                              alt=""
                              className="mb-2 aspect-video w-full rounded object-cover"
                            />
                          )}
                          <h3 className="line-clamp-2 text-sm font-semibold">
                            {p.title}
                          </h3>
                          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                            {truncate(p.eventTitle, 40)}
                          </p>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {/* ----- 所属グループ ----- */}
            {activeTab === "groups" && (
              <section>
                <h2 className="mb-4 text-xl font-bold">
                  所属グループ{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({formatNumber(groupCount)} グループ)
                  </span>
                </h2>
                {groups.length === 0 ? (
                  <p className="rounded-md border border-border bg-surface p-6 text-sm text-muted-foreground">
                    所属グループはありません。
                  </p>
                ) : (
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {groups.map((g) => (
                      <li key={g.id}>
                        <Link
                          href={`/group/${g.subdomain}`}
                          className="block rounded-md border border-border bg-surface p-3 text-center hover:border-brand-orange"
                        >
                          {g.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={g.thumbnailUrl}
                              alt=""
                              className="mx-auto h-16 w-16 rounded-md object-cover"
                            />
                          ) : (
                            <div
                              className="mx-auto flex h-16 w-16 items-center justify-center rounded-md text-lg font-bold text-white"
                              style={{
                                backgroundColor: g.backgroundColor ?? "#1f63c1",
                              }}
                            >
                              {g.name.slice(0, 1)}
                            </div>
                          )}
                          <p className="mt-2 line-clamp-2 text-xs font-medium">
                            {g.name}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>

          {/* ============ サイドバー: 参加統計 ============ */}
          <aside className="w-full shrink-0 space-y-4 lg:w-72">
            <div className="rounded-md border border-border bg-surface p-4">
              <h3 className="mb-3 text-sm font-bold text-foreground">参加統計</h3>
              <dl className="space-y-2 text-sm">
                <Stat label="累計参加数" value={formatNumber(participatedCount)} />
                <Stat label="主催数" value={formatNumber(ownedCount)} />
                <Stat label="発表数" value={formatNumber(presentationCount)} />
                <Stat
                  label="所属グループ数"
                  value={formatNumber(groupCount)}
                />
              </dl>
            </div>

            <div className="rounded-md border border-border bg-surface p-4">
              <h3 className="mb-2 text-sm font-bold text-foreground">利用開始</h3>
              <p className="text-sm">
                {new Date(user.createdAt).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-bold text-foreground">{value}</dd>
    </div>
  );
}

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
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="shrink-0 flex items-center justify-center rounded-full bg-zinc-300 font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name.slice(0, 1)}
    </div>
  );
}

function EventRow({
  event,
  groupName,
  statusBadge,
}: {
  event: {
    id: string;
    title: string;
    startedAt: string;
    coverImageUrl: string | null;
    place: string | null;
    eventFormat: string;
    capacity: number | null;
    acceptedCount: number;
  };
  groupName: string;
  groupSubdomain: string;
  statusBadge?: string;
}) {
  return (
    <Link
      href={`/event/${event.id}`}
      className="flex gap-4 rounded-md border border-border bg-surface p-4 hover:border-brand-orange"
    >
      {event.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.coverImageUrl}
          alt=""
          className="h-20 w-20 shrink-0 rounded-md object-cover"
        />
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-xs text-muted-foreground">
          No Image
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">
          {formatEventDateShort(event.startedAt)}
          {" ・ "}
          <span className="text-link">{groupName}</span>
        </p>
        <h3 className="line-clamp-2 text-base font-semibold text-foreground">
          {event.title}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>
            {event.eventFormat === "online"
              ? "オンライン"
              : event.place ?? "会場未定"}
          </span>
          <span>・</span>
          <span>{formatAcceptedRatio(event.acceptedCount, event.capacity)}</span>
          {statusBadge && (
            <span className="rounded bg-status-open-bg px-2 py-0.5 text-status-open-fg">
              {statusBadge}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ============================================================
 * View 切替トグル (timeline / classic)
 * ============================================================ */

function ViewToggle({
  nickname,
  activeView,
}: {
  nickname: string;
  activeView: UserView;
}) {
  return (
    <div
      className="mb-4 flex items-center justify-end"
      data-testid="user-view-toggle"
    >
      <div
        role="tablist"
        aria-label="表示モード切替"
        className="inline-flex rounded-md border border-border bg-surface p-0.5 text-xs"
      >
        <Link
          href={`/user/${nickname}?view=timeline`}
          role="tab"
          aria-selected={activeView === "timeline"}
          data-testid="user-view-toggle-timeline"
          className={
            activeView === "timeline"
              ? "rounded px-3 py-1.5 font-bold text-white bg-brand-orange"
              : "rounded px-3 py-1.5 font-medium text-muted-foreground hover:text-foreground"
          }
        >
          タイムライン
        </Link>
        <Link
          href={`/user/${nickname}?view=classic`}
          role="tab"
          aria-selected={activeView === "classic"}
          data-testid="user-view-toggle-classic"
          className={
            activeView === "classic"
              ? "rounded px-3 py-1.5 font-bold text-white bg-brand-orange"
              : "rounded px-3 py-1.5 font-medium text-muted-foreground hover:text-foreground"
          }
        >
          クラシック
        </Link>
      </div>
    </div>
  );
}

/* ============================================================
 * Luma 風タイムラインビュー
 *
 * - ヘッダーを中央寄せ (アバター中央)
 * - SNS アイコン列 (X / GitHub / Web)
 * - フォロワー数表示 (subscriberCount=0 のプレースホルダ)
 * - Hosting / Going / Hosted / Materials を `EventTimeline` で表示
 * ============================================================ */

type PresentationWithEvent = SerializedPresentationMaterial & {
  eventTitle: string;
  eventId: string;
};

function UserProfileTimelineView({
  user,
  bioHtml,
  personJsonLd,
  hostingEventCards,
  goingEventCards,
  hostedEventCards,
  groups,
  presentations,
  participatedCount,
  ownedCount,
  presentationCount,
  groupCount,
}: {
  user: {
    nickname: string;
    displayName: string;
    avatarUrl: string | null;
    affiliation: string | null;
    location: string | null;
    xAccount: string | null;
    githubAccount: string | null;
    websiteUrl: string | null;
    createdAt: string;
  };
  bioHtml: string;
  personJsonLd: Record<string, unknown>;
  hostingEventCards: EventCardData[];
  goingEventCards: EventCardData[];
  hostedEventCards: EventCardData[];
  groups: SerializedGroup[];
  presentations: PresentationWithEvent[];
  participatedCount: number;
  ownedCount: number;
  presentationCount: number;
  groupCount: number;
}) {
  // フォロワー数 (仮: 0)。将来 Subscribe 機能と結線する。
  const subscriberCount = 0;

  return (
    <div
      className="flex flex-1 flex-col bg-background"
      data-view="timeline"
      data-testid="user-timeline-view"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(personJsonLd) }}
      />
      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        {/* ============ view 切替トグル ============ */}
        <ViewToggle nickname={user.nickname} activeView="timeline" />

        {/* ============ センター揃えのプロフィールヘッダ ============ */}
        <header
          className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-8 text-center"
          data-testid="user-timeline-header"
        >
          <AvatarCircle
            url={user.avatarUrl}
            name={user.displayName}
            size={112}
          />
          <h1 className="text-2xl font-bold leading-tight">
            {user.displayName}
          </h1>
          <p className="text-sm text-muted-foreground">@{user.nickname}</p>
          {user.affiliation && (
            <p className="text-sm text-foreground">所属: {user.affiliation}</p>
          )}
          {user.location && (
            <p className="text-sm text-muted-foreground">{user.location}</p>
          )}
          <p
            className="text-xs text-muted-foreground"
            data-testid="user-timeline-joined"
          >
            参加開始:{" "}
            {new Date(user.createdAt).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "long",
            })}
          </p>

          {/* SNS アイコン列 */}
          <div
            className="flex flex-wrap items-center justify-center gap-2"
            data-testid="user-timeline-socials"
          >
            {user.xAccount && (
              <a
                href={`https://x.com/${user.xAccount}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`X (Twitter) @${user.xAccount}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold hover:bg-zinc-200"
              >
                X
              </a>
            )}
            {user.githubAccount && (
              <a
                href={`https://github.com/${user.githubAccount}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`GitHub @${user.githubAccount}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold hover:bg-zinc-200"
              >
                GH
              </a>
            )}
            {user.websiteUrl && (
              <a
                href={user.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Web サイト"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold hover:bg-zinc-200"
              >
                Web
              </a>
            )}
          </div>

          {/* フォロワー数 + 統計 */}
          <div
            className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm"
            data-testid="user-timeline-stats"
          >
            <span>
              <span className="font-bold text-foreground">
                {formatNumber(subscriberCount)}
              </span>
              <span className="ml-1 text-muted-foreground">フォロワー</span>
            </span>
            <span>
              <span className="font-bold text-foreground">
                {formatNumber(ownedCount)}
              </span>
              <span className="ml-1 text-muted-foreground">主催</span>
            </span>
            <span>
              <span className="font-bold text-foreground">
                {formatNumber(participatedCount)}
              </span>
              <span className="ml-1 text-muted-foreground">参加</span>
            </span>
          </div>

          {bioHtml && (
            <article
              className="prose prose-zinc mx-auto mt-2 max-w-2xl text-left text-sm leading-7"
              dangerouslySetInnerHTML={{ __html: bioHtml }}
            />
          )}
        </header>

        {/* ============ Hosting / Going / Hosted / Materials ============ */}
        <div className="mt-8 space-y-10">
          <EventTimeline
            heading="Hosting (主催予定)"
            events={hostingEventCards}
            emptyMessage="主催予定のイベントはありません"
          />

          <EventTimeline
            heading="Going (参加予定・参加履歴)"
            events={goingEventCards}
            emptyMessage="参加履歴はまだありません"
          />

          <EventTimeline
            heading="Hosted (過去の主催)"
            events={hostedEventCards}
            emptyMessage="過去の主催イベントはありません"
          />

          {/* Materials */}
          <section data-testid="user-timeline-materials">
            <h2 className="mb-3 text-xl font-bold text-foreground">
              Materials (発表資料){" "}
              <span className="text-sm font-normal text-muted-foreground">
                ({formatNumber(presentationCount)} 件)
              </span>
            </h2>
            {presentations.length === 0 ? (
              <p className="rounded-md border border-border bg-surface p-6 text-sm text-muted-foreground">
                発表資料はまだありません
              </p>
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {presentations.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-md border border-border bg-surface p-4"
                  >
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block hover:opacity-80"
                    >
                      {p.thumbnailUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.thumbnailUrl}
                          alt=""
                          className="mb-2 aspect-video w-full rounded object-cover"
                        />
                      )}
                      <h3 className="line-clamp-2 text-sm font-semibold">
                        {p.title}
                      </h3>
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                        {truncate(p.eventTitle, 40)}
                      </p>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 所属グループ (補助) */}
          <section data-testid="user-timeline-groups">
            <h2 className="mb-3 text-xl font-bold text-foreground">
              所属グループ{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ({formatNumber(groupCount)} グループ)
              </span>
            </h2>
            {groups.length === 0 ? (
              <p className="rounded-md border border-border bg-surface p-6 text-sm text-muted-foreground">
                所属グループはありません
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {groups.map((g) => (
                  <li key={g.id}>
                    <Link
                      href={`/group/${g.subdomain}`}
                      className="block rounded-md border border-border bg-surface p-3 text-center hover:border-brand-orange"
                    >
                      {g.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={g.thumbnailUrl}
                          alt=""
                          className="mx-auto h-16 w-16 rounded-md object-cover"
                        />
                      ) : (
                        <div
                          className="mx-auto flex h-16 w-16 items-center justify-center rounded-md text-lg font-bold text-white"
                          style={{
                            backgroundColor: g.backgroundColor ?? "#1f63c1",
                          }}
                        >
                          {g.name.slice(0, 1)}
                        </div>
                      )}
                      <p className="mt-2 line-clamp-2 text-xs font-medium">
                        {g.name}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
