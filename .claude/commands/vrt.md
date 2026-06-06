---
description: 全 Storybook story の VRT スクショ取得 (baseline 更新 + 検証)
---

# /vrt

CLAUDE.md §3.2 に従い、`toHaveScreenshot()` ベースの VRT を全 story に対して走らせる。

VRT は `Design.md` §11 (継続的検証: VRT / a11y / Lighthouse の常時回し) における根幹手段。差分を勝手に承認せず、Design.md §2 (ブランド規範: orange #c2410c / red #d23a3a / link #005d8c) との整合を確認してから baseline 更新すること。

## 実行内容

1. baseline 更新
   ```bash
   pnpm vrt:update
   ```
   (内部: `cd apps/web-e2e && VRT_UPDATE=1 playwright test src/vrt-stories.spec.ts --project=chromium-desktop --update-snapshots`)

2. 更新済 baseline で再走、差分が発生しないことを確認
   ```bash
   pnpm vrt
   ```
   (内部: `cd apps/web-e2e && playwright test src/vrt-stories.spec.ts --project=chromium-desktop`)

両方の結果 (PASS / FAIL / 更新スナップショット数) を要約して返す。

## 使い方

```
/vrt
```

## 失敗時

- スナップショット差分が大きい場合は `apps/web-e2e/test-results/` を参照
- DiceBear / picsum.photos 等のランダム要素は `mask:` で除外推奨
- 三テーマ分必要な場合は `storybook-curator` または `component-screenshot-taker` を併用

## 注意

- 既存 baseline png は commit 管理されている。**差分が出たら必ず diff を目視確認してから commit する** (§1.1 視覚回帰を勝手に書き換えない)
- mobile project のスナップショットは別 spec で管理されている (もしくは追加検討)
