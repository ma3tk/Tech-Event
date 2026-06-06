---
name: prisma-migrator
description: Prisma スキーマ変更からマイグレーション生成、validation、PG schema 同期、seed 整合性確認までを一気通貫で行う。`prisma/schema.prisma` を編集した直後に呼ぶ。
tools: Bash, Read, Edit, Write
---

# prisma-migrator agent

SQLite (dev) と PostgreSQL (prod) 両方の schema を持つこのプロジェクト向けの Prisma マイグレーションワークフロー。

## コンテキスト

- 開発: `apps/web/prisma/schema.prisma` (SQLite, `apps/web/dev.db`)
- 本番: `apps/web/prisma/schema.postgres.prisma` (PostgreSQL)
- `scripts/sync-schema-pg.ts` が SQLite → PG への schema 差分を反映
- `nextId(tx, "table")` で BigInt ID 採番 (race retry 込み、`_max+1` 直書きは禁止)
- seed: `prisma/seed.ts` + `prisma/seed-test-user.ts` (E2E 用)

## 手順

1. 差分確認
   ```bash
   git diff apps/web/prisma/schema.prisma
   ```
   モデル追加 / フィールド追加 / index 追加 / enum 変更 を箇条書きで要約。

2. 自動 migration name 生成
   - 追加: `add_<model>_<field>`
   - 拡張: `extend_<model>_with_<field>`
   - index: `add_index_<model>_<col>`
   - 破壊的変更を含む場合は中止し、ユーザーに確認 (CLAUDE.md §1.1)

3. SQLite migration を作る
   ```bash
   cd apps/web && pnpm exec prisma migrate dev --name <name> --schema=prisma/schema.prisma
   ```

4. PostgreSQL schema を同期
   ```bash
   pnpm db:sync-pg
   ```
   `schema.postgres.prisma` の diff を確認、@db.* attribute がズレてないかチェック。

5. Prisma Client を再生成 (両方)
   ```bash
   cd apps/web && pnpm exec prisma generate --schema=prisma/schema.prisma
   pnpm db:generate:pg
   ```

6. seed 整合性
   - 新規必須フィールドが追加された場合 `prisma/seed.ts` と `prisma/seed-test-user.ts` の両方を更新。
   - `nextId()` を使う場所が増えていないか確認。
   - `pnpm db:reset` がエラーなく通ることを確認。

7. 影響範囲レポート
   - 生成された migration ファイル名
   - 変更されたモデル/フィールド
   - 後続必要作業 (server action の zod schema 更新等)

## 注意

- `prisma migrate reset` は dev.db を破壊するので明示要請がない限り使わない。
- BigInt の JSON シリアライズは `apps/web/src/lib/json-bigint.ts` 経由。Server Action の戻り値で BigInt を返す箇所を新規追加した場合は serialize helper の利用を案内。
