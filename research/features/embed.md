# 外部サイト埋め込み (embed.md)

connpass のイベント情報を外部サイトに表示する手段 (公式ウィジェット、API 経由、OGP、iframe 等) と、connpass 内部での外部コンテンツ埋め込みについての調査。

## 1. 機能の目的

「埋め込み」という用語は connpass において 2 方向で使われる:

1. **外部サイト → connpass の情報を表示する**: 主催者の自社サイトやコミュニティページに、connpass で開催予定のイベント一覧やバナーを表示したい
2. **connpass → 外部コンテンツを埋め込む**: イベント説明 / 資料セクションに、SpeakerDeck / YouTube / Docswell 等を埋め込み表示する

主な目的:

- 主催者のオウンドメディアからの集客強化 (自社サイト → connpass の流入)
- イベント開催の継続的なアピール (静的ウェブサイトに最新イベントを表示)
- スライドや動画を「資料セクション」で再生可能にして体験を高める
- SNS シェア時のカード表示 (OGP / Twitter Card)

## 2. 利用シナリオ

| シナリオ | 手段 |
|----------|------|
| 自社コーポレートサイトに「直近イベント」を表示 | connpass API v2 で取得 → 自前で HTML 生成 |
| 個人ブログに connpass グループの最新イベントを表示 | connpass API v2 + GitHub Actions で静的サイト生成 |
| Discord / Slack に新着イベント通知 | connpass API ポーリング → Webhook |
| ブログ記事内に登壇したイベントの情報カードを貼る | OGP リッチプレビュー (X や Discord 等が自動展開) |
| イベント説明文にスライドを埋め込む | 資料セクションに SpeakerDeck URL を登録 |
| イベント説明文に YouTube 動画 | 資料セクションに YouTube URL を登録 |

## 3. 関連エンティティ・フィールド

### 3.1 外部から取得可能なデータ (API v2)

```
GET /api/v2/events/?keyword=xxx&ym=YYYYMM
Response:
{
  "events": [
    {
      "event_id": int,
      "title": string,
      "catch": string,
      "description": string (HTML),
      "event_url": string,
      "started_at": ISO8601,
      "ended_at": ISO8601,
      "limit": int,
      "accepted": int,
      "waiting": int,
      "place": string,
      "address": string,
      "lat": float,
      "lon": float,
      "owner_id": int,
      "owner_nickname": string,
      "owner_display_name": string,
      "group_id": int,
      "group_title": string,
      "group_url": string,
      "image_url": string,
      "hash_tag": string,
      ...
    }
  ]
}
```

### 3.2 OGP メタタグ (イベント詳細ページ)

```html
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:image" content="..." />
<meta property="og:url" content="..." />
<meta property="og:type" content="article" />
<meta name="twitter:card" content="summary_large_image" />
```

## 4. UI 上の入口と画面

### 4.1 公式埋め込みウィジェット

- connpass 公式の「ブログパーツ」「埋め込みウィジェット」相当の機能は **現状ヘルプドキュメント上は明確に提供されていない**
- 外部サイトへの埋め込みは、第三者の Qiita / Zenn 記事で「API を叩いて自前で表示する」方法が紹介されているのみ

### 4.2 API キー発行

- 個人・コミュニティ: 完全無料、申請 → 1 つの API キー発行
- 法人: 月額 297,000 円 (税込) または年額 3,564,000 円、API キー 2 つ発行 (追加 1 個あたり 20,000 円/月)
- 法人がコミュニティ枠で API を申請することは禁止

### 4.3 connpass 内での外部埋め込み

- 「資料」セクションで SpeakerDeck / Docswell / YouTube / Vimeo の URL を貼ると自動的に iframe 埋め込み
- 説明文内では Markdown / 限定 HTML タグでの画像表示のみ (iframe は許可されない想定)

## 5. 外部サービス連携

### 5.1 connpass API v2

- 認証: `X-API-Key` ヘッダ (API キー)
- レート制限: API キー単位で「一定時間内の連続アクセス回数」に制限あり (具体的な数値は公開されていない)
- 主要エンドポイント (推測 + 公開ラッパー実装から):
  - `GET /events/`: イベント検索 (キーワード / 開催月 / グループ ID / オーナーニックネーム等)
  - `GET /events/{event_id}/presentations/`: イベントの資料一覧
  - `GET /groups/?subdomain=xxx`: グループ検索
  - `GET /users/?nickname=xxx`: ユーザー検索
  - `GET /users/{nickname}/groups/`: ユーザーが所属するグループ
  - `GET /users/{nickname}/attended_events/`: ユーザーが参加したイベント
  - `GET /users/{nickname}/presenter_events/`: ユーザーが登壇したイベント

### 5.2 OGP / Twitter Card

- X (Twitter) / Facebook / Slack / Discord / LINE 等は OGP メタタグを自動展開
- イベントページの URL を貼り付けるだけで、画像 + タイトル + 説明文付きのカードが表示される
- これが事実上「最も使われている埋め込み手段」

### 5.3 サードパーティ製ウィジェット

- 第三者開発者が API ラッパー (Node.js, Ruby, Go 等) や MCP サーバを公開
  - `@yamanoku/connpass-user-mcp-server` (Model Context Protocol サーバ)
  - `sue445/connpass_api_v2-ruby`
  - `ryohidaka/node-connpass`
- 外部サービスとして Microsoft Power Automate の "Connpass" コネクタも存在

## 6. ルール・制約

- 公式埋め込みウィジェット (iframe 一行で貼れる) は提供されていない
- API 利用には申請が必要、法人は高額な月額料金
- API キーのレート制限あり (具体数値非公開、推定 1 req/秒〜数秒に 1 回程度)
- API のキャッシュ無視や大量取得はブロック対象
- 個人・コミュニティ向け無料 API は「商用利用 / 法人利用」では使えない (規約違反)
- API レスポンスを永続キャッシュして自前 DB 化すると規約に抵触する可能性 (再頒布禁止条項)
- 出典として connpass の表示が必要 (推奨)

## 7. 模倣実装時の代替案

### 7.1 公式埋め込みウィジェット (差別化)

connpass にない「iframe 一行で貼れる埋め込み」を提供すると、自社サイト連携が圧倒的に楽になる。実装方針:

```html
<!-- グループの直近 5 イベントを表示 -->
<iframe
  src="https://example.com/embed/group/xxx?limit=5&theme=light"
  width="100%"
  height="400"
  frameborder="0"
  sandbox="allow-scripts allow-popups">
</iframe>
```

または JavaScript 埋め込み:

```html
<script src="https://example.com/embed.js"
        data-group="xxx"
        data-limit="5"
        data-theme="light"></script>
<div id="techevent-embed"></div>
```

### 7.2 ウィジェットのバリエーション

| ウィジェット種別 | 用途 |
|------------------|------|
| グループ直近イベント | コーポレートサイト・登壇者の個人サイト |
| 単一イベントカード | ブログ記事内に貼る |
| カウントダウンタイマー | LP 上で「あと N 日」を表示 |
| 申込ボタン | "Apply on TechEvent" の CTA ボタンを別サイトに設置 |
| 参加者数バッジ | "100+ Attendees" バッジ |

### 7.3 oEmbed 対応

- イベント URL を貼ると Discord / Slack / Notion 等で自動的に展開されるよう、`/oembed?url=...` エンドポイントを提供
- Notion / Discord / Slack はそれぞれ独自のリンクプレビュー仕様を持つので OGP の最適化も併用

### 7.4 公開 API の設計

connpass API は「申請制 + 法人有料」というモデルだが、模倣実装では下記を推奨:

| 階層 | 内容 | 料金 |
|------|------|------|
| Public (認証なし) | 公開イベント一覧、ページネーション制限あり | 無料、レート制限 60 req/h |
| Authenticated (API キー) | より高頻度、私的グループも取得可能 | 無料、5000 req/h |
| Business | 大量データ取得、Webhook | 月額 |

GraphQL を採用すると埋め込みウィジェット側でフィールド選択ができて転送量を抑えられる。

### 7.5 Webhook 通知 (差別化)

connpass にない機能として、イベント作成時・更新時に外部 URL に POST 通知する Webhook 機能を提供:

- イベント公開時 → 主催者の Slack / Discord / Teams にカード形式で送信
- 参加者上限到達時 → 運営 Slack に通知
- 参加申込キャンセル時 → 補欠繰り上がりを通知

### 7.6 RSS / Atom フィード

- グループ単位、検索単位で `/feed.rss` を提供
- 静的サイト (Jekyll, Hugo) から取り込みが容易
- 古典的だが安定した連携手段

### 7.7 ブログパーツの SEO 配慮

- iframe 埋め込みは検索エンジンに認識されにくいため、SSR で server-side レンダリングする版を併用提供
- 埋め込み元サイトに canonical URL を返す
- Schema.org Event 構造化データを HTML に含める

### 7.8 セキュリティ

- iframe 埋め込み時の clickjacking 対策 (X-Frame-Options / CSP frame-ancestors)
- API キーは Server-side で使い、クライアント JS には公開しない
- Webhook 配信は HMAC 署名で改竄検証

### 7.9 connpass からの移行

- connpass のイベントを ID 指定で取り込み、自プラットフォームに移行できる「インポーター」を提供
- 移行後も connpass 側に「移行されました」リンクを残せるとスムーズ

---

参考: <https://help.connpass.com/api/>, <http://connpass.com/about/api/v2/>, <https://qiita.com/kiwsdiv/items/becdb77949c23322e0e2>, <https://zenn.dev/chot/articles/35addf53c38019>, <https://x.com/connpass_jp/status/1726420821416235519>
