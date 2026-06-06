# Responsive

> Design.md §5 の再展開 | 詳細: [`docs/design-system.md` §5](../../design-system.md)

## 1. ブレークポイント (Tailwind 標準)

| 名称 | 最小幅 | 用途 |
|---|---|---|
| (default) | 0 | モバイル (mobile-first) |
| `sm` | 640px | 小型タブレット / 大型スマホ横向き |
| `md` | 768px | タブレット縦 / 小型ラップトップ |
| `lg` | 1024px | デスクトップ標準 |
| `xl` | 1280px | ワイドデスクトップ (max-w-7xl とほぼ同じ) |

## 2. 設計原則

- **Mobile-first**: モバイルから書き始め `md:` / `lg:` で拡張
- **コンテナ max-w 1280px** (`--container-max-w`)
- **メイン + 右サイド 2 カラム** は `lg:` 以上
- モバイルは **1 カラム**
- タッチ領域は **44×44px** 確保

## 3. 標準パターン

### 3.1 1 → 2 → 3 列グリッド
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {events.map(...)}
</div>
```

### 3.2 メイン + サイドバー
```tsx
<div className="container mx-auto grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
  <main>{children}</main>
  <aside>{sidebar}</aside>
</div>
```

### 3.3 ボタングループ (縦 → 横)
```tsx
<div className="flex flex-col sm:flex-row gap-2">
  <Button variant="secondary">キャンセル</Button>
  <Button>保存</Button>
</div>
```

### 3.4 モバイルメニュー (hamburger → Sheet)
```tsx
<Sheet>
  <SheetTrigger asChild className="md:hidden">
    <Button variant="ghost" size="icon" aria-label="メニュー">
      <Menu />
    </Button>
  </SheetTrigger>
  <SheetContent side="left">{/* nav */}</SheetContent>
</Sheet>

<nav className="hidden md:flex">{/* desktop nav */}</nav>
```

### 3.5 Dialog → Sheet (モバイル)
- デスクトップ: Dialog 中央
- モバイル: Sheet `side="bottom"` でフルワイド

## 4. アンチパターン

- ❌ Desktop-first (`@media (max-width)`) → ✅ Mobile-first (`md:` で拡張)
- ❌ 固定幅 `min-w-[600px]` → ✅ `max-w-md` + モバイルで縮小
- ❌ モバイルでタッチ領域 32px 未満 → ✅ 44px 確保
- ❌ ブレークポイント `767px` 等の境界値ずれ → ✅ Tailwind 標準のみ
- ❌ 横スクロール強制 → ✅ `overflow-x-auto` は table 等の限定的に

## 5. 関連

- [Design.md §5](../../../Design.md)
- [docs/design-system.md §5](../../design-system.md)
- [spacing.md](./spacing.md)
