---
status: stable
figma: TODO
storybook: TODO (Storybook MDX: src/stories/design-system/colors.mdx)
last_reviewed: 2026-06-06
personas: [P1, P2, P3, P4, P5, P6, P7, P8, P9]
---

# Colors

> Design.md §2, §3 の再展開 | 詳細: [`docs/design-system.md` §2](../../design-system.md#2-カラー)

## 1. ブランドカラー

| トークン | hex | Tailwind | 使い分け |
|---|---|---|---|
| `--brand-orange` | `#c2410c` | `bg-brand-orange` `text-brand-orange` | プライマリ CTA / ロゴ |
| `--brand-orange-hover` | `#9a3412` | `hover:bg-brand-orange-hover` | hover state |
| `--brand-orange-soft` | `#fff1ea` | `bg-brand-orange-soft` | hover 薄背景 / 空サムネ |
| `--brand-red` | `#d23a3a` | `bg-brand-red` | 強調 CTA (登録 / 削除) |
| `--brand-red-hover` | `#b82c2c` | `hover:bg-brand-red-hover` | hover state |
| `--link` | `#005d8c` | `text-link` | テキスト中のリンク |
| `--link-hover` | `#004161` | `hover:text-link-hover` | hover state |

### スウォッチ (概念図)

```
brand-orange     #c2410c  ████  (4.93:1 vs #fff, AA)
  -hover         #9a3412  ████  (7.31:1, AAA)
  -soft          #fff1ea  ░░░░  (薄背景)
brand-red        #d23a3a  ████  (CTA レッド)
link             #005d8c  ████  (テキストリンク)
```

## 2. セマンティック

| トークン | hex | 用途 |
|---|---|---|
| `--background` | `#f7f7f5` | ページ背景 |
| `--surface` | `#ffffff` | カード / ヘッダー / フッターの面 |
| `--foreground` | `#1a1a1a` | 本文テキスト (18.1:1 AAA) |
| `--muted` | `#6b7280` | プレースホルダ (4.6:1 AA) |
| `--muted-foreground` | `#4b5563` | 補助テキスト (7.6:1 AAA) |
| `--border` | `#e5e7eb` | 区切り線 (default) |
| `--border-strong` | `#d1d5db` | 強調区切り (テーブル等) |

## 3. ステータス 8 種 (Design.md §10.1)

| 状態 | bg | fg | 意味 |
|---|---|---|---|
| open | `#dcfce7` | `#14532d` | 募集中 (9.7:1 AAA) |
| full | `#fee2e2` | `#991b1b` | 満員 (7.9:1 AAA) |
| waitlist | `#fef9c3` | `#713f12` | 補欠受付中 (8.3:1 AAA) |
| closed | `#f3f4f6` | `#1f2937` | 募集締切 (12.6:1 AAA) |
| cancelled | `#991b1b` | `#ffffff` | 中止 (7.9:1 AAA) |
| ended | `#f3f4f6` | `#4b5563` | 終了 (7.5:1 AAA) |
| upcoming | `#dbeafe` | `#1e3a8a` | 開催前 (10.4:1 AAA) |
| ongoing | `#fff7ed` | `#c2410c` | 開催中 (4.9:1 AA) |

Tailwind は `bg-status-{name}-bg` / `text-status-{name}-fg` で生成。色だけでなく **必ずテキスト併記** (Design.md §10.1)。

## 4. 使い分けルール

### いつ orange (brand-orange) か?
- プライマリ CTA (画面 1 個まで)
- ロゴ
- 主要アクションの強調
- 「開催中」status

### いつ red (brand-red) か?
- 登録系の強 CTA (「イベント作成」「会員登録」)
- 削除 / 退会の destructive
- 「満員」「中止」status

### いつ link (青) か?
- 本文中のリンク
- 「グループ名」「タグ」のクリック可能なテキスト

### いつ status カラーか?
- イベントステータス専用 ([EventStatusBadge](../components/event-status-badge.md))
- 一般的な情報の強調には使わない

## 5. WCAG AA 必須

- すべてのテキスト × 背景は **4.5:1 (AA)** 以上
- 半透明 (`opacity-50`) の disabled は contrast 違反になりうる → `text-muted-foreground` で明示

## 6. アンチパターン

- ❌ `bg-blue-500` ハードコード → ✅ `bg-link` (テーマ対応)
- ❌ `#c2410c` 直書き → ✅ `bg-brand-orange`
- ❌ `bg-brand-orange/10` 半透明 → ✅ `bg-brand-orange-soft`
- ❌ ステータスを色だけで → ✅ テキスト併記 (Design.md §10.1)

## 7. 関連

- [Design.md §2](../../../Design.md), [Design.md §3](../../../Design.md)
- [docs/design-system.md §2](../../design-system.md)
- [theming.md](./theming.md)
- [accessibility.md](./accessibility.md)
