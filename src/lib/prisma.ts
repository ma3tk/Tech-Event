/**
 * Prisma クライアントのシングルトン。
 *
 * Next.js の dev (HMR) では module が再評価されるたびに新しい接続が生成されるため、
 * `globalThis` にキャッシュして接続枯渇を防ぐ。
 *
 * Prisma 7 は Driver Adapter 必須。`DATABASE_URL` の接頭で動的に adapter を選ぶ:
 *   - `file:`              → SQLite (`@prisma/adapter-better-sqlite3`)
 *   - `postgres://`        → PostgreSQL (`@prisma/adapter-pg`)
 *   - `postgresql://`      → PostgreSQL (`@prisma/adapter-pg`)
 *
 * top-level await は禁止 (Next.js Edge / build 互換のため)。
 * adapter の構築は同期関数 `buildClient()` 内で行う。
 *
 * SQLite モードは **完全保持**。`DATABASE_URL` が `file:` で始まる限り従来挙動を維持する。
 */
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma";

type GlobalWithPrisma = typeof globalThis & {
  __prisma_v2?: PrismaClient;
};

/**
 * `DATABASE_URL` の値から DB の種類を判定する。
 * 既定 (未設定) は SQLite (`file:./dev.db`)。
 */
function detectDbKind(url: string): "sqlite" | "postgres" {
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    return "postgres";
  }
  // それ以外 (`file:`, `sqlite:` 形式や未設定 fallback) は SQLite と見なす。
  return "sqlite";
}

function resolveDbUrl(): string {
  // .env の DATABASE_URL は `file:./dev.db` (SQLite) または
  // `postgres://user:pass@host:port/db` (PostgreSQL) 形式
  return process.env.DATABASE_URL ?? "file:./dev.db";
}

function buildClient(): PrismaClient {
  const url = resolveDbUrl();
  const kind = detectDbKind(url);

  // 同期構築 (top-level await 禁止)。各 adapter のコンストラクタは同期。
  const adapter =
    kind === "postgres"
      ? new PrismaPg({ connectionString: url })
      : new PrismaBetterSqlite3({ url });

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
