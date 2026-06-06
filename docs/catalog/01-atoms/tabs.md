# Tabs

> Design.md 準拠 | Storybook: [Tabs stories](../../../libs/shared/ui/src/tabs.stories.tsx) | 実装: `libs/shared/ui/src/tabs.tsx`

## 1. 目的
同じ階層の **複数ビュー** を切り替えるためのタブナビゲーション。Radix UI ベース、`role="tablist"` + キーボード操作 (←→) 自動対応。

## 2. いつ使うか
- ユーザープロフィールの「主催」「参加予定」「過去」
- イベント詳細の「概要」「参加者」「コメント」
- ShareModal の「リンク」「SNS」「QR」「埋め込み」
- ダッシュボードのサブセクション切替

## 3. いつ使わないか
- ページ遷移するなら → タブではなく Link
- 階層的な選択 → 別ページ or ネスト UI
- 5+ 個 → 別 UI 検討 (DropdownMenu / Select)

## 4. 構造

```
[概要] [参加者] [コメント]   ← TabsList (Triggers)
─────────────────────────
TabsContent (選択されたタブの中身)
```

## 5. バリアント

- horizontal (default)
- vertical (sidebar 風、稀に使う)

## 6. 状態

inactive / active / disabled / focused。

## 7. アクセシビリティ

- ←→ / Home / End キー対応 (Radix が処理)
- 各 TabsContent に `aria-labelledby` が自動付与
- Tab key で TabsList をスキップしないように
- TablistKeyboard (composite) でキーボード補助を追加できる

## 8. 使用例

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@tech-event/shared-ui";

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">概要</TabsTrigger>
    <TabsTrigger value="participants">参加者</TabsTrigger>
    <TabsTrigger value="comments">コメント</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">{/* ... */}</TabsContent>
  <TabsContent value="participants">{/* ... */}</TabsContent>
  <TabsContent value="comments">{/* ... */}</TabsContent>
</Tabs>
```

## 9. アンチパターン

- ❌ 5+ タブ → ✅ Sub navigation または別ページ
- ❌ ページ遷移を Tabs で → ✅ Link
- ❌ Tab 名が長文 → ✅ 2-4 文字に

## 10. 関連

- [DropdownMenu](./dropdown-menu.md)
- [04-patterns/navigation.md](../04-patterns/navigation.md)

## 11. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース
