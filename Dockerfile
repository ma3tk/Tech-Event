# syntax=docker/dockerfile:1.7
#
# tech-event 本番用 Dockerfile (Vercel 以外の self-host 向け)。
#
# 3 段構成:
#   1. deps    — pnpm で production deps を解決
#   2. builder — Prisma generate → Next.js build (standalone output)
#   3. runner  — 非 root の最小ランタイム
#
# 期待される env:
#   DATABASE_URL                  PostgreSQL (推奨) or SQLite 接続文字列
#   AUTH_SECRET                   必須 (production fail-close)
#   NEXT_PUBLIC_BASE_URL          必須 (production)
#   その他 (SMTP / OAuth / Stripe / S3 等) は docs/deployment.md 参照
#
# 起動方法:
#   docker build -t tech-event:latest .
#   docker run -p 3000:3000 --env-file .env.production tech-event:latest
#
# Node 22 LTS を採用 (Next.js 16 / Prisma 7 互換)。

ARG NODE_VERSION=22

# ============================================================
# Stage 1: dependencies
# ============================================================
FROM node:${NODE_VERSION}-bookworm-slim AS deps
WORKDIR /app

# pnpm を corepack 経由で有効化 (lockfile と整合)
RUN corepack enable && corepack prepare pnpm@latest --activate

# better-sqlite3 / sharp 等のネイティブビルドに必要
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 \
      make \
      g++ \
      openssl \
      ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 依存解決 (lockfile を強制利用)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# ============================================================
# Stage 2: builder
# ============================================================
FROM node:${NODE_VERSION}-bookworm-slim AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

RUN apt-get update && apt-get install -y --no-install-recommends \
      openssl \
      ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# build 中は env validation を skip (実 env はコンテナ実行時に注入される)
ENV SKIP_ENV_VALIDATION=1
ENV NEXT_TELEMETRY_DISABLED=1

# Prisma client を SQLite/Postgres 両対応で生成
# (schema.prisma は SQLite を datasource にしているが、Driver Adapter 切替で PG も使える)
RUN pnpm exec prisma generate

# Next.js build (standalone output が .next/standalone に作られる)
RUN pnpm build

# ============================================================
# Stage 3: runner (production)
# ============================================================
FROM node:${NODE_VERSION}-bookworm-slim AS runner
WORKDIR /app

# 実行に必要な system libs のみ
RUN apt-get update && apt-get install -y --no-install-recommends \
      openssl \
      ca-certificates \
      curl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 非 root ユーザー
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

# Next.js standalone artifact
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma の schema と migrations を持ち込む (起動時 migrate deploy 用)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# generated Prisma client (server-external なので standalone に含まれない可能性がある)
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated
# Prisma client + driver adapter + native binding
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg ./node_modules/pg

USER nextjs

EXPOSE 3000

# health check (5xx / down を即検知)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# standalone server (Next.js が生成する server.js を起動)
CMD ["node", "server.js"]
