# Card

> Design.md 準拠 | Storybook: [Card stories](../../../libs/shared/ui/src/card.stories.tsx) | 実装: `libs/shared/ui/src/card.tsx`

## 1. 目的 (Purpose)
情報のまとまりを **1 つの面 (surface)** として視覚的に分離する最小単位。Header / Title / Description / Content / Footer の構造化スロットを提供し、EventCard / GroupCard 等のドメインカードの基盤となる。

## 2. いつ使うか (When to use)
- イベント / グループ / ユーザーなど **1 アイテム** のまとまり表示
- ダッシュボードの **メトリクス枠** (StatsCard 風)
- フォーム全体を囲む **入力グループ** (Section card)
- サイドバーの **小機能パネル** (MiniCalendar / RecentlyViewedEvents)

## 3. いつ使わないか (When NOT to use)
- **完全フラットなリスト 1 行** → [EventListRow](../03-organisms/event-list-row.md) (Card で囲まない)
- **モーダルの本体** → [Dialog](./dialog.md) を直接 (Card は不要)
- **小さな chip / pill** → [Badge](./badge.md) / [TagPill](../02-molecules/tag-pill.md)
- **ページ全体の背景** → `bg-background` のみ

## 4. 構造 (Anatomy)

```
┌─────────────── Card ───────────────┐
│ CardHeader                          │
│   CardTitle (h3)                    │
│   CardDescription (muted)           │
│ ─────────────────────────────────── │
│ CardContent                         │
│   (main body)                       │
│ ─────────────────────────────────── │
│ CardFooter                          │
│   [Button] [Button]                 │
└─────────────────────────────────────┘
```

- 角丸 `rounded-lg` (8px)
- 面: `bg-surface`
- 影: `shadow-sm` (常時)、`hover:shadow-md` (option)
- 区切り: 内部のセクションは `border-t border-border` で

## 5. バリアント (Variants)

Card 自体に CVA variant はない (構成スロットのみ)。**ドメイン特化のバリアントは別コンポーネントで**:
- [EventCard](../03-organisms/event-card.md): list / grid variant
- [GroupCard](../03-organisms/group-card.md): standard / sidebar / compact variant
- [RecentlyViewedEvents](../02-molecules/recently-viewed-events.md): サイドバー特化

### スタイル軸 (Tailwind で表現)

| 軸 | クラス例 | 用途 |
|---|---|---|
| 静的 | `shadow-sm` のみ | サイドバーのパネル |
| hover で持ち上げ | `shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-normal` | クリック可能なカード |
| selected | `ring-2 ring-brand-orange` | フィルタ選択中 |
| ghost (border のみ) | `bg-transparent border border-border` | 二次的なグループ |

## 6. サイズ

Card 自体にサイズ prop はない。中身でコントロール。慣用パディング:
- 標準: `p-6` (24px)
- コンパクト: `p-4` (16px)
- ダッシュボード: `p-5` (20px)

## 7. 状態 (States)

| 状態 | 視覚 |
|---|---|
| default | `bg-surface shadow-sm` |
| hover (クリック可能時のみ) | `shadow-md` + `-translate-y-0.5` |
| selected | `ring-2 ring-brand-orange` |
| disabled | `opacity-50 pointer-events-none` |
| loading | 内部を [Skeleton](./skeleton.md) で置換 |
| empty | 内部を [EmptyState](./empty-state.md) で置換 |

## 8. アクセシビリティ (Accessibility)

- Card 自体は **非インタラクティブ** がデフォルト (装飾)
- カード全体をクリック可能にする場合は `<Link>` でラップ (`<div onClick>` 禁止)
- 見出しは `CardTitle` (内部で h3) で構造を保つ
- 役割が明確なら `role="region" aria-labelledby={titleId}` を補う

## 9. レスポンシブ

- モバイル: `w-full` で並列、`p-4` に縮める
- デスクトップ: `grid lg:grid-cols-3 gap-4` で 3 列など
- グリッド時は **アスペクト比固定** ではなく **min-height** で揃える

## 10. 使用例 (Code)

### 10.1 基本
```tsx
import {
  Card, CardHeader, CardTitle, CardDescription,
  CardContent, CardFooter,
} from "@tech-event/shared-ui";

<Card>
  <CardHeader>
    <CardTitle>イベントを作成</CardTitle>
    <CardDescription>1 分で公開できます</CardDescription>
  </CardHeader>
  <CardContent>
    {/* form 等 */}
  </CardContent>
  <CardFooter className="justify-end gap-2">
    <Button variant="secondary">下書き保存</Button>
    <Button>公開する</Button>
  </CardFooter>
</Card>
```

### 10.2 クリック可能カード (Link でラップ)
```tsx
<Link href={`/event/${event.id}`} className="block">
  <Card className="shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-normal">
    <CardContent className="p-4">
      <h3 className="text-base font-bold line-clamp-2">{event.title}</h3>
      <p className="text-xs text-muted-foreground mt-1">
        {formatDate(event.startsAt)}
      </p>
    </CardContent>
  </Card>
</Link>
```

### 10.3 ダッシュボードの metric card
```tsx
<Card className="p-5">
  <p className="text-sm text-muted-foreground">今月の参加者</p>
  <p className="text-3xl font-bold mt-1 tabular-nums">
    {new Intl.NumberFormat("ja-JP").format(count)}
  </p>
  <p className="text-xs text-status-open-fg mt-1">+12% vs 先月</p>
</Card>
```

## 11. アンチパターン (Anti-patterns)

- ❌ Card の中に Card (入れ子) → ✅ Separator か background 差で表現
- ❌ `<div onClick>` でクリック可能化 → ✅ `<Link>` でラップ (キーボード対応)
- ❌ `bg-white` ハードコード → ✅ `bg-surface` (theme 対応)
- ❌ 影を派手にする (`shadow-2xl`) → ✅ `shadow-sm` ベースで控えめに
- ❌ Card 全体に `cursor-pointer` だが Link でない → ✅ 必ず Link
- ❌ Title 抜き → ✅ 構造化のために CardTitle 必須 (純飾りパネルは除く)

## 12. 関連 (Related)

- [EventCard](../03-organisms/event-card.md) — イベント特化 (list/grid variant)
- [GroupCard](../03-organisms/group-card.md) — グループ特化
- [Skeleton](./skeleton.md) — loading 状態
- [EmptyState](./empty-state.md) — 空状態
- [04-patterns/cards.md](../04-patterns/cards.md) — Card 系の使い分け詳細

## 13. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース、Header/Title/Description/Content/Footer の構造化スロット
