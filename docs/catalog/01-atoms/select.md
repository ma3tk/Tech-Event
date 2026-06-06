---
status: stable
figma: TODO
storybook: libs/shared/ui/src/select.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P6, P7]
---

# Select

> Design.md 準拠 | Storybook: [Select stories](../../../libs/shared/ui/src/select.stories.tsx) | 実装: `libs/shared/ui/src/select.tsx`

## 1. 目的
**選択肢が 5+ 個** ある場合のセレクトボックス。Radix UI Select ベース。

## 2. いつ使うか
- 国 / 都道府県 / カテゴリ選択
- ソート順 / 表示件数の切替
- 5 個以上の選択肢

## 3. いつ使わないか
- 選択肢が 2-4 個 → [RadioGroup](./radio-group.md) (常時可視で UX 良)
- ON/OFF → [Switch](./switch.md)
- 複数選択 → [Checkbox](./checkbox.md) 複数 or 別 UI
- 検索が必要 → Combobox (将来追加予定)

## 4. 構造

```
┌──────────────────┐
│ 選択された項目 ▾ │   ← SelectTrigger
└──────────────────┘
       │ クリック
       ▼
   ┌──────────────────┐
   │ Option 1         │
   │ Option 2         │
   │ Option 3         │
   └──────────────────┘
```

## 5. バリアント

<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->
- size: `sm` / `md` (default) / `lg`


<!-- AUTO-GENERATED END: variants -->

## 6. 状態

default / hover / focus-visible / open / disabled。

## 7. アクセシビリティ

- Label 必須
- キーボード操作 (↑↓ / Enter / Escape) は Radix が処理
- `aria-required` / `aria-invalid` 連動

## 8. 使用例

```tsx
import {
  Select, SelectTrigger, SelectValue,
  SelectContent, SelectItem,
} from "@tech-event/shared-ui";

<div className="space-y-2">
  <Label htmlFor="sort">並び順</Label>
  <Select defaultValue="newest">
    <SelectTrigger id="sort">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="newest">新着順</SelectItem>
      <SelectItem value="popular">人気順</SelectItem>
      <SelectItem value="upcoming">開催が近い順</SelectItem>
    </SelectContent>
  </Select>
</div>
```

## 9. アンチパターン

- ❌ 選択肢が 3 個以下 → ✅ RadioGroup
- ❌ ネイティブ `<select>` を直接 → ✅ Select (テーマ統一)
- ❌ Label 抜け → ✅ 必須

## 10. 関連

- [RadioGroup](./radio-group.md)
- [Checkbox](./checkbox.md)
- [04-patterns/data-input.md](../04-patterns/data-input.md)

## 11. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース
