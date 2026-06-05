# イベント検索エンドポイント (v2)

connpass API v2 の中で最も中心となる、イベント検索エンドポイントの詳細。

## 1. 基本情報

| 項目 | 内容 |
| --- | --- |
| パス | `/api/v2/events/` |
| フルURL | `https://connpass.com/api/v2/events/` |
| HTTPメソッド | `GET` |
| 認証 | **必須** (`X-API-Key` ヘッダ) |
| OpenAPI `operationId` | `connpass_event_event_api_v2_views_event_search` |
| 旧 v1 パス | `/api/v1/event/` (※単数形) |

## 2. リクエストパラメータ

すべてクエリストリング。すべて任意 (`required: false`)。配列型は同じキー名を繰り返すか、カンマ区切りで指定する。

| パラメータ | 型 | 配列可 | 既定値 | 制約 | 説明 |
| --- | --- | --- | --- | --- | --- |
| `event_id` | integer | ○ | - | - | イベントID。`https://connpass.com/event/364/` の場合 `364` |
| `keyword` | string | ○ | - | - | タイトル/キャッチ/概要/住所に対する **AND** 部分一致 |
| `keyword_or` | string | ○ | - | - | タイトル/キャッチ/概要/住所に対する **OR** 部分一致 |
| `ym` | string | ○ | - | `yyyymm` 形式 | 開催年月 (例: `201204`) |
| `ymd` | string | ○ | - | `yyyymmdd` 形式 | 開催年月日 (例: `20120406`) |
| `publish_ym` | string | ○ | - | `yyyymm` 形式 | **公開**年月 (v2 で新規) |
| `publish_ymd` | string | ○ | - | `yyyymmdd` 形式 | **公開**年月日 (v2 で新規) |
| `nickname` | string | ○ | - | - | **参加者**のニックネーム |
| `owner_nickname` | string | ○ | - | - | **管理者**のニックネーム |
| `group_id` | integer | ○ | - | - | グループID (旧 `series_id`)。`https://connpass.com/series/1/` の場合 `1` |
| `subdomain` | string | ○ | - | - | グループのサブドメイン (例: `bpstudy`) |
| `prefecture` | enum string | ○ | - | 後述の都道府県スラグ | 開催都道府県。`online` も指定可 |
| `order` | integer | × | `1` | `1`/`2`/`3` | 並び順: `1`=更新順, `2`=開催順, `3`=新着順 |
| `start` | integer | × | `1` | `≥1` | 検索結果の開始位置 (1-origin) |
| `count` | integer | × | `10` | `1〜100` | 取得件数 |

### 都道府県スラグ (prefecture)

公式ドキュメントから網羅 (47都道府県 + `online`、計 48 値):

```
online,  hokkaido, aomori, iwate, miyagi, akita, yamagata, fukushima,
ibaraki, tochigi, gunma, saitama, chiba, tokyo, kanagawa,
yamanashi, nagano, niigata, toyama, ishikawa, fukui,
gifu, shizuoka, aichi, mie,
shiga, kyoto, osaka, hyogo, nara, wakayama,
tottori, shimane, okayama, hiroshima, yamaguchi,
tokushima, kagawa, ehime, kochi,
fukuoka, saga, nagasaki, kumamoto, oita, miyazaki, kagoshima, okinawa
```

### 配列指定の3形式 (OpenAPI に明記)

```
?event_id=364                # 単一
?event_id=364&event_id=365   # repeat
?event_id=364,365            # カンマ区切り
```

## 3. レスポンス (200 OK)

### ラッパスキーマ (`EventListResponseSchema`)

```json
{
  "results_returned": 1,
  "results_available": 91,
  "results_start": 1,
  "events": [ /* EventSchema[] */ ]
}
```

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `results_returned` | integer | 本レスポンスに含まれる件数 |
| `results_available` | integer | 検索条件にマッチする総件数 |
| `results_start` | integer | 開始位置 (1-origin) |
| `events` | EventSchema[] | イベント配列 |

### EventSchema

