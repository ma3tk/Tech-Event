# EventTimeline

> Design.md 準拠 | Storybook: [EventTimeline stories](../../../libs/shared/ui-composite/src/EventTimeline.stories.tsx) | 実装: `libs/shared/ui-composite/src/EventTimeline.tsx`

## 1. 目的
Luma 風の **月見出し自動グルーピング タイムライン**。内部で [EventListRow](./event-list-row.md) compact 表示を使い、`stickyTopPx` で月見出しの上端調整が可能。

## 2. いつ使うか
- グループページの「過去のイベント」
- カレンダーページ (`/calendar/[slug]`)
- ユーザープロフィールの「主催履歴」「参加履歴」

## 3. いつ使わないか
- グリッド表示 → [EventCard](./event-card.md) grid
- 検索結果 (関連順) → [EventListRow](./event-list-row.md) 単独
- 1 件のみ表示 → カードで十分

## 4. 構造

```
2026 年 6 月       ← 月見出し (sticky)
├ EventListRow    
├ EventListRow    
└ EventListRow    
2026 年 5 月       ← 月見出し
├ EventListRow    
└ EventListRow    
```

## 5. アクセシビリティ

- 月見出しは `h2`
- sticky 表示時もコントラスト維持
- リストは `<ul role="list">`

## 6. 使用例

```tsx
<EventTimeline events={events} stickyTopPx={64} />
```

## 7. 関連

- [EventListRow](./event-list-row.md)
- [04-patterns/lists-and-tables.md](../04-patterns/lists-and-tables.md)

## 8. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース、月見出し自動グルーピング
