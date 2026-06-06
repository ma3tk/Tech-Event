/**
 * `@tech-event/shared-data-access-prisma` — Prisma クライアントのシングルトン + 型再 export。
 *
 * `DATABASE_URL` の接頭で `@prisma/adapter-better-sqlite3` / `@prisma/adapter-pg`
 * を動的に選択する。Next.js dev HMR 対策として `globalThis` にキャッシュする。
 *
 * generated client は本 lib 直下 (`src/generated/prisma`) に出力される。
 * これにより他 lib / app は `@tech-event/shared-data-access-prisma` 経由で
 * 型・クライアントを参照でき、`apps/web/src/generated` を跨ぐ循環依存が解消される。
 */
export * from "./prisma";
export * from "./prisma-client";