| フィールド | 型 | nullable | 例 | 説明 |
| --- | --- | --- | --- | --- |
| `id` | integer | × | `364` | イベントID |
| `title` | string | × | `BPStudy#56` | イベント名 |
| `catch` | string | ○ | `株式会社ビープラウドが主催するWeb系技術討論の会` | キャッチコピー |
| `description` | string | ○ | `今回は「Python プロフェッショナル...` | 概要 (HTML を含む) |
| `url` | string | × | `https://bpstudy.connpass.com/event/364/` | イベントURL |
| `image_url` | string | ○ | (URL) | イベント画像URL。**期限付きで失効する**ため外部直接参照不可 |
| `hash_tag` | string | ○ | `bpstudy` | X (旧Twitter) のハッシュタグ (先頭 `#` なし) |
| `started_at` | string (ISO-8601) | ○ | `2012-04-17T18:30:00+09:00` | 開催開始日時 |
| `ended_at` | string (ISO-8601) | ○ | `2012-04-17T20:30:00+09:00` | 開催終了日時 |
| `published_at` | string (ISO-8601) | ○ | `2012-04-01T10:00:00+09:00` | 公開日時 (v2 新規) |
| `limit` | integer | ○ | `80` | 定員 (null = 無制限) |
| `event_type` | string (enum) | × | `participation` | `participation`=参加受付あり / `advertisement`=告知のみ |
| `open_status` | string (enum) | × | `open` | `preopen` 開催前 / `open` 開催中 / `close` 終了 / `cancelled` 中止 (v2 新規) |
| `group` | GroupSummary | ○ | (オブジェクト) | グループ情報 (後述) |
| `address` | string | ○ | `東京都豊島区東池袋3-1-1` | 開催住所 |
| `place` | string | ○ | `BPオフィス (サンシャイン60 45階)` | 会場名 |
| `lat` | string | ○ | `35.729402000000` | 緯度 (文字列。正規表現 `^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$`) |
| `lon` | string | ○ | `139.718209000000` | 経度 (文字列) |
| `owner_id` | integer | ○ | `8` | 管理者ユーザーID |
| `owner_nickname` | string | × | `haru860` | 管理者のニックネーム |
| `owner_display_name` | string | × | `佐藤 治夫` | 管理者の表示名 |
| `accepted` | integer | × | `80` | 参加者数 |
| `waiting` | integer | × | `15` | 補欠者数 |
| `updated_at` | string (ISO-8601) | × | `2012-03-20T12:07:32+09:00` | 更新日時 |

`required` 配列により、`group` を含めて 24 フィールドすべてが必ず存在する (値は `null` の可能性あり)。

### GroupSummary (event 内の `group`)

| フィールド | 型 | nullable | 例 | 説明 |
| --- | --- | --- | --- | --- |
| `id` | integer | × | `1` | グループID |
| `subdomain` | string | ○ | `bpstudy` | サブドメイン |
| `title` | string | × | `BPStudy` | グループ名 |
| `url` | string | × | `https://bpstudy.connpass.com/` | グループURL |

## 4. リクエスト/レスポンス例

### リクエスト

```bash
curl -X GET "https://connpass.com/api/v2/events/?keyword=AI&prefecture=tokyo&prefecture=online&order=2&count=2" \
  -H "X-API-Key: <YOUR_API_KEY>" \
  -H "User-Agent: tech-event-research/1.0"
```

### レスポンス (公式 example を組み合わせた構造例)

```json
{
  "results_returned": 2,
  "results_available": 91,
  "results_start": 1,
  "events": [
    {
      "id": 364,
      "title": "BPStudy#56",
      "catch": "株式会社ビープラウドが主催するWeb系技術討論の会",
      "description": "今回は「Python プロフェッショナル プログラミング」執筆プロジェクトの継続的ビルドについて、お話しして頂きます。",
      "url": "https://bpstudy.connpass.com/event/364/",
      "image_url": "https://media.connpass.com/thumbs/.../364.png",
      "hash_tag": "bpstudy",
      "started_at": "2012-04-17T18:30:00+09:00",
      "ended_at": "2012-04-17T20:30:00+09:00",
      "published_at": "2012-04-01T10:00:00+09:00",
      "limit": 80,
      "event_type": "participation",
      "open_status": "close",
      "group": {
        "id": 1,
        "subdomain": "bpstudy",
        "title": "BPStudy",
        "url": "https://bpstudy.connpass.com/"
      },
      "address": "東京都豊島区東池袋3-1-1",
      "place": "BPオフィス (サンシャイン60 45階)",
      "lat": "35.729402000000",
      "lon": "139.718209000000",
      "owner_id": 8,
      "owner_nickname": "haru860",
      "owner_display_name": "佐藤 治夫",
      "accepted": 80,
      "waiting": 15,
      "updated_at": "2012-03-20T12:07:32+09:00"
    }
  ]
}
```

> 注: 上記値は公式 OpenAPI の `examples` を組み合わせたもの。本タスクの環境では API キー未取得のため `https://connpass.com/api/v2/events/?keyword=AI&count=2` への直接実行は `401 Unauthorized` となった。

## 5. ステータスコードとエラー

| ステータス | 状況 |
| --- | --- |
| `200 OK` | 正常 |
| `400 Bad Request` | パラメータ型/形式不正 (例: `ym=12-04`) |
| `401 Unauthorized` | `X-API-Key` 不正/未指定 |
| `403 Forbidden` | `User-Agent` 未送信 (CloudFront 段) |
| `429 Too Many Requests` | 1秒1リクエストを超過 |
| `5xx` | サーバ障害 |

## 6. 利用上の注意

- **`image_url` は短期署名URL** のような扱いで、定期的に失効する。CDN や外部HTMLから直接 `<img src>` 参照する用途は不可。**取得時にダウンロード→自前ストレージに保存**する必要がある。
- `description` は HTML を含む可能性がある。表示時はサニタイズ必須。
- `accepted` / `waiting` は API 取得時点のスナップショット。リアルタイム性が必要な場合は短いキャッシュTTL推奨だが、レート制限 1 req/sec を考慮する。
- `lat` / `lon` は **文字列**で返ってくる (浮動小数の精度を保つため)。比較・地理計算前に `parseFloat` する。
- 一覧APIにイベント詳細の全フィールド (登壇者リスト、補欠リスト、参加枠ごとの定員、料金など) は含まれない。詳細は **公開 API には存在しない**。詳細データが必要な場合は資料一覧 API か、イベントページの HTML スクレイピング (規約違反) しか手段がない。
- 配列パラメータ間は **AND** (例: `prefecture=tokyo&prefecture=osaka` は tokyo OR osaka)。`keyword` だけが特殊で、**`keyword` 同士は AND、`keyword_or` 同士は OR**。

## 7. v1 との差分 (イベント検索)

| 項目 | v1 | v2 |
| --- | --- | --- |
| パス | `/api/v1/event/` | `/api/v2/events/` |
| クエリ `format=json` | 必要 | 不要 |
| グループ指定 | `series_id` | `group_id` |
| 公開日検索 | なし | `publish_ym`, `publish_ymd` |
| レスポンス: イベントID | `event_id` | `id` |
| レスポンス: URL | `event_url` | `url` |
| レスポンス: グループ | `series` | `group` |
| レスポンス: 公開日 | なし | `published_at` |
| レスポンス: 開催状態 | なし | `open_status` |

## 8. 模倣サービスでの DB / API スキーマ案

### REST エンドポイント案

```
GET /v1/events
  ?q=<keyword>                    # 全文 (and)
  ?q_or=<keyword>                 # 全文 (or)
  ?date=<YYYYMMDD>                # 開催日 (複数可)
  ?month=<YYYYMM>                 # 開催月 (複数可)
  ?prefecture=<slug>              # 都道府県 (複数可)
  ?group_id=<int>                 # 主催グループ
  ?organizer=<nickname>           # 主催者
  ?attendee=<nickname>            # 参加者
  ?status=preopen|open|close|cancelled
  ?order=updated|started|created
  ?offset=<int>                   # 0-origin (start=1 と等価にする場合は変換)
  ?limit=<int>                    # 1..100
```

### DB スキーマ (PostgreSQL 想定)

```sql
CREATE TABLE events (
  id              BIGSERIAL PRIMARY KEY,
  group_id        BIGINT REFERENCES groups(id),
  owner_user_id   BIGINT REFERENCES users(id),
  title           TEXT NOT NULL,
  catch           TEXT,
  description     TEXT,                 -- HTML
  url             TEXT NOT NULL,        -- canonical
  image_url       TEXT,                 -- 短期URLなら別途 image_object_key を保存
  hash_tag        TEXT,
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  published_at    TIMESTAMPTZ,
  capacity        INTEGER,              -- limit
  event_type      TEXT NOT NULL,        -- ENUM('participation','advertisement')
  open_status     TEXT NOT NULL,        -- ENUM('preopen','open','close','cancelled')
  address         TEXT,
  place           TEXT,
  lat             NUMERIC(10, 7),
  lon             NUMERIC(10, 7),
  prefecture_slug TEXT,                 -- 'tokyo' など
  accepted_count  INTEGER NOT NULL DEFAULT 0,
  waiting_count   INTEGER NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_started_at ON events(started_at DESC);
CREATE INDEX idx_events_prefecture_started ON events(prefecture_slug, started_at);
CREATE INDEX idx_events_group ON events(group_id);
CREATE INDEX idx_events_fts ON events USING GIN (
  to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(catch,'') || ' ' || coalesce(description,''))
);
```

connpass にない改善案:

- `lat/lon` を NUMERIC で保持し PostGIS で半径検索を追加
- `tags` テーブルを別途用意し、ハッシュタグ以外の自動付与タグも検索可能に
- `capacity_per_ticket` (枠ごとの定員) を別テーブルで持つ
