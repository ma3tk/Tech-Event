---
status: stable
figma: TODO
storybook: libs/shared/ui-composite/src/EventStickyCTA.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P2, P3]
---

# EventStickyCTA

> Design.md 準拠 | 実装: `libs/shared/ui-composite/src/EventStickyCTA.tsx`

## 1. 目的
イベント詳細ページ下部の **フローティング申込バー** (Client Component)。IntersectionObserver で本体 CTA が画面外のときだけ滑り出し表示。`state` prop で 10 状態のラベル分岐。

## 2. いつ使うか
- イベント詳細ページのみ

## 3. いつ使わないか
- 一覧ページ
- 募集していないイベント (ended / cancelled) → 表示しないか「終了」表示

## 4. 構造

```
画面下端:
┌────────────────────────────────────────────────┐
│ 2026-06-12 19:00 オンライン         [参加申込]  │
└────────────────────────────────────────────────┘
```

## 5. 状態 (10 種)

CTA ラベル 4 種統一 (Design.md §10.2) + 状態切替:
- 参加申込 / 補欠登録 / 抽選に申し込む / 参加リクエストを送信
- 参加済み (キャンセル可能)
- 終了 / 中止 (disabled)

## 6. アクセシビリティ

- `role="region" aria-label="参加申込"`
- 画面外時は `aria-hidden`
- スライドアニメは `prefers-reduced-motion` で無効化

## 7. 使用例

```tsx
<EventStickyCTA event={event} state={ctaState} />
```

## 8. アンチパターン

- ❌ 常時表示 → ✅ Observer で出し分け
- ❌ ラベルを独自に → ✅ 4 種統一 (Design.md §10.2)

## 9. 関連

- [Button](../01-atoms/button.md)
- [Design.md §10.2](../../../Design.md)

## 10. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース、10 状態対応
