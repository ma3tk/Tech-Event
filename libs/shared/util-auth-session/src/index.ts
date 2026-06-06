/**
 * `@tech-event/shared-util-auth-session` — `te_session` Cookie 用の純粋プリミティブ。
 *
 * `next/headers` / Prisma / next-auth に依存しないため edge / node 双方で利用可能。
 * `SESSION_COOKIE_NAME`, `SESSION_MAX_AGE_SEC`, `getSessionSecret()` 等を提供。
 *
 * `@/lib/auth` (DB lookup / next-auth 連携) はこの純粋層の上に組まれる。
 */
export * from "./auth-session";
