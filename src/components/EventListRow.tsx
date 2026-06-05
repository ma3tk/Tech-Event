import Link from "next/link";
import Image from "next/image";
import { MapPin, Globe, Users, Calendar } from "lucide-react";
import { cn } from "@/lib/cn";
import type { EventCardData, EventLocation } from "./EventCard";
import EventStatusBadge from "./EventStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

/* ============================================================
 * Types
 * ============================================================ */

export type EventListRowProps = {
  event: EventCardData;
  /**
   * 順位表示。指定するとサムネ左に大きな順位バッジが表示される。
   * 1〜3 は金/銀/銅、4 以降はシンプルな数字。
   */
  showRank?: number;
  /**
   * `true` のときさらにコンパクト(行高 ~80px)。デフォルトでも十分コンパクト。
   */
  compact?: boolean;
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

/**
 * コンパクトリスト行 (connpass の "新着イベント" や検索結果のリスト型)
 *
 * - デスクトップ: 左に 80x60 サムネ → 右に "タグ + グループ名 / タイトル / 日付・会場" を縦積み
 * - 行右端: 参加者数 ("参加 23 / 50")
 * - モバイル: サムネを上、テキストを下に縦積み
 * - 全体クリッカブル (Stretched link)
 * - 行と行の区切りはコンテナ側で `divide-y` を使う前提だが、念のため `border-b` も用意
 *
 * 内部の小ロゴ/右端ロゴは `ui/Avatar` を使い、ハッシュタグ pill は `ui/Badge` の
 * 装飾レイヤに乗せている。
 */
export default function EventListRow({
  event,
  showRank,
  compact = false,
  className,
}: EventListRowProps) {
  const href = event.href ?? `/event/${event.id}`;
  const titleId = `evrow-${event.id}-title`;
  const accepted = event.accepted;
  const limit = event.limit ?? null;
  const groupIcon = event.group.iconUrl;
  const groupUrl = event.group.url ?? `/group/${event.group.id}`;

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        // Motion 規約: list 行の hover は背景色のみ変えるので transition-colors duration-fast
        "group relative flex flex-col gap-3 bg-surface px-3 py-3 transition-colors duration-fast ease-out hover:bg-brand-orange-soft/40 sm:flex-row sm:items-center sm:gap-4",
        compact ? "sm:py-2.5" : "sm:py-3",
        className,
      )}
    >
      {/* ============ 順位バッジ (ランキング用) ============ */}
      {showRank != null && <RankBadge rank={showRank} />}

      {/* ============ サムネイル ============ */}
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded bg-brand-orange-soft",
          // モバイル: aspect-video full width, デスクトップ: 80x60 固定
          "aspect-video w-full sm:aspect-auto sm:h-[60px] sm:w-[80px]",
        )}
      >
        {event.thumbnailUrl ? (
          <Image
            src={event.thumbnailUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 80px"
            className="object-cover"
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

      {/* ============ 本文 (3段) ============ */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {/* 上段: ステータス + グループロゴ + グループ名 */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <EventStatusBadge status={event.status} size="sm" />
          {/* WCAG AA: bg-brand-orange-soft (#fff1ea) と text-brand-orange (#c2410c) で 4.58:1 を確保 */}
          {event.hashtags && event.hashtags.length > 0 && (
            <Badge
              variant="outline"
              className="max-w-[160px] truncate rounded-sm border-transparent bg-brand-orange-soft px-1.5 py-0.5 text-[10px] font-semibold text-brand-orange"
            >
              #{event.hashtags[0]}
            </Badge>
          )}
          {/* グループ名の前に16x16の小ロゴ (本家のグループバッジ風) */}
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

        {/* 中段: タイトル (主見出し) */}
        <h3
          id={titleId}
          className="line-clamp-2 text-[15px] font-bold text-foreground transition-colors duration-fast ease-out group-hover:text-brand-orange sm:text-base"
        >
          <Link
            href={href}
            className="before:absolute before:inset-0 before:content-[''] focus-visible:outline-none"
          >
            {event.title}
          </Link>
        </h3>

        {/* 下段: 日付 + 会場 */}
        <ul className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <li className="inline-flex items-center gap-1">
            <Calendar aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            <FormattedDate iso={event.startedAt} />
          </li>
          <li className="inline-flex items-center gap-1 min-w-0">
            <LocationIcon location={event.location} />
            <span className="truncate">
              <LocationText location={event.location} />
            </span>
          </li>
        </ul>
      </div>

      {/* ============ 右端: 参加者数 (グループアイコン + count) ============ */}
      <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
        {groupIcon && (
          <Avatar className="hidden h-8 w-8 rounded border border-border sm:flex">
            <AvatarImage src={groupIcon} alt="" />
            <AvatarFallback className="rounded text-xs">
              {event.group.name.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
        )}
        <div
          className="flex flex-col items-end whitespace-nowrap text-xs text-muted-foreground"
          aria-label={formatParticipantsLabel(accepted, limit)}
        >
          <span className="inline-flex items-center gap-1 font-semibold text-foreground">
            <Users aria-hidden="true" className="h-3.5 w-3.5" />
            <span>
              {accepted}
              {limit != null ? ` / ${limit}` : ""}
            </span>
          </span>
          <span className="text-[10px]">参加</span>
        </div>
      </div>
    </article>
  );
}

/* ============================================================
 * 内部ヘルパー
 * ============================================================ */

function RankBadge({ rank }: { rank: number }) {
  // 1〜3 位: 金/銀/銅
  let palette = "bg-zinc-100 text-zinc-700";
  if (rank === 1) palette = "bg-yellow-400 text-white";
  else if (rank === 2) palette = "bg-zinc-400 text-white";
  else if (rank === 3) palette = "bg-amber-700 text-white";

  const isTop3 = rank >= 1 && rank <= 3;
  return (
    <div
      aria-label={`${rank}位`}
      className={cn(
        "flex shrink-0 items-center justify-center self-start rounded-md font-extrabold",
        // モバイル: 左上に小さめ、デスクトップ: 行左端で大きく
        "h-10 w-10 text-base sm:h-14 sm:w-14 sm:text-2xl",
        palette,
        isTop3 && "shadow-sm",
      )}
    >
      {rank}
    </div>
  );
}

function FormattedDate({ iso }: { iso: string }) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const dow = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  const fmt =
    `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/` +
    `${String(d.getDate()).padStart(2, "0")} (${dow}) ` +
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return <time dateTime={iso}>{fmt}</time>;
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
  if (limit != null) return `参加者 ${accepted}人、定員 ${limit}人`;
  return `参加者 ${accepted}人 (定員なし)`;
}
