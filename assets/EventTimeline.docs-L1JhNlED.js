import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-C7BBlj3r.js";import{t as d}from"./mdx-react-shim-B68M4Igu.js";import{Default as f,Empty as p,WithGap as m,n as h,t as g}from"./EventTimeline.stories-Ch4kDCZu.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:g}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsxs)(u,{children:[`Luma 風の `,(0,y.jsx)(t.strong,{children:`月見出し自動グルーピング タイムライン`}),`。内部で EventListRow compact 表示を使い、stickyTopPx で月見出しの上端調整が可能。`]}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/components/event-timeline.md`}),`。
ここは `,(0,y.jsx)(t.strong,{children:`言語化テキスト + 実物 Live Preview`}),` を 1 ページに統合した shadcn/ui スタイルの docs。
元の `,(0,y.jsx)(t.code,{children:`.md`}),` ファイルが source of truth、本 MDX は同内容を Storybook 上でレンダリングする視覚層。`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`ライブプレビュー-canvas`,children:`ライブプレビュー (Canvas)`}),`
`,(0,y.jsx)(s,{of:f}),`
`,(0,y.jsx)(s,{of:m}),`
`,(0,y.jsx)(s,{of:p}),`
`,(0,y.jsx)(t.h2,{id:`primary`,children:`Primary`}),`
`,(0,y.jsx)(r,{}),`
`,(0,y.jsx)(t.h2,{id:`props-api`,children:`Props (API)`}),`
`,(0,y.jsx)(a,{}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`1-目的`,children:`1. 目的`}),`
`,(0,y.jsxs)(t.p,{children:[`Luma 風の `,(0,y.jsx)(t.strong,{children:`月見出し自動グルーピング タイムライン`}),`。内部で `,(0,y.jsx)(t.a,{href:`./event-list-row.md`,children:`EventListRow`}),` compact 表示を使い、`,(0,y.jsx)(t.code,{children:`stickyTopPx`}),` で月見出しの上端調整が可能。`]}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか`,children:`2. いつ使うか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`グループページの「過去のイベント」`}),`
`,(0,y.jsxs)(t.li,{children:[`カレンダーページ (`,(0,y.jsx)(t.code,{children:`/calendar/[slug]`}),`)`]}),`
`,(0,y.jsx)(t.li,{children:`ユーザープロフィールの「主催履歴」「参加履歴」`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか`,children:`3. いつ使わないか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`グリッド表示 → `,(0,y.jsx)(t.a,{href:`./event-card.md`,children:`EventCard`}),` grid`]}),`
`,(0,y.jsxs)(t.li,{children:[`検索結果 (関連順) → `,(0,y.jsx)(t.a,{href:`./event-list-row.md`,children:`EventListRow`}),` 単独`]}),`
`,(0,y.jsx)(t.li,{children:`1 件のみ表示 → カードで十分`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-構造`,children:`4. 構造`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{children:`2026 年 6 月       ← 月見出し (sticky)
├ EventListRow    
├ EventListRow    
└ EventListRow    
2026 年 5 月       ← 月見出し
├ EventListRow    
└ EventListRow    
`})}),`
`,(0,y.jsx)(t.h2,{id:`5-アクセシビリティ`,children:`5. アクセシビリティ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`月見出しは `,(0,y.jsx)(t.code,{children:`h2`})]}),`
`,(0,y.jsx)(t.li,{children:`sticky 表示時もコントラスト維持`}),`
`,(0,y.jsxs)(t.li,{children:[`リストは `,(0,y.jsx)(t.code,{children:`<ul role="list">`})]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`6-使用例`,children:`6. 使用例`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`<EventTimeline events={events} stickyTopPx={64} />
`})}),`
`,(0,y.jsx)(t.h2,{id:`7-関連`,children:`7. 関連`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./event-list-row.md`,children:`EventListRow`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../blocks/lists-and-tables.md`,children:`blocks/lists-and-tables.md`})}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`8-変更履歴`,children:`8. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース、月見出し自動グルーピング`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),h()}))();export{v as default};