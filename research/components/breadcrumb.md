# breadcrumb — パンくず

## 役割と利用箇所

ページの階層構造をユーザーに示し、上位階層へ素早く戻ることを可能にするナビゲーション。SEO の観点からも `BreadcrumbList` (schema.org) の構造化データを伴うことが望ましい。

利用箇所:
- イベント詳細 `/event/{id}/` (connpass → グループ名 → イベント名)
- グループ詳細 `/series/{id}/` (connpass → グループ一覧 → グループ名)
- グループ内サブページ (connpass → グループ → イベント一覧/メンバー/資料)
- タグ詳細 `/tag/{name}/` (connpass → タグ一覧 → タグ名)
- ユーザー詳細 (connpass → ユーザー → username)
- 検索結果 `/search/?keyword=...` (connpass → 検索 → "React")
- ランキング・カレンダー等の二次ナビゲーション

connpass 実例:
- イベント詳細ページで上部に「connpass > グループ名 > イベントタイトル」階層

## 視覚的構造

### 標準

```
connpass  >  システムエンジニア友の会  >  プロジェクトマネージャ試験勉強会
```

### モバイル (省略表示)

```
< 戻る | ...  >  プロジェクトマネージャ試験勉強会
```

### 区切り文字バリエーション

```
A > B > C
A / B / C
A › B › C
A — B — C
```

## Props 相当の入力データ

```ts
type BreadcrumbItem = {
  label: string;
  href?: string;         // 末尾要素 (current) のみ undefined
  icon?: ReactNode;      // home アイコンなど
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  separator?: ReactNode;     // デフォルト '›'
  maxItems?: number;         // モバイル省略しきい値
  variant?: 'default' | 'compact' | 'mobile-back';
  showHome?: boolean;
};
```

例:
```ts
const items = [
  { label: 'connpass', href: '/' },
  { label: 'システムエンジニア友の会', href: '/series/123/' },
  { label: 'プロジェクトマネージャ試験勉強会' },  // current
];
```

## 状態バリエーション

| 状態 | 表示 |
|---|---|
| default | リンク全部表示、最後は太字 + リンクなし |
| hover (リンク) | 下線 + アクセントカラー |
| focus-visible | アウトラインリング |
| truncated | 中間項目を `…` に省略 (>= 5 階層時など) |
| mobile-back | 「< 戻る」表示で 1 つ前へ |
| home-icon | 最初の項目をホームアイコンに置換 |
| current-only (深いページ) | 末尾の現在ページのみ強調 |
| overflow | flex-wrap で複数行折り返し or 横スクロール |
| loading | スケルトン (テキスト矩形) |
| empty | items が 1 件 (current のみ) なら非表示も検討 |

## レスポンシブでの変化

- **>= 1024px**: 全項目フル表示、横並び
- **768px–1023px**: 中間項目を1つ省略 (「…」)
- **< 768px**: 「< 戻る」のシンプルな mobile-back に切替、または 1 行で横スクロール
- フォントサイズ 12–14px、グレー文字、現在地のみ強調
- 区切り文字は `›` (アクセシブルかつコンパクト)

## アクセシビリティ要件

- ルート: `<nav aria-label="パンくずリスト">` (`aria-label="breadcrumb"` でも可)
- 構造: `<ol>` (順序のあるリスト)、各項目 `<li>`
- 現在地: `<a aria-current="page">` または `<span>` で表現
- 区切り文字 (`>` `›`) は装飾なので `aria-hidden="true"`、CSS の `::before` で表現するのも可
- スクリーンリーダー用に「現在のページ:」を visually-hidden で補足可
- 構造化データ (SEO): JSON-LD `BreadcrumbList` を併記
- キーボード: 通常の Tab 移動、Enter で遷移
- 折りたたみ (省略) 時の `…` ボタンは `aria-label="省略された階層を表示"` + クリックで展開

## 推測される HTML 構造と CSS 設計の方針

