/**
 * Toast (Sonner) integration
 *
 * - `<Toaster />` を root layout の末尾に置いて使う
 * - 個別の発火は `toast()` (sonner からの再エクスポート) を使う
 */
"use client";

import * as React from "react";
import { Toaster as SonnerToaster, toast } from "sonner";

import { cn } from "@/lib/cn";

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

const Toaster = ({ className, ...props }: ToasterProps) => {
  return (
    <SonnerToaster
      className={cn("toaster group", className)}
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
