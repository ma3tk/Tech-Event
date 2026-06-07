import Link from "next/link";
import Image from "next/image";
import { MapPin, Globe, Users, Calendar } from "lucide-react";
import { cn } from "@tech-event/shared-util-cn";
import EventStatusBadge, { type EventStatus } from "./EventStatusBadge";
import TagPill from "./TagPill";
import { Card } from "@tech-event/shared-ui";

/* ============================================================
 * Types
 * ============================================================ */

export type EventLocation =
  | { type: "offline"; prefecture: string; address?: string }
  | { type: "online"; platform?: string }
  | { type: "hybrid"; prefecture: string; address?: string };

export type EventGroup = {
  id: string;
  name: string;
  iconUrl?: string;
  url?: string;
};

/**
 * `<EventCard>` が受け取る UI 用イベントデータ。
 *
 * DB の `Event` レコード (Prisma) からこの形に変換するには、
 * `src/lib/event-card.ts` のヘルパー `toEventCardData` を利用する。
 */
export type EventCardData = {
  id: string;
  title: string;
  catchPhrase?: string;
  /** ISO8601 開催開始日時 */
  startedAt: string;
  endedAt?: string;
  status: EventStatus;
  thumbnailUrl?: string;
  location: EventLocation;
  /** 現在の参加者数 */
  accepted: number;
  /** 定員。null/undefined は無制限 */
  limit?: number | null;
  group: EventGroup;
  /** ハッシュタグ */
  hashtags?: string[];
  /** 詳細ページ URL。デフォルトは `/event/{id}` */
  href?: string;
};

export type EventCardVariant = "list" | "grid" | "luma";

export type EventCardProps = {
  event: EventCardData;
  /**
   * カードのレイアウト。
   * - `list` (デフォルト): サムネイル左 + 本文右の横長レイアウト
   * - `grid`: サムネイル上 + 本文下の縦型レイアウト (3-4 カラムグリッド用)
   * - `luma`: 大判 cover image (16:9) + 余白多め + glassmorphism。
   *   rounded-2xl + shadow-soft-md (Luma 風カード)。
   */
  variant?: EventCardVariant;
  /**
   * オプションの tint color (HEX)。`luma` variant では subtle gradient overlay と
   * 左ボーダーに反映される。設定がない場合はデフォルトの brand-orange-soft。
   */
  tintColor?: string;
  /**
   * 主催者アバター列 (luma variant のみ表示)。Luma 風カードでは右下にスタックを重ねる。
   */
  hosts?: { name: string; avatarUrl?: string | null }[];
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

/**
 * イベントカード。
 *
 * - `list` variant: 横長カード (一覧ページの標準)
 * - `grid` variant: 縦型カード (トップページのフィーチャー表示用)
 *
 * カード全体クリッカブルは `<Link>` の `before:absolute before:inset-0` による
 * Stretched link パターンで実現。タイトル下線とアウトラインのみが見た目の
 * フィードバックを担う。
 *
 * 内部は `ui/Card` をベースに、stretched link を載せるため `<article>` への
 * `asChild` 相当の合成は使わず、Card primitive のクラスを React.cloneElement
 * 経由ではなく、独自 `<article>` に Card と同等のクラスを当てる形は取らず、
 * Card 自体を `<article>` として描画させる方針 (`asChild` は Card に無いため、
 * 代わりに Card の base クラスを保ちつつ拡張する className を渡す)。
 */
export default function EventCard({
  event,
  variant = "list",
  tintColor,
  hosts,
  className,
}: EventCardProps) {
  const href = event.href ?? `/event/${event.id}`;
  const titleId = `ev-${event.id}-title`;
  const accepted = event.accepted;
  const limit = event.limit ?? null;
  const groupIcon = event.group.iconUrl;

  // ----- luma variant (Luma 風 大判 cover + glassmorphism) -----
  if (variant === "luma") {
    // tint があれば左ボーダーに反映 + subtle gradient overlay。
    // 無ければ brand-orange-soft デフォルト。
    const tint = tintColor ?? null;
    const tintStyle: React.CSSProperties | undefined = tint
      ? { borderInlineStartColor: tint, borderInlineStartWidth: 4 }
      : undefined;

    return (
      <Card
        role="article"
        aria-labelledby={titleId}
        // Luma 風: rounded-2xl + shadow-soft-md、hover で shadow-soft-lg + lift。
        // border-l-4 は tint 反映用 (tint 無い時は border-l-transparent)。
        className={cn(
          "group relative flex h-full flex-col overflow-hidden",
          "rounded-2xl shadow-soft-md",
          tint ? "border-l-4" : "",
          "transition-[transform,box-shadow] duration-normal ease-out",
          "hover:shadow-soft-lg hover:-translate-y-1",
          className,
        )}
        style={tintStyle}
      >
        <LumaCover
          src={event.thumbnailUrl}
          startedAt={event.startedAt}
          tint={tint}
        />
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-center gap-2">
            <EventStatusBadge status={event.status} size="sm" />
            <span className="text-xs text-muted-foreground">
              <FormattedDate iso={event.startedAt} />
            </span>
          </div>

          <h3
            id={titleId}
            className="text-lg font-bold leading-snug text-foreground line-clamp-2 group-hover:text-brand-orange transition-colors duration-fast ease-out sm:text-xl"
          >
            <Link
              href={href}
              className="before:absolute before:inset-0 before:content-[''] before:rounded-2xl focus-visible:outline-none"
            >
              {event.title}
            </Link>
          </h3>

          {event.catchPhrase && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {event.catchPhrase}
            </p>
          )}

          <ul className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <li className="inline-flex items-center gap-1.5">
              <LocationIcon location={event.location} />
              <LocationText location={event.location} />
            </li>
            <li
              className="inline-flex items-center gap-1.5"
              aria-label={formatParticipantsLabel(accepted, limit)}
            >
              <Users aria-hidden="true" className="h-4 w-4" />
              <span>
                {accepted}
                {limit != null ? `/${limit}` : ""}人
              </span>
            </li>
          </ul>

          <div className="mt-auto flex items-center justify-between pt-2">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground truncate min-w-0">
              {groupIcon && (
                <Image
                  src={groupIcon}
                  alt=""
                  width={18}
                  height={18}
                  className="h-[18px] w-[18px] rounded object-cover"
                  unoptimized={groupIcon.startsWith("/")}
                />
              )}
              <span className="truncate">{event.group.name}</span>
            </p>

            {hosts && hosts.length > 0 && (
              <ul
                className="relative z-10 flex items-center"
                aria-label="主催者"
              >
                {hosts.slice(0, 3).map((h, idx) => (
                  <li
                    key={`${h.name}-${idx}`}
                    className={cn(
                      idx > 0 && "-ml-2",
                      "inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-brand-orange-soft text-xs font-semibold text-brand-orange ring-2 ring-surface shadow-soft-md",
                    )}
                    title={h.name}
                  >
                    {h.avatarUrl ? (
                      <Image
                        src={h.avatarUrl}
                        alt=""
                        width={28}
                        height={28}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span aria-hidden="true">{h.name.slice(0, 1)}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (variant === "grid") {
    return (
      <Card
        // ui/Card の rounded-lg + border + bg-surface + shadow-sm を受け継ぎつつ、
        // group hover (-translate-y-0.5) や article のセマンティクスを上書きする。
        // <div> → <article> 変更は実DOMで `role="article"` に置き換える形にすると
        // CSS の `[role]` 系セレクタとの相性が悪いため、ここでは div のまま role を
        // 付与する (NVDA/JAWS は `role="article"` を正しく region として扱う)。
        role="article"
        aria-labelledby={titleId}
        className={cn(
          "group relative flex h-full flex-col overflow-hidden",
          // Motion 規約: card hover は transform + shadow に絞り、duration-normal/ease-out
          "transition-[transform,box-shadow] duration-normal ease-out hover:shadow-md hover:-translate-y-0.5",
          className,
        )}
      >
        <Thumbnail
          src={event.thumbnailUrl}
          startedAt={event.startedAt}
          variant="grid"
        />
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-center gap-2">
            <EventStatusBadge status={event.status} size="sm" />
          </div>
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground truncate">
            {groupIcon && (
              <Image
                src={groupIcon}
                alt=""
                width={16}
                height={16}
                className="h-4 w-4 rounded object-cover"
                unoptimized={groupIcon.startsWith("/")}
              />
            )}
            <span className="truncate">{event.group.name}</span>
          </p>
          <h3
            id={titleId}
            className="text-sm font-bold text-foreground line-clamp-2 group-hover:text-brand-orange transition-colors duration-fast ease-out"
          >
            <Link
              href={href}
              className="before:absolute before:inset-0 before:content-[''] focus-visible:outline-none"
            >
              {event.title}
            </Link>
          </h3>
          {event.catchPhrase && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {event.catchPhrase}
            </p>
          )}
          <ul className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <li className="inline-flex items-center gap-1 min-w-0">
              <LocationIcon location={event.location} />
              <span className="truncate">
                <LocationText location={event.location} />
              </span>
            </li>
            <li
              className="inline-flex items-center gap-1"
              aria-label={formatParticipantsLabel(accepted, limit)}
            >
              <Users aria-hidden="true" className="h-3.5 w-3.5" />
              <span>
                {accepted}
                {limit != null ? `/${limit}` : ""}人
              </span>
            </li>
          </ul>
        </div>
      </Card>
    );
  }

  // ----- list variant -----
  return (
    <Card
      role="article"
      aria-labelledby={titleId}
      className={cn(
        "group relative flex flex-col gap-4 p-4 sm:flex-row",
        // Motion 規約: card hover は transform + shadow に絞り、duration-normal/ease-out
        "transition-[transform,box-shadow] duration-normal ease-out hover:shadow-md hover:-translate-y-0.5",
        className,
      )}
    >
      <Thumbnail
        src={event.thumbnailUrl}
        startedAt={event.startedAt}
        variant="list"
      />

      <div className="flex flex-1 flex-col gap-2 min-w-0">
        <div className="flex items-center gap-2">
          <EventStatusBadge status={event.status} size="sm" />
          <span className="text-xs text-muted">
            <FormattedDate iso={event.startedAt} />
          </span>
        </div>

        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground truncate">
          {groupIcon && (
            <Image
              src={groupIcon}
              alt=""
              width={16}
              height={16}
              className="h-4 w-4 rounded object-cover"
              unoptimized={groupIcon.startsWith("/")}
            />
          )}
          <span className="truncate">{event.group.name}</span>
        </p>

        <h3
          id={titleId}
          className="text-base font-bold text-foreground line-clamp-2 group-hover:text-brand-orange transition-colors duration-fast ease-out"
        >
          <Link
            href={href}
            className="before:absolute before:inset-0 before:content-[''] before:rounded-lg focus-visible:outline-none"
          >
            {event.title}
          </Link>
        </h3>

        {event.catchPhrase && (
          <p className="text-sm text-muted-foreground line-clamp-1">
            {event.catchPhrase}
          </p>
        )}

        <ul className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <li className="inline-flex items-center gap-1">
            <LocationIcon location={event.location} />
            <LocationText location={event.location} />
          </li>
          <li
            className="inline-flex items-center gap-1"
            aria-label={formatParticipantsLabel(accepted, limit)}
          >
            <Users aria-hidden="true" className="h-3.5 w-3.5" />
            <span>
              {accepted}
              {limit ? `/${limit}` : ""}人
            </span>
          </li>
        </ul>

        {event.hashtags && event.hashtags.length > 0 && (
          <ul className="relative z-10 flex flex-wrap gap-1.5">
            {event.hashtags.slice(0, 4).map((tag) => (
              <li key={tag}>
                <TagPill
                  label={tag}
                  size="sm"
                  href={`/tag/${encodeURIComponent(tag)}`}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

/* ============================================================
 * 内部ヘルパー
 * ============================================================ */

/**
 * Luma 風 大判 cover (16:9)。tint がある場合は cover image の上に
 * subtle gradient overlay を載せて主題色を反映する。サムネが無い場合は
 * brand-orange-soft + Calendar アイコンフォールバック。
 */
function LumaCover({
  src,
  startedAt,
  tint,
}: {
  src: string | undefined;
  startedAt: string;
  tint: string | null;
}) {
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-brand-orange-soft">
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-normal ease-out group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-brand-orange">
          <Calendar aria-hidden="true" className="h-12 w-12 opacity-40" />
        </div>
      )}
      {tint && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${tint}26 0%, transparent 60%)`,
          }}
        />
      )}
      <div className="absolute left-3 top-3">
        <DateBadge dateIso={startedAt} />
      </div>
    </div>
  );
}

function Thumbnail({
  src,
  startedAt,
  variant,
}: {
  src: string | undefined;
  startedAt: string;
  variant: Exclude<EventCardVariant, "luma">;
}) {
  const wrapperCls =
    variant === "list"
      ? "relative shrink-0 overflow-hidden rounded-md bg-brand-orange-soft sm:w-60 aspect-video"
      : "relative aspect-video w-full overflow-hidden bg-brand-orange-soft";

  return (
    <div className={wrapperCls}>
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes={variant === "list" ? "(max-width: 640px) 100vw, 240px" : "(max-width: 768px) 100vw, 33vw"}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-brand-orange">
          <Calendar aria-hidden="true" className="h-10 w-10 opacity-40" />
        </div>
      )}
      <div className="absolute left-2 top-2">
        <DateBadge dateIso={startedAt} />
      </div>
    </div>
  );
}

function DateBadge({ dateIso }: { dateIso: string }) {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return null;
  return (
    <time
      dateTime={dateIso}
      className="flex flex-col items-center rounded bg-surface/95 px-2 py-1 text-xs font-bold text-brand-orange shadow-sm"
    >
      <span className="text-[10px] leading-tight">{d.getMonth() + 1}月</span>
      <span className="text-base leading-tight">{d.getDate()}</span>
    </time>
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
