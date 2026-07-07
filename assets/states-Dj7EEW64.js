import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,d as r,n as i,p as a,s as o,u as s}from"./blocks-DyqvvloQ.js";import{t as c}from"./mdx-react-shim-Co4r-mY_.js";import{Default as l,Disabled as u,Loading as d,n as f}from"./button.stories-B4SeEpoP.js";import{Default as p,WithAction as m,n as h}from"./empty-state.stories-DAj72E53.js";import{Default as g,WithRetry as _,n as v}from"./error-state.stories-D3LFPLX5.js";import{Spinner as y,t as b}from"./loading-state.stories-CmbY54hi.js";import{EventCard as x,t as S}from"./skeleton.stories-CQs7DqUI.js";import{Invalid as C,t as w}from"./input.stories-Cmgyl-ug.js";function T(e){let t={blockquote:`blockquote`,code:`code`,h2:`h2`,li:`li`,p:`p`,ul:`ul`,...n(),...e.components};return(0,D.jsxs)(D.Fragment,{children:[(0,D.jsx)(o,{title:`Foundations/States`}),`
`,(0,D.jsx)(r,{children:`States`}),`
`,(0,D.jsx)(s,{children:`全コンポーネントが取り得る 9 状態 (default / hover / focus / active / disabled / loading / empty / error / selected) を実物で示す。`}),`
`,(0,D.jsxs)(t.blockquote,{children:[`
`,(0,D.jsxs)(t.p,{children:[`一次資料: `,(0,D.jsx)(t.code,{children:`docs/catalog/foundations/states.md`}),`。`]}),`
`]}),`
`,(0,D.jsx)(t.h2,{id:`default--disabled--loading-button-で代表`,children:`default / disabled / loading (Button で代表)`}),`
`,(0,D.jsx)(i,{of:l}),`
`,(0,D.jsx)(i,{of:u}),`
`,(0,D.jsx)(i,{of:d}),`
`,(0,D.jsx)(t.h2,{id:`error-aria-invalid-連動の-input`,children:`error (aria-invalid 連動の Input)`}),`
`,(0,D.jsx)(i,{of:C}),`
`,(0,D.jsx)(t.h2,{id:`empty-emptystate`,children:`empty (EmptyState)`}),`
`,(0,D.jsx)(i,{of:p}),`
`,(0,D.jsx)(i,{of:m}),`
`,(0,D.jsx)(t.h2,{id:`error-errorstate`,children:`error (ErrorState)`}),`
`,(0,D.jsx)(i,{of:g}),`
`,(0,D.jsx)(i,{of:_}),`
`,(0,D.jsx)(t.h2,{id:`loading-loadingstate--skeleton`,children:`loading (LoadingState / Skeleton)`}),`
`,(0,D.jsx)(i,{of:y}),`
`,(0,D.jsx)(i,{of:x}),`
`,(0,D.jsx)(t.h2,{id:`規約`,children:`規約`}),`
`,(0,D.jsxs)(t.ul,{children:[`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.code,{children:`:focus-visible`}),` で常時可視のフォーカスリング (`,(0,D.jsx)(t.code,{children:`outline 2px brand-orange offset 2px`}),`)`]}),`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.code,{children:`disabled`}),` は `,(0,D.jsx)(t.code,{children:`opacity-50 pointer-events-none`}),` + `,(0,D.jsx)(t.code,{children:`aria-disabled="true"`}),` 併記`]}),`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.code,{children:`loading`}),` は spinner + `,(0,D.jsx)(t.code,{children:`aria-busy="true"`}),`、中身は不可視化せず CLS 防止`]}),`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.code,{children:`empty`}),` は理由 + 次のアクションを必ず添える`]}),`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.code,{children:`error`}),` は原因 + 対処 (retry など) を添える`]}),`
`]}),`
`,(0,D.jsxs)(t.p,{children:[`詳細は `,(0,D.jsx)(t.code,{children:`docs/catalog/foundations/states.md`}),`。`]})]})}function E(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,D.jsx)(t,{...e,children:(0,D.jsx)(T,{...e})}):T(e)}var D;e((()=>{D=t(),c(),a(),f(),w(),h(),v(),b(),S()}))();export{E as default};