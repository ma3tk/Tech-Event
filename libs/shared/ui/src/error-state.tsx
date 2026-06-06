/**
 * ErrorState primitive
 *
 * - データ取得失敗 / 例外発生時のフォールバック UI
 * - `error` 単純表示 + 「再試行」ボタンの 2 要素構造
 *
 * 設計意図:
 *   - `role="alert"` でスクリーンリーダーに「エラーが発生した」を即座に通知
 *   - エラーメッセージは Error.message を文字列化したものを優先表示し、文字列も
 *     直接渡せるよう union 化
 *   - retry は任意 — 「画面リロードしか手段がない」エラーでは action 無しにする
 *
 * NOTE: pure な表示 component なので Server Component で使える (`"use client"` 不要)。
 *       `retry` を渡す場合は呼び出し側が Client Component であることが前提。
 */

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";
import { cn } from "@tech-event/shared-util-cn";

export interface ErrorStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** エラー本体 (Error / 文字列 / unknown) */
  error?: unknown;
  /** タイトルオーバーライド (デフォルト: "エラーが発生しました") */
  title?: React.ReactNode;
  /** リトライ関数 (省略時は再試行ボタン非表示) */
  retry?: () => void;
  /** 再試行ボタンのラベル (デフォルト: "再試行") */
  retryLabel?: React.ReactNode;
}

function extractMessage(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const m = (error as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "予期しないエラーが発生しました。";
}

export function ErrorState({
  error,
  title = "エラーが発生しました",
  retry,
  retryLabel = "再試行",
  className,
  ...props
}: ErrorStateProps) {
  const msg = extractMessage(error);
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "rounded-lg border border-status-cancelled-bg/30 bg-status-full-bg p-6 text-center",
        className,
      )}
      {...props}
    >
      <AlertTriangle
        aria-hidden
        className="mx-auto mb-2 h-8 w-8 text-status-full-fg"
      />
      <p className="text-base font-semibold text-status-full-fg">{title}</p>
      {msg && (
        <p className="mt-2 text-sm text-status-full-fg/80 break-words">{msg}</p>
      )}
      {retry && (
        <div className="mt-4 inline-flex">
          <Button variant="outline" onClick={retry}>
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
