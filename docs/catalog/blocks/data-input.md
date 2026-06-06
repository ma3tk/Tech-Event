---
status: stable
figma: TODO
storybook: libs/shared/ui/src/input.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P4, P6, P7]
---

# データ入力 (Data Input)

> Design.md §6 + CLAUDE.md §6.3 準拠

## 対象ペルソナ

- 主要: P1 山田美咲 (申込時の最小入力)、P4 鈴木大輔 (入力精度)、P6 小林一郎 (主催: イベント情報入力)
- 副次: P7 高橋真由美、P8 渡辺浩之

(根拠: [`Personas.md`](../../../Personas.md))

## 1. 選択肢の数で判断する

```
選択肢の数は?
  ├ 0-1 (ON/OFF)
  │   ├ 即時保存       → Switch
  │   └ Submit で確定 → Checkbox 1 個 (同意 等)
  ├ 2-4
  │   ├ 排他選択     → RadioGroup
  │   └ 複数選択     → Checkbox 複数
  └ 5+
      ├ 排他選択     → Select
      └ 複数選択     → MultiSelect (将来) or Checkbox 群
```

## 2. テキスト入力の選び方

```
文字数 / 構造は?
  ├ 1 行 (< 100 文字)   → Input
  ├ 数行 (100-1000)     → Textarea
  └ Markdown / 長文     → MarkdownEditor
```

## 3. 標準パターン

### 3.1 ラベル + 入力 (推奨)
```tsx
<div className="space-y-2">
  <Label htmlFor="title">
    タイトル <span aria-hidden className="text-destructive">*</span>
  </Label>
  <Input id="title" required autoComplete="off" />
  <p className="text-xs text-muted-foreground">100 文字以内</p>
</div>
```

### 3.2 排他選択 (RadioGroup)
```tsx
<fieldset className="space-y-2">
  <legend className="text-sm font-medium">公開範囲</legend>
  <RadioGroup defaultValue="public">
    <div className="flex items-center gap-2">
      <RadioGroupItem id="public" value="public" />
      <Label htmlFor="public">公開</Label>
    </div>
    {/* ... */}
  </RadioGroup>
</fieldset>
```

### 3.3 複数選択 (Checkbox)
```tsx
<fieldset className="space-y-2">
  <legend className="text-sm font-medium">受け取りたい通知</legend>
  {opts.map((o) => (
    <div key={o.key} className="flex items-center gap-2">
      <Checkbox id={o.key} name="notifications" value={o.key} />
      <Label htmlFor={o.key}>{o.label}</Label>
    </div>
  ))}
</fieldset>
```

### 3.4 5+ 個から選択 (Select)
```tsx
<Select defaultValue="newest">
  <SelectTrigger><SelectValue /></SelectTrigger>
  <SelectContent>
    {/* ... */}
  </SelectContent>
</Select>
```

### 3.5 即時切替 (Switch)
```tsx
<div className="flex items-center justify-between">
  <Label htmlFor="notify">メール通知</Label>
  <Switch id="notify" checked={enabled} onCheckedChange={handleToggle} />
</div>
```

## 4. アクセシビリティ

- Label と input の関連付け (`htmlFor` + `id`)
- グループは `<fieldset>` + `<legend>`
- 必須は `required` + 視覚的 `*` + `aria-required`
- エラーは `aria-invalid` + FormMessage
- autocomplete を必ず設定 (`email` / `current-password` / `new-password` / `name` 等)
- placeholder で説明しない (Label / Description で)

## 5. アンチパターン

- ❌ 2 選択肢で Select → ✅ RadioGroup
- ❌ 多選択で Switch 連発 → ✅ Checkbox
- ❌ `<input>` を直接 → ✅ `<Input>`
- ❌ Label 抜け → ✅ 必須
- ❌ autocomplete 設定なし → ✅ 必須

## 6. 関連

- [Input](../ui/input.md), [Textarea](../ui/textarea.md)
- [Select](../ui/select.md), [Checkbox](../ui/checkbox.md), [RadioGroup](../ui/radio-group.md), [Switch](../ui/switch.md)
- [Form](../ui/form.md)
- [blocks/forms.md](./forms.md)
