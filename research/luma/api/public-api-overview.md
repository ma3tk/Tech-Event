# Luma Public API Overview

## 概要

Luma は `https://public-api.luma.com` ベースの REST API を公開している。**Luma Plus 以上のサブスクライバーのみ**が利用可能で、カレンダー / イベント / ゲスト / チケット / Webhook をフル CRUD で操作できる。OpenAPI 3.1 で記述されており、`https://public-api.luma.com/openapi.json` から仕様を取得できる (認証不要)。

## アクセス可能プラン

| プラン | API アクセス |
| --- | --- |
| Free | ❌ 不可 |
| **Plus ($59/month)** | ✅ 全エンドポイント |
| Enterprise | ✅ + 高度な API + 増枠 |

公式記載: "Only users with a Luma Plus subscription can utilize the Luma API for managing events and guests."

## 認証

- 方式: **API キーヘッダー認証**
- ヘッダー名: `x-luma-api-key`
- 取得元: `https://luma.com/calendar/manage/api-keys`
- スコープ: **カレンダー単位** (calendar 1 つに 1 つの key)
- 注意: "Be careful with this API key since it grants full access to the calendar it's scoped to."
- 組織 (Organization) スコープのキーも存在する (Enterprise)

### キー種別の違い

| キー種別 | 範囲 | レート上限 |
| --- | --- | --- |
| Calendar API key | 1 カレンダー | 200 req/min |
| Organization API key | 組織配下全カレンダー | 500 req/min |

## ベース URL

```
https://public-api.luma.com
```

すべてのパスは `/v{version}/{resource}/{action}` 形式。

## バージョニング (Per-Route)

Luma は **per-route versioning** を採用。全 API 共通の `v1` ではなく、エンドポイントごとに `v1` / `v2` などが付く。例:

```
GET  /v1/event/get
POST /v2/webhooks/create
```

新バージョンは段階的に展開し、古い v1 も並行運用される。**破壊的変更を最小化する設計**。

## レート制限

公式記載 (Rate Limits ページ):

| メソッド | 上限 | 単位 |
| --- | --- | --- |
| GET | 500 requests / 5 min | カレンダー単位 |
| POST | 100 requests / 5 min | カレンダー単位 |

- 換算: 約 100 GET / min、20 POST / min
- 超過時: `429 Too Many Requests`
- ペナルティ: **1 分間アクセス停止** (cooldown)
- GET / POST は別カウンタ
- 高いレートが必要な場合: support@luma.com に連絡

## エラーフォーマット (推定)

OpenAPI 仕様より:

```json
{
  "error": {
    "code": "invalid_event_id",
    "message": "Event with id 'evt-xxx' not found."
  }
}
```

ステータスコード:
- 200: 成功
- 400: バリデーションエラー
- 401: 認証失敗 (キー不正)
- 403: 権限なし (Plus 未加入 / 別カレンダーのキー)
- 404: リソース未発見
- 429: レート超過
- 500: 内部エラー

## 共通 ID 規約

ID には用途別プレフィクスがある:

| プレフィクス | 種別 |
| --- | --- |
| `evt-` | Event |
| `cal-` | Calendar |
| `usr-` | User |
| `tkt-` | Ticket type |
| `gst-` | Guest |
| `org-` | Organization |
| `hst-` | Host |
| `wbh-` | Webhook |

レガシー API では `api_id` (deprecated) という形式が併用されているが、新規実装では `id` を使う。

## 日時フォーマット

- すべての日時は **ISO 8601 UTC** (`2025-06-12T19:00:00Z`)
- timezone は別フィールドで IANA 名 (例: `Asia/Tokyo`, `America/Los_Angeles`)

## ページネーション

GET 系のリスト API はカーソルベース:

```
GET /v1/event/get-guests?event_id=evt-xxx&pagination_limit=50&pagination_cursor=xxx
```

レスポンス:
```json
{
  "entries": [...],
  "has_more": true,
  "next_cursor": "xxx"
}
```

## ヘルスチェック

```bash
curl -H "x-luma-api-key: $LUMA_API_KEY" \
  https://public-api.luma.com/v1/user/get-self
```

成功すると認証ユーザー情報が返る。CI / monitoring で使うと良い。

## OpenAPI 仕様

- URL: `https://public-api.luma.com/openapi.json`
- 認証不要
- 完全な OpenAPI 3.1 ドキュメント
- スキーマ生成 (zod / TypeScript) や Postman/Insomnia import に使える

## SDK (公式)

- 公式 SDK は未提供 (2025 年 6 月時点)
- サンプル: https://github.com/luma-team/basketball-club-example (Demo Basketball Club)
- コミュニティ製 SDK が複数存在 (Node, Python, Ruby)

## 設計思想

1. **REST 風 + RPC ハイブリッド** — `POST /v1/event/update-guest-status` のような action 名 URL
2. **GET = 読み取り、POST = 書き込み** に統一 (PUT/DELETE/PATCH なし)
3. **Per-route versioning** で漸進的進化
4. **Calendar スコープ key** で blast radius を限定
5. **OpenAPI 3.1 公開** で外部開発を歓迎

## connpass との比較

connpass にも API はあるが:
- 限定公開・認証なし読み取りのみが多い
- イベント作成 / 申込変更などの**書き込み API は基本ない**
- Webhook なし

Luma は **書き込みフル CRUD + Webhook** を持っており、外部システム (CRM / Slack / Notion) との連携を前提に設計されている。
