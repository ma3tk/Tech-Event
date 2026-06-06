---
status: stable
figma: TODO
storybook: libs/shared/ui-composite/src/MiniCalendar.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P2, P6]
---

# MiniCalendar

> Design.md 準拠 | Storybook: [MiniCalendar stories](../../../libs/shared/ui-composite/src/MiniCalendar.stories.tsx) | 実装: `libs/shared/ui-composite/src/MiniCalendar.tsx`

## 1. 目的
サイドバー用の **ミニカレンダー**。開催日にドット表示でイベント有無を示す。`date-fns` ベース。

## 2. いつ使うか
- グループページのサイドバー
- ユーザープロフィールのサイドバー
- カレンダーページのナビ

## 3. いつ使わないか
- 大きなカレンダー UI → 別 component
- 日付選択 → Calendar (将来 atom 化予定)

## 4. アクセシビリティ

- `<table role="grid">` (date-fns 慣用)
- 開催日には `aria-label` を補強

## 5. 使用例

```tsx
<MiniCalendar
  eventDates={dates}
  onSelectDate={(d) => router.push(`/calendar?date=${d}`)}
/>
```

## 6. 関連

- [Card](../01-atoms/card.md) (サイドバー枠)

## 7. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース
