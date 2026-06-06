---
status: stable
figma: TODO
storybook: libs/shared/ui-composite/src/Header.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P2, P4, P6]
---

# ナビゲーション (Navigation)

> Design.md §5 + §6 準拠

## 対象ペルソナ

- 主要: P1 山田美咲 (モバイルナビ)、P6 小林一郎 (DevRel: 複数イベント横断)
- 副次: P2 田中慎太郎、P4 鈴木大輔 (情報構造の見通し)、P9 木村翔

(根拠: [`Personas.md`](../../../Personas.md))

## 1. ナビゲーション階層

```
グローバル (Header / Footer)
  └ セクション (Tabs / Sub navigation)
       └ アイテム単位 (Pagination / Breadcrumb)
```

## 2. 使い分け

| 用途 | コンポーネント |
|---|---|
| 全ページ共通 | [Header](../03-organisms/header.md) + [Footer](../03-organisms/footer.md) |
| ページ内のビュー切替 | [Tabs](../01-atoms/tabs.md) |
| 階層パス | [Breadcrumb](../02-molecules/breadcrumb.md) |
| ページ番号 | [Pagination](../02-molecules/pagination.md) |
| ユーザーメニュー | [UserMenuDropdown](../02-molecules/user-menu-dropdown.md) |
| モバイルメニュー | [Sheet](../01-atoms/sheet.md) `side="left"` |

## 3. 標準パターン

### 3.1 グローバルナビ
```tsx
<HeaderServer />
<main id="main">{children}</main>
<Footer />
```

skip link は `<a href="#main" className="sr-only focus:not-sr-only">` で最初に。

### 3.2 ページ内 Tabs
```tsx
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">概要</TabsTrigger>
    <TabsTrigger value="participants">参加者</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">...</TabsContent>
  <TabsContent value="participants">...</TabsContent>
</Tabs>
```

### 3.3 階層パンくず
```tsx
<Breadcrumb items={[
  { label: "トップ", href: "/" },
  { label: "グループ", href: "/group" },
  { label: group.name },
]} />
```

### 3.4 ページネーション
```tsx
<Pagination
  current={page}
  total={totalPages}
  buildHref={(p) => `/search?page=${p}`}
/>
```

## 4. アクセシビリティ

- 各 `<nav>` に `aria-label` で意味づけ (main / breadcrumb / pagination)
- 現在位置は `aria-current="page"`
- skip link (`#main`) を提供
- キーボード Tab で論理順
- モバイル hamburger は Sheet で展開、`aria-expanded` 連動

## 5. レスポンシブ

- モバイル: hamburger + Sheet
- タブレット: ロゴ + 検索 + 主要 2-3 ナビ
- デスクトップ: フルナビ

## 6. アンチパターン

- ❌ `<div>` でナビを構築 → ✅ `<nav>` 必須
- ❌ aria-label 抜け → ✅ 全 `<nav>` に
- ❌ 5+ Tabs → ✅ DropdownMenu に集約
- ❌ Breadcrumb 現在地もリンク → ✅ 現在地は span (aria-current="page")

## 7. 関連

- [Header](../03-organisms/header.md), [Footer](../03-organisms/footer.md)
- [Tabs](../01-atoms/tabs.md), [Breadcrumb](../02-molecules/breadcrumb.md), [Pagination](../02-molecules/pagination.md)
- [Sheet](../01-atoms/sheet.md), [DropdownMenu](../01-atoms/dropdown-menu.md)
