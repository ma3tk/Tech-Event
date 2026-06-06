---
description: Nx 依存グラフを生成して JSON で要約 (apps × libs の依存関係を可視化)
---

# /nx-graph

Nx の project graph を JSON 化して、依存関係を一覧化する。

## 実行内容

```bash
mkdir -p tmp
pnpm nx graph --file=tmp/graph.json
```

その後 jq でサマリ:

```bash
# プロジェクト一覧 (apps / libs)
jq '.graph.nodes | to_entries | map({name: .key, type: .value.type, root: .value.data.root, tags: .value.data.tags})' tmp/graph.json

# 依存関係 (source -> target)
jq '.graph.dependencies | to_entries | map({from: .key, to: [.value[].target]})' tmp/graph.json

# 各 lib の被依存数 (popular libs ランキング)
jq -r '[.graph.dependencies | to_entries[] | .value[].target] | group_by(.) | map({lib: .[0], count: length}) | sort_by(-.count) | .[]' tmp/graph.json
```

## 出力

- プロジェクト総数 (apps / libs それぞれ)
- 各 lib の被依存数ランキング Top 10
- 循環依存 (あれば) のリスト
- インタラクティブグラフを開きたい場合は `pnpm nx graph` でブラウザ起動

## 使い方

```
/nx-graph
```

## 注意

- `tmp/graph.json` は ignore 対象。コミット禁止。
- グラフが大きすぎる場合は `--focus=<project>` で絞れる。
