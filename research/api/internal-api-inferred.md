# 内部API (画面から推測)

公開 API ([public-api-overview.md](./public-api-overview.md)) には含まれないが、connpass の画面遷移・フォーム・JavaScript から逆推測される **内部 API / 非公開エンドポイント** をまとめる。

これらは **公式仕様ではなく**、画面操作・HTML / フォームの `action` 属性・参考実装の挙動から推測した内容である。

調査方法:

- HTML レスポンスの `<form action="...">` 抽出
- ヘルプドキュメントの操作フロー記述 (`https://help.connpass.com/participants/event-join` 等)
- 旧公開資料・ブログ記事
- 画面URL パターン

> **重要**: これらの URL を自動操作することは、`https://connpass.com/term/` 第7.1.17項により禁止される「提供されるAPI以外の方法によるアクセス」に該当する可能性がある。自前の互換サービスを設計する際の参考としてのみ使うこと。

## 1. 認証 / セッション

| 操作 | 推定エンドポイント | メソッド | 備考 |
| --- | --- | --- | --- |
| ログイン画面 | `/login/` | `GET` | `?next=<URL>` で遷移先指定 (HTMLで確認済) |
| ログイン送信 | `/login/` | `POST` | フォーム送信。CSRFトークン付与。`<form action="https://connpass.com/login/" method="GET">` を実装上は POST に切替 |
| ログアウト | `/logout/` | `GET` または `POST` | |
| SNS連携 (X / GitHub / Facebook) | `/accounts/<provider>/login/` | `GET` | django-allauth 慣例 |

セッション管理: Cookie ベース (`csrftoken`, `sessionid`)。CSRF は POST 時に `X-CSRFToken` ヘッダ or `csrfmiddlewaretoken` form field が必要 (Django 標準パターン)。

## 2. イベント参加 / キャンセル

ヘルプドキュメント (`https://help.connpass.com/participants/event-join`) によると、画面上は「このイベントに申し込む」「キャンセルする」というボタンで完結。実装は連動して以下のような POST を行うと推測される。

| 操作 | 推定エンドポイント | メソッド | 推定リクエストボディ |
| --- | --- | --- | --- |
| 申し込み画面表示 | `/event/{event_id}/join/` | `GET` | (参加枠の選択UI) |
| 申し込み送信 | `/event/{event_id}/join/` | `POST` | `ticket_id=<参加枠ID>`, `comment=...`, `csrfmiddlewaretoken=...` |
| キャンセル | `/event/{event_id}/cancel/` | `POST` | `csrfmiddlewaretoken=...` |
| 参加情報 (照会) | `/event/{event_id}/participation/` | `GET` | 画面確認済 (HTMLで `/event/{id}/participation/` 存在) |

参加枠 (チケット) の選択は画面ヘルプに「複数バケットから1つだけ選択可」と明記されている。

## 3. ブックマーク (お気に入り)

イベント詳細画面に「ブックマーク」UI がある (`UserSchema.bookmark_event_count` の存在から)。

| 操作 | 推定エンドポイント | メソッド | 備考 |
| --- | --- | --- | --- |
| ブックマーク追加 | `/event/{event_id}/bookmark/` | `POST` | XHR、CSRFトークン必須 |
| ブックマーク削除 | `/event/{event_id}/bookmark/` | `DELETE` または `POST` (action=delete) | 同上 |
| ブックマーク一覧 | `/bookmark/` or `/user/{nickname}/bookmark/` | `GET` | 画面 |

## 4. コメント

イベント画面下部にコメント欄あり (旧画面構成より)。

| 操作 | 推定エンドポイント | メソッド | 備考 |
| --- | --- | --- | --- |
| コメント取得 | `/event/{event_id}/comment/` | `GET` | JSON または HTML フラグメント |
| コメント投稿 | `/event/{event_id}/comment/` | `POST` | `body=...`, `csrfmiddlewaretoken=...` |
| コメント削除 | `/event/{event_id}/comment/{id}/delete/` | `POST` | |

## 5. 検索画面 (HTMLレンダリング)

HTML パースで確認済:

```
GET /search/?q=<keyword>&prefectures=<slug>&start_from=<YYYY/MM/DD>&start_to=<YYYY/MM/DD>&keywords=<...>&sort=<...>&allow_conflict_join=<bool>
```

| パラメータ | 説明 |
| --- | --- |
| `q` | フリーテキスト (公開API の `keyword` 相当) |
| `prefectures` | 都道府県 (公開API と同じ slug) |
| `start_from` | 開始日 (YYYY/MM/DD) |
| `start_to` | 終了日 (YYYY/MM/DD) |
| `keywords` | 追加キーワード (内部 form) |
| `sort` | 並び替え |
| `allow_conflict_join` | 既存予定と被る日も含めるか (公開APIにない機能) |
| `title` | (form field 確認) |
| `description` | (form field 確認) |

→ 内部の検索エンジン (Elasticsearch 等) を直接叩いていると推測。これが公開API化されると、`start_from` / `start_to` の日付範囲指定が可能になり、`ymd`/`ym` の月単位制約を超えられる。

## 6. グループ参加 / 退会

`/event/364/` の HTML に「メンバーになる」ボタン (`<button id="ParticipateButton">`) を確認。

| 操作 | 推定エンドポイント | メソッド | 備考 |
| --- | --- | --- | --- |
| グループ加入 | `/series/{group_id}/member/join/` or `/{subdomain}.connpass.com/member/join/` | `POST` | |
| グループ退会 | `/series/{group_id}/member/leave/` | `POST` | |
| グループメンバー一覧 | `/series/{group_id}/member/` | `GET` | |

## 7. 通知 (個人ダッシュボード)

| 操作 | 推定エンドポイント | メソッド |
| --- | --- | --- |
| 通知一覧 | `/notification/` | `GET` |
| 既読化 | `/notification/{id}/read/` | `POST` |

## 8. カレンダー (.ics)

公開ドキュメントなしだが画面で公開URL確認済 (推測ではなく **確認済**):

```
GET https://connpass.com/event/{event_id}.ics
```

認証不要。iCalendar 形式のテキスト。本タスクの範囲では公開APIに含めなかったが、外部からのカレンダー連携で広く使われている。

## 9. RSS / Atom

慣例上 (django 系サイトの典型):

```
GET https://connpass.com/explore/                              # トップ
GET https://{subdomain}.connpass.com/feed/                     # グループのRSS
GET https://{subdomain}.connpass.com/rss/                      # 同上 (別形式)
```

要確認だが、connpass の各グループページの `<head>` に `<link rel="alternate" type="application/rss+xml" ...>` が含まれていれば存在。

## 10. オートコンプリート / サジェスト

検索フォームに JS 連動のサジェストがある場合の典型URL:

| 用途 | 推定 |
| --- | --- |
| キーワードサジェスト | `/api/internal/suggest/?q=<prefix>` |
| 場所サジェスト | `/api/internal/places/?q=<prefix>` |

(コードベース調査ができないため確証なし)

## 11. 内部APIをモデル化する場合のスキーマ案

自前で同等機能を REST/RPC で公開する想定:

```
# 認証 (Cookie + CSRF or Bearer)
POST   /v1/sessions                      # ログイン
DELETE /v1/sessions                      # ログアウト

# 参加
POST   /v1/events/{id}/attendances       body: {ticket_id, comment, agree_terms:true}
DELETE /v1/events/{id}/attendances/me
GET    /v1/events/{id}/attendances?role=accepted|waiting|cancelled&offset=&limit=

# ブックマーク
PUT    /v1/events/{id}/bookmark          # idempotent
DELETE /v1/events/{id}/bookmark

# コメント
GET    /v1/events/{id}/comments?offset=&limit=
POST   /v1/events/{id}/comments          body: {body, parent_id?}
DELETE /v1/events/{id}/comments/{cid}

# 通知
GET    /v1/me/notifications?cursor=
POST   /v1/me/notifications/{id}/read
POST   /v1/me/notifications/read-all

# 検索 (拡張)
GET    /v1/events/search?q=&from=&to=&prefecture=&tags=&allow_conflict=&radius_km=&center_lat=&center_lon=&sort=
```

### 認可ポリシー (例)

| アクション | 必要権限 |
| --- | --- |
| イベント参加 | ログイン済 + メール確認済 |
| コメント投稿 | ログイン済 |
| コメント削除 | 投稿本人 or イベント主催者 or 管理者 |
| 主催者向け参加者管理 | グループ管理者 or イベントオーナー |

### DBスキーマ追補 (前述 events / users / groups に追加)

```sql
CREATE TABLE event_tickets (           -- 参加枠
  id           BIGSERIAL PRIMARY KEY,
  event_id     BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,         -- 'スピーカー', '一般', '懇親会のみ' 等
  capacity     INTEGER,               -- null = 無制限
  price_yen    INTEGER NOT NULL DEFAULT 0,
  position     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE event_bookmarks (
  event_id   BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

CREATE TABLE event_comments (
  id         BIGSERIAL PRIMARY KEY,
  event_id   BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    BIGINT NOT NULL REFERENCES users(id),
  parent_id  BIGINT REFERENCES event_comments(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE notifications (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL,            -- ENUM('event_remind','event_update','comment_reply'...)
  payload     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at     TIMESTAMPTZ
);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE read_at IS NULL;
```

## 12. 留意点

- connpass は **書き込み API を完全に非公開**としており、これは **意図的な設計** (スパム・代理参加抑止、ボット排除) と考えられる。
- 模倣サービスでこれらを公開する場合は、**ユーザー単位のレート制限、reCAPTCHA、メール確認、二要素認証** を組み合わせること。
- 「他者のニックネームでログインせず参加する」用途を遮断するため、参加 API は必ずセッションのユーザーで実行 (パスから `user_id` を受け取らない設計)。
