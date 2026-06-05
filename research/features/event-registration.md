# 参加登録 (Event Registration)

connpass.com の公開ヘルプ・公開ページから観察できる仕様を元に、参加登録機能の詳細仕様を整理する。

---

## 1. 機能の目的とユーザーバリュー

### 目的
- 主催者が定員つきの IT 勉強会・カンファレンスを公開し、参加者を効率的に募集できるようにする。
- 参加者が「自分の参加意思」を一度のクリックで表明し、補欠状態を含めて自身のステータスを常に把握できる状態にする。
- 主催者と参加者の間で「定員を超えた場合の扱い」を、毎回交渉せずシステム的に決定する。

### ユーザーバリュー
- **参加者**: 公平な抽選 / シンプルな先着方式を選べる。1 タップで申し込み・キャンセルが完結し、補欠であれば自動繰り上げを待てる。
- **主催者**: 募集方式 (先着 / 抽選)、参加枠 (Ticket Type)、定員数、募集期間、参加費を細かく設定できる。応募超過時の挙動を自動化できる。
- **コミュニティ**: 参加枠を「学生枠 / 一般枠 / 登壇者枠 / スポンサー枠」のように分けることで、コミュニティ運営の意図 (登壇者を確実に確保等) を反映できる。

---

## 2. 関連するエンティティとフィールド

### Event
| Field | 型 | 説明 |
|---|---|---|
| id | int | イベント ID |
| group_id | int | 所属グループ (任意, 一度設定すると変更不可) |
| title | string | イベント名 (必須) |
| catch | string | サブタイトル / キャッチコピー |
| description | text | 説明文 (Markdown) |
| limited_description | text | 参加確定ユーザーのみに公開する情報 (会場詳細, URL 等) |
| started_at | datetime | 開催開始日時 (30 分刻み) |
| ended_at | datetime | 開催終了日時 (30 分刻み) |
| accepted_start_at | datetime | 募集開始日時 (未設定なら公開日時) |
| accepted_end_at | datetime | 募集締切日時 (未設定ならイベント終了日時) |
| registration_type | enum | `first_come` (先着) / `lottery` (抽選・指名) |
| lottery_at | datetime | 抽選発表日 (抽選方式のみ) |
| accept_overlap | bool | 開催時間が重複する他イベントとの同時申込許可 (デフォルト true) |
| place | string | 会場名 |
| address | string | 住所 (「オンライン」表記でオンライン検索対象) |
| online_url | string | オンライン参加用 URL (limited_description に格納される運用が多い) |
| attendance_code | string | 出席コード (自動生成 or 任意) |
| hashtag | string | X(Twitter) 用ハッシュタグ |
| status | enum | `draft` / `open` / `cancelled` / `closed` |
| payment_type | enum | `free` / `paypal` (前払い) |

### Ticket (参加枠)
| Field | 型 | 説明 |
|---|---|---|
| id | int | 参加枠 ID |
| event_id | int | 紐づくイベント |
| name | string | 枠名 (例: "一般枠", "学生枠", "登壇者枠") |
| capacity | int | 定員 (0 = 無制限) |
| fee | int | 参加費 (会場払い or PayPal 前払い額) |
| order | int | 表示順 |
| registration_type | enum | 枠単位の `first_come` / `lottery` (各枠ごとに独立) |

### Participation (申し込み)
| Field | 型 | 説明 |
|---|---|---|
| id | int | 申し込み ID |
| event_id | int | イベント ID |
| ticket_id | int | 参加枠 ID |
| user_id | int | 申し込みユーザー |
| status | enum | `accepted` (参加) / `waitlisted` (補欠) / `cancelled` (キャンセル) / `pending_lottery` (抽選待ち) |
| applied_at | datetime | 申し込み日時 (繰り上げ順序計算に使用) |
| nominated | bool | 主催者による指名フラグ (抽選方式) |
| receipt_number | int | 受付番号 (主催者管理画面・QR で利用) |
| attended | bool | 当日出席フラグ |
| comment | text | 参加コメント |
| survey_answers | json | アンケート回答 |

### User (前提条件として)
- メールアドレスが登録・確認済みでなければ申し込み不可。

---

## 3. 状態遷移図

### 先着方式

