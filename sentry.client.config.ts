/**
 * Sentry client-side configuration.
 *
 * ブラウザ上で発生した未捕捉例外 (React error boundary を含む) を Sentry に送る。
 *
 * - `NEXT_PUBLIC_SENTRY_DSN` が必要 (client bundle に埋め込まれる)。
 * - production でない場合は no-op (NEXT_PUBLIC_SENTRY_ENABLE_DEV=1 で強制有効化)。
 * - Session Replay は重いのでデフォルト無効。`NEXT_PUBLIC_SENTRY_REPLAY=1` で有効化。
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const enableInDev = process.env.NEXT_PUBLIC_SENTRY_ENABLE_DEV === "1";
const isProd = process.env.NODE_ENV === "production";

if (dsn && (isProd || enableInDev)) {
  Sentry.init({
    dsn,
    environment:
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    initialScope: {
      tags: { runtime: "browser" },
    },
    tracesSampleRate: Number(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1,
    ),
    // Session Replay (privacy: text 全マスク + media block)
    replaysSessionSampleRate:
      process.env.NEXT_PUBLIC_SENTRY_REPLAY === "1" ? 0.1 : 0,
    replaysOnErrorSampleRate:
      process.env.NEXT_PUBLIC_SENTRY_REPLAY === "1" ? 1.0 : 0,
    sendDefaultPii: false,
  });
}
