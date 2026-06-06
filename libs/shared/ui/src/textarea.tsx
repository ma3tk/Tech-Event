/**
 * Textarea primitive (shadcn/ui パターン)
 */
"use client";

import * as React from "react";

import { cn } from "@tech-event/shared-util-cn";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || props["aria-invalid"]}
        className={cn(
          "flex min-h-[80px] w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground",
          "placeholder:text-muted-foreground",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-background",
          "resize-y",
          invalid
            ? "border-brand-red focus-visible:ring-brand-red"
            : "border-border-strong",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
