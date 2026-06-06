---
status: stable
figma: TODO
storybook: libs/shared/ui-composite/src/GroupCard.stories.tsx
last_reviewed: 2026-06-06
personas: [P2, P6, P7]
---

# GroupCard

> Design.md 準拠 | Storybook: [GroupCard stories](../../../libs/shared/ui-composite/src/GroupCard.stories.tsx) | 実装: `libs/shared/ui-composite/src/GroupCard.tsx`

## 1. 目的
グループを **カード形式** で表示。`standard` / `sidebar` / `compact` の 3 variant。参加ボタン付き。

## 2. いつ使うか
- グループ一覧 (`/groups`)
- ユーザープロフィールの「所属グループ」
- イベント詳細サイドバーの「主催グループ」 (sidebar variant)
- 関連グループのコンパクト表示 (compact)

## 3. いつ使わないか
- グループ単独のヘッダー → 専用 hero
- 1 行のリスト → 別 component

## 4. バリアント

<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->
| variant | 用途 |
|---|---|
| `standard` | 一覧グリッド |
| `sidebar` | サイドバーの強調カード |
| `compact` | 関連グループの小カード |


<!-- AUTO-GENERATED END: variants -->

## 5. アクセシビリティ

- カード全体は `<Link>` でラップ
- 参加ボタンは外側 (別 tab stop)

## 6. 使用例

```tsx
import { GroupCard } from "@tech-event/shared-ui-composite";

<GroupCard group={group} variant="standard" />
```

## 7. 関連

- [Card](../01-atoms/card.md)
- [EventCard](./event-card.md)
- [04-patterns/cards.md](../04-patterns/cards.md)

## 8. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース、3 variant
