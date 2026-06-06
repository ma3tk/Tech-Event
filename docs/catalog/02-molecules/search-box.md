# SearchBox

> Design.md 準拠 | Storybook: [SearchBox stories](../../../libs/shared/ui-composite/src/SearchBox.stories.tsx) | 実装: `libs/shared/ui-composite/src/SearchBox.tsx`

## 1. 目的
**ヘッダー / ヒーロー用の検索ボックス**。`<form method="get">` で JS なしでも動作する。Input + 検索ボタン + 検索ヒント (オプション)。

## 2. いつ使うか
- ヘッダー (常設)
- ランディングのヒーロー
- 検索ページの上部

## 3. いつ使わないか
- フィルタ専用 → 専用 UI
- リアルタイム検索 (debounce + fetch) → 別 component

## 4. アクセシビリティ

- `<form>` 内に `<input type="search">`
- `aria-label="イベントを検索"`
- 検索ヒントは Popover で

## 5. 使用例

```tsx
import { SearchBox } from "@tech-event/shared-ui-composite";

<SearchBox action="/search" placeholder="イベント名 / キーワード" />
```

## 6. アンチパターン

- ❌ JS submit のみ → ✅ form action で JS なしでも動作
- ❌ Label なし → ✅ aria-label 必須

## 7. 関連

- [Input](../01-atoms/input.md)
- [04-patterns/forms.md](../04-patterns/forms.md)

## 8. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース
