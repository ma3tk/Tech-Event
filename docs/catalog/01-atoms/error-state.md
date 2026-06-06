# ErrorState

> Design.md 準拠 | Storybook: [ErrorState stories](../../../libs/shared/ui/src/error-state.stories.tsx) | 実装: `libs/shared/ui/src/error-state.tsx`

## 1. 目的
**永続的に表示するエラー** UI。Toast の一時的通知と違い、画面の一部 / 全体を占有して、原因と対処を示す。

## 2. いつ使うか
- データ取得失敗 (リスト全体が空 with error)
- 認可エラー (画面アクセス権なし)
- ネットワークエラー (リトライボタン付き)
- 致命的なエラー (`error.tsx` 内)

## 3. いつ使わないか
- 短時間で消える成功/失敗 → [Toast](./toast.md)
- 入力検証 → [Form](./form.md) FormMessage (inline)
- 空状態 → [EmptyState](./empty-state.md)

## 4. 構造

```
┌─────────────────────────────────────┐
│        [⚠ アイコン]                  │
│                                       │
│   読み込みに失敗しました              │
│   時間をおいて再度お試しください      │
│                                       │
│       [ 再読み込み ]                   │
└─────────────────────────────────────┘
```

## 5. バリアント

`variant`:
- `default` — 一般
- `permission` — 権限なし
- `network` — ネットワーク
- `not-found` — 404 系

## 6. アクセシビリティ

- `role="alert"` + `aria-live="assertive"`
- リトライ CTA に明確なラベル

## 7. 使用例

```tsx
import { ErrorState } from "@tech-event/shared-ui";
import { AlertTriangle } from "lucide-react";

<ErrorState
  icon={<AlertTriangle />}
  title="読み込みに失敗しました"
  description="ネットワークを確認してもう一度お試しください"
  action={
    <Button onClick={refetch}>再読み込み</Button>
  }
/>
```

## 8. アンチパターン

- ❌ 原因を技術用語で → ✅ ユーザーが行動できる言葉で
- ❌ リトライなし → ✅ 可能ならアクション提供
- ❌ Toast で永続化 → ✅ ErrorState で

## 9. 関連

- [Toast](./toast.md)
- [EmptyState](./empty-state.md)
- [LoadingState](./loading-state.md)
- [04-patterns/feedback.md](../04-patterns/feedback.md)

## 10. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース
