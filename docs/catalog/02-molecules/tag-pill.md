---
status: stable
figma: TODO
storybook: libs/shared/ui-composite/src/TagPill.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P2]
---

# TagPill

> Design.md 準拠 | Storybook: [TagPill stories](../../../libs/shared/ui-composite/src/TagPill.stories.tsx) | 実装: `libs/shared/ui-composite/src/TagPill.tsx`

## 1. 目的
タグ表示用の **角丸ピル**。Badge ベースだが、フィルタトグル / 削除可能 / リンク化の派生を持つドメイン特化 molecule。

## 2. いつ使うか
- イベント / グループ / ユーザーの **タグ表示**
- 検索フィルタ (選択可能なタグ群)
- タグ入力フォーム (選択済みの表示 + 削除ボタン付き)

## 3. いつ使わないか
- 状態表示 → [EventStatusBadge](./event-status-badge.md)
- カウント → [Badge](../01-atoms/badge.md)

## 4. バリアント

<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->
| variant | 用途 |
|---|---|
| `default` | 静的表示 |
| `filter` | クリックで絞り込み Link |
| `selectable` | トグル選択 (aria-pressed) |
| `outline` | フラットな代替 |


<!-- AUTO-GENERATED END: variants -->

## 5. 使用例

```tsx
import { TagPill } from "@tech-event/shared-ui-composite";

<div className="flex flex-wrap gap-1">
  {event.tags.map((t) => (
    <TagPill key={t} variant="filter" href={`/explore?tag=${t}`}>
      {t}
    </TagPill>
  ))}
</div>
```

## 6. アクセシビリティ

- selectable は `aria-pressed`
- リンクは `<Link>` で
- 削除ボタンは `aria-label="○○を削除"`

## 7. アンチパターン

- ❌ 任意 hex → ✅ variant prop
- ❌ クリック可能なのに非リンク → ✅ filter は Link で

## 8. 関連

- [Badge](../01-atoms/badge.md)
- [EventStatusBadge](./event-status-badge.md)

## 9. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース、4 variant
