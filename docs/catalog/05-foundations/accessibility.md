---
status: stable
figma: TODO
storybook: TODO (Storybook MDX: src/stories/design-system/accessibility.mdx)
last_reviewed: 2026-06-06
personas: [P1, P2, P3, P4, P5, P6, P7, P8, P9]
---

# Accessibility

> Design.md §1.3 / §11 + `docs/design-system.md` §11 の再展開

## 1. 方針

- **WCAG AA 必須**、可能なら AAA
- 色のみに依存する情報伝達は禁止 (テキスト併記)
- `:focus-visible` は常時可視
- `prefers-reduced-motion` で全アニメ無効化
- `prefers-contrast: more` で high-contrast 自動切替
- `axe-core` CI で critical / serious 違反 = 0 を保証

## 2. キーボード

- 全インタラクティブ要素に `Tab` で到達
- フォーカス順は論理的 (DOM 順)
- skip link (`#main` への jump) を最初に
- Escape / Enter / Space の慣用キーを守る
- `<a>` / `<button>` のセマンティクスを `<div>` で代替しない

## 3. ARIA

- `role="status"` / `role="alert"` を Loading / Error で
- `aria-live="polite"` / `assertive` でリアルタイム更新を伝える
- `aria-expanded` / `aria-pressed` / `aria-current` を状態と整合
- `aria-label` で icon-only の意味を補強
- `aria-describedby` で input とエラーを紐付け

## 4. 色とコントラスト

- すべてのテキスト × 背景は **4.5:1 (AA)** 以上
- 全 semantic トークンは AA 以上に調整済 (`docs/design-system.md` §2)
- 淡色背景の上では `text-muted-foreground` (7.6:1) を使う
- 半透明 `opacity-50` は contrast 違反になりうる → 明示的に `text-muted-foreground`

## 5. 画像と alt

- 装飾画像は `alt=""`
- 意味のある画像は内容を 1 文で
- サムネは装飾扱い (タイトルが隣接していれば)

## 6. タッチターゲット

- 最小 **36×36px** (`min-h-9 min-w-9`)
- モバイルでは **44×44px** 推奨 (`min-h-11 min-w-11`)

## 7. 見出し階層

- ページ内 `h1` は **1 つだけ**
- `h2 → h3` をスキップしない
- カード内タイトルは `h3` (ページ全体の `h2` セクション配下)

## 8. フォーカスリング

- `:focus-visible` で常時可視
- `outline 2px brand-orange offset 2px`
- `globals.css` で全体に適用済み
- 隠さない (`outline-none` 単独 NG)

## 9. axe-core 自動チェック

- CI で全 Storybook story + 主要 10 ページに走査
- critical / serious = 0 を保証
- 結果は `screenshots/components/_axe*.json`

## 10. アンチパターン

- ❌ `<div onClick>` でクリック → ✅ `<button>` or `<Link>`
- ❌ icon-only Button で aria-label なし → ✅ 必須
- ❌ 色だけでステータス → ✅ テキスト併記
- ❌ フォーカスリングを `outline-none` で消す → ✅ `:focus-visible` で再付与
- ❌ placeholder で説明 → ✅ Label
- ❌ ループ装飾アニメ → ✅ 禁止

## 11. 関連

- [Design.md §1.3](../../../Design.md)
- [Design.md §11](../../../Design.md)
- [docs/design-system.md §11](../../design-system.md)
- [colors.md](./colors.md)
- [motion.md](./motion.md)
- [states.md](./states.md)
