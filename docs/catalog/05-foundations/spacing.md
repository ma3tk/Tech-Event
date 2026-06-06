---
status: stable
figma: TODO
storybook: TODO (Storybook MDX: src/stories/design-system/spacing.mdx)
last_reviewed: 2026-06-06
personas: [P1, P2, P3, P4, P5, P6, P7, P8, P9]
---

# Spacing

> Design.md §5.2 の再展開 | 詳細: [`docs/design-system.md` §4](../../design-system.md)

## 1. スケール

| トークン | px | Tailwind |
|---|---|---|
| 1 | 4 | `p-1` / `gap-1` |
| 2 | 8 | `p-2` / `gap-2` |
| 3 | 12 | `p-3` / `gap-3` |
| 4 | 16 | `p-4` / `gap-4` |
| 6 | 24 | `p-6` / `gap-6` |
| 8 | 32 | `p-8` / `gap-8` |
| 12 | 48 | `p-12` |
| 16 | 64 | `p-16` |

任意値 (`p-[13px]`) 禁止。情報密度が必要なときは `py-2.5` (10px) までに留める (Design.md §5.2)。

## 2. 使い分け

| シーン | 推奨 |
|---|---|
| 行内アイコン + テキスト | `gap-2` (8px) |
| カードの中身 | `p-4` (16px) 〜 `p-6` (24px) |
| セクション間 | `mt-12 mb-8` (デスクトップ) / `mt-8 mb-6` (モバイル) |
| ボタングループ | `gap-2` |
| グリッド (3 列) | `gap-4` |
| フォームフィールド間 | `space-y-4` |
| 大セクション | `space-y-12` |

## 3. レイアウト原則

- コンテナ max-w **1280px** (`--container-max-w`)
- 主要ページは メイン + 右サイド (lg 以上、2:1 〜 3:1)
- モバイルは 1 カラム

## 4. アンチパターン

- ❌ `p-[13px]` 任意値 → ✅ スケール内
- ❌ `m-0.5` のような微小余白 → ✅ 統一感のため避ける
- ❌ セクション間が狭すぎ (`mt-2`) → ✅ `mt-8` 以上

## 5. 関連

- [Design.md §5.2](../../../Design.md)
- [docs/design-system.md §4](../../design-system.md)
- [responsive.md](./responsive.md)
