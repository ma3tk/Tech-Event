/**
 * Input primitive (shadcn/ui パターン)
 *
 * - 単一の `<input>` ラッパー (バリデーション系の表示は `form.tsx` 側で扱う)
 * - `InputGroup` は前後にアイコンや addon を置くためのコンテナ
 *
 * 使い方:
 *   <InputGroup>
 *     <SearchIcon className="text-muted-foreground" />
 *     <Input placeholder="検索" />
 *   </InputGroup>
 */
"use client";

import * as React from "react";

import { cn } from "@tech-event/shared-util-cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** input にエラーリングを付ける (aria-invalid と連動) */
  invalid?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", invalid, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        aria-invalid={invalid || props["aria-invalid"]}
        data-invalid={invalid ? "" : undefined}
        className={cn(
          // ベース
          "flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground",
          "placeholder:text-muted-foreground",
          // インタラクション
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-background",
          // ファイル入力
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          // 通常/エラー
          invalid
            ? "border-brand-red focus-visible:ring-brand-red"
            : "border-border-strong",
          // InputGroup 内では border を消す
          "data-[in-group]:border-0 data-[in-group]:bg-transparent data-[in-group]:h-9 data-[in-group]:focus-visible:ring-0",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

/**
 * InputGroup: 前後にアイコン/テキストを並べたいときの行コンテナ。
 * 子の `<Input />` には `data-in-group` 属性を立てて、border をグループ側に集約する。
 */
export interface InputGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  invalid?: boolean;
  disabled?: boolean;
}

const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  ({ className, children, invalid, disabled, ...props }, ref) => {
    // 子の Input に data-in-group を立てる (深さ 1 階層のみで十分)
    const enhanced = React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) return child;
      const el = child as React.ReactElement<{ "data-in-group"?: string }>;
      if (el.type === Input) {
        return React.cloneElement(el, { "data-in-group": "" });
      }
      return child;
    });
    return (
      <div
        ref={ref}
        data-disabled={disabled ? "" : undefined}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-md border bg-surface px-3 py-2 text-sm",
          "focus-within:ring-2 focus-within:ring-brand-orange focus-within:ring-offset-1",
          "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
          invalid
            ? "border-brand-red focus-within:ring-brand-red"
            : "border-border-strong",
          disabled && "opacity-50 pointer-events-none bg-background",
          className,
        )}
        {...props}
      >
        {enhanced}
      </div>
    );
  },
);
InputGroup.displayName = "InputGroup";

export { Input, InputGroup };
