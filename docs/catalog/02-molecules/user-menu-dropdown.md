---
status: stable
figma: TODO
storybook: libs/shared/ui-composite/src/UserMenuDropdown.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P6]
---

# UserMenuDropdown

> Design.md 準拠 | 実装: `libs/shared/ui-composite/src/UserMenuDropdown.tsx`

## 1. 目的
ヘッダー右上の **ユーザーアバター → メニュー** (プロフィール / 設定 / ログアウト)。DropdownMenu + Avatar の組合せ。

## 2. いつ使うか
- ヘッダー (ログイン時)

## 3. 構造

```
[👤] ← クリック
   ▼
┌──────────────┐
│ ニックネーム │
│ メール       │
│ ──────────── │
│ プロフィール │
│ ダッシュボード│
│ 設定         │
│ ──────────── │
│ ログアウト   │
└──────────────┘
```

## 4. アクセシビリティ

- アバターに `aria-label="ユーザーメニュー"`
- DropdownMenu の標準キーボード操作

## 5. 関連

- [DropdownMenu](../01-atoms/dropdown-menu.md)
- [Avatar](../01-atoms/avatar.md)
- [Header](../03-organisms/header.md)

## 6. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース
