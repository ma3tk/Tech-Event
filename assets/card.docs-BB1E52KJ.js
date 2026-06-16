import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-DxazclGI.js";import{t as d}from"./mdx-react-shim-CQBio_OA.js";import{Basic as f,EventLike as p,HeaderOnly as m,n as h,t as g}from"./card.stories-29jiKUpq.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,h3:`h3`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:g}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsxs)(u,{children:[`情報のまとまりを `,(0,y.jsx)(t.strong,{children:`1 つの面 (surface)`}),` として視覚的に分離する最小単位。Header / Title / Description / Content / Footer の構造化スロットを提供し、EventCard / GroupCard 等のドメインカードの基盤となる。`]}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/ui/card.md`}),`。
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
`,(0,y.jsx)(t.h2,{id:`1-目的-purpose`,children:`1. 目的 (Purpose)`}),`
`,(0,y.jsxs)(t.p,{children:[`情報のまとまりを `,(0,y.jsx)(t.strong,{children:`1 つの面 (surface)`}),` として視覚的に分離する最小単位。Header / Title / Description / Content / Footer の構造化スロットを提供し、EventCard / GroupCard 等のドメインカードの基盤となる。`]}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか-when-to-use`,children:`2. いつ使うか (When to use)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`イベント / グループ / ユーザーなど `,(0,y.jsx)(t.strong,{children:`1 アイテム`}),` のまとまり表示`]}),`
`,(0,y.jsxs)(t.li,{children:[`ダッシュボードの `,(0,y.jsx)(t.strong,{children:`メトリクス枠`}),` (StatsCard 風)`]}),`
`,(0,y.jsxs)(t.li,{children:[`フォーム全体を囲む `,(0,y.jsx)(t.strong,{children:`入力グループ`}),` (Section card)`]}),`
`,(0,y.jsxs)(t.li,{children:[`サイドバーの `,(0,y.jsx)(t.strong,{children:`小機能パネル`}),` (MiniCalendar / RecentlyViewedEvents)`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか-when-not-to-use`,children:`3. いつ使わないか (When NOT to use)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`完全フラットなリスト 1 行`}),` → `,(0,y.jsx)(t.a,{href:`../components/event-list-row.md`,children:`EventListRow`}),` (Card で囲まない)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`モーダルの本体`}),` → `,(0,y.jsx)(t.a,{href:`./dialog.md`,children:`Dialog`}),` を直接 (Card は不要)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`小さな chip / pill`}),` → `,(0,y.jsx)(t.a,{href:`./badge.md`,children:`Badge`}),` / `,(0,y.jsx)(t.a,{href:`../components/tag-pill.md`,children:`TagPill`})]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`ページ全体の背景`}),` → `,(0,y.jsx)(t.code,{children:`bg-background`}),` のみ`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-構造-anatomy`,children:`4. 構造 (Anatomy)`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{children:`┌─────────────── Card ───────────────┐
│ CardHeader                          │
│   CardTitle (h3)                    │
│   CardDescription (muted)           │
│ ─────────────────────────────────── │
│ CardContent                         │
│   (main body)                       │
│ ─────────────────────────────────── │
│ CardFooter                          │
│   [Button] [Button]                 │
└─────────────────────────────────────┘
`})}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`角丸 `,(0,y.jsx)(t.code,{children:`rounded-lg`}),` (8px)`]}),`
`,(0,y.jsxs)(t.li,{children:[`面: `,(0,y.jsx)(t.code,{children:`bg-surface`})]}),`
`,(0,y.jsxs)(t.li,{children:[`影: `,(0,y.jsx)(t.code,{children:`shadow-sm`}),` (常時)、`,(0,y.jsx)(t.code,{children:`hover:shadow-md`}),` (option)`]}),`
`,(0,y.jsxs)(t.li,{children:[`区切り: 内部のセクションは `,(0,y.jsx)(t.code,{children:`border-t border-border`}),` で`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`5-バリアント-variants`,children:`5. バリアント (Variants)`}),`
`,(0,y.jsxs)(t.p,{children:[`<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->
Card 自体に CVA variant はない (構成スロットのみ)。`,(0,y.jsx)(t.strong,{children:`ドメイン特化のバリアントは別コンポーネントで`}),`:`]}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`../components/event-card.md`,children:`EventCard`}),`: list / grid variant`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`../components/group-card.md`,children:`GroupCard`}),`: standard / sidebar / compact variant`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`../components/recently-viewed-events.md`,children:`RecentlyViewedEvents`}),`: サイドバー特化`]}),`
`]}),`
`,(0,y.jsx)(t.h3,{id:`スタイル軸-tailwind-で表現`,children:`スタイル軸 (Tailwind で表現)`}),`
`,(0,y.jsxs)(t.table,{children:[(0,y.jsx)(t.thead,{children:(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.th,{children:`軸`}),(0,y.jsx)(t.th,{children:`クラス例`}),(0,y.jsx)(t.th,{children:`用途`})]})}),(0,y.jsxs)(t.tbody,{children:[(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`静的`}),(0,y.jsxs)(t.td,{children:[(0,y.jsx)(t.code,{children:`shadow-sm`}),` のみ`]}),(0,y.jsx)(t.td,{children:`サイドバーのパネル`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`hover で持ち上げ`}),(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-normal`})}),(0,y.jsx)(t.td,{children:`クリック可能なカード`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`selected`}),(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`ring-2 ring-brand-orange`})}),(0,y.jsx)(t.td,{children:`フィルタ選択中`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`ghost (border のみ)`}),(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`bg-transparent border border-border`})}),(0,y.jsx)(t.td,{children:`二次的なグループ`})]})]})]}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED END: variants -->`}),`
`,(0,y.jsx)(t.h2,{id:`6-サイズ`,children:`6. サイズ`}),`
`,(0,y.jsx)(t.p,{children:`Card 自体にサイズ prop はない。中身でコントロール。慣用パディング:`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`標準: `,(0,y.jsx)(t.code,{children:`p-6`}),` (24px)`]}),`
`,(0,y.jsxs)(t.li,{children:[`コンパクト: `,(0,y.jsx)(t.code,{children:`p-4`}),` (16px)`]}),`
`,(0,y.jsxs)(t.li,{children:[`ダッシュボード: `,(0,y.jsx)(t.code,{children:`p-5`}),` (20px)`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`7-状態-states`,children:`7. 状態 (States)`}),`
`,(0,y.jsxs)(t.table,{children:[(0,y.jsx)(t.thead,{children:(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.th,{children:`状態`}),(0,y.jsx)(t.th,{children:`視覚`})]})}),(0,y.jsxs)(t.tbody,{children:[(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`default`}),(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`bg-surface shadow-sm`})})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`hover (クリック可能時のみ)`}),(0,y.jsxs)(t.td,{children:[(0,y.jsx)(t.code,{children:`shadow-md`}),` + `,(0,y.jsx)(t.code,{children:`-translate-y-0.5`})]})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`selected`}),(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`ring-2 ring-brand-orange`})})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`disabled`}),(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`opacity-50 pointer-events-none`})})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`loading`}),(0,y.jsxs)(t.td,{children:[`内部を `,(0,y.jsx)(t.a,{href:`./skeleton.md`,children:`Skeleton`}),` で置換`]})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`empty`}),(0,y.jsxs)(t.td,{children:[`内部を `,(0,y.jsx)(t.a,{href:`./empty-state.md`,children:`EmptyState`}),` で置換`]})]})]})]}),`
`,(0,y.jsx)(t.h2,{id:`8-アクセシビリティ-accessibility`,children:`8. アクセシビリティ (Accessibility)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`Card 自体は `,(0,y.jsx)(t.strong,{children:`非インタラクティブ`}),` がデフォルト (装飾)`]}),`
`,(0,y.jsxs)(t.li,{children:[`カード全体をクリック可能にする場合は `,(0,y.jsx)(t.code,{children:`<Link>`}),` でラップ (`,(0,y.jsx)(t.code,{children:`<div onClick>`}),` 禁止)`]}),`
`,(0,y.jsxs)(t.li,{children:[`見出しは `,(0,y.jsx)(t.code,{children:`CardTitle`}),` (内部で h3) で構造を保つ`]}),`
`,(0,y.jsxs)(t.li,{children:[`役割が明確なら `,(0,y.jsx)(t.code,{children:`role="region" aria-labelledby={titleId}`}),` を補う`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`9-レスポンシブ`,children:`9. レスポンシブ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`モバイル: `,(0,y.jsx)(t.code,{children:`w-full`}),` で並列、`,(0,y.jsx)(t.code,{children:`p-4`}),` に縮める`]}),`
`,(0,y.jsxs)(t.li,{children:[`デスクトップ: `,(0,y.jsx)(t.code,{children:`grid lg:grid-cols-3 gap-4`}),` で 3 列など`]}),`
`,(0,y.jsxs)(t.li,{children:[`グリッド時は `,(0,y.jsx)(t.strong,{children:`アスペクト比固定`}),` ではなく `,(0,y.jsx)(t.strong,{children:`min-height`}),` で揃える`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`10-使用例-code`,children:`10. 使用例 (Code)`}),`
`,(0,y.jsx)(t.h3,{id:`101-基本`,children:`10.1 基本`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import {
  Card, CardHeader, CardTitle, CardDescription,
  CardContent, CardFooter,
} from "@tech-event/shared-ui";

<Card>
  <CardHeader>
    <CardTitle>イベントを作成</CardTitle>
    <CardDescription>1 分で公開できます</CardDescription>
  </CardHeader>
  <CardContent>
    {/* form 等 */}
  </CardContent>
  <CardFooter className="justify-end gap-2">
    <Button variant="secondary">下書き保存</Button>
    <Button>公開する</Button>
  </CardFooter>
</Card>
`})}),`
`,(0,y.jsx)(t.h3,{id:`102-クリック可能カード-link-でラップ`,children:`10.2 クリック可能カード (Link でラップ)`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`<Link href={\`/event/\${event.id}\`} className="block">
  <Card className="shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-normal">
    <CardContent className="p-4">
      <h3 className="text-base font-bold line-clamp-2">{event.title}</h3>
      <p className="text-xs text-muted-foreground mt-1">
        {formatDate(event.startsAt)}
      </p>
    </CardContent>
  </Card>
</Link>
`})}),`
`,(0,y.jsx)(t.h3,{id:`103-ダッシュボードの-metric-card`,children:`10.3 ダッシュボードの metric card`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`<Card className="p-5">
  <p className="text-sm text-muted-foreground">今月の参加者</p>
  <p className="text-3xl font-bold mt-1 tabular-nums">
    {new Intl.NumberFormat("ja-JP").format(count)}
  </p>
  <p className="text-xs text-status-open-fg mt-1">+12% vs 先月</p>
</Card>
`})}),`
`,(0,y.jsx)(t.h2,{id:`11-アンチパターン-anti-patterns`,children:`11. アンチパターン (Anti-patterns)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`❌ Card の中に Card (入れ子) → ✅ Separator か background 差で表現`}),`
`,(0,y.jsxs)(t.li,{children:[`❌ `,(0,y.jsx)(t.code,{children:`<div onClick>`}),` でクリック可能化 → ✅ `,(0,y.jsx)(t.code,{children:`<Link>`}),` でラップ (キーボード対応)`]}),`
`,(0,y.jsxs)(t.li,{children:[`❌ `,(0,y.jsx)(t.code,{children:`bg-white`}),` ハードコード → ✅ `,(0,y.jsx)(t.code,{children:`bg-surface`}),` (theme 対応)`]}),`
`,(0,y.jsxs)(t.li,{children:[`❌ 影を派手にする (`,(0,y.jsx)(t.code,{children:`shadow-2xl`}),`) → ✅ `,(0,y.jsx)(t.code,{children:`shadow-sm`}),` ベースで控えめに`]}),`
`,(0,y.jsxs)(t.li,{children:[`❌ Card 全体に `,(0,y.jsx)(t.code,{children:`cursor-pointer`}),` だが Link でない → ✅ 必ず Link`]}),`
`,(0,y.jsx)(t.li,{children:`❌ Title 抜き → ✅ 構造化のために CardTitle 必須 (純飾りパネルは除く)`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`12-関連-related`,children:`12. 関連 (Related)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`../components/event-card.md`,children:`EventCard`}),` — イベント特化 (list/grid variant)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`../components/group-card.md`,children:`GroupCard`}),` — グループ特化`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`./skeleton.md`,children:`Skeleton`}),` — loading 状態`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`./empty-state.md`,children:`EmptyState`}),` — 空状態`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`../blocks/cards.md`,children:`blocks/cards.md`}),` — Card 系の使い分け詳細`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`13-変更履歴`,children:`13. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース、Header/Title/Description/Content/Footer の構造化スロット`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),h()}))();export{v as default};