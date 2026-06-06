# Iconography

> Design.md §9 の再展開 | 詳細: [`docs/icons.md`](../../icons.md)

## 1. ライブラリ

**lucide-react** に一本化。任意 SVG 禁止 (Design.md §14)。新規導入は `docs/icons.md` の許可リストに追加してレビュー。

## 2. サイズ

| px | Tailwind | 用途 |
|---|---|---|
| 14 | `h-3.5 w-3.5` | meta / 補助 |
| 16 | `h-4 w-4` | 本文と並べる (default) |
| 20 | `h-5 w-5` | ボタン内 / ヘッダー |
| 24 | `h-6 w-6` | 主要アクション / EmptyState |

ストローク: **1.5** (`strokeWidth={1.5}`)。

## 3. 使い分け

- **機能的アイコン**: `aria-hidden="true"` + 近接テキストで読み上げ担保
- **装飾的アイコン**: `aria-hidden="true"` のみ
- **アイコンのみのボタン**: 親に `aria-label` 必須

## 4. カラー

`currentColor` 継承。明示する場合は `text-brand-orange` 等を **親** に付与。

## 5. アンチパターン

- ❌ Material Icons / FontAwesome → ✅ lucide-react のみ
- ❌ 任意 SVG → ✅ 必要なら docs/icons.md に追加してレビュー
- ❌ サイズ 13px / 17px → ✅ 14/16/20/24 のみ
- ❌ ストローク 1 / 2 → ✅ 1.5
- ❌ `aria-label` なしの icon-only Button → ✅ 必須

## 6. 関連

- [Design.md §9](../../../Design.md)
- [docs/icons.md](../../icons.md)
- [Button](../01-atoms/button.md) (icon-only Button)
