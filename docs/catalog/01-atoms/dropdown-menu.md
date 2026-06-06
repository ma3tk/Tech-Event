# DropdownMenu

> Design.md 準拠 | Storybook: [DropdownMenu stories](../../../libs/shared/ui/src/dropdown-menu.stories.tsx) | 実装: `libs/shared/ui/src/dropdown-menu.tsx`

## 1. 目的
ボタンクリックで開く **メニュー** (Item / Separator / Sub / Radio / Check)。Radix UI ベースでキーボード操作完備。

## 2. いつ使うか
- ユーザーメニュー (ヘッダー右上アバタークリック)
- 行のアクションメニュー (「⋯」 → 編集 / 削除 / シェア)
- ソート / フィルタの選択
- 「もっと見る」系のオプション集約

## 3. いつ使わないか
- タブ切替 → [Tabs](./tabs.md)
- フォーム選択 → [Select](./select.md)
- モーダル開く → [Dialog](./dialog.md) を直接
- ホバー解説 → [Tooltip](./tooltip.md)

## 4. 構造

```
[⋯]  ← Trigger
  ▼
┌──────────────────┐
│ Item 1           │
│ Item 2     ⌘E   │ ← shortcut
│ ──────────────── │
│ Item 3     ⊳    │ ← submenu
└──────────────────┘
```

## 5. バリアント

- Item / CheckboxItem / RadioItem / Separator / Sub / Label / Group

## 6. 状態

closed / open / focused-item / disabled-item。

## 7. アクセシビリティ

- キーボード ↑↓ / Enter / Escape / ← (submenu close) / → (submenu open)
- `role="menu"` + `role="menuitem"`
- Trigger に `aria-haspopup="menu"` + `aria-expanded`

## 8. 使用例

```tsx
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from "@tech-event/shared-ui";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="メニュー">
      <MoreHorizontal />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onSelect={handleEdit}>編集</DropdownMenuItem>
    <DropdownMenuItem onSelect={handleShare}>シェア</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onSelect={handleDelete} className="text-destructive">
      削除
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## 9. アンチパターン

- ❌ 大量の Item (10+) → ✅ Sub menu でグループ化、または別 UI
- ❌ 重要 CTA を Menu に隠す → ✅ 明示的な Button で出す
- ❌ destructive を上に置く → ✅ Separator で下に分離

## 10. 関連

- [UserMenuDropdown](../02-molecules/user-menu-dropdown.md)
- [Tabs](./tabs.md)
- [Select](./select.md)

## 11. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース
