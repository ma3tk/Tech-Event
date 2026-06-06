# Skeleton

> Design.md 準拠 | Storybook: [Skeleton stories](../../../libs/shared/ui/src/skeleton.stories.tsx) | 実装: `libs/shared/ui/src/skeleton.tsx`

## 1. 目的
データ取得中の **コンテンツ骨格** を表示するプレースホルダ。`animate-pulse` でループ感を出すが、`prefers-reduced-motion` で停止 (Design.md §8 例外規定)。

## 2. いつ使うか
- 一覧 (Card / Row) の loading 表示
- ページ全体の初期化中
- 個別セクション (sidebar / panel) の loading

## 3. いつ使わないか
- インタラクション後の短い待機 → [LoadingState](./loading-state.md) (中央スピナー)
- 永続的に空 → [EmptyState](./empty-state.md)
- エラー時 → [ErrorState](./error-state.md)

## 4. 構造

```
████████████████        ← 矩形 + pulse
████ ███████ ██
█████████████████
```

## 5. バリアント

なし (`className` で形・サイズを指定)。

## 6. 状態

`animate-pulse` ループのみ。`prefers-reduced-motion` で停止。

## 7. アクセシビリティ

- `aria-busy="true"` を親に付ける
- `role="status"` + `aria-label="読み込み中"` を 1 箇所
- 過剰な pulse はめまいを誘発 → max 1 ループに留めない

## 8. 使用例

```tsx
import { Skeleton } from "@tech-event/shared-ui";

<div aria-busy="true" role="status" aria-label="読み込み中" className="space-y-2">
  <Skeleton className="h-6 w-3/4" />
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-5/6" />
</div>
```

ドメイン用には `EventCardSkeleton` / `EventListRowSkeleton` / `GroupCardSkeleton` を使う。

## 9. アンチパターン

- ❌ 派手な shimmer → ✅ pulse のみ (Design.md §8)
- ❌ aria-busy 抜け → ✅ 必須
- ❌ 短すぎる待機にも skeleton → ✅ 100ms 以下なら何も出さない

## 10. 関連

- [LoadingState](./loading-state.md)
- [EmptyState](./empty-state.md)
- [ErrorState](./error-state.md)

## 11. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース
