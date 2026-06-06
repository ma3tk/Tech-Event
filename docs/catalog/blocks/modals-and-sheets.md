---
status: stable
figma: TODO
storybook: libs/shared/ui/src/dialog.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P6]
---

# モーダル / シート / ポップオーバー (Modals, Sheets, Popovers)

> Design.md §6 + §8 準拠

## 対象ペルソナ

- 主要: P1 山田美咲 (モバイル: sheet 中心)、P6 小林一郎 (主催: confirmation dialog)
- 副次: P2 田中慎太郎、P7 高橋真由美

(根拠: [`Personas.md`](../../../Personas.md))

## 1. 使い分け判断フロー

```
クリックで開く?
  ├ 短いヒント (hover でも OK) → Tooltip
  ├ 小さなインタラクティブパネル → Popover
  ├ メニュー → DropdownMenu
  └ モーダル系 (背景操作不可)
      ├ 中央表示 (確認 / 短いフォーム / 詳細) → Dialog
      └ サイドからスライド
          ├ ナビ / フィルタ (主に mobile) → Sheet side="left"/"right"
          ├ 詳細プレビュー → Sheet side="right"
          └ モバイル bottom sheet → Sheet side="bottom"
```

## 2. Dialog の使いどころ

| 用途 | Dialog | コメント |
|---|---|---|
| 削除確認 | ✅ | `max-w-sm`, Cancel に autoFocus |
| 短いフォーム (1-2 fields) | ✅ | `max-w-md` |
| 詳細表示 (ShareModal) | ✅ | `max-w-2xl`, Tabs 併用 |
| 大量入力フォーム | ❌ | 別ページに分離 |
| メニュー | ❌ | DropdownMenu |
| 通知 | ❌ | Toast |

## 3. Sheet の使いどころ

| 用途 | side | コメント |
|---|---|---|
| モバイルメニュー | `left` | hamburger 展開 |
| フィルタパネル | `right` | 検索結果ページ |
| 詳細プレビュー | `right` | 一覧で行選択 |
| モバイル bottom sheet | `bottom` | Dialog の代替 |

## 4. Popover の使いどころ

- 設定パネル (色 / 日付)
- フィルタの細かい UI
- ヘルプテキストの詳細

## 5. アクセシビリティ共通

- Title 必須 (Dialog / Sheet)
- Escape で閉じる
- Trigger に戻るフォーカス
- 破壊的操作は Cancel autoFocus
- フォーカストラップ (Dialog / Sheet)
- Popover は外側クリックで閉じる (フォーカストラップなし)

## 6. モーション

- Dialog: `duration-slow` 300ms ease-out (scale 95→100 + fade)
- Sheet: `duration-slow` 300ms ease-out (slide from side)
- Popover: `duration-fast` 150ms ease-out (fade + scale 95→100)
- `prefers-reduced-motion` で 0ms

## 7. アンチパターン

- ❌ Dialog の中に Dialog を入れ子 → ✅ ステップ UI に再設計
- ❌ 大量フォームを Dialog で → ✅ 別ページ
- ❌ Dialog Title 抜け → ✅ a11y 必須
- ❌ Sheet をデスクトップ bottom で → ✅ Dialog
- ❌ Popover をモーダル代わり → ✅ Dialog

## 8. 関連

- [Dialog](../ui/dialog.md)
- [Sheet](../ui/sheet.md)
- [Popover](../ui/popover.md)
- [Tooltip](../ui/tooltip.md)
- [DropdownMenu](../ui/dropdown-menu.md)
- [ShareModal](../components/share-modal.md)
