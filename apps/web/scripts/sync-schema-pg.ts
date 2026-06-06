/**
 * scripts/sync-schema-pg.ts
 *
 * 用途:
 *   - 開発の正 (source of truth) である `prisma/schema.prisma` (SQLite) から
 *     PostgreSQL 用の `prisma/schema.postgres.prisma` を機械生成する。
 *
 * 変換ルール:
 *   1. datasource provider を sqlite → postgresql
 *      (URL は env("DATABASE_URL") のまま流用)
 *   2. generator output を ../src/generated/prisma → ../src/generated/prisma-pg
 *      (SQLite 版クライアントと共存させるため)
 *   3. 既知の String フィールドに PostgreSQL native types を付与
 *      - email      → @db.VarChar(320)
 *      - nickname   → @db.VarChar(64)
 *      - subdomain  → @db.VarChar(63)
 *      - slug       → @db.VarChar(63)
 *      - status     → @db.VarChar(32)
 *      - body / description / bio → @db.Text
 *
 * 注意:
 *   - enum の native enum 化は将来課題 (TODO コメントを冒頭に残す)。
 *   - 単純な正規表現置換で変換するため、schema.prisma の大きな構造変更があった場合は
 *     このスクリプトの方も追随する必要がある。
 *
 * 実行:
 *   pnpm tsx scripts/sync-schema-pg.ts
 *
 * 出力後の利用:
 *   pnpm prisma migrate dev --schema=prisma/schema.postgres.prisma
 */
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve("prisma/schema.prisma");
const DEST = path.resolve("prisma/schema.postgres.prisma");

const NATIVE_TYPE_MAP: Array<{ field: RegExp; native: string }> = [
  { field: /^(\s+)email(\s+String\??)(?!.*@db\.)/m, native: "@db.VarChar(320)" },
  { field: /^(\s+)nickname(\s+String\??)(?!.*@db\.)/m, native: "@db.VarChar(64)" },
  { field: /^(\s+)subdomain(\s+String\??)(?!.*@db\.)/m, native: "@db.VarChar(63)" },
  { field: /^(\s+)slug(\s+String\??)(?!.*@db\.)/m, native: "@db.VarChar(63)" },
  { field: /^(\s+)status(\s+String\??)(?!.*@db\.)/m, native: "@db.VarChar(32)" },
  { field: /^(\s+)body(\s+String\??)(?!.*@db\.)/m, native: "@db.Text" },
  { field: /^(\s+)description(\s+String\??)(?!.*@db\.)/m, native: "@db.Text" },
  { field: /^(\s+)bio(\s+String\??)(?!.*@db\.)/m, native: "@db.Text" },
];

function convert(source: string): string {
  let out = source;

  // 1. ヘッダーコメントを置換
  out = out.replace(
    /^\/\/.*?(?:\n\/\/.*)*\n+(?=generator)/,
    [
      "// **AUTO GENERATED — DO NOT EDIT DIRECTLY**",
      "// このファイルは scripts/sync-schema-pg.ts により",
      "// `prisma/schema.prisma` (SQLite 正本) から生成されます。",
      "// 手動編集すると次回の sync で上書きされます。",
      "//",
      "// TODO(future): status / eventFormat / recruitmentMethod 等を",
      "// PostgreSQL native enum に置き換える。現状は SQLite 版と完全互換にするため",
      "// 文字列リテラル + アプリ側 Zod 検証で揃えている。",
      "",
      "",
    ].join("\n"),
  );

  // 2. generator output を別ディレクトリに
  out = out.replace(
    /(generator client \{[\s\S]*?output\s*=\s*)"\.\.\/src\/generated\/prisma"/,
    '$1"../src/generated/prisma-pg"',
  );

  // 3. datasource provider を sqlite → postgresql
  //    Prisma 7 では schema 内の `url` は廃止され、prisma.config.ts 側で指定する。
  out = out.replace(
    /datasource db \{[\s\S]*?\}/,
    [
      "datasource db {",
      '  provider = "postgresql"',
      "  // URL は prisma.config.ts (DATABASE_URL) で渡す",
      "}",
    ].join("\n"),
  );

  // 4. 既知の String フィールドに native type を付与
  //    (各行ごと replace; 既に @db. が付いていればスキップ)
  const lines = out.split("\n");
  const result: string[] = [];
  for (const line of lines) {
    let updated = line;
    for (const { field, native } of NATIVE_TYPE_MAP) {
      // 1 行に閉じ込めて再 match
      const single = new RegExp(field.source);
      if (single.test(updated) && !updated.includes("@db.")) {
        // 既に他 attribute が付いていれば末尾に追加。コメント (//) があれば手前に挿入。
        const commentIdx = updated.indexOf("//");
        if (commentIdx >= 0) {
          const head = updated.slice(0, commentIdx).trimEnd();
          const tail = updated.slice(commentIdx);
          updated = `${head} ${native} ${tail}`;
        } else {
          updated = `${updated.trimEnd()} ${native}`;
        }
      }
    }
    result.push(updated);
  }
  return result.join("\n");
}

function main(): void {
  if (!fs.existsSync(SRC)) {
    console.error(`source not found: ${SRC}`);
    process.exit(1);
  }
  const src = fs.readFileSync(SRC, "utf8");
  const dest = convert(src);
  fs.writeFileSync(DEST, dest, "utf8");
  console.log(`[sync-schema-pg] wrote ${DEST} (${dest.length} bytes)`);
}

main();
