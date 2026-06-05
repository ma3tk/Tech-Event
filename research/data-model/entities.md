# connpass 主要エンティティ定義

本ドキュメントは connpass.com を観察し、ヘルプセンター・公開 API レスポンス・トップページ／グループページ／イベント詳細ページ／FAQ のフィールドから抽出した主要エンティティを整理したものである。フィールドの命名は connpass の API v2 レスポンス（`event_id`, `owner_nickname`, `accepted`, `waiting` 等）に準拠しつつ、内部データモデルとしての推定を加えてある。

各エンティティは PostgreSQL を想定した型表記とし、`PK` は主キー、`FK` は外部キー、`UQ` は一意制約、`IDX` は推奨インデックスを示す。

---

## 1. User (ユーザー)

connpass のすべての行動主体。X / Facebook / GitHub の OAuth 連携で登録可能、メールアドレスのみでも登録可能。退会後は「退会ユーザー」として表示される（=論理削除）。

| フィールド | 型 | NULL | デフォルト | 制約 | 説明 |
|---|---|---|---|---|---|
| id | BIGSERIAL | NO | auto | PK | 内部 ID |
| nickname | VARCHAR(64) | NO | - | UQ, IDX | URL に使われる識別子。`/user/{nickname}/` |
| display_name | VARCHAR(80) | NO | - | - | 画面表示名 |
| email | VARCHAR(255) | NO | - | UQ | 必須・通知用 |
| email_verified_at | TIMESTAMPTZ | YES | NULL | - | メール確認完了日時 |
| password_hash | VARCHAR(255) | YES | NULL | - | SNS 認証のみのユーザーは NULL |
| avatar_url | VARCHAR(500) | YES | NULL | - | プロフィール画像 |
| bio | TEXT | YES | NULL | - | 自己紹介 |
| affiliation | VARCHAR(120) | YES | NULL | - | 所属組織 |
| location | VARCHAR(120) | YES | NULL | - | 居住地 |
| website_url | VARCHAR(500) | YES | NULL | - | 個人サイト |
| x_account | VARCHAR(64) | YES | NULL | - | X (旧 Twitter) アカウント |
| facebook_account | VARCHAR(64) | YES | NULL | - | Facebook アカウント |
| github_account | VARCHAR(64) | YES | NULL | - | GitHub アカウント |
| receive_notification_email | BOOLEAN | NO | TRUE | - | メール通知 ON/OFF |
| receive_reminder_email | BOOLEAN | NO | TRUE | - | 開催前日リマインダー |
| receive_recommendation_email | BOOLEAN | NO | TRUE | - | レコメンドメール |
| status | VARCHAR(20) | NO | 'active' | CHECK | active / suspended / withdrawn |
| withdrawn_at | TIMESTAMPTZ | YES | NULL | - | 退会日時（退会ユーザー表示用） |
| last_login_at | TIMESTAMPTZ | YES | NULL | - | 最終ログイン |
| created_at | TIMESTAMPTZ | NO | NOW() | - | 登録日時 |
| updated_at | TIMESTAMPTZ | NO | NOW() | - | 更新日時 |

関連:
- 1:N で `GroupMember`、`EventOwner`、`EventManager`、`Participant`、`Comment`、`PresentationMaterial`、`OAuthIdentity`、`Notification` を所有する。

---

## 2. OAuthIdentity (外部 SNS 連携)

ユーザーひとりに対し複数の SNS アイデンティティを紐付けるサブテーブル。

| フィールド | 型 | NULL | 制約 | 説明 |
|---|---|---|---|---|
| id | BIGSERIAL | NO | PK | - |
| user_id | BIGINT | NO | FK→User.id | - |
| provider | VARCHAR(20) | NO | CHECK in (twitter,facebook,github) | プロバイダ種別 |
| provider_uid | VARCHAR(120) | NO | UQ(provider, provider_uid) | プロバイダ側 ID |
| access_token | TEXT | YES | - | 暗号化保管 |
| refresh_token | TEXT | YES | - | 暗号化保管 |
| connected_at | TIMESTAMPTZ | NO | - | 連携日時 |

---

## 3. Group (グループ / series)

イベントを束ねるコミュニティ。サブドメイン形式 `{subdomain}.connpass.com` で公開される。connpass は「オープンコミュニティ」思想のため非公開設定を持たない。

