# グループ関連エンドポイント (v2)

connpass の「グループ」(旧称: シリーズ) を扱うエンドポイント。

## 1. 基本情報

| 項目 | 内容 |
| --- | --- |
| パス | `/api/v2/groups/` |
| HTTPメソッド | `GET` |
| 認証 | `X-API-Key` 必須 |
| OpenAPI operationId | `connpass_group_group_api_v2_views_group_search` |
| 旧 v1 パス | `/api/v1/group/` |

ユーザー所属グループ取得 (`/api/v2/users/{nickname}/groups/`) も同じ `GroupSchema` を返す ([endpoint-users.md](./endpoint-users.md) 参照)。

## 2. リクエストパラメータ

| パラメータ | 型 | 配列可 | 既定値 | 制約 | 説明 |
| --- | --- | --- | --- | --- | --- |
| `subdomain` | string | ○ (最大100件) | - | - | サブドメイン (例: `bpstudy`, `beproud`)。`https://bpstudy.connpass.com/` の場合 `bpstudy` |
| `start` | integer | × | `1` | `≥1` | 検索開始位置 |
| `count` | integer | × | `10` | `1〜100` | 取得件数 |

> 公式 API では **グループID指定 (`id` / `group_id`) や、グループ名フリーテキスト検索は提供されていない**。サブドメインを事前に知っている場合のみ取得可能。

配列指定の3形式は他エンドポイントと同じ:

```
?subdomain=bpstudy
?subdomain=bpstudy&subdomain=beproud
?subdomain=bpstudy,beproud
```

## 3. レスポンス (200 OK)

### ラッパスキーマ `GroupListResponseSchema`

```json
{
  "results_returned": 1,
  "results_available": 91,
  "results_start": 1,
  "groups": [ /* GroupSchema[] */ ]
}
```

### GroupSchema

| フィールド | 型 | nullable | 例 | 説明 |
| --- | --- | --- | --- | --- |
| `id` | integer | × | `1` | グループID |
| `subdomain` | string | ○ | `bpstudy` | サブドメイン |
| `title` | string | × | `BPStudy` | グループ名 |
| `sub_title` | string | ○ | `株式会社ビープラウドが主催するIT勉強会` | サブタイトル |
| `url` | string | × | `https://bpstudy.connpass.com/` | グループURL |
| `description` | string | ○ | (HTML/テキスト) | 概要 |
| `owner_text` | string | ○ | `株式会社ビープラウド` | 主催者の表示テキスト |
| `image_url` | string | ○ | (URL) | グループ画像URL。**期限付きで失効** |
| `website_url` | string | ○ | `http://www.beproud.jp/` | 公式サイトURL |
| `website_name` | string | ○ | `株式会社ビープラウド` | 公式サイト表示名 |
| `twitter_username` | string | ○ | `bpstudy` | X (旧Twitter) アカウント名 (`@` なし) |
| `facebook_url` | string | ○ | `https://www.facebook.com/beproud.inc` | FacebookページURL |
| `member_users_count` | integer | × | `5743` | グループメンバー数 |

すべて `required` (`null` 可能なものは型に明示)。

## 4. リクエスト/レスポンス例

### リクエスト

```bash
curl -X GET "https://connpass.com/api/v2/groups/?subdomain=bpstudy,beproud" \
  -H "X-API-Key: <KEY>" \
  -H "User-Agent: my-app/1.0"
```

### レスポンス

```json
{
  "results_returned": 2,
  "results_available": 2,
  "results_start": 1,
  "groups": [
    {
      "id": 1,
      "subdomain": "bpstudy",
      "title": "BPStudy",
      "sub_title": "株式会社ビープラウドが主催するIT勉強会",
      "url": "https://bpstudy.connpass.com/",
      "description": "Web開発技術に関する月例勉強会です。",
      "owner_text": "株式会社ビープラウド",
      "image_url": "https://media.connpass.com/thumbs/.../bpstudy.png",
      "website_url": "http://www.beproud.jp/",
      "website_name": "株式会社ビープラウド",
      "twitter_username": "bpstudy",
      "facebook_url": "https://www.facebook.com/beproud.inc",
      "member_users_count": 5743
    }
  ]
}
```

