/**
 * EventTimeline - Luma 風タイムライン UI
 *
 * イベントを「月見出し」で自動グループ化し、各イベントを `EventListRow` の
 * compact 版で並べる縦型タイムライン。
 *
 * - 月見出しは sticky 風 (`top-12`)、z-index は 5 で sticky CTA (z-50) より下
 * - 同月内では `startedAt` 昇順 (未来) / 降順 (過去) を呼び出し側のソート順に
 *   ほぼ準ずる。本コンポーネント自体は受け取った順序をそのまま保つ
 * - groupByMonth=false の場合は単一リストとしてフラットに描画 (showcase 用)
 * - props.events が空の場合は emptyMessage (デフォルト: 「イベントはありません」)
 *
 * 構造は維持しつつ、グループの小ロゴは `ui/Avatar` に置換。
 */

import Link from "next/link";
import { Calendar, Globe, MapPin, Users } from "lucide-react";
import { cn } from "@tech-event/shared-util-cn";
import EventStatusBadge from "./EventStatusBadge";
import type { EventCardData, EventLocation } from "./EventCard";
import { Avatar, AvatarImage, AvatarFallback } from "@tech-event/shared-ui";

/* ============================================================
 * Types
 * ============================================================ */

export type EventTimelineProps = {
  /** 表示するイベント (呼び出し側でソート済み前提) */
  events: EventCardData[];
  /** 月単位でグループ化するか。デフォルト true */
  groupByMonth?: boolean;
  /** 空のときに出すメッセージ */
  emptyMessage?: string;
  /** タイトル (h2 相当)。指定なしは見出しを出さない */
  heading?: string;
  /** ルートの追加 className */
  className?: string;
  /** 月見出しの sticky オフセット (px)。タブナビ等と被らないように調整可能 */
  stickyTopPx?: number;
};

/* ============================================================
 * Component
 * ============================================================ */

export default function EventTimeline({
  events,
  groupByMonth = true,
  emptyMessage = "イベントはありません",
  heading,
  className,
  stickyTopPx = 48,
}: EventTimelineProps) {
  if (events.length === 0) {
    return (
      <section className={cn("w-full", className)} data-testid="event-timeline">
        {heading && (
          <h2 className="mb-3 text-xl font-bold text-foreground">{heading}</h2>
        )}
        <p
          className="rounded-md border border-border bg-surface p-6 text-sm text-muted-foreground"
          data-testid="event-timeline-empty"
        >
          {emptyMessage}
        </p>
      </section>
    );
  }

  if (!groupByMonth) {
    return (
      <section className={cn("w-full", className)} data-testid="event-timeline">
        {heading && (
          <h2 className="mb-3 text-xl font-bold text-foreground">{heading}</h2>
        )}
        <ul
          className="divide-y divide-border rounded-md border border-border bg-surface"
          data-testid="event-timeline-list"
        >
          {events.map((e) => (
            <li key={e.id}>
              <TimelineRow event={e} />
            </li>
          ))}
        </ul>
      </section>
    );
  }

  // 月単位にグループ化
  const groups = groupEventsByMonth(events);

  return (
    <section className={cn("w-full", className)} data-testid="event-timeline">
      {heading && (
        <h2 className="mb-3 text-xl font-bold text-foreground">{heading}</h2>
      )}
      <div className="space-y-6">
        {groups.map((g) => (
          <div key={g.key} data-testid={`event-timeline-month-${g.key}`}>
            <h3
              className="sticky z-[5] -mx-2 mb-2 border-b border-border bg-background/95 px-2 py-1.5 text-sm font-semibold text-foreground backdrop-blur supports-[backdrop-filter]:bg-background/80"
              style={{ top: stickyTopPx }}
              data-testid="event-timeline-month-heading"
            >
              {g.label}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {g.events.length} 件
              </span>
            </h3>
            <ul className="divide-y divide-border rounded-md border border-border bg-surface">
              {g.events.map((e) => (
                <li key={e.id}>
                  <TimelineRow event={e} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
 * Internal helpers
 * ============================================================ */

type MonthGroup = {
  key: string; // "2026-06"
  label: string; // "2026年06月"
  events: EventCardData[];
};

/**
 * events を月単位 (startedAt の年・月) でグループ化する。
 *
 * - キー順 (出現順) を保持。呼び出し側がソート済みであれば、その順序を
 *   グループ間でも維持する
 * - 空 events はそもそも呼び出さない (上位でガード済み)
 */
function groupEventsByMonth(events: EventCardData[]): MonthGroup[] {
  const groups: MonthGroup[] = [];
  const indexMap = new Map<string, number>();

  for (const ev of events) {
    const d = new Date(ev.startedAt);
    if (Number.isNaN(d.getTime())) continue;
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const key = `${y}-${String(m).padStart(2, "0")}`;
    const label = `${y}年${String(m).padStart(2, "0")}月`;

    const existing = indexMap.get(key);
    if (existing != null) {
      groups[existing].events.push(ev);
    } else {
      indexMap.set(key, groups.length);
      groups.push({ key, label, events: [ev] });
    }
  }
  return groups;
}

/* ============================================================
 * Row (compact 版イベント行)
 *
 * EventListRow を直接使うと内部の `before:absolute` のリンクが ul li の構造で
 * 入れ子になり過ぎてしまうため、タイムライン用に最小情報のみを左日付バッジ +
 * 右テキストで表現する独自行にする。EventListRow との重複は意図的に小さく保つ。
 * ============================================================ */

function TimelineRow({ event }: { event: EventCardData }) {
  const href = event.href ?? `/event/${event.id}`;
  const d = new Date(event.startedAt);
  const day = d.getDate();
  const dow = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const groupIcon = event.group.iconUrl;
  const groupUrl = event.group.url ?? `/group/${event.group.id}`;

  return (
    <article
      data-testid={`timeline-row-${event.id}`}
      className="group relative flex items-stretch gap-3 px-3 py-3 transition-colors hover:bg-brand-orange-soft/40 sm:gap-4"
    >
      {/* 左: 日付バッジ */}
      <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-md border border-border bg-background py-1.5 text-center sm:w-14">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {dow}
        </span>
        <span className="text-lg font-bold leading-none text-foreground sm:text-xl">
          {day}
        </span>
        <span className="mt-0.5 text-[10px] text-muted-foreground">
          {hh}:{mm}
        </span>
      </div>

      {/* 中央: タイトル + メタ */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <EventStatusBadge status={event.status} size="sm" />
          {groupIcon ? (
            <Link
              href={groupUrl}
              className="relative z-10 flex shrink-0 items-center"
              aria-label={`${event.group.name} のページ`}
            >
              <Avatar className="h-4 w-4 rounded-[2px] border border-border">
                <AvatarImage src={groupIcon} alt="" />
                <AvatarFallback className="rounded-[2px] text-[8px]">
                  {event.group.name.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : null}
          <Link
            href={groupUrl}
            className="relative z-10 truncate text-link hover:text-link-hover hover:underline"
          >
            {event.group.name}
          </Link>
        </div>
        <h4 className="line-clamp-2 text-sm font-bold text-foreground transition-colors group-hover:text-brand-orange sm:text-[15px]">
          <Link
            href={href}
            className="before:absolute before:inset-0 before:content-[''] focus-visible:outline-none"
          >
            {event.title}
          </Link>
        </h4>
        <ul className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <li className="inline-flex items-center gap-1 min-w-0">
            <LocationIcon location={event.location} />
            <span className="truncate">
              <LocationText location={event.location} />
            </span>
          </li>
          <li
            className="inline-flex items-center gap-1"
            aria-label={formatParticipantsLabel(
              event.accepted,
              event.limit ?? null,
            )}
          >
            <Users aria-hidden="true" className="h-3.5 w-3.5" />
            <span>
              {event.accepted}
              {event.limit ? ` / ${event.limit}` : ""}
            </span>
          </li>
        </ul>
      </div>

      {/* 右: サムネ (デスクトップのみ) */}
      <div className="hidden h-14 w-20 shrink-0 overflow-hidden rounded bg-brand-orange-soft sm:block">
        {event.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.thumbnailUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-orange-soft to-brand-orange/20">
            <Calendar
              aria-hidden="true"
              className="h-5 w-5 text-brand-orange opacity-50"
            />
          </div>
        )}
      </div>
    </article>
  );
}

function LocationIcon({ location }: { location: EventLocation }) {
  if (location.type === "online") {
    return <Globe aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />;
  }
  return <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />;
}

function LocationText({ location }: { location: EventLocation }) {
  if (location.type === "online") {
    return (
      <span>オンライン{location.platform ? ` (${location.platform})` : ""}</span>
    );
  }
  if (location.type === "hybrid") {
    return <span>{location.prefecture} / オンライン</span>;
  }
  return <span>{location.prefecture}</span>;
}

function formatParticipantsLabel(
  accepted: number,
  limit: number | null,
): string {
  if (limit) return `参加者 ${accepted}人、定員 ${limit}人`;
  return `参加者 ${accepted}人 (定員なし)`;
}
