# 一覧表示 (Lists and Tables)

> Design.md §5.4 + §10 準拠

## 1. 判断フロー

```
1 件あたりの情報量
  ├ 多い (タイトル + メタ 5 軸 + サムネ)
  │   ├ 横長 1 行で密度優先 → EventListRow
  │   └ カード形式 → EventCard list/grid
  └ 少ない (タイトル + 1-2 メタ)
      └ シンプルリスト → ul + li
```

## 2. 標準パターン

### 2.1 検索結果 (EventListRow + Pagination)

```tsx
<div className="space-y-6">
  <SearchBox action="/search" defaultValue={q} />

  {events.length === 0 ? (
    <EmptyState
      variant="search"
      title="該当するイベントが見つかりません"
      description="キーワードを変えてもう一度お試しください"
    />
  ) : (
    <>
      <p className="text-sm text-muted-foreground">
        全 {total.toLocaleString("ja-JP")} 件中 {start}-{end} 件
      </p>
      <ul className="divide-y divide-border">
        {events.map((e) => (
          <li key={String(e.id)}>
            <EventListRow event={e} />
          </li>
        ))}
      </ul>
      <Pagination
        current={page}
        total={totalPages}
        buildHref={(p) => `/search?q=${q}&page=${p}`}
      />
    </>
  )}
</div>
```

### 2.2 グリッド (EventCard grid)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {events.map((e) => (
    <EventCard key={String(e.id)} variant="grid" event={e} />
  ))}
</div>
```

### 2.3 タイムライン (Luma 風)

```tsx
<EventTimeline events={events} stickyTopPx={64} />
```

### 2.4 ローディング (Skeleton 一覧)

```tsx
{isLoading ? (
  <ul className="divide-y divide-border" aria-busy="true">
    {Array.from({ length: 10 }).map((_, i) => (
      <li key={i}><EventListRowSkeleton /></li>
    ))}
  </ul>
) : (
  <ul>{events.map(...)}</ul>
)}
```

## 3. アクセシビリティ

- `<ul role="list">` (Safari の reset 対策)
- 各行は `<Link>` でラップ
- 件数 / 範囲を読み上げ可能なテキストで提示
- Pagination は `<nav aria-label="pagination">`

## 4. レスポンシブ

- モバイル: 1 列 + サムネ縮小 (64×48)
- タブレット: 2 列 grid or 1 行リスト
- デスクトップ: 3 列 grid or 1 行リスト

## 5. アンチパターン

- ❌ `<table>` でイベント一覧 → ✅ `<ul>` + EventListRow (responsive で崩れる)
- ❌ Empty 時に何も出さない → ✅ EmptyState
- ❌ 件数表示なし → ✅ 必須
- ❌ ページ番号なしの無限スクロール → ✅ Pagination + 件数か、明示的 "もっと見る"

## 6. 関連

- [EventListRow](../03-organisms/event-list-row.md)
- [EventCard](../03-organisms/event-card.md)
- [EventTimeline](../03-organisms/event-timeline.md)
- [Pagination](../02-molecules/pagination.md)
- [Skeleton](../01-atoms/skeleton.md)
- [EmptyState](../01-atoms/empty-state.md)