```
                +-------------+
   申込ボタン   |             |
[未申込] -----> |  accepted   |
                |             |
                +-----+-------+
                      |
   定員オーバー時      | キャンセル
       v              v
+------------+   +-----------+
| waitlisted | --> cancelled |
+------------+   +-----------+
   ^   |
   |   | 上位ユーザーが cancelled
   |   v
   |  accepted (繰り上げ)
   +-- 他補欠ユーザーが順位繰り上げ
```

### 抽選方式

```
[未申込] --申込--> pending_lottery
                       |
       抽選発表日 0:00-2:00 バッチ
                       |
        +--------------+---------------+
        |                              |
   accepted (当選)              waitlisted (落選 = 補欠)
        |                              |
        | キャンセル                    | 他者キャンセルで繰り上げ
        v                              v
   cancelled                       accepted
                                       |
       抽選発表後の追加申込             |
       (= 先着扱い)                   v
                                  cancelled
```

---

## 4. ルール・制約

### 申し込み全般
- 1 ユーザーは 1 イベントにつき 1 つの参加枠にしか申し込めない。
- メールアドレス確認済みのアカウントのみ申し込み可能。
- 公開後でも `accepted_start_at` 前は申し込みできない。
- `accepted_end_at` を過ぎると申し込み不可 (=募集締切)。

### 参加枠
- 参加枠は複数作成可能。各枠で `registration_type` を独立に設定できる (枠 A は先着、枠 B は抽選)。
- 既に申込者がいる枠は削除できない。
- 定員 0 = 募集枠としては存在するが受け付けない、または無制限と解釈される (実装方針による)。

### 定員変更
- 定員を増減してもユーザーへの自動通知は飛ばない。主催者の一括メッセージで案内する運用。
- 定員減少時、後ろから補欠に繰り下がる。
- 定員増加時、補欠先頭から参加に繰り上がる。

### 抽選方式
- `lottery_at` (抽選発表日) は `accepted_end_at` よりは前、`started_at` よりも前である必要がある。
  - 実態としては「募集締切日と発表日を同日にする」「発表日後も募集を続ける」の両運用がある。
- 抽選バッチは `lottery_at` の **0:00〜2:00 頃** に自動実行 (深夜バッチ)。
- 主催者は `lottery_at` 前に任意の申込者を **指名** することで、抽選結果に関わらず当選にできる。指名は何度でも変更可能、定員超過の指名も可能 (補欠ユーザーも指名できる)。指名情報は主催者のみ見える。
- 抽選発表日以降の追加申込は **先着順** で `accepted` になる (定員に空きがあれば)。

### 再申し込み・キャンセル
- 申し込み済みでも「キャンセル」ボタンから自由にキャンセル可能。
- キャンセル後、募集期間内であれば再度申し込み可能 (繰り上げ順序は新しい applied_at で決まる)。
- 補欠でもキャンセル可能。補欠キャンセル時は下位の補欠が 1 つずつ繰り上がる (補欠順)。
- 主催者は「強制キャンセル」を実行可能 (募集期間中のみ)。強制キャンセルされたユーザーは再申し込み可能。
- キャンセル済みユーザーへの一括メッセージ送信機能は無い。

### 重複参加
- `accept_overlap = false` の場合、開催時間が重複する別イベントに同時申込できない。
- デフォルトは「許可する」。

### 有料イベント
- `payment_type = paypal` の場合、参加確定と同時に PayPal 経由の決済が必要。
- 「会場払い」の場合は申込のみで決済はオフライン。

---

## 5. ユーザー視点のフロー

### 5.1 先着イベントへの申込
1. イベント詳細ページを閲覧。
2. 右上の「このイベントに申し込む」ボタンをクリック。
3. 参加枠が複数あれば枠を選択。
4. アンケート (存在すれば) に回答 / 参加コメントを入力。
5. 確認画面で「申し込む」を押下。
6. ステータスが `accepted` (定員内) または `waitlisted` (定員超過) として登録。
7. 確認メールが届く。

### 5.2 抽選イベントへの申込
1. 同じく「申し込む」ボタンから申込。
2. ステータスは `pending_lottery` として保留。
3. 抽選発表日 (0:00〜2:00) の自動バッチで `accepted` または `waitlisted` に確定。
4. 結果メールが届く。
5. 発表日以降〜募集締切までは先着順で空き枠に申込可能。

### 5.3 キャンセル
1. 申込済みイベント詳細を表示。
2. 「キャンセルする」ボタンを押下。
3. 確認後、ステータスが `cancelled` に変更。
4. 自分が参加枠だった場合、補欠先頭ユーザーが自動繰り上げされ通知される (`waitlist.md` 参照)。

### 5.4 再申し込み
- キャンセル後、`accepted_end_at` 前であれば再申し込み可能。
- 抽選発表後にキャンセル→再申込した場合は **先着扱い** (発表日以降は先着)。

---

## 6. 主催者視点のフロー

### 6.1 募集方式の設定
1. イベント作成ページで「参加受け付け方法」を選択 (`first_come` / `lottery`)。
2. 抽選を選んだ場合、`lottery_at` を設定。
3. 「参加枠」セクションで枠名・定員・参加費を入力。複数枠の追加が可能。
4. 各枠で `registration_type` を切り替え可能。

### 6.2 募集期間中の運営
- 参加者一覧画面で `accepted` / `waitlisted` / `cancelled` を確認。
- 強制キャンセルや一括メッセージで参加者をコントロール。
- 抽選方式の場合は「指名」UI で確定させたい申込者を選択。

### 6.3 定員変更
- 募集中でも参加枠の定員を変更可能。
- 増加時に補欠から自動繰り上げが行われ、繰り上げ通知が飛ぶ。
- 減少時、繰り下がったユーザーへの自動通知は無いので主催者は一括メッセージで案内する。

### 6.4 イベント中止 / 削除
- 申込者がいるイベントは削除不可。中止のみ可能で、中止すると参加者全員に自動通知。
- 補欠もキャンセル者もゼロの中止済みイベントは「下書きに戻す」が可能。

---

## 7. 関連 UI

| 画面 | 主要コンポーネント |
|---|---|
| イベント詳細 (`/event/:id/`) | 申込ボタン (右上), 参加枠リスト, 参加者数 ("0/45 人"), 募集状態バッジ |
| 申込フォーム (`/event/:id/join/`) | 参加枠ラジオ, アンケート, 参加コメント, 確認画面 |
| キャンセル画面 (`/event/:id/cancel/`) | キャンセル理由, 確認ボタン |
| マイページ (`/user/:nickname/`) | 申込中・参加済みイベント一覧 |
| 主催者: イベント編集 (`/event/:id/edit/`) | 参加受付方式, 参加枠フォーム (動的追加), 募集期間, 抽選発表日 |
| 主催者: 参加者管理 (`/event/:id/participation/`) | ステータスタブ, 強制キャンセル, 一括メッセージ |
| 主催者: 指名画面 (抽選) | 各参加枠の指名チェックリスト |

---

## 8. エッジケース

| ケース | 挙動 |
|---|---|
| 満員時に申込 | 自動的に `waitlisted`。補欠順位を表示。 |
| 募集締切後に申込 | 申込ボタン非活性。 |
| 抽選発表日後に申込 | 先着順扱いで `accepted` (定員空きあれば) or `waitlisted`。 |
| 複数枠で別枠申込 | 不可。既存申込をキャンセルしてから別枠に申し込む。 |
| 有料 (前払い) 枠で抽選 | 当選時に PayPal 決済が必要。決済しないと参加確定にならない (運用上、決済期限がある想定)。 |
| メール未確認ユーザー | 申込フォーム到達前にエラー。 |
| 主催者が自分のイベントに申込 | 一般ユーザーとして申込可能。指名による当選も可能。 |
| 主催者が定員を 0 に変更 | 全員 `waitlisted` に降格 (運用上は禁止が望ましい)。 |
| `accept_overlap = false` で重複申込 | 申込時にエラー。先行イベントをキャンセル後に申込可。 |
| 中止後 | 申込ボタン消滅。参加者全員へ通知メール。 |
| 強制キャンセルされたユーザー | メッセージ受信後、再申込可能。 |

---

## 9. 推測される内部処理

### 9.1 申込トランザクション (先着)
```pseudo
BEGIN TRANSACTION
  SELECT ticket FOR UPDATE WHERE id = :ticket_id
  count = SELECT COUNT(*) FROM participation
          WHERE ticket_id = :ticket_id AND status = 'accepted'
  IF count < ticket.capacity THEN
    status = 'accepted'
  ELSE
    status = 'waitlisted'
  END
  INSERT INTO participation (..., status, applied_at = NOW())
COMMIT
ENQUEUE confirmation_mail_job(participation_id)
```

- 行ロック (`SELECT FOR UPDATE`) で同時申込の競合を防ぐ。
- 通知メールはキュー (例: Sidekiq, SQS) 経由で非同期送信。

### 9.2 抽選バッチ
- Cron で `lottery_at` の 0:00〜2:00 に該当するイベントを抽出。
- 各参加枠ごとに:
  1. 指名済み (`nominated = true`) のユーザーを優先的に `accepted` に。
  2. 残り定員に対して、`pending_lottery` ユーザーをシャッフルしてランダム選出。
  3. 当選者を `accepted`、残りを `waitlisted` に更新。
- 終了後、全申込ユーザーに結果メールを一斉送信 (キューに enqueue)。

### 9.3 繰り上げ処理
- `accepted` → `cancelled` の更新時にトリガー (DB トリガー or アプリケーションフック)。
- 同 `ticket_id` で `status = 'waitlisted'` の先頭ユーザー (`applied_at` 昇順) を `accepted` に更新。
- 繰り上げメール送信ジョブを enqueue。

### 9.4 リマインダー
- イベント開始 1 日前に該当 `accepted` ユーザーへリマインダーメールを送るバッチ。

---

## 10. 模倣実装する際の設計案

### 10.1 DB スキーマ (PostgreSQL 想定)
```sql
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  group_id BIGINT REFERENCES groups(id),
  title TEXT NOT NULL,
  registration_type registration_type_enum NOT NULL DEFAULT 'first_come',
  lottery_at TIMESTAMPTZ,
  accepted_start_at TIMESTAMPTZ,
  accepted_end_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  status event_status_enum NOT NULL DEFAULT 'draft',
  accept_overlap BOOLEAN DEFAULT TRUE
);

CREATE TABLE tickets (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES events(id),
  name TEXT NOT NULL,
  capacity INT NOT NULL DEFAULT 0,
  fee INT NOT NULL DEFAULT 0,
  registration_type registration_type_enum NOT NULL DEFAULT 'first_come',
  display_order INT
);

CREATE TABLE participations (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES events(id),
  ticket_id BIGINT NOT NULL REFERENCES tickets(id),
  user_id BIGINT NOT NULL REFERENCES users(id),
  status participation_status_enum NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL,
  nominated BOOLEAN DEFAULT FALSE,
  receipt_number INT,
  attended BOOLEAN DEFAULT FALSE,
  comment TEXT,
  UNIQUE (event_id, user_id)
);
CREATE INDEX idx_participations_ticket_status_applied
  ON participations(ticket_id, status, applied_at);
```

### 10.2 申込 API (RESTful 想定)
- `POST /api/events/:id/participations`
  - body: `{ ticket_id, comment, survey_answers }`
  - 200: `{ status: 'accepted' | 'waitlisted' | 'pending_lottery', participation_id }`
  - 409: 重複申込・締切後・定員 0 等

### 10.3 抽選バッチ
- Cron (例: `0 0 * * *`) で当日 `lottery_at` のイベントを抽出。
- ジョブキューに `LotteryJob(event_id)` を投入し、ワーカーで処理。
- ワーカー内で参加枠ごとにロックを取り、抽選アルゴリズムを実行。

### 10.4 繰り上げ
- ドメインイベント `ParticipationCancelled` を発行 → ハンドラで補欠先頭ユーザーを `accepted` に。
- 通知サービスにイベント連携。

### 10.5 排他制御
- 同一ユーザーの重複申込防止: `participations (event_id, user_id) UNIQUE`。
- 同時申込の競合: `SELECT ticket FOR UPDATE` または `INSERT ... ON CONFLICT` + 後段で順位再計算。

### 10.6 テスト観点
- 定員ちょうどでの同時申込 (10 並列でアサート)。
- 抽選バッチの再実行冪等性。
- 補欠繰り上げの順序保証 (applied_at 昇順)。
- 強制キャンセル → 再申込のステータス遷移。
- 開催時間重複イベントへの同時申込ブロック。
