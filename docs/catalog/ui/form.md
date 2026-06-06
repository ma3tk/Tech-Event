---
status: stable
figma: TODO
storybook: libs/shared/ui/src/form.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P4, P6, P7]
---

# Form

> Design.md 準拠 | Storybook: [Form stories](../../../libs/shared/ui/src/form.stories.tsx) | 実装: `libs/shared/ui/src/form.tsx`

## 1. 目的
**React Hook Form + Zod** ラッパー。FormItem / FormLabel / FormControl / FormDescription / FormMessage の構造化スロットで、バリデーション / aria 属性 / フォーカス制御を統合する。

## 2. いつ使うか
- バリデーションが必要なすべてのフォーム
- 複雑なフィールド構成 (入れ子オブジェクト / 配列)
- Server Action と組み合わせる入力フォーム

## 3. いつ使わないか
- 検索 (`<form method="get">` で十分) → [SearchBox](../components/search-box.md)
- 単純な single-input → 直接 Input + Server Action でも OK

## 4. 構造

```
<Form {...form}>
  <FormField name="x" render={({ field }) => (
    <FormItem>
      <FormLabel>ラベル</FormLabel>
      <FormControl><Input {...field} /></FormControl>
      <FormDescription>補助説明 (任意)</FormDescription>
      <FormMessage />  ← エラー時に表示
    </FormItem>
  )} />
</Form>
```

## 5. バリアント

<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->
なし (構造化のみ)。


<!-- AUTO-GENERATED END: variants -->

## 6. アクセシビリティ

- 各 FormItem で `id` / `aria-describedby` / `aria-invalid` を自動付与
- FormMessage は `role="alert"` + `aria-live="polite"`
- フォーカス順は DOM 順序通り

## 7. 使用例

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form, FormField, FormItem, FormLabel,
  FormControl, FormDescription, FormMessage,
} from "@tech-event/shared-ui";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const form = useForm({ resolver: zodResolver(schema) });

<Form {...form}>
  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
    <FormField name="email" control={form.control} render={({ field }) => (
      <FormItem>
        <FormLabel>メールアドレス</FormLabel>
        <FormControl><Input type="email" autoComplete="email" {...field} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
    <FormField name="password" control={form.control} render={({ field }) => (
      <FormItem>
        <FormLabel>パスワード</FormLabel>
        <FormControl>
          <Input type="password" autoComplete="current-password" {...field} />
        </FormControl>
        <FormDescription>8 文字以上</FormDescription>
        <FormMessage />
      </FormItem>
    )} />
    <Button type="submit" disabled={form.formState.isSubmitting}>
      ログイン
    </Button>
  </form>
</Form>
```

## 8. アンチパターン

- ❌ Zod なしで型のみ → ✅ Zod で実行時検証
- ❌ サーバーバリデーション抜け → ✅ Server Action でも Zod 検証必須 (CLAUDE.md §6.3)
- ❌ FormMessage 抜け → ✅ エラー表示必須

## 9. 関連

- [Input](./input.md), [Textarea](./textarea.md), [Select](./select.md), [Checkbox](./checkbox.md), [RadioGroup](./radio-group.md)
- [blocks/forms.md](../blocks/forms.md)

## 10. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース、RHF + Zod 統合
