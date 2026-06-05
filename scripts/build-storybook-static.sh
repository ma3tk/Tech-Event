#!/usr/bin/env bash
# ============================================================
# tech-event Storybook 静的エクスポート + ローカルプレビュー
#
# 用途:
#   - CI 前のローカル確認 (`pnpm build-storybook` + `serve storybook-static`)
#   - VRT のベースライン生成前に必ず一度走らせる
#   - storybook-static/index.html の <title> 確認 (タイトル不整合のスモークチェック)
#
# 使い方:
#   bash scripts/build-storybook-static.sh           # build のみ
#   bash scripts/build-storybook-static.sh preview   # build + http://localhost:6007 でプレビュー
#
# 仕組み:
#   1. `pnpm build-storybook` で `storybook-static/` を生成
#   2. `storybook-static/index.html` の <title> を grep して内容を表示
#   3. preview モード: `pnpm exec serve storybook-static -l 6007`
# ============================================================
set -euo pipefail

cd "$(dirname "$0")/.."

MODE="${1:-build}"

echo "[storybook] build を開始します..."
pnpm build-storybook

if [[ ! -f storybook-static/index.html ]]; then
  echo "[storybook] storybook-static/index.html が存在しません" >&2
  exit 1
fi

TITLE_LINE=$(grep -o '<title>[^<]*</title>' storybook-static/index.html || true)
echo "[storybook] index.html の <title>: ${TITLE_LINE:-(取得失敗)}"

if [[ -f storybook-static/index.json ]]; then
  ENTRIES=$(node -e "console.log(Object.keys(require('./storybook-static/index.json').entries).length)")
  STORIES=$(node -e "console.log(Object.values(require('./storybook-static/index.json').entries).filter(e => e.type === 'story').length)")
  DOCS=$(node -e "console.log(Object.values(require('./storybook-static/index.json').entries).filter(e => e.type === 'docs').length)")
  echo "[storybook] entries=${ENTRIES} stories=${STORIES} docs=${DOCS}"
fi

if [[ "$MODE" == "preview" ]]; then
  PORT="${PORT:-6007}"
  echo "[storybook] preview: http://localhost:${PORT}"
  pnpm exec serve storybook-static -l "${PORT}"
fi
