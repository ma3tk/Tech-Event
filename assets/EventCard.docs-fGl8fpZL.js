import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-CD-xvnSv.js";import{t as d}from"./mdx-react-shim-BWVm_lKV.js";import{GridDefault as f,ListDefault as p,LumaDefault as m,LumaGallery as h,LumaWithTint as g,n as _,t as v}from"./EventCard.stories-BsmlwHR_.js";function y(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,h3:`h3`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...n(),...e.components};return(0,x.jsxs)(x.Fragment,{children:[(0,x.jsx)(l,{of:v}),`
`,(0,x.jsx)(i,{}),`
`,(0,x.jsxs)(u,{children:[`イベントを `,(0,x.jsx)(t.strong,{children:`カード形式`}),` で見せるドメイン特化の composite component。list (横長) / grid (縦積み) の 2 variant を持ち、トップページの注目イベント / 関連イベント / 検索結果 (compact 1 行表示は EventListRow) で使う。`]}),`
`,(0,x.jsxs)(t.blockquote,{children:[`
`,(0,x.jsxs)(t.p,{children:[`一次資料: `,(0,x.jsx)(t.code,{children:`docs/catalog/components/event-card.md`}),`。
ここは `,(0,x.jsx)(t.strong,{children:`言語化テキスト + 実物 Live Preview`}),` を 1 ページに統合した shadcn/ui スタイルの docs。
元の `,(0,x.jsx)(t.code,{children:`.md`}),` ファイルが source of truth、本 MDX は同内容を Storybook 上でレンダリングする視覚層。`]}),`
`]}),`
`,(0,x.jsx)(t.h2,{id:`ライブプレビュー-canvas`,children:`ライブプレビュー (Canvas)`}),`
`,(0,x.jsx)(t.h3,{id:`list-variant-検索結果--関連イベント`,children:`list variant (検索結果 / 関連イベント)`}),`
`,(0,x.jsx)(s,{of:p}),`
`,(0,x.jsx)(t.h3,{id:`grid-variant-注目イベント--ヒーロー`,children:`grid variant (注目イベント / ヒーロー)`}),`
`,(0,x.jsx)(s,{of:f}),`
`,(0,x.jsx)(t.h3,{id:`luma-variant-luma-風強化-rounded-3xl--cover-image--tint`,children:`luma variant (Luma 風強化: rounded-3xl + cover image + tint)`}),`
`,(0,x.jsx)(s,{of:m}),`
`,(0,x.jsx)(s,{of:g}),`
`,(0,x.jsx)(s,{of:h}),`
`,(0,x.jsx)(t.h2,{id:`primary`,children:`Primary`}),`
`,(0,x.jsx)(r,{}),`
`,(0,x.jsx)(t.h2,{id:`props-api`,children:`Props (API)`}),`
`,(0,x.jsx)(a,{}),`
`,(0,x.jsx)(t.hr,{}),`
`,(0,x.jsx)(t.h2,{id:`対象ペルソナ`,children:`対象ペルソナ`}),`
`,(0,x.jsxs)(t.ul,{children:[`
`,(0,x.jsx)(t.li,{children:`主要: P1 山田美咲 (モバイル: 一覧)、P2 田中慎太郎 (週末ブラウジング)、P6 小林一郎 (主催: variant=host)`}),`
`,(0,x.jsx)(t.li,{children:`副次: P3 佐藤健太、P7 高橋真由美、P8 渡辺浩之`}),`
`]}),`
`,(0,x.jsxs)(t.p,{children:[`(根拠: `,(0,x.jsx)(t.a,{href:`../../../Personas.md`,children:(0,x.jsx)(t.code,{children:`Personas.md`})}),`)`]}),`
`,(0,x.jsx)(t.h2,{id:`1-目的-purpose`,children:`1. 目的 (Purpose)`}),`
`,(0,x.jsxs)(t.p,{children:[`イベントを `,(0,x.jsx)(t.strong,{children:`カード形式`}),` で見せるドメイン特化の composite component。`,(0,x.jsx)(t.code,{children:`list`}),` (横長) / `,(0,x.jsx)(t.code,{children:`grid`}),` (縦積み) の 2 variant を持ち、トップページの注目イベント / 関連イベント / 検索結果 (compact 1 行表示は `,(0,x.jsx)(t.a,{href:`./event-list-row.md`,children:`EventListRow`}),`) で使う。`]}),`
`,(0,x.jsx)(t.h2,{id:`2-いつ使うか-when-to-use`,children:`2. いつ使うか (When to use)`}),`
`,(0,x.jsxs)(t.ul,{children:[`
`,(0,x.jsx)(t.li,{children:`トップページの「注目イベント」「新着イベント」セクション`}),`
`,(0,x.jsx)(t.li,{children:`グループページの「過去のイベント」グリッド`}),`
`,(0,x.jsxs)(t.li,{children:[`検索結果の `,(0,x.jsx)(t.strong,{children:`カード表示モード`}),` (1 行表示は EventListRow)`]}),`
`,(0,x.jsx)(t.li,{children:`関連イベント / レコメンド`}),`
`,(0,x.jsx)(t.li,{children:`ユーザーが参加予定のイベント一覧 (dashboard)`}),`
`]}),`
`,(0,x.jsx)(t.h2,{id:`3-いつ使わないか-when-not-to-use`,children:`3. いつ使わないか (When NOT to use)`}),`
`,(0,x.jsxs)(t.ul,{children:[`
`,(0,x.jsxs)(t.li,{children:[(0,x.jsx)(t.strong,{children:`1 行で情報を高密度に`}),` → `,(0,x.jsx)(t.a,{href:`./event-list-row.md`,children:`EventListRow`})]}),`
`,(0,x.jsxs)(t.li,{children:[(0,x.jsx)(t.strong,{children:`タイムライン UI`}),` → `,(0,x.jsx)(t.a,{href:`./event-timeline.md`,children:`EventTimeline`})]}),`
`,(0,x.jsxs)(t.li,{children:[(0,x.jsx)(t.strong,{children:`CTA を強く出したい詳細上部`}),` → ヘッダーセクションを直接組む (EventCard は本体ではない)`]}),`
`,(0,x.jsxs)(t.li,{children:[(0,x.jsx)(t.strong,{children:`3 件以下の小さなプレビュー`}),` → `,(0,x.jsx)(t.a,{href:`../components/recently-viewed-events.md`,children:`RecentlyViewedEvents`})]}),`
`]}),`
`,(0,x.jsx)(t.h2,{id:`4-構造-anatomy`,children:`4. 構造 (Anatomy)`}),`
`,(0,x.jsx)(t.h3,{id:`list-variant-横長`,children:`list variant (横長)`}),`
`,(0,x.jsx)(t.pre,{children:(0,x.jsx)(t.code,{children:`┌──────────────────────────────────────────────────────────────┐
│ ┌─────────┐                                                  │
│ │サムネ   │  [open バッジ] [タグピル] グループ名             │
│ │ 80×60   │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ │         │  イベントタイトル (line-clamp-2)                 │
│ └─────────┘  📅 2026-06-12  📍 オンライン   👥 12/30  [参加] │
└──────────────────────────────────────────────────────────────┘
`})}),`
`,(0,x.jsx)(t.h3,{id:`grid-variant-縦積み`,children:`grid variant (縦積み)`}),`
`,(0,x.jsx)(t.pre,{children:(0,x.jsx)(t.code,{children:`┌────────────────────┐
│  サムネ 16:9       │
│                    │
├────────────────────┤
│ [open] [タグ]      │
│ タイトル           │
│ (line-clamp-2)     │
│ 📅 日付            │
│ 📍 会場            │
│ 👥 参加者          │
└────────────────────┘
`})}),`
`,(0,x.jsxs)(t.ul,{children:[`
`,(0,x.jsxs)(t.li,{children:[`サムネ (80×60 / 16:9): 無ければ `,(0,x.jsx)(t.code,{children:`bg-brand-orange-soft`}),` + Calendar icon フォールバック`]}),`
`,(0,x.jsx)(t.li,{children:`ステータスバッジ + タグピル + グループ名 (1 行)`}),`
`,(0,x.jsxs)(t.li,{children:[`タイトル (15-16px bold, `,(0,x.jsx)(t.code,{children:`line-clamp-2`}),`)`]}),`
`,(0,x.jsxs)(t.li,{children:[`メタ (日付 / 会場 / 参加者) — `,(0,x.jsx)(t.code,{children:`text-xs text-muted-foreground`})]}),`
`,(0,x.jsx)(t.li,{children:`右端の参加ボタン (list variant のみ)`}),`
`]}),`
`,(0,x.jsx)(t.h2,{id:`5-バリアント-variants`,children:`5. バリアント (Variants)`}),`
`,(0,x.jsx)(t.p,{children:`<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->`}),`
`,(0,x.jsxs)(t.table,{children:[(0,x.jsx)(t.thead,{children:(0,x.jsxs)(t.tr,{children:[(0,x.jsx)(t.th,{children:`variant`}),(0,x.jsx)(t.th,{children:`用途`}),(0,x.jsx)(t.th,{children:`レイアウト`})]})}),(0,x.jsxs)(t.tbody,{children:[(0,x.jsxs)(t.tr,{children:[(0,x.jsx)(t.td,{children:(0,x.jsx)(t.code,{children:`list`})}),(0,x.jsx)(t.td,{children:`デスクトップの注目枠 / 関連枠`}),(0,x.jsx)(t.td,{children:`横長 1 行型`})]}),(0,x.jsxs)(t.tr,{children:[(0,x.jsx)(t.td,{children:(0,x.jsx)(t.code,{children:`grid`})}),(0,x.jsx)(t.td,{children:`グリッド表示 / モバイル`}),(0,x.jsx)(t.td,{children:`縦積み 16:9 サムネ`})]}),(0,x.jsxs)(t.tr,{children:[(0,x.jsx)(t.td,{children:(0,x.jsx)(t.code,{children:`luma`})}),(0,x.jsx)(t.td,{children:`フィーチャー枠 / ブランド強調 / DevRel 主催イベント`}),(0,x.jsx)(t.td,{children:`大判 cover (16:9) + rounded-2xl + shadow-soft-md + glassmorphism + 主催者スタック (右下)`})]})]})]}),`
`,(0,x.jsxs)(t.p,{children:[(0,x.jsx)(t.code,{children:`grid`}),` は内部的に `,(0,x.jsx)(t.code,{children:`EventCardCompact`}),` ラッパー経由でも呼べる。`]}),`
`,(0,x.jsx)(t.p,{children:`<!-- AUTO-GENERATED END: variants -->`}),`
`,(0,x.jsx)(t.h3,{id:`51-variantluma-の仕様`,children:`5.1 variant=luma の仕様`}),`
`,(0,x.jsxs)(t.table,{children:[(0,x.jsx)(t.thead,{children:(0,x.jsxs)(t.tr,{children:[(0,x.jsx)(t.th,{children:`項目`}),(0,x.jsx)(t.th,{children:`値`})]})}),(0,x.jsxs)(t.tbody,{children:[(0,x.jsxs)(t.tr,{children:[(0,x.jsx)(t.td,{children:`Cover image`}),(0,x.jsxs)(t.td,{children:[(0,x.jsx)(t.code,{children:`aspect-video`}),` (16:9) 上端いっぱい、`,(0,x.jsx)(t.code,{children:`object-cover`})]})]}),(0,x.jsxs)(t.tr,{children:[(0,x.jsx)(t.td,{children:`Container radius`}),(0,x.jsxs)(t.td,{children:[(0,x.jsx)(t.code,{children:`rounded-2xl`}),` (--radius-2xl = 16px)`]})]}),(0,x.jsxs)(t.tr,{children:[(0,x.jsx)(t.td,{children:`Shadow (default)`}),(0,x.jsxs)(t.td,{children:[(0,x.jsx)(t.code,{children:`shadow-soft-md`}),` (柔らかい影、Luma 風)`]})]}),(0,x.jsxs)(t.tr,{children:[(0,x.jsx)(t.td,{children:`Shadow (hover)`}),(0,x.jsxs)(t.td,{children:[(0,x.jsx)(t.code,{children:`shadow-soft-lg`}),` + `,(0,x.jsx)(t.code,{children:`-translate-y-1`})]})]}),(0,x.jsxs)(t.tr,{children:[(0,x.jsx)(t.td,{children:`Title`}),(0,x.jsx)(t.td,{children:`18-22px / bold / line-clamp-2`})]}),(0,x.jsxs)(t.tr,{children:[(0,x.jsx)(t.td,{children:`Meta (日時/場所/参加者)`}),(0,x.jsx)(t.td,{children:`14px / muted`})]}),(0,x.jsxs)(t.tr,{children:[(0,x.jsx)(t.td,{children:`Host avatar stack`}),(0,x.jsx)(t.td,{children:`カード右下に重ね (最大 3 名、+N 省略)`})]}),(0,x.jsxs)(t.tr,{children:[(0,x.jsx)(t.td,{children:`tintColor`}),(0,x.jsx)(t.td,{children:`あり → 左 border (4px) + cover image 上に 135deg gradient overlay (alpha 26)`})]}),(0,x.jsxs)(t.tr,{children:[(0,x.jsx)(t.td,{children:`Padding`}),(0,x.jsxs)(t.td,{children:[(0,x.jsx)(t.code,{children:`p-5`}),` (内側 20px)`]})]}),(0,x.jsxs)(t.tr,{children:[(0,x.jsx)(t.td,{children:`用途`}),(0,x.jsx)(t.td,{children:`トップページのフィーチャー枠、カレンダー詳細の関連イベント、DevRel 用ブランドカード`})]})]})]}),`
`,(0,x.jsx)(t.pre,{children:(0,x.jsx)(t.code,{className:`language-tsx`,children:`import { EventCard } from "@tech-event/shared-ui-composite";

<EventCard
  variant="luma"
  event={event}
  tintColor="#ec4899"            // 任意の hex (calendar.tintColor / event.themeTintColor 等)
  hosts={[
    { name: "山田 太郎", avatarUrl: "..." },
    { name: "佐藤 花子" },
  ]}
/>
`})}),`
`,(0,x.jsx)(t.h2,{id:`6-サイズ`,children:`6. サイズ`}),`
`,(0,x.jsxs)(t.p,{children:[(0,x.jsx)(t.code,{children:`list`}),` / `,(0,x.jsx)(t.code,{children:`grid`}),` の固定。サイズ prop なし。グリッド時は親で `,(0,x.jsx)(t.code,{children:`grid-cols-*`}),` を制御。`]}),`
`,(0,x.jsx)(t.h2,{id:`7-状態-states`,children:`7. 状態 (States)`}),`
`,(0,x.jsxs)(t.table,{children:[(0,x.jsx)(t.thead,{children:(0,x.jsxs)(t.tr,{children:[(0,x.jsx)(t.th,{children:`状態`}),(0,x.jsx)(t.th,{children:`視覚`})]})}),(0,x.jsxs)(t.tbody,{children:[(0,x.jsxs)(t.tr,{children:[(0,x.jsx)(t.td,{children:`default`}),(0,x.jsx)(t.td,{children:(0,x.jsx)(t.code,{children:`shadow-sm bg-surface`})})]}),(0,x.jsxs)(t.tr,{children:[(0,x.jsx)(t.td,{children:`hover`}),(0,x.jsx)(t.td,{children:(0,x.jsx)(t.code,{children:`shadow-md -translate-y-0.5 duration-normal`})})]}),(0,x.jsxs)(t.tr,{children:[(0,x.jsx)(t.td,{children:`loading`}),(0,x.jsxs)(t.td,{children:[(0,x.jsx)(t.a,{href:`./event-card.md`,children:`EventCardSkeleton`}),` で置換`]})]}),(0,x.jsxs)(t.tr,{children:[(0,x.jsx)(t.td,{children:`empty`}),(0,x.jsxs)(t.td,{children:[`親レベルで `,(0,x.jsx)(t.a,{href:`../ui/empty-state.md`,children:`EmptyState`}),` を出す`]})]}),(0,x.jsxs)(t.tr,{children:[(0,x.jsx)(t.td,{children:`selected`}),(0,x.jsxs)(t.td,{children:[(0,x.jsx)(t.code,{children:`ring-2 ring-brand-orange`}),` (任意)`]})]})]})]}),`
`,(0,x.jsx)(t.h2,{id:`8-アクセシビリティ-accessibility`,children:`8. アクセシビリティ (Accessibility)`}),`
`,(0,x.jsxs)(t.ul,{children:[`
`,(0,x.jsxs)(t.li,{children:[`カード全体は `,(0,x.jsx)(t.code,{children:'<Link href="/event/${id}">'}),` でラップ`]}),`
`,(0,x.jsxs)(t.li,{children:[`タイトルは `,(0,x.jsx)(t.code,{children:`h3`}),` (リスト内の親 `,(0,x.jsx)(t.code,{children:`h2`}),` 配下)`]}),`
`,(0,x.jsxs)(t.li,{children:[`参加ボタンは Link の `,(0,x.jsx)(t.strong,{children:`外側`}),` に出して別 tab stop に (誤クリック防止)`]}),`
`,(0,x.jsxs)(t.li,{children:[`サムネ画像は装飾扱い (`,(0,x.jsx)(t.code,{children:`alt=""`}),`) — タイトルが隣接しているため`]}),`
`,(0,x.jsx)(t.li,{children:`ステータスは色 + テキスト両方で伝達 (Design.md §10)`}),`
`,(0,x.jsxs)(t.li,{children:[(0,x.jsx)(t.code,{children:`aria-label`}),` でカード単位の意味を補強: `,(0,x.jsx)(t.code,{children:`<Link aria-label="イベント: タイトル, 開催: 2026/06/12, オンライン">`})]}),`
`]}),`
`,(0,x.jsx)(t.h2,{id:`9-レスポンシブ`,children:`9. レスポンシブ`}),`
`,(0,x.jsxs)(t.ul,{children:[`
`,(0,x.jsxs)(t.li,{children:[`モバイル: 強制的に `,(0,x.jsx)(t.code,{children:`grid`}),` variant に (1 列)`]}),`
`,(0,x.jsxs)(t.li,{children:[`タブレット (md): `,(0,x.jsx)(t.code,{children:`grid`}),` 2 列`]}),`
`,(0,x.jsx)(t.li,{children:`デスクトップ (lg+): list (注目) / grid 3 列 (一覧) の使い分け`}),`
`]}),`
`,(0,x.jsx)(t.h2,{id:`10-使用例-code`,children:`10. 使用例 (Code)`}),`
`,(0,x.jsx)(t.h3,{id:`101-list-variant`,children:`10.1 list variant`}),`
`,(0,x.jsx)(t.pre,{children:(0,x.jsx)(t.code,{className:`language-tsx`,children:`import { EventCard } from "@tech-event/shared-ui-composite";

<EventCard
  variant="list"
  event={{
    id: 1n,
    title: "AI で始める TypeScript",
    status: "open",
    startsAt: new Date("2026-06-12T19:00:00"),
    venue: "オンライン",
    capacity: 30,
    participants: 12,
    group: { name: "Tokyo TypeScript", subdomain: "ts-tokyo" },
    tags: ["AI", "TypeScript"],
    thumbnail: null,
  }}
/>
`})}),`
`,(0,x.jsx)(t.h3,{id:`102-grid-3-列レイアウト`,children:`10.2 grid (3 列レイアウト)`}),`
`,(0,x.jsx)(t.pre,{children:(0,x.jsx)(t.code,{className:`language-tsx`,children:`<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {events.map((e) => (
    <EventCard key={String(e.id)} variant="grid" event={e} />
  ))}
</div>
`})}),`
`,(0,x.jsx)(t.h3,{id:`103-loading-skeleton`,children:`10.3 loading (skeleton)`}),`
`,(0,x.jsx)(t.pre,{children:(0,x.jsx)(t.code,{className:`language-tsx`,children:`import { EventCardSkeleton } from "@tech-event/shared-ui-composite";

{isLoading ? (
  <div className="grid grid-cols-3 gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <EventCardSkeleton key={i} variant="grid" />
    ))}
  </div>
) : (
  <EventCardList events={events} />
)}
`})}),`
`,(0,x.jsx)(t.h2,{id:`11-アンチパターン-anti-patterns`,children:`11. アンチパターン (Anti-patterns)`}),`
`,(0,x.jsxs)(t.ul,{children:[`
`,(0,x.jsxs)(t.li,{children:[`❌ `,(0,x.jsx)(t.code,{children:`<a>`}),` でない要素にクリック → ✅ `,(0,x.jsx)(t.code,{children:`<Link>`}),` でラップ`]}),`
`,(0,x.jsxs)(t.li,{children:[`❌ サムネが正方形 / アスペクト崩壊 → ✅ 16:9 厳守 + `,(0,x.jsx)(t.code,{children:`object-cover`})]}),`
`,(0,x.jsxs)(t.li,{children:[`❌ タイトル `,(0,x.jsx)(t.code,{children:`line-clamp`}),` なしで 3 行以上に → ✅ `,(0,x.jsx)(t.code,{children:`line-clamp-2`}),` 必須`]}),`
`,(0,x.jsx)(t.li,{children:`❌ ステータスを色だけで表現 → ✅ EventStatusBadge を必ず併記`}),`
`,(0,x.jsx)(t.li,{children:`❌ list variant に長いラベル → ✅ 右側 CTA は短く (参加 / 申込)`}),`
`,(0,x.jsx)(t.li,{children:`❌ list を縦に並べて Timeline 風にする → ✅ EventTimeline を使う`}),`
`]}),`
`,(0,x.jsx)(t.h2,{id:`12-関連-related`,children:`12. 関連 (Related)`}),`
`,(0,x.jsxs)(t.ul,{children:[`
`,(0,x.jsxs)(t.li,{children:[(0,x.jsx)(t.a,{href:`./event-card-compact.md`,children:`EventCardCompact`}),` — grid variant の薄いラッパー`]}),`
`,(0,x.jsxs)(t.li,{children:[(0,x.jsx)(t.a,{href:`../ui/skeleton.md`,children:`EventCardSkeleton`}),` — loading`]}),`
`,(0,x.jsxs)(t.li,{children:[(0,x.jsx)(t.a,{href:`./event-list-row.md`,children:`EventListRow`}),` — 1 行型`]}),`
`,(0,x.jsxs)(t.li,{children:[(0,x.jsx)(t.a,{href:`./event-timeline.md`,children:`EventTimeline`}),` — 月見出し自動グルーピング`]}),`
`,(0,x.jsx)(t.li,{children:(0,x.jsx)(t.a,{href:`../components/event-status-badge.md`,children:`EventStatusBadge`})}),`
`,(0,x.jsx)(t.li,{children:(0,x.jsx)(t.a,{href:`../components/tag-pill.md`,children:`TagPill`})}),`
`,(0,x.jsx)(t.li,{children:(0,x.jsx)(t.a,{href:`../components/host-avatar-stack.md`,children:`HostAvatarStack`})}),`
`,(0,x.jsx)(t.li,{children:(0,x.jsx)(t.a,{href:`../blocks/cards.md`,children:`blocks/cards.md`})}),`
`]}),`
`,(0,x.jsx)(t.h2,{id:`13-変更履歴`,children:`13. 変更履歴`}),`
`,(0,x.jsxs)(t.ul,{children:[`
`,(0,x.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース、list / grid 2 variant、サムネフォールバック付き`}),`
`]}),`
`,(0,x.jsx)(t.hr,{}),`
`,(0,x.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,x.jsx)(o,{includePrimary:!1})]})}function b(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,x.jsx)(t,{...e,children:(0,x.jsx)(y,{...e})}):y(e)}var x;e((()=>{x=t(),d(),c(),_()}))();export{b as default};