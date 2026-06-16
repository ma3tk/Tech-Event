import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,d as r,n as i,p as a,s as o,u as s}from"./blocks-DxazclGI.js";import{t as c}from"./mdx-react-shim-CQBio_OA.js";import{ErrorVariant as l,Info as u,Success as d,Warning as f,WithAction as p,t as m}from"./toast.stories-BqD2SugF.js";import{SearchResultEmpty as h,WithAction as g,n as _}from"./empty-state.stories-DFdNvHkA.js";import{WithRetry as v,n as y}from"./error-state.stories-Nn4-TxnD.js";import{Dots as b,Spinner as x,t as S}from"./loading-state.stories-C8XrRKDl.js";import{EventCard as C,ProfileCard as w,t as T}from"./skeleton.stories-CQs7DqUI.js";function E(e){let t={blockquote:`blockquote`,code:`code`,h2:`h2`,li:`li`,p:`p`,ul:`ul`,...n(),...e.components};return(0,O.jsxs)(O.Fragment,{children:[(0,O.jsx)(o,{title:`Blocks/Feedback`}),`
`,(0,O.jsx)(r,{children:`Feedback`}),`
`,(0,O.jsx)(s,{children:`ユーザーへの状態通知パターン。Toast (一時) / Empty / Error / Loading / Skeleton を統一文言・色で運用する。`}),`
`,(0,O.jsxs)(t.blockquote,{children:[`
`,(0,O.jsxs)(t.p,{children:[`一次資料: `,(0,O.jsx)(t.code,{children:`docs/catalog/blocks/feedback.md`}),`。`]}),`
`]}),`
`,(0,O.jsx)(t.h2,{id:`toast-success--error--warning--info--withaction`,children:`Toast (Success / Error / Warning / Info / WithAction)`}),`
`,(0,O.jsx)(i,{of:d}),`
`,(0,O.jsx)(i,{of:l}),`
`,(0,O.jsx)(i,{of:f}),`
`,(0,O.jsx)(i,{of:u}),`
`,(0,O.jsx)(i,{of:p}),`
`,(0,O.jsx)(t.h2,{id:`emptystate-with-action`,children:`EmptyState (with action)`}),`
`,(0,O.jsx)(i,{of:g}),`
`,(0,O.jsx)(i,{of:h}),`
`,(0,O.jsx)(t.h2,{id:`errorstate-with-retry`,children:`ErrorState (with retry)`}),`
`,(0,O.jsx)(i,{of:v}),`
`,(0,O.jsx)(t.h2,{id:`loadingstate-spinner--dots`,children:`LoadingState (spinner / dots)`}),`
`,(0,O.jsx)(i,{of:x}),`
`,(0,O.jsx)(i,{of:b}),`
`,(0,O.jsx)(t.h2,{id:`skeleton-event-card`,children:`Skeleton (event card)`}),`
`,(0,O.jsx)(i,{of:C}),`
`,(0,O.jsx)(i,{of:w}),`
`,(0,O.jsx)(t.h2,{id:`アンチパターン`,children:`アンチパターン`}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsx)(t.li,{children:`❌ エラーメッセージに stacktrace をそのまま見せる → ✅ 原因と次のアクションを言語化`}),`
`,(0,O.jsx)(t.li,{children:`❌ Empty に「データなし」だけ表示 → ✅ 「なぜ空か / 何ができるか」を必ず添える`}),`
`,(0,O.jsx)(t.li,{children:`❌ Loading で背景を全画面ブロック → ✅ skeleton で意図を伝える (CLS 防止)`}),`
`,(0,O.jsx)(t.li,{children:`❌ Toast を 4 秒で出して 1 秒で消える → ✅ 5 秒以上、エラーは 8 秒`}),`
`]})]})}function D(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,O.jsx)(t,{...e,children:(0,O.jsx)(E,{...e})}):E(e)}var O;e((()=>{O=t(),c(),a(),m(),_(),y(),S(),T()}))();export{D as default};