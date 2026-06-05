# pagination — ページネーション

## 役割と利用箇所

複数ページに分割された一覧コンテンツに対して、ユーザーが任意のページへジャンプまたは前後に移動するための UI。connpass では数値ベースの典型的なページャー (「<<前へ 1 2 3 4 5 6 次へ>>」) が採用されている。

利用箇所:
- イベント一覧 `/explore/`, `/event/`
- 検索結果 `/search/`
- グループ一覧 `/series/` (新着グループは最大 6 ページ程度)
- ランキング `/ranking/` (50件×N ページ)
- カレンダーは月単位のページネーション (前月/次月)
- 参加者一覧 `/event/{id}/participation/` (大規模イベントで)
- フィード/コメント一覧

connpass 実例:
- 「1 2 3 4 5 6 次へ>>」のような数字ボタン列
- 「<<前へ」「次へ>>」テキストリンク
- カレンダーには「<<前へ 2026年6月 次へ>>」の月切替

## 視覚的構造

### 標準数値ページャー

```
<< 前へ  | 1 | 2 | 3 | [4] | 5 | 6 | ... | 24 |  次へ >>
                       ↑ current (強調)
```

### 簡略 (前後のみ)

```
[ << 前のページ ]                    [ 次のページ >> ]
```

### 月ナビ

```
<< 2026年5月  |  2026年6月  |  2026年7月 >>
              ↑ current
```

### モバイル

```
[<]  4 / 24  [>]
```

## Props 相当の入力データ

```ts
type PaginationProps = {
  currentPage: number;            // 1-indexed
  totalPages: number;
  pageSize?: number;
  totalItems?: number;
  siblingCount?: number;          // current 周辺に何ページ表示するか
  boundaryCount?: number;         // 先頭/末尾に何ページ表示するか
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  variant?: 'numbered' | 'simple' | 'month' | 'mobile';
  buildHref?: (page: number) => string;
  onChange?: (page: number) => void;
  ariaLabel?: string;
};
```

例:
```ts
<Pagination
  currentPage={4}
  totalPages={24}
  siblingCount={1}
  boundaryCount={1}
  buildHref={p => `?page=${p}`}
/>
```

## 状態バリエーション

| 状態 | 表示 |
|---|---|
| default | 現在ページ強調 + 周辺ページボタン |
| current | 押下不可、`aria-current="page"` |
| hover (リンク) | 背景色変化、underline |
| focus-visible | アウトライン |
| disabled (端) | `<<` `>>` が disabled (ページ 1 や最終ページ時) |
| loading | フェッチ中、各リンク disabled + spinner オーバーレイ |
| empty | total = 0 / total = 1 で非表示 |
| ellipsis | 大量ページで `…` 表示 |
| jump-to | 「ページ番号を入力 [__] [移動]」変種 |
| month-variant | 月単位 (前月/次月) のラベル |
| infinite-scroll-replace | ページャーの代替に「もっと見る」 |
| keyboard-focus | ← → でページ移動 (オプション) |

## レスポンシブでの変化

- **>= 1024px**: 数値全表示 + 前後ボタン
- **768px–1023px**: 中間を省略、端は表示
- **< 768px**: 現在/総数のみ表示 (`4 / 24`) + ← → アイコンに簡略化
- タップ領域は最低 44×44px
- 月ナビは画面幅に関わらず一貫表示

## アクセシビリティ要件

- ルート: `<nav aria-label="ページネーション">`
- リスト: `<ul>` で構造化、各項目 `<li>`
- リンクには `aria-label="2ページ目に移動"` で意味を補足
- 現在ページ: `<a aria-current="page">` または `<span>` (リンクなし)
- 省略記号 (`…`): `<li aria-hidden="true">…</li>` または `<span class="visually-hidden">省略</span>`
- 前後ボタン: `aria-label="前のページ"` / `aria-label="次のページ"`
- 無効化: `<a aria-disabled="true">` (HTML 標準 disabled は a に効かないので CSS + JS で制御) or `<button disabled>`
- キーボード: Tab で順次移動、Enter で遷移、← → でページ送り (オプション、`role="navigation"` 内で実装)
- ロードイベント時に `aria-live="polite"` で「ページ4を表示中」をアナウンス
- フォーカス管理: ページ遷移後、結果リストの先頭にスクロール & フォーカス移動 (ヘッディングなど)

## 推測される HTML 構造と CSS 設計の方針

