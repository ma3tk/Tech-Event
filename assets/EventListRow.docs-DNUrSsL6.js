import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-DyqvvloQ.js";import{t as d}from"./mdx-react-shim-Co4r-mY_.js";import{Compact as f,Default as p,Rank1 as m,n as h,t as g}from"./EventListRow.stories-CnpsPrVu.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,h3:`h3`,hr:`hr`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:g}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsxs)(u,{children:[`イベント 1 件を `,(0,y.jsx)(t.strong,{children:`1 行 88-96px`}),` の高密度フォーマットで表示する composite component。connpass の検索結果 / ランキング / タイムラインに最も近いレイアウト。showRank で順位バッジを付加できる。`]}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/components/event-list-row.md`}),`。
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
`,(0,y.jsx)(t.h2,{id:`対象ペルソナ`,children:`対象ペルソナ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`主要: P1 山田美咲 (モバイル: 縦長スクロール)、P2 田中慎太郎、P3 佐藤健太 (抽選イベントの 1 行スキャン)`}),`
`,(0,y.jsx)(t.li,{children:`副次: P4 鈴木大輔、P6 小林一郎 (主催ビュー: 申込数 trailing)`}),`
`]}),`
`,(0,y.jsxs)(t.p,{children:[`(根拠: `,(0,y.jsx)(t.a,{href:`../../../Personas.md`,children:(0,y.jsx)(t.code,{children:`Personas.md`})}),`)`]}),`
`,(0,y.jsx)(t.h2,{id:`1-目的-purpose`,children:`1. 目的 (Purpose)`}),`
`,(0,y.jsxs)(t.p,{children:[`イベント 1 件を `,(0,y.jsx)(t.strong,{children:`1 行 88-96px`}),` の高密度フォーマットで表示する composite component。connpass の検索結果 / ランキング / タイムラインに最も近いレイアウト。`,(0,y.jsx)(t.code,{children:`showRank`}),` で順位バッジを付加できる。`]}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか-when-to-use`,children:`2. いつ使うか (When to use)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`検索結果 (`,(0,y.jsx)(t.code,{children:`/search`}),`)`]}),`
`,(0,y.jsxs)(t.li,{children:[`ランキング (`,(0,y.jsx)(t.code,{children:`/ranking`}),`) — `,(0,y.jsx)(t.code,{children:`showRank`}),` で順位バッジ`]}),`
`,(0,y.jsxs)(t.li,{children:[`ユーザーの参加履歴 / ブックマーク (`,(0,y.jsx)(t.code,{children:`/bookmarks`}),`)`]}),`
`,(0,y.jsx)(t.li,{children:`グループの開催履歴`}),`
`,(0,y.jsxs)(t.li,{children:[`タイムライン UI (`,(0,y.jsx)(t.a,{href:`./event-timeline.md`,children:`EventTimeline`}),`) の各行`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか-when-not-to-use`,children:`3. いつ使わないか (When NOT to use)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`カード表示 (グリッド)`}),` → `,(0,y.jsx)(t.a,{href:`./event-card.md`,children:`EventCard`}),` `,(0,y.jsx)(t.code,{children:`variant="grid"`})]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`トップページの注目`}),` → `,(0,y.jsx)(t.a,{href:`./event-card.md`,children:`EventCard`}),` `,(0,y.jsx)(t.code,{children:`variant="list"`})]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`3 件以下の小プレビュー`}),` → `,(0,y.jsx)(t.a,{href:`../components/recently-viewed-events.md`,children:`RecentlyViewedEvents`})]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`詳細ページ本体`}),` → 専用テンプレート`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-構造-anatomy--designmd-54-厳格仕様`,children:`4. 構造 (Anatomy) — Design.md §5.4 厳格仕様`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{children:`┌──────────────────────────────────────────────────────────────────┐
│ ┌────┐  [open] [タグ] グループ名                                 │
│ │サムネ│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ │80×60│  タイトル (line-clamp-2、15-16px bold)                  │
│ │16:9 │  📅 2026-06-12  📍 オンライン           参加 12/30       │
│ └────┘                                            [参加]         │
└──────────────────────────────────────────────────────────────────┘
   ▲     ▲                                              ▲
   │     ステータス / タグ / タイトル / メタ           │
   │                                                    └─ 縦積み (nowrap)
   └─ 80×60 サムネ (16:9 内包)、無ければ brand-orange グラデ + Calendar
`})}),`
`,(0,y.jsx)(t.h3,{id:`厳格な配置順-designmd-54-から`,children:`厳格な配置順 (Design.md §5.4 から)`}),`
`,(0,y.jsxs)(t.ol,{children:[`
`,(0,y.jsx)(t.li,{children:`サムネ 80×60 (16:9 を内包) — 無ければ brand-orange グラデ + Calendar アイコン`}),`
`,(0,y.jsx)(t.li,{children:`ステータスバッジ + (タグピル + グループ名)`}),`
`,(0,y.jsxs)(t.li,{children:[`タイトル (15-16px / bold) — `,(0,y.jsx)(t.code,{children:`line-clamp-2`})]}),`
`,(0,y.jsx)(t.li,{children:`日付 + 会場 (12px / muted)`}),`
`,(0,y.jsx)(t.li,{children:`右端: 参加者 N/M + 「参加」(縦積み、自前 nowrap)`}),`
`]}),`
`,(0,y.jsx)(t.p,{children:`connpass を踏襲し、Luma 並みの余白は取らない。`}),`
`,(0,y.jsx)(t.h2,{id:`5-バリアント-variants`,children:`5. バリアント (Variants)`}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->`}),`
`,(0,y.jsxs)(t.table,{children:[(0,y.jsx)(t.thead,{children:(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.th,{children:`variant`}),(0,y.jsx)(t.th,{children:`用途`})]})}),(0,y.jsxs)(t.tbody,{children:[(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`標準`}),(0,y.jsx)(t.td,{children:`検索結果 / ランキング`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`showRank`})}),(0,y.jsx)(t.td,{children:`ランキングで先頭に順位バッジ (1/2/3 はメダル色)`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`compact`})}),(0,y.jsx)(t.td,{children:`EventTimeline 内部用 (余白縮小)`})]})]})]}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED END: variants -->`}),`
`,(0,y.jsx)(t.h2,{id:`6-サイズ`,children:`6. サイズ`}),`
`,(0,y.jsxs)(t.p,{children:[`固定高さ ~88-96px。`,(0,y.jsx)(t.code,{children:`compact`}),` でも 80px 程度に留める。`]}),`
`,(0,y.jsx)(t.h2,{id:`7-状態-states`,children:`7. 状態 (States)`}),`
`,(0,y.jsxs)(t.table,{children:[(0,y.jsx)(t.thead,{children:(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.th,{children:`状態`}),(0,y.jsx)(t.th,{children:`視覚`})]})}),(0,y.jsxs)(t.tbody,{children:[(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`default`}),(0,y.jsxs)(t.td,{children:[(0,y.jsx)(t.code,{children:`bg-surface`}),` + `,(0,y.jsx)(t.code,{children:`border-b border-border`})]})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`hover`}),(0,y.jsxs)(t.td,{children:[(0,y.jsx)(t.code,{children:`bg-background`}),` (薄く反転)`]})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`loading`}),(0,y.jsx)(t.td,{children:(0,y.jsx)(t.a,{href:`./event-list-row.md`,children:`EventListRowSkeleton`})})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`empty`}),(0,y.jsxs)(t.td,{children:[`親で `,(0,y.jsx)(t.a,{href:`../ui/empty-state.md`,children:`EmptyState`})]})]})]})]}),`
`,(0,y.jsx)(t.h2,{id:`8-アクセシビリティ-accessibility`,children:`8. アクセシビリティ (Accessibility)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`行全体は `,(0,y.jsx)(t.code,{children:`<Link>`}),` でラップ (`,(0,y.jsx)(t.code,{children:`block`}),` レイアウト)`]}),`
`,(0,y.jsx)(t.li,{children:`参加ボタンは Link の外側に出して別 tab stop`}),`
`,(0,y.jsxs)(t.li,{children:[`順位バッジ (`,(0,y.jsx)(t.code,{children:`showRank`}),`) は `,(0,y.jsx)(t.code,{children:`aria-label="1位"`}),` などで読み上げ補強`]}),`
`,(0,y.jsx)(t.li,{children:`高密度なので zoom 200% でレイアウト崩壊しないか確認 (axe で検出)`}),`
`,(0,y.jsxs)(t.li,{children:[`メタ情報のアイコンは `,(0,y.jsx)(t.code,{children:`aria-hidden`}),`、隣接テキストで意味を担保`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`9-レスポンシブ`,children:`9. レスポンシブ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`モバイル: サムネを小さく (`,(0,y.jsx)(t.code,{children:`64×48`}),`)、参加ボタンを下に折り返す or 非表示にしてカード末尾に`]}),`
`,(0,y.jsx)(t.li,{children:`タブレット (md): 標準 80×60`}),`
`,(0,y.jsx)(t.li,{children:`デスクトップ: 標準 + 右側に余白多めに`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`10-使用例-code`,children:`10. 使用例 (Code)`}),`
`,(0,y.jsx)(t.h3,{id:`101-検索結果`,children:`10.1 検索結果`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import { EventListRow } from "@tech-event/shared-ui-composite";

<div className="divide-y divide-border">
  {events.map((e) => (
    <EventListRow key={String(e.id)} event={e} />
  ))}
</div>
<Pagination current={page} total={totalPages} buildHref={(p) => \`/search?q=\${q}&page=\${p}\`} />
`})}),`
`,(0,y.jsx)(t.h3,{id:`102-ランキング-順位バッジ`,children:`10.2 ランキング (順位バッジ)`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`<ul className="divide-y divide-border">
  {ranked.map((e, i) => (
    <li key={String(e.id)}>
      <EventListRow event={e} showRank rank={i + 1} />
    </li>
  ))}
</ul>
`})}),`
`,(0,y.jsx)(t.h3,{id:`103-eventtimeline-内-compact`,children:`10.3 EventTimeline 内 (compact)`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`<EventTimeline events={events} stickyTopPx={64} />
// 内部で EventListRow compact 表示
`})}),`
`,(0,y.jsx)(t.h2,{id:`11-アンチパターン-anti-patterns`,children:`11. アンチパターン (Anti-patterns)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`❌ サムネを正方形 / 非 16:9 → ✅ 16:9 厳守`}),`
`,(0,y.jsxs)(t.li,{children:[`❌ タイトル 3 行以上 → ✅ `,(0,y.jsx)(t.code,{children:`line-clamp-2`})]}),`
`,(0,y.jsx)(t.li,{children:`❌ 右端の CTA を長文 → ✅ 「参加」「申込」など短く`}),`
`,(0,y.jsxs)(t.li,{children:[`❌ 行をボタンにする (`,(0,y.jsx)(t.code,{children:`<button>`}),`) → ✅ `,(0,y.jsx)(t.code,{children:`<Link>`}),` でラップ (画面遷移)`]}),`
`,(0,y.jsx)(t.li,{children:`❌ メタ情報を 3 行以上 → ✅ 1 行で日付 + 会場まで`}),`
`,(0,y.jsx)(t.li,{children:`❌ Luma 風に余白を増やす → ✅ connpass 寄りの密度を守る (Design.md §5.4)`}),`
`,(0,y.jsx)(t.li,{children:`❌ ステータスを色だけで → ✅ EventStatusBadge 必須`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`12-関連`,children:`12. 関連`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`./event-card.md`,children:`EventCard`}),` — カード表示`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`./event-timeline.md`,children:`EventTimeline`}),` — タイムラインの内部実装`]}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../ui/skeleton.md`,children:`EventCardSkeleton / EventListRowSkeleton`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../components/pagination.md`,children:`Pagination`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../components/event-status-badge.md`,children:`EventStatusBadge`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../blocks/lists-and-tables.md`,children:`blocks/lists-and-tables.md`})}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`13-変更履歴`,children:`13. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース、Design.md §5.4 仕様準拠`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),h()}))();export{v as default};