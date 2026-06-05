/**
 * LoadingState primitive
 *
 * - variant=spinner|skeleton|dots の 3 種
 *   - spinner : 短時間の処理中 (フォーム送信 / API 待ち <= 2s)
 *   - skeleton: ページレベル / リスト読み込み (> 1s)
 *   - dots    : 「タイピング中」「処理中」等の継続感
 *
 * 設計意図:
 *   - `role="status"` + `aria-live="polite"` で SR に状態通知
 *   - prefers-reduced-motion 対応はグローバルセーフネット (globals.css)
 *     ですべてのアニメ duration を 0 にして処理
 *
 * NOTE: hook / event handler を使わない pure な component なので
 *       Server Component で問題なく動く (`"use client"` 不要)。
 */

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

export type LoadingVariant = "spinner" | "skeleton" | "dots";

export interface LoadingStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** デフォルト: spinner */
  variant?: LoadingVariant;
  /** SR にアナウンスするラベル (デフォルト: "読み込み中") */
  label?: string;
  /** spinner / skeleton のサイズ ヒント */
  size?: "sm" | "md" | "lg";
  /** skeleton のときの行数 (デフォルト 3) */
  skeletonRows?: number;
}

export function LoadingState({
  variant = "spinner",
  label = "読み込み中",
  size = "md",
  skeletonRows = 3,
  className,
  ...props
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn("flex flex-col items-center gap-2", className)}
      {...props}
    >
      {variant === "spinner" && <Spinner size={size} />}
      {variant === "dots" && <Dots />}
      {variant === "skeleton" && (
        <div className="w-full space-y-2">
          {Array.from({ length: skeletonRows }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      )}
      <span className="sr-only">{label}</span>
    </div>
  );
}

function Spinner({ size }: { size: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-6 w-6";
  return (
    <span
      aria-hidden
      className={cn(
        dim,
        "animate-spin rounded-full border-2 border-border border-t-brand-orange",
      )}
    />
  );
}

function Dots() {
  return (
    <span
      aria-hidden
      className="inline-flex items-center gap-1"
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-orange" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-orange [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-orange [animation-delay:300ms]" />
    </span>
  );
}
