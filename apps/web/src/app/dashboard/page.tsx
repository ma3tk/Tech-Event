/**
 * マイページ (ユーザーダッシュボード)
 *
 * - 未ログイン時: `/login?next=/dashboard` にリダイレクト
 * - 上部に KPI サマリー (参加予定 / ブックマーク / 主催 / 累計参加)
 * - タブ (Server Component, URL 同期):
 *   - upcoming  ... 参加予定 (Participant.status in (accepted, waiting, pending) かつ startedAt >= now)
 *   - bookmarks ... 興味あり (Bookmark)
 *   - owned     ... 主催 (ownerId == self OR GroupAdmin の Group の Event)
 *   - history   ... 参加履歴 (status=attended または startedAt < now)
 * - 右サイドバー:
 *   - 未読通知 上位 5 件 (kind をアイコン化、リンク付き)
 *   - おすすめイベント (直近の人気イベント上位 3 件)
 *   - アカウント (設定リンク / ログアウト)
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bell,
  MessageCircle,
  User as UserIcon,
  UserPlus,
  UserMinus,
  Heart,
  Calendar,
  Award,
  Settings,
  LogOut,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { serializeEvent, serializeUser } from "@/lib/serialize";
import { cn } from "@/lib/cn";
import {
  formatEventDateShort,
  formatAcceptedRatio,
  formatRelative,
} from "@/lib/utils";
import {
  parseNotificationPayload,
  formatNotificationText,
  notificationIconKind,
} from "@/lib/notification";

export const dynamic = "force-dynamic";

/**
 * ダッシュボードは個人情報を含むので noindex 化する。
 * (root metadata の `robots: { index: true }` を継承させない。)
 */
export const metadata: Metadata = {
  title: "ダッシュボード",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ tab?: string }>;

type DashboardTab = "upcoming" | "bookmark" | "managed" | "history";

function parseTab(raw: string | undefined): DashboardTab {
  const v = raw ?? "upcoming";
  if (v === "bookmarks" || v === "bookmark") return "bookmark";
  if (v === "owned" || v === "managed") return "managed";
  if (v === "history") return "history";
  return "upcoming";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const tab = parseTab(sp.tab);

  // ============ ログイン判定 ============
  const userRow = await getCurrentUser();
  if (!userRow) {
    redirect("/login?next=/dashboard");
  }
  const user = serializeUser(userRow);

  const now = new Date();

  // 自分が owner/admin のグループ id (主催タブの対象拡張に使う)
  const myAdminGroupRows = await prisma.groupAdmin.findMany({
    where: { userId: userRow.id, role: { in: ["owner", "admin"] } },
    include: { group: true },
    orderBy: { addedAt: "asc" },
  });
  const myAdminGroupIds = myAdminGroupRows.map((a) => a.groupId);
  const myAdminGroups = myAdminGroupRows
    .filter((a) => a.group.status === "active")
    .map((a) => ({
      id: a.group.id.toString(),
      subdomain: a.group.subdomain,
      name: a.group.name,
      role: a.role,
    }));

  // フォロー中ユーザー id (「フォロー中の人の新着イベント」セクション用)
  const followRows = await prisma.follow.findMany({
    where: { followerId: userRow.id },
    select: { followeeId: true },
  });
  const followeeIds = followRows.map((f) => f.followeeId);

  // ============ 各タブのデータ取得 ============
  const [
    upcomingRows,
    bookmarkRows,
    managedRows,
    historyRows,
    notificationRows,
    recommendedRows,
    upcomingTotal,
    bookmarksTotal,
    managedTotal,
    historyTotal,
    followingEventRows,
  ] = await Promise.all([
    // 参加予定 (accepted/waiting/pending かつ event.startedAt >= now)
    prisma.participant.findMany({
      where: {
        userId: userRow.id,
        status: { in: ["accepted", "waiting", "pending"] },
        event: { startedAt: { gte: now } },
      },
      orderBy: { event: { startedAt: "asc" } },
      take: 20,
      include: {
        event: {
          include: {
            group: { select: { id: true, name: true, subdomain: true } },
          },
        },
      },
    }),
    // 興味あり (ブックマーク)
    prisma.bookmark.findMany({
      where: { userId: userRow.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        event: {
          include: {
            group: { select: { id: true, name: true, subdomain: true } },
          },
        },
      },
    }),
    // 主催 (ownerId == self OR GroupAdmin の Group の Event)
    prisma.event.findMany({
      where: {
        OR: [
          { ownerId: userRow.id },
          ...(myAdminGroupIds.length > 0
            ? [{ groupId: { in: myAdminGroupIds } }]
            : []),
        ],
      },
      orderBy: { startedAt: "desc" },
      take: 20,
      include: {
        group: { select: { id: true, name: true, subdomain: true } },
      },
    }),
    // 参加履歴 (status=attended または startedAt < now)
    prisma.participant.findMany({
      where: {
        userId: userRow.id,
        OR: [
          { status: "attended" },
          { event: { startedAt: { lt: now } } },
        ],
      },
      orderBy: { event: { startedAt: "desc" } },
      take: 30,
      include: {
        event: {
          include: {
            group: { select: { id: true, name: true, subdomain: true } },
          },
        },
      },
    }),
    // 未読通知 上位 5 件 (kind をアイコン化、リンク付き)
    prisma.notification.findMany({
      where: { recipientUserId: userRow.id, readAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { event: { select: { id: true, title: true } } },
    }),
    // おすすめイベント (今は acceptedCount 上位 3 件、公開・未来)
    prisma.event.findMany({
      where: {
        status: "published",
        visibility: "public",
        startedAt: { gte: now },
      },
      orderBy: { acceptedCount: "desc" },
      take: 3,
      include: {
        group: { select: { id: true, name: true, subdomain: true } },
      },
    }),
    // ---- KPI 用 counts ----
    prisma.participant.count({
      where: {
        userId: userRow.id,
        status: { in: ["accepted", "waiting", "pending"] },
        event: { startedAt: { gte: now } },
      },
    }),
    prisma.bookmark.count({ where: { userId: userRow.id } }),
    prisma.event.count({
      where: {
        OR: [
          { ownerId: userRow.id },
          ...(myAdminGroupIds.length > 0
            ? [{ groupId: { in: myAdminGroupIds } }]
            : []),
        ],
      },
    }),
    prisma.participant.count({
      where: {
        userId: userRow.id,
        OR: [
          { status: "attended" },
          { event: { startedAt: { lt: now } } },
        ],
      },
    }),
    // フォロー中ユーザーが主催 or 参加 (accepted) する未来の公開イベント。
    // privacy: 公開 (visibility=public) かつ published のみ表示する。
    followeeIds.length === 0
      ? Promise.resolve([])
      : prisma.event.findMany({
          where: {
            status: "published",
            visibility: "public",
            startedAt: { gte: now },
            OR: [
              { ownerId: { in: followeeIds } },
              {
                participants: {
                  some: {
                    userId: { in: followeeIds },
                    status: "accepted",
                  },
                },
              },
            ],
          },
          orderBy: { startedAt: "asc" },
          take: 5,
          include: {
            group: { select: { id: true, name: true, subdomain: true } },
          },
        }),
  ]);

  const upcoming = upcomingRows.map((p) => ({
    status: p.status,
    event: serializeEvent(p.event),
    groupName: p.event.group.name,
    groupSubdomain: p.event.group.subdomain,
  }));

  const bookmarks = bookmarkRows.map((b) => ({
    bookmarkedAt: b.createdAt.toISOString(),
    event: serializeEvent(b.event),
    groupName: b.event.group.name,
    groupSubdomain: b.event.group.subdomain,
  }));

  const managed = managedRows.map((e) => ({
    event: serializeEvent(e),
    groupName: e.group.name,
    groupSubdomain: e.group.subdomain,
  }));

  const history = historyRows.map((p) => ({
    status: p.status,
    event: serializeEvent(p.event),
    groupName: p.event.group.name,
    groupSubdomain: p.event.group.subdomain,
  }));

  const notifications = notificationRows.map((n) => ({
    id: n.id.toString(),
    kind: n.kind,
    payload: n.payload,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    createdAt: n.createdAt.toISOString(),
    eventId: n.eventId ? n.eventId.toString() : null,
    eventTitle: n.event?.title ?? null,
  }));

  const recommended = recommendedRows.map((e) => ({
    id: e.id.toString(),
    title: e.title,
    startedAt: e.startedAt.toISOString(),
    groupName: e.group.name,
  }));

  const followingEvents = followingEventRows.map((e) => ({
    id: e.id.toString(),
    title: e.title,
    startedAt: e.startedAt.toISOString(),
    groupName: e.group.name,
  }));

  const tabs = [
    {
      key: "upcoming" as const,
      label: "参加予定",
      count: upcomingTotal,
    },
    {
      key: "bookmark" as const,
      label: "興味あり",
      count: bookmarksTotal,
    },
    { key: "managed" as const, label: "主催", count: managedTotal },
    { key: "history" as const, label: "参加履歴", count: historyTotal },
  ];

  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-bold">
          ようこそ、{user.displayName} さん
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          @{user.nickname} のマイページ
        </p>

        {/* ============ KPI サマリー ============ */}
        <section
          aria-label="アカウント概況"
          data-testid="dashboard-kpi"
          className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4"
        >
          <KpiCard label="参加予定" value={upcomingTotal} unit="件" />
          <KpiCard label="ブックマーク" value={bookmarksTotal} unit="件" />
          <KpiCard label="主催" value={managedTotal} unit="件" />
          <KpiCard label="累計参加" value={historyTotal} unit="件" />
        </section>

        <div className="mt-6 flex flex-col gap-8 lg:flex-row">
          <div className="flex-1">
            {/* ============ タブ ============ */}
            <nav
              className="flex gap-1 border-b border-border"
              data-testid="dashboard-tabs"
            >
              {tabs.map((t) => (
                <Link
                  key={t.key}
                  href={`/dashboard?tab=${t.key}`}
                  data-testid={`dashboard-tab-${t.key}`}
                  className={cn(
                    "border-b-2 px-4 py-2 text-sm font-medium",
                    tab === t.key
                      ? "border-brand-orange text-brand-orange"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span className="ml-1 rounded-full bg-surface-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {t.count}
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            {/* ============ タブ内容 ============ */}
            <div className="mt-6" data-testid={`dashboard-panel-${tab}`}>
              {tab === "upcoming" && (
                <DashboardEventList
                  items={upcoming.map((u) => ({
                    event: u.event,
                    groupName: u.groupName,
                    groupSubdomain: u.groupSubdomain,
                    badge:
                      u.status === "waiting"
                        ? "補欠/抽選待ち"
                        : u.status === "pending"
                          ? "抽選結果待ち"
                          : "参加確定",
                  }))}
                  emptyText="参加予定のイベントはありません。"
                  emptyCta={{ href: "/explore", label: "イベントを探す" }}
                  sectionLabel="参加予定"
                />
              )}
              {tab === "bookmark" && (
                <DashboardEventList
                  items={bookmarks.map((b) => ({
                    event: b.event,
                    groupName: b.groupName,
                    groupSubdomain: b.groupSubdomain,
                  }))}
                  emptyText="ブックマークしたイベントはありません。"
                  emptyCta={{ href: "/explore", label: "イベントを探す" }}
                  sectionLabel="興味あり"
                />
              )}
              {tab === "managed" && (
                <>
                  <div className="mb-3 flex items-center justify-end gap-2">
                    <Link
                      href="/event/create"
                      data-testid="dashboard-create-event"
                      className="inline-flex h-9 items-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white shadow hover:bg-brand-orange-hover"
                    >
                      + イベントを作成
                    </Link>
                  </div>
                  <DashboardEventList
                    items={managed.map((m) => ({
                      event: m.event,
                      groupName: m.groupName,
                      groupSubdomain: m.groupSubdomain,
                    }))}
                    emptyText="主催イベントはありません。"
                    emptyCta={{
                      href: "/event/create",
                      label: "イベントを作成する",
                    }}
                    sectionLabel="主催"
                  />
                </>
              )}
              {tab === "history" && (
                <DashboardEventList
                  items={history.map((h) => ({
                    event: h.event,
                    groupName: h.groupName,
                    groupSubdomain: h.groupSubdomain,
                    badge:
                      h.status === "attended"
                        ? "出席済"
                        : h.status === "cancelled"
                          ? "キャンセル"
                          : "参加",
                  }))}
                  emptyText="参加履歴はありません。"
                  sectionLabel="参加履歴"
                />
              )}
            </div>
          </div>

          {/* ============ サイドバー ============ */}
          <aside className="w-full shrink-0 space-y-6 lg:w-80">
            {/* ----- 未読通知 上位 5 件 ----- */}
            <section
              className="rounded-md border border-border bg-surface p-4"
              data-testid="dashboard-notifications"
              aria-labelledby="dashboard-notifications-heading"
            >
              <h2
                id="dashboard-notifications-heading"
                className="mb-3 flex items-center justify-between text-sm font-bold"
              >
                未読通知
                {notifications.length > 0 && (
                  <Link
                    href="/notifications"
                    className="text-xs text-link hover:text-link-hover"
                  >
                    すべて見る
                  </Link>
                )}
              </h2>
              {notifications.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  未読の通知はありません
                </p>
              ) : (
                <ul className="space-y-2">
                  {notifications.map((n) => {
                    const payload = parseNotificationPayload(n.payload);
                    const text = formatNotificationText(n.kind, payload);
                    const iconKind = notificationIconKind(n.kind);
                    const href = n.eventId
                      ? `/event/${n.eventId}`
                      : "/notifications";
                    return (
                      <li key={n.id}>
                        <Link
                          href={href}
                          className="flex items-start gap-2 rounded bg-brand-orange-soft/40 p-2 text-xs hover:bg-brand-orange-soft"
                        >
                          <span
                            aria-hidden
                            className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white"
                          >
                            <SidebarIcon kind={iconKind} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-2 font-medium text-foreground">
                              {text}
                            </span>
                            <span className="block text-muted-foreground">
                              {formatRelative(n.createdAt)}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* ----- おすすめイベント ----- */}
            <section
              className="rounded-md border border-border bg-surface p-4"
              data-testid="dashboard-recommended"
              aria-labelledby="dashboard-recommended-heading"
            >
              <h2
                id="dashboard-recommended-heading"
                className="mb-3 text-sm font-bold"
              >
                おすすめイベント
              </h2>
              {recommended.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  おすすめできるイベントはまだありません
                </p>
              ) : (
                <ul className="space-y-3">
                  {recommended.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/event/${r.id}`}
                        className="block hover:opacity-80"
                      >
                        <p className="text-xs text-muted-foreground">
                          {formatEventDateShort(r.startedAt)} ・ {r.groupName}
                        </p>
                        <p className="line-clamp-2 text-sm font-medium">
                          {r.title}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ----- フォロー中の人の新着イベント ----- */}
            <section
              className="rounded-md border border-border bg-surface p-4"
              data-testid="dashboard-following-events"
              aria-labelledby="dashboard-following-events-heading"
            >
              <h2
                id="dashboard-following-events-heading"
                className="mb-3 text-sm font-bold"
              >
                フォロー中の人の新着イベント
              </h2>
              {followeeIds.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  ユーザーをフォローすると、その人が主催・参加する公開イベントがここに表示されます。
                </p>
              ) : followingEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  フォロー中の人の新着イベントはまだありません
                </p>
              ) : (
                <ul className="space-y-3">
                  {followingEvents.map((e) => (
                    <li key={e.id}>
                      <Link
                        href={`/event/${e.id}`}
                        className="block hover:opacity-80"
                      >
                        <p className="text-xs text-muted-foreground">
                          {formatEventDateShort(e.startedAt)} ・ {e.groupName}
                        </p>
                        <p className="line-clamp-2 text-sm font-medium">
                          {e.title}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ----- アカウント ----- */}
            <section
              className="rounded-md border border-border bg-surface p-4 text-sm"
              data-testid="dashboard-account"
              aria-labelledby="dashboard-account-heading"
            >
              <h2
                id="dashboard-account-heading"
                className="mb-3 text-sm font-bold"
              >
                アカウント
              </h2>
              <ul className="space-y-2">
                <li>
                  <Link
                    href={`/user/${user.nickname}`}
                    className="inline-flex items-center gap-2 text-link hover:text-link-hover"
                  >
                    <UserIcon aria-hidden className="h-4 w-4" />
                    公開プロフィールを見る
                  </Link>
                </li>
                <li>
                  <Link
                    href="/account/profile"
                    className="inline-flex items-center gap-2 text-link hover:text-link-hover"
                  >
                    <Settings aria-hidden className="h-4 w-4" />
                    設定 (プロフィール / メール通知)
                  </Link>
                </li>
                <li>
                  <form action="/api/auth/logout" method="post">
                    <button
                      type="submit"
                      data-testid="dashboard-logout"
                      className="inline-flex items-center gap-2 text-link hover:text-link-hover"
                    >
                      <LogOut aria-hidden className="h-4 w-4" />
                      ログアウト
                    </button>
                  </form>
                </li>
              </ul>
            </section>

            {/* ----- 主催グループ ----- */}
            <section
              className="rounded-md border border-border bg-surface p-4"
              data-testid="dashboard-groups-section"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold">グループ</h2>
                <Link
                  href="/group/create"
                  data-testid="dashboard-create-group"
                  className="inline-flex h-7 items-center rounded-md bg-brand-orange px-2.5 text-xs font-semibold text-white hover:bg-brand-orange-hover"
                >
                  + 作成
                </Link>
              </div>
              {myAdminGroups.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  まだ管理しているグループはありません。
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {myAdminGroups.map((g) => (
                    <li
                      key={g.id}
                      className="flex items-center justify-between"
                    >
                      <Link
                        href={`/group/${g.subdomain}`}
                        className="line-clamp-1 text-link hover:text-link-hover"
                      >
                        {g.name}
                      </Link>
                      <Link
                        href={`/group/${g.subdomain}/edit`}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        編集
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * 内部コンポーネント
 * ============================================================ */

function KpiCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div
      data-testid={`dashboard-kpi-${label}`}
      className="rounded-md border border-border bg-surface p-3"
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold text-foreground">
        {new Intl.NumberFormat("ja-JP").format(value)}
        <span className="ml-1 text-xs font-normal text-muted-foreground">
          {unit}
        </span>
      </p>
    </div>
  );
}

function SidebarIcon({
  kind,
}: {
  kind:
    | "comment"
    | "user"
    | "user-plus"
    | "user-minus"
    | "heart"
    | "calendar"
    | "award"
    | "bell";
}) {
  const cls = "h-3.5 w-3.5";
  if (kind === "comment") return <MessageCircle aria-hidden className={cls} />;
  if (kind === "user-plus") return <UserPlus aria-hidden className={cls} />;
  if (kind === "user-minus") return <UserMinus aria-hidden className={cls} />;
  if (kind === "user") return <UserIcon aria-hidden className={cls} />;
  if (kind === "heart") return <Heart aria-hidden className={cls} />;
  if (kind === "calendar") return <Calendar aria-hidden className={cls} />;
  if (kind === "award") return <Award aria-hidden className={cls} />;
  return <Bell aria-hidden className={cls} />;
}

function DashboardEventList({
  items,
  emptyText,
  emptyCta,
  sectionLabel,
}: {
  items: {
    event: ReturnType<typeof serializeEvent>;
    groupName: string;
    groupSubdomain: string;
    badge?: string;
  }[];
  emptyText: string;
  emptyCta?: { href: string; label: string };
  sectionLabel: string;
}) {
  if (items.length === 0) {
    return (
      <div
        className="rounded-md border border-border bg-surface p-8 text-center"
        data-testid="dashboard-empty"
      >
        <p className="text-sm text-muted-foreground">{emptyText}</p>
        {emptyCta && (
          <Link
            href={emptyCta.href}
            className="mt-3 inline-block rounded-md bg-brand-orange px-4 py-2 text-xs font-semibold text-white hover:bg-brand-orange-hover"
          >
            {emptyCta.label}
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <p className="sr-only">{sectionLabel}</p>
      <ul className="space-y-3" data-testid="dashboard-event-list">
        {items.map((it) => (
          <li key={it.event.id}>
            <Link
              href={`/event/${it.event.id}`}
              className="flex gap-4 rounded-md border border-border bg-surface p-4 hover:border-brand-orange"
            >
              {it.event.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={it.event.coverImageUrl}
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
                  {formatEventDateShort(it.event.startedAt)}
                  {" ・ "}
                  <span className="text-link">{it.groupName}</span>
                </p>
                <h3 className="line-clamp-2 text-base font-semibold text-foreground">
                  {it.event.title}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {it.event.eventFormat === "online"
                      ? "オンライン"
                      : it.event.place ?? "会場未定"}
                  </span>
                  <span>・</span>
                  <span>
                    {formatAcceptedRatio(
                      it.event.acceptedCount,
                      it.event.capacity,
                    )}
                  </span>
                  {it.badge && (
                    <span className="rounded bg-brand-orange-soft px-2 py-0.5 text-brand-orange">
                      {it.badge}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

