# States

> Design.md §6.3 + `docs/design-system.md` §8 の再展開

## 1. 全コンポーネントが取り得る状態

| 状態 | 説明 | スタイル ルール |
|---|---|---|
| default | 通常 | base styles |
| hover | カーソル乗せ | 1 段濃く or `-translate-y-0.5` |
| focus-visible | キーボードフォーカス | `outline 2px brand-orange offset 2px` |
| active | 押下中 | `active:bg-*-hover` |
| disabled | 操作不可 | `opacity-50 pointer-events-none` + `aria-disabled` |
| loading | 処理中 | spinner + `aria-busy="true"` |
| empty | 0 件 | [EmptyState](../01-atoms/empty-state.md) |
| error | エラー | [ErrorState](../01-atoms/error-state.md) or `aria-invalid` |
| selected (toggle) | 選択中 | `aria-pressed="true"` + 強調色 |

## 2. 詳細ルール

### 2.1 hover
- 背景を 1 段濃く (`hover:bg-brand-orange-soft` 等)
- リンクは `hover:underline`
- カードは `hover:-translate-y-0.5 hover:shadow-md`

### 2.2 focus-visible
- `outline: 2px solid var(--brand-orange)` + `outline-offset: 2px`
- `globals.css` で全体に適用済み
- `:focus` (非 visible) には装飾を出さない

### 2.3 active
- わずかに沈める (`active:translate-y-0`)
- 背景は hover と同色か少し濃く

### 2.4 disabled
- `opacity-50 cursor-not-allowed pointer-events-none`
- `aria-disabled="true"` を併記
- tooltip で理由を補うと UX が良い

### 2.5 loading
- spinner or `aria-busy="true"`
- ボタンの中身は **不可視化せず**、後ろにスピナーを足す (CLS 回避)

### 2.6 selected (toggle)
- `aria-pressed="true"` + `bg-brand-orange text-white border-brand-orange`

## 3. Storybook story

全コンポーネントが上記 9 状態を 100% カバー (Design.md §6.3 + §11.2 VRT)。

## 4. アンチパターン

- ❌ disabled で `aria-disabled` 抜け → ✅ 必須
- ❌ loading で中身非表示 (CLS) → ✅ サイズ保持 + スピナー
- ❌ focus-visible を `outline-none` で消す → ✅ Tailwind ring で再付与
- ❌ hover だけで状態を伝える → ✅ focus / active でも対応

## 5. 関連

- [Design.md §6.3](../../../Design.md)
- [docs/design-system.md §8](../../design-system.md)
- [accessibility.md](./accessibility.md)
- [motion.md](./motion.md)
