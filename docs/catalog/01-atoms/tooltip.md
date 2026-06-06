# Tooltip

> Design.md 準拠 | Storybook: [Tooltip stories](../../../libs/shared/ui/src/tooltip.stories.tsx) | 実装: `libs/shared/ui/src/tooltip.tsx`

## 1. 目的
**hover / focus 時に短い説明** を表示する小さな浮き上がり。クリックでは出さない (Popover の領域)。

## 2. いつ使うか
- icon-only ボタンの補足説明 (`aria-label` と組合せ)
- 省略表示された情報の全文表示
- アイコン凡例の簡単な説明
- 状態の補足 (なぜ disabled なのか等)

## 3. いつ使わないか
- クリックで開く → [Popover](./popover.md)
- 重要な情報 → 常時表示する (Tooltip は補助)
- モバイル (hover ない) → Tooltip は出ない or 別 UI

## 4. 構造

```
                  ┌──────────┐
                  │  ヒント   │ ← Tooltip (小さく濃い背景)
                  └─▼────────┘
      ┌────┐
      │ ⓘ │ ← anchor (hover / focus でトリガー)
      └────┘
```

## 5. バリアント

なし (単色 dark 系)。`side` で表示位置 (top / right / bottom / left)。

## 6. 状態

hidden / visible / focused-via-keyboard。

## 7. アクセシビリティ

- focus 時にも表示 (hover 専用にしない)
- 短文 (1 行) に留める
- 重要情報を Tooltip だけで伝えない (モバイルや SR 利用者に届かない)
- `aria-describedby` で anchor に紐付け (Radix が処理)

## 8. 使用例

```tsx
import { Tooltip, TooltipTrigger, TooltipContent } from "@tech-event/shared-ui";

<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="ブックマーク">
      <Bookmark />
    </Button>
  </TooltipTrigger>
  <TooltipContent>ブックマークに追加</TooltipContent>
</Tooltip>
```

## 9. アンチパターン

- ❌ 長文を入れる → ✅ Popover へ
- ❌ クリックで開く → ✅ Popover
- ❌ モバイルで重要情報を Tooltip だけ → ✅ inline 表示

## 10. 関連

- [Popover](./popover.md)
- [Button](./button.md)
- [DropdownMenu](./dropdown-menu.md)

## 11. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース
