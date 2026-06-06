---
status: stable
figma: TODO
storybook: libs/shared/ui/src/toast.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P6]
---

# Toast

> Design.md 準拠 | Storybook: [Toast stories](../../../libs/shared/ui/src/toast.stories.tsx) | 実装: `libs/shared/ui/src/toast.tsx`

## 1. 目的
**非同期の完了 / エラー / 情報** を画面右下に短時間表示する通知。Radix UI Toast + Sonner ベース。

## 2. いつ使うか
- Server Action 完了の通知 (「保存しました」「シェアしました」)
- エラー通知 (失敗時)
- 情報通知 (新着メッセージ等)
- クリップボードコピー完了

## 3. いつ使わないか
- 永続表示するエラー → [ErrorState](./error-state.md)
- 入力検証エラー → [Form](./form.md) の FormMessage (inline)
- 重要な確認 → [Dialog](./dialog.md)

## 4. 構造

```
            ┌─────────────────────────┐
            │ [icon] タイトル         │
            │ 説明 (optional)         │
            │              [✕]        │
            └─────────────────────────┘
            ← 画面右下 (デスクトップ)
            ← 画面下部 (モバイル)
```

## 5. バリアント

<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->
- `default` — 中立 (neutral)
- `success` — 成功 (`status-open`)
- `error` — エラー (`destructive`)
- `info` — 情報 (`link`)


<!-- AUTO-GENERATED END: variants -->

## 6. 表示時間

- 通常: 3-4 秒
- アクション付き: 5-8 秒
- エラー: 5 秒以上 (or 永続)

## 7. アクセシビリティ

- `role="status"` (info) または `role="alert"` (error)
- `aria-live="polite"` (info) / `assertive` (error)
- 閉じるボタンは必ず付ける (SR 利用者向け)

## 8. 使用例

```tsx
import { toast } from "@tech-event/shared-ui";

// 成功
toast.success("シェアリンクをコピーしました");

// エラー
toast.error("保存に失敗しました", {
  description: "ネットワークを確認してもう一度お試しください",
});

// アクション付き
toast("予約が完了しました", {
  action: { label: "詳細を見る", onClick: () => router.push("/event/123") },
});
```

レイアウト直下に `<ToastListener />` を 1 つだけ配置。

## 9. アンチパターン

- ❌ 重要情報を Toast だけで → ✅ inline でも残す
- ❌ Toast の中にフォーム → ✅ Dialog
- ❌ 連続で 5 個以上発行 → ✅ stacking 制限 (max 3)
- ❌ 自動非表示なし → ✅ 必ず timeout (5-7 秒) を設定

## 10. 関連

- ToastListener (`libs/shared/ui-composite/src/ToastListener.tsx` で provider)
- [ErrorState](./error-state.md)
- [Dialog](./dialog.md)
- [04-patterns/feedback.md](../04-patterns/feedback.md)

## 11. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース、Sonner 統合
