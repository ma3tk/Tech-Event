---
status: stable
figma: TODO
storybook: libs/shared/ui-composite/src/EventCardCompact.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P2]
---

# EventCardCompact

> Design.md 準拠 | 実装: `libs/shared/ui-composite/src/EventCardCompact.tsx`

## 1. 目的
`EventCard` の `grid` variant の薄いラッパー。意味的に「コンパクトな表示が欲しい」呼び出し側を明示化する。

## 2. いつ使うか
- グリッド一覧
- 関連イベント表示
- モバイル

## 3. いつ使わないか
- 1 行表示 → [EventListRow](./event-list-row.md)
- list 横長 → [EventCard](./event-card.md) `variant="list"`

## 4. 使用例

```tsx
import { EventCardCompact } from "@tech-event/shared-ui-composite";

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {events.map((e) => (
    <EventCardCompact key={String(e.id)} event={e} />
  ))}
</div>
```

## 5. 関連

- [EventCard](./event-card.md)
- [04-patterns/cards.md](../04-patterns/cards.md)

## 6. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース
