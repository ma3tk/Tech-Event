# RecentlyViewedEvents

> Design.md 準拠 | 実装: `libs/shared/ui-composite/src/RecentlyViewedEvents.tsx`

## 1. 目的
**sessionStorage** に保存された「最近見たイベント」一覧 (Client Component)。サイドバーのコンパクトパネル。

## 2. いつ使うか
- イベント詳細ページのサイドバー
- グループページのサイドバー (任意)

## 3. いつ使わないか
- メイン領域 → EventCard を使う
- ログイン依存の履歴 → 別 (DB 連動) コンポーネント

## 4. アクセシビリティ

- `<aside aria-label="最近見たイベント">`
- 空時は EmptyState

## 5. 使用例

```tsx
<RecentlyViewedEvents currentEventId={event.id} />
```

## 6. 関連

- [Card](../01-atoms/card.md)
- [EventCard](../03-organisms/event-card.md)

## 7. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース
