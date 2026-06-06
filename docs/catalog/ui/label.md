---
status: stable
figma: TODO
storybook: libs/shared/ui/src/label.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P4, P6]
---

# Label

> Design.md 準拠 | Storybook: [Label stories](../../../libs/shared/ui/src/label.stories.tsx) | 実装: `libs/shared/ui/src/label.tsx`

## 1. 目的 (Purpose)
フォーム要素 (`<input>`, `<textarea>`, `<select>`, `<Checkbox>` 等) に **アクセシブルなラベル** を付与する。Radix UI の `react-label` ベースで、`htmlFor` の自動連携 / クリックで input にフォーカスを実現する。

## 2. いつ使うか
- フォームのすべての入力要素にラベル付与
- Checkbox / RadioGroup / Switch の説明テキスト

## 3. いつ使わないか
- インラインの装飾テキスト → `<span>` / `<p>`
- ボタンのテキスト → `<Button>` 内のテキストで十分
- セクション見出し → `h2-h4`

## 4. 構造

```
[ラベルテキスト] [* 必須印 (optional)]
```

## 5. バリアント

<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->
なし (単一スタイル)。スタイル軸は親で `className` で調整。


<!-- AUTO-GENERATED END: variants -->

## 6. サイズ

text-sm (14px) / font-medium がデフォルト。

## 7. 状態

| 状態 | 視覚 |
|---|---|
| default | `text-foreground` |
| disabled (input がdisabledの時) | `opacity-70 cursor-not-allowed` |
| required | 後ろに `<span aria-hidden>*</span>` を視覚的に付与 |

## 8. アクセシビリティ

- **`htmlFor={id}`** で input と関連付け (Radix が処理)
- input の `id` と一致させる
- 必須は `aria-required` 側で、視覚的には `*` のみ

## 9. 使用例

```tsx
import { Label } from "@tech-event/shared-ui";
import { Input } from "@tech-event/shared-ui";

<div className="space-y-2">
  <Label htmlFor="title">
    タイトル <span aria-hidden className="text-destructive">*</span>
  </Label>
  <Input id="title" required />
</div>
```

## 10. アンチパターン

- ❌ `<label>` を直接 → ✅ `<Label>` で統一
- ❌ `htmlFor` 抜け → ✅ 必須
- ❌ placeholder で代替 → ✅ Label 必須

## 11. 関連

- [Input](./input.md)
- [Form](./form.md)
- [blocks/forms.md](../blocks/forms.md)

## 12. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース
