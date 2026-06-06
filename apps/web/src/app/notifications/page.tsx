/**
 * 通知センター (`/notifications`)
 *
 * - 未ログインは `/login?next=/notifications` にリダイレクト
 * - タブ: `all` (default) / `unread` / `read`
 * - 1 ページ 50 件、`page` クエリでページネーション
 * - 各行に種別アイコン、表示文 (payload を parse)、対象イベントへのリンク、
 *   相対時刻、未読時のみ「既読にする」フォームボタンを描画。
 * - ヘッダ部に「すべて既読にする」ボタン (未読がある時のみ)。
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
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/utils";
import {
  parseNotificationPayload,
  formatNotificationText,
  notificationIconKind,
} from "@/lib/notification";
import Pagination from "@/components/Pagination";
import Breadcrumb from "@/components/Breadcrumb";
import { EmptyState } from "@/components/ui/empty-state";
import { Inbox } from "lucide-react";
import { markRead, markAllRead } from "@/app/actions/notification-actions";

export const dynamic = "force-dynamic";

/**
 * 通知センターは個人情報を含むので noindex 化する。
 */
export const metadata: Metadata = {
  title: "通知",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 50;

type SearchParams = Promise<{ tab?: string; page?: string }>;

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const tab =
    sp.tab === "unread" || sp.tab === "read" ? sp.tab : ("all" as const);
  const page = (() => {
    const n = sp.page ? Number(sp.page) : 1;
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
  })();

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/notifications");
  }

  const baseWhere = { recipientUserId: user.id };
  const tabWhere =
    tab === "unread"
      ? { ...baseWhere, readAt: null }
      : tab === "read"
        ? { ...baseWhere, readAt: { not: null } }
        : baseWhere;

  const [total, rows, unreadTotal] = await Promise.all([
    prisma.notification.count({ where: tabWhere }),
    prisma.notification.findMany({
      where: tabWhere,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        event: {
          select: { id: true, title: true },
        },
      },
    }),
    prisma.notification.count({
      where: { recipientUserId: user.id, readAt: null },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildHref = (p: number): string => {
    const u = new URLSearchParams();
    if (tab !== "all") u.set("tab", tab);
    if (p > 1) u.set("page", p.toString());
    const q = u.toString();
    return q ? `/notifications?${q}` : "/notifications";
  };

  const tabs = [
    { key: "all" as const, label: "すべて" },
    { key: "unread" as const, label: "未読" },
    { key: "read" as const, label: "既読" },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <Breadcrumb
        items={[{ label: "ホーム", href: "/" }, { label: "通知" }]}
      />

      <div className="mt-4 flex items-end justify-between gap-4">
        <h1 className="text-xl font-bold text-foreground md:text-2xl">
          通知センター
          {unreadTotal > 0 && (
            <span
              data-testid="notifications-unread-total"
              className="ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-orange px-2 text-xs font-bold text-white"
            >
              {unreadTotal}
            </span>
          )}
        </h1>
        {unreadTotal > 0 && (
          <form action={markAllRead}>
            <button
              type="submit"
              data-testid="notifications-mark-all-read"
              className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium text-foreground hover:bg-brand-orange-soft"
            >
              すべて既読にする
            </button>
          </form>
        )}
      </div>

      {/* タブ */}
      <nav
        aria-label="通知の絞り込み"
        role="tablist"
        className="mt-4 flex gap-1 border-b border-border text-sm"
      >
        {tabs.map((t) => (
          <Link
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            href={t.key === "all" ? "/notifications" : `/notifications?tab=${t.key}`}
            data-testid={`notifications-tab-${t.key}`}
            className={
              tab === t.key
                ? "border-b-2 border-brand-orange px-4 py-2 text-sm font-bold text-brand-orange"
                : "border-b-2 border-transparent px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            }
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {/* リスト */}
      {rows.length === 0 ? (
        <EmptyState
          icon={Inbox}
          className="mt-8"
          title={
            tab === "unread"
              ? "未読の通知はありません"
              : tab === "read"
                ? "既読の通知はありません"
                : "通知はありません"
          }
          description="新しい通知が届くと、こちらに表示されます。"
        />
      ) : (
        <ul
          data-testid="notifications-list"
          className="mt-4 divide-y divide-border rounded-md border border-border bg-surface"
        >
          {rows.map((n) => {
            const payload = parseNotificationPayload(n.payload);
            const text = formatNotificationText(n.kind, payload);
            const iconKind = notificationIconKind(n.kind);
            const unread = n.readAt === null;
            const eventHref = n.eventId
              ? `/event/${n.eventId.toString()}`
              : null;
            return (
              <li
                key={n.id.toString()}
                data-testid="notifications-row"
                data-notification-id={n.id.toString()}
                data-unread={unread ? "true" : "false"}
                className={cn(
                  "flex items-start gap-3 p-4",
                  unread ? "bg-brand-orange-soft/40" : "bg-surface",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    unread
                      ? "bg-brand-orange text-white"
                      : "bg-surface-muted text-muted-foreground",
                  )}
                >
                  <NotificationIcon kind={iconKind} />
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm",
                      unread
                        ? "font-semibold text-foreground"
                        : "text-foreground",
                    )}
                  >
                    {text}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <time>{formatRelative(n.createdAt)}</time>
                    {n.event && eventHref && (
                      <>
                        <span aria-hidden>・</span>
                        <Link
                          href={eventHref}
                          className="text-link hover:text-link-hover"
                        >
                          {n.event.title}
                        </Link>
                      </>
                    )}
                  </p>
                </div>
                {unread && (
                  <form action={markRead} className="shrink-0">
                    <input
                      type="hidden"
                      name="id"
                      value={n.id.toString()}
                    />
                    <button
                      type="submit"
                      data-testid="notifications-mark-read"
                      className="inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-brand-orange-soft"
                    >
                      既読にする
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            buildHref={buildHref}
          />
        </div>
      )}
    </div>
  );
}

function NotificationIcon({
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
  const cls = "h-4 w-4";
  if (kind === "comment") return <MessageCircle aria-hidden className={cls} />;
  if (kind === "user-plus") return <UserPlus aria-hidden className={cls} />;
  if (kind === "user-minus") return <UserMinus aria-hidden className={cls} />;
  if (kind === "user") return <UserIcon aria-hidden className={cls} />;
  if (kind === "heart") return <Heart aria-hidden className={cls} />;
  if (kind === "calendar") return <Calendar aria-hidden className={cls} />;
  if (kind === "award") return <Award aria-hidden className={cls} />;
  return <Bell aria-hidden className={cls} />;
}
