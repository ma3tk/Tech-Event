---
status: stable
figma: TODO
storybook: libs/shared/ui/src/loading-state.stories.tsx
last_reviewed: 2026-06-06
personas: [P1]
---

# LoadingState

> Design.md 準拠 | Storybook: [LoadingState stories](../../../libs/shared/ui/src/loading-state.stories.tsx) | 実装: `libs/shared/ui/src/loading-state.tsx`

## 1. 目的
**インタラクション後の短い待機** を中央スピナー + テキストで明示する UI。Skeleton と違い、内容のレイアウトを示さず "読み込んでいる" だけを伝える。

## 2. いつ使うか
- ボタン押下後の通信待ち (フォーム送信)
- Server Action の long task
- ルート遷移中 (`loading.tsx`)

## 3. いつ使わないか
- 一覧のロード → [Skeleton](./skeleton.md) (レイアウト示す)
- 100ms 以下の短い処理 → 何も出さない (UI ノイズ回避)

## 4. 構造

```
       ◌
   読み込み中…
```

## 5. バリアント

<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->
- `inline` — テキスト横に小さくスピナー
- `block` — ブロック中央 (default)
- `fullscreen` — 画面全体オーバーレイ


<!-- AUTO-GENERATED END: variants -->

## 6. アクセシビリティ

- `role="status"` + `aria-live="polite"`
- `aria-label="読み込み中"`
- `prefers-reduced-motion` でスピナーを静止画に

## 7. 使用例

```tsx
import { LoadingState } from "@tech-event/shared-ui";

<LoadingState variant="block" message="読み込み中" />

// または inline
<Button disabled aria-busy>
  <Loader2 className="animate-spin" />
  送信中…
</Button>
```

## 8. アンチパターン

- ❌ 100ms 以下にも出す → ✅ skip
- ❌ メッセージなし → ✅ 「読み込み中」「送信中」など状態を明示
- ❌ ループアニメ過剰 → ✅ 単一スピナーに

## 9. 関連

- [Skeleton](./skeleton.md)
- [EmptyState](./empty-state.md)
- [ErrorState](./error-state.md)
- [blocks/feedback.md](../blocks/feedback.md)

## 10. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース
