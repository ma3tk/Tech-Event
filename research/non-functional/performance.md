# connpass の体感パフォーマンスとキャッシュ戦略

connpass.com を観察した結果から、体感パフォーマンスの推測、画像最適化、キャッシュ戦略、フロントエンドのアセット構成を整理する。実測したのは画面構造とリソースの種類のみで、内部実装は推定。

---

## 1. 体感パフォーマンス (観察)

トップページ・グループページ・新着イベント一覧をブラウザで開いた印象:

- 初回ロードは比較的速い (おおよそ 1-2 秒)
- イベントカードは画像 + テキストで構成され、画像が遅延ロードされる挙動
- 申込ボタンクリック後の遷移はサーバーラウンドトリップが見える
- フッターまで明示的なスクロール構造で、長くなりすぎていない
- グループページの「過去 905 件の資料」のように大量データを抱えるページもページネーション or 遅延ロードで快適に表示

---

## 2. Core Web Vitals 目標

Google の Core Web Vitals 基準:

| 指標 | Good | Needs Improvement | Poor |
|---|---|---|---|
| LCP (Largest Contentful Paint) | ≤ 2.5s | 2.5s〜4.0s | > 4.0s |
| INP (Interaction to Next Paint) | ≤ 200ms | 200〜500ms | > 500ms |
| CLS (Cumulative Layout Shift) | ≤ 0.1 | 0.1〜0.25 | > 0.25 |

クローン実装の目標は全 Good。

---

## 3. ページ別のパフォーマンス考察

### 3.1 トップページ (/)
- ヒーロー画像 / グループサムネイル / イベントカード画像が多い
- LCP 候補: ヒーロー画像
- 対策: ヒーロー画像のプリロード (`<link rel="preload" as="image">`)、WebP/AVIF 配信、`loading="eager" fetchpriority="high"`

### 3.2 イベント詳細 (/event/{id}/)
- LCP 候補: カバー画像 or 大見出し
- 重い要素: 参加者リスト (アイコン多数)
- 対策: 参加者アイコンは初期表示分のみ即時、残りは仮想スクロール or 「もっと見る」

### 3.3 グループページ (/{group}.connpass.com/)
- 過去イベント / 資料リストが長い
- 対策: 上から N 件のみ SSR、残りは Intersection Observer で遅延ロード

### 3.4 ダッシュボード / マイページ
- ログイン後専用、SEO 対象外
- 対策: CSR + SWR/React Query で先にスケルトン → データ取得後に置換

---

## 4. 画像最適化

### 4.1 形式
- JPG/PNG → WebP / AVIF を Accept ヘッダ判定で配信
- アイコンは SVG 化
- 大きな写真は JPEG 互換 WebP

### 4.2 サイズと srcset
```html
<img
  src="/img/event/362879.webp"
  srcset="/img/event/362879-w320.webp 320w,
          /img/event/362879-w640.webp 640w,
          /img/event/362879-w1200.webp 1200w"
  sizes="(max-width: 768px) 100vw, 640px"
  alt="..."
  loading="lazy"
  decoding="async"
  width="640" height="360"
/>
```
- width / height 指定で CLS を防ぐ
- loading="lazy" (LCP 候補以外)
- decoding="async"

### 4.3 CDN
- 画像配信は CDN (Cloudflare Images / Akamai Image Manager / Cloudinary)
- リクエスト URL のパラメータで動的リサイズ: `/img/event/362879.webp?w=640&q=75`

### 4.4 OGP 画像の動的生成
- イベント公開時に 1200×630 px の OGP 画像を生成しキャッシュ
- 生成済みは CDN に置き、再生成は updated_at 変化時のみ

---

## 5. JavaScript / CSS 最適化

### 5.1 バンドル戦略
- Next.js などのフレームワーク採用前提
- ページ単位のコード分割
- ルートごとに動的 import
- 共通モジュールは Webpack splitChunks で最適化

### 5.2 サードパーティスクリプト
- Google Analytics, X 埋め込み, Facebook SDK を遅延ロード
- 重要度に応じて `<script defer>` / `<script async>`
- Partytown による Web Worker 移行も検討

### 5.3 CSS
- Critical CSS をインライン
- 残りは `<link rel="stylesheet">` で非同期
- CSS-in-JS は SSR でスタイルを HTML に注入

---

## 6. キャッシュ戦略

### 6.1 HTTP キャッシュヘッダ

| リソース | Cache-Control | TTL |
|---|---|---|
| HTML (SSR) | private, max-age=0, must-revalidate | 都度検証 |
| 静的 JS/CSS (バンドル) | public, max-age=31536000, immutable | 1 年 (hash 付き) |
| 画像 (CDN) | public, max-age=2592000 | 30 日 |
| API レスポンス | private, max-age=60 | 1 分 |
| OGP 画像 | public, max-age=86400, stale-while-revalidate=604800 | 1 日 + SWR 1 週間 |
| sitemap.xml | public, max-age=86400 | 1 日 |

### 6.2 CDN キャッシュ
- イベント詳細ページは ISR (Incremental Static Regeneration) で N 秒キャッシュ
- 更新があった場合 (Event.updated_at 変動) はオンデマンド再生成
- 募集締切・抽選発表時刻にトリガーで再検証

### 6.3 アプリ層キャッシュ
- Redis でホットな Event / Group / EventStat をキャッシュ
- TTL は 30〜60 秒
- イベント編集時に明示的にパージ

### 6.4 ブラウザキャッシュ
- Service Worker による事前キャッシュ
- マイページの最近のイベントをオフラインでも表示

---

## 7. データ取得パターン

### 7.1 SSR + ISR
- 公開イベント詳細は SSR で初回 HTML を生成
- N 秒間隔で revalidate
- updated_at に応じた on-demand revalidation

### 7.2 SSG (Static Site Generation)
- /about/, /terms/, /privacy/ は完全静的
- ビルド時生成

### 7.3 CSR + SWR
- マイページ / 主催者ダッシュボードは CSR
- SWR で API レスポンスをキャッシュ + 再検証

### 7.4 部分 SSR (RSC / Partial Hydration)
- ヘッダー / フッターは静的
- 動的部分のみクライアントコンポーネント
- React Server Components 採用で可能

---

## 8. データベースクエリ最適化

### 8.1 ページネーション
- イベント一覧は keyset pagination (cursor based)
- `WHERE started_at < $cursor ORDER BY started_at DESC LIMIT 20`

### 8.2 N+1 回避
- Event 一覧で Group / Owner をまとめて取得
- Prisma の `include` / `select` で必要列のみ

### 8.3 集約キャッシュ
- Group.member_count, Event.accepted_count はカウンタキャッシュ
- トランザクションで update + その後の再カウントは非同期

### 8.4 全文検索
- PostgreSQL の `tsvector` インデックス
- 別途 Elasticsearch / Meilisearch に切り出すケースも

---

## 9. リアルタイム性

申込状況をリアルタイムに見せたいが、コストとのトレードオフ。

### 9.1 ポーリング
- イベント詳細ページで 30 秒ごとに `/event/{id}/status` を fetch
- 残席数だけ更新

### 9.2 Server-Sent Events / WebSocket
- 申込集中時 (例: 公開直後) のみ WS で push
- 通常時はポーリングで十分

### 9.3 楽観的 UI
- 申込ボタン押下時に即座に「申込中」表示
- サーバ確定後に状態確定

---

## 10. メール送信のスケール

connpass はメール配信が中核機能 (グループメンバー数千〜数万への一斉配信あり)。

### 10.1 アーキテクチャ
- メール送信は非同期キュー (Sidekiq / Celery / Bull)
- バッチ単位 (500 件 / バッチ) で SES / SendGrid に渡す
- 失敗時のリトライは指数バックオフ

### 10.2 スループット目標
- 1 分間に 10,000 通の送信を目標
- Findy グループ (44,510 名) で抽選結果通知を 5 分以内に配信完了

### 10.3 配信品質
- DMARC / SPF / DKIM 設定
- バウンス処理 (ハードバウンスは即座にメール無効化)
- 配信停止リンクの自動生成

---

## 11. 監視と SLO

### 11.1 SLO 例
- 可用性: 月次 99.9% (= 月 43 分以内のダウン)
- p95 レスポンスタイム: 主要 API で 300ms 以内
- LCP p75: 2.5s 以内

### 11.2 監視ツール
- Sentry (フロントエンドエラー)
- Datadog APM (バックエンドメトリクス)
- Lighthouse CI (リリース時の性能リグレッション検出)
- New Relic Synthetic で主要シナリオの定期実行

### 11.3 アラート
- p95 > 500ms が 5 分継続 → PagerDuty 通知
- 5xx エラー率 > 1% → 即時通知
- メールキュー積みが 10 分以上 → 通知

---

## 12. 静的アセットの配信

### 12.1 CDN
- Cloudflare / Fastly / Akamai
- 全静的ファイルを CDN 経由配信
- HTTP/3 (QUIC) 対応

### 12.2 圧縮
- Brotli (br) を優先、Gzip フォールバック
- HTML / JS / CSS / SVG / フォントすべて圧縮

### 12.3 フォント
- Web Font は WOFF2
- `font-display: swap` で FOIT を防止
- システムフォントを優先するスタックも検討:
  `font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Yu Gothic", sans-serif;`

---

## 13. プリロードとプリフェッチ

```html
<link rel="preconnect" href="https://cdn.connpass.com" crossorigin>
<link rel="preconnect" href="https://images.connpass.com" crossorigin>
<link rel="dns-prefetch" href="https://www.google-analytics.com">

<link rel="preload" as="image" href="/hero.webp" fetchpriority="high">
<link rel="preload" as="font" href="/fonts/notosans.woff2" type="font/woff2" crossorigin>

<link rel="prefetch" href="/event/362880/" as="document">
```

ホバーで次画面をプリフェッチ (例: Next.js の `<Link>` がデフォルトで実装)。

---

## 14. キャッシュ無効化シナリオ

主要なキャッシュ無効化トリガ:

| イベント | 無効化対象 |
|---|---|
| Event 公開 | グループページ / トップページ / sitemap |
| Event 編集 (重要フィールド) | 該当 Event 詳細 / 関連 sitemap |
| Event キャンセル | Event 詳細 / グループページ / 申込者キャッシュ |
| 抽選完了 | Event 詳細 / 各 Participant ステータス |
| 新規 Group | sitemap_groups.xml / トップページ |
| Group 統計更新 | グループページのキャッシュ部分 |

CDN への明示的 purge API or タグベースの一括 invalidation を活用。

---

## 15. ロード分散

### 15.1 読み取り
- リードレプリカで負荷分散
- 主要ページは CDN キャッシュにより DB ヒットを最小化

### 15.2 書き込み
- マスター DB に集中
- 申込集中時はキューイング (短期保留して順次処理)

### 15.3 ジョブ
- 抽選 cron / リマインダー cron は別 worker
- 失敗時の再実行を冪等に

---

## 16. パフォーマンス予算

主要ページの予算:

| ページ | HTML | JS | CSS | 画像 | フォント | 合計 |
|---|---|---|---|---|---|---|
| トップ | 50KB | 200KB | 30KB | 500KB | 100KB | 880KB |
| イベント詳細 | 70KB | 250KB | 40KB | 800KB | 100KB | 1.26MB |
| グループページ | 80KB | 220KB | 40KB | 1MB | 100KB | 1.44MB |
| マイページ | 30KB | 300KB | 40KB | 200KB | 100KB | 670KB |

これを超える場合は再検討。

---

## 17. リソースヒント

- preconnect: クリティカル CDN, 画像サーバ
- preload: LCP 候補 / フォント
- prefetch: 次画面の HTML
- prerender: 滅多に使わない (リソース消費大)

---

## 18. パフォーマンスとアクセシビリティ

prefers-reduced-motion: reduce 設定時に CSS / JS 由来のアニメーション無効化。これにより低スペック端末でも体感が向上。

---

## 19. CI でのパフォーマンスチェック

- Lighthouse CI で PR ごとに測定
- 設定: モバイル Slow 4G、CPU 4 倍スロー
- 規定値割れ時に PR ブロック

---

## 20. 改善ロードマップ

1. **Phase 1**: 画像 WebP/AVIF 化、適切な width/height 指定
2. **Phase 2**: ISR + CDN キャッシュの全面適用
3. **Phase 3**: React Server Components の段階導入
4. **Phase 4**: Service Worker によるオフライン対応
5. **Phase 5**: メール送信の HA (Multi-AZ) + バッチ最適化
6. **Phase 6**: AVIF / WebP の自動配信、HTTP/3 全面対応

これらを Phase 順に実装すれば、connpass と同等以上の体感速度に到達可能。
