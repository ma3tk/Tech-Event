import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-DyqvvloQ.js";import{t as d}from"./mdx-react-shim-Co4r-mY_.js";import{Checked as f,Default as p,Indeterminate as m,n as h,t as g}from"./checkbox.stories-CNdtCZVd.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:g}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsxs)(u,{children:[(0,y.jsx)(t.strong,{children:`複数選択可能`}),` な ON/OFF 状態を表す入力要素。indeterminate (一部選択) もサポート。Radix UI ベース。`]}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/ui/checkbox.md`}),`。
ここは `,(0,y.jsx)(t.strong,{children:`言語化テキスト + 実物 Live Preview`}),` を 1 ページに統合した shadcn/ui スタイルの docs。
元の `,(0,y.jsx)(t.code,{children:`.md`}),` ファイルが source of truth、本 MDX は同内容を Storybook 上でレンダリングする視覚層。`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`ライブプレビュー-canvas`,children:`ライブプレビュー (Canvas)`}),`
`,(0,y.jsx)(s,{of:p}),`
`,(0,y.jsx)(s,{of:f}),`
`,(0,y.jsx)(s,{of:m}),`
`,(0,y.jsx)(t.h2,{id:`primary`,children:`Primary`}),`
`,(0,y.jsx)(r,{}),`
`,(0,y.jsx)(t.h2,{id:`props-api`,children:`Props (API)`}),`
`,(0,y.jsx)(a,{}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`1-目的`,children:`1. 目的`}),`
`,(0,y.jsxs)(t.p,{children:[(0,y.jsx)(t.strong,{children:`複数選択可能`}),` な ON/OFF 状態を表す入力要素。indeterminate (一部選択) もサポート。Radix UI ベース。`]}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか`,children:`2. いつ使うか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`複数のオプションから複数選択 (タグ複数選択 / 通知設定 等)`}),`
`,(0,y.jsx)(t.li,{children:`同意チェック (利用規約)`}),`
`,(0,y.jsx)(t.li,{children:`フィルタ群 (1 つの軸で複数選択)`}),`
`,(0,y.jsx)(t.li,{children:`親-子の一括選択 (indeterminate で親が「一部選択」)`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか`,children:`3. いつ使わないか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`1 つだけ選ぶ → `,(0,y.jsx)(t.a,{href:`./radio-group.md`,children:`RadioGroup`})]}),`
`,(0,y.jsxs)(t.li,{children:[`即時 ON/OFF → `,(0,y.jsx)(t.a,{href:`./switch.md`,children:`Switch`})]}),`
`,(0,y.jsxs)(t.li,{children:[`5+ 個から 1 つ選ぶ → `,(0,y.jsx)(t.a,{href:`./select.md`,children:`Select`})]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-構造`,children:`4. 構造`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{children:`☐ ラベル           (unchecked)
☑ ラベル           (checked)
⊟ ラベル           (indeterminate)
`})}),`
`,(0,y.jsx)(t.h2,{id:`5-バリアント`,children:`5. バリアント`}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->
なし (Radix の primitive を使う)。`}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED END: variants -->`}),`
`,(0,y.jsx)(t.h2,{id:`6-状態`,children:`6. 状態`}),`
`,(0,y.jsx)(t.p,{children:`unchecked / checked / indeterminate / disabled / error。`}),`
`,(0,y.jsx)(t.h2,{id:`7-アクセシビリティ`,children:`7. アクセシビリティ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`Label 必須 (`,(0,y.jsx)(t.code,{children:`<Label htmlFor>`}),` + checkbox の `,(0,y.jsx)(t.code,{children:`id`}),`)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`aria-checked`}),` は Radix が `,(0,y.jsx)(t.code,{children:`true`}),` / `,(0,y.jsx)(t.code,{children:`false`}),` / `,(0,y.jsx)(t.code,{children:`mixed`}),` で処理`]}),`
`,(0,y.jsxs)(t.li,{children:[`グループは `,(0,y.jsx)(t.code,{children:`fieldset`}),` + `,(0,y.jsx)(t.code,{children:`legend`}),` で意味的に括る`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`8-使用例`,children:`8. 使用例`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import { Checkbox } from "@tech-event/shared-ui";

<div className="flex items-center gap-2">
  <Checkbox id="agree" />
  <Label htmlFor="agree">利用規約に同意する</Label>
</div>
`})}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`// indeterminate (一部選択)
<Checkbox checked="indeterminate" onCheckedChange={...} />
`})}),`
`,(0,y.jsx)(t.h2,{id:`9-アンチパターン`,children:`9. アンチパターン`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`❌ 単独で ON/OFF → ✅ Switch (より即時的)`}),`
`,(0,y.jsx)(t.li,{children:`❌ Label 抜け → ✅ 必須`}),`
`,(0,y.jsx)(t.li,{children:`❌ 1 個だけ選びたい → ✅ RadioGroup`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`10-関連`,children:`10. 関連`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./radio-group.md`,children:`RadioGroup`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./switch.md`,children:`Switch`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./form.md`,children:`Form`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../blocks/data-input.md`,children:`blocks/data-input.md`})}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`11-変更履歴`,children:`11. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース、indeterminate 対応`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),h()}))();export{v as default};