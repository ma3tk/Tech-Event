---
status: stable
figma: TODO
storybook: TODO (Storybook MDX: src/stories/design-system/typography.mdx)
last_reviewed: 2026-06-06
personas: [P1, P2, P3, P4, P5, P6, P7, P8, P9]
---

# Typography

> Design.md §4 の再展開 | 詳細: [`docs/design-system.md` §3](../../design-system.md)

## 1. フォント

- **Noto Sans JP** (Google Fonts, weight 400/500/600/700)
- 英数字も同フォントで統一
- システムフォントフォールバック: `Hiragino Kaku Gothic ProN`, `Yu Gothic UI`, `Meiryo`

## 2. スケール

| 要素 | size | weight | line-height | クラス |
|---|---|---|---|---|
| h1 | 28px | 700 | 1.3 | `text-[28px] font-bold` |
| h2 | 22px | 700 | 1.35 | `text-[22px] font-bold` |
| h3 | 18px | 700 | 1.4 | `text-lg font-bold` |
| h4 | 16px | 600 | 1.5 | `text-base font-semibold` |
| body | 14px | 400 | 1.7 | `text-sm` |
| meta | 12px | 400 / 500 | 1.5 | `text-xs` |

連動するサイズ: 12 / 14 / 16 / 18 / 22 / 28 / 36 / 48 px (xs..4xl)。

## 3. 5 原則 (Design.md §4)

1. **ライン長**: 本文は 1 行 65-90 文字 (`max-w-prose`)
2. **行間**: 本文 1.7、見出し 1.2
3. **ハイフネーション禁止** (日本語)
4. **改行位置**: `word-break: keep-all` + `overflow-wrap: anywhere`
5. **数字**: 3 桁区切り (`Intl.NumberFormat`、locale 動的)

## 4. 使い分け

| シーン | 使うクラス |
|---|---|
| ページ主見出し | h1 (`text-[28px] font-bold`) |
| セクション見出し | h2 |
| カード内タイトル | h3 |
| フォームラベル | h4 (実体は Label component) |
| 本文 | body (`text-sm`) |
| 補助メタ (日付 / 件数) | meta (`text-xs text-muted-foreground`) |

## 5. アンチパターン

- ❌ ウェイト 500 を多用 → ✅ Design.md §4 で 400/500/600/700 だが、500 は基本的に補助 (`docs/design-system.md` も 500 を非推奨)
- ❌ 任意のフォントサイズ (13px / 15px) → ✅ スケール内に揃える
- ❌ 半角と全角の数字混在 → ✅ 半角 + 3 桁区切り
- ❌ 行間 1.0 / 1.2 を本文に → ✅ 1.7 厳守

## 6. 関連

- [Design.md §4](../../../Design.md)
- [docs/design-system.md §3](../../design-system.md)
- [voice-and-tone.md](./voice-and-tone.md)
