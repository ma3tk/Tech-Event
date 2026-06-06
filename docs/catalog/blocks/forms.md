---
status: stable
figma: TODO
storybook: libs/shared/ui/src/form.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P4, P6, P7]
---

# フォーム (Forms)

> Design.md §6 + §10 準拠 | CLAUDE.md §6.3 準拠 (Zod 検証必須)

## 対象ペルソナ

- 主要: P1 山田美咲 (申込フォーム)、P4 鈴木大輔 (シニア・言葉の正確さ)、P6 小林一郎 (主催: イベント作成フォーム)
- 副次: P2 田中慎太郎、P7 高橋真由美、P8 渡辺浩之

(根拠: [`Personas.md`](../../../Personas.md))

## 1. 基本構成

[Form](../01-atoms/form.md) + [Input](../01-atoms/input.md) / [Textarea](../01-atoms/textarea.md) / [Select](../01-atoms/select.md) / [Checkbox](../01-atoms/checkbox.md) / [RadioGroup](../01-atoms/radio-group.md) を組み合わせて構築する。

設計の核:
- **React Hook Form + Zod** で型と実行時検証を統合
- **Server Action でも同じ Zod スキーマで再検証** (信頼境界の遵守)
- **`<label htmlFor>` 必須**、エラーは `FormMessage` で
- **送信中** は `aria-busy="true"` + 主要 Button を disabled

## 2. 標準パターン

### 2.1 ログインフォーム

```tsx
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

<Form {...form}>
  <form onSubmit={form.handleSubmit(action)} className="space-y-4">
    <FormField name="email" control={form.control} render={({ field }) => (
      <FormItem>
        <FormLabel>メールアドレス</FormLabel>
        <FormControl>
          <Input type="email" autoComplete="email" autoFocus {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )} />
    <FormField name="password" control={form.control} render={({ field }) => (
      <FormItem>
        <FormLabel>パスワード</FormLabel>
        <FormControl>
          <Input type="password" autoComplete="current-password" {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )} />
    <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
      ログイン
    </Button>
  </form>
</Form>
```

### 2.2 検索フォーム (JS なし)

```tsx
<form action="/search" method="get" className="flex gap-2">
  <Input
    name="q"
    type="search"
    placeholder="イベントを検索"
    aria-label="検索キーワード"
    defaultValue={searchParams.q}
  />
  <Button type="submit">検索</Button>
</form>
```

### 2.3 イベント作成フォーム (動的フィールド + 画像アップロード)

```tsx
const schema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(5000),
  startsAt: z.string().datetime(),
  capacity: z.number().int().min(1),
  tags: z.array(z.string()).max(5),
  isOnline: z.boolean(),
  venue: z.string().optional(),
});

<Form {...form}>
  <form onSubmit={form.handleSubmit(action)} className="space-y-6">
    <FormField name="title" ... />
    <FormField name="description" render={({ field }) => (
      <FormItem>
        <FormLabel>本文 (Markdown)</FormLabel>
        <FormControl>
          <MarkdownEditorDynamic {...field} maxLength={5000} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )} />
    {/* startsAt / capacity / tags / isOnline / venue */}
    <div className="flex justify-end gap-2">
      <Button variant="secondary" type="button">下書き保存</Button>
      <Button type="submit">公開する</Button>
    </div>
  </form>
</Form>
```

## 3. バリデーション

- Zod による型 + 実行時検証 (CLAUDE.md §6.3)
- エラー表示は `FormMessage` (`role="alert"` 自動)
- 送信中は `aria-busy="true"` + `<LoadingState>` or Button 内 spinner
- Server Action でも **必ず同じ Zod スキーマで再検証** (XSS / CSRF / 不正値防御)

## 4. アクセシビリティ

- 全 input に `<Label htmlFor>` を関連付け
- 必須は `required` + `aria-required="true"` + 視覚的にも `<span aria-hidden>*</span>`
- エラーは `aria-invalid="true"` + `aria-describedby` で input と紐付け (Form atom が自動)
- 初期フォーカスは最初の入力欄 (autoFocus)
- Submit 後のエラー時にも最初のエラーフィールドへフォーカス

## 5. レスポンシブ

- モバイル: フィールドはフルワイド `w-full`、`space-y-4`
- デスクトップ: 1 カラム or 2 カラム (`grid lg:grid-cols-2 gap-4`)
- Button group は `flex-col sm:flex-row` で縦/横切替

## 6. アンチパターン

- ❌ `<div className="error">` → ✅ `<FormMessage>` (semantic 確保)
- ❌ Server Action で Zod 再検証なし → ✅ クライアント + Server 両方
- ❌ placeholder で説明 → ✅ Label + FormDescription
- ❌ Submit ボタンを 2 つ並列 → ✅ Primary 1 つ + Cancel (Secondary)
- ❌ 送信中も再 Submit 可能 → ✅ disabled
- ❌ エラー表示が input から離れる → ✅ FormMessage は input 直下

## 7. 関連

- [Form](../01-atoms/form.md)
- [Input](../01-atoms/input.md), [Textarea](../01-atoms/textarea.md), [Select](../01-atoms/select.md)
- [Checkbox](../01-atoms/checkbox.md), [RadioGroup](../01-atoms/radio-group.md), [Switch](../01-atoms/switch.md)
- [MarkdownEditor](../02-molecules/markdown-editor.md)
- [SearchBox](../02-molecules/search-box.md)
- [04-patterns/data-input.md](./data-input.md)
