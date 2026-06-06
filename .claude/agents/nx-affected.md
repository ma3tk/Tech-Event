---
name: nx-affected
description: Nx affected targets を実行して PR の影響範囲のみ test / lint / build / typecheck を回す。CI 時間を最小化したい時、もしくは PR 直前のセルフチェック時に呼ぶ。
tools: Bash, Read
---

# nx-affected agent

PR ブランチでの変更影響範囲を `nx affected` で特定し、関連プロジェクトのみ test / lint / build / typecheck を実行する。

## 手順

1. 影響範囲の特定 (base = origin/main)
   ```bash
   pnpm nx show projects --affected --base=origin/main --head=HEAD
   ```
   結果を箇条書きで保存。

2. 並列で affected ターゲットを実行
   ```bash
   pnpm nx affected -t typecheck --base=origin/main --parallel=4
   pnpm nx affected -t lint      --base=origin/main --parallel=4
   pnpm nx affected -t test      --base=origin/main --parallel=4
   pnpm nx affected -t build     --base=origin/main --parallel=2
   ```
   `apps/web` が affected の場合は追加で `pnpm nx run web:tokens:validate` を回す。

3. 失敗時は失敗ターゲットだけを抽出し、ログから一次原因を 3 行以内で要約。
4. 全て成功なら影響プロジェクト一覧と所要時間サマリを返す。

## 注意

- `nx affected` の base が origin/main で取れない場合は `git fetch origin main` を先に実行。
- Storybook の build (重い) は `affected -t build-storybook` で明示指定された時のみ実行。
- E2E (`web-e2e`) が affected の場合、`/test` コマンド経由で 2 プロジェクト分回す方が早い。
- 削除・縮小は禁止 (CLAUDE.md §1.1)。affected 集合が空でもエラーにせず「変更なし」と返す。