```html
<nav class="c-pagination" aria-label="ページネーション">
  <ul class="c-pagination__list">
    <li>
      <a href="?page=3" class="c-pagination__btn" aria-label="前のページに移動">
        <span aria-hidden="true">‹</span> 前へ
      </a>
    </li>
    <li>
      <a href="?page=1" aria-label="1ページ目に移動">1</a>
    </li>
    <li aria-hidden="true"><span class="c-pagination__ellipsis">…</span></li>
    <li>
      <a href="?page=3" aria-label="3ページ目に移動">3</a>
    </li>
    <li>
      <a aria-current="page" aria-label="現在のページ、4ページ目">4</a>
    </li>
    <li>
      <a href="?page=5" aria-label="5ページ目に移動">5</a>
    </li>
    <li aria-hidden="true"><span>…</span></li>
    <li>
      <a href="?page=24" aria-label="最終ページ (24ページ目)に移動">24</a>
    </li>
    <li>
      <a href="?page=5" class="c-pagination__btn" aria-label="次のページに移動">
        次へ <span aria-hidden="true">›</span>
      </a>
    </li>
  </ul>
</nav>
```

CSS 方針:
```css
.c-pagination__list {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  list-style: none;
  padding: 0;
  margin: 16px auto;
}
.c-pagination__list a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  min-height: 36px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--color-text);
  text-decoration: none;
  background: var(--color-bg);
}
.c-pagination__list a:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-accent);
}
.c-pagination__list a[aria-current="page"] {
  background: var(--color-accent);
  color: #fff;
  border-color: var(--color-accent);
  cursor: default;
  pointer-events: none;
}
.c-pagination__list a[aria-disabled="true"] {
  opacity: 0.4;
  pointer-events: none;
}
@media (max-width: 640px) {
  /* 数値項目を隠して current/total のみ表示する CSS は実装に任せる */
}
```

## 模倣実装するなら React コンポーネントとしてどう設計するか

```tsx
// Pagination.tsx
type PaginationProps = {
  currentPage: number;
  totalPages: number;
  siblingCount?: number;
  boundaryCount?: number;
  buildHref?: (page: number) => string;
  onChange?: (page: number) => void;
};

export function Pagination({
  currentPage, totalPages, siblingCount = 1, boundaryCount = 1, buildHref, onChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;
  const range = computePages(currentPage, totalPages, siblingCount, boundaryCount);

  const navigate = (page: number) => {
    if (page === currentPage) return;
    onChange?.(page);
    // フォーカスを結果リスト先頭へ移すヘルパー
    document.getElementById('results-top')?.focus();
  };

  return (
    <nav aria-label="ページネーション" className={styles.root}>
      <ul className={styles.list}>
        <PageItem
          page={currentPage - 1}
          label="前へ"
          disabled={currentPage === 1}
          buildHref={buildHref}
          onSelect={navigate}
        />
        {range.map((p, i) =>
          p === 'ellipsis'
            ? <li key={`e-${i}`} aria-hidden="true" className={styles.ellipsis}>…</li>
            : <PageItem
                key={p}
                page={p}
                label={`${p}`}
                isCurrent={p === currentPage}
                buildHref={buildHref}
                onSelect={navigate}
              />
        )}
        <PageItem
          page={currentPage + 1}
          label="次へ"
          disabled={currentPage === totalPages}
          buildHref={buildHref}
          onSelect={navigate}
        />
      </ul>
    </nav>
  );
}

// 純関数: ページ配列を計算
export function computePages(
  current: number, total: number, sibling = 1, boundary = 1
): Array<number | 'ellipsis'> {
  const range: Array<number | 'ellipsis'> = [];
  const left  = Math.max(current - sibling, boundary + 1);
  const right = Math.min(current + sibling, total - boundary);

  for (let i = 1; i <= boundary; i++) range.push(i);
  if (left > boundary + 1) range.push('ellipsis');
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - boundary) range.push('ellipsis');
  for (let i = total - boundary + 1; i <= total; i++) {
    if (i > boundary) range.push(i);
  }
  return range;
}
```

設計のポイント:
- `computePages` を純関数として外出しテスト可能 (端のケース、省略の挿入)
- `PageItem` 単体コンポーネントで disabled / current の出し分け
- `buildHref` 注入で URL ベースか onChange ベースかを切替
- Next.js なら `<Link>`、汎用なら `<a>`
- ページ遷移後の focus management を内蔵 (a11y 推奨)
- variant: `numbered / simple / month / mobile` を props で切替
- Storybook: total=1 (非表示), 5, 24, 1000 など
- ユニットテスト: computePages の境界条件、prev/next の disabled、aria-current
- URL クエリ同期は親で `useSearchParams()` を使い `buildHref` を渡すパターン推奨
- アナリティクス: ページ番号送信を `data-page` で
