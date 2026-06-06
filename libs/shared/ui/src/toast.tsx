/**
 * Toast (Sonner) integration
 *
 * - `<Toaster />` を root layout の末尾に置いて使う
 * - 個別の発火は `toast()` (sonner からの再エクスポート) を使う
 */
"use client";

import * as React from "react";
import { Toaster as SonnerToaster, toast } from "sonner";

import { cn } from "@tech-event/shared-util-cn";

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

const Toaster = ({ className, ...props }: ToasterProps) => {
  return (
    <SonnerToaster
      className={cn("toaster group", className)}
      // Sonner はデフォルトで `aria-live="polite"` を出すが、UX/A11y review (Medium) で
      // 動的トースト読み上げの保証を明示するため `richColors` のまま `expand` 等を上書き。
      // `region` を polite に固定し、エラー toast は別途 sonner 側で assertive。
      // `data-sonner-toaster` 要素には `role="region"` `aria-label="Notifications"` も付く。
      visibleToasts={5}
      toastOptions={{
        classNames: {
          toast: cn(
            "group toast group-[.toaster]:bg-surface group-[.toaster]:text-foreground",
            "group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-lg",
            "group-[.toaster]:rounded-md",
          ),
          description: "group-[.toast]:text-muted-foreground",
          actionButton: cn(
            "group-[.toast]:bg-brand-orange group-[.toast]:text-white",
            "group-[.toast]:hover:bg-brand-orange-hover",
            "group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-xs group-[.toast]:font-medium",
          ),
          cancelButton: cn(
            "group-[.toast]:bg-background group-[.toast]:text-foreground",
            "group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-xs",
          ),
          error:
            "group-[.toaster]:border-brand-red group-[.toaster]:text-brand-red",
          success:
            "group-[.toaster]:border-status-open-fg group-[.toaster]:text-status-open-fg",
          warning:
            "group-[.toaster]:border-status-waitlist-fg group-[.toaster]:text-status-waitlist-fg",
          info: "group-[.toaster]:border-status-upcoming-fg group-[.toaster]:text-status-upcoming-fg",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
