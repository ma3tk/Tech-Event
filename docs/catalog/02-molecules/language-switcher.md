---
status: stable
figma: TODO
storybook: libs/shared/ui-composite/src/LanguageSwitcher.stories.tsx
last_reviewed: 2026-06-06
personas: [P5]
---

# LanguageSwitcher

> Design.md 準拠 | 実装: `libs/shared/ui-composite/src/LanguageSwitcher.tsx`

## 1. 目的
日本語 / 英語の切替 UI (DropdownMenu ベース)。

## 2. いつ使うか
- ヘッダー右側
- フッター

## 3. アクセシビリティ

- 現在の言語は `aria-current`
- `aria-label="言語を切り替え"`

## 4. 使用例

```tsx
<LanguageSwitcher locale={locale} pathname={pathname} />
```

## 5. 関連

- [DropdownMenu](../01-atoms/dropdown-menu.md)

## 6. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース
