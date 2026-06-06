# Separator

> Design.md 準拠 | Storybook: [Separator stories](../../../libs/shared/ui/src/separator.stories.tsx) | 実装: `libs/shared/ui/src/separator.tsx`

## 1. 目的
セクションを **視覚的に分割** する横/縦の罫線。Radix UI Separator ベース。

## 2. いつ使うか
- カード内のセクション区切り
- メニュー内のグループ区切り (DropdownMenu)
- フッターの列間 (縦線)

## 3. いつ使わないか
- 純装飾の太い border → `border-t` 直接で十分
- ページ大セクション → 余白 + 見出しで分離 (Separator は line)

## 4. バリアント

- `horizontal` (default)
- `vertical`

## 5. 状態

静的のみ。`decorative` (default true) で aria-hidden が付く。

## 6. アクセシビリティ

- 純飾りなら `decorative={true}` (default) で `aria-hidden`
- 意味的な区切りなら `decorative={false}` + `role="separator"`

## 7. 使用例

```tsx
import { Separator } from "@tech-event/shared-ui";

<div>
  <p>section A</p>
  <Separator className="my-4" />
  <p>section B</p>
</div>
```

## 8. アンチパターン

- ❌ 装飾なのに `decorative={false}` → ✅ 意味があるかで判断
- ❌ `bg-zinc-200` ハードコード → ✅ `bg-border` (Separator が自動で対応)

## 9. 関連

- [Card](./card.md)
- [DropdownMenu](./dropdown-menu.md)

## 10. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース
