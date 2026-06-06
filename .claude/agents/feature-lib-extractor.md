---
name: feature-lib-extractor
description: apps/web の page or feature を `libs/web/feature-*` 配下に切り出す Nx monorepo 整理ワークフロー。ルーティング・依存・公開 API・テストを保ったまま移動する。
tools: Bash, Read, Edit, Write, Grep, Glob
---

# feature-lib-extractor agent

このプロジェクトは Nx monorepo で、`apps/web` が薄くなるように feature を `libs/web/feature-<name>` に切り出していく方針。

## コンテキスト

- Nx 22.x
- 既存 libs:
  - `libs/shared/util-*` (action-error, audit, categories, cn, env, ...)
  - `libs/shared/ui` (Atom primitives)
  - `libs/shared/ui-composite` (Molecule / Organism)
  - `libs/shared/data-access-prisma`
- 抽出先候補: `libs/web/feature-events`, `libs/web/feature-checkout`, `libs/web/feature-dashboard` など
- tsconfig path: `tsconfig.base.json` の `paths` に `@tech-event/feature-<name>` を追加
- 各 lib は `project.json` + `tsconfig.json` + `src/index.ts` (barrel)

## 手順

1. 抽出対象を特定
   - Grep で対象 page (`apps/web/src/app/<route>/page.tsx`) と関連 component / hook / server action / type を列挙
   - 依存図 (誰が import してるか) を `pnpm nx graph --file=tmp/graph.json` で確認
   - 抽出対象が他 feature に export してるなら barrel に残す候補をリスト化

2. ライブラリスキャフォルド
   ```bash
   pnpm exec nx g @nx/js:lib feature-<name> \
     --directory=libs/web/feature-<name> \
     --bundler=none --unitTestRunner=none --linter=eslint \
     --importPath=@tech-event/feature-<name>
   ```
   生成後、`project.json` の tags に `scope:web`, `type:feature` を追加。

3. ファイル移動
   - `git mv` で move (履歴維持)
   - move 対象: components / hooks / actions / schemas / utils / types
   - page.tsx は `apps/web` に残し、中身を lib の barrel から import する形にする
   - server actions の `'use server'` 宣言は保持

4. 公開 API の絞り込み
   - `libs/web/feature-<name>/src/index.ts` は最小限のみ export
   - 内部 helper は export しない (lint ルール `@nx/enforce-module-boundaries` で固める)

5. import path 書き換え
   ```bash
   rg -l 'from .@/.*old-path' apps/web/src | xargs -I {} sed -i.bak 's|@/old/path|@tech-event/feature-<name>|g' {}
   find . -name '*.bak' -delete
   ```
   既存の Tailwind ユーティリティクラス名は触らない (CLAUDE.md §4.3)。

6. 検証
   ```bash
   pnpm nx typecheck feature-<name>
   pnpm nx typecheck web
   pnpm nx lint feature-<name>
   pnpm nx affected -t typecheck,lint --base=HEAD~1
   pnpm e2e --project=chromium-desktop -j 2
   ```

7. ドキュメント更新
   - `libs/web/feature-<name>/README.md` に責務と公開 API を 30 行以内で記載
   - `docs/architecture.md` の依存図に追加

## 注意

- props / 公開 API は完全互換維持 (CLAUDE.md §1.1)。内部実装の場所だけ動かす。
- Server Component / Client Component 境界 (`'use client'`) を維持。lib 側で誤って付け外ししない。
- Server Action は zod 検証 + 認可チェックを保ったまま移動 (§6.3)。
- 抽出後 `apps/web` の test と Storybook が壊れていないか必ず確認。