| フィールド | 型 | NULL | デフォルト | 制約 | 説明 |
|---|---|---|---|---|---|
| id | BIGSERIAL | NO | auto | PK | - |
| subdomain | VARCHAR(63) | NO | - | UQ, IDX | サブドメイン。後から変更不可（運営に申請） |
| name | VARCHAR(120) | NO | - | - | グループ名 |
| subtitle | VARCHAR(255) | YES | NULL | - | サブタイトル |
| organization | VARCHAR(120) | YES | NULL | - | 主催組織名 |
| description | TEXT | YES | NULL | - | Markdown 対応 |
| cover_image_url | VARCHAR(500) | YES | NULL | - | カバー画像 |
| thumbnail_url | VARCHAR(500) | YES | NULL | - | アイコン |
| background_color | VARCHAR(7) | YES | NULL | - | ブランドカラー (#RRGGBB) |
| website_url | VARCHAR(500) | YES | NULL | - | 公式サイト |
| x_account | VARCHAR(64) | YES | NULL | - | - |
| facebook_url | VARCHAR(500) | YES | NULL | - | - |
| member_count | INTEGER | NO | 0 | - | キャッシュ集計 |
| event_count | INTEGER | NO | 0 | - | キャッシュ集計 |
| presentation_count | INTEGER | NO | 0 | - | キャッシュ集計 |
| status | VARCHAR(20) | NO | 'active' | CHECK | active / archived |
| published_at | TIMESTAMPTZ | NO | NOW() | - | 公開日 (UI に表示) |
| created_at | TIMESTAMPTZ | NO | NOW() | - | - |
| updated_at | TIMESTAMPTZ | NO | NOW() | - | - |

関連:
- 1:N で `Event`, `GroupMember`, `GroupAdmin`, `GroupBlacklist` を持つ。

---

## 4. GroupAdmin (グループ管理者)

グループに複数の共同管理者を割り当てる中間表。管理者はグループページ編集とメッセージ送信が可能。

| フィールド | 型 | NULL | 制約 | 説明 |
|---|---|---|---|---|
| id | BIGSERIAL | NO | PK | - |
| group_id | BIGINT | NO | FK→Group.id, UQ(group_id, user_id) | - |
| user_id | BIGINT | NO | FK→User.id | - |
| role | VARCHAR(20) | NO | CHECK in (owner, admin) | owner=オーナー / admin=共同管理者 |
| added_by_user_id | BIGINT | YES | FK→User.id | 招待者 |
| added_at | TIMESTAMPTZ | NO | - | - |

---

## 5. GroupMember (グループメンバー)

イベント参加 or 「メンバーになる」ボタンで自動加入。メンバー数として UI 表示される。

| フィールド | 型 | NULL | デフォルト | 制約 | 説明 |
|---|---|---|---|---|---|
| id | BIGSERIAL | NO | auto | PK | - |
| group_id | BIGINT | NO | - | FK→Group.id, UQ(group_id, user_id) | - |
| user_id | BIGINT | NO | - | FK→User.id | - |
| joined_via | VARCHAR(20) | NO | 'manual' | CHECK in (manual, event_join, admin_add) | 加入経路 |
| joined_at | TIMESTAMPTZ | NO | NOW() | - | - |
| receive_announcement | BOOLEAN | NO | TRUE | - | グループからの一斉メール許可 |
| left_at | TIMESTAMPTZ | YES | NULL | - | 退会日時（論理削除） |

---

## 6. GroupBlacklist (グループブラックリスト)

特定ユーザーをグループ・配下イベントから締め出す設定。

| フィールド | 型 | NULL | 制約 | 説明 |
|---|---|---|---|---|
| id | BIGSERIAL | NO | PK | - |
| group_id | BIGINT | NO | FK→Group.id, UQ(group_id, user_id) | - |
| user_id | BIGINT | NO | FK→User.id | - |
| reason | VARCHAR(255) | YES | - | 管理者メモ |
| added_by_user_id | BIGINT | NO | FK→User.id | 追加した管理者 |
| added_at | TIMESTAMPTZ | NO | - | - |

---

## 7. Event (イベント)

connpass の中心エンティティ。グループに必ず紐づき、サブドメイン下のパス `/{subdomain}.connpass.com/event/{event_id}/` で配信される。

| フィールド | 型 | NULL | デフォルト | 制約 | 説明 |
|---|---|---|---|---|---|
| id | BIGSERIAL | NO | auto | PK | API では `event_id` |
| group_id | BIGINT | NO | - | FK→Group.id, IDX | - |
| title | VARCHAR(255) | NO | - | - | - |
| catch | VARCHAR(255) | YES | NULL | - | サブタイトル (API では `catch`) |
| description | TEXT | YES | NULL | - | Markdown 対応本文 |
| cover_image_url | VARCHAR(500) | YES | NULL | - | OGP / カードに使われる |
| hash_tag | VARCHAR(64) | YES | NULL | - | X 連携用 (例: `connpass`) |
| event_type | VARCHAR(20) | NO | 'participation' | CHECK in (participation, advertisement) | 参加受付有無 |
| event_format | VARCHAR(20) | NO | 'offline' | CHECK in (offline, online, hybrid) | 開催形式 |
| started_at | TIMESTAMPTZ | NO | - | IDX | 開催開始 |
| ended_at | TIMESTAMPTZ | NO | - | - | 開催終了 |
| accepts_from | TIMESTAMPTZ | YES | NULL | - | 募集開始日時 |
| accepts_until | TIMESTAMPTZ | YES | NULL | - | 募集締切日時 |
| place | VARCHAR(255) | YES | NULL | - | 会場名 |
| address | VARCHAR(255) | YES | NULL | - | 住所 |
| lat | DECIMAL(10,7) | YES | NULL | - | 緯度 |
| lon | DECIMAL(10,7) | YES | NULL | - | 経度 |
| online_url | VARCHAR(500) | YES | NULL | - | 参加確定者のみ閲覧可 |
| capacity | INTEGER | YES | NULL | - | 全参加枠合計の定員（NULL=無制限） |
| accepted_count | INTEGER | NO | 0 | - | 参加者数キャッシュ |
| waiting_count | INTEGER | NO | 0 | - | 補欠数キャッシュ |
| attendance_code | VARCHAR(8) | YES | NULL | - | 出席コード（自動採番） |
| allow_attendance_code_check_in | BOOLEAN | NO | TRUE | - | コード自己出席許可 |
| allow_qr_check_in | BOOLEAN | NO | TRUE | - | QR 出席許可 |
| allow_duplicate_join | BOOLEAN | NO | FALSE | - | 重複参加許可 |
| visibility | VARCHAR(20) | NO | 'public' | CHECK in (public, private_link, draft) | 公開状態 |
| status | VARCHAR(20) | NO | 'draft' | CHECK | draft / published / closed / cancelled |
| recruitment_method | VARCHAR(20) | NO | 'fcfs' | CHECK in (fcfs, lottery) | 先着 / 抽選 |
| lottery_announce_at | TIMESTAMPTZ | YES | NULL | - | 抽選発表日（recruitment_method=lottery 必須） |
| owner_id | BIGINT | NO | - | FK→User.id | 作成者 |
| owner_display_name | VARCHAR(80) | YES | NULL | - | 表示用主催者名 |
| parent_event_id | BIGINT | YES | NULL | FK→Event.id | サブイベント／カンファレンス用 |
| series_event_position | INTEGER | YES | NULL | - | カンファレンスでの並び順 |
| published_at | TIMESTAMPTZ | YES | NULL | - | 公開日時 |
| created_at | TIMESTAMPTZ | NO | NOW() | - | - |
| updated_at | TIMESTAMPTZ | NO | NOW() | - | - |

関連:
- 1:N で `EventRole`, `EventManager`, `Participant`, `Comment`, `PresentationMaterial`, `Survey`, `EventTag` を持つ。

---

## 8. EventRole (参加枠)

ひとつのイベントに複数定義可能。「一般枠」「学生枠」「LT 枠」などを表現。

| フィールド | 型 | NULL | デフォルト | 制約 | 説明 |
|---|---|---|---|---|---|
| id | BIGSERIAL | NO | auto | PK | - |
| event_id | BIGINT | NO | - | FK→Event.id, IDX | - |
| display_order | SMALLINT | NO | 1 | - | 表示順 |
| name | VARCHAR(80) | NO | '参加枠1' | - | 枠名 |
| description | TEXT | YES | NULL | - | 注意書き |
| capacity | INTEGER | YES | NULL | - | 枠ごとの定員 |
| recruitment_method | VARCHAR(20) | NO | 'fcfs' | CHECK in (fcfs, lottery, designated) | 受付方式 |
| pricing_type | VARCHAR(20) | NO | 'free' | CHECK in (free, on_site, prepaid) | 料金タイプ |
| price | INTEGER | NO | 0 | CHECK price >= 0 | 円単位 |
| currency | CHAR(3) | NO | 'JPY' | - | - |
| auto_promote_from_waiting | BOOLEAN | NO | TRUE | - | キャンセル時自動繰り上がり |
| visible_after_full | BOOLEAN | NO | TRUE | - | 満員後も募集枠表示 |
| created_at | TIMESTAMPTZ | NO | NOW() | - | - |
| updated_at | TIMESTAMPTZ | NO | NOW() | - | - |

---

## 9. Participant (参加申込)

ユーザーがイベントの参加枠に申し込んだ記録。`UQ(event_id, user_id, event_role_id)` で重複防止（`allow_duplicate_join=true` の場合は緩める）。

| フィールド | 型 | NULL | デフォルト | 制約 | 説明 |
|---|---|---|---|---|---|
| id | BIGSERIAL | NO | auto | PK | - |
| event_id | BIGINT | NO | - | FK→Event.id, IDX | - |
| event_role_id | BIGINT | NO | - | FK→EventRole.id | - |
| user_id | BIGINT | NO | - | FK→User.id | - |
| status | VARCHAR(20) | NO | 'pending' | CHECK | pending/accepted/waiting/cancelled/no_show/attended |
| nominated | BOOLEAN | NO | FALSE | - | 抽選前の指名フラグ |
| waiting_position | INTEGER | YES | NULL | - | 補欠順 |
| applied_at | TIMESTAMPTZ | NO | NOW() | IDX | 申込日時。先着順で利用 |
| accepted_at | TIMESTAMPTZ | YES | NULL | - | 参加確定日時 |
| cancelled_at | TIMESTAMPTZ | YES | NULL | - | キャンセル日時 |
| check_in_at | TIMESTAMPTZ | YES | NULL | - | 出席確定日時 |
| check_in_method | VARCHAR(20) | YES | NULL | CHECK in (manual, code, qr) | 出席手段 |
| payment_id | BIGINT | YES | NULL | FK→Payment.id | 前払いの場合 |
| created_at | TIMESTAMPTZ | NO | NOW() | - | - |
| updated_at | TIMESTAMPTZ | NO | NOW() | - | - |

---

## 10. Payment (決済)

PayPal を用いた前払いの記録。connpass の収益源（PayPal 手数料のみで業界最安値を謳う）。

| フィールド | 型 | NULL | 制約 | 説明 |
|---|---|---|---|---|
| id | BIGSERIAL | NO | PK | - |
| participant_id | BIGINT | NO | FK→Participant.id, UQ | - |
| amount | INTEGER | NO | - | 円 |
| currency | CHAR(3) | NO | 'JPY' | - |
| provider | VARCHAR(20) | NO | CHECK in (paypal, voucher) | - |
| provider_txn_id | VARCHAR(120) | YES | - | PayPal トランザクション |
| voucher_code_id | BIGINT | YES | FK→VoucherCode.id | バウチャー使用時 |
| status | VARCHAR(20) | NO | CHECK in (pending, succeeded, refunded, failed) | - |
| paid_at | TIMESTAMPTZ | YES | - | - |
| refunded_at | TIMESTAMPTZ | YES | - | - |
| receipt_issued_at | TIMESTAMPTZ | YES | - | 領収データ発行日時 |

---

## 11. VoucherCode (バウチャーコード)

特定参加者に割引コードを発行する機能。

| フィールド | 型 | NULL | 制約 | 説明 |
|---|---|---|---|---|
| id | BIGSERIAL | NO | PK | - |
| event_id | BIGINT | NO | FK→Event.id | - |
| code | VARCHAR(32) | NO | UQ | 入力用コード |
| discount_amount | INTEGER | NO | - | 円 |
| max_uses | INTEGER | YES | - | NULL=無制限 |
| used_count | INTEGER | NO | DEFAULT 0 | - |
| expires_at | TIMESTAMPTZ | YES | - | - |

---

## 12. Comment (コメント)

イベントページに表示される質問・コメント。参加者・主催者間のコミュニケーション機能。

| フィールド | 型 | NULL | 制約 | 説明 |
|---|---|---|---|---|
| id | BIGSERIAL | NO | PK | - |
| event_id | BIGINT | NO | FK→Event.id, IDX | - |
| user_id | BIGINT | NO | FK→User.id | - |
| parent_comment_id | BIGINT | YES | FK→Comment.id | スレッド返信 |
| body | TEXT | NO | - | 本文 |
| is_pinned | BOOLEAN | NO | DEFAULT FALSE | 主催者ピン留め |
| created_at | TIMESTAMPTZ | NO | - | - |
| deleted_at | TIMESTAMPTZ | YES | - | 論理削除 |

---

## 13. Tag (タグ) と EventTag

イベントのタグ付け。検索とレコメンドに使われる。

**Tag**
| フィールド | 型 | NULL | 制約 | 説明 |
|---|---|---|---|---|
| id | BIGSERIAL | NO | PK | - |
| name | VARCHAR(40) | NO | UQ | 例: Python, React, AI |
| slug | VARCHAR(40) | NO | UQ | URL 安全文字列 |
| usage_count | INTEGER | NO | DEFAULT 0 | キャッシュ |

**EventTag**
| フィールド | 型 | NULL | 制約 | 説明 |
|---|---|---|---|---|
| event_id | BIGINT | NO | PK(event_id, tag_id), FK→Event.id | - |
| tag_id | BIGINT | NO | FK→Tag.id | - |

---

## 14. PresentationMaterial (発表資料)

イベント詳細ページ・グループページに「資料」として一覧化される。LayerX グループでは 194 件、Findy グループでは 905 件を保有していることから、グループ単位で集計表示される。

| フィールド | 型 | NULL | 制約 | 説明 |
|---|---|---|---|---|
| id | BIGSERIAL | NO | PK | - |
| event_id | BIGINT | NO | FK→Event.id, IDX | - |
| presenter_user_id | BIGINT | YES | FK→User.id | NULL=外部発表者 |
| presenter_display_name | VARCHAR(120) | YES | - | 表示名 |
| title | VARCHAR(255) | NO | - | 資料タイトル |
| url | VARCHAR(500) | NO | - | Speaker Deck / SlideShare / GitHub 等 |
| thumbnail_url | VARCHAR(500) | YES | - | プレビュー画像 |
| display_order | SMALLINT | NO | DEFAULT 1 | - |
| posted_at | TIMESTAMPTZ | NO | NOW() | - |

---

## 15. Survey (アンケート) と SurveyQuestion / SurveyAnswer

主催者がアンケートを作成し、申込時または事後に回答させる。

**Survey**
| フィールド | 型 | NULL | 制約 | 説明 |
|---|---|---|---|---|
| id | BIGSERIAL | NO | PK | - |
| event_id | BIGINT | NO | FK→Event.id | - |
| title | VARCHAR(255) | NO | - | - |
| trigger | VARCHAR(20) | NO | CHECK in (on_apply, after_event) | 表示タイミング |
| required | BOOLEAN | NO | DEFAULT FALSE | - |

**SurveyQuestion**
| フィールド | 型 | NULL | 制約 | 説明 |
|---|---|---|---|---|
| id | BIGSERIAL | NO | PK | - |
| survey_id | BIGINT | NO | FK→Survey.id | - |
| display_order | SMALLINT | NO | - | - |
| body | TEXT | NO | - | 質問本文 |
| input_type | VARCHAR(20) | NO | CHECK in (text, textarea, single, multi, scale) | - |
| options | JSONB | YES | - | 選択肢配列 |
| required | BOOLEAN | NO | DEFAULT FALSE | - |

**SurveyAnswer**
| フィールド | 型 | NULL | 制約 | 説明 |
|---|---|---|---|---|
| id | BIGSERIAL | NO | PK | - |
| survey_question_id | BIGINT | NO | FK→SurveyQuestion.id | - |
| participant_id | BIGINT | NO | FK→Participant.id | - |
| answer_value | JSONB | NO | - | 型に応じた値 |
| answered_at | TIMESTAMPTZ | NO | - | - |

---

## 16. Notification (通知)

「メール、X(Twitter)、Facebook での通知」「開催前日のリマインダー」「補欠の繰り上がり通知」「抽選結果通知」などを抽象化。

| フィールド | 型 | NULL | 制約 | 説明 |
|---|---|---|---|---|
| id | BIGSERIAL | NO | PK | - |
| recipient_user_id | BIGINT | NO | FK→User.id, IDX | - |
| kind | VARCHAR(40) | NO | CHECK | event_published / lottery_result / promoted_from_waiting / reminder_24h / new_comment / message_from_organizer 等 |
| event_id | BIGINT | YES | FK→Event.id | - |
| group_id | BIGINT | YES | FK→Group.id | - |
| payload | JSONB | NO | - | 件名・本文テンプレートパラメータ |
| channel | VARCHAR(20) | NO | CHECK in (email, push, in_app) | - |
| sent_at | TIMESTAMPTZ | YES | - | - |
| read_at | TIMESTAMPTZ | YES | - | - |
| created_at | TIMESTAMPTZ | NO | NOW() | - |

---

## 17. Bookmark (ブックマーク)

ユーザーがイベントを「気になる」として保存する機能。

| フィールド | 型 | NULL | 制約 | 説明 |
|---|---|---|---|---|
| id | BIGSERIAL | NO | PK | - |
| user_id | BIGINT | NO | FK→User.id, UQ(user_id, event_id) | - |
| event_id | BIGINT | NO | FK→Event.id | - |
| created_at | TIMESTAMPTZ | NO | NOW() | - |

---

## 18. EventStat (イベント統計キャッシュ)

主催者が確認できる統計データ。ページビュー、申込数推移、出席率など。

| フィールド | 型 | NULL | 制約 | 説明 |
|---|---|---|---|---|
| event_id | BIGINT | NO | PK, FK→Event.id | - |
| page_views | INTEGER | NO | DEFAULT 0 | - |
| unique_viewers | INTEGER | NO | DEFAULT 0 | - |
| apply_count | INTEGER | NO | DEFAULT 0 | - |
| cancel_count | INTEGER | NO | DEFAULT 0 | - |
| attendance_rate | DECIMAL(5,2) | YES | NULL | % |
| updated_at | TIMESTAMPTZ | NO | NOW() | - |

---

## 19. Message (主催者からの一斉メッセージ)

主催者が参加者全員 / 補欠 / 当落者などにメッセージを送る機能。

| フィールド | 型 | NULL | 制約 | 説明 |
|---|---|---|---|---|
| id | BIGSERIAL | NO | PK | - |
| event_id | BIGINT | YES | FK→Event.id | - |
| group_id | BIGINT | YES | FK→Group.id | - |
| sender_user_id | BIGINT | NO | FK→User.id | 主催者 |
| audience | VARCHAR(30) | NO | CHECK in (accepted, waiting, cancelled, all, group_members) | - |
| subject | VARCHAR(255) | NO | - | - |
| body | TEXT | NO | - | - |
| sent_at | TIMESTAMPTZ | NO | - | - |
| recipient_count | INTEGER | NO | - | 配信成功数 |

---

## 20. AuditLog (監査ログ)

不正対策・問い合わせ対応用。ログイン履歴、イベント編集履歴、強制キャンセル履歴など。

| フィールド | 型 | NULL | 制約 | 説明 |
|---|---|---|---|---|
| id | BIGSERIAL | NO | PK | - |
| actor_user_id | BIGINT | YES | FK→User.id | - |
| action | VARCHAR(60) | NO | - | event.update / participant.force_cancel など |
| target_type | VARCHAR(40) | NO | - | Event / User / Group |
| target_id | BIGINT | NO | - | - |
| ip_address | INET | YES | - | - |
| user_agent | TEXT | YES | - | - |
| metadata | JSONB | YES | - | diff など |
| created_at | TIMESTAMPTZ | NO | NOW() | - |

---

## エンティティ俯瞰

主要 20 エンティティを以下のグルーピングで管理する。

- **アイデンティティ系**: User, OAuthIdentity
- **コミュニティ系**: Group, GroupAdmin, GroupMember, GroupBlacklist
- **イベント系**: Event, EventRole, EventManager (省略, GroupAdmin と同様の構造)
- **参加系**: Participant, Payment, VoucherCode
- **コンテンツ系**: Comment, PresentationMaterial, Tag, EventTag
- **対話系**: Survey, SurveyQuestion, SurveyAnswer, Message, Notification
- **ユーザー操作系**: Bookmark
- **運用系**: EventStat, AuditLog

これらは `relationships.md` で関連図として整理する。
