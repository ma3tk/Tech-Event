import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@tech-event/shared-util-cn";
import { Badge } from "@tech-event/shared-ui";

export type TagPillProps = {
  /** タグ名 (先頭の `#` は付けない) */
  label: string;
  /** 指定するとリンクとして描画。未指定なら `<span>` */
  href?: string;
  variant?: "default" | "filter" | "selectable" | "outline";
  size?: "sm" | "md" | "lg";
  /** タグ付きイベント件数 (例: 「Python (123)」) */
  count?: number;
  /** selectable variant 用 */
  selected?: boolean;
  /** filter variant で `×` を表示するか */
  removable?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
};

const SIZE_CLASSES = {
  sm: "text-[11px] px-2 py-0.5 gap-1",
  md: "text-xs px-2.5 py-1 gap-1",
  lg: "text-sm px-3.5 py-1.5 gap-1.5",
} as const;

const BASE_CLASSES =
  "inline-flex items-center rounded-full font-medium transition-colors max-w-[200px]";

/**
 * タグ表示用 Pill コンポーネント。
 *
 * - `href` 指定時は `<Link>`、`variant="selectable"` 時は `<button aria-pressed>`、
 *   それ以外は `<Badge>` (= `<span>`) として描画。
 * - 先頭の `#` は装飾扱い (`aria-hidden`) で、SR には「タグ: {label}」が読み上げられる。
 *
 * 内部実装は `ui/Badge` の outline variant を流用し、TagPill 固有の variant
 * (selectable / filter / removable など) を className で重ねる構成。
 */
export default function TagPill({
  label,
  href,
  variant = "default",
  size = "md",
  count,
  selected = false,
  removable = false,
  disabled = false,
  onClick,
  onRemove,
  className,
}: TagPillProps) {
  const variantClasses = cn(
    variant === "default" &&
      "bg-brand-orange-soft text-foreground hover:bg-brand-orange/15 border-transparent",
    variant === "filter" &&
      "bg-brand-orange-soft text-foreground hover:bg-brand-orange/15 border-transparent",
    variant === "outline" &&
      "bg-transparent border border-border text-foreground hover:bg-brand-orange-soft",
    variant === "selectable" && !selected &&
      "bg-transparent border border-border text-foreground hover:bg-brand-orange-soft",
    variant === "selectable" && selected &&
      "bg-brand-orange text-white border border-brand-orange",
    // disabled: opacity を下げると `text-foreground` 50% で background との
    // コントラストが 3.2:1 まで落ちて axe color-contrast を踏むため、
    // 透過ではなく明示的に `text-muted-foreground` (#4b5563) を当てる。
    // bg-brand-orange-soft + text-muted-foreground = 6.5:1 (WCAG AAA) を確保。
    disabled && "cursor-not-allowed pointer-events-none text-muted-foreground",
  );

  const content = (
    <>
      <span aria-hidden="true" className="text-muted-foreground">
        #
      </span>
      <span className="truncate">{label}</span>
      {count != null && (
        <>
          {/* WCAG AA: text-muted (#6b7280) は bg-brand-orange-soft 上で 4.37:1 と
              わずかに 4.5:1 を切るため、より濃い text-muted-foreground (#4b5563, 6.5:1) を使用 */}
          <span aria-hidden="true" className="text-muted-foreground">
            ({new Intl.NumberFormat("ja-JP").format(count)})
          </span>
          <span className="sr-only">{count}件</span>
        </>
      )}
      {removable && (
        <button
          type="button"
          className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10"
          aria-label={`${label} タグを削除`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove?.();
          }}
        >
          <X aria-hidden="true" className="h-3 w-3" />
        </button>
      )}
    </>
  );

  const className_ = cn(BASE_CLASSES, SIZE_CLASSES[size], variantClasses, className);

  if (href && !disabled) {
    return (
      <Link
        href={href}
        aria-label={`タグ: ${label}`}
        className={className_}
        onClick={onClick}
      >
        {content}
      </Link>
    );
  }

  if (variant === "selectable") {
    return (
      <button
        type="button"
        aria-pressed={selected}
        disabled={disabled}
        onClick={onClick}
        className={className_}
      >
        {content}
      </button>
    );
  }

  // 非リンク・非ボタン時は ui/Badge を使って装飾レイヤを統一する。
  // (Badge は <span> ベースで、variant=outline の border をリセットして
  //  TagPill 用の border / bg / rounded を className で上書き)
  return (
    <Badge variant="outline" className={cn("border-0 px-0 py-0", className_)}>
      {content}
    </Badge>
  );
}
