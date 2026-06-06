# Sheet

> Design.md 準拠 | Storybook: [Sheet stories](../../../libs/shared/ui/src/sheet.stories.tsx) | 実装: `libs/shared/ui/src/sheet.tsx`

## 1. 目的
画面の **左/右/上/下** からスライドして出てくるパネル。Dialog と同様のフォーカストラップ / scroll lock を持つが、モバイル向け or 長いフィルタ UI 向き。

## 2. いつ使うか
- モバイルのナビメニュー (hamburger 展開)
- フィルタ UI (検索ページの絞り込み)
- 詳細パネル (一覧で行選択 → 右からスライド)
- カート / 通知の右側プレビュー

## 3. いつ使わないか
- 確認モーダル → [Dialog](./dialog.md)
- 小さなメニュー → [DropdownMenu](./dropdown-menu.md)
- 短い吊り下げ → [Popover](./popover.md)

## 4. 構造

```
side="right":
┌──────────────────────────┐
│                          │
│     画面本体             │
│                          ├──┐
│                          │S │  Sheet (右からスライド)
│                          │h │
│                          │e │
│                          │e │
│                          │t │
│                          ├──┘
└──────────────────────────┘
```

side: `left` / `right` / `top` / `bottom`

## 5. バリアント

`side` で 4 方向。`bottom` はモバイルの bottom sheet として最も使う。

## 6. サイズ

`max-w-sm` (`right`/`left`) or `max-h-[80vh]` (`top`/`bottom`)。

## 7. 状態

open / close / busy。`data-[state=open]:slide-in-from-right` 等で方向別アニメ。duration-slow (300ms)。

## 8. アクセシビリティ

- Dialog と同じ (フォーカストラップ / Escape / aria-labelledby)
- SheetTitle 必須

## 9. 使用例

```tsx
import {
  Sheet, SheetTrigger, SheetContent,
  SheetHeader, SheetTitle,
} from "@tech-event/shared-ui";

<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="メニュー">
      <Menu />
    </Button>
  </SheetTrigger>
  <SheetContent side="left" className="w-64">
    <SheetHeader>
      <SheetTitle>メニュー</SheetTitle>
    </SheetHeader>
    <nav>{/* ... */}</nav>
  </SheetContent>
</Sheet>
```

## 10. アンチパターン

- ❌ Dialog で十分なものを Sheet で → ✅ Dialog (中央表示で目線が落ち着く)
- ❌ Title 抜け → ✅ 必須
- ❌ `side="bottom"` でデスクトップにも使う → ✅ モバイル限定

## 11. 関連

- [Dialog](./dialog.md)
- [04-patterns/modals-and-sheets.md](../04-patterns/modals-and-sheets.md)

## 12. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース
