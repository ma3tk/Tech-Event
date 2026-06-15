import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-DSdAlscu.js";import{t as d}from"./mdx-react-shim-DaZ3R4gt.js";import{AsLink as f,Default as p,WithCount as m,n as h,t as g}from"./TagPill.stories-DmHMhTfW.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:g}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsxs)(u,{children:[`タグ表示用の `,(0,y.jsx)(t.strong,{children:`角丸ピル`}),`。Badge ベースだが、フィルタトグル / 削除可能 / リンク化の派生を持つドメイン特化 molecule。`]}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/components/tag-pill.md`}),`。
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
`,(0,y.jsxs)(t.p,{children:[`タグ表示用の `,(0,y.jsx)(t.strong,{children:`角丸ピル`}),`。Badge ベースだが、フィルタトグル / 削除可能 / リンク化の派生を持つドメイン特化 molecule。`]}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか`,children:`2. いつ使うか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`イベント / グループ / ユーザーの `,(0,y.jsx)(t.strong,{children:`タグ表示`})]}),`
`,(0,y.jsx)(t.li,{children:`検索フィルタ (選択可能なタグ群)`}),`
`,(0,y.jsx)(t.li,{children:`タグ入力フォーム (選択済みの表示 + 削除ボタン付き)`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか`,children:`3. いつ使わないか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`状態表示 → `,(0,y.jsx)(t.a,{href:`./event-status-badge.md`,children:`EventStatusBadge`})]}),`
`,(0,y.jsxs)(t.li,{children:[`カウント → `,(0,y.jsx)(t.a,{href:`../ui/badge.md`,children:`Badge`})]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-バリアント`,children:`4. バリアント`}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->`}),`
`,(0,y.jsxs)(t.table,{children:[(0,y.jsx)(t.thead,{children:(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.th,{children:`variant`}),(0,y.jsx)(t.th,{children:`用途`})]})}),(0,y.jsxs)(t.tbody,{children:[(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`default`})}),(0,y.jsx)(t.td,{children:`静的表示`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`filter`})}),(0,y.jsx)(t.td,{children:`クリックで絞り込み Link`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`selectable`})}),(0,y.jsx)(t.td,{children:`トグル選択 (aria-pressed)`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`outline`})}),(0,y.jsx)(t.td,{children:`フラットな代替`})]})]})]}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED END: variants -->`}),`
`,(0,y.jsx)(t.h2,{id:`5-使用例`,children:`5. 使用例`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import { TagPill } from "@tech-event/shared-ui-composite";

<div className="flex flex-wrap gap-1">
  {event.tags.map((t) => (
    <TagPill key={t} variant="filter" href={\`/explore?tag=\${t}\`}>
      {t}
    </TagPill>
  ))}
</div>
`})}),`
`,(0,y.jsx)(t.h2,{id:`6-アクセシビリティ`,children:`6. アクセシビリティ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`selectable は `,(0,y.jsx)(t.code,{children:`aria-pressed`})]}),`
`,(0,y.jsxs)(t.li,{children:[`リンクは `,(0,y.jsx)(t.code,{children:`<Link>`}),` で`]}),`
`,(0,y.jsxs)(t.li,{children:[`削除ボタンは `,(0,y.jsx)(t.code,{children:`aria-label="○○を削除"`})]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`7-アンチパターン`,children:`7. アンチパターン`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`❌ 任意 hex → ✅ variant prop`}),`
`,(0,y.jsx)(t.li,{children:`❌ クリック可能なのに非リンク → ✅ filter は Link で`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`8-関連`,children:`8. 関連`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../ui/badge.md`,children:`Badge`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./event-status-badge.md`,children:`EventStatusBadge`})}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`9-変更履歴`,children:`9. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース、4 variant`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),h()}))();export{v as default};