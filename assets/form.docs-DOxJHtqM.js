import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-CD-xvnSv.js";import{t as d}from"./mdx-react-shim-BWVm_lKV.js";import{WithValidation as f,n as p,t as m}from"./form.stories-ChhZBfXt.js";function h(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...n(),...e.components};return(0,_.jsxs)(_.Fragment,{children:[(0,_.jsx)(l,{of:m}),`
`,(0,_.jsx)(i,{}),`
`,(0,_.jsxs)(u,{children:[(0,_.jsx)(t.strong,{children:`React Hook Form + Zod`}),` ラッパー。FormItem / FormLabel / FormControl / FormDescription / FormMessage の構造化スロットで、バリデーション / aria 属性 / フォーカス制御を統合する。`]}),`
`,(0,_.jsxs)(t.blockquote,{children:[`
`,(0,_.jsxs)(t.p,{children:[`一次資料: `,(0,_.jsx)(t.code,{children:`docs/catalog/ui/form.md`}),`。
ここは `,(0,_.jsx)(t.strong,{children:`言語化テキスト + 実物 Live Preview`}),` を 1 ページに統合した shadcn/ui スタイルの docs。
元の `,(0,_.jsx)(t.code,{children:`.md`}),` ファイルが source of truth、本 MDX は同内容を Storybook 上でレンダリングする視覚層。`]}),`
`]}),`
`,(0,_.jsx)(t.h2,{id:`ライブプレビュー-canvas`,children:`ライブプレビュー (Canvas)`}),`
`,(0,_.jsx)(s,{of:f}),`
`,(0,_.jsx)(t.h2,{id:`primary`,children:`Primary`}),`
`,(0,_.jsx)(r,{}),`
`,(0,_.jsx)(t.h2,{id:`props-api`,children:`Props (API)`}),`
`,(0,_.jsx)(a,{}),`
`,(0,_.jsx)(t.hr,{}),`
`,(0,_.jsx)(t.h2,{id:`1-目的`,children:`1. 目的`}),`
`,(0,_.jsxs)(t.p,{children:[(0,_.jsx)(t.strong,{children:`React Hook Form + Zod`}),` ラッパー。FormItem / FormLabel / FormControl / FormDescription / FormMessage の構造化スロットで、バリデーション / aria 属性 / フォーカス制御を統合する。`]}),`
`,(0,_.jsx)(t.h2,{id:`2-いつ使うか`,children:`2. いつ使うか`}),`
`,(0,_.jsxs)(t.ul,{children:[`
`,(0,_.jsx)(t.li,{children:`バリデーションが必要なすべてのフォーム`}),`
`,(0,_.jsx)(t.li,{children:`複雑なフィールド構成 (入れ子オブジェクト / 配列)`}),`
`,(0,_.jsx)(t.li,{children:`Server Action と組み合わせる入力フォーム`}),`
`]}),`
`,(0,_.jsx)(t.h2,{id:`3-いつ使わないか`,children:`3. いつ使わないか`}),`
`,(0,_.jsxs)(t.ul,{children:[`
`,(0,_.jsxs)(t.li,{children:[`検索 (`,(0,_.jsx)(t.code,{children:`<form method="get">`}),` で十分) → `,(0,_.jsx)(t.a,{href:`../components/search-box.md`,children:`SearchBox`})]}),`
`,(0,_.jsx)(t.li,{children:`単純な single-input → 直接 Input + Server Action でも OK`}),`
`]}),`
`,(0,_.jsx)(t.h2,{id:`4-構造`,children:`4. 構造`}),`
`,(0,_.jsx)(t.pre,{children:(0,_.jsx)(t.code,{children:`<Form {...form}>
  <FormField name="x" render={({ field }) => (
    <FormItem>
      <FormLabel>ラベル</FormLabel>
      <FormControl><Input {...field} /></FormControl>
      <FormDescription>補助説明 (任意)</FormDescription>
      <FormMessage />  ← エラー時に表示
    </FormItem>
  )} />
</Form>
`})}),`
`,(0,_.jsx)(t.h2,{id:`5-バリアント`,children:`5. バリアント`}),`
`,(0,_.jsx)(t.p,{children:`<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->
なし (構造化のみ)。`}),`
`,(0,_.jsx)(t.p,{children:`<!-- AUTO-GENERATED END: variants -->`}),`
`,(0,_.jsx)(t.h2,{id:`6-アクセシビリティ`,children:`6. アクセシビリティ`}),`
`,(0,_.jsxs)(t.ul,{children:[`
`,(0,_.jsxs)(t.li,{children:[`各 FormItem で `,(0,_.jsx)(t.code,{children:`id`}),` / `,(0,_.jsx)(t.code,{children:`aria-describedby`}),` / `,(0,_.jsx)(t.code,{children:`aria-invalid`}),` を自動付与`]}),`
`,(0,_.jsxs)(t.li,{children:[`FormMessage は `,(0,_.jsx)(t.code,{children:`role="alert"`}),` + `,(0,_.jsx)(t.code,{children:`aria-live="polite"`})]}),`
`,(0,_.jsx)(t.li,{children:`フォーカス順は DOM 順序通り`}),`
`]}),`
`,(0,_.jsx)(t.h2,{id:`7-使用例`,children:`7. 使用例`}),`
`,(0,_.jsx)(t.pre,{children:(0,_.jsx)(t.code,{className:`language-tsx`,children:`import { useForm } from "react-hook-form";
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
`})}),`
`,(0,_.jsx)(t.h2,{id:`8-アンチパターン`,children:`8. アンチパターン`}),`
`,(0,_.jsxs)(t.ul,{children:[`
`,(0,_.jsx)(t.li,{children:`❌ Zod なしで型のみ → ✅ Zod で実行時検証`}),`
`,(0,_.jsx)(t.li,{children:`❌ サーバーバリデーション抜け → ✅ Server Action でも Zod 検証必須 (CLAUDE.md §6.3)`}),`
`,(0,_.jsx)(t.li,{children:`❌ FormMessage 抜け → ✅ エラー表示必須`}),`
`]}),`
`,(0,_.jsx)(t.h2,{id:`9-関連`,children:`9. 関連`}),`
`,(0,_.jsxs)(t.ul,{children:[`
`,(0,_.jsxs)(t.li,{children:[(0,_.jsx)(t.a,{href:`./input.md`,children:`Input`}),`, `,(0,_.jsx)(t.a,{href:`./textarea.md`,children:`Textarea`}),`, `,(0,_.jsx)(t.a,{href:`./select.md`,children:`Select`}),`, `,(0,_.jsx)(t.a,{href:`./checkbox.md`,children:`Checkbox`}),`, `,(0,_.jsx)(t.a,{href:`./radio-group.md`,children:`RadioGroup`})]}),`
`,(0,_.jsx)(t.li,{children:(0,_.jsx)(t.a,{href:`../blocks/forms.md`,children:`blocks/forms.md`})}),`
`]}),`
`,(0,_.jsx)(t.h2,{id:`10-変更履歴`,children:`10. 変更履歴`}),`
`,(0,_.jsxs)(t.ul,{children:[`
`,(0,_.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース、RHF + Zod 統合`}),`
`]}),`
`,(0,_.jsx)(t.hr,{}),`
`,(0,_.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,_.jsx)(o,{includePrimary:!1})]})}function g(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,_.jsx)(t,{...e,children:(0,_.jsx)(h,{...e})}):h(e)}var _;e((()=>{_=t(),d(),c(),p()}))();export{g as default};