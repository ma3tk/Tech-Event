/**
 * Prisma クライアントのシングルトン。
 *
 * Next.js の dev (HMR) では module が再評価されるたびに新しい接続が生成されるため、
 * `globalThis` にキャッシュして接続枯渇を防ぐ。
 *
 * Prisma 7 は Driver Adapter 必須。SQLite は `@prisma/adapter-better-sqlite3` を使う。
 */
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma";

type GlobalWithPrisma = typeof globalThis & {
  __prisma_v2?: PrismaClient;
};

function resolveSqliteUrl(): string {
  // .env の DATABASE_URL は `file:./dev.db` 形式 (Prisma 互換のパス記法)
  const raw = process.env.DATABASE_URL ?? "file:./dev.db";
  return raw;
}

function buildClient(): PrismaClient {
  const adapter = new PrismaBetterSqlite3({
    url: resolveSqliteUrl(),
  });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

const globalForPrisma = globalThis as GlobalWithPrisma;

// 開発時 (HMR) は通常 globalThis にキャッシュした client を再利用するが、
// dev.db を入れ替えた直後など旧 inode を掴んでいるケースがある。
// グローバルキャッシュキーをバージョン付き (`__prisma_v2`) にすることで、
// 旧キーで掴まれた接続をスキップして新しい file handle を取得する。
export const prisma: PrismaClient =
  globalForPrisma.__prisma_v2 ?? buildClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma_v2 = prisma;
}

export default prisma;
