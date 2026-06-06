/**
 * Badge primitive (shadcn/ui パターン)
 *
 * - status カラーはセマンティックトークン (`status-*`) を利用
 * - success = open, warning = waitlist, info = upcoming に揃える
 *
 * NOTE: hook / event handler を使わない pure な component なので
 *       Server Component で問題なく動く (`"use client"` 不要)。
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@tech-event/shared-util-cn";

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5",
    "text-xs font-semibold leading-none whitespace-nowrap",
    "transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-1",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-orange text-white",
        secondary:
          "border-transparent bg-background text-foreground",
        destructive:
          "border-transparent bg-brand-red text-white",
        outline: "border-border-strong bg-transparent text-foreground",
        success:
          "border-transparent bg-status-open-bg text-status-open-fg",
        warning:
          "border-transparent bg-status-waitlist-bg text-status-waitlist-fg",
        info: "border-transparent bg-status-upcoming-bg text-status-upcoming-fg",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
