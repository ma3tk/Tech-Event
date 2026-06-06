# EmptyState

> Design.md 準拠 | Storybook: [EmptyState stories](../../../libs/shared/ui/src/empty-state.stories.tsx) | 実装: `libs/shared/ui/src/empty-state.tsx`

## 1. 目的
データが **0 件 / 未作成** の状態を、その理由と次のアクションを示しながら伝える。

## 2. いつ使うか
- 一覧が空 (「まだイベントがありません」)
- フィルタ結果 0 件
- 未作成状態 (「最初のグループを作る」)
- 検索結果なし

## 3. いつ使わないか
- ロード中 → [Skeleton](./skeleton.md) / [LoadingState](./loading-state.md)
- エラー → [ErrorState](./error-state.md)

## 4. 構造

```
┌─────────────────────────────────────┐
│            [大きめのアイコン]         │
│                                       │
│         まだイベントがありません      │
│   最初のイベントを作成してみよう      │
│                                       │
│         [ + 新しいイベント ]           │
└─────────────────────────────────────┘
```

## 5. バリアント

`variant`:
- `default` — 通常
- `search` — 検索結果 0 件
- `filter` — フィルタ 0 件 (フィルタをリセットする CTA)

## 6. アクセシビリティ

- `role="status"`
- 主見出しは適切なレベル (`h2` or `h3`)
- CTA Button or Link 1 つに絞る

## 7. 使用例

```tsx
import { EmptyState } from "@tech-event/shared-ui";
import { Calendar } from "lucide-react";

<EmptyState
  icon={<Calendar />}
  title="まだイベントがありません"
  description="最初のイベントを作成してみましょう"
  action={
    <Button asChild>
      <Link href="/event/new">新しいイベント</Link>
    </Button>
  }
/>
```

## 8. アンチパターン

- ❌ 空のテーブル / 空のリスト (何も出さない) → ✅ EmptyState を出す
- ❌ 説明なし → ✅ 何故空か & 次のアクションを言語化
- ❌ CTA 複数 → ✅ 主要 1 つに絞る

## 9. 関連

- [LoadingState](./loading-state.md)
- [ErrorState](./error-state.md)
- [04-patterns/feedback.md](../04-patterns/feedback.md)

## 10. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース
