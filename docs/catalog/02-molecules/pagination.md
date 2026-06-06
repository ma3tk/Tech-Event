---
status: stable
figma: TODO
storybook: libs/shared/ui-composite/src/Pagination.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P2, P4, P9]
---

# Pagination

> Design.md 準拠 | Storybook: [Pagination stories](../../../libs/shared/ui-composite/src/Pagination.stories.tsx) | 実装: `libs/shared/ui-composite/src/Pagination.tsx`

## 1. 目的
**数値ベース** のページネーション (1 / 2 / 3 / … / N)。`computePages` ヘルパーで省略表示の計算を内包。`<Link>` ベースで JS なしでも動作。

## 2. いつ使うか
- 検索結果 / 一覧 / ランキングなど、1 ページに収まらない場合
- 件数表示と組合せる

## 3. いつ使わないか
- 無限スクロール (タイムライン) → 別 UI
- 1 ページのみ → 出さない
- ステップ UI → Stepper (将来)

## 4. 構造

```
[<前] [1] [2] [3] … [10] [次>]
```

## 5. アクセシビリティ

- `<nav aria-label="pagination">`
- 現在ページは `aria-current="page"`
- 前 / 次は `aria-label="前のページ"` / 「次のページ」
- disabled は `aria-disabled` + 視覚的に灰色

## 6. 使用例

```tsx
import { Pagination } from "@tech-event/shared-ui-composite";

<Pagination
  current={page}
  total={totalPages}
  buildHref={(p) => `/search?q=${q}&page=${p}`}
/>
```

## 7. アンチパターン

- ❌ JS イベントで遷移 → ✅ `<Link>` ベース
- ❌ disabled な `<a>` に aria-label → ✅ `<button disabled>` か `<span aria-hidden>` で
- ❌ 件数表示なし → ✅ 「全 N 件中 X-Y 件」を併記

## 8. 関連

- [Button](../01-atoms/button.md)
- [04-patterns/lists-and-tables.md](../04-patterns/lists-and-tables.md)

## 9. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース
