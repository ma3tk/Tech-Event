# Theming

> Design.md §7 の再展開 | 詳細: `src/stories/design-system/DarkMode.mdx`

## 1. 3 テーマ

- **light** (default)
- **dark**
- **high-contrast** (AAA 7:1+、`prefers-contrast: more` で自動)

3 テーマすべてで:
- WCAG AA 必須 (high-contrast は AAA)
- `data-theme` 属性 + `ThemeProvider` で切替
- `localStorage["tech-event:theme"]` で永続化
- `prefers-color-scheme` / `prefers-contrast` を検知

## 2. 仕組み

```
src/styles/tokens.css            ← Primitive (color scales)
src/styles/semantic.css          ← Semantic alias (テーマ非依存)
src/styles/themes/light.css      ← light mapping
src/styles/themes/dark.css       ← dark mapping
src/styles/themes/high-contrast.css  ← AAA mapping
```

`<html data-theme="dark">` で切替。`ThemeProvider` が解決。

## 3. 開発ルール

- **必ず semantic alias を使う** (`bg-surface` / `text-foreground` / `border-border` 等)
- **ハードコード禁止**: `bg-white` / `bg-zinc-100` / `text-black` 等
- 新規トークン追加時は light / dark / high-contrast すべてに対応
- VRT で 3 テーマすべての baseline を取る

## 4. ThemeSwitcher

```tsx
<ThemeSwitcher />
```

ヘッダーに 1 つ。`DropdownMenu` or `Switch` 実装。

## 5. SSR Hydration mismatch を避ける

- `<html data-theme>` を初期 HTML に inline script で書き込む (FOUC 回避)
- `ThemeProvider` 内で localStorage 読みと sync

## 6. アンチパターン

- ❌ `bg-white` ハードコード → ✅ `bg-surface`
- ❌ `text-black` → ✅ `text-foreground`
- ❌ dark mode を後付けで `dark:` プレフィックスだけ → ✅ semantic token 経由
- ❌ high-contrast 無視 → ✅ AAA 対応必須

## 7. 関連

- [Design.md §7](../../../Design.md)
- [colors.md](./colors.md)
- [accessibility.md](./accessibility.md)
- [ThemeSwitcher](../02-molecules/theme-switcher.md)
