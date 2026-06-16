import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-DxazclGI.js";import{t as d}from"./mdx-react-shim-CQBio_OA.js";import{Default as f,FirstPage as p,LastPage as m,n as h,t as g}from"./Pagination.stories-DLDjqTeR.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:g}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsxs)(u,{children:[(0,y.jsx)(t.strong,{children:`数値ベース`}),` のページネーション (1 / 2 / 3 / … / N)。computePages ヘルパーで省略表示の計算を内包。Link ベースで JS なしでも動作。`]}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/components/pagination.md`}),`。
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
`,(0,y.jsxs)(t.p,{children:[(0,y.jsx)(t.strong,{children:`数値ベース`}),` のページネーション (1 / 2 / 3 / … / N)。`,(0,y.jsx)(t.code,{children:`computePages`}),` ヘルパーで省略表示の計算を内包。`,(0,y.jsx)(t.code,{children:`<Link>`}),` ベースで JS なしでも動作。`]}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか`,children:`2. いつ使うか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`検索結果 / 一覧 / ランキングなど、1 ページに収まらない場合`}),`
`,(0,y.jsx)(t.li,{children:`件数表示と組合せる`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか`,children:`3. いつ使わないか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`無限スクロール (タイムライン) → 別 UI`}),`
`,(0,y.jsx)(t.li,{children:`1 ページのみ → 出さない`}),`
`,(0,y.jsx)(t.li,{children:`ステップ UI → Stepper (将来)`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-構造`,children:`4. 構造`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{children:`[<前] [1] [2] [3] … [10] [次>]
`})}),`
`,(0,y.jsx)(t.h2,{id:`5-アクセシビリティ`,children:`5. アクセシビリティ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.code,{children:`<nav aria-label="pagination">`})}),`
`,(0,y.jsxs)(t.li,{children:[`現在ページは `,(0,y.jsx)(t.code,{children:`aria-current="page"`})]}),`
`,(0,y.jsxs)(t.li,{children:[`前 / 次は `,(0,y.jsx)(t.code,{children:`aria-label="前のページ"`}),` / 「次のページ」`]}),`
`,(0,y.jsxs)(t.li,{children:[`disabled は `,(0,y.jsx)(t.code,{children:`aria-disabled`}),` + 視覚的に灰色`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`6-使用例`,children:`6. 使用例`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import { Pagination } from "@tech-event/shared-ui-composite";

<Pagination
  current={page}
  total={totalPages}
  buildHref={(p) => \`/search?q=\${q}&page=\${p}\`}
/>
`})}),`
`,(0,y.jsx)(t.h2,{id:`7-アンチパターン`,children:`7. アンチパターン`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`❌ JS イベントで遷移 → ✅ `,(0,y.jsx)(t.code,{children:`<Link>`}),` ベース`]}),`
`,(0,y.jsxs)(t.li,{children:[`❌ disabled な `,(0,y.jsx)(t.code,{children:`<a>`}),` に aria-label → ✅ `,(0,y.jsx)(t.code,{children:`<button disabled>`}),` か `,(0,y.jsx)(t.code,{children:`<span aria-hidden>`}),` で`]}),`
`,(0,y.jsx)(t.li,{children:`❌ 件数表示なし → ✅ 「全 N 件中 X-Y 件」を併記`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`8-関連`,children:`8. 関連`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../ui/button.md`,children:`Button`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../blocks/lists-and-tables.md`,children:`blocks/lists-and-tables.md`})}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`9-変更履歴`,children:`9. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),h()}))();export{v as default};