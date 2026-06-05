# tag-pill — タグ表示 (Pill / Chip)

## 役割と利用箇所

connpass で頻出する「タグ」(技術キーワード、トピック) を視覚的に区別された小型 UI として表示する。クリックでタグ詳細ページ (`/tag/{name}/`) に遷移、または検索フィルターに追加する。

利用箇所:
- イベント詳細ページのヘッダー下「#PM試験」「#Python」などのタグ群
- イベントカード内の補助タグ表示
- グループカードの興味分野表示
- グループページのサイドバー「関連タグ」
- 検索フィルターパネルの選択済みタグ表示 (削除可)
- タグ詳細ページのヘッダー
- 検索フィルター「人気タグ」のクラウド表示
- ユーザープロフィールの「興味のあるタグ」

形態は大別して 3 種類:
1. **Link Tag** — リンクとしてタグページに遷移
2. **Filter Chip** — 検索条件に追加・削除する操作可能チップ (×ボタン付き)
3. **Selectable Tag** — トグル選択可能 (チェック状態)

## 視覚的構造

### 標準 (Link Tag)

```
[ # PM試験 ]   [ # 勉強会 ]   [ # オンライン ]
```

### Filter Chip (削除可)

```
[ # Python ✕ ]   [ # 東京 ✕ ]
```

### Selectable (検索フィルター内)

```
[ ◯ React ]  [ ● Vue (選択中) ]  [ ◯ Angular ]
```

### サイズバリアント

```
sm:  [#tag]
md:  [ # tag ]
lg:  [  # tag  ]
```

## Props 相当の入力データ

```ts
type TagPillProps = {
  label: string;
  href?: string;             // 指定時はリンクとして描画
  variant?: 'default' | 'filter' | 'selectable' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  color?: 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  count?: number;            // タグ付きイベント件数 (例: 「Python (123)」)
  selected?: boolean;        // selectable 時の選択状態
  removable?: boolean;       // filter chip の ✕ 表示
  disabled?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
};
```

connpass の実例:
- イベント詳細: `#プロジェクトマネージャ` `#PM試験` のような単語タグ
- カウント付き: タグページで「Python (1,234 イベント)」

## 状態バリエーション

| 状態 | 表示 |
|---|---|
| default | 灰背景 + 黒文字、ボーダーなし or 1px solid |
| hover | 背景色わずかに濃化、underline (リンク時) |
| focus-visible | アウトライン 2px solid accent |
| active (押下中) | scale(0.97) や暗色化 |
| selected | アクセントカラー背景 + 白文字 |
| disabled | opacity 0.5、cursor not-allowed |
| outline | 透過背景 + ボーダー |
| with-count | 「Python 1,234」のように数値を後置 |
| removable | 右に ✕ アイコン、クリックで削除 |
| loading (selectable) | スピナーまたは pulse |
| color (semantic) | green=募集中系 / red=注意 / blue=技術系 |
| truncated | 長文字列は ellipsis (max-width 指定) |
| group (集合表示) | 連続するタグ間は gap 6px、wrap |

## レスポンシブでの変化

- サイズトークンを維持 (px 固定)、画面幅で形状を変えない
- 一覧表示時は `flex-wrap: wrap` で複数行
- モバイルではタグ集合を横スクロール (`overflow-x: auto`) も検討 (検索画面の人気タグなど)
- タップ領域: 最低 32×24px、padding を確保
- 長文タグ (例: 「フロントエンドエンジニア」) の場合は `max-width: 200px; text-overflow: ellipsis;`

## アクセシビリティ要件

- リンクの場合: `<a href="/tag/Python/" aria-label="タグ: Python">#Python</a>`
- ボタンの場合: `<button type="button" aria-pressed="true|false">`
- 削除可能チップ: 親 chip と削除ボタンを別要素にする。`<button aria-label="Python タグを削除">✕</button>`
- 色だけで状態を示さない (selected はテキストか aria 属性で補強)
- カウントは `<span class="visually-hidden">123件のイベント</span>` を併記
- キーボード:
  - Tab で各タグへフォーカス
  - Enter で遷移/選択トグル
  - Backspace / Delete で chip 削除 (検索フィルタ内)
- ハッシュ記号 `#` は装飾扱いなら `aria-hidden="true"` で読み上げから除外

