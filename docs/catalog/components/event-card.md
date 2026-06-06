---
status: stable
figma: TODO
storybook: libs/shared/ui-composite/src/EventCard.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P2, P6, P7]
---

# EventCard

> Design.md 準拠 | Storybook: [EventCard stories](../../../libs/shared/ui-composite/src/EventCard.stories.tsx) | 実装: `libs/shared/ui-composite/src/EventCard.tsx`

## 対象ペルソナ

- 主要: P1 山田美咲 (モバイル: 一覧)、P2 田中慎太郎 (週末ブラウジング)、P6 小林一郎 (主催: variant=host)
- 副次: P3 佐藤健太、P7 高橋真由美、P8 渡辺浩之

(根拠: [`Personas.md`](../../../Personas.md))

## 1. 目的 (Purpose)
イベントを **カード形式** で見せるドメイン特化の composite component。`list` (横長) / `grid` (縦積み) の 2 variant を持ち、トップページの注目イベント / 関連イベント / 検索結果 (compact 1 行表示は [EventListRow](./event-list-row.md)) で使う。

## 2. いつ使うか (When to use)
- トップページの「注目イベント」「新着イベント」セクション
- グループページの「過去のイベント」グリッド
- 検索結果の **カード表示モード** (1 行表示は EventListRow)
- 関連イベント / レコメンド
- ユーザーが参加予定のイベント一覧 (dashboard)

## 3. いつ使わないか (When NOT to use)
- **1 行で情報を高密度に** → [EventListRow](./event-list-row.md)
- **タイムライン UI** → [EventTimeline](./event-timeline.md)
- **CTA を強く出したい詳細上部** → ヘッダーセクションを直接組む (EventCard は本体ではない)
- **3 件以下の小さなプレビュー** → [RecentlyViewedEvents](../components/recently-viewed-events.md)

## 4. 構造 (Anatomy)

### list variant (横長)
```
┌──────────────────────────────────────────────────────────────┐
│ ┌─────────┐                                                  │
│ │サムネ   │  [open バッジ] [タグピル] グループ名             │
│ │ 80×60   │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ │         │  イベントタイトル (line-clamp-2)                 │
│ └─────────┘  📅 2026-06-12  📍 オンライン   👥 12/30  [参加] │
└──────────────────────────────────────────────────────────────┘
```

### grid variant (縦積み)
```
┌────────────────────┐
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
```

- サムネ (80×60 / 16:9): 無ければ `bg-brand-orange-soft` + Calendar icon フォールバック
- ステータスバッジ + タグピル + グループ名 (1 行)
- タイトル (15-16px bold, `line-clamp-2`)
- メタ (日付 / 会場 / 参加者) — `text-xs text-muted-foreground`
- 右端の参加ボタン (list variant のみ)

## 5. バリアント (Variants)

<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->
| variant | 用途 | レイアウト |
|---|---|---|
| `list` | デスクトップの注目枠 / 関連枠 | 横長 1 行型 |
| `grid` | グリッド表示 / モバイル | 縦積み 16:9 サムネ |

`grid` は内部的に `EventCardCompact` ラッパー経由でも呼べる。


<!-- AUTO-GENERATED END: variants -->

## 6. サイズ

`list` / `grid` の固定。サイズ prop なし。グリッド時は親で `grid-cols-*` を制御。

## 7. 状態 (States)

| 状態 | 視覚 |
|---|---|
| default | `shadow-sm bg-surface` |
| hover | `shadow-md -translate-y-0.5 duration-normal` |
| loading | [EventCardSkeleton](./event-card.md) で置換 |
| empty | 親レベルで [EmptyState](../ui/empty-state.md) を出す |
| selected | `ring-2 ring-brand-orange` (任意) |

## 8. アクセシビリティ (Accessibility)

- カード全体は `<Link href="/event/${id}">` でラップ
- タイトルは `h3` (リスト内の親 `h2` 配下)
- 参加ボタンは Link の **外側** に出して別 tab stop に (誤クリック防止)
- サムネ画像は装飾扱い (`alt=""`) — タイトルが隣接しているため
- ステータスは色 + テキスト両方で伝達 (Design.md §10)
- `aria-label` でカード単位の意味を補強: `<Link aria-label="イベント: タイトル, 開催: 2026/06/12, オンライン">`

## 9. レスポンシブ

- モバイル: 強制的に `grid` variant に (1 列)
- タブレット (md): `grid` 2 列
- デスクトップ (lg+): list (注目) / grid 3 列 (一覧) の使い分け

## 10. 使用例 (Code)

### 10.1 list variant
```tsx
import { EventCard } from "@tech-event/shared-ui-composite";

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
```

### 10.2 grid (3 列レイアウト)
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {events.map((e) => (
    <EventCard key={String(e.id)} variant="grid" event={e} />
  ))}
</div>
```

### 10.3 loading (skeleton)
```tsx
import { EventCardSkeleton } from "@tech-event/shared-ui-composite";

{isLoading ? (
  <div className="grid grid-cols-3 gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <EventCardSkeleton key={i} variant="grid" />
    ))}
  </div>
) : (
  <EventCardList events={events} />
)}
```

## 11. アンチパターン (Anti-patterns)

- ❌ `<a>` でない要素にクリック → ✅ `<Link>` でラップ
- ❌ サムネが正方形 / アスペクト崩壊 → ✅ 16:9 厳守 + `object-cover`
- ❌ タイトル `line-clamp` なしで 3 行以上に → ✅ `line-clamp-2` 必須
- ❌ ステータスを色だけで表現 → ✅ EventStatusBadge を必ず併記
- ❌ list variant に長いラベル → ✅ 右側 CTA は短く (参加 / 申込)
- ❌ list を縦に並べて Timeline 風にする → ✅ EventTimeline を使う

## 12. 関連 (Related)

- [EventCardCompact](./event-card-compact.md) — grid variant の薄いラッパー
- [EventCardSkeleton](../ui/skeleton.md) — loading
- [EventListRow](./event-list-row.md) — 1 行型
- [EventTimeline](./event-timeline.md) — 月見出し自動グルーピング
- [EventStatusBadge](../components/event-status-badge.md)
- [TagPill](../components/tag-pill.md)
- [HostAvatarStack](../components/host-avatar-stack.md)
- [blocks/cards.md](../blocks/cards.md)

## 13. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース、list / grid 2 variant、サムネフォールバック付き
