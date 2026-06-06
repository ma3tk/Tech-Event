/**
 * Button primitive (shadcn/ui パターン)
 *
 * - Radix UI `Slot` を使った `asChild` パターン対応 (Link/anchor などをスタイルしたいとき)
 * - CVA で variant / size を管理
 * - フォーカスリングはグローバルの `:focus-visible` と整合させつつ、明示的に
 *   `focus-visible:ring-*` を追加して shadcn と同じインタラクションを得る
 */
"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@tech-event/shared-util-cn";

export const buttonVariants = cva(
  // ベース: 中央寄せ + フォント + フォーカスリング + disabled スタイル
  //
  // Motion 規約 (docs/motion.md):
  //   - button hover/focus は `transition-colors duration-fast ease-out` を使う
  //   - duration-fast (150ms) は「反応の良さ」を優先する小さい変化向け
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-md font-medium",
    "transition-colors duration-fast ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-brand-orange text-white hover:bg-brand-orange-hover active:bg-brand-orange-hover",
        secondary:
          "bg-surface text-foreground border border-border hover:bg-background dark:hover:bg-background",
        destructive:
          "bg-brand-red text-white hover:bg-brand-red-hover active:bg-brand-red-hover",
        outline:
          "border border-border-strong bg-transparent text-foreground hover:bg-background",
        ghost:
          "bg-transparent text-foreground hover:bg-background",
        link:
          "bg-transparent text-link underline-offset-4 hover:underline hover:text-link-hover px-0 py-0 h-auto",
      },
      size: {
        xs: "h-7 px-2 text-xs",
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-6 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
