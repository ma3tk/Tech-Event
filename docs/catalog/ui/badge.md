---
status: stable
figma: TODO
storybook: libs/shared/ui/src/badge.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P2, P6]
---

# Badge

> Design.md 準拠 | Storybook: [Badge stories](../../../libs/shared/ui/src/badge.stories.tsx) | 実装: `libs/shared/ui/src/badge.tsx`

## 1. 目的 (Purpose)
**短いラベル / 状態 / カウント** を視覚的に小さく強調表示するための atom。Status系の派生 (EventStatusBadge) や TagPill の基盤として使われる。

## 2. いつ使うか (When to use)
- 状態の短い表示 (「NEW」「Beta」「主催」)
- カウント表示 (通知 N 件)
- メタ情報のチップ (「無料」「オンライン」「対面」)
- メンバーシップ / プラン (「Pro」「Free」)

## 3. いつ使わないか (When NOT to use)
- **イベントステータス** → [EventStatusBadge](../components/event-status-badge.md) (8 状態のドメイン特化)
- **タグ** → [TagPill](../components/tag-pill.md) (クリック可能 / 削除可能のドメイン特化)
- **ボタン (押せる)** → [Button](./button.md) `size="xs"`
- **長文** → 通常のテキスト + アイコンを使う

## 4. 構造 (Anatomy)

```
┌────────────┐
│ [icon] Tag │   小さく丸い (rounded-full or rounded)
└────────────┘
```

- text (required, 短く 1-4 文字程度)
- icon (optional, 12-14px)
- 角丸 `rounded-full` (default) or `rounded` (square 系)

## 5. バリアント (Variants)

<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->
| variant | 用途 | 視覚 |
|---|---|---|
| `default` | 主要な強調 | brand-orange 塗り |
| `secondary` | 補助 | bg-surface-muted + text-foreground |
| `outline` | フラット | border-border + bg-transparent |
| `destructive` | 警告系 | bg-brand-red + white text |

ステータス8種 (open/full/waitlist/closed/cancelled/ended/upcoming/ongoing) は [EventStatusBadge](../components/event-status-badge.md) で扱う。Badge atom 単体には乗せない。


<!-- AUTO-GENERATED END: variants -->

## 6. サイズ

| size | 高さ | 用途 |
|---|---|---|
| `sm` | 18px | カードの右上、リスト行 |
| `md` | 22px (default) | ヘッダー横の NEW など |

## 7. 状態 (States)

- default のみ (静的)。hover / focus は通常不要。
- クリック可能化したい時は **代わりに Button** を使う。

## 8. アクセシビリティ (Accessibility)

- 状態の意味は **色だけでなくテキストで** 伝える (Design.md §10)
- icon-only の場合は `aria-label` 必須 (アイコンに `aria-hidden` + Badge に `aria-label`)
- カウントは `aria-live="polite"` で更新を伝える場合がある

## 9. 使用例 (Code)

```tsx
import { Badge } from "@tech-event/shared-ui";

<Badge>NEW</Badge>
<Badge variant="secondary">Beta</Badge>
<Badge variant="outline">主催</Badge>

// カウント
<Badge variant="destructive" aria-label="未読 3 件">3</Badge>
```

## 10. アンチパターン (Anti-patterns)

- ❌ 長文を入れる → ✅ 4 文字程度に
- ❌ クリック可能化 → ✅ Button へ
- ❌ 任意 hex → ✅ variant prop
- ❌ アイコンのみで意味伝達 → ✅ テキスト併記

## 11. 関連

- [EventStatusBadge](../components/event-status-badge.md)
- [TagPill](../components/tag-pill.md)
- [Button](./button.md)

## 12. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース
