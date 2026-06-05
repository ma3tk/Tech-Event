# その他のエンドポイント (v2)

イベント検索/ユーザー/グループ以外で公開されている API。
v2 公式は 7 本構成のうち、ここでは **イベント資料 (presentations)** が該当する。

## 1. イベント資料一覧 `GET /api/v2/events/{id}/presentations/`

OpenAPI operationId: `connpass_event_event_api_v2_views_event_presentation`

| 項目 | 内容 |
| --- | --- |
| フルURL | `https://connpass.com/api/v2/events/{id}/presentations/` |
| HTTPメソッド | `GET` |
| 認証 | `X-API-Key` 必須 |
| 旧 v1 パス | `/api/v1/event/{id}/presentation/` (単数形) |

### パスパラメータ

| パラメータ | 型 | 必須 | 例 | 説明 |
| --- | --- | --- | --- | --- |
| `id` | integer | ○ | `364` | イベントID |

### クエリパラメータ

| パラメータ | 型 | 既定値 | 制約 |
| --- | --- | --- | --- |
| `start` | integer | `1` | `≥1` |
| `count` | integer | `10` | `1〜100` |

### レスポンス `PresentationListResponseSchema`

```json
{
  "results_returned": 1,
  "results_available": 91,
  "results_start": 1,
  "presentations": [ /* PresentationSchema[] */ ]
}
```

### PresentationSchema

| フィールド | 型 | nullable | 例 | 説明 |
| --- | --- | --- | --- | --- |
| `user` | UserSummary | × | (オブジェクト) | 資料を **投稿した** ユーザー |
| `url` | string | × | `https://togetter.com/li/294875` | 資料の URL (外部サービス含む) |
| `name` | string | × | `Togetterまとめ` | 資料タイトル |
| `presenter` | UserSummary | ○ | (オブジェクト) | 資料を **発表した** ユーザー。投稿者と異なる場合あり (司会者代理投稿など) |
| `presentation_type` | string (enum) | × | `blog` | `slide` スライド / `movie` 動画 / `blog` ブログなど |
| `created_at` | string (ISO-8601) | × | `2012-04-29T19:44:03+09:00` | 投稿日時 |

すべて `required`。

### UserSummary

| フィールド | 型 | nullable | 例 |
| --- | --- | --- | --- |
| `id` | integer | × | `8` |
| `nickname` | string | × | `haru860` |

(投稿者・発表者の最低限の識別子のみ。`display_name` や `url` は含まれない。詳細は users API で別途取得する必要あり。)

### サンプル

```bash
curl -X GET "https://connpass.com/api/v2/events/364/presentations/?count=20" \
  -H "X-API-Key: <KEY>" \
  -H "User-Agent: my-app/1.0"
```

```json
{
  "results_returned": 1,
  "results_available": 1,
  "results_start": 1,
  "presentations": [
    {
      "user":      { "id": 8, "nickname": "haru860" },
      "url":       "https://togetter.com/li/294875",
      "name":      "Togetterまとめ",
      "presenter": { "id": 8, "nickname": "haru860" },
      "presentation_type": "blog",
      "created_at": "2012-04-29T19:44:03+09:00"
    }
  ]
}
```

### ステータスコード

| ステータス | 状況 |
| --- | --- |
| `200 OK` | 正常 (資料0件でも 200 + `presentations: []`) |
| `400 Bad Request` | クエリ型不正 |
| `401 Unauthorized` | APIキー不正 |
| `403 Forbidden` | User-Agent 未送信 |
| `404 Not Found` | `{id}` 該当イベントなし (推定) |
| `429 Too Many Requests` | スロットリング |

### 利用上の注意

- 資料の `url` は **外部サービス (Speaker Deck, SlideShare, Togetter, ブログなど) を指す** ケースが多く、ファイル直リンクとは限らない。
- `presentation_type` で `slide` / `movie` / `blog` の判別ができるが、`url` ドメインからも判定可能 (`speakerdeck.com` → slide, `youtube.com` → movie 等)。
- 投稿者と発表者を区別しているため、共催イベントや代理投稿のケースが扱える設計になっている。

## 2. 公開されているがドキュメント化されていないと推定されるもの

調査の結果、v2 で **追加で公開されている API は確認できない**。以下は対応するエンドポイントが存在しない:

| 想定機能 | API | 対応 |
| --- | --- | --- |
| イベント参加 | POST | **無し** (画面のフォーム経由のみ) |
| イベントキャンセル | POST/DELETE | **無し** |
| イベントブックマーク | POST/DELETE | **無し** |
| コメント取得 | GET | **無し** |
| 参加者リスト取得 | GET | **無し** (`accepted` の人数のみ) |
| 補欠者リスト取得 | GET | **無し** |
| 参加枠 (チケット種別) 取得 | GET | **無し** (`limit` の合計のみ) |
| イベント検索: フリーテキストでグループ検索 | GET | **無し** (グループは `subdomain` 完全一致のみ) |
| カレンダー (.ics) | GET | 非API (画面の `/event/{id}.ics` 直リンク) |

これらは画面側 (ログイン後のセッション) からしかアクセスできず、API 経由での操作は提供されていない。画面 URL から推測される非公開 API は [internal-api-inferred.md](./internal-api-inferred.md) を参照。

## 3. 模倣サービスでの presentations 関連設計案

### REST エンドポイント案

```
GET    /v1/events/{event_id}/presentations
POST   /v1/events/{event_id}/presentations               # 投稿 (要認証)
PATCH  /v1/events/{event_id}/presentations/{id}          # 編集
DELETE /v1/events/{event_id}/presentations/{id}
GET    /v1/users/{nickname}/presentations                # ユーザーの全資料 (connpassにはない)
```

### DB スキーマ (PostgreSQL)

```sql
CREATE TYPE presentation_type AS ENUM ('slide','movie','blog','document','code');

CREATE TABLE presentations (
  id                BIGSERIAL PRIMARY KEY,
  event_id          BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  posted_by_user_id BIGINT NOT NULL REFERENCES users(id),   -- 投稿者
  presenter_user_id BIGINT REFERENCES users(id),            -- 発表者 (null可)
  name              TEXT NOT NULL,
  url               TEXT NOT NULL,
  presentation_type presentation_type NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_presentations_event ON presentations(event_id, created_at DESC);
CREATE INDEX idx_presentations_presenter ON presentations(presenter_user_id);
```

improvements vs connpass:

- `presentation_type` に `document` / `code` (GitHub) を追加
- `og_image_url` / `embed_html` を保存して、UI でリッチプレビュー表示
- イベントから独立した `talks` (発表) エンティティを設けると、同一発表が複数イベントで使い回されるケース (出張プレゼンなど) に対応できる
