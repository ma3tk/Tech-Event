import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-C7BBlj3r.js";import{t as d}from"./mdx-react-shim-B68M4Igu.js";import{Default as f,Sides as p,n as m,t as h}from"./popover.stories-Cyqw1Pdg.js";function g(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...n(),...e.components};return(0,v.jsxs)(v.Fragment,{children:[(0,v.jsx)(l,{of:m}),`
`,(0,v.jsx)(i,{}),`
`,(0,v.jsxs)(u,{children:[`クリックで開く `,(0,v.jsx)(t.strong,{children:`アンカー型の小さなパネル`}),`。Tooltip と違い長文 / インタラクティブ要素 (Button / Input) を含められる。`]}),`
`,(0,v.jsxs)(t.blockquote,{children:[`
`,(0,v.jsxs)(t.p,{children:[`一次資料: `,(0,v.jsx)(t.code,{children:`docs/catalog/ui/popover.md`}),`。
ここは `,(0,v.jsx)(t.strong,{children:`言語化テキスト + 実物 Live Preview`}),` を 1 ページに統合した shadcn/ui スタイルの docs。
元の `,(0,v.jsx)(t.code,{children:`.md`}),` ファイルが source of truth、本 MDX は同内容を Storybook 上でレンダリングする視覚層。`]}),`
`]}),`
`,(0,v.jsx)(t.h2,{id:`ライブプレビュー-canvas`,children:`ライブプレビュー (Canvas)`}),`
`,(0,v.jsx)(s,{of:f}),`
`,(0,v.jsx)(s,{of:p}),`
`,(0,v.jsx)(t.h2,{id:`primary`,children:`Primary`}),`
`,(0,v.jsx)(r,{}),`
`,(0,v.jsx)(t.h2,{id:`props-api`,children:`Props (API)`}),`
`,(0,v.jsx)(a,{}),`
`,(0,v.jsx)(t.hr,{}),`
`,(0,v.jsx)(t.h2,{id:`1-目的`,children:`1. 目的`}),`
`,(0,v.jsxs)(t.p,{children:[`クリックで開く `,(0,v.jsx)(t.strong,{children:`アンカー型の小さなパネル`}),`。Tooltip と違い長文 / インタラクティブ要素 (Button / Input) を含められる。`]}),`
`,(0,v.jsx)(t.h2,{id:`2-いつ使うか`,children:`2. いつ使うか`}),`
`,(0,v.jsxs)(t.ul,{children:[`
`,(0,v.jsx)(t.li,{children:`設定の小パネル (色選択 / 日付選択)`}),`
`,(0,v.jsx)(t.li,{children:`フィルタの細かい選択 UI`}),`
`,(0,v.jsx)(t.li,{children:`ヘルプテキスト (クリックで詳細を読む)`}),`
`,(0,v.jsx)(t.li,{children:`mention のオートコンプリート`}),`
`]}),`
`,(0,v.jsx)(t.h2,{id:`3-いつ使わないか`,children:`3. いつ使わないか`}),`
`,(0,v.jsxs)(t.ul,{children:[`
`,(0,v.jsxs)(t.li,{children:[`hover で出すだけ → `,(0,v.jsx)(t.a,{href:`./tooltip.md`,children:`Tooltip`})]}),`
`,(0,v.jsxs)(t.li,{children:[`メニュー → `,(0,v.jsx)(t.a,{href:`./dropdown-menu.md`,children:`DropdownMenu`})]}),`
`,(0,v.jsxs)(t.li,{children:[`モーダル (背景操作不可) → `,(0,v.jsx)(t.a,{href:`./dialog.md`,children:`Dialog`})]}),`
`]}),`
`,(0,v.jsx)(t.h2,{id:`4-構造`,children:`4. 構造`}),`
`,(0,v.jsx)(t.pre,{children:(0,v.jsx)(t.code,{children:`       ┌──────────────┐
       │ Popover 本体 │
       │              │
       └─▼────────────┘
   [anchor]
`})}),`
`,(0,v.jsx)(t.h2,{id:`5-状態`,children:`5. 状態`}),`
`,(0,v.jsx)(t.p,{children:`closed / open / focused。`}),`
`,(0,v.jsx)(t.h2,{id:`6-アクセシビリティ`,children:`6. アクセシビリティ`}),`
`,(0,v.jsxs)(t.ul,{children:[`
`,(0,v.jsxs)(t.li,{children:[`Trigger に `,(0,v.jsx)(t.code,{children:`aria-expanded`}),` / `,(0,v.jsx)(t.code,{children:`aria-haspopup="dialog"`})]}),`
`,(0,v.jsx)(t.li,{children:`Escape で閉じる`}),`
`,(0,v.jsx)(t.li,{children:`外側クリックで閉じる`}),`
`,(0,v.jsx)(t.li,{children:`フォーカスは内部にトラップしない (Dialog と違う点)`}),`
`]}),`
`,(0,v.jsx)(t.h2,{id:`7-使用例`,children:`7. 使用例`}),`
`,(0,v.jsx)(t.pre,{children:(0,v.jsx)(t.code,{className:`language-tsx`,children:`import { Popover, PopoverTrigger, PopoverContent } from "@tech-event/shared-ui";

<Popover>
  <PopoverTrigger asChild>
    <Button variant="ghost">詳細</Button>
  </PopoverTrigger>
  <PopoverContent className="w-80">
    <p>詳細な説明や設定 UI</p>
  </PopoverContent>
</Popover>
`})}),`
`,(0,v.jsx)(t.h2,{id:`8-アンチパターン`,children:`8. アンチパターン`}),`
`,(0,v.jsxs)(t.ul,{children:[`
`,(0,v.jsx)(t.li,{children:`❌ モーダル的に使う → ✅ Dialog`}),`
`,(0,v.jsx)(t.li,{children:`❌ hover で出す → ✅ Tooltip`}),`
`,(0,v.jsx)(t.li,{children:`❌ メニュー的に使う → ✅ DropdownMenu`}),`
`]}),`
`,(0,v.jsx)(t.h2,{id:`9-関連`,children:`9. 関連`}),`
`,(0,v.jsxs)(t.ul,{children:[`
`,(0,v.jsx)(t.li,{children:(0,v.jsx)(t.a,{href:`./tooltip.md`,children:`Tooltip`})}),`
`,(0,v.jsx)(t.li,{children:(0,v.jsx)(t.a,{href:`./dropdown-menu.md`,children:`DropdownMenu`})}),`
`,(0,v.jsx)(t.li,{children:(0,v.jsx)(t.a,{href:`./dialog.md`,children:`Dialog`})}),`
`]}),`
`,(0,v.jsx)(t.h2,{id:`10-変更履歴`,children:`10. 変更履歴`}),`
`,(0,v.jsxs)(t.ul,{children:[`
`,(0,v.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース`}),`
`]}),`
`,(0,v.jsx)(t.hr,{}),`
`,(0,v.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,v.jsx)(o,{includePrimary:!1})]})}function _(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,v.jsx)(t,{...e,children:(0,v.jsx)(g,{...e})}):g(e)}var v;e((()=>{v=t(),d(),c(),h()}))();export{_ as default};