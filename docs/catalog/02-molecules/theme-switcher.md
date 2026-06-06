# ThemeSwitcher

> Design.md 準拠 | 実装: `libs/shared/ui-composite/src/ThemeSwitcher.tsx`

## 1. 目的
light / dark / high-contrast の切替 UI。`ThemeProvider` 経由で `data-theme` 属性を切替、`localStorage["tech-event:theme"]` で永続化。

## 2. いつ使うか
- ヘッダー右側

## 3. アクセシビリティ

- `aria-label` で現在のテーマを明示
- DropdownMenu または Switch で実装

## 4. 使用例

```tsx
<ThemeSwitcher />
```

## 5. 関連

- [Switch](../01-atoms/switch.md)
- [05-foundations/theming.md](../05-foundations/theming.md)

## 6. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース
