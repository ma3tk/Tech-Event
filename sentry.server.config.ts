/**
 * Sentry server-side configuration.
 *
 * Server / RSC / API route / Server Action で発生した未捕捉例外を Sentry に送る。
 *
 * - `SENTRY_DSN` が未設定なら init() を呼ばないので完全 no-op。
 * - `NODE_ENV !== "production"` でもデフォルトで無効化 (誤送信防止)。
 *   `SENTRY_ENABLE_DEV=1` を立てれば dev でも有効化できる。
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;
const enableInDev = process.env.SENTRY_ENABLE_DEV === "1";
const isProd = process.env.NODE_ENV === "production";

if (dsn && (isProd || enableInDev)) {
  Sentry.init({
    dsn,
    // 環境タグ
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    // ランタイム識別 (server 側)
    initialScope: {
      tags: { runtime: "node" },
    },
    // performance tracing は控えめに 10% (高トラフィック時 noise & 課金抑制)
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    // PII を勝手に送らない (IP, cookie 等を除外)
    sendDefaultPii: false,
    // ローカル / CI で誤って送らないためのガード
    enabled: true,
  });
}
