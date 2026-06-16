import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{T as i,d as a,n as o,p as s,s as c,u as l}from"./blocks-DxazclGI.js";import{t as u}from"./mdx-react-shim-CQBio_OA.js";import{ListDefault as d,n as f}from"./EventCard.stories-D9vOu9lW.js";import{Standard as p,n as ee}from"./GroupCard.stories-BG0vstc7.js";import{Basic as te,n as ne}from"./card.stories-29jiKUpq.js";import{Default as re,n as ie}from"./button.stories-B4SeEpoP.js";import{Default as ae,n as oe}from"./EventStatusBadge.stories-DtowTGh2.js";import{Default as se,t as m}from"./toast.stories-BqD2SugF.js";import{Default as h,n as g}from"./empty-state.stories-DFdNvHkA.js";import{Default as _,n as v}from"./error-state.stories-Nn4-TxnD.js";import{Spinner as y,t as b}from"./loading-state.stories-C8XrRKDl.js";import{Default as x,t as S}from"./skeleton.stories-CQs7DqUI.js";import{WithValidation as C,n as w}from"./form.stories-CwuXvvMZ.js";import{Default as T,t as E}from"./input.stories-edSRAvSw.js";import{Default as D,t as O}from"./textarea.stories-vI8DSnAa.js";import{Default as k,n as A}from"./checkbox.stories-sNZWc1Vy.js";import{Default as j,t as M}from"./radio-group.stories-CxOwfr_s.js";import{Default as N,t as P}from"./select.stories-Ds520a1i.js";import{Default as F,t as I}from"./switch.stories-C85lvTo4.js";import{Default as L,n as R}from"./EventListRow.stories-GMpkZXK6.js";import{Default as z,n as B}from"./EventTimeline.stories-D49XIFrU.js";import{Default as V,n as H}from"./Pagination.stories-DLDjqTeR.js";import{LoggedOut as U,n as W}from"./Header.stories-OWhd3ZX7.js";import{Default as G,n as K}from"./Breadcrumb.stories-BJEV8jbT.js";import{Default as ce,n as le}from"./Footer.stories-B6-9kgku.js";import{Header as ue,n as de}from"./SearchBox.stories-Cxx0fqYJ.js";import{WithImage as fe,n as q}from"./avatar.stories-DeVyp_FI.js";import{Default as pe,n as me}from"./badge.stories-D469slzI.js";import{Default as he,n as ge}from"./dialog.stories-DtYMGfGe.js";import{Default as _e,n as ve}from"./dropdown-menu.stories-CS4ZrjE1.js";import{Default as ye,t as be}from"./label.stories-DMt0pJCP.js";import{Default as xe,t as Se}from"./popover.stories-tlCkjq54.js";import{Horizontal as Ce,t as we}from"./separator.stories-DLYpUauh.js";import{Right as Te,t as Ee}from"./sheet.stories-Bb0rN2kp.js";import{Default as De,t as Oe}from"./tabs.stories-DKLD-F10.js";import{Default as ke,t as Ae}from"./tooltip.stories-Cp_YXlwY.js";import{Pair as je,n as Me}from"./HostAvatarStack.stories-BbVqz9TU.js";import{NoEvents as Ne,n as Pe}from"./MiniCalendar.stories-DoAl0BdI.js";import{Default as Fe,n as Ie}from"./ParticipantBadge.stories-D48fqvAD.js";import{Default as Le,n as Re}from"./TagPill.stories-9CBspMTK.js";function ze(e){if(e)return e;{let e=window.__TE_FEEDBACK_API_BASE__;if(e)return e}return`http://localhost:3000`}function J({component:e,apiBase:t}){let[n,r]=(0,X.useState)(0),[i,a]=(0,X.useState)(0),[o,s]=(0,X.useState)(``),[c,l]=(0,X.useState)(`idle`),[u,d]=(0,X.useState)(``),f=i||n;async function p(){if(n<1){l(`error`),d(`評価 (★) を選んでください。`);return}l(`submitting`),d(``);try{let i=await fetch(`${ze(t)}/api/component-feedback`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({component:e,rating:n,comment:o.trim()||void 0,sourceUrl:window.location.href})});if(!i.ok){let e=await i.json().catch(()=>({}));throw Error(e.message??e.error??`HTTP ${i.status}`)}l(`success`),d(`フィードバックありがとうございます！`),r(0),s(``)}catch(e){l(`error`),d(e instanceof Error?`送信に失敗しました: ${e.message}`:`送信に失敗しました。`)}}return c===`success`?(0,Y.jsxs)(`div`,{"data-testid":`component-feedback`,style:{marginTop:8,padding:`10px 14px`,borderRadius:8,border:`1px solid var(--color-border, #e5e5e5)`,background:`var(--color-status-open-bg, #f0fdf4)`,color:`var(--color-status-open-fg, #166534)`,fontSize:13},children:[`✓ `,u,` `,(0,Y.jsx)(`button`,{type:`button`,onClick:()=>{l(`idle`),d(``)},style:{marginLeft:8,textDecoration:`underline`,color:`inherit`,background:`none`,border:`none`,cursor:`pointer`,fontSize:13},children:`もう一度送る`})]}):(0,Y.jsxs)(`form`,{"data-testid":`component-feedback`,"data-component":e,onSubmit:e=>{e.preventDefault(),p()},style:{marginTop:8,padding:`10px 14px`,borderRadius:8,border:`1px solid var(--color-border, #e5e5e5)`,background:`var(--color-surface-muted, #fafafa)`,display:`flex`,flexDirection:`column`,gap:8,fontSize:13},children:[(0,Y.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:8},children:[(0,Y.jsxs)(`span`,{style:{fontWeight:600},children:[e,` のフィードバック`]}),(0,Y.jsx)(`span`,{"aria-live":`polite`,style:{opacity:.7},children:f?Z[f]:`評価を選択`})]}),(0,Y.jsx)(`div`,{role:`radiogroup`,"aria-label":`${e} の評価`,style:{display:`flex`,gap:2},children:[1,2,3,4,5].map(e=>(0,Y.jsx)(`button`,{type:`button`,role:`radio`,"aria-checked":n===e,"aria-label":`${e} / 5 (${Z[e]})`,onMouseEnter:()=>a(e),onMouseLeave:()=>a(0),onClick:()=>r(e),style:{background:`none`,border:`none`,cursor:`pointer`,fontSize:22,lineHeight:1,padding:`0 2px`,color:e<=f?`#f59e0b`:`var(--color-border-strong, #cbd5e1)`},children:`★`},e))}),(0,Y.jsx)(`textarea`,{value:o,onChange:e=>s(e.target.value),placeholder:`改善点・気づいたこと (任意)`,rows:2,maxLength:2e3,style:{resize:`vertical`,padding:`6px 8px`,borderRadius:6,border:`1px solid var(--color-border, #e5e5e5)`,background:`var(--color-surface, #fff)`,color:`var(--color-foreground, #111)`,fontSize:13,fontFamily:`inherit`}}),(0,Y.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:10},children:[(0,Y.jsx)(`button`,{type:`submit`,disabled:c===`submitting`,style:{padding:`6px 14px`,borderRadius:6,border:`none`,background:`var(--color-brand-orange, #c2410c)`,color:`#fff`,fontWeight:600,fontSize:13,cursor:c===`submitting`?`default`:`pointer`,opacity:c===`submitting`?.6:1},children:c===`submitting`?`送信中…`:`送信`}),u&&(0,Y.jsx)(`span`,{role:c===`error`?`alert`:void 0,style:{color:c===`error`?`var(--color-status-closed-fg, #b91c1c)`:`inherit`},children:u})]})]})}var Y,X,Z,Be=t((()=>{Y=r(),X=e(n()),Z=[``,`悪い`,`いまいち`,`普通`,`良い`,`最高`],J.__docgenInfo={description:``,methods:[],displayName:`ComponentFeedback`,props:{component:{required:!0,tsType:{name:`string`},description:`対象コンポーネント名 (Storybook 表示名と一致させる)。`},apiBase:{required:!1,tsType:{name:`string`},description:`送信先 Next アプリの origin。既定 http://localhost:3000。`}}}}));function Q(e){let t={blockquote:`blockquote`,code:`code`,h2:`h2`,h3:`h3`,hr:`hr`,p:`p`,strong:`strong`,...i(),...e.components};return(0,$.jsxs)($.Fragment,{children:[`
`,`
`,`
`,`
`,(0,$.jsx)(c,{title:`Design System/Gallery`}),`
`,(0,$.jsx)(a,{children:`Gallery — 全コンポーネント一覧`}),`
`,(0,$.jsx)(l,{children:`UI primitives 24 + Composite components 14 を 1 ページに実物レンダリング + フィードバック投稿`}),`
`,(0,$.jsxs)(t.p,{children:[(0,$.jsx)(t.code,{children:`tech-event`}),` の全コンポーネントの代表 Story を 1 ページに並べた視覚カタログです。
各プレビューは対応する Story を `,(0,$.jsx)(t.code,{children:`<Canvas of={...}>`}),` で埋め込んでいるため、Story を更新すれば
ここも自動で同期します。個別の variant / props / a11y は各コンポーネントの `,(0,$.jsx)(t.strong,{children:`Docs`}),` ページを参照してください。`]}),`
`,(0,$.jsxs)(t.p,{children:[`各コンポーネントの下には `,(0,$.jsx)(t.strong,{children:`フィードバック投稿フォーム`}),`があり、★ 評価 + 任意コメントを送信できます。
投稿は `,(0,$.jsx)(t.code,{children:`/api/component-feedback`}),` に保存され、`,(0,$.jsx)(t.code,{children:`/admin/component-feedback`}),` で集計・トリアージして
デザインシステムの改善に回します (DS 改善ループ)。`]}),`
`,(0,$.jsxs)(t.blockquote,{children:[`
`,(0,$.jsxs)(t.p,{children:[`送信先は dev の Next アプリ (`,(0,$.jsx)(t.code,{children:`http://localhost:3000`}),`) が既定です。Storybook を別ホストで開く場合は
`,(0,$.jsx)(t.code,{children:`window.__TE_FEEDBACK_API_BASE__`}),` に Next アプリの origin を設定してください。
テーマ切替 (light / dark / high-contrast) はツールバーの 🎨 から全コンポーネントへ一括適用できます。`]}),`
`]}),`
`,(0,$.jsx)(t.hr,{}),`
`,(0,$.jsx)(t.h2,{id:`ui-primitives-24`,children:`UI primitives (24)`}),`
`,(0,$.jsxs)(t.p,{children:[(0,$.jsx)(t.code,{children:`libs/shared/ui/`}),` — Radix UI + CVA ベースの汎用部品。`]}),`
`,(0,$.jsx)(t.h3,{id:`avatar`,children:`Avatar`}),`
`,(0,$.jsx)(o,{of:fe}),`
`,(0,$.jsx)(J,{component:`Avatar`}),`
`,(0,$.jsx)(t.h3,{id:`badge`,children:`Badge`}),`
`,(0,$.jsx)(o,{of:pe}),`
`,(0,$.jsx)(J,{component:`Badge`}),`
`,(0,$.jsx)(t.h3,{id:`button`,children:`Button`}),`
`,(0,$.jsx)(o,{of:re}),`
`,(0,$.jsx)(J,{component:`Button`}),`
`,(0,$.jsx)(t.h3,{id:`card`,children:`Card`}),`
`,(0,$.jsx)(o,{of:te}),`
`,(0,$.jsx)(J,{component:`Card`}),`
`,(0,$.jsx)(t.h3,{id:`checkbox`,children:`Checkbox`}),`
`,(0,$.jsx)(o,{of:k}),`
`,(0,$.jsx)(J,{component:`Checkbox`}),`
`,(0,$.jsx)(t.h3,{id:`dialog`,children:`Dialog`}),`
`,(0,$.jsx)(o,{of:he}),`
`,(0,$.jsx)(J,{component:`Dialog`}),`
`,(0,$.jsx)(t.h3,{id:`dropdownmenu`,children:`DropdownMenu`}),`
`,(0,$.jsx)(o,{of:_e}),`
`,(0,$.jsx)(J,{component:`DropdownMenu`}),`
`,(0,$.jsx)(t.h3,{id:`emptystate`,children:`EmptyState`}),`
`,(0,$.jsx)(o,{of:h}),`
`,(0,$.jsx)(J,{component:`EmptyState`}),`
`,(0,$.jsx)(t.h3,{id:`errorstate`,children:`ErrorState`}),`
`,(0,$.jsx)(o,{of:_}),`
`,(0,$.jsx)(J,{component:`ErrorState`}),`
`,(0,$.jsx)(t.h3,{id:`form`,children:`Form`}),`
`,(0,$.jsx)(o,{of:C}),`
`,(0,$.jsx)(J,{component:`Form`}),`
`,(0,$.jsx)(t.h3,{id:`input`,children:`Input`}),`
`,(0,$.jsx)(o,{of:T}),`
`,(0,$.jsx)(J,{component:`Input`}),`
`,(0,$.jsx)(t.h3,{id:`label`,children:`Label`}),`
`,(0,$.jsx)(o,{of:ye}),`
`,(0,$.jsx)(J,{component:`Label`}),`
`,(0,$.jsx)(t.h3,{id:`loadingstate`,children:`LoadingState`}),`
`,(0,$.jsx)(o,{of:y}),`
`,(0,$.jsx)(J,{component:`LoadingState`}),`
`,(0,$.jsx)(t.h3,{id:`popover`,children:`Popover`}),`
`,(0,$.jsx)(o,{of:xe}),`
`,(0,$.jsx)(J,{component:`Popover`}),`
`,(0,$.jsx)(t.h3,{id:`radiogroup`,children:`RadioGroup`}),`
`,(0,$.jsx)(o,{of:j}),`
`,(0,$.jsx)(J,{component:`RadioGroup`}),`
`,(0,$.jsx)(t.h3,{id:`select`,children:`Select`}),`
`,(0,$.jsx)(o,{of:N}),`
`,(0,$.jsx)(J,{component:`Select`}),`
`,(0,$.jsx)(t.h3,{id:`separator`,children:`Separator`}),`
`,(0,$.jsx)(o,{of:Ce}),`
`,(0,$.jsx)(J,{component:`Separator`}),`
`,(0,$.jsx)(t.h3,{id:`sheet`,children:`Sheet`}),`
`,(0,$.jsx)(o,{of:Te}),`
`,(0,$.jsx)(J,{component:`Sheet`}),`
`,(0,$.jsx)(t.h3,{id:`skeleton`,children:`Skeleton`}),`
`,(0,$.jsx)(o,{of:x}),`
`,(0,$.jsx)(J,{component:`Skeleton`}),`
`,(0,$.jsx)(t.h3,{id:`switch`,children:`Switch`}),`
`,(0,$.jsx)(o,{of:F}),`
`,(0,$.jsx)(J,{component:`Switch`}),`
`,(0,$.jsx)(t.h3,{id:`tabs`,children:`Tabs`}),`
`,(0,$.jsx)(o,{of:De}),`
`,(0,$.jsx)(J,{component:`Tabs`}),`
`,(0,$.jsx)(t.h3,{id:`textarea`,children:`Textarea`}),`
`,(0,$.jsx)(o,{of:D}),`
`,(0,$.jsx)(J,{component:`Textarea`}),`
`,(0,$.jsx)(t.h3,{id:`toast`,children:`Toast`}),`
`,(0,$.jsx)(o,{of:se}),`
`,(0,$.jsx)(J,{component:`Toast`}),`
`,(0,$.jsx)(t.h3,{id:`tooltip`,children:`Tooltip`}),`
`,(0,$.jsx)(o,{of:ke}),`
`,(0,$.jsx)(J,{component:`Tooltip`}),`
`,(0,$.jsx)(t.hr,{}),`
`,(0,$.jsx)(t.h2,{id:`composite-components-14`,children:`Composite components (14)`}),`
`,(0,$.jsxs)(t.p,{children:[(0,$.jsx)(t.code,{children:`libs/shared/ui-composite/`}),` — primitives を組み合わせたドメイン特化部品。`]}),`
`,(0,$.jsx)(t.h3,{id:`breadcrumb`,children:`Breadcrumb`}),`
`,(0,$.jsx)(o,{of:G}),`
`,(0,$.jsx)(J,{component:`Breadcrumb`}),`
`,(0,$.jsx)(t.h3,{id:`eventcard`,children:`EventCard`}),`
`,(0,$.jsx)(o,{of:d}),`
`,(0,$.jsx)(J,{component:`EventCard`}),`
`,(0,$.jsx)(t.h3,{id:`eventlistrow`,children:`EventListRow`}),`
`,(0,$.jsx)(o,{of:L}),`
`,(0,$.jsx)(J,{component:`EventListRow`}),`
`,(0,$.jsx)(t.h3,{id:`eventstatusbadge`,children:`EventStatusBadge`}),`
`,(0,$.jsx)(o,{of:ae}),`
`,(0,$.jsx)(J,{component:`EventStatusBadge`}),`
`,(0,$.jsx)(t.h3,{id:`eventtimeline`,children:`EventTimeline`}),`
`,(0,$.jsx)(o,{of:z}),`
`,(0,$.jsx)(J,{component:`EventTimeline`}),`
`,(0,$.jsx)(t.h3,{id:`footer`,children:`Footer`}),`
`,(0,$.jsx)(o,{of:ce}),`
`,(0,$.jsx)(J,{component:`Footer`}),`
`,(0,$.jsx)(t.h3,{id:`groupcard`,children:`GroupCard`}),`
`,(0,$.jsx)(o,{of:p}),`
`,(0,$.jsx)(J,{component:`GroupCard`}),`
`,(0,$.jsx)(t.h3,{id:`header`,children:`Header`}),`
`,(0,$.jsx)(o,{of:U}),`
`,(0,$.jsx)(J,{component:`Header`}),`
`,(0,$.jsx)(t.h3,{id:`hostavatarstack`,children:`HostAvatarStack`}),`
`,(0,$.jsx)(o,{of:je}),`
`,(0,$.jsx)(J,{component:`HostAvatarStack`}),`
`,(0,$.jsx)(t.h3,{id:`minicalendar`,children:`MiniCalendar`}),`
`,(0,$.jsx)(o,{of:Ne}),`
`,(0,$.jsx)(J,{component:`MiniCalendar`}),`
`,(0,$.jsx)(t.h3,{id:`pagination`,children:`Pagination`}),`
`,(0,$.jsx)(o,{of:V}),`
`,(0,$.jsx)(J,{component:`Pagination`}),`
`,(0,$.jsx)(t.h3,{id:`participantbadge`,children:`ParticipantBadge`}),`
`,(0,$.jsx)(o,{of:Fe}),`
`,(0,$.jsx)(J,{component:`ParticipantBadge`}),`
`,(0,$.jsx)(t.h3,{id:`searchbox`,children:`SearchBox`}),`
`,(0,$.jsx)(o,{of:ue}),`
`,(0,$.jsx)(J,{component:`SearchBox`}),`
`,(0,$.jsx)(t.h3,{id:`tagpill`,children:`TagPill`}),`
`,(0,$.jsx)(o,{of:Le}),`
`,(0,$.jsx)(J,{component:`TagPill`})]})}function Ve(e={}){let{wrapper:t}={...i(),...e.components};return t?(0,$.jsx)(t,{...e,children:(0,$.jsx)(Q,{...e})}):Q(e)}var $;t((()=>{$=r(),u(),s(),Be(),q(),me(),ie(),ne(),A(),ge(),ve(),g(),v(),w(),E(),be(),b(),Se(),M(),P(),we(),Ee(),S(),I(),Oe(),O(),m(),Ae(),K(),f(),R(),oe(),B(),le(),ee(),W(),Me(),Pe(),H(),Ie(),de(),Re()}))();export{Ve as default};