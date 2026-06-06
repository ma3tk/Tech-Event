---
description: dev.db を baseline から作り直して seed 投入 + E2E 用 test_user 投入 + counter recalc
---

# /seed

開発 DB を綺麗な状態に戻す。

## 実行内容

1. `pnpm db:reset` (= `nx run web:db:reset`)
   - prisma migrate reset (dev.db を作り直し)
   - prisma db seed
   - recalc-counters
   - init-fts (FTS5 仮想テーブル初期化)
2. `pnpm tsx apps/web/prisma/seed-test-user.ts`
   - E2E 固定ユーザー `test_user` を投入

実行後:
- 投入ユーザー数 / イベント数 / 参加登録数を要約
- 開発用ログイン URL を案内: `http://localhost:3000/api/auth/dev-login?nickname=test_user&next=/dashboard`

## 使い方

```
/seed
```

## 注意

- このコマンドは **dev.db を破壊する**。
- E2E 実行中 (CI でも local でも) は走らせない。global-setup の baseline と競合する。
- PG 環境では使えない (SQLite dev 専用)。PG migration が必要なら `pnpm db:migrate:pg` を使う。
