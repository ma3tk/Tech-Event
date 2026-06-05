/**
 * グループ単位のカレンダー埋め込みウィジェット (Luma の Calendar Embed 相当)。
 *
 * - subdomain でグループを引き、今後 30 日分の published イベントを縦リスト表示
 * - 各行は新規タブで `/event/[id]` を開く
 * - 軽量レイアウトは `./layout.tsx` で提供
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Calendar } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatEventDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = { subdomain: string };

export const metadata: Metadata = {
  title: "カレンダー埋め込み",
  robots: { index: false, follow: false },
};

export default async function EmbedCalendarPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { subdomain } = await params;

  const group = await prisma.group.findUnique({
    where: { subdomain },
    select: { id: true, name: true, subtitle: true, thumbnailUrl: true },
  });
  if (!group) notFound();

  const now = new Date();
  const horizon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const events = await prisma.event.findMany({
    where: {
      groupId: group.id,
      status: "published",
      startedAt: { gte: now, lte: horizon },
    },
    orderBy: { startedAt: "asc" },
    take: 20,
    select: {
      id: true,
      title: true,
      startedAt: true,
      endedAt: true,
      place: true,
      eventFormat: true,
      themeTintColor: true,
    },
  });

  return (
    <div
      data-testid="embed-calendar"
      className="mx-auto flex w-full max-w-2xl flex-col gap-3 p-4"
    >
      <header className="flex items-center gap-3 border-b border-border pb-3">
        {group.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={group.thumbnailUrl}
            alt=""
            aria-hidden="true"
            className="h-10 w-10 rounded-md object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-orange-soft text-brand-orange"
          >
            <Calendar className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <h1 data-testid="embed-calendar-title" className="truncate text-lg font-bold">
            {group.name}
          </h1>
          {group.subtitle && (
            <p className="truncate text-xs text-muted-foreground">
              {group.subtitle}
            </p>
          )}
        </div>
        <Link
          href={`/group/${subdomain}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs text-link hover:underline"
        >
          tech-event で見る ↗
        </Link>
      </header>

      {events.length === 0 ? (
        <p
          data-testid="embed-calendar-empty"
          className="rounded-md border border-dashed border-border bg-surface p-6 text-center text-sm text-muted-foreground"
        >
          今後 30 日以内に開催予定のイベントはありません。
        </p>
      ) : (
        <ul data-testid="embed-calendar-list" className="flex flex-col gap-2">
          {events.map((e) => {
            const tint = e.themeTintColor ?? "#ea5404";
            return (
              <li key={e.id.toString()}>
                <Link
                  href={`/event/${e.id.toString()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-stretch gap-3 rounded-md border border-border bg-surface p-3 hover:bg-brand-orange-soft"
                >
                  <span
                    aria-hidden="true"
                    className="w-1 shrink-0 rounded"
                    style={{ background: tint }}
                  />
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-sm font-semibold text-foreground">
                      {e.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      <time dateTime={e.startedAt.toISOString()}>
                        {formatEventDate(e.startedAt, e.endedAt)}
                      </time>
                      {" / "}
                      {e.eventFormat === "online" ? "オンライン" : e.place ?? "会場"}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-center text-[11px] text-muted-foreground">
        Powered by tech-event
      </p>
    </div>
  );
}
