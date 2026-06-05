# ユーザー関連エンドポイント (v2)

connpass API v2 でユーザーに関わる 4 つのエンドポイントを扱う。

| エンドポイント | パス | 概要 |
| --- | --- | --- |
| ユーザー検索 | `GET /api/v2/users/` | ニックネーム指定でユーザー情報取得 |
| 所属グループ | `GET /api/v2/users/{nickname}/groups/` | ユーザーが所属するグループ一覧 |
| 参加イベント | `GET /api/v2/users/{nickname}/attended_events/` | ユーザーが参加したイベント一覧 |
| 発表イベント | `GET /api/v2/users/{nickname}/presenter_events/` | ユーザーが発表したイベント一覧 |

すべて `GET`、すべて `X-API-Key` 必須、レスポンスは `application/json`。

## 1. ユーザー検索 `GET /api/v2/users/`

OpenAPI operationId: `connpass_account_account_api_v2_views_user_search`

### リクエストパラメータ

| パラメータ | 型 | 配列可 | 既定値 | 制約 | 説明 |
| --- | --- | --- | --- | --- | --- |
| `nickname` | string | ○ (最大100件) | - | - | ニックネーム。例: `haru860` または `haru860,ian` |
| `start` | integer | × | `1` | `≥1` | 開始位置 |
| `count` | integer | × | `10` | `1〜100` | 取得件数 |

### レスポンス (`UserListResponseSchema`)

```json
{
  "results_returned": 1,
  "results_available": 91,
  "results_start": 1,
  "users": [ /* UserSchema[] */ ]
}
```

### UserSchema

| フィールド | 型 | nullable | 例 | 説明 |
| --- | --- | --- | --- | --- |
| `id` | integer | × | `8` | ユーザーID |
| `nickname` | string | × | `haru860` | ニックネーム (ユーザー固有のスラグ) |
| `display_name` | string | × | `佐藤 治夫` | 表示名 |
| `description` | string | × | `株式会社ビープラウド代表取締役。...` | 自己紹介文 (改行/URL含む) |
| `url` | string | × | `https://connpass.com/user/haru860/` | プロフィールURL |
| `image_url` | string | ○ | (URL) | サムネイル画像URL。**期限付きで失効** |
| `created_at` | string (ISO-8601) | × | `2011-10-20T18:23:03+09:00` | 利用開始日時 |
| `attended_event_count` | integer | × | `261` | 参加イベント数 |
| `organize_event_count` | integer | × | `231` | 管理 (主催) イベント数 |
| `presenter_event_count` | integer | × | `34` | 発表イベント数 |
| `bookmark_event_count` | integer | × | `57` | ブックマーク (お気に入り) イベント数 |

すべて `required`。

### サンプル

```bash
curl -X GET "https://connpass.com/api/v2/users/?nickname=haru860&nickname=ian" \
  -H "X-API-Key: <KEY>" \
  -H "User-Agent: my-app/1.0"
```

## 2. 所属グループ `GET /api/v2/users/{nickname}/groups/`

OpenAPI operationId: `connpass_account_account_api_v2_views_user_group`

### パスパラメータ

| パラメータ | 型 | 必須 | 例 |
| --- | --- | --- | --- |
| `nickname` | string | ○ | `haru860` |

### クエリパラメータ

| パラメータ | 型 | 既定値 | 制約 |
| --- | --- | --- | --- |
| `start` | integer | `1` | `≥1` |
| `count` | integer | `10` | `1〜100` |

### レスポンス

```json
{
  "results_returned": 1,
  "results_available": 5,
  "results_start": 1,
  "groups": [ /* GroupSchema[] - groups エンドポイントと同一 */ ]
}
```

`GroupSchema` の詳細は [endpoint-groups.md](./endpoint-groups.md) を参照。

## 3. 参加イベント `GET /api/v2/users/{nickname}/attended_events/`

OpenAPI operationId: `connpass_account_account_api_v2_views_user_attended_event`

### パスパラメータ・クエリパラメータ

「所属グループ」と同じ (`nickname` パス必須、`start`/`count` クエリ任意)。

### レスポンス

```json
{
  "results_returned": 1,
  "results_available": 261,
  "results_start": 1,
  "events": [ /* EventSchema[] - イベント検索と同一 */ ]
}
```

`EventSchema` の詳細は [endpoint-event-search.md](./endpoint-event-search.md) 参照。

