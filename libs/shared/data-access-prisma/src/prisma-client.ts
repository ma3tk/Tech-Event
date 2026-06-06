/**
 * generated Prisma client の TS 経由再 export。
 *
 * Prisma の `output` ディレクトリ (`src/generated/prisma`) は `.gitignore` 対象で
 * `.js` + `.d.ts` のみが置かれる (TS ソースなし)。
 * Nx の `enforce-module-boundaries` rule は import 解決時に `.ts` ファイルを
 * 期待するため、本 TS シム経由で再 export する。
 */
export * from "./generated/prisma";
