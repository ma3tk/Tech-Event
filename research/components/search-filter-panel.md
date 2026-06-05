# search-filter-panel — 検索・絞り込みパネル

## 役割と利用箇所

connpass のイベント/グループを多軸で絞り込むための検索フォーム。キーワード、開催日範囲、開催場所 (47 都道府県 + オンライン)、参加費、タグ、ソート順などを統合した UI コンポーネント。

利用箇所:
- `/search/` 検索ページの主フォーム
- `/explore/` イベント探索ページ
- `/calendar/` カレンダーページのサイドフィルター (「開催場所とキーワードで絞り込み」)
- イベント一覧 (`/event/`) の上部フィルターバー
- グループ一覧 `/series/`
- タグ詳細ページ `/tag/{name}/` の関連フィルター

connpass の `/search/` から確認できた要素:
- キーワード入力欄
- 開催日範囲 (FROM 〜 TO)
- 開催場所ドロップダウン (全 47 都道府県 + オンライン)
- 表示順セレクタ (開催日昇順 / 降順 / 新着順)
- 検索結果件数 (「0件」)
- 「イベントは見つかりませんでした」のような empty 状態

## 視覚的構造

### デスクトップ (横並びフォーム)

```
+--------------------------------------------------------------------------+
| イベント検索                                                              |
+--------------------------------------------------------------------------+
| キーワード:  [_______________________________]                            |
| 開催日:     [2026/06/01] 〜 [2026/06/30]                                  |
| 開催場所:   [▼ 都道府県を選択 (オンライン含む)]                            |
| 開催形式:   ☐ オンライン  ☐ オフライン  ☐ ハイブリッド                     |
| 参加費:     ☐ 無料  ☐ 有料                                                |
| タグ:       [+ タグを追加]  [#Python ✕] [#React ✕]                        |
| 並び順:     [▼ 開催日昇順]                                                |
+--------------------------------------------------------------------------+
| [リセット]                                  [検索する]                    |
+--------------------------------------------------------------------------+
```

### サイドバー縦並び (カレンダー)

```
+----------------+
| 絞り込み        |
+----------------+
| キーワード      |
| [_____________]|
+----------------+
| 開催場所        |
| ☑ オンライン   |
| ☐ 東京         |
| ☐ 大阪         |
| ☐ 神奈川       |
| ...            |
+----------------+
| 開催日          |
| [from] 〜 [to] |
+----------------+
| [絞り込む]      |
+----------------+
```

### モバイル (ドロワー)

```
[フィルター ▾]  ← タップで bottom sheet 展開
+--------------------+
| フィルター     [×] |
+--------------------+
| キーワード...      |
| 開催日...          |
| 開催場所...        |
| ...                |
+--------------------+
| [適用 (12件)]      |
+--------------------+
```

## Props 相当の入力データ

```ts
type SearchFilters = {
  keyword?: string;
  dateFrom?: string;       // YYYY-MM-DD
  dateTo?: string;
  prefectures?: string[];  // ["tokyo", "online"]
  format?: ('online' | 'offline' | 'hybrid')[];
  feeType?: ('free' | 'paid')[];
  tags?: string[];
  status?: ('open' | 'full' | 'closed')[];
  sort?: 'date-asc' | 'date-desc' | 'recent' | 'popular';
  organizerId?: string;
};

type SearchFilterPanelProps = {
  initial?: SearchFilters;
  facets?: {
    prefectures: { code: string; label: string; count: number }[];
    tags: { name: string; count: number }[];
  };
  resultCount?: number;
  isLoading?: boolean;
  variant?: 'horizontal' | 'sidebar' | 'drawer';
  onChange?: (f: SearchFilters) => void;   // インクリメンタル
  onSubmit?: (f: SearchFilters) => void;
  onReset?: () => void;
};
```

## 状態バリエーション

| 状態 | 表示 |
|---|---|
| default | 全フィールド空 + 「検索する」プライマリ |
| with-values | 入力値あり、適用済みフィルタを chip 表示 |
| loading | 検索中スピナー、フォーム disabled |
| empty (0件) | 結果ゼロ「条件に一致するイベントはありません」+ ヒント |
| error | 「検索に失敗しました [再試行]」 |
| filter-active | 適用フィルタ数バッジ「フィルタ (3)」表示 |
| collapsed (モバイル) | フィルタは閉じた状態、件数だけ表示 |
| expanded (モバイル) | ボトムシート/モーダルで全フィールド表示 |
| dirty | 未適用変更あり、「保存」/「キャンセル」表示 |
| validation-error | 日付逆転 (`dateFrom > dateTo`) でエラーメッセージ |
| facet-disabled | 該当件数 0 の選択肢はグレーアウト or 非表示 |
| chip-removable | 適用済みフィルタは chip + ✕ で個別削除可 |
| autocomplete-open | タグ・場所入力で候補ドロップダウン表示 |

## レスポンシブでの変化

- **>= 1024px**: 横並びフォーム or 左サイドバー固定 (240–280px 幅)
- **768px–1023px**: 上部に折りたたみ可能な「フィルタ ▾」を配置、展開時にグリッド形式
- **< 768px**: 「絞り込み」ボタンをページ上部に固定 → タップで全画面ドロワー (bottom sheet)
- 日付入力は `<input type="date">` でネイティブピッカー、モバイルで OS UI 利用
- 都道府県は多選択 → 多くなったら「+12 件」表示で省略

## アクセシビリティ要件

- フォーム全体: `<form role="search" aria-label="イベント検索">`
- 各フィールド: `<label>` を必ず関連付け、`<input id="keyword">` & `<label for="keyword">`
- 日付ペア: `<fieldset><legend>開催日</legend>` で意味付け
- セレクト/チェック: `<select>` または `<fieldset>` + `<input type="checkbox">`
- 適用済み chip: `<button aria-label="東京を削除">東京 ✕</button>`
- 結果件数: `aria-live="polite"` の領域で「12件のイベントが見つかりました」をアナウンス
- ドロワー (モバイル): `<dialog>` または Radix Dialog、open 時 focus trap + Escape で閉じる
- キーボード:
  - Tab で順次移動
  - Enter で submit
  - Esc でドロワー閉じ
  - 候補ドロップダウンは ↑↓ で選択、Enter 確定
- カラーコントラスト AA、focus ring 必須
- 「並び順」セレクトには `aria-label="表示順を変更"`

## 推測される HTML 構造と CSS 設計の方針

```html
<form class="c-search-panel" role="search" aria-label="イベント検索" action="/search/" method="get">
  <div class="c-search-panel__field">
    <label for="kw">キーワード</label>
    <input id="kw" name="keyword" type="search" placeholder="例: React, AWS" />
  </div>

  <fieldset class="c-search-panel__field">
    <legend>開催日</legend>
    <input type="date" name="date_from" aria-label="開始日" />
    <span aria-hidden="true">〜</span>
    <input type="date" name="date_to" aria-label="終了日" />
  </fieldset>

  <div class="c-search-panel__field">
    <label for="pref">開催場所</label>
    <select id="pref" name="prefecture" multiple>
      <option value="online">オンライン</option>
      <option value="tokyo">東京</option>
      <!-- ... 全 47 都道府県 -->
    </select>
  </div>

  <fieldset class="c-search-panel__field">
    <legend>開催形式</legend>
    <label><input type="checkbox" name="format" value="online" />オンライン</label>
    <label><input type="checkbox" name="format" value="offline" />オフライン</label>
    <label><input type="checkbox" name="format" value="hybrid" />ハイブリッド</label>
  </fieldset>

  <fieldset class="c-search-panel__field">
    <legend>参加費</legend>
    <label><input type="radio" name="fee" value="any" checked />指定なし</label>
    <label><input type="radio" name="fee" value="free" />無料のみ</label>
    <label><input type="radio" name="fee" value="paid" />有料</label>
  </fieldset>

  <div class="c-search-panel__field">
    <label for="sort">表示順</label>
    <select id="sort" name="sort">
      <option value="date-asc">開催日昇順</option>
      <option value="date-desc">開催日降順</option>
      <option value="recent">新着順</option>
    </select>
  </div>

  <ul class="c-search-panel__applied" aria-label="適用中のフィルタ">
    <li><button type="button" aria-label="Python タグを削除">#Python ✕</button></li>
  </ul>

  <div class="c-search-panel__actions">
    <button type="reset" class="c-btn c-btn--ghost">リセット</button>
    <button type="submit" class="c-btn c-btn--primary">検索する</button>
  </div>

  <p aria-live="polite" class="visually-hidden">12件のイベントが見つかりました</p>
</form>
```

