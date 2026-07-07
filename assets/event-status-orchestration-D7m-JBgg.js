import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,d as r,n as i,p as a,s as o,u as s}from"./blocks-DyqvvloQ.js";import{t as c}from"./mdx-react-shim-Co4r-mY_.js";import{ListDefault as l,n as u}from"./EventCard.stories-gzqOmFuI.js";import{AllVariants as d,n as f}from"./button.stories-B4SeEpoP.js";import{AllStatuses as p,AllVariants as m,n as h}from"./EventStatusBadge.stories-D1veVVtj.js";function g(e){let t={blockquote:`blockquote`,code:`code`,h2:`h2`,li:`li`,p:`p`,strong:`strong`,ul:`ul`,...n(),...e.components};return(0,v.jsxs)(v.Fragment,{children:[(0,v.jsx)(o,{title:`Blocks/Event Status Orchestration`}),`
`,(0,v.jsx)(r,{children:`Event Status Orchestration`}),`
`,(0,v.jsxs)(s,{children:[`イベント 8 状態を全コンポーネント (Badge / Button / Card / Sticky CTA / Toast) で一貫表現するパターン。`,(0,v.jsx)(t.code,{children:`docs/catalog/blocks/event-status-orchestration.md`}),` source of truth。`]}),`
`,(0,v.jsxs)(t.blockquote,{children:[`
`,(0,v.jsxs)(t.p,{children:[`一次資料: `,(0,v.jsx)(t.code,{children:`docs/catalog/blocks/event-status-orchestration.md`}),`。
本 MDX は同内容の `,(0,v.jsx)(t.strong,{children:`実物プレビュー`}),` ページ。`]}),`
`]}),`
`,(0,v.jsx)(t.h2,{id:`8-ステータスのバッジ-全状態`,children:`8 ステータスのバッジ (全状態)`}),`
`,(0,v.jsx)(t.p,{children:`イベントは時間経過と申込数の関数で 8 状態を遷移する。色だけでなく必ずテキストを併記する (Design.md §10.1)。`}),`
`,(0,v.jsx)(i,{of:p}),`
`,(0,v.jsx)(t.h2,{id:`variant-別比較-subtle--solid--outline--dot`,children:`variant 別比較 (subtle / solid / outline / dot)`}),`
`,(0,v.jsx)(i,{of:m}),`
`,(0,v.jsx)(t.h2,{id:`status--cta-button-の対応`,children:`status × CTA Button の対応`}),`
`,(0,v.jsx)(t.p,{children:`8 状態それぞれに対応する Button variant が決まっている (catalog 「2. UI 表現の一貫性」表)。`}),`
`,(0,v.jsxs)(t.ul,{children:[`
`,(0,v.jsxs)(t.li,{children:[(0,v.jsx)(t.code,{children:`upcoming`}),` → `,(0,v.jsx)(t.code,{children:`disabled`}),` "公開前"`]}),`
`,(0,v.jsxs)(t.li,{children:[(0,v.jsx)(t.code,{children:`open`}),` → `,(0,v.jsx)(t.code,{children:`default`}),` "参加申込"`]}),`
`,(0,v.jsxs)(t.li,{children:[(0,v.jsx)(t.code,{children:`full`}),` → `,(0,v.jsx)(t.code,{children:`disabled`}),` "満員"`]}),`
`,(0,v.jsxs)(t.li,{children:[(0,v.jsx)(t.code,{children:`waitlist`}),` → `,(0,v.jsx)(t.code,{children:`secondary`}),` "補欠登録"`]}),`
`,(0,v.jsxs)(t.li,{children:[(0,v.jsx)(t.code,{children:`closed`}),` → `,(0,v.jsx)(t.code,{children:`disabled`}),` "申込終了"`]}),`
`,(0,v.jsxs)(t.li,{children:[(0,v.jsx)(t.code,{children:`ongoing`}),` → `,(0,v.jsx)(t.code,{children:`link`}),` "会場へ"`]}),`
`,(0,v.jsxs)(t.li,{children:[(0,v.jsx)(t.code,{children:`ended`}),` → `,(0,v.jsx)(t.code,{children:`ghost`}),` "アーカイブを見る"`]}),`
`,(0,v.jsxs)(t.li,{children:[(0,v.jsx)(t.code,{children:`cancelled`}),` → `,(0,v.jsx)(t.code,{children:`disabled`}),` "中止"`]}),`
`]}),`
`,(0,v.jsx)(i,{of:d}),`
`,(0,v.jsx)(t.h2,{id:`eventcard-上での見え方`,children:`EventCard 上での見え方`}),`
`,(0,v.jsx)(i,{of:l}),`
`,(0,v.jsx)(t.h2,{id:`アンチパターン`,children:`アンチパターン`}),`
`,(0,v.jsxs)(t.ul,{children:[`
`,(0,v.jsx)(t.li,{children:`色だけで status を伝える (色覚特性に配慮しない) → 必ずテキスト併記`}),`
`,(0,v.jsxs)(t.li,{children:[(0,v.jsx)(t.code,{children:`full`}),` 状態で primary CTA を出したまま `,(0,v.jsx)(t.code,{children:`disabled`}),` にしない → 押しても何も起きないボタンは UX 悪化`]}),`
`,(0,v.jsxs)(t.li,{children:[(0,v.jsx)(t.code,{children:`waitlist`}),` で `,(0,v.jsx)(t.code,{children:`default`}),` variant を使う → 補欠は補助操作なので `,(0,v.jsx)(t.code,{children:`secondary`})]}),`
`,(0,v.jsx)(t.li,{children:`status 遷移時に Toast を出さない → P1 のような「予定確定派」は通知に依存する`}),`
`]}),`
`,(0,v.jsx)(t.h2,{id:`関連`,children:`関連`}),`
`,(0,v.jsxs)(t.ul,{children:[`
`,(0,v.jsxs)(t.li,{children:[(0,v.jsx)(t.code,{children:`docs/catalog/blocks/event-status-orchestration.md`}),` — 全テキスト source of truth`]}),`
`,(0,v.jsxs)(t.li,{children:[(0,v.jsx)(t.code,{children:`docs/catalog/components/event-status-badge.md`}),` — Badge 単体仕様`]}),`
`,(0,v.jsxs)(t.li,{children:[(0,v.jsx)(t.code,{children:`docs/catalog/blocks/cta-matrix.md`}),` — CTA ラベルの状態別使い分け`]}),`
`,(0,v.jsxs)(t.li,{children:[(0,v.jsx)(t.code,{children:`docs/catalog/blocks/host-vs-participant-ui.md`}),` — 主催者 / 参加者で見せ方が変わる`]}),`
`]})]})}function _(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,v.jsx)(t,{...e,children:(0,v.jsx)(g,{...e})}):g(e)}var v;e((()=>{v=t(),c(),a(),h(),f(),u()}))();export{_ as default};