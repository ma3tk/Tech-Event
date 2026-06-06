/**
 * Worker から Prisma にアクセスするためのブリッジ。
 *
 * `@tech-event/shared-data-access-prisma` の `prisma` シングルトンをそのまま使う。
 * (DATABASE_URL の接頭で SQLite/PostgreSQL を自動切替)
 *
 * Next.js 環境では `globalThis` キャッシュが活き、worker プロセスでは初回のみ
 * 接続が確立される。SIGTERM 時に `prisma.$disconnect()` を呼んで closeする。
 */
import { prisma } from "@tech-event/shared-data-access-prisma";
import type { PrismaClient } from "@/generated/prisma";

export async function withWorkerPrisma<T>(
  fn: (client: PrismaClient) => Promise<T>,
): Promise<T> {
  return fn(prisma);
}

export async function disconnectPrisma(): Promise<void> {
  try {
    await prisma.$disconnect();
  } catch {
    // already disconnected
  }
}