並び順は API 側固定で、ドキュメントには明記されていないが、慣例的に「参加日時の新しい順」になる。`order` パラメータは指定不可。

## 4. 発表イベント `GET /api/v2/users/{nickname}/presenter_events/`

OpenAPI operationId: `connpass_account_account_api_v2_views_user_presenter_event`

「参加イベント」と全く同じスキーマ。違いは、対象ユーザーがそのイベントで **発表者として登録された** イベントのみ返ること。連動して `events[].open_status` などのフィルタはないので、過去/予定混在で返る。

## 5. ステータスコード

すべてのユーザー系で共通:

| ステータス | 状況 |
| --- | --- |
| `200 OK` | 正常 (ヒット0件でも 200 + `events: []`) |
| `400 Bad Request` | クエリ型不正 |
| `401 Unauthorized` | APIキー不正 |
| `403 Forbidden` | `User-Agent` 未送信 |
| `404 Not Found` | `{nickname}` 該当ユーザーなし (推定。OpenAPI 明記なし) |
| `429 Too Many Requests` | スロットリング |

## 6. 利用上の注意

- 公開 API では **メールアドレス・本名・住所などの個人情報は一切返らない**。`display_name` はユーザーが自主公開した名前のみ。
- `attended_event_count` などのカウンタは **bookmark を含むカウンタ系がプライバシー設定により実値より少ない** ことがある (本人が公開設定にしていないものは除外される)。
- ユーザー検索の `nickname` パラメータは **部分一致ではなく完全一致** (`exact match`)。検索用途というより「複数ニックネームの一括取得」が主目的。
- 旧 v1 では `user_id` / `user_url` / `user_image_url` だったフィールドが、v2 で `id` / `url` / `image_url` に統一された。
- `image_url` は v2 でも短期失効。クライアント側で再取得 or プロキシ経由のキャッシュが必要。

## 7. v1 との差分

| 項目 | v1 | v2 |
| --- | --- | --- |
| ユーザー一覧 パス | `/api/v1/user/` | `/api/v2/users/` |
| 所属グループ パス | `/api/v1/user/{nickname}/group/` | `/api/v2/users/{nickname}/groups/` |
| 参加イベント パス | `/api/v1/user/{nickname}/attended_event/` | `/api/v2/users/{nickname}/attended_events/` |
| 発表イベント パス | `/api/v1/user/{nickname}/presenter_event/` | `/api/v2/users/{nickname}/presenter_events/` |
| フィールド ID | `user_id` | `id` |
| フィールド URL | `user_url` | `url` |
| フィールド 画像 | `user_image_url` | `image_url` |

## 8. 模倣サービスでの DB / API スキーマ案

### REST エンドポイント案

```
GET /v1/users/{nickname}
GET /v1/users/{nickname}/groups?offset=&limit=
GET /v1/users/{nickname}/events?relation=attended|presenter|organized&offset=&limit=
GET /v1/users?nickname=a,b,c
GET /v1/users/search?q=<keyword>      # connpassにはない、追加機能
```

### DB スキーマ (PostgreSQL)

```sql
CREATE TABLE users (
  id                       BIGSERIAL PRIMARY KEY,
  nickname                 CITEXT UNIQUE NOT NULL,   -- 大文字小文字無視
  display_name             TEXT NOT NULL,
  description              TEXT NOT NULL DEFAULT '',
  image_url                TEXT,
  image_object_key         TEXT,                     -- 自前保存用
  email                    CITEXT UNIQUE,            -- 公開はしない
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- counters (cron で集計)
  attended_event_count     INTEGER NOT NULL DEFAULT 0,
  organize_event_count     INTEGER NOT NULL DEFAULT 0,
  presenter_event_count    INTEGER NOT NULL DEFAULT 0,
  bookmark_event_count     INTEGER NOT NULL DEFAULT 0,
  -- privacy
  is_bookmark_public       BOOLEAN NOT NULL DEFAULT FALSE
);

-- 関連
CREATE TABLE event_attendances (
  event_id  BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL,                       -- ENUM('attendee','waiting','presenter','organizer')
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id, role)
);

CREATE INDEX idx_attend_user_role_joined ON event_attendances(user_id, role, joined_at DESC);
```

連動ジョブで `users.*_count` を更新するか、ビューで集計する。リアルタイム性が必要なら `event_attendances` のトリガでカウンタを差分更新。
