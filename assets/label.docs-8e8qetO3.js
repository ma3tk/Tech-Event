import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-C7BBlj3r.js";import{t as d}from"./mdx-react-shim-B68M4Igu.js";import{Default as f,Required as p,WithInput as m,n as h,t as g}from"./label.stories-B2-WFDym.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:h}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsxs)(u,{children:[`フォーム要素 (input, textarea, select, Checkbox 等) に `,(0,y.jsx)(t.strong,{children:`アクセシブルなラベル`}),` を付与する。Radix UI の react-label ベースで、htmlFor の自動連携 / クリックで input にフォーカスを実現する。`]}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/ui/label.md`}),`。
ここは `,(0,y.jsx)(t.strong,{children:`言語化テキスト + 実物 Live Preview`}),` を 1 ページに統合した shadcn/ui スタイルの docs。
元の `,(0,y.jsx)(t.code,{children:`.md`}),` ファイルが source of truth、本 MDX は同内容を Storybook 上でレンダリングする視覚層。`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`ライブプレビュー-canvas`,children:`ライブプレビュー (Canvas)`}),`
`,(0,y.jsx)(s,{of:f}),`
`,(0,y.jsx)(s,{of:p}),`
`,(0,y.jsx)(s,{of:m}),`
`,(0,y.jsx)(t.h2,{id:`primary`,children:`Primary`}),`
`,(0,y.jsx)(r,{}),`
`,(0,y.jsx)(t.h2,{id:`props-api`,children:`Props (API)`}),`
`,(0,y.jsx)(a,{}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`1-目的-purpose`,children:`1. 目的 (Purpose)`}),`
`,(0,y.jsxs)(t.p,{children:[`フォーム要素 (`,(0,y.jsx)(t.code,{children:`<input>`}),`, `,(0,y.jsx)(t.code,{children:`<textarea>`}),`, `,(0,y.jsx)(t.code,{children:`<select>`}),`, `,(0,y.jsx)(t.code,{children:`<Checkbox>`}),` 等) に `,(0,y.jsx)(t.strong,{children:`アクセシブルなラベル`}),` を付与する。Radix UI の `,(0,y.jsx)(t.code,{children:`react-label`}),` ベースで、`,(0,y.jsx)(t.code,{children:`htmlFor`}),` の自動連携 / クリックで input にフォーカスを実現する。`]}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか`,children:`2. いつ使うか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`フォームのすべての入力要素にラベル付与`}),`
`,(0,y.jsx)(t.li,{children:`Checkbox / RadioGroup / Switch の説明テキスト`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか`,children:`3. いつ使わないか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`インラインの装飾テキスト → `,(0,y.jsx)(t.code,{children:`<span>`}),` / `,(0,y.jsx)(t.code,{children:`<p>`})]}),`
`,(0,y.jsxs)(t.li,{children:[`ボタンのテキスト → `,(0,y.jsx)(t.code,{children:`<Button>`}),` 内のテキストで十分`]}),`
`,(0,y.jsxs)(t.li,{children:[`セクション見出し → `,(0,y.jsx)(t.code,{children:`h2-h4`})]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-構造`,children:`4. 構造`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{children:`[ラベルテキスト] [* 必須印 (optional)]
`})}),`
`,(0,y.jsx)(t.h2,{id:`5-バリアント`,children:`5. バリアント`}),`
`,(0,y.jsxs)(t.p,{children:[`<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->
なし (単一スタイル)。スタイル軸は親で `,(0,y.jsx)(t.code,{children:`className`}),` で調整。`]}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED END: variants -->`}),`
`,(0,y.jsx)(t.h2,{id:`6-サイズ`,children:`6. サイズ`}),`
`,(0,y.jsx)(t.p,{children:`text-sm (14px) / font-medium がデフォルト。`}),`
`,(0,y.jsx)(t.h2,{id:`7-状態`,children:`7. 状態`}),`
`,(0,y.jsxs)(t.table,{children:[(0,y.jsx)(t.thead,{children:(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.th,{children:`状態`}),(0,y.jsx)(t.th,{children:`視覚`})]})}),(0,y.jsxs)(t.tbody,{children:[(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`default`}),(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`text-foreground`})})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`disabled (input がdisabledの時)`}),(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`opacity-70 cursor-not-allowed`})})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`required`}),(0,y.jsxs)(t.td,{children:[`後ろに `,(0,y.jsx)(t.code,{children:`<span aria-hidden>*</span>`}),` を視覚的に付与`]})]})]})]}),`
`,(0,y.jsx)(t.h2,{id:`8-アクセシビリティ`,children:`8. アクセシビリティ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:(0,y.jsx)(t.code,{children:`htmlFor={id}`})}),` で input と関連付け (Radix が処理)`]}),`
`,(0,y.jsxs)(t.li,{children:[`input の `,(0,y.jsx)(t.code,{children:`id`}),` と一致させる`]}),`
`,(0,y.jsxs)(t.li,{children:[`必須は `,(0,y.jsx)(t.code,{children:`aria-required`}),` 側で、視覚的には `,(0,y.jsx)(t.code,{children:`*`}),` のみ`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`9-使用例`,children:`9. 使用例`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import { Label } from "@tech-event/shared-ui";
import { Input } from "@tech-event/shared-ui";

<div className="space-y-2">
  <Label htmlFor="title">
    タイトル <span aria-hidden className="text-destructive">*</span>
  </Label>
  <Input id="title" required />
</div>
`})}),`
`,(0,y.jsx)(t.h2,{id:`10-アンチパターン`,children:`10. アンチパターン`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`❌ `,(0,y.jsx)(t.code,{children:`<label>`}),` を直接 → ✅ `,(0,y.jsx)(t.code,{children:`<Label>`}),` で統一`]}),`
`,(0,y.jsxs)(t.li,{children:[`❌ `,(0,y.jsx)(t.code,{children:`htmlFor`}),` 抜け → ✅ 必須`]}),`
`,(0,y.jsx)(t.li,{children:`❌ placeholder で代替 → ✅ Label 必須`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`11-関連`,children:`11. 関連`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./input.md`,children:`Input`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./form.md`,children:`Form`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../blocks/forms.md`,children:`blocks/forms.md`})}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`12-変更履歴`,children:`12. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),g()}))();export{v as default};