## 推測される HTML 構造と CSS 設計の方針

### Link Tag

```html
<a href="/tag/Python/" class="c-tag c-tag--default" aria-label="タグ: Python">
  <span class="c-tag__hash" aria-hidden="true">#</span>Python
</a>
```

### Filter Chip (削除可)

```html
<span class="c-tag c-tag--filter">
  <span class="c-tag__hash" aria-hidden="true">#</span>Python
  <button type="button" class="c-tag__remove" aria-label="Python タグを削除">
    <svg aria-hidden="true" focusable="false"><path d="..."/></svg>
  </button>
</span>
```

### Selectable

```html
<button type="button" class="c-tag c-tag--selectable" aria-pressed="true">
  React
</button>
```

CSS 方針:
```css
.c-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;            /* 完全な pill */
  font-size: 12px;
  line-height: 1.4;
  background: var(--tag-bg, #eef2f5);
  color: var(--tag-fg, #333);
  text-decoration: none;
  transition: background-color .15s, color .15s;
}
.c-tag:hover { background: var(--tag-bg-hover, #dde4ea); }
.c-tag:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.c-tag--selectable[aria-pressed="true"] {
  background: var(--color-accent);
  color: #fff;
}
.c-tag--outline { background: transparent; border: 1px solid var(--border); }
.c-tag--sm { font-size: 11px; padding: 2px 8px; }
.c-tag--lg { font-size: 14px; padding: 6px 14px; }
.c-tag__remove {
  border: 0; background: transparent;
  cursor: pointer; padding: 0 4px;
  border-radius: 50%;
}
.c-tag__remove:hover { background: rgba(0,0,0,.06); }
```

デザイントークン:
- Tag の色は約 6 種類 (gray, blue, green, yellow, red, purple)
- `--tag-{color}-bg`, `--tag-{color}-fg` で CSS 変数化

## 模倣実装するなら React コンポーネントとしてどう設計するか

```tsx
// Tag.tsx
type TagProps = {
  label: string;
  href?: string;
  variant?: 'default' | 'filter' | 'selectable' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  color?: 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  count?: number;
  selected?: boolean;
  removable?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
};

export function Tag({
  label, href, variant = 'default', size = 'md', color = 'gray',
  count, selected, removable, disabled, onClick, onRemove,
}: TagProps) {
  const className = cx(styles.root, styles[`size-${size}`], styles[`color-${color}`], styles[variant]);

  const content = (
    <>
      <span aria-hidden="true">#</span>{label}
      {count != null && (
        <>
          <span aria-hidden="true">({count.toLocaleString('ja-JP')})</span>
          <span className="visually-hidden">{count}件</span>
        </>
      )}
      {removable && (
        <button
          type="button"
          className={styles.remove}
          aria-label={`${label} タグを削除`}
          onClick={e => { e.stopPropagation(); onRemove?.(); }}
        >
          <CloseIcon aria-hidden />
        </button>
      )}
    </>
  );

  if (href && !disabled) {
    return <a href={href} className={className} aria-label={`タグ: ${label}`}>{content}</a>;
  }
  if (variant === 'selectable') {
    return (
      <button
        type="button"
        className={className}
        aria-pressed={selected}
        disabled={disabled}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }
  return <span className={className}>{content}</span>;
}

// TagList.tsx — 集合表示
export function TagList({ tags, ...props }: { tags: string[] } & Pick<TagProps, 'size' | 'variant'>) {
  return (
    <ul className={styles.list} role="list">
      {tags.map(t => <li key={t}><Tag label={t} href={`/tag/${encodeURIComponent(t)}/`} {...props} /></li>)}
    </ul>
  );
}
```

設計のポイント:
- ベース `Tag` は polymorphic (link / button / span) で出し分け
- `TagList` で複数表示の責務を分離
- カラーマッピングはトークン (`tag-color.ts`) に集約
- 「タグを削除」ボタンの click は親の click と区別 (`stopPropagation`)
- ローカライズ: 「タグ:」「○件」を i18n キーに
- Storybook: 全 variant × size × color マトリクス
- ユニットテスト: aria-pressed の切替、Enter での選択、削除ボタンの fire
- 設計の汎用性により、他システムでも再利用可能 (Skill / Topic / Category 表示)
