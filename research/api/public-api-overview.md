# connpass 公開API 概要

connpass が公式に提供している HTTP API の概要、認証、レート制限、利用規約、エラー形式をまとめる。

調査元 (一次情報):

- 公式ドキュメント (v2): <https://connpass.com/about/api/v2/>
- 公式 OpenAPI スキーマ (v2): <https://connpass.com/about/api/v2/openapi.json>
- 公式ドキュメント (v1, 2025年末廃止予定): <https://connpass.com/about/api/v1/>
- API ヘルプ (料金・申込み): <https://help.connpass.com/api/>
- 利用規約: <https://connpass.com/term/>

## 1. バージョン

| バージョン | ベースURL | 状態 |
| --- | --- | --- |
| v2 (現行) | `https://connpass.com/api/v2/` | 推奨 |
| v1 (旧版) | `https://connpass.com/api/v1/` | 非推奨。**2025年末に廃止予定**。固定IP方式の認証 |

v1 から v2 への主な変更点 (OpenAPI 記載):

- 認証方式が「固定IP登録」から「APIキー」に変更
- スロットリング (1 req/sec) が導入
- パス階層が `/api/v1/event/` → `/api/v2/events/` のように複数形に変更
- レスポンスフィールドの整理: `event_id` → `id`, `event_url` → `url`, `series` → `group`, `user_id` → `id`, `user_url` → `url`, `user_image_url` → `image_url`
- リクエストパラメータ: `series_id` → `group_id`
- v2 で新規追加されたパラメータ: `publish_ym`, `publish_ymd`
- v2 で新規追加されたレスポンスフィールド: `published_at`, `open_status`

## 2. 認証

### v2 (現行)

すべてのエンドポイントで **APIキー認証が必須**。

| 項目 | 内容 |
| --- | --- |
| 方式 | HTTPリクエストヘッダ |
| ヘッダ名 | `X-API-Key` |
| 値 | 申請後に発行される文字列 (例: `CPaVAKNa.6u0RBKOm2F462P4vDHln8IR2MW5PhR493cFH6UbKyE8OqbsBfEk4p6FF`) |
| 失敗時 | `401 Unauthorized` |

加えて **`User-Agent` ヘッダの送信が必須** (ドキュメントに明記なしだが、未送信時は CloudFront 段で `403 Forbidden` HTML を返す。詳細: <https://yoshikiito.net/blog/archives/connpass-api-v2-header/>)。

例:

```bash
curl -X GET "https://connpass.com/api/v2/events/?keyword=python" \
  -H "X-API-Key: <YOUR_API_KEY>" \
  -H "User-Agent: my-app/1.0"
```

### v1 (旧版)

事前申請した固定 IP からのみアクセス可能。クエリパラメータ `format=json` が必要。2025年12月末で廃止予定なので新規実装では使用しない。

### APIキーの取得方法 (`https://help.connpass.com/api/`)

| 区分 | 料金 | 発行キー数 |
| --- | --- | --- |
| 法人 (商用) | 月額 297,000円 / 年額 3,564,000円 (税込) | 契約時2本。追加は 20,000円/月/本 |
| コミュニティ / 個人 (非商用) | 無料 | 1本のみ。追加発行不可 |

支払いは銀行振込のみ。コミュニティ用キーで法人利用は不可。

## 3. レート制限 (スロットリング)

| 項目 | 内容 |
| --- | --- |
| 上限 | **APIキー単位で 1 req / 秒** |
| 超過時のステータス | `429 Too Many Requests` |
| 推奨 | リクエスト間に 1 秒以上の間隔を空ける |

v1 時代は「robots.txt 遵守」のみで明示的な数値制限なし。v2 で初めて明示された。

## 4. リクエストフォーマット

- HTTP メソッド: 全エンドポイントで **`GET` のみ**
- パラメータ: クエリストリング (`?key=value&key=value`)
- 配列パラメータ: `repeat` 形式 (例: `?keyword=AI&keyword=機械学習`) もしくはカンマ区切り (`?event_id=364,365`) のいずれも可
- レスポンス: `application/json; charset=utf-8`
- 文字コード: UTF-8

## 5. 共通レスポンス構造

すべての一覧系エンドポイントは以下の共通フィールドを含むラッパで包む。

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `results_returned` | integer | 当該レスポンスに含まれる件数 |
| `results_available` | integer | 検索条件にマッチする総件数 |
| `results_start` | integer | 検索結果の開始位置 (1-origin) |
| `events` / `groups` / `users` / `presentations` | array | リソース配列 (エンドポイントに依存) |

### 共通ページング

| パラメータ | 型 | 既定値 | 制約 |
| --- | --- | --- | --- |
| `start` | integer | `1` | 1以上 |
| `count` | integer | `10` | 1〜100 |

## 6. エラー形式

公式ドキュメントには HTTP ステータスのみ明示。レスポンスボディの構造化エラースキーマは未公開。

| ステータス | 状況 | ボディ (推定) |
| --- | --- | --- |
| `200 OK` | 正常 | JSON データ |
| `400 Bad Request` | パラメータ型違反など | JSON エラー (詳細未公開) |
| `401 Unauthorized` | `X-API-Key` 不正・未指定 | JSON or プレーン |
| `403 Forbidden` | `User-Agent` 未送信、IP制限など。**CloudFront 由来の HTML** が返る場合あり (JSON パース失敗の原因) |
| `404 Not Found` | 指定IDのリソースが存在しない |  |
| `429 Too Many Requests` | スロットリング超過 |  |
| `5xx` | サーバ側障害 |  |

実装時は **`Content-Type` を確認してから JSON パース** することが推奨される (`application/json` 以外なら HTML エラーページの可能性)。

## 7. 利用規約上の制約 (要旨)

- `https://connpass.com/term/` 第7.1.17項: **提供される API 以外の方法 (自動・手動問わず) でのクローリング・スクレイピングを禁止**。
- API ヘルプ規約 (`https://help.connpass.com/api/api-term`): 第三者への再販・データ共有は不可、利用者の個人情報取得には同意が必要、リバースエンジニアリング禁止、競合サービス提供禁止 など全20項目の禁止行為を列挙。
- アトリビューション (出典表示) の明示的義務は規約には記載なし。ただし出典として `connpass` を明記することが慣習。

## 8. 既知のエンドポイント一覧 (v2)

| メソッド | パス | 概要 | 詳細 |
| --- | --- | --- | --- |
| GET | `/api/v2/events/` | イベント検索 | [endpoint-event-search.md](./endpoint-event-search.md) |
| GET | `/api/v2/events/{id}/presentations/` | イベント資料一覧 | [endpoint-others.md](./endpoint-others.md) |
| GET | `/api/v2/groups/` | グループ検索 | [endpoint-groups.md](./endpoint-groups.md) |
| GET | `/api/v2/users/` | ユーザー検索 | [endpoint-users.md](./endpoint-users.md) |
| GET | `/api/v2/users/{nickname}/groups/` | ユーザー所属グループ | [endpoint-users.md](./endpoint-users.md) |
| GET | `/api/v2/users/{nickname}/attended_events/` | ユーザー参加イベント | [endpoint-users.md](./endpoint-users.md) |
| GET | `/api/v2/users/{nickname}/presenter_events/` | ユーザー発表イベント | [endpoint-users.md](./endpoint-users.md) |

公式 v2 API は **7 本のみ**。イベント参加・退会・コメント・お気に入り・通知などの「書き込み系」は公開されておらず、画面の AJAX/フォームから推測する内部 API になる ([internal-api-inferred.md](./internal-api-inferred.md))。

## 9. 模倣サービスでの認証・レート制限スキーマ案

自前で同種のサービスを実装する際の参考方針:

- 認証
  - 公開検索系 (read-only) には APIキー方式 + `Authorization: Bearer <token>` か `X-API-Key`
  - 書き込み系 (参加・コメント) はセッション + CSRF、もしくは OAuth2 トークン
- レート制限
  - 公開検索系: APIキー単位で `60 req/min` 程度 (connpass の 1 req/sec より緩い)
  - 書き込み系: ユーザー単位で別バケット (例: `30 req/min`)
  - レスポンスヘッダで `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` を返す (connpass は未提供)
- エラーフォーマット
  - 必ず JSON で `{ "error": { "code": "...", "message": "...", "details": {...} } }` を返し、HTML フォールバックを避ける
- ページング
  - `start` (オフセット) / `count` (件数) のスキーマは互換性が高いので踏襲
  - 加えて `next_cursor` も返すと大量データに強くなる
