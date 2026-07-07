import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-DyqvvloQ.js";import{t as d}from"./mdx-react-shim-Co4r-mY_.js";import{Default as f,Disabled as p,Grouped as m,n as h,t as g}from"./select.stories-6b1BP8VC.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:h}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsxs)(u,{children:[(0,y.jsx)(t.strong,{children:`選択肢が 5+ 個`}),` ある場合のセレクトボックス。Radix UI Select ベース。`]}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/ui/select.md`}),`。
ここは `,(0,y.jsx)(t.strong,{children:`言語化テキスト + 実物 Live Preview`}),` を 1 ページに統合した shadcn/ui スタイルの docs。
元の `,(0,y.jsx)(t.code,{children:`.md`}),` ファイルが source of truth、本 MDX は同内容を Storybook 上でレンダリングする視覚層。`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`ライブプレビュー-canvas`,children:`ライブプレビュー (Canvas)`}),`
`,(0,y.jsx)(s,{of:f}),`
`,(0,y.jsx)(s,{of:m}),`
`,(0,y.jsx)(s,{of:p}),`
`,(0,y.jsx)(t.h2,{id:`primary`,children:`Primary`}),`
`,(0,y.jsx)(r,{}),`
`,(0,y.jsx)(t.h2,{id:`props-api`,children:`Props (API)`}),`
`,(0,y.jsx)(a,{}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`1-目的`,children:`1. 目的`}),`
`,(0,y.jsxs)(t.p,{children:[(0,y.jsx)(t.strong,{children:`選択肢が 5+ 個`}),` ある場合のセレクトボックス。Radix UI Select ベース。`]}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか`,children:`2. いつ使うか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`国 / 都道府県 / カテゴリ選択`}),`
`,(0,y.jsx)(t.li,{children:`ソート順 / 表示件数の切替`}),`
`,(0,y.jsx)(t.li,{children:`5 個以上の選択肢`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか`,children:`3. いつ使わないか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`選択肢が 2-4 個 → `,(0,y.jsx)(t.a,{href:`./radio-group.md`,children:`RadioGroup`}),` (常時可視で UX 良)`]}),`
`,(0,y.jsxs)(t.li,{children:[`ON/OFF → `,(0,y.jsx)(t.a,{href:`./switch.md`,children:`Switch`})]}),`
`,(0,y.jsxs)(t.li,{children:[`複数選択 → `,(0,y.jsx)(t.a,{href:`./checkbox.md`,children:`Checkbox`}),` 複数 or 別 UI`]}),`
`,(0,y.jsx)(t.li,{children:`検索が必要 → Combobox (将来追加予定)`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-構造`,children:`4. 構造`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{children:`┌──────────────────┐
│ 選択された項目 ▾ │   ← SelectTrigger
└──────────────────┘
       │ クリック
       ▼
   ┌──────────────────┐
   │ Option 1         │
   │ Option 2         │
   │ Option 3         │
   └──────────────────┘
`})}),`
`,(0,y.jsx)(t.h2,{id:`5-バリアント`,children:`5. バリアント`}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`size: `,(0,y.jsx)(t.code,{children:`sm`}),` / `,(0,y.jsx)(t.code,{children:`md`}),` (default) / `,(0,y.jsx)(t.code,{children:`lg`})]}),`
`]}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED END: variants -->`}),`
`,(0,y.jsx)(t.h2,{id:`6-状態`,children:`6. 状態`}),`
`,(0,y.jsx)(t.p,{children:`default / hover / focus-visible / open / disabled。`}),`
`,(0,y.jsx)(t.h2,{id:`7-アクセシビリティ`,children:`7. アクセシビリティ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`Label 必須`}),`
`,(0,y.jsx)(t.li,{children:`キーボード操作 (↑↓ / Enter / Escape) は Radix が処理`}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`aria-required`}),` / `,(0,y.jsx)(t.code,{children:`aria-invalid`}),` 連動`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`8-使用例`,children:`8. 使用例`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import {
  Select, SelectTrigger, SelectValue,
  SelectContent, SelectItem,
} from "@tech-event/shared-ui";

<div className="space-y-2">
  <Label htmlFor="sort">並び順</Label>
  <Select defaultValue="newest">
    <SelectTrigger id="sort">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="newest">新着順</SelectItem>
      <SelectItem value="popular">人気順</SelectItem>
      <SelectItem value="upcoming">開催が近い順</SelectItem>
    </SelectContent>
  </Select>
</div>
`})}),`
`,(0,y.jsx)(t.h2,{id:`9-アンチパターン`,children:`9. アンチパターン`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`❌ 選択肢が 3 個以下 → ✅ RadioGroup`}),`
`,(0,y.jsxs)(t.li,{children:[`❌ ネイティブ `,(0,y.jsx)(t.code,{children:`<select>`}),` を直接 → ✅ Select (テーマ統一)`]}),`
`,(0,y.jsx)(t.li,{children:`❌ Label 抜け → ✅ 必須`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`10-関連`,children:`10. 関連`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./radio-group.md`,children:`RadioGroup`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./checkbox.md`,children:`Checkbox`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../blocks/data-input.md`,children:`blocks/data-input.md`})}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`11-変更履歴`,children:`11. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),g()}))();export{v as default};