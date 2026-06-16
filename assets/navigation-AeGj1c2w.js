import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,d as r,n as i,p as a,s as o,u as s}from"./blocks-CxcFbYk8.js";import{t as c}from"./mdx-react-shim-C2WkHrtd.js";import{LoggedIn as l,LoggedInWithAvatar as u,LoggedInWithNotifications as d,LoggedOut as f,n as p}from"./Header.stories-CyHKo4JP.js";import{Default as m,ManyLevels as h,n as g}from"./Breadcrumb.stories-BJEV8jbT.js";import{Default as _,n as v}from"./Footer.stories-CK19oZXc.js";import{Header as y,Hero as b,n as x}from"./SearchBox.stories-BZXIczMF.js";function S(e){let t={blockquote:`blockquote`,code:`code`,h2:`h2`,li:`li`,p:`p`,ul:`ul`,...n(),...e.components};return(0,w.jsxs)(w.Fragment,{children:[(0,w.jsx)(o,{title:`Blocks/Navigation`}),`
`,(0,w.jsx)(r,{children:`Navigation`}),`
`,(0,w.jsx)(s,{children:`ヘッダー / フッター / パンくず / 検索を組み合わせるグローバルナビゲーションパターン。logged-in / logged-out で見せ方を切替。`}),`
`,(0,w.jsxs)(t.blockquote,{children:[`
`,(0,w.jsxs)(t.p,{children:[`一次資料: `,(0,w.jsx)(t.code,{children:`docs/catalog/blocks/navigation.md`}),`。`]}),`
`]}),`
`,(0,w.jsx)(t.h2,{id:`header-loggedout`,children:`Header (LoggedOut)`}),`
`,(0,w.jsx)(t.p,{children:`未ログイン時。検索 + ログイン CTA。`}),`
`,(0,w.jsx)(i,{of:f}),`
`,(0,w.jsx)(t.h2,{id:`header-loggedin`,children:`Header (LoggedIn)`}),`
`,(0,w.jsx)(t.p,{children:`ログイン時。検索 + 通知 + アバター。`}),`
`,(0,w.jsx)(i,{of:l}),`
`,(0,w.jsx)(t.h2,{id:`header-with-notifications`,children:`Header with notifications`}),`
`,(0,w.jsx)(i,{of:d}),`
`,(0,w.jsx)(t.h2,{id:`header-with-avatar`,children:`Header with avatar`}),`
`,(0,w.jsx)(i,{of:u}),`
`,(0,w.jsx)(t.h2,{id:`breadcrumb-default`,children:`Breadcrumb (default)`}),`
`,(0,w.jsx)(i,{of:m}),`
`,(0,w.jsx)(t.h2,{id:`breadcrumb-many-levels`,children:`Breadcrumb (many levels)`}),`
`,(0,w.jsx)(i,{of:h}),`
`,(0,w.jsx)(t.h2,{id:`searchbox-header--hero`,children:`SearchBox header / hero`}),`
`,(0,w.jsx)(i,{of:y}),`
`,(0,w.jsx)(i,{of:b}),`
`,(0,w.jsx)(t.h2,{id:`footer`,children:`Footer`}),`
`,(0,w.jsx)(i,{of:_}),`
`,(0,w.jsx)(t.h2,{id:`アンチパターン`,children:`アンチパターン`}),`
`,(0,w.jsxs)(t.ul,{children:[`
`,(0,w.jsx)(t.li,{children:`❌ Header をページごとに別実装 → ✅ 共通 composite を 1 つに集約`}),`
`,(0,w.jsx)(t.li,{children:`❌ Breadcrumb を 1 階層しか出さない → ✅ 階層が浅くても現在地は明示する`}),`
`,(0,w.jsx)(t.li,{children:`❌ Footer のリンクをアプリ内で違える → ✅ 全ページで同じリンク群を維持`}),`
`]})]})}function C(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,w.jsx)(t,{...e,children:(0,w.jsx)(S,{...e})}):S(e)}var w;e((()=>{w=t(),c(),a(),p(),g(),v(),x()}))();export{C as default};