import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,d as r,n as i,p as a,s as o,u as s}from"./blocks-DxazclGI.js";import{t as c}from"./mdx-react-shim-CQBio_OA.js";import{WithValidation as l,n as u}from"./form.stories-CwuXvvMZ.js";import{Default as d,InGroupWithIcon as f,Invalid as p,t as m}from"./input.stories-edSRAvSw.js";import{Default as h,Invalid as g,WithLabel as _,t as v}from"./textarea.stories-vI8DSnAa.js";import{Group as y,n as b}from"./checkbox.stories-sNZWc1Vy.js";import{Default as x,t as S}from"./radio-group.stories-CxOwfr_s.js";import{Default as C,Grouped as w,t as T}from"./select.stories-Ds520a1i.js";import{SettingsList as E,t as D}from"./switch.stories-C85lvTo4.js";function O(e){let t={blockquote:`blockquote`,code:`code`,h2:`h2`,li:`li`,p:`p`,ul:`ul`,...n(),...e.components};return(0,A.jsxs)(A.Fragment,{children:[(0,A.jsx)(o,{title:`Blocks/Forms`}),`
`,(0,A.jsx)(r,{children:`Forms`}),`
`,(0,A.jsx)(s,{children:`フォーム入力の標準パターン。Form + Input / Textarea / Select / Checkbox / RadioGroup / Switch を Zod バリデーションと組み合わせる。`}),`
`,(0,A.jsxs)(t.blockquote,{children:[`
`,(0,A.jsxs)(t.p,{children:[`一次資料: `,(0,A.jsx)(t.code,{children:`docs/catalog/blocks/forms.md`}),`。`]}),`
`]}),`
`,(0,A.jsx)(t.h2,{id:`form-zod-バリデーション付き`,children:`Form (Zod バリデーション付き)`}),`
`,(0,A.jsx)(i,{of:l}),`
`,(0,A.jsx)(t.h2,{id:`input-default--with-icon--invalid`,children:`Input default / with icon / invalid`}),`
`,(0,A.jsx)(i,{of:d}),`
`,(0,A.jsx)(i,{of:f}),`
`,(0,A.jsx)(i,{of:p}),`
`,(0,A.jsx)(t.h2,{id:`textarea-default--with-label--invalid`,children:`Textarea default / with label / invalid`}),`
`,(0,A.jsx)(i,{of:h}),`
`,(0,A.jsx)(i,{of:_}),`
`,(0,A.jsx)(i,{of:g}),`
`,(0,A.jsx)(t.h2,{id:`select-default--grouped`,children:`Select default / grouped`}),`
`,(0,A.jsx)(i,{of:C}),`
`,(0,A.jsx)(i,{of:w}),`
`,(0,A.jsx)(t.h2,{id:`checkbox--radiogroup--switch`,children:`Checkbox / RadioGroup / Switch`}),`
`,(0,A.jsx)(i,{of:y}),`
`,(0,A.jsx)(i,{of:x}),`
`,(0,A.jsx)(i,{of:E}),`
`,(0,A.jsx)(t.h2,{id:`アンチパターン`,children:`アンチパターン`}),`
`,(0,A.jsxs)(t.ul,{children:[`
`,(0,A.jsx)(t.li,{children:`❌ サーバ側バリデーションを省く → ✅ クライアント + サーバの二重バリデ`}),`
`,(0,A.jsx)(t.li,{children:`❌ エラーメッセージを field の外に集約 → ✅ field 直下に specific な説明`}),`
`,(0,A.jsx)(t.li,{children:`❌ submit button を disabled で隠す → ✅ 押せるが警告 (aria-invalid 連動)`}),`
`]})]})}function k(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,A.jsx)(t,{...e,children:(0,A.jsx)(O,{...e})}):O(e)}var A;e((()=>{A=t(),c(),a(),u(),m(),v(),b(),S(),T(),D()}))();export{k as default};