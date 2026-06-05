# connpass の SEO 観点

connpass はエンジニア向け技術イベントの情報集約サービスとして、Google 検索で多くの検索流入を得ている。サブドメイン構造 (`{group}.connpass.com`) を活用しつつ、構造化データやサイトマップで検索性を担保している。

---

## 1. URL 構造

### 1.1 主要 URL パターン
| パターン | 内容 |
|---|---|
| `https://connpass.com/` | トップ |
| `https://connpass.com/about/` | サービス説明 |
| `https://connpass.com/explore/` | 新着イベント一覧 |
| `https://connpass.com/series/` | 新着グループ一覧 |
| `https://{group}.connpass.com/` | グループページ |
| `https://{group}.connpass.com/event/{event_id}/` | イベント詳細 |
| `https://{group}.connpass.com/event/{event_id}/participation/` | 参加者一覧 |
| `https://{group}.connpass.com/event/{event_id}/presentation/` | 発表資料一覧 |
| `https://connpass.com/user/{nickname}/` | ユーザープロフィール |
| `https://connpass.com/dashboard/` | ログイン誘導 |
| `https://help.connpass.com/` | ヘルプセンター |

### 1.2 SEO 観点での URL の良さ
- **イベント ID が短い数字**: `/event/362879/` のように整数 ID。重複を防ぎつつ短い。
- **グループは独立サブドメイン**: ドメイン強度を分散しつつ、グループ単位のブランディングが効く。
- **末尾スラッシュの統一**: 全 URL が `/` で終わる正規形。
- **小文字統一**: 大文字を含まない。

### 1.3 URL 設計上の弱点
- イベント ID にスラッグが含まれないため、URL からタイトルが推測できない (例: `/event/362879/` だけでは何のイベントか分からない)。`/event/362879-genai-meetup/` のような slug 付与は SEO 強化の余地。
- グループサブドメインは後から変更不可。改名時は SEO リセットされる。

---

## 2. サイトマップ

connpass の robots.txt と sitemap.xml は公開されている (`https://connpass.com/sitemap.xml`)。推測される構造:

```
sitemap_index.xml
  ├── sitemap_events_2026_06.xml (月別 / 直近)
  ├── sitemap_events_2026_05.xml
  ├── ...
  ├── sitemap_groups.xml
  ├── sitemap_users.xml (任意)
  └── sitemap_static.xml (/about/, /help/, /api/ 等)
```

### 2.1 推奨事項
- 50,000 URL × 50MB の上限を遵守
- 月単位またはグループ単位で sitemap を分割
- `<lastmod>` を必ず付与し、Event.updated_at を反映
- 終了済みイベントも残しておく (検索エンジンには有益な過去情報)

### 2.2 robots.txt
```
User-agent: *
Disallow: /admin/
Disallow: /dashboard/
Disallow: /event/*/edit/
Disallow: /event/*/admin/
Disallow: /event/*/survey/
Allow: /
Sitemap: https://connpass.com/sitemap.xml
```

---

## 3. メタタグと OGP

### 3.1 イベント詳細ページの推定メタタグ
```html
<head>
  <title>{イベントタイトル} - {グループ名} - connpass</title>
  <meta name="description" content="{catch + 説明本文の冒頭 150 字}" />
  <meta name="keywords" content="{タグ名のカンマ区切り}" />
  
  <!-- OGP -->
  <meta property="og:title" content="{イベントタイトル}" />
  <meta property="og:description" content="{catch}" />
  <meta property="og:image" content="{cover_image_url}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="https://{group}.connpass.com/event/{id}/" />
  <meta property="og:site_name" content="connpass" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@connpass_jp" />
  <meta name="twitter:title" content="{イベントタイトル}" />
  <meta name="twitter:description" content="{catch}" />
  <meta name="twitter:image" content="{cover_image_url}" />
  
  <!-- canonical -->
  <link rel="canonical" href="https://{group}.connpass.com/event/{id}/" />
</head>
```

### 3.2 OGP 画像の自動生成
- カバー画像が未設定の場合、サーバ側でテンプレートに「タイトル + 日時 + グループ名」を合成した OGP 用画像を自動生成すべき
- 推奨サイズ: 1200×630 px
- Findy 等は背景色付きの自社デザインを採用

---

## 4. 構造化データ (Schema.org JSON-LD)

イベント詳細ページに `Event` タイプの JSON-LD を埋め込むのが SEO ベストプラクティス。connpass 自体も `Event` スキーマを採用していると推測 (Google の検索結果カード対応のため)。

### 4.1 推奨 JSON-LD 例 (オフラインイベント)
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "イベントタイトル",
  "description": "イベント説明文",
  "startDate": "2026-06-30T19:00:00+09:00",
  "endDate": "2026-06-30T21:00:00+09:00",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": {
    "@type": "Place",
    "name": "会場名",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "東京都",
      "streetAddress": "千代田区...",
      "postalCode": "100-0001",
      "addressCountry": "JP"
    }
  },
  "image": ["https://example.com/cover.png"],
  "organizer": {
    "@type": "Organization",
    "name": "グループ名",
    "url": "https://{group}.connpass.com/"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "JPY",
    "availability": "https://schema.org/InStock",
    "url": "https://{group}.connpass.com/event/{id}/",
    "validFrom": "2026-06-01T00:00:00+09:00"
  },
  "performer": [
    {
      "@type": "Person",
      "name": "登壇者名"
    }
  ]
}
</script>
```

### 4.2 オンラインイベント用
```json
{
  "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
  "location": {
    "@type": "VirtualLocation",
    "url": "https://meet.example.com/..."
  }
}
```

### 4.3 ハイブリッドイベント用
- `eventAttendanceMode`: `MixedEventAttendanceMode`
- location は配列で物理 + 仮想両方を記述

---

## 5. パンくず (BreadcrumbList)

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "connpass", "item": "https://connpass.com/" },
    { "@type": "ListItem", "position": 2, "name": "{グループ名}", "item": "https://{group}.connpass.com/" },
    { "@type": "ListItem", "position": 3, "name": "{イベントタイトル}" }
  ]
}
```

UI 上の表示も `connpass > グループ名 > イベントタイトル` のリンク階層で実装。

---

## 6. 内部リンク戦略

### 6.1 トップページ
- 「新着イベント」「人気ランキング」「カンファレンス特集」を内部リンクで提供
- 主要グループへの導線 (LayerX, Findy, DeNA Tech, StudyCo, PyCon JP 等)

### 6.2 イベントページ
- 同グループの過去イベント
- 同タグの関連イベント
- 主催者の他イベント

### 6.3 グループページ
- 過去イベント時系列
- 累積発表資料一覧
- メンバープロフィール (上位 N 名)

---

## 7. 動的 vs 静的レンダリング

イベント詳細ページは SEO 上、サーバーサイドレンダリング (SSR) が必須。CSR でしか HTML が生成されないとクローラに本文が読まれない。

### 推奨アーキテクチャ
- Next.js の `getServerSideProps` または `generateMetadata` でメタタグ生成
- ISR (Incremental Static Regeneration) で更新頻度に応じて再生成
- イベント本文・参加者数を SSR で初期 HTML に注入

---

## 8. パンくず / カテゴリ的構造

connpass は明示的なカテゴリ分類を持たない (オープンタグ形式) が、SEO 上は以下の階層を強化する余地がある:

- 都道府県別ページ `/area/tokyo/`
- タグ別ページ `/tag/react/`
- 月別アーカイブ `/event/calendar/2026/06/`

これらが内部リンクとして整備されると、ロングテール検索流入が増える。

---

## 9. 多言語対応

connpass は日本語のみ。SEO 上、英語圏向けに `hreflang` を使った多言語化は未対応。グローバル展開を狙う場合は:
- `<link rel="alternate" hreflang="en" href="https://en.{group}.connpass.com/..." />`
- 機械翻訳された英語版ページの提供

---

## 10. パフォーマンスと SEO

Google の Core Web Vitals は SEO ランキングに影響:

- **LCP (Largest Contentful Paint)**: イベントカバー画像の遅延が要因になりやすい → next-gen image (WebP/AVIF), preconnect, srcset 必須
- **CLS (Cumulative Layout Shift)**: 広告 / 画像のサイズ指定で防ぐ
- **INP (Interaction to Next Paint)**: 過剰な JS バンドルを抑える

---

## 11. ソーシャル流入連動

- X 連携: イベント公開時の自動投稿
- Facebook 連携: ページ更新の自動シェア
- LinkedIn シェアボタン: ビジネス層へのリーチ

これらは外部ドメインからの被リンク獲得にも寄与 (`og:url` の正規化が重要)。

---

## 12. インデックス管理

### 12.1 noindex すべきページ
- `/dashboard/`, `/admin/`, ログインフォーム
- ドラフト状態のイベント (visibility=draft)
- プライベートリンクのイベント (`<meta name="robots" content="noindex">`)
- 個別申込結果ページ
- 古すぎる退会済みユーザーページ

### 12.2 canonical 設定
- ページネーション: `?page=2` を含む URL は `<link rel="canonical">` で 1 ページ目を指定
- ソート/フィルタパラメータも canonical で重複を防ぐ

### 12.3 404 / 410 戦略
- 削除されたイベントは 410 Gone でクローラに削除を伝える
- 取り違いのないようリダイレクト URL を整備 (グループ統合時)

---

## 13. 検索クエリ仮説と対策

エンジニアが検索しそうなクエリ:

- `React 勉強会 東京` → タグ + 地域別ページ
- `LLM ハッカソン` → タグ + 動的セクション
- `connpass 抽選 補欠` → ヘルプ記事の SEO 強化
- `connpass API` → /about/api/v2/ への内部リンク強化
- `{グループ名}` → グループページの h1 を明示

---

## 14. 内部検索の活用

サイト内検索結果ページも SEO 対象になり得る:
- `?keyword=react` 等の検索結果ページに `<meta name="robots" content="noindex,follow">`
- インデックスされても価値の薄いページは noindex で除外

---

## 15. ヘルプセンター SEO

`help.connpass.com` のサブドメインで運営される。

- Sphinx ベースのドキュメント (拡張子 `.html` が散見される)
- 各記事に明示的なパンくずとカテゴリ
- 「抽選方式で参加者を募集する」「グループを作成する」「イベントを作成する」など FAQ 系クエリへのカバレッジが広い

---

## 16. SEO 改善のロードマップ (本クローン向け)

1. **Phase 1**: Event JSON-LD, OGP, sitemap, robots.txt 整備
2. **Phase 2**: タグ別 / 地域別ページの動的生成
3. **Phase 3**: ISR 化, 検索結果ページの noindex 化
4. **Phase 4**: hreflang による多言語化
5. **Phase 5**: イベント URL に slug 付与 (`/event/{id}-{slug}/`)
6. **Phase 6**: AMP ページ or Web Stories の試験導入

---

## 17. 監視

- Search Console での Index Coverage / Core Web Vitals レポート
- 4xx/5xx エラー監視
- 主要キーワードの掲載順位トラッキング (GRC, Semrush 等)
- 構造化データのリッチリザルト表示テスト

---

## 18. 競合との比較

| 観点 | connpass | TECH PLAY | Doorkeeper | EventBrite |
|---|---|---|---|---|
| 構造化データ | Event JSON-LD | Event JSON-LD | Event JSON-LD | Event JSON-LD |
| URL 構造 | サブドメイン | パス階層 | サブドメイン | パス階層 |
| サイトマップ | 月別分割 | カテゴリ別 | 全体 1 本 | 国別分割 |
| 多言語 | 日本語のみ | 日本語のみ | 一部英語 | 多言語完備 |
| OGP 自動生成 | ◯ | ◯ | ◯ | ◯ |

---

## 19. アクションアイテム

技術的に整備すべき優先項目:

1. すべてのイベント詳細ページに `Event` JSON-LD を生成 (offers / location / performer)
2. パンくずに BreadcrumbList JSON-LD を併設
3. サイトマップを月次パーティショニング
4. OGP 画像の動的合成エンドポイント (`/og?eventId=...`)
5. canonical / hreflang / noindex の設定漏れを CI で検査
6. ISR の `revalidate` 期間を Event.updated_at 連動で調整
7. Google Search Console の連携と Index Coverage の定期確認

これらを実装すれば、連邦 SEO 上は connpass と肩を並べられる。
