---
status: stable
figma: TODO
storybook: libs/shared/ui/src/toast.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P4, P6]
---

# フィードバック (Feedback)

> Design.md §6 + §10 準拠

## 対象ペルソナ

- 主要: P1 山田美咲 (申込確認 Toast)、P6 小林一郎 (主催: 申込変動通知)
- 副次: P4 鈴木大輔 (エラーメッセージの正確性)、P7 高橋真由美

(根拠: [`Personas.md`](../../../Personas.md))

## 1. 4 状態のフィードバック

| 状態 | コンポーネント | 表示時間 |
|---|---|---|
| Loading | [LoadingState](../ui/loading-state.md) / [Skeleton](../ui/skeleton.md) | 待機中 |
| Empty | [EmptyState](../ui/empty-state.md) | 永続 |
| Error | [ErrorState](../ui/error-state.md) (永続) / [Toast](../ui/toast.md) (一時) | 永続 / 3-5 秒 |
| Success | [Toast](../ui/toast.md) | 3-4 秒 |

## 2. 使い分け判断フロー

```
非同期処理の状態は?
  ├ 待機中
  │   ├ 一覧の骨格を示せる → Skeleton (EventCardSkeleton 等)
  │   └ 個別の short task   → LoadingState (中央スピナー)
  ├ 0 件 / 未作成
  │   └ EmptyState (icon + title + description + CTA)
  ├ エラー
  │   ├ ページ / セクション全体が機能不全 → ErrorState (永続)
  │   └ 一時的な操作失敗                    → Toast (error variant)
  └ 成功
      └ Toast (success variant)
```

## 3. 標準パターン

### 3.1 一覧のロード→表示→空→エラー
```tsx
{isLoading && <EventListRowSkeleton />}
{!isLoading && events.length === 0 && (
  <EmptyState
    title="まだイベントがありません"
    action={<Button asChild><Link href="/event/new">作成</Link></Button>}
  />
)}
{!isLoading && error && (
  <ErrorState
    title="読み込みに失敗しました"
    action={<Button onClick={refetch}>再読み込み</Button>}
  />
)}
{!isLoading && !error && events.length > 0 && (
  <ul>{events.map(...)}</ul>
)}
```

### 3.2 Server Action 完了通知
```tsx
const result = await saveEvent(data);
if (result.ok) {
  toast.success("保存しました");
} else {
  toast.error("保存に失敗しました", { description: result.error });
}
```

### 3.3 進行中のフォーム
```tsx
<Button type="submit" disabled={isPending} aria-busy={isPending}>
  {isPending ? (
    <><Loader2 className="animate-spin" />送信中…</>
  ) : "送信"}
</Button>
```

## 4. アクセシビリティ

- Loading: `role="status"` + `aria-live="polite"` + `aria-busy`
- Empty: `role="status"` + `h2`/`h3` 見出し
- Error: `role="alert"` + `aria-live="assertive"`
- Toast: `role="status"` (success) / `role="alert"` (error)
- 自動非表示でも閉じるボタン必須 (SR 利用者向け)

## 5. アンチパターン

- ❌ 100ms 以下にも Loading 表示 → ✅ skip (UI ノイズ)
- ❌ 重要エラーを Toast だけで → ✅ inline ErrorState も
- ❌ EmptyState で CTA なし → ✅ 次のアクションを必ず提示
- ❌ 自動非表示なし → ✅ Toast は timeout 5-7 秒
- ❌ Spinner だけ + テキストなし → ✅ 「読み込み中」「送信中」併記
- ❌ 永続エラーを Toast で → ✅ ErrorState で

## 6. 関連

- [LoadingState](../ui/loading-state.md), [Skeleton](../ui/skeleton.md)
- [EmptyState](../ui/empty-state.md), [ErrorState](../ui/error-state.md)
- [Toast](../ui/toast.md)
