# Header

> Design.md 準拠 | Storybook: [Header stories](../../../libs/shared/ui-composite/src/Header.stories.tsx) | 実装: `libs/shared/ui-composite/src/Header.tsx`

## 1. 目的 (Purpose)
グローバルヘッダー (Client Component)。ロゴ / 検索 / ナビ / アカウント領域を統合する。`HeaderServer` でログイン状態と通知数を解決し、本 component に props として渡す。

## 2. いつ使うか (When to use)
- **全ページのトップ**: 通常 `apps/web/src/app/layout.tsx` で `HeaderServer` を呼ぶ
- 一部の特殊ページ (auth flow / iframe 埋め込み) では非表示も可

## 3. いつ使わないか (When NOT to use)
- iframe 埋め込み (`/embed/*` 系)
- /auth/* の最小レイアウト
- 印刷ビュー

## 4. 構造 (Anatomy)

```
┌──────────────────────────────────────────────────────────────────────┐
│ [tech-event]   [SearchBox]      ナビ1 ナビ2 ナビ3   [🌓] [🔔3] [👤▾] │
└──────────────────────────────────────────────────────────────────────┘
   ▲             ▲                ▲                  ▲    ▲     ▲
   ロゴ          検索 (form GET)   主要ナビ           Theme 通知 ユーザーメニュー
```

- ロゴ (左): テキストロゴ `tech-event` (Noto Sans JP Bold)。アイコン化禁止 (Design.md §2)
- [SearchBox](../02-molecules/search-box.md) (中央): `<form method="get">` で JS なし動作
- ナビ (右側): イベントを探す / グループを探す / 主催する 等
- [ThemeSwitcher](../02-molecules/theme-switcher.md)
- 通知 Badge ([Badge](../01-atoms/badge.md))
- [UserMenuDropdown](../02-molecules/user-menu-dropdown.md)

## 5. バリアント

| variant | 用途 |
|---|---|
| `default` | ログイン後 |
| `guest` | 未ログイン (ログイン / 新規登録 ボタンが代わりに出る) |

`HeaderServer` が current user を解決して切り替える。

## 6. サイズ

固定高さ 56-64px。`sticky top-0 z-sticky` で常時表示。

## 7. 状態

| 状態 | 視覚 |
|---|---|
| default | `bg-surface border-b border-border` |
| scroll | `shadow-sm` を追加 (subtle) |
| theme switching | アニメーション禁止 (即時切替) |
| guest | アカウント領域がログイン / 新規登録ボタン |

## 8. アクセシビリティ

- `<header role="banner">` を直接使う
- skip link (`#main` への jump) を最初に
- ナビは `<nav aria-label="main">`
- 通知 Badge は `aria-label="未読 3 件"` で読み上げ補強
- モバイルでは hamburger → Sheet 内にナビを展開

## 9. レスポンシブ

- モバイル (<md): ロゴ + hamburger + ユーザーアバター。検索は別途トップに
- タブレット (md): ロゴ + 検索 + 主要ナビ 2-3 個
- デスクトップ (lg+): フルレイアウト

## 10. 使用例 (Code)

```tsx
// apps/web/src/app/layout.tsx
import { HeaderServer } from "@tech-event/shared-ui-composite";

<HeaderServer />
{children}
<Footer />
```

`HeaderServer` 内部で `auth()` / `getNotificationCount()` を解決し、`<Header user={...} notificationCount={...} />` を返す。

## 11. アンチパターン

- ❌ ロゴをアイコン化 → ✅ テキストロゴ厳守
- ❌ `bg-white` ハードコード → ✅ `bg-surface`
- ❌ ナビアイテムを 7 個以上 → ✅ 5 個以内、それ以上は DropdownMenu に集約
- ❌ ヘッダー内に CTA を派手に → ✅ 主要 CTA は本文 (hero) に置く
- ❌ z-index を任意値 → ✅ `z-sticky` トークン

## 12. 関連

- [HeaderServer](./header-server.md)
- [SearchBox](../02-molecules/search-box.md)
- [UserMenuDropdown](../02-molecules/user-menu-dropdown.md)
- [ThemeSwitcher](../02-molecules/theme-switcher.md)
- [04-patterns/navigation.md](../04-patterns/navigation.md)

## 13. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース、Client Component
