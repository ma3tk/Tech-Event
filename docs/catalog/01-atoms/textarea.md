# Textarea

> Design.md 準拠 | Storybook: [Textarea stories](../../../libs/shared/ui/src/textarea.stories.tsx) | 実装: `libs/shared/ui/src/textarea.tsx`

## 1. 目的
複数行のテキスト入力。コメント / 短い説明文 / メモなどに使う。

## 2. いつ使うか
- コメント入力
- イベントの簡易説明 (3-5 行)
- フィードバック / お問い合わせ
- メモ欄

## 3. いつ使わないか
- 1 行 → [Input](./input.md)
- Markdown 編集 → [MarkdownEditor](../02-molecules/markdown-editor.md)
- 大量の構造化入力 → 別ページのフォームに

## 4. 構造

```
┌────────────────────────────────┐
│ プレースホルダ / 値             │
│                                │
│                                │
└────────────────────────────────┘
                          [字数 0/500]
```

## 5. バリアント

- `default`
- `error` (`aria-invalid` 連動で auto)

## 6. サイズ

- `rows` prop で高さ制御 (default 3-4)
- `min-h-[100px]` 推奨

## 7. 状態

default / hover / focus-visible / disabled / error。`<Input>` と同じパターン。

## 8. アクセシビリティ

- Label 必須
- `maxLength` 設定時は字数カウントに `aria-live="polite"`
- `aria-describedby` でカウント領域を参照

## 9. 使用例

```tsx
<div className="space-y-2">
  <Label htmlFor="comment">コメント</Label>
  <Textarea
    id="comment"
    rows={4}
    maxLength={500}
    placeholder="感想を共有"
  />
</div>
```

## 10. アンチパターン

- ❌ `resize-none` を強制 → ✅ ユーザーに任せる
- ❌ Label なし → ✅ 必須
- ❌ Markdown を Textarea で → ✅ MarkdownEditor

## 11. 関連

- [Input](./input.md)
- [MarkdownEditor](../02-molecules/markdown-editor.md)
- [Form](./form.md)

## 12. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース
