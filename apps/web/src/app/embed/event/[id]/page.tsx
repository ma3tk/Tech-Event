/**
 * イベント埋め込みウィジェット (Luma の Event Card Embed 相当)。
 *
 * - 軽量レイアウト (Header/Footer なし。`./layout.tsx` で minimal layout を提供)
 * - カバー画像 / タイトル / 日時 / 会場 / CTA のみ
 * - CTA は新規タブで `/event/[id]` を開く (`target="_blank"`)
 * - 親ページに高さを `postMessage` で通知 (layout.tsx のスクリプト)
 */

import Link from "next/link";
import { Calendar, MapPin, Globe, Users } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { formatEventDate, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = { id: string };

function parseId(raw: string): bigint | null {
  if (!/^\d+$/.test(raw)) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

export const metadata: Metadata = {
  title: "イベント埋め込み",
  robots: { index: false, follow: false },
};

export default async function EmbedEventPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id: raw } = await params;
  const id = parseId(raw);
  if (!id) notFound();

  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      catchPhrase: true,
      coverImageUrl: true,
      startedAt: true,
      endedAt: true,
      place: true,
      address: true,
      onlineUrl: true,
      eventFormat: true,
      capacity: true,
      acceptedCount: true,
      status: true,
      themeTintColor: true,
      group: { select: { name: true } },
    },
  });
  if (!event) notFound();

  const location =
    event.eventFormat === "online"
      ? "オンライン"
      : event.place ?? event.address ?? "未定";

  const tint = event.themeTintColor ?? "#ea5404";
  const isCancelled = event.status === "cancelled";

  return (
    <div
      data-testid="embed-event-card"
      style={{ ["--event-tint" as string]: tint } as React.CSSProperties}
      className="mx-auto flex w-full max-w-xl flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm"
    >
      {event.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.coverImageUrl}
          alt=""
          aria-hidden="true"
          data-testid="embed-event-cover"
          className="h-40 w-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="h-2 w-full"
          style={{ background: tint }}
        />
      )}

      <div className="flex flex-col gap-3 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {event.group.name}
        </p>

        <h1 data-testid="embed-event-title" className="text-xl font-bold leading-tight">
          {event.title}
        </h1>

        {event.catchPhrase && (
          <p className="text-sm text-muted-foreground">{event.catchPhrase}</p>
        )}

        <dl className="grid grid-cols-1 gap-2 text-sm">
          <Meta
            icon={<Calendar aria-hidden="true" className="h-4 w-4" />}
            label="開催日時"
            value={
              <time dateTime={event.startedAt.toISOString()}>
                {formatEventDate(event.startedAt, event.endedAt)}
              </time>
            }
          />
          <Meta
            icon={
              event.eventFormat === "online" ? (
                <Globe aria-hidden="true" className="h-4 w-4" />
              ) : (
                <MapPin aria-hidden="true" className="h-4 w-4" />
              )
            }
            label="会場"
            value={location}
          />
          <Meta
            icon={<Users aria-hidden="true" className="h-4 w-4" />}
            label="参加人数"
            value={
              event.capacity != null
                ? `${formatNumber(event.acceptedCount)} / ${formatNumber(event.capacity)} 人`
                : `${formatNumber(event.acceptedCount)} 人`
            }
          />
        </dl>

        <Link
          href={`/event/${event.id.toString()}`}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="embed-event-cta"
          aria-disabled={isCancelled}
          style={
            isCancelled
              ? undefined
              : ({ background: tint } as React.CSSProperties)
          }
          className={
            isCancelled
              ? "inline-flex h-10 items-center justify-center rounded-md bg-border-strong px-4 text-sm font-semibold text-muted-foreground"
              : "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold text-white shadow hover:opacity-90"
          }
        >
          {isCancelled ? "中止されました" : "詳細を見る・参加申込"}
        </Link>

        <p className="text-center text-[11px] text-muted-foreground">
          Powered by tech-event
        </p>
      </div>
    </div>
  );
}

function Meta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="flex-1 text-sm">
        <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-0.5 text-foreground">{value}</dd>
      </div>
    </div>
  );
}
