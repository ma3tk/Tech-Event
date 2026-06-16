import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,d as r,n as i,p as a,s as o,u as s}from"./blocks-CxcFbYk8.js";import{t as c}from"./mdx-react-shim-C2WkHrtd.js";import{Cancelled as l,Ended as u,Full as d,Hybrid as f,ListDefault as p,LumaWithTint as m,Online as h,Waitlist as g,n as _}from"./EventCard.stories-Cq9lXCQM.js";import{Sidebar as v,Standard as y,n as b}from"./GroupCard.stories-DCkAwUCr.js";import{Basic as x,n as S}from"./card.stories-BCnMRLSa.js";function C(e){let t={blockquote:`blockquote`,code:`code`,h2:`h2`,li:`li`,p:`p`,ul:`ul`,...n(),...e.components};return(0,T.jsxs)(T.Fragment,{children:[(0,T.jsx)(o,{title:`Blocks/Cards`}),`
`,(0,T.jsx)(r,{children:`Cards`}),`
`,(0,T.jsx)(s,{children:`カード系コンポーネント (Card / EventCard / GroupCard) の構成パターン。情報をまとまり単位で見せ、grid / list の 2 表示モードを統一する。`}),`
`,(0,T.jsxs)(t.blockquote,{children:[`
`,(0,T.jsxs)(t.p,{children:[`一次資料: `,(0,T.jsx)(t.code,{children:`docs/catalog/blocks/cards.md`}),`。`]}),`
`]}),`
`,(0,T.jsx)(t.h2,{id:`基本-card-foundation`,children:`基本 Card (foundation)`}),`
`,(0,T.jsx)(i,{of:x}),`
`,(0,T.jsx)(t.h2,{id:`eventcard-list-default`,children:`EventCard list (default)`}),`
`,(0,T.jsx)(t.p,{children:`イベント 1 件をリスト形式で表示。検索結果 / 関連イベント / フィードに使う。`}),`
`,(0,T.jsx)(i,{of:p}),`
`,(0,T.jsx)(t.h2,{id:`eventcard-grid-luma`,children:`EventCard grid (luma)`}),`
`,(0,T.jsx)(t.p,{children:`注目イベント / ヒーロー領域では grid / luma variant。`}),`
`,(0,T.jsx)(i,{of:m}),`
`,(0,T.jsx)(t.h2,{id:`eventcard-ステータス別-online--hybrid--full--waitlist--cancelled--ended`,children:`EventCard ステータス別 (Online / Hybrid / Full / Waitlist / Cancelled / Ended)`}),`
`,(0,T.jsx)(i,{of:h}),`
`,(0,T.jsx)(i,{of:f}),`
`,(0,T.jsx)(i,{of:d}),`
`,(0,T.jsx)(i,{of:g}),`
`,(0,T.jsx)(i,{of:l}),`
`,(0,T.jsx)(i,{of:u}),`
`,(0,T.jsx)(t.h2,{id:`groupcard-standard--sidebar`,children:`GroupCard standard / sidebar`}),`
`,(0,T.jsx)(i,{of:y}),`
`,(0,T.jsx)(i,{of:v}),`
`,(0,T.jsx)(t.h2,{id:`アンチパターン`,children:`アンチパターン`}),`
`,(0,T.jsxs)(t.ul,{children:[`
`,(0,T.jsx)(t.li,{children:`❌ Card にだけ装飾 (グラデ背景・派手影) を入れる → ✅ tokens 経由でサーフェス統一`}),`
`,(0,T.jsx)(t.li,{children:`❌ list / grid の切替で情報量を変える → ✅ 表示密度は変えていいが「何が分かるか」は同じ`}),`
`,(0,T.jsx)(t.li,{children:`❌ 16:9 サムネに任意比率の画像を入れる → ✅ aspect-video で固定`}),`
`]})]})}function w(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,T.jsx)(t,{...e,children:(0,T.jsx)(C,{...e})}):C(e)}var T;e((()=>{T=t(),c(),a(),_(),b(),S()}))();export{w as default};