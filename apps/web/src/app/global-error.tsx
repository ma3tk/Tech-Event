/**
 * Next.js グローバルエラー境界 (root layout で throw された例外用)。
 *
 * - `src/app/error.tsx` は通常の RSC tree のエラーをキャッチするが、
 *   `app/layout.tsx` 自体が throw した場合はこの `global-error.tsx` が描画される。
 * - Sentry にエラーを送信 (`SENTRY_DSN` 未設定なら no-op)。
 * - `html` と `body` を自前でレンダリングする必要がある (root layout 失敗時のため)。
 */
"use client";

import * as React from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  React.useEffect(() => {
    // Sentry に動的 import で送信 (bundle 肥大化回避 + SDK 未設定時 no-op)
    void (async () => {
      try {
        const Sentry = await import("@sentry/nextjs");
        Sentry.captureException(error);
      } catch {
        // SDK 未インストール/未設定時は無視
      }
    })();
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[global-error]", error);
    }
  }, [error]);

  return (
    <html lang="ja">
      <body
        style={{
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', sans-serif",
          margin: 0,
          padding: "48px 16px",
          background: "#0a0a0a",
          color: "#fafafa",
          minHeight: "100vh",
        }}
        data-testid="global-error-root"
      >
        <div
          style={{
            maxWidth: 640,
            margin: "0 auto",
            background: "#171717",
            border: "1px solid #262626",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h1 style={{ fontSize: 20, marginTop: 0 }}>
            アプリケーションエラー
          </h1>
          <p style={{ fontSize: 14, color: "#a3a3a3" }}>
            ページの読み込み中に予期せぬ問題が発生しました。
            ページを再読み込みしてください。
          </p>
          {error.digest && (
            <p style={{ fontSize: 12, color: "#737373" }}>
              digest: <code>{error.digest}</code>
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            style={{
              marginTop: 16,
              padding: "8px 16px",
              background: "#fafafa",
              color: "#0a0a0a",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            トップへ戻る
          </button>
        </div>
      </body>
    </html>
  );
}
