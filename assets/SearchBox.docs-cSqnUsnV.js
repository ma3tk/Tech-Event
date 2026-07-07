import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-DyqvvloQ.js";import{t as d}from"./mdx-react-shim-Co4r-mY_.js";import{Header as f,Hero as p,WithDefaultValue as m,n as h,t as g}from"./SearchBox.stories-9oWu9pge.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:g}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsxs)(u,{children:[(0,y.jsx)(t.strong,{children:`ヘッダー / ヒーロー用の検索ボックス`}),`。form method="get" で JS なしでも動作する。Input + 検索ボタン + 検索ヒント (オプション)。`]}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/components/search-box.md`}),`。
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
`,(0,y.jsx)(t.h2,{id:`1-目的`,children:`1. 目的`}),`
`,(0,y.jsxs)(t.p,{children:[(0,y.jsx)(t.strong,{children:`ヘッダー / ヒーロー用の検索ボックス`}),`。`,(0,y.jsx)(t.code,{children:`<form method="get">`}),` で JS なしでも動作する。Input + 検索ボタン + 検索ヒント (オプション)。`]}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか`,children:`2. いつ使うか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`ヘッダー (常設)`}),`
`,(0,y.jsx)(t.li,{children:`ランディングのヒーロー`}),`
`,(0,y.jsx)(t.li,{children:`検索ページの上部`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか`,children:`3. いつ使わないか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`フィルタ専用 → 専用 UI`}),`
`,(0,y.jsx)(t.li,{children:`リアルタイム検索 (debounce + fetch) → 別 component`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-アクセシビリティ`,children:`4. アクセシビリティ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`<form>`}),` 内に `,(0,y.jsx)(t.code,{children:`<input type="search">`})]}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.code,{children:`aria-label="イベントを検索"`})}),`
`,(0,y.jsx)(t.li,{children:`検索ヒントは Popover で`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`5-使用例`,children:`5. 使用例`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import { SearchBox } from "@tech-event/shared-ui-composite";

<SearchBox action="/search" placeholder="イベント名 / キーワード" />
`})}),`
`,(0,y.jsx)(t.h2,{id:`6-アンチパターン`,children:`6. アンチパターン`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`❌ JS submit のみ → ✅ form action で JS なしでも動作`}),`
`,(0,y.jsx)(t.li,{children:`❌ Label なし → ✅ aria-label 必須`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`7-関連`,children:`7. 関連`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../ui/input.md`,children:`Input`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../blocks/forms.md`,children:`blocks/forms.md`})}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`8-変更履歴`,children:`8. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),h()}))();export{v as default};