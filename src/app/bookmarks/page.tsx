/**
 * ブックマーク (気になる) 一覧の専用ページ。
 *
 * `/bookmarks`
 *
 * 機能:
 *  - 認証必須。未ログインは `/login?next=/bookmarks` へリダイレクト。
 *  - 自分の Bookmark を作成日時降順で表示する。
 *  - 各カードに「ブックマーク解除」ボタン (Server Action `unbookmarkEvent` 再利用)
 *  - 上部に「気になるをカレンダーに追加」フォーム。送信すると新規 Calendar が
 *    作成され、全ブックマークが追加されて新カレンダー詳細へリダイレクトする。
 *
 * `/dashboard?tab=bookmarks` でも同等の一覧は見えるが、こちらは bookmark 操作に
 * 特化した独立ページで、一括カレンダー化のような専用アクションを集約する。
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, CalendarPlus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { serializeEvent } from "@/lib/serialize";
import {
  formatEventDateShort,
  formatAcceptedRatio,
  formatRelative,
} from "@/lib/utils";
import { unbookmarkEvent } from "@/app/actions/event-actions";
import { createCalendarFromBookmarks } from "@/app/actions/calendar-actions";
import Breadcrumb from "@/components/Breadcrumb";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "気になるイベント | tech-event",
  description: "ブックマークしたイベントの一覧。一括でカレンダーに追加できます。",
};

export default async function BookmarksPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/bookmarks");
  }

  const rows = await prisma.bookmark.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      event: {
        include: {
          group: { select: { id: true, name: true, subdomain: true } },
        },
      },
    },
  });

  const bookmarks = rows.map((b) => ({
    id: b.id.toString(),
    bookmarkedAt: b.createdAt.toISOString(),
    event: serializeEvent(b.event),
    groupName: b.event.group.name,
    groupSubdomain: b.event.group.subdomain,
  }));

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
      <Breadcrumb
        items={[{ label: "ホーム", href: "/" }, { label: "気になる" }]}
      />

      <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            className="flex items-center gap-2 text-xl font-bold text-foreground md:text-2xl"
            data-testid="bookmarks-heading"
          >
            <Heart aria-hidden className="h-5 w-5 text-brand-orange" />
            気になるイベント
            <span
              data-testid="bookmarks-total"
              className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700"
            >
              {bookmarks.length} 件
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            あなたがブックマークしたイベントを新しい順に表示しています。
          </p>
        </div>

        {bookmarks.length > 0 && (
          <form
            action={createCalendarFromBookmarks}
            method="post"
            className="shrink-0"
            data-testid="bookmarks-create-calendar-form"
          >
            <input
              type="hidden"
              name="name"
              value={`${user.displayName}さんの気になる`}
            />
            <button
              type="submit"
              data-testid="bookmarks-create-calendar"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-orange px-4 text-sm font-semibold text-white shadow hover:bg-brand-orange-hover"
            >
              <CalendarPlus aria-hidden className="h-4 w-4" />
              気になるをカレンダーに追加
            </button>
          </form>
        )}
      </header>

      {bookmarks.length === 0 ? (
        <div
          className="mt-8 rounded-lg border border-dashed border-border bg-surface p-10 text-center"
          data-testid="bookmarks-empty"
        >
          <p className="text-sm text-muted-foreground">
            まだブックマークしたイベントはありません。
          </p>
          <Link
            href="/explore"
            className="mt-4 inline-block rounded-md bg-brand-orange px-4 py-2 text-sm font-semibold text-white hover:bg-brand-orange-hover"
          >
            イベントを探す
          </Link>
        </div>
      ) : (
        <ul
          className="mt-6 space-y-3"
          data-testid="bookmarks-list"
          aria-label="ブックマーク一覧"
        >
          {bookmarks.map((b) => (
            <li
              key={b.id}
              data-testid="bookmark-item"
              data-bookmark-id={b.id}
              className="flex gap-4 rounded-md border border-border bg-surface p-4"
            >
              <Link
                href={`/event/${b.event.id}`}
                className="flex flex-1 gap-4 min-w-0 hover:opacity-90"
              >
                {b.event.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.event.coverImageUrl}
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
                    {formatEventDateShort(b.event.startedAt)}
                    {" ・ "}
                    <span className="text-link">{b.groupName}</span>
                  </p>
                  <h3 className="line-clamp-2 text-base font-semibold text-foreground">
                    {b.event.title}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {b.event.eventFormat === "online"
                        ? "オンライン"
                        : b.event.place ?? "会場未定"}
                    </span>
                    <span aria-hidden>・</span>
                    <span>
                      {formatAcceptedRatio(
                        b.event.acceptedCount,
                        b.event.capacity,
                      )}
                    </span>
                    <span aria-hidden>・</span>
                    <span>追加 {formatRelative(new Date(b.bookmarkedAt))}</span>
                  </div>
                </div>
              </Link>

              <form
                action={unbookmarkEvent}
                method="post"
                className="shrink-0 self-start"
              >
                <input type="hidden" name="eventId" value={b.event.id} />
                <button
                  type="submit"
                  data-testid="bookmarks-remove"
                  aria-label={`「${b.event.title}」のブックマークを解除`}
                  className="inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-brand-orange-soft"
                >
                  解除
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
