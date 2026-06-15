import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-CD-xvnSv.js";import{t as d}from"./mdx-react-shim-BWVm_lKV.js";import{Horizontal as f,Vertical as p,n as m,t as h}from"./separator.stories-TbsOT2ac.js";function g(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...n(),...e.components};return(0,v.jsxs)(v.Fragment,{children:[(0,v.jsx)(l,{of:m}),`
`,(0,v.jsx)(i,{}),`
`,(0,v.jsxs)(u,{children:[`セクションを `,(0,v.jsx)(t.strong,{children:`視覚的に分割`}),` する横/縦の罫線。Radix UI Separator ベース。`]}),`
`,(0,v.jsxs)(t.blockquote,{children:[`
`,(0,v.jsxs)(t.p,{children:[`一次資料: `,(0,v.jsx)(t.code,{children:`docs/catalog/ui/separator.md`}),`。
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
`,(0,v.jsxs)(t.p,{children:[`セクションを `,(0,v.jsx)(t.strong,{children:`視覚的に分割`}),` する横/縦の罫線。Radix UI Separator ベース。`]}),`
`,(0,v.jsx)(t.h2,{id:`2-いつ使うか`,children:`2. いつ使うか`}),`
`,(0,v.jsxs)(t.ul,{children:[`
`,(0,v.jsx)(t.li,{children:`カード内のセクション区切り`}),`
`,(0,v.jsx)(t.li,{children:`メニュー内のグループ区切り (DropdownMenu)`}),`
`,(0,v.jsx)(t.li,{children:`フッターの列間 (縦線)`}),`
`]}),`
`,(0,v.jsx)(t.h2,{id:`3-いつ使わないか`,children:`3. いつ使わないか`}),`
`,(0,v.jsxs)(t.ul,{children:[`
`,(0,v.jsxs)(t.li,{children:[`純装飾の太い border → `,(0,v.jsx)(t.code,{children:`border-t`}),` 直接で十分`]}),`
`,(0,v.jsx)(t.li,{children:`ページ大セクション → 余白 + 見出しで分離 (Separator は line)`}),`
`]}),`
`,(0,v.jsx)(t.h2,{id:`4-バリアント`,children:`4. バリアント`}),`
`,(0,v.jsx)(t.p,{children:`<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->`}),`
`,(0,v.jsxs)(t.ul,{children:[`
`,(0,v.jsxs)(t.li,{children:[(0,v.jsx)(t.code,{children:`horizontal`}),` (default)`]}),`
`,(0,v.jsx)(t.li,{children:(0,v.jsx)(t.code,{children:`vertical`})}),`
`]}),`
`,(0,v.jsx)(t.p,{children:`<!-- AUTO-GENERATED END: variants -->`}),`
`,(0,v.jsx)(t.h2,{id:`5-状態`,children:`5. 状態`}),`
`,(0,v.jsxs)(t.p,{children:[`静的のみ。`,(0,v.jsx)(t.code,{children:`decorative`}),` (default true) で aria-hidden が付く。`]}),`
`,(0,v.jsx)(t.h2,{id:`6-アクセシビリティ`,children:`6. アクセシビリティ`}),`
`,(0,v.jsxs)(t.ul,{children:[`
`,(0,v.jsxs)(t.li,{children:[`純飾りなら `,(0,v.jsx)(t.code,{children:`decorative={true}`}),` (default) で `,(0,v.jsx)(t.code,{children:`aria-hidden`})]}),`
`,(0,v.jsxs)(t.li,{children:[`意味的な区切りなら `,(0,v.jsx)(t.code,{children:`decorative={false}`}),` + `,(0,v.jsx)(t.code,{children:`role="separator"`})]}),`
`]}),`
`,(0,v.jsx)(t.h2,{id:`7-使用例`,children:`7. 使用例`}),`
`,(0,v.jsx)(t.pre,{children:(0,v.jsx)(t.code,{className:`language-tsx`,children:`import { Separator } from "@tech-event/shared-ui";

<div>
  <p>section A</p>
  <Separator className="my-4" />
  <p>section B</p>
</div>
`})}),`
`,(0,v.jsx)(t.h2,{id:`8-アンチパターン`,children:`8. アンチパターン`}),`
`,(0,v.jsxs)(t.ul,{children:[`
`,(0,v.jsxs)(t.li,{children:[`❌ 装飾なのに `,(0,v.jsx)(t.code,{children:`decorative={false}`}),` → ✅ 意味があるかで判断`]}),`
`,(0,v.jsxs)(t.li,{children:[`❌ `,(0,v.jsx)(t.code,{children:`bg-zinc-200`}),` ハードコード → ✅ `,(0,v.jsx)(t.code,{children:`bg-border`}),` (Separator が自動で対応)`]}),`
`]}),`
`,(0,v.jsx)(t.h2,{id:`9-関連`,children:`9. 関連`}),`
`,(0,v.jsxs)(t.ul,{children:[`
`,(0,v.jsx)(t.li,{children:(0,v.jsx)(t.a,{href:`./card.md`,children:`Card`})}),`
`,(0,v.jsx)(t.li,{children:(0,v.jsx)(t.a,{href:`./dropdown-menu.md`,children:`DropdownMenu`})}),`
`]}),`
`,(0,v.jsx)(t.h2,{id:`10-変更履歴`,children:`10. 変更履歴`}),`
`,(0,v.jsxs)(t.ul,{children:[`
`,(0,v.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース`}),`
`]}),`
`,(0,v.jsx)(t.hr,{}),`
`,(0,v.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,v.jsx)(o,{includePrimary:!1})]})}function _(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,v.jsx)(t,{...e,children:(0,v.jsx)(g,{...e})}):g(e)}var v;e((()=>{v=t(),d(),c(),h()}))();export{_ as default};