```html
<nav class="c-breadcrumb" aria-label="パンくずリスト">
  <ol class="c-breadcrumb__list">
    <li class="c-breadcrumb__item">
      <a href="/">connpass</a>
    </li>
    <li class="c-breadcrumb__item" aria-hidden="true">
      <span class="c-breadcrumb__sep">›</span>
    </li>
    <li class="c-breadcrumb__item">
      <a href="/series/123/">システムエンジニア友の会</a>
    </li>
    <li class="c-breadcrumb__item" aria-hidden="true">
      <span class="c-breadcrumb__sep">›</span>
    </li>
    <li class="c-breadcrumb__item">
      <span aria-current="page">プロジェクトマネージャ試験勉強会</span>
    </li>
  </ol>
</nav>

<!-- 構造化データ -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "connpass", "item": "https://connpass.com/" },
    { "@type": "ListItem", "position": 2, "name": "システムエンジニア友の会", "item": "https://setk.connpass.com/" },
    { "@type": "ListItem", "position": 3, "name": "プロジェクトマネージャ試験勉強会" }
  ]
}
</script>
```

CSS 方針:
```css
.c-breadcrumb__list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  color: var(--color-text-muted);
  padding: 8px 0;
  list-style: none;
}
.c-breadcrumb__item a { color: var(--color-text-muted); text-decoration: none; }
.c-breadcrumb__item a:hover { color: var(--color-accent); text-decoration: underline; }
.c-breadcrumb__item [aria-current="page"] {
  color: var(--color-text-strong);
  font-weight: 600;
}
.c-breadcrumb__sep { color: var(--color-text-faint); }
@media (max-width: 480px) {
  .c-breadcrumb__list { flex-wrap: nowrap; overflow-x: auto; white-space: nowrap; }
}
```

CSS で区切りを描画する別解 (li::before):
```css
.c-breadcrumb__item + .c-breadcrumb__item::before {
  content: '›';
  margin: 0 6px;
  color: var(--color-text-faint);
}
```

## 模倣実装するなら React コンポーネントとしてどう設計するか

```tsx
// Breadcrumb.tsx
type BreadcrumbProps = {
  items: BreadcrumbItem[];
  separator?: ReactNode;
  maxItems?: number;
  variant?: 'default' | 'mobile-back';
  enableJsonLd?: boolean;
};

export function Breadcrumb({
  items, separator = '›', maxItems = 5, variant = 'default', enableJsonLd = true,
}: BreadcrumbProps) {
  const isMobile = useMediaQuery('(max-width: 480px)');

  if (variant === 'mobile-back' && isMobile) {
    const prev = items[items.length - 2];
    return (
      <nav aria-label="パンくずリスト">
        {prev && (
          <a href={prev.href} className={styles.back}>
            <ChevronLeft aria-hidden /> 戻る
          </a>
        )}
      </nav>
    );
  }

  const display = collapseIfNeeded(items, maxItems);

  return (
    <>
      <nav aria-label="パンくずリスト" className={styles.root}>
        <ol className={styles.list}>
          {display.map((item, i) => {
            const isLast = i === display.length - 1;
            return (
              <Fragment key={`${item.label}-${i}`}>
                <li className={styles.item}>
                  {item.href && !isLast ? (
                    <a href={item.href}>{item.icon}{item.label}</a>
                  ) : (
                    <span aria-current="page">{item.icon}{item.label}</span>
                  )}
                </li>
                {!isLast && (
                  <li className={styles.sep} aria-hidden="true">{separator}</li>
                )}
              </Fragment>
            );
          })}
        </ol>
      </nav>
      {enableJsonLd && <BreadcrumbJsonLd items={items} />}
    </>
  );
}

function collapseIfNeeded(items: BreadcrumbItem[], max: number): BreadcrumbItem[] {
  if (items.length <= max) return items;
  return [
    items[0],
    { label: '…' },
    items[items.length - 2],
    items[items.length - 1],
  ];
}
```

設計のポイント:
- 全 items を渡すだけのシンプル API
- 中間省略 (`…`) は純関数 `collapseIfNeeded` で計算
- `<BreadcrumbJsonLd>` は構造化データ専用の隣接コンポーネント
- `aria-current="page"` を末尾のみに付与
- separator は ReactNode を受け取れるよう柔軟に
- アイコン対応 (home / chevron) で他システム互換も確保
- Storybook: 浅い (2) / 標準 (3) / 深い (6) / mobile-back / アイコン付きをカバー
- ユニットテスト: collapseIfNeeded のロジック、aria-current の付与位置、JSON-LD の出力
