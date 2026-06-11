import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-C7BBlj3r.js";import{t as d}from"./mdx-react-shim-B68M4Igu.js";import{Standard as f,StandardJoined as p,StandardNoLogo as m,n as h,t as g}from"./GroupCard.stories-DIWkxpCH.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:g}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsxs)(u,{children:[`グループを `,(0,y.jsx)(t.strong,{children:`カード形式`}),` で表示。standard / sidebar / compact の 3 variant。参加ボタン付き。`]}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/components/group-card.md`}),`。
ここは `,(0,y.jsx)(t.strong,{children:`言語化テキスト + 実物 Live Preview`}),` を 1 ページに統合した shadcn/ui スタイルの docs。
元の `,(0,y.jsx)(t.code,{children:`.md`}),` ファイルが source of truth、本 MDX は同内容を Storybook 上でレンダリングする視覚層。`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`ライブプレビュー-canvas`,children:`ライブプレビュー (Canvas)`}),`
`,(0,y.jsx)(s,{of:f}),`
`,(0,y.jsx)(s,{of:p}),`
`,(0,y.jsx)(s,{of:m}),`
`,(0,y.jsx)(t.h2,{id:`primary`,children:`Primary`}),`
`,(0,y.jsx)(r,{}),`
`,(0,y.jsx)(t.h2,{id:`props-api`,children:`Props (API)`}),`
`,(0,y.jsx)(a,{}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`1-目的`,children:`1. 目的`}),`
`,(0,y.jsxs)(t.p,{children:[`グループを `,(0,y.jsx)(t.strong,{children:`カード形式`}),` で表示。`,(0,y.jsx)(t.code,{children:`standard`}),` / `,(0,y.jsx)(t.code,{children:`sidebar`}),` / `,(0,y.jsx)(t.code,{children:`compact`}),` の 3 variant。参加ボタン付き。`]}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか`,children:`2. いつ使うか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`グループ一覧 (`,(0,y.jsx)(t.code,{children:`/groups`}),`)`]}),`
`,(0,y.jsx)(t.li,{children:`ユーザープロフィールの「所属グループ」`}),`
`,(0,y.jsx)(t.li,{children:`イベント詳細サイドバーの「主催グループ」 (sidebar variant)`}),`
`,(0,y.jsx)(t.li,{children:`関連グループのコンパクト表示 (compact)`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか`,children:`3. いつ使わないか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`グループ単独のヘッダー → 専用 hero`}),`
`,(0,y.jsx)(t.li,{children:`1 行のリスト → 別 component`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-バリアント`,children:`4. バリアント`}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->`}),`
`,(0,y.jsxs)(t.table,{children:[(0,y.jsx)(t.thead,{children:(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.th,{children:`variant`}),(0,y.jsx)(t.th,{children:`用途`})]})}),(0,y.jsxs)(t.tbody,{children:[(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`standard`})}),(0,y.jsx)(t.td,{children:`一覧グリッド`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`sidebar`})}),(0,y.jsx)(t.td,{children:`サイドバーの強調カード`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`compact`})}),(0,y.jsx)(t.td,{children:`関連グループの小カード`})]})]})]}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED END: variants -->`}),`
`,(0,y.jsx)(t.h2,{id:`5-アクセシビリティ`,children:`5. アクセシビリティ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`カード全体は `,(0,y.jsx)(t.code,{children:`<Link>`}),` でラップ`]}),`
`,(0,y.jsx)(t.li,{children:`参加ボタンは外側 (別 tab stop)`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`6-使用例`,children:`6. 使用例`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import { GroupCard } from "@tech-event/shared-ui-composite";

<GroupCard group={group} variant="standard" />
`})}),`
`,(0,y.jsx)(t.h2,{id:`7-関連`,children:`7. 関連`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../ui/card.md`,children:`Card`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./event-card.md`,children:`EventCard`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../blocks/cards.md`,children:`blocks/cards.md`})}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`8-変更履歴`,children:`8. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース、3 variant`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),h()}))();export{v as default};