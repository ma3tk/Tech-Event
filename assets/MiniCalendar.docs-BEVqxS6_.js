import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-C7BBlj3r.js";import{t as d}from"./mdx-react-shim-B68M4Igu.js";import{ManyEvents as f,NoEvents as p,SpecificMonth as m,n as h,t as g}from"./MiniCalendar.stories-DmGi6Cu_.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:g}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsxs)(u,{children:[`サイドバー用の `,(0,y.jsx)(t.strong,{children:`ミニカレンダー`}),`。開催日にドット表示でイベント有無を示す。date-fns ベース。`]}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/components/mini-calendar.md`}),`。
ここは `,(0,y.jsx)(t.strong,{children:`言語化テキスト + 実物 Live Preview`}),` を 1 ページに統合した shadcn/ui スタイルの docs。
元の `,(0,y.jsx)(t.code,{children:`.md`}),` ファイルが source of truth、本 MDX は同内容を Storybook 上でレンダリングする視覚層。`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`ライブプレビュー-canvas`,children:`ライブプレビュー (Canvas)`}),`
`,(0,y.jsx)(s,{of:p}),`
`,(0,y.jsx)(s,{of:f}),`
`,(0,y.jsx)(s,{of:m}),`
`,(0,y.jsx)(t.h2,{id:`primary`,children:`Primary`}),`
`,(0,y.jsx)(r,{}),`
`,(0,y.jsx)(t.h2,{id:`props-api`,children:`Props (API)`}),`
`,(0,y.jsx)(a,{}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`1-目的`,children:`1. 目的`}),`
`,(0,y.jsxs)(t.p,{children:[`サイドバー用の `,(0,y.jsx)(t.strong,{children:`ミニカレンダー`}),`。開催日にドット表示でイベント有無を示す。`,(0,y.jsx)(t.code,{children:`date-fns`}),` ベース。`]}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか`,children:`2. いつ使うか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`グループページのサイドバー`}),`
`,(0,y.jsx)(t.li,{children:`ユーザープロフィールのサイドバー`}),`
`,(0,y.jsx)(t.li,{children:`カレンダーページのナビ`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか`,children:`3. いつ使わないか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`大きなカレンダー UI → 別 component`}),`
`,(0,y.jsx)(t.li,{children:`日付選択 → Calendar (将来 atom 化予定)`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-アクセシビリティ`,children:`4. アクセシビリティ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`<table role="grid">`}),` (date-fns 慣用)`]}),`
`,(0,y.jsxs)(t.li,{children:[`開催日には `,(0,y.jsx)(t.code,{children:`aria-label`}),` を補強`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`5-使用例`,children:`5. 使用例`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`<MiniCalendar
  eventDates={dates}
  onSelectDate={(d) => router.push(\`/calendar?date=\${d}\`)}
/>
`})}),`
`,(0,y.jsx)(t.h2,{id:`6-関連`,children:`6. 関連`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`../ui/card.md`,children:`Card`}),` (サイドバー枠)`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`7-変更履歴`,children:`7. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),h()}))();export{v as default};