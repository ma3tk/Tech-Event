import type { NextConfig } from "next";

// NOTE: env validation は src/env.ts を import した最初の server module で発火する。
// next.config.ts に直接 import すると Next の transpile-config が
// node_modules の解決パスを壊すケースがあるため、ここでは import しない。
// 実体は `instrumentation.ts` 等の server entry が import 経由で検証する。

const nextConfig: NextConfig = {
  // Docker / 自前ホスティング向けに standalone build を出力する。
  // `output: "standalone"` を有効化すると `.next/standalone` に最小実行構成が出来る。
  // Vercel は standalone を使わないが、有効化していても無視されるだけなので問題ない。
  output: "standalone",

  // 画像最適化対象のリモートホストを許可。
  // - picsum.photos / fastly.picsum.photos / images.unsplash.com: シードイメージ + ストック画像
  // - i.pravatar.cc / api.dicebear.com: アバター fallback
  // - tech-event.local / 本番ドメイン用の placeholder: S3/MinIO 経由のカバー画像
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      // 自前 S3 / MinIO / R2 / B2 / CloudFront 経由 (本番ドメインに合わせて環境変数で差し替え)
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "**.backblazeb2.com" },
      { protocol: "https", hostname: "f000.backblazeb2.com" },
      { protocol: "https", hostname: "f001.backblazeb2.com" },
      { protocol: "https", hostname: "f002.backblazeb2.com" },
      { protocol: "https", hostname: "f003.backblazeb2.com" },
      { protocol: "https", hostname: "f004.backblazeb2.com" },
    ],
    // dev で large bundle を避けるため、最も使うサイズに絞る
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Prisma の generated client を server external として扱う (Next.js の bundle 対象外)。
  // standalone build や Vercel 環境で適切に node_modules を解決させるために必要。
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-better-sqlite3",
    "@prisma/adapter-pg",
    "better-sqlite3",
    "pg",
  ],
};

/**
 * Sentry でラップ。`SENTRY_DSN` 未設定 or `SENTRY_DISABLE_WRAP=1` のときは
 * `withSentryConfig` をロードせず素の config を返す (dev のビルド速度確保 + bundle 肥大化回避)。
 */
function maybeWrapWithSentry(config: NextConfig): NextConfig {
  if (!process.env.SENTRY_DSN || process.env.SENTRY_DISABLE_WRAP === "1") {
    return config;
  }
  try {
    // require() で同期ロード (Next.js の config は CJS で読まれる前提)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sentry = require("@sentry/nextjs") as typeof import("@sentry/nextjs");
    return sentry.withSentryConfig(config, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      // source map を Sentry にアップロード (auth token 未設定なら skip)
      sourcemaps: {
        disable: !process.env.SENTRY_AUTH_TOKEN,
      },
      // ad-blocker 回避用 tunnel route (任意)
      tunnelRoute: "/monitoring/sentry",
      // server / edge bundle 肥大化対策
      widenClientFileUpload: true,
      disableLogger: true,
    });
  } catch {
    // SDK ロード失敗時は通常 config を返す (起動を止めない)
    return config;
  }
}

export default maybeWrapWithSentry(nextConfig);
