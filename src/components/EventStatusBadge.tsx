import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";

/**
 * UI 上のイベント状態。
 *
 * - 「募集中/満員/補欠/締切/開催中/終了/中止」は UI 派生値 (lib/event.ts などで導出)
 * - `draft`/`published` は DB の `Event.status` をそのまま渡されたときの互換用エイリアス
 *   (それぞれ「下書き」「開催前」として表示)
 *
 * 値の網羅性を担保するために `EVENT_STATUSES` (const tuple) も export している。
 *
 * 内部は `ui/Badge` をベースにしているが、status × variant × size の組み合わせが
 * Badge primitive の `variant` だけでは表現しきれないため、独自スタイルで上書き
 * する形を維持する (Badge の base クラスを継承するため `asChild` 相当の合成は
 * せず、直接 `<span>` を返す形を保持)。
 */
export const EVENT_STATUSES = [
  "upcoming",
  "open",
  "full",
  "waitlist",
  "closed",
  "cancelled",
  "ended",
  "ongoing",
  "draft",
  "published",
] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];

/** バッジ描画スタイル。 `subtle` (デフォルト) / `solid` / `outline` / `dot` */
export const EVENT_STATUS_BADGE_VARIANTS = [
  "subtle",
  "solid",
  "outline",
  "dot",
] as const;

export type EventStatusBadgeVariant =
  (typeof EVENT_STATUS_BADGE_VARIANTS)[number];

/** バッジサイズ */
export const EVENT_STATUS_BADGE_SIZES = ["sm", "md", "lg"] as const;

export type EventStatusBadgeSize = (typeof EVENT_STATUS_BADGE_SIZES)[number];

export type EventStatusBadgeProps = {
  /** 表示するイベント状態 */
  status: EventStatus;
  /** サイズ。デフォルトは `md` */
  size?: EventStatusBadgeSize;
  /** バッジの描画スタイル。デフォルトは `subtle` */
  variant?: EventStatusBadgeVariant;
  /** ラベル文字列の上書き (例: 「募集中 (残り3名)」) */
  label?: string;
  className?: string;
};

const STATUS_CONFIG: Record<
  EventStatus,
  { label: string; subtle: string; solid: string; outline: string; dot: string }
> = {
  upcoming: {
    label: "開催前",
    subtle: "bg-status-upcoming-bg text-status-upcoming-fg",
    solid: "bg-status-upcoming-fg text-white",
    outline: "border border-status-upcoming-fg text-status-upcoming-fg",
    dot: "bg-status-upcoming-fg",
  },
  open: {
    label: "募集中",
    subtle: "bg-status-open-bg text-status-open-fg",
    solid: "bg-status-open-fg text-white",
    outline: "border border-status-open-fg text-status-open-fg",
    dot: "bg-status-open-fg",
  },
  full: {
    label: "満員",
    subtle: "bg-status-full-bg text-status-full-fg",
    solid: "bg-status-full-fg text-white",
    outline: "border border-status-full-fg text-status-full-fg",
    dot: "bg-status-full-fg",
  },
  waitlist: {
    label: "補欠登録受付中",
    subtle: "bg-status-waitlist-bg text-status-waitlist-fg",
    solid: "bg-status-waitlist-fg text-white",
    outline: "border border-status-waitlist-fg text-status-waitlist-fg",
    dot: "bg-status-waitlist-fg",
  },
  closed: {
    label: "募集締切",
    subtle: "bg-status-closed-bg text-status-closed-fg",
    solid: "bg-status-closed-fg text-white",
    outline: "border border-status-closed-fg text-status-closed-fg",
    dot: "bg-status-closed-fg",
  },
  cancelled: {
    label: "中止",
    subtle: "bg-status-full-bg text-status-cancelled-bg",
    solid: "bg-status-cancelled-bg text-status-cancelled-fg",
    outline: "border border-status-cancelled-bg text-status-cancelled-bg",
    dot: "bg-status-cancelled-bg",
  },
  ended: {
    label: "終了",
    subtle: "bg-status-ended-bg text-status-ended-fg",
    solid: "bg-status-ended-fg text-white",
    outline: "border border-status-ended-fg text-status-ended-fg",
    dot: "bg-status-ended-fg",
  },
  ongoing: {
    label: "開催中",
    subtle: "bg-status-ongoing-bg text-status-ongoing-fg",
    solid: "bg-status-ongoing-fg text-white",
    outline: "border border-status-ongoing-fg text-status-ongoing-fg",
    dot: "bg-status-ongoing-fg",
  },
  // DB 互換: draft = 下書き (gray)、published = upcoming 相当
  draft: {
    label: "下書き",
    subtle: "bg-status-closed-bg text-status-closed-fg",
    solid: "bg-status-closed-fg text-white",
    outline: "border border-status-closed-fg text-status-closed-fg",
    dot: "bg-status-closed-fg",
  },
  published: {
    label: "開催前",
    subtle: "bg-status-upcoming-bg text-status-upcoming-fg",
    solid: "bg-status-upcoming-fg text-white",
    outline: "border border-status-upcoming-fg text-status-upcoming-fg",
    dot: "bg-status-upcoming-fg",
  },
};

const SIZE_CLASSES: Record<EventStatusBadgeSize, string> = {
  sm: "text-[10px] px-1.5 py-0.5 gap-1",
  md: "text-xs px-2 py-0.5 gap-1",
  lg: "text-sm px-3 py-1 gap-1.5",
};

/**
 * `status` 値からデフォルト日本語ラベルを取得するユーティリティ。
 *
 * `dot` variant の aria-label 生成や、外部呼び出し側で「色なし」の
 * テキスト表現が必要な場面 (スクリーンリーダー出力 / 通知メッセージ等) で利用できる。
 */
export function statusLabel(status: EventStatus): string {
  return STATUS_CONFIG[status].label;
}

/**
 * イベントの募集/開催ステータスを表すバッジ。
 *
 * - 色のみに依存させない: ラベルテキストを必ず表示し、`dot` variant では aria-label で補完
 * - `subtle` はデフォルト推奨 (背景薄色 + 濃文字)、`solid` は強調表示
 * - すべてのカラーペアは `globals.css` で WCAG AA (4.5:1) 以上を保証している
 *
 * 内部実装は `ui/Badge` を `asChild` パターンでベースに、status カラーと
 * subtle/solid/outline の表現を独自スタイルで重ねる構成。
 */
export default function EventStatusBadge({
  status,
  size = "md",
  variant = "subtle",
  label,
  className,
}: EventStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  // dot variant では visual に色しか出ないので、SR 向けに必ず日本語ラベルへ
  // フォールバックさせる (色情報が伝わらない利用者への配慮)。
  // 通常 variant でも `label` 未指定時は config.label に落とすため共通化する。
  const displayLabel = label ?? statusLabel(status);

  if (variant === "dot") {
    return (
      <span
        role="status"
        aria-label={displayLabel}
        className={cn(
          "inline-block h-2 w-2 rounded-full",
          config.dot,
          className,
        )}
      />
    );
  }

  // ui/Badge をベースに status カラーで上書きする。
  // - Badge は既定で rounded-full + px-2.5 だが、本コンポーネントは rounded (角丸小) と
  //   独自サイズトークンを使うため、px-* / rounded-* / border / bg / text を className で
  //   ねじ伏せる必要がある (tailwind-merge が後勝ちを保証)。
  return (
    <Badge
      role="status"
      variant="outline"
      className={cn(
        "rounded font-semibold whitespace-nowrap border-0 px-0 py-0",
        SIZE_CLASSES[size],
        config[variant],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full",
          variant === "solid" ? "bg-white/80" : config.dot,
        )}
      />
      {displayLabel}
    </Badge>
  );
}
