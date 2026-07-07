import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,d as r,n as i,p as a,s as o,u as s}from"./blocks-DyqvvloQ.js";import{t as c}from"./mdx-react-shim-Co4r-mY_.js";import{GridDefault as l,ListDefault as u,n as d}from"./EventCard.stories-gzqOmFuI.js";import{WithSearchQuery as f,n as p}from"./Header.stories-CbLgueLu.js";function m(e){let t={blockquote:`blockquote`,code:`code`,h2:`h2`,li:`li`,p:`p`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...n(),...e.components};return(0,g.jsxs)(g.Fragment,{children:[(0,g.jsx)(o,{title:`Foundations/Responsive`}),`
`,(0,g.jsx)(r,{children:`Responsive`}),`
`,(0,g.jsx)(s,{children:`モバイルファースト + 4 ブレークポイント (sm 640 / md 768 / lg 1024 / xl 1280)。コンテナ max-w 1280px、主要ページは lg 以上で 2 カラム。`}),`
`,(0,g.jsxs)(t.blockquote,{children:[`
`,(0,g.jsxs)(t.p,{children:[`一次資料: `,(0,g.jsx)(t.code,{children:`docs/catalog/foundations/responsive.md`}),`。`]}),`
`]}),`
`,(0,g.jsx)(t.h2,{id:`ブレークポイント-tailwind-既定`,children:`ブレークポイント (Tailwind 既定)`}),`
`,(0,g.jsxs)(t.table,{children:[(0,g.jsx)(t.thead,{children:(0,g.jsxs)(t.tr,{children:[(0,g.jsx)(t.th,{children:`name`}),(0,g.jsx)(t.th,{children:`min-width`}),(0,g.jsx)(t.th,{children:`用途`})]})}),(0,g.jsxs)(t.tbody,{children:[(0,g.jsxs)(t.tr,{children:[(0,g.jsx)(t.td,{children:`(default)`}),(0,g.jsx)(t.td,{children:`0`}),(0,g.jsx)(t.td,{children:`モバイル基準`})]}),(0,g.jsxs)(t.tr,{children:[(0,g.jsx)(t.td,{children:`sm`}),(0,g.jsx)(t.td,{children:`640px`}),(0,g.jsx)(t.td,{children:`大きめスマホ / 小タブレット`})]}),(0,g.jsxs)(t.tr,{children:[(0,g.jsx)(t.td,{children:`md`}),(0,g.jsx)(t.td,{children:`768px`}),(0,g.jsx)(t.td,{children:`タブレット`})]}),(0,g.jsxs)(t.tr,{children:[(0,g.jsx)(t.td,{children:`lg`}),(0,g.jsx)(t.td,{children:`1024px`}),(0,g.jsx)(t.td,{children:`小デスクトップ / 2 カラム化`})]}),(0,g.jsxs)(t.tr,{children:[(0,g.jsx)(t.td,{children:`xl`}),(0,g.jsx)(t.td,{children:`1280px`}),(0,g.jsx)(t.td,{children:`デスクトップ`})]})]})]}),`
`,(0,g.jsx)(t.h2,{id:`eventcard-list-モバイル基準`,children:`EventCard (list, モバイル基準)`}),`
`,(0,g.jsxs)(t.p,{children:[`横長 1 行表示。`,(0,g.jsx)(t.code,{children:`md:grid-cols-2`}),` で 2 列、`,(0,g.jsx)(t.code,{children:`lg:`}),` で 3 列など。`]}),`
`,(0,g.jsx)(i,{of:u}),`
`,(0,g.jsx)(t.h2,{id:`eventcard-grid-デスクトップで縦積み`,children:`EventCard (grid, デスクトップで縦積み)`}),`
`,(0,g.jsx)(i,{of:l}),`
`,(0,g.jsx)(t.h2,{id:`header-検索クエリ付き`,children:`Header (検索クエリ付き)`}),`
`,(0,g.jsx)(i,{of:f}),`
`,(0,g.jsx)(t.h2,{id:`規約`,children:`規約`}),`
`,(0,g.jsxs)(t.ul,{children:[`
`,(0,g.jsxs)(t.li,{children:[`モバイル (`,(0,g.jsx)(t.code,{children:`<640px`}),`) ではタッチ領域 44×44px 確保`]}),`
`,(0,g.jsx)(t.li,{children:`コンテナ max-w 1280px (px-6 sm:px-8 lg:px-12)`}),`
`,(0,g.jsx)(t.li,{children:`主要ページは lg 以上でメイン + 右サイド 2 カラム (2:1〜3:1)`}),`
`,(0,g.jsx)(t.li,{children:`スペーシングは 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px のみ (任意値禁止)`}),`
`,(0,g.jsxs)(t.li,{children:[(0,g.jsx)(t.code,{children:`word-break: keep-all`}),` + `,(0,g.jsx)(t.code,{children:`overflow-wrap: anywhere`}),` で日本語の折返しを最適化`]}),`
`]}),`
`,(0,g.jsxs)(t.p,{children:[`詳細は `,(0,g.jsx)(t.code,{children:`docs/catalog/foundations/responsive.md`}),`。`]})]})}function h(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,g.jsx)(t,{...e,children:(0,g.jsx)(m,{...e})}):m(e)}var g;e((()=>{g=t(),c(),a(),d(),p()}))();export{h as default};