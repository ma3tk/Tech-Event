/**
 * `@tech-event/shared-data-access-prisma` — Prisma クライアントのシングルトン。
 *
 * `DATABASE_URL` の接頭で `@prisma/adapter-better-sqlite3` / `@prisma/adapter-pg`
 * を動的に選択する。Next.js dev HMR 対策として `globalThis` にキャッシュする。
 *
 * NOTE: 現状 generated client は `apps/web/src/generated/prisma` に出力される
 * (Prisma schema の `output` 指定により)。
 * `apps/web/tsconfig.json` の path mapping で `@/generated/prisma` を解決する。
 * 後続 PR で `output` を本 lib 直下に切り替える予定。
 */
export * from "./prisma";
