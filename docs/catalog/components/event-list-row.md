---
status: stable
figma: TODO
storybook: libs/shared/ui-composite/src/EventListRow.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P2, P3, P4, P6]
---

# EventListRow

> Design.md 準拠 | Storybook: [EventListRow stories](../../../libs/shared/ui-composite/src/EventListRow.stories.tsx) | 実装: `libs/shared/ui-composite/src/EventListRow.tsx`

## 対象ペルソナ

- 主要: P1 山田美咲 (モバイル: 縦長スクロール)、P2 田中慎太郎、P3 佐藤健太 (抽選イベントの 1 行スキャン)
- 副次: P4 鈴木大輔、P6 小林一郎 (主催ビュー: 申込数 trailing)

(根拠: [`Personas.md`](../../../Personas.md))

## 1. 目的 (Purpose)
イベント 1 件を **1 行 88-96px** の高密度フォーマットで表示する composite component。connpass の検索結果 / ランキング / タイムラインに最も近いレイアウト。`showRank` で順位バッジを付加できる。

## 2. いつ使うか (When to use)
- 検索結果 (`/search`)
- ランキング (`/ranking`) — `showRank` で順位バッジ
- ユーザーの参加履歴 / ブックマーク (`/bookmarks`)
- グループの開催履歴
- タイムライン UI ([EventTimeline](./event-timeline.md)) の各行

## 3. いつ使わないか (When NOT to use)
- **カード表示 (グリッド)** → [EventCard](./event-card.md) `variant="grid"`
- **トップページの注目** → [EventCard](./event-card.md) `variant="list"`
- **3 件以下の小プレビュー** → [RecentlyViewedEvents](../components/recently-viewed-events.md)
- **詳細ページ本体** → 専用テンプレート

## 4. 構造 (Anatomy) — Design.md §5.4 厳格仕様

```
┌──────────────────────────────────────────────────────────────────┐
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
```

### 厳格な配置順 (Design.md §5.4 から)
1. サムネ 80×60 (16:9 を内包) — 無ければ brand-orange グラデ + Calendar アイコン
2. ステータスバッジ + (タグピル + グループ名)
3. タイトル (15-16px / bold) — `line-clamp-2`
4. 日付 + 会場 (12px / muted)
5. 右端: 参加者 N/M + 「参加」(縦積み、自前 nowrap)

connpass を踏襲し、Luma 並みの余白は取らない。

## 5. バリアント (Variants)

<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->
| variant | 用途 |
|---|---|
| 標準 | 検索結果 / ランキング |
| `showRank` | ランキングで先頭に順位バッジ (1/2/3 はメダル色) |
| `compact` | EventTimeline 内部用 (余白縮小) |


<!-- AUTO-GENERATED END: variants -->

## 6. サイズ

固定高さ ~88-96px。`compact` でも 80px 程度に留める。

## 7. 状態 (States)

| 状態 | 視覚 |
|---|---|
| default | `bg-surface` + `border-b border-border` |
| hover | `bg-background` (薄く反転) |
| loading | [EventListRowSkeleton](./event-list-row.md) |
| empty | 親で [EmptyState](../ui/empty-state.md) |

## 8. アクセシビリティ (Accessibility)

- 行全体は `<Link>` でラップ (`block` レイアウト)
- 参加ボタンは Link の外側に出して別 tab stop
- 順位バッジ (`showRank`) は `aria-label="1位"` などで読み上げ補強
- 高密度なので zoom 200% でレイアウト崩壊しないか確認 (axe で検出)
- メタ情報のアイコンは `aria-hidden`、隣接テキストで意味を担保

## 9. レスポンシブ

- モバイル: サムネを小さく (`64×48`)、参加ボタンを下に折り返す or 非表示にしてカード末尾に
- タブレット (md): 標準 80×60
- デスクトップ: 標準 + 右側に余白多めに

## 10. 使用例 (Code)

### 10.1 検索結果
```tsx
import { EventListRow } from "@tech-event/shared-ui-composite";

<div className="divide-y divide-border">
  {events.map((e) => (
    <EventListRow key={String(e.id)} event={e} />
  ))}
</div>
<Pagination current={page} total={totalPages} buildHref={(p) => `/search?q=${q}&page=${p}`} />
```

### 10.2 ランキング (順位バッジ)
```tsx
<ul className="divide-y divide-border">
  {ranked.map((e, i) => (
    <li key={String(e.id)}>
      <EventListRow event={e} showRank rank={i + 1} />
    </li>
  ))}
</ul>
```

### 10.3 EventTimeline 内 (compact)
```tsx
<EventTimeline events={events} stickyTopPx={64} />
// 内部で EventListRow compact 表示
```

## 11. アンチパターン (Anti-patterns)

- ❌ サムネを正方形 / 非 16:9 → ✅ 16:9 厳守
- ❌ タイトル 3 行以上 → ✅ `line-clamp-2`
- ❌ 右端の CTA を長文 → ✅ 「参加」「申込」など短く
- ❌ 行をボタンにする (`<button>`) → ✅ `<Link>` でラップ (画面遷移)
- ❌ メタ情報を 3 行以上 → ✅ 1 行で日付 + 会場まで
- ❌ Luma 風に余白を増やす → ✅ connpass 寄りの密度を守る (Design.md §5.4)
- ❌ ステータスを色だけで → ✅ EventStatusBadge 必須

## 12. 関連

- [EventCard](./event-card.md) — カード表示
- [EventTimeline](./event-timeline.md) — タイムラインの内部実装
- [EventCardSkeleton / EventListRowSkeleton](../ui/skeleton.md)
- [Pagination](../components/pagination.md)
- [EventStatusBadge](../components/event-status-badge.md)
- [blocks/lists-and-tables.md](../blocks/lists-and-tables.md)

## 13. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース、Design.md §5.4 仕様準拠
