/**
 * 環境変数のスキーマ定義 (Zod) と型安全な参照。
 *
 * @t3-oss/env-nextjs を使って:
 *   - サーバ専用変数 (`server`)
 *   - クライアント露出変数 (`client`, `NEXT_PUBLIC_` プレフィックス必須)
 * を Zod スキーマで検証する。
 *
 * 利用方針:
 *   - 本番 (`NODE_ENV === 'production'`) では必須項目を厳格にチェック (起動時 fail-close)
 *   - dev / test では optional + fallback
 *   - 段階的に `process.env.XXX` → `env.XXX` へ置換。一度に全置換はしない。
 *
 * Tip:
 *   ```ts
 *   import { env } from "@/env";
 *   const url = env.NEXT_PUBLIC_BASE_URL;
 *   ```
 */
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const isProduction = process.env.NODE_ENV === "production";

/** production では required、それ以外は optional な string */
const requiredInProd = (msg: string) =>
  isProduction
    ? z.string().min(1, msg)
    : z.string().optional();

/** "0"/"1"/"true"/"false"/未設定 を受けて boolean に変換 */
const boolFlag = z
  .union([z.literal("0"), z.literal("1"), z.literal("true"), z.literal("false")])
  .optional()
  .transform((v) => v === "1" || v === "true");

export const env = createEnv({
  /* ============================================================
   * Server-only env (機微情報を含む。client bundle に含まれない)
   * ============================================================ */
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // --- Core ---
    DATABASE_URL: requiredInProd("DATABASE_URL is required in production"),
    AUTH_SECRET: requiredInProd("AUTH_SECRET is required in production"),
    CRON_SECRET: z.string().optional(),
    PUBLIC_API_KEY: z.string().optional(),

    // --- Feature flags (dev/test 用) ---
    ENABLE_DEV_LOGIN: boolFlag,
    ENABLE_TEST_ENDPOINTS: boolFlag,
    SLACK_WEBHOOK_ALLOW_TEST_HOSTS: boolFlag,
    LEGACY_SESSION_FALLBACK: boolFlag,
    MAGIC_LINK_LEGACY_GET: boolFlag,

    // --- SMTP / Mailer ---
    SMTP_URL: z.string().optional(),
    SMTP_FROM: z.string().optional(),
    MAIL_PROVIDER: z
      .enum(["smtp", "resend", "sendgrid", "console"])
      .optional(),
    RESEND_API_KEY: z.string().optional(),
    SENDGRID_API_KEY: z.string().optional(),
    E2E_MAIL_CAPTURE: boolFlag,

    // --- Observability (Sentry / Logging / Metrics) ---
    SENTRY_DSN: z.string().optional(),
    SENTRY_ORG: z.string().optional(),
    SENTRY_PROJECT: z.string().optional(),
    SENTRY_AUTH_TOKEN: z.string().optional(),
    SENTRY_ENVIRONMENT: z.string().optional(),
    SENTRY_TRACES_SAMPLE_RATE: z.string().optional(),
    SENTRY_ENABLE_DEV: boolFlag,
    SENTRY_DISABLE_WRAP: boolFlag,
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .optional(),
    METRICS_TOKEN: z.string().optional(),

    // --- Storage / S3 ---
    STORAGE_PROVIDER: z.enum(["local", "s3"]).optional().default("local"),
    S3_BUCKET: z.string().optional(),
    S3_REGION: z.string().optional().default("us-east-1"),
    S3_ACCESS_KEY: z.string().optional(),
    S3_SECRET_KEY: z.string().optional(),
    S3_ENDPOINT: z.string().optional(),

    // --- OAuth (3 providers) ---
    TWITTER_CLIENT_ID: z.string().optional(),
    TWITTER_CLIENT_SECRET: z.string().optional(),
    FACEBOOK_CLIENT_ID: z.string().optional(),
    FACEBOOK_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),

    // --- Stripe (server side) ---
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),

    // --- Misc ---
    BASE_URL: z.string().optional(),
    PUBLIC_API_ALLOW_TEST_BYPASS: boolFlag,
  },

  /* ============================================================
   * Client-exposed env (NEXT_PUBLIC_ prefix 必須)
   * ============================================================ */
  client: {
    NEXT_PUBLIC_BASE_URL: isProduction
      ? z.string().url("NEXT_PUBLIC_BASE_URL must be a valid URL in production")
      : z.string().optional(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: z.string().optional(),
    NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: z.string().optional(),
    NEXT_PUBLIC_SENTRY_ENABLE_DEV: z.string().optional(),
    NEXT_PUBLIC_SENTRY_REPLAY: z.string().optional(),
    NEXT_PUBLIC_CDN_HOSTNAME: z.string().optional(),
  },

  /* ============================================================
   * Runtime mapping (Next.js では Edge / Server で異なる解決が必要)
   * ============================================================ */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
    PUBLIC_API_KEY: process.env.PUBLIC_API_KEY,

    ENABLE_DEV_LOGIN: process.env.ENABLE_DEV_LOGIN,
    ENABLE_TEST_ENDPOINTS: process.env.ENABLE_TEST_ENDPOINTS,
    SLACK_WEBHOOK_ALLOW_TEST_HOSTS: process.env.SLACK_WEBHOOK_ALLOW_TEST_HOSTS,
    LEGACY_SESSION_FALLBACK: process.env.LEGACY_SESSION_FALLBACK,
    MAGIC_LINK_LEGACY_GET: process.env.MAGIC_LINK_LEGACY_GET,

    SMTP_URL: process.env.SMTP_URL,
    SMTP_FROM: process.env.SMTP_FROM,
    MAIL_PROVIDER: process.env.MAIL_PROVIDER,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    E2E_MAIL_CAPTURE: process.env.E2E_MAIL_CAPTURE,

    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT,
    SENTRY_TRACES_SAMPLE_RATE: process.env.SENTRY_TRACES_SAMPLE_RATE,
    SENTRY_ENABLE_DEV: process.env.SENTRY_ENABLE_DEV,
    SENTRY_DISABLE_WRAP: process.env.SENTRY_DISABLE_WRAP,
    LOG_LEVEL: process.env.LOG_LEVEL,
    METRICS_TOKEN: process.env.METRICS_TOKEN,

    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
    NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE:
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
    NEXT_PUBLIC_SENTRY_ENABLE_DEV: process.env.NEXT_PUBLIC_SENTRY_ENABLE_DEV,
    NEXT_PUBLIC_SENTRY_REPLAY: process.env.NEXT_PUBLIC_SENTRY_REPLAY,
    NEXT_PUBLIC_CDN_HOSTNAME: process.env.NEXT_PUBLIC_CDN_HOSTNAME,

    STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_REGION: process.env.S3_REGION,
    S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
    S3_SECRET_KEY: process.env.S3_SECRET_KEY,
    S3_ENDPOINT: process.env.S3_ENDPOINT,

    TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID,
    TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET,
    FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
    FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,

    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,

    BASE_URL: process.env.BASE_URL,
    PUBLIC_API_ALLOW_TEST_BYPASS: process.env.PUBLIC_API_ALLOW_TEST_BYPASS,

    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },

  /* ============================================================
   * 検証の skip 条件
   *   - test では検証を緩める (Vitest 等で env を mock しやすいように)
   *   - SKIP_ENV_VALIDATION=1 を渡せば build-time 強制 skip
   * ============================================================ */
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION ||
    process.env.NODE_ENV === "test",

  /**
   * 空文字を undefined と同等に扱う。.env で `SMTP_URL=` のような行を
   * optional として正しく扱うために必要。
   */
  emptyStringAsUndefined: true,
});
