/**
 * グローバル error boundary (Next.js App Router convention)
 *
 * ルート以下のページ Server/Client いずれでスローされた例外をキャッチし、
 * カード形式のエラー画面 + リロードボタンを表示する。
 */
"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  React.useEffect(() => {
    // 開発時のみコンソールに詳細を出す
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[global error]", error);
    }
  }, [error]);

  return (
    <div
      className="mx-auto w-full max-w-xl px-4 py-12"
      data-testid="global-error"
    >
      <Card>
        <CardHeader>
          <CardTitle>エラーが発生しました</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            ページの読み込み中に問題が発生しました。再読み込みをお試しください。
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground">
              digest: <code>{error.digest}</code>
            </p>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="default"
              onClick={() => reset()}
              data-testid="global-error-reload"
            >
              もう一度試す
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                window.location.href = "/";
              }}
            >
              トップへ戻る
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
