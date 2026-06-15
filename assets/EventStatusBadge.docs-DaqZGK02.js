import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-CD-xvnSv.js";import{t as d}from"./mdx-react-shim-BWVm_lKV.js";import{AllStatuses as f,AllVariants as p,Default as m,n as h,t as g}from"./EventStatusBadge.stories-DM3n3kU7.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:g}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsxs)(u,{children:[`イベント `,(0,y.jsx)(t.strong,{children:`8 状態のステータスバッジ`}),` (open / full / waitlist / closed / cancelled / ended / upcoming / ongoing)。Design.md §10.1 / docs/design-system.md §2.5 の規約を厳守する唯一の表示コンポーネント。`]}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/components/event-status-badge.md`}),`。
ここは `,(0,y.jsx)(t.strong,{children:`言語化テキスト + 実物 Live Preview`}),` を 1 ページに統合した shadcn/ui スタイルの docs。
元の `,(0,y.jsx)(t.code,{children:`.md`}),` ファイルが source of truth、本 MDX は同内容を Storybook 上でレンダリングする視覚層。`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`ライブプレビュー-canvas`,children:`ライブプレビュー (Canvas)`}),`
`,(0,y.jsx)(s,{of:m}),`
`,(0,y.jsx)(s,{of:f}),`
`,(0,y.jsx)(s,{of:p}),`
`,(0,y.jsx)(t.h2,{id:`primary`,children:`Primary`}),`
`,(0,y.jsx)(r,{}),`
`,(0,y.jsx)(t.h2,{id:`props-api`,children:`Props (API)`}),`
`,(0,y.jsx)(a,{}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`1-目的`,children:`1. 目的`}),`
`,(0,y.jsxs)(t.p,{children:[`イベント `,(0,y.jsx)(t.strong,{children:`8 状態のステータスバッジ`}),` (open / full / waitlist / closed / cancelled / ended / upcoming / ongoing)。Design.md §10.1 / docs/design-system.md §2.5 の規約を厳守する唯一の表示コンポーネント。`]}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか`,children:`2. いつ使うか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`イベントカード / リスト行 / 詳細ページのステータス表示`}),`
`,(0,y.jsx)(t.li,{children:`ダッシュボードの一覧表`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか`,children:`3. いつ使わないか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`DB 互換の生 enum (`,(0,y.jsx)(t.code,{children:`draft`}),` / `,(0,y.jsx)(t.code,{children:`published`}),`) を直接表示 → 状態に変換してから渡す`]}),`
`,(0,y.jsxs)(t.li,{children:[`一般的な「NEW」「Beta」 → `,(0,y.jsx)(t.a,{href:`../ui/badge.md`,children:`Badge`})]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-8-状態の対応`,children:`4. 8 状態の対応`}),`
`,(0,y.jsxs)(t.table,{children:[(0,y.jsx)(t.thead,{children:(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.th,{children:`status`}),(0,y.jsx)(t.th,{children:`色`}),(0,y.jsx)(t.th,{children:`ラベル (ja/en)`})]})}),(0,y.jsxs)(t.tbody,{children:[(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`open`}),(0,y.jsx)(t.td,{children:`green`}),(0,y.jsx)(t.td,{children:`募集中 / Open`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`full`}),(0,y.jsx)(t.td,{children:`red`}),(0,y.jsx)(t.td,{children:`満員 / Full`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`waitlist`}),(0,y.jsx)(t.td,{children:`yellow`}),(0,y.jsx)(t.td,{children:`補欠登録受付中 / Waitlist`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`closed`}),(0,y.jsx)(t.td,{children:`gray`}),(0,y.jsx)(t.td,{children:`募集締切 / Closed`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`cancelled`}),(0,y.jsx)(t.td,{children:`dark-red`}),(0,y.jsx)(t.td,{children:`中止 / Cancelled`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`ended`}),(0,y.jsx)(t.td,{children:`gray`}),(0,y.jsx)(t.td,{children:`終了 / Ended`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`upcoming`}),(0,y.jsx)(t.td,{children:`blue`}),(0,y.jsx)(t.td,{children:`開催前 / Upcoming`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`ongoing`}),(0,y.jsx)(t.td,{children:`orange`}),(0,y.jsx)(t.td,{children:`開催中 / Ongoing`})]})]})]}),`
`,(0,y.jsx)(t.p,{children:`色 + テキスト併記 (Design.md §10.1)。`}),`
`,(0,y.jsx)(t.h2,{id:`5-バリアント`,children:`5. バリアント`}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->`}),`
`,(0,y.jsxs)(t.table,{children:[(0,y.jsx)(t.thead,{children:(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.th,{children:`variant`}),(0,y.jsx)(t.th,{children:`視覚`})]})}),(0,y.jsxs)(t.tbody,{children:[(0,y.jsxs)(t.tr,{children:[(0,y.jsxs)(t.td,{children:[(0,y.jsx)(t.code,{children:`subtle`}),` (default)`]}),(0,y.jsx)(t.td,{children:`淡背景 + 濃文字`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`solid`})}),(0,y.jsx)(t.td,{children:`塗り + 白文字`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`outline`})}),(0,y.jsx)(t.td,{children:`透明 + 色付き border`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`dot`})}),(0,y.jsx)(t.td,{children:`小ドット + テキスト`})]})]})]}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED END: variants -->`}),`
`,(0,y.jsx)(t.h2,{id:`6-アクセシビリティ`,children:`6. アクセシビリティ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`ラベルは必ず色と併記`}),`
`,(0,y.jsx)(t.li,{children:`aria-label でステータス名を強化`}),`
`,(0,y.jsxs)(t.li,{children:[`コントラスト比は全 8 状態で AA (4.5:1) 以上 (`,(0,y.jsx)(t.code,{children:`docs/design-system.md`}),` §2.5)`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`7-使用例`,children:`7. 使用例`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import { EventStatusBadge } from "@tech-event/shared-ui-composite";

<EventStatusBadge status="open" />
<EventStatusBadge status="full" variant="solid" />
<EventStatusBadge status="waitlist" variant="dot" />
`})}),`
`,(0,y.jsx)(t.h2,{id:`8-アンチパターン`,children:`8. アンチパターン`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`❌ 独自に色だけのバッジ → ✅ 必ずこの compoennt`}),`
`,(0,y.jsx)(t.li,{children:`❌ ラベル日本語を独自に → ✅ Design.md §10.1 の文言を遵守`}),`
`,(0,y.jsx)(t.li,{children:`❌ 8 状態以外を追加 → ✅ Design.md の改訂が必要`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`9-関連`,children:`9. 関連`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../ui/badge.md`,children:`Badge`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../../../Design.md`,children:`Design.md §10.1`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../../design-system.md`,children:`docs/design-system.md §2.5`})}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`10-変更履歴`,children:`10. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース、8 状態 + 4 variant`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),h()}))();export{v as default};