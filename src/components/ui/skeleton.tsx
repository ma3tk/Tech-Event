/**
 * Skeleton primitive (shadcn/ui パターン)
 *
 * - `animate-pulse` を利用したロード中プレースホルダ
 * - 利用側が `className` で h/w を上書きする想定
 *
 * NOTE: pure な component なので Server Component で問題なく動く (`"use client"` 不要)。
 */

import * as React from "react";

import { cn } from "@/lib/cn";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-border",
        className,
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

export { Skeleton };
