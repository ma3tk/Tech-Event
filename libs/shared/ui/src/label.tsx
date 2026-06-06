/**
 * Label primitive (Radix UI ベース)
 *
 * - 関連付け対象の input が disabled のとき、Label にも peer 経由でスタイルを伝播
 * - 必須マーカーは `required` prop で表示 (アクセシブルラベルは付帯テキストで補う)
 *
 * NOTE: `LabelPrimitive.Root` 内部は Client component だが、`id` を `htmlFor` に
 *       繋ぐだけのため、本ラッパー自体に `"use client"` を付けなくても問題ない。
 */

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@tech-event/shared-util-cn";

const labelVariants = cva(
  [
    "inline-flex items-center gap-1 text-sm font-medium leading-none text-foreground",
    "peer-disabled:cursor-not-allowed peer-disabled:opacity-60",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
  required?: boolean;
}

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, size, required, children, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants({ size }), className)}
    {...props}
  >
    {children}
    {required && (
      <span aria-hidden="true" className="text-brand-red">
        *
      </span>
    )}
  </LabelPrimitive.Root>
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
