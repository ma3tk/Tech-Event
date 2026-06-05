/**
 * EmptyState primitive
 *
 * - 検索結果 0 件 / データなし / フィルタ条件に一致なし などの空状態
 * - icon (Lucide コンポーネント) + title + description + action の構造
 * - 装飾を最小限にし、本文と CTA に視線が集まるよう中央寄せのカード型
 *
 * 設計意図:
 *   - `role="status"` を付与してスクリーンリーダーに「状態のお知らせ」として読ませる
 *   - 視覚的にはダッシュ枠 (border-dashed) で「ここに将来コンテンツが入ります」を示唆
 *   - action は任意 (検索リセット / 作成導線 など)
 */
import * as React from "react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Lucide のアイコンコンポーネントを渡す。`as` で renderProps 風に呼ぶ。 */
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  /** タイトル (必須) */
  title: React.ReactNode;
  /** 補足説明 (任意) */
  description?: React.ReactNode;
  /** CTA / リセットボタン等 (任意) */
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-lg border border-dashed border-border bg-surface p-10 text-center",
        className,
      )}
      {...props}
    >
      {Icon && (
        <Icon
          aria-hidden
          className="mx-auto mb-3 h-10 w-10 text-muted"
        />
      )}
      <p className="text-lg font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4 inline-flex">{action}</div>}
    </div>
  );
}
