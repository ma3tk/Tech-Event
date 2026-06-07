---
status: stable
figma: TODO
storybook: TODO (Storybook MDX: src/stories/design-system/theming.mdx)
last_reviewed: 2026-06-07
personas: [P1, P2, P3, P4, P5, P6, P7, P8, P9]
---

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

設計原則:

1. **SSR で `<html>` に `data-theme` / `data-contrast` を出さない**
   - サーバ HTML とクライアント DOM の文字列差分が出ない状態にする
2. **`<html suppressHydrationWarning>` を付ける**
   - inline script が React の管轄外で `<html>` 属性を書き換える契約を
     React に伝える。`<html>` 自身の属性差分のみ許容され、body 配下の
     React tree のミスマッチ検知は通常通り行われる
3. **head 先頭の inline script (`THEME_INIT_SCRIPT`) が hydration 前に
   `data-theme` / `data-contrast` を確定する**
   - localStorage `tech-event:theme` / `tech-event:contrast` を同期で読む
   - 未設定なら `prefers-color-scheme` から resolve
   - 失敗時 (private mode 等) は何もせず、CSS 側のシステムフォールバック
     (`dark.css` の `@media (prefers-color-scheme: dark)` ルール) に委ねる
4. **`ThemeProvider` (Client) は mount 後の state 同期のみ**
   - useEffect で localStorage を読み、resolved theme を state に反映
   - `applyTheme` は冪等な属性 set なので二重書きしても無害

この 4 点で「server "light" → client localStorage "dark" → mismatch」
パターンが構造的に発生しなくなる。
詳細実装は `apps/web/src/app/layout.tsx` の `THEME_INIT_SCRIPT` を参照。

## 6. アンチパターン

- ❌ `bg-white` ハードコード → ✅ `bg-surface`
- ❌ `text-black` → ✅ `text-foreground`
- ❌ dark mode を後付けで `dark:` プレフィックスだけ → ✅ semantic token 経由
- ❌ high-contrast 無視 → ✅ AAA 対応必須

## 7. 関連

- [Design.md §7](../../../Design.md)
- [colors.md](./colors.md)
- [accessibility.md](./accessibility.md)
- [ThemeSwitcher](../components/theme-switcher.md)