## 5. ステータスコード

| ステータス | 状況 |
| --- | --- |
| `200 OK` | 正常 (該当なしでも 200 + `groups: []`) |
| `400 Bad Request` | クエリ型不正 |
| `401 Unauthorized` | APIキー不正 |
| `403 Forbidden` | User-Agent 未送信 |
| `429 Too Many Requests` | スロットリング |

## 6. 利用上の注意

- 「グループ」は connpass 上で「シリーズ」と呼ばれていた旧名残があり、内部URLが `/series/{id}/` 形式の場合もある。`group_id` と `series_id` は同一の数値。
- **グループ単位の一覧 (全グループの取得) はできない**。`subdomain` を知らない限り存在を発見できない。これは connpass の意図的な仕様 (スパム的なクローリング防止)。
  - イベント検索 API のレスポンスに含まれる `event.group` から `subdomain` を取得 → groups API で詳細取得、という間接ルートを取る。
- `image_url` は短期失効。ユーザー画像と同じ取り扱い。
- `member_users_count` は概数。リアルタイム反映ではなく、connpass 側のバッチで更新される (詳細時刻は未公開)。
- `description` は HTML を含む可能性があるためサニタイズ必須。
- イベント検索 API レスポンスの `event.group` は `GroupSummarySchema` (4フィールドのみ) で、`GroupSchema` (13フィールド) より少ない。詳細が必要なら別途 groups API を叩く。

## 7. v1 との差分

| 項目 | v1 | v2 |
| --- | --- | --- |
| パス | `/api/v1/group/` | `/api/v2/groups/` |
| `series_id` 検索 | 別エンドポイント | イベント検索の `group_id` に統合 |
| フィールド名 | v2 と同じ | 変更なし (グループスキーマは概ね同一) |

## 8. 模倣サービスでの DB / API スキーマ案

### REST エンドポイント案

```
GET  /v1/groups                            # 全件 (sort=member_count|created_at)
GET  /v1/groups/{id}
GET  /v1/groups/by-subdomain/{subdomain}
GET  /v1/groups/{id}/events?status=upcoming|past&offset=&limit=
GET  /v1/groups/{id}/members?offset=&limit=    # 公開のみ
GET  /v1/groups/search?q=<keyword>             # 名前/概要のフリーテキスト検索 (connpassにはない)
POST /v1/groups/{id}/members                   # 参加 (要認証)
DELETE /v1/groups/{id}/members/me              # 退会 (要認証)
```

### DB スキーマ (PostgreSQL)

```sql
CREATE TABLE groups (
  id                  BIGSERIAL PRIMARY KEY,
  subdomain           CITEXT UNIQUE NOT NULL,
  title               TEXT NOT NULL,
  sub_title           TEXT,
  url                 TEXT NOT NULL,
  description         TEXT,                    -- HTML
  owner_text          TEXT,
  owner_user_id       BIGINT REFERENCES users(id),  -- 紐づくなら
  image_url           TEXT,
  image_object_key    TEXT,
  website_url         TEXT,
  website_name        TEXT,
  twitter_username    TEXT,
  facebook_url        TEXT,
  member_users_count  INTEGER NOT NULL DEFAULT 0,    -- マテリアライズドカウンタ
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE group_memberships (
  group_id   BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  role       TEXT NOT NULL DEFAULT 'member',       -- ENUM('member','admin','owner')
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX idx_group_memberships_user ON group_memberships(user_id);
CREATE INDEX idx_groups_fts ON groups USING GIN (
  to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(sub_title,'') || ' ' || coalesce(description,''))
);
```

improvements:

- `tags` テーブルで興味カテゴリ (`AI`, `Web`, `モバイル`...) を付与し、グループ検索を強化
- `region` / `prefecture` を保持して地域別グループ検索を追加 (connpass にはない)
