# Popover

> Design.md 準拠 | Storybook: [Popover stories](../../../libs/shared/ui/src/popover.stories.tsx) | 実装: `libs/shared/ui/src/popover.tsx`

## 1. 目的
クリックで開く **アンカー型の小さなパネル**。Tooltip と違い長文 / インタラクティブ要素 (Button / Input) を含められる。

## 2. いつ使うか
- 設定の小パネル (色選択 / 日付選択)
- フィルタの細かい選択 UI
- ヘルプテキスト (クリックで詳細を読む)
- mention のオートコンプリート

## 3. いつ使わないか
- hover で出すだけ → [Tooltip](./tooltip.md)
- メニュー → [DropdownMenu](./dropdown-menu.md)
- モーダル (背景操作不可) → [Dialog](./dialog.md)

## 4. 構造

```
       ┌──────────────┐
       │ Popover 本体 │
       │              │
       └─▼────────────┘
   [anchor]
```

## 5. 状態

closed / open / focused。

## 6. アクセシビリティ

- Trigger に `aria-expanded` / `aria-haspopup="dialog"`
- Escape で閉じる
- 外側クリックで閉じる
- フォーカスは内部にトラップしない (Dialog と違う点)

## 7. 使用例

```tsx
import { Popover, PopoverTrigger, PopoverContent } from "@tech-event/shared-ui";

<Popover>
  <PopoverTrigger asChild>
    <Button variant="ghost">詳細</Button>
  </PopoverTrigger>
  <PopoverContent className="w-80">
    <p>詳細な説明や設定 UI</p>
  </PopoverContent>
</Popover>
```

## 8. アンチパターン

- ❌ モーダル的に使う → ✅ Dialog
- ❌ hover で出す → ✅ Tooltip
- ❌ メニュー的に使う → ✅ DropdownMenu

## 9. 関連

- [Tooltip](./tooltip.md)
- [DropdownMenu](./dropdown-menu.md)
- [Dialog](./dialog.md)

## 10. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース
