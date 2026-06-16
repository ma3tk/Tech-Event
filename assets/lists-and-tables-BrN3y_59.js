import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,d as r,n as i,p as a,s as o,u as s}from"./blocks-CxcFbYk8.js";import{t as c}from"./mdx-react-shim-C2WkHrtd.js";import{Default as l,ListOfRows as u,Rank1 as d,Rank2 as f,Rank3 as p,Ranking as m,WithThumbnail as h,n as g}from"./EventListRow.stories-GREwTc7j.js";import{Default as _,n as v}from"./EventTimeline.stories-7kTDp7Gp.js";import{Default as y,FirstPage as b,LastPage as x,ManyPages as S,n as C}from"./Pagination.stories-BqrRLsq0.js";function w(e){let t={blockquote:`blockquote`,code:`code`,h2:`h2`,li:`li`,p:`p`,ul:`ul`,...n(),...e.components};return(0,E.jsxs)(E.Fragment,{children:[(0,E.jsx)(o,{title:`Blocks/Lists and Tables`}),`
`,(0,E.jsx)(r,{children:`Lists & Tables`}),`
`,(0,E.jsx)(s,{children:`イベント / グループの一覧表示。EventListRow による 1 行 88-96px の高密度フォーマット、月見出しグルーピング、ランキング、ページネーションを統合する。`}),`
`,(0,E.jsxs)(t.blockquote,{children:[`
`,(0,E.jsxs)(t.p,{children:[`一次資料: `,(0,E.jsx)(t.code,{children:`docs/catalog/blocks/lists-and-tables.md`}),`。`]}),`
`]}),`
`,(0,E.jsx)(t.h2,{id:`eventlistrow-default-compact-1-行`,children:`EventListRow default (compact 1 行)`}),`
`,(0,E.jsx)(i,{of:l}),`
`,(0,E.jsx)(t.h2,{id:`eventlistrow-with-thumbnail`,children:`EventListRow with thumbnail`}),`
`,(0,E.jsx)(i,{of:h}),`
`,(0,E.jsx)(t.h2,{id:`eventlistrow-ランキング-top-3-強調`,children:`EventListRow ランキング (top 3 強調)`}),`
`,(0,E.jsx)(i,{of:m}),`
`,(0,E.jsx)(t.h2,{id:`eventlistrow-rank1--rank2--rank3-個別`,children:`EventListRow rank=1 / rank=2 / rank=3 個別`}),`
`,(0,E.jsx)(i,{of:d}),`
`,(0,E.jsx)(i,{of:f}),`
`,(0,E.jsx)(i,{of:p}),`
`,(0,E.jsx)(t.h2,{id:`listofrows-連続表示`,children:`ListOfRows (連続表示)`}),`
`,(0,E.jsx)(i,{of:u}),`
`,(0,E.jsx)(t.h2,{id:`eventtimeline-luma-風-月見出し自動グルーピング`,children:`EventTimeline (Luma 風 月見出し自動グルーピング)`}),`
`,(0,E.jsx)(i,{of:_}),`
`,(0,E.jsx)(t.h2,{id:`pagination-default--first--last--manypages`,children:`Pagination (Default / First / Last / ManyPages)`}),`
`,(0,E.jsx)(i,{of:y}),`
`,(0,E.jsx)(i,{of:b}),`
`,(0,E.jsx)(i,{of:x}),`
`,(0,E.jsx)(i,{of:S}),`
`,(0,E.jsx)(t.h2,{id:`アンチパターン`,children:`アンチパターン`}),`
`,(0,E.jsxs)(t.ul,{children:[`
`,(0,E.jsx)(t.li,{children:`❌ 行高を 64px 未満にする → ✅ タッチ領域 (44×44) を確保しつつ密度を保つ`}),`
`,(0,E.jsx)(t.li,{children:`❌ 1 行に 10+ 項目を並べる → ✅ タイトル / 日時 / 会場 / 参加者の 4 要素に絞る (connpass 寄り)`}),`
`,(0,E.jsx)(t.li,{children:`❌ ページャを Sticky にしない → ✅ 大画面では Sticky で操作距離を短くしてもよい (オプション)`}),`
`]})]})}function T(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,E.jsx)(t,{...e,children:(0,E.jsx)(w,{...e})}):w(e)}var E;e((()=>{E=t(),c(),a(),g(),v(),C()}))();export{T as default};