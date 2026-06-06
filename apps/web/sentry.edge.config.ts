/**
 * Sentry edge runtime configuration.
 *
 * middleware や edge runtime route から発生した例外を Sentry に送る。
 *
 * 未設定 (SENTRY_DSN 無し) or production 以外では no-op。
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;
const enableInDev = process.env.SENTRY_ENABLE_DEV === "1";
const isProd = process.env.NODE_ENV === "production";

if (dsn && (isProd || enableInDev)) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    initialScope: {
      tags: { runtime: "edge" },
    },
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    sendDefaultPii: false,
  });
}
