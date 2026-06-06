---
status: stable
figma: TODO
storybook: libs/shared/ui-composite/src/EventCard.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P2, P6]
---

# カード (Cards)

> Design.md §5 + §6 準拠

## 対象ペルソナ

- 主要: P1 山田美咲 (イベント発見)、P2 田中慎太郎 (週末カード閲覧)、P6 小林一郎 (主催: グループカード)
- 副次: P3 佐藤健太、P5 中村由美 (情報密度の控えめさ)

(根拠: [`Personas.md`](../../../Personas.md))

## 1. Card 系の使い分け

```
ドメインオブジェクト?
  ├ イベント
  │   ├ 1 行密度優先 → EventListRow
  │   ├ 横長カード   → EventCard variant="list"
  │   ├ 縦積み grid  → EventCard variant="grid" / EventCardCompact
  │   └ タイムライン → EventTimeline (内部 EventListRow)
  ├ グループ
  │   ├ 一覧グリッド    → GroupCard variant="standard"
  │   ├ サイドバー強調 → GroupCard variant="sidebar"
  │   └ 関連グループ小 → GroupCard variant="compact"
  └ 汎用 (ダッシュボード等)
      └ Card (atom) + 中身組み立て
```

## 2. デザイン原則

- 角丸 `rounded-lg` (8px)
- 面 `bg-surface`
- 影 `shadow-sm` 常時 (subtle)
- hover で持ち上げ: `hover:shadow-md hover:-translate-y-0.5 duration-normal`
- クリック可能なら必ず `<Link>` でラップ (キーボード対応)

## 3. 標準パターン

### 3.1 グリッド (3 列レスポンシブ)
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {events.map((e) => (
    <EventCardCompact key={String(e.id)} event={e} />
  ))}
</div>
```

### 3.2 サイドバーパネル (静的)
```tsx
<Card>
  <CardHeader>
    <CardTitle>関連グループ</CardTitle>
  </CardHeader>
  <CardContent className="space-y-2">
    {related.map((g) => (
      <GroupCard key={g.id} group={g} variant="compact" />
    ))}
  </CardContent>
</Card>
```

### 3.3 ダッシュボード metric
```tsx
<Card className="p-5">
  <p className="text-sm text-muted-foreground">今月の参加者</p>
  <p className="text-3xl font-bold mt-1 tabular-nums">
    {new Intl.NumberFormat("ja-JP").format(count)}
  </p>
  <p className="text-xs text-status-open-fg mt-1">+12% vs 先月</p>
</Card>
```

## 4. アクセシビリティ

- カードクリックは `<Link>` 必須
- カード内の CTA (参加ボタン等) は Link の外で別 tab stop
- タイトルは `CardTitle` (h3) で構造化
- 装飾画像は `alt=""`

## 5. アンチパターン

- ❌ `<div onClick>` でクリック化 → ✅ `<Link>`
- ❌ Card 入れ子 → ✅ Separator か background 差
- ❌ `shadow-2xl` 等の派手な影 → ✅ `shadow-sm`
- ❌ `bg-white` ハードコード → ✅ `bg-surface`

## 6. 関連

- [Card](../ui/card.md)
- [EventCard](../components/event-card.md), [EventCardCompact](../components/event-card-compact.md)
- [EventListRow](../components/event-list-row.md), [EventTimeline](../components/event-timeline.md)
- [GroupCard](../components/group-card.md)
