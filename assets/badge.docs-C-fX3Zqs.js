import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-CD-xvnSv.js";import{t as d}from"./mdx-react-shim-BWVm_lKV.js";import{Default as f,Destructive as p,Secondary as m,n as h,t as g}from"./badge.stories-1NQwId2U.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:g}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsxs)(u,{children:[(0,y.jsx)(t.strong,{children:`短いラベル / 状態 / カウント`}),` を視覚的に小さく強調表示するための atom。Status系の派生 (EventStatusBadge) や TagPill の基盤として使われる。`]}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/ui/badge.md`}),`。
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
`,(0,y.jsx)(t.h2,{id:`1-目的-purpose`,children:`1. 目的 (Purpose)`}),`
`,(0,y.jsxs)(t.p,{children:[(0,y.jsx)(t.strong,{children:`短いラベル / 状態 / カウント`}),` を視覚的に小さく強調表示するための atom。Status系の派生 (EventStatusBadge) や TagPill の基盤として使われる。`]}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか-when-to-use`,children:`2. いつ使うか (When to use)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`状態の短い表示 (「NEW」「Beta」「主催」)`}),`
`,(0,y.jsx)(t.li,{children:`カウント表示 (通知 N 件)`}),`
`,(0,y.jsx)(t.li,{children:`メタ情報のチップ (「無料」「オンライン」「対面」)`}),`
`,(0,y.jsx)(t.li,{children:`メンバーシップ / プラン (「Pro」「Free」)`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか-when-not-to-use`,children:`3. いつ使わないか (When NOT to use)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`イベントステータス`}),` → `,(0,y.jsx)(t.a,{href:`../components/event-status-badge.md`,children:`EventStatusBadge`}),` (8 状態のドメイン特化)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`タグ`}),` → `,(0,y.jsx)(t.a,{href:`../components/tag-pill.md`,children:`TagPill`}),` (クリック可能 / 削除可能のドメイン特化)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`ボタン (押せる)`}),` → `,(0,y.jsx)(t.a,{href:`./button.md`,children:`Button`}),` `,(0,y.jsx)(t.code,{children:`size="xs"`})]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`長文`}),` → 通常のテキスト + アイコンを使う`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-構造-anatomy`,children:`4. 構造 (Anatomy)`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{children:`┌────────────┐
│ [icon] Tag │   小さく丸い (rounded-full or rounded)
└────────────┘
`})}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`text (required, 短く 1-4 文字程度)`}),`
`,(0,y.jsx)(t.li,{children:`icon (optional, 12-14px)`}),`
`,(0,y.jsxs)(t.li,{children:[`角丸 `,(0,y.jsx)(t.code,{children:`rounded-full`}),` (default) or `,(0,y.jsx)(t.code,{children:`rounded`}),` (square 系)`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`5-バリアント-variants`,children:`5. バリアント (Variants)`}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->`}),`
`,(0,y.jsxs)(t.table,{children:[(0,y.jsx)(t.thead,{children:(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.th,{children:`variant`}),(0,y.jsx)(t.th,{children:`用途`}),(0,y.jsx)(t.th,{children:`視覚`})]})}),(0,y.jsxs)(t.tbody,{children:[(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`default`})}),(0,y.jsx)(t.td,{children:`主要な強調`}),(0,y.jsx)(t.td,{children:`brand-orange 塗り`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`secondary`})}),(0,y.jsx)(t.td,{children:`補助`}),(0,y.jsx)(t.td,{children:`bg-surface-muted + text-foreground`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`outline`})}),(0,y.jsx)(t.td,{children:`フラット`}),(0,y.jsx)(t.td,{children:`border-border + bg-transparent`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`destructive`})}),(0,y.jsx)(t.td,{children:`警告系`}),(0,y.jsx)(t.td,{children:`bg-brand-red + white text`})]})]})]}),`
`,(0,y.jsxs)(t.p,{children:[`ステータス8種 (open/full/waitlist/closed/cancelled/ended/upcoming/ongoing) は `,(0,y.jsx)(t.a,{href:`../components/event-status-badge.md`,children:`EventStatusBadge`}),` で扱う。Badge atom 単体には乗せない。`]}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED END: variants -->`}),`
`,(0,y.jsx)(t.h2,{id:`6-サイズ`,children:`6. サイズ`}),`
`,(0,y.jsxs)(t.table,{children:[(0,y.jsx)(t.thead,{children:(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.th,{children:`size`}),(0,y.jsx)(t.th,{children:`高さ`}),(0,y.jsx)(t.th,{children:`用途`})]})}),(0,y.jsxs)(t.tbody,{children:[(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`sm`})}),(0,y.jsx)(t.td,{children:`18px`}),(0,y.jsx)(t.td,{children:`カードの右上、リスト行`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`md`})}),(0,y.jsx)(t.td,{children:`22px (default)`}),(0,y.jsx)(t.td,{children:`ヘッダー横の NEW など`})]})]})]}),`
`,(0,y.jsx)(t.h2,{id:`7-状態-states`,children:`7. 状態 (States)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`default のみ (静的)。hover / focus は通常不要。`}),`
`,(0,y.jsxs)(t.li,{children:[`クリック可能化したい時は `,(0,y.jsx)(t.strong,{children:`代わりに Button`}),` を使う。`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`8-アクセシビリティ-accessibility`,children:`8. アクセシビリティ (Accessibility)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`状態の意味は `,(0,y.jsx)(t.strong,{children:`色だけでなくテキストで`}),` 伝える (Design.md §10)`]}),`
`,(0,y.jsxs)(t.li,{children:[`icon-only の場合は `,(0,y.jsx)(t.code,{children:`aria-label`}),` 必須 (アイコンに `,(0,y.jsx)(t.code,{children:`aria-hidden`}),` + Badge に `,(0,y.jsx)(t.code,{children:`aria-label`}),`)`]}),`
`,(0,y.jsxs)(t.li,{children:[`カウントは `,(0,y.jsx)(t.code,{children:`aria-live="polite"`}),` で更新を伝える場合がある`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`9-使用例-code`,children:`9. 使用例 (Code)`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import { Badge } from "@tech-event/shared-ui";

<Badge>NEW</Badge>
<Badge variant="secondary">Beta</Badge>
<Badge variant="outline">主催</Badge>

// カウント
<Badge variant="destructive" aria-label="未読 3 件">3</Badge>
`})}),`
`,(0,y.jsx)(t.h2,{id:`10-アンチパターン-anti-patterns`,children:`10. アンチパターン (Anti-patterns)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`❌ 長文を入れる → ✅ 4 文字程度に`}),`
`,(0,y.jsx)(t.li,{children:`❌ クリック可能化 → ✅ Button へ`}),`
`,(0,y.jsx)(t.li,{children:`❌ 任意 hex → ✅ variant prop`}),`
`,(0,y.jsx)(t.li,{children:`❌ アイコンのみで意味伝達 → ✅ テキスト併記`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`11-関連`,children:`11. 関連`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../components/event-status-badge.md`,children:`EventStatusBadge`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../components/tag-pill.md`,children:`TagPill`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./button.md`,children:`Button`})}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`12-変更履歴`,children:`12. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),h()}))();export{v as default};