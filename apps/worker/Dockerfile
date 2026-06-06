# syntax=docker/dockerfile:1.7
#
# tech-event BullMQ worker 用 Dockerfile (apps/worker)。
#
# 3 段構成:
#   1. deps    — pnpm workspace 全体の依存解決 (worker は prisma client lib に依存)
#   2. builder — Prisma generate + tsc コンパイル (dist/apps/worker)
#   3. runner  — node:slim で main.js を起動
#
# 想定 env (実行時):
#   REDIS_URL            redis://redis:6379
#   DATABASE_URL         postgresql://...
#   WORKER_CONCURRENCY   5 (default)
#   LOG_LEVEL            info
#
# 起動方法:
#   docker build -f apps/worker/Dockerfile -t tech-event-worker:latest .
#   docker run --env-file .env tech-event-worker:latest
#
# Node 22 LTS (Next.js 16 / Prisma 7 と同一)。

ARG NODE_VERSION=22

# ============================================================
# Stage 1: dependencies
# ============================================================
FROM node:${NODE_VERSION}-bookworm-slim AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/worker/package.json ./apps/worker/
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# ============================================================
# Stage 2: builder
# ============================================================
FROM node:${NODE_VERSION}-bookworm-slim AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apt-get update && apt-get install -y --no-install-recommends \
      openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma client を SQLite/Postgres 両対応で生成
RUN pnpm exec prisma generate

# Worker を tsc でビルド (dist/apps/worker)
RUN pnpm exec tsc -p apps/worker/tsconfig.build.json

# ============================================================
# Stage 3: runner
# ============================================================
FROM node:${NODE_VERSION}-bookworm-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
      openssl ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs worker

# Worker artifact (tsx runtime: paths を runtime に解決させるため source も持ち込む)
COPY --from=builder --chown=worker:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=worker:nodejs /app/apps/worker ./apps/worker
COPY --from=builder --chown=worker:nodejs /app/libs/shared/data-access-queue ./libs/shared/data-access-queue
COPY --from=builder --chown=worker:nodejs /app/libs/shared/data-access-prisma ./libs/shared/data-access-prisma
COPY --from=builder --chown=worker:nodejs /app/apps/web/src/generated ./apps/web/src/generated
COPY --from=builder --chown=worker:nodejs /app/prisma ./prisma
COPY --from=builder --chown=worker:nodejs /app/tsconfig.base.json ./tsconfig.base.json
COPY --from=builder --chown=worker:nodejs /app/package.json ./package.json

USER worker

# Worker は HTTP を待受けないので tcp HEALTHCHECK は不可。
# Redis に PING する軽量チェックをエントリポイントに組み込むのが望ましい。
# tsx で起動 (path alias を runtime resolve)
CMD ["npx", "tsx", "apps/worker/src/main.ts"]