CSS 方針:
- 横並び variant: `display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;`
- サイドバー variant: `display: flex; flex-direction: column; gap: 12px; width: 260px;`
- ドロワー: `position: fixed; bottom: 0; max-height: 80vh; overflow-y: auto; transform: translateY(100%);` (展開時 0)
- input: 高さ 40px、`border-radius: 6px; border: 1px solid var(--border);`
- 適用済み chip エリアは `flex-wrap: wrap; gap: 6px;`
- フィルタ件数バッジは右上に丸バッジ

## 模倣実装するなら React コンポーネントとしてどう設計するか

```tsx
// SearchFilterPanel.tsx
export function SearchFilterPanel({
  initial, facets, resultCount, isLoading, variant = 'horizontal', onChange, onSubmit, onReset,
}: Props) {
  const [filters, setFilters] = useState<SearchFilters>(initial ?? {});
  const update = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onChange?.(next);
  };
  const handleSubmit = (e: FormEvent) => { e.preventDefault(); onSubmit?.(filters); };
  const handleReset = () => { setFilters({}); onReset?.(); };

  return (
    <form
      role="search"
      aria-label="イベント検索"
      className={cx(styles.root, styles[variant])}
      onSubmit={handleSubmit}
      onReset={handleReset}
    >
      <KeywordField value={filters.keyword} onChange={v => update('keyword', v)} />
      <DateRangeField from={filters.dateFrom} to={filters.dateTo} onChange={(f, t) => {
        update('dateFrom', f); update('dateTo', t);
      }} />
      <PrefectureSelect
        value={filters.prefectures}
        options={facets?.prefectures}
        onChange={v => update('prefectures', v)}
      />
      <FormatCheckboxes value={filters.format} onChange={v => update('format', v)} />
      <FeeRadios value={filters.feeType} onChange={v => update('feeType', v)} />
      <TagAutocomplete value={filters.tags} options={facets?.tags} onChange={v => update('tags', v)} />
      <SortSelect value={filters.sort} onChange={v => update('sort', v)} />
      <AppliedChips filters={filters} onRemove={removeFromFilters(setFilters)} />
      <FormActions resultCount={resultCount} isLoading={isLoading} />
      <Live region="polite">{resultCount}件のイベントが見つかりました</Live>
    </form>
  );
}
```

設計のポイント:
- 各 Field を分離 (`KeywordField`, `DateRangeField`, `PrefectureSelect`, …) し再利用と単体テスト容易化
- 状態管理は `useState` で十分だが、URL クエリと同期する `useSearchParamsSync(filters)` を併用
- インクリメンタル検索 (`onChange` debounce 300ms) と submit 検索の両方をサポート
- ドロワー variant は Radix Dialog でモーダル化、Esc / 背景クリックで閉じる
- ファセット (件数付き選択肢) はサーバーから取得し各 Field に渡す
- バリデーション: zod schema で日付逆転を検知し、`react-hook-form` と組み合わせ可能
- URL パラメータからの初期化: `useSearchParams()` → `parseFilters()` → `initial`
- Storybook: empty / loading / error / many-filters のストーリー
- a11y テスト: フォーカス順序、ライブリージョンの読み上げ
