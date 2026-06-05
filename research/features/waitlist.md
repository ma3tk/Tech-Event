# 補欠 (キャンセル待ち) と繰り上げロジック

connpass.com における補欠 (waitlist) の振る舞いと、参加確定者からのキャンセル発生時の自動繰り上げ仕様を整理する。

---

## 1. 機能の目的とユーザーバリュー

### 目的
- 定員を超えた参加希望者を「捨てない」で待機列として保持する。
- 参加確定者のキャンセルが発生した時に、自動・公平にスロットを埋め、主催者の手動運用を不要にする。
- 参加希望者に「補欠順位」という明確な期待値を与える。

### ユーザーバリュー
- **参加者**: 一度補欠で申し込んでも、待っているだけで自動的に繰り上げ通知が来る。途中で主催者に問い合わせる必要が無い。
- **主催者**: キャンセルが出てもイベントが空席化しない。代理参加者の手配コストが減る。
- **コミュニティ**: 当日まで席が埋まる確率が上がる = キャンセル率が高くてもイベント成立しやすい。

---

## 2. 関連するエンティティとフィールド

補欠は独立したエンティティではなく `Participation.status = 'waitlisted'` として表現される。

| Field | 型 | 説明 |
|---|---|---|
| Participation.status | enum | `accepted`, `waitlisted`, `cancelled`, `pending_lottery` |
| Participation.applied_at | datetime | 申込日時。**補欠の繰り上げ順を決める唯一の基準** |
| Participation.ticket_id | int | 参加枠ID。繰り上げは「同じ枠の中」で行われる |
| Participation.nominated | bool | 抽選方式における主催者指名フラグ (補欠でも指名可能) |
| Ticket.capacity | int | 参加枠の定員。これと `accepted` 件数を比較する |
| Ticket.registration_type | enum | `first_come` / `lottery`。補欠の発生条件が異なる |
| Event.accepted_end_at | datetime | 募集締切。締切後の繰り上げが行われるかはルール次第 |

### 派生 / 計算項目
- `waitlist_position`: 同 `ticket_id` 内で `status = 'waitlisted'` の `applied_at` 昇順インデックス。
- `is_full`: 同 `ticket_id` で `accepted` 件数 >= `capacity`。

---

## 3. 状態遷移図

```
              申込
[未申込] -----------+
                   |
            定員空き?
              yes / no
              /     \
            v        v
       accepted   waitlisted
            |        |
            | キャンセル
            v
       cancelled
            |
            | トリガー: 補欠先頭を繰り上げ
            v
       (waitlisted先頭) -----> accepted
            ^                       \
            |                        \
            |          繰り上げメール通知
            |
            | 自分でキャンセル
            v
       waitlisted -> cancelled
            |
            | 下位ユーザーが順位繰り上げ
            v
       (順位1->順位2が順位1へ)
```

### 抽選方式の特殊遷移
```
pending_lottery
     |
   抽選バッチ (lottery_at の 0-2 時)
     |
     +--> accepted (当選)
     |
     +--> waitlisted (落選)
              |
              | 抽選発表後にキャンセルが出れば
              v
            accepted (繰り上げ)
```

---

## 4. ルール・制約

### 4.1 補欠の発生
- 先着方式: `accepted` 件数が `capacity` に達した後の申込は自動的に `waitlisted`。
- 抽選方式: `lottery_at` の自動抽選で落選したユーザーが `waitlisted` になる。
- 募集締切 (`accepted_end_at`) 後は新規申込不可なので新たな `waitlisted` は発生しない。

### 4.2 繰り上げ順位の決定基準
- **同じ参加枠の中で** `status = 'waitlisted'` のユーザーを `applied_at` 昇順で並べる。
- 主催者指名されたユーザーは抽選結果に関係なく `accepted` になる (= 補欠から指名するというより、抽選前に指名する運用)。
- 参加枠をまたいだ繰り上げは行われない。例: 一般枠が満員でも、学生枠が空いていれば学生枠の補欠は繰り上がるが、一般枠の補欠は学生枠に移らない。

### 4.3 繰り上げのトリガー
- 以下の操作で「同じ枠の `accepted` 件数」が `capacity` 未満になった瞬間に繰り上げが走る。
  - 参加者の自発的キャンセル
  - 主催者による強制キャンセル
  - 主催者による定員増加 (`Ticket.capacity` 増)
- ただし、定員増加によるユーザー側への自動通知は **発生しない** (公式 FAQ で明示)。
  - = 定員増加に伴うデータ上の繰り上げは行うが、メール通知は飛ばない可能性が高い。
  - もしくは定員増加では繰り上げ自体が走らず、補欠のまま留まる実装かもしれない (FAQ で「主催者から一括メッセージで案内してください」と書かれている)。
- 自発キャンセル経由の繰り上げでは、繰り上がったユーザーに **メール通知が確実に飛ぶ**。

### 4.4 繰り上げのタイミング
- 抽選方式: `lottery_at` 翌日以降の通常のキャンセルでは、キャンセル発生と同時 (= リアルタイム) に繰り上げ。
- 先着方式: キャンセル発生と同時に繰り上げ。
- バッチ処理ではなく、キャンセル処理のトランザクション内 or 直後の非同期ジョブで実行される設計と推測。

### 4.5 繰り上げ後の挙動
- 繰り上がったユーザーには「参加に繰り上がりました」のメールが届く。
- ステータスが `accepted` に変わる。マイページ・イベント詳細での表示も更新。
- 繰り上がったユーザーはそのままキャンセル可能 (任意)。キャンセルすると次の補欠が繰り上がる連鎖が発生。

### 4.6 締切後の扱い
- 募集締切 (`accepted_end_at`) 後にキャンセルが発生しても、原則として繰り上げは継続する (締切は新規申込の停止条件であって繰り上げ停止条件ではない、と推測)。
- ただし開催開始 (`started_at`) を過ぎた後は繰り上げ通知に意味が薄いため、実装上停止することが多い。

### 4.7 有料枠
- 有料 (前払い) 参加枠の場合、繰り上げ時点で改めて決済を求める必要がある。
- 繰り上げ後一定時間内に決済しないと再度キャンセル扱いになる、という運用設計が考えられる。

---

## 5. ユーザー視点のフロー

### 5.1 補欠として登録される
1. 満員のイベントに申込。
2. 確認画面で「補欠として登録されます」と表示。
3. 申込確定後、ステータスが `waitlisted` 。マイページに「補欠 N 番」のように表示。
4. 補欠登録完了メールが届く (任意通知)。

### 5.2 繰り上げが発生する
1. 上位の参加者が誰かキャンセル。
2. システムが自動で自分を `accepted` に更新。
3. 「参加に繰り上がりました」のメールが届く。
4. マイページ・イベント詳細で「参加」ステータスに変わる。

### 5.3 自分が補欠のままキャンセルする
1. イベント詳細の「キャンセルする」ボタンを押下。
2. ステータスが `cancelled` に。
3. 自分より下位の補欠が 1 つずつ順位繰り上げ (席は埋まらない、ただ補欠順位が上がるだけ)。

### 5.4 繰り上げ後キャンセル
1. 繰り上がって `accepted` になった後でもキャンセル可能。
2. キャンセルすると次の補欠先頭が繰り上がる。

---

## 6. 主催者視点のフロー

### 6.1 補欠の確認
- 参加者管理画面でタブ切替により `waitlisted` 一覧を閲覧。
- 補欠順位 (申込順) で表示。

### 6.2 繰り上げの介入
- 定員を増やすことで補欠から繰り上がりを発生させられる (ただし通知は飛ばないので一括メッセージで案内)。
- 参加者を強制キャンセルすることで繰り上がりを発生させられる。

### 6.3 抽選方式での補欠への指名
- 抽選発表前は補欠扱いの申込者でも「指名」できる。指名されたユーザーは抽選バッチで `accepted` になる。

### 6.4 一括メッセージ
- 補欠者向けに「キャンセル待ち中」のメッセージを一斉送信可能。

---

## 7. 関連 UI

| 画面 | 関連コンポーネント |
|---|---|
| イベント詳細 (`/event/:id/`) | 参加枠ごとに「補欠 N 名」「定員 X 名 / 参加 Y 名」表示 |
| マイページ (`/user/:nickname/`) | 「補欠中のイベント」一覧、「補欠 N 番」表示 |
| 申込確認画面 | 「補欠として登録されます」アラート |
| 主催者: 参加者管理 (`/event/:id/participation/`) | 「参加者 / 補欠 / キャンセル」タブ、補欠順序表示 |
| 主催者: 定員編集 (`/event/:id/edit/`) | 参加枠の定員入力フィールド (変更時の挙動説明テキスト) |
| メール: 補欠繰り上げ通知 | "あなたが「○○」に参加可能となりました" |

---

## 8. エッジケース

| ケース | 挙動 |
|---|---|
| 同 `applied_at` の複数補欠 | ミリ秒精度で順序が決まる。同一秒の場合は `id` 昇順等のタイブレーク |
| 開催直前にキャンセル発生 | 繰り上げ通知は飛ぶが、参加者側が認識できない可能性。通知文面で当日参加可能性を明示 |
| 主催者が定員を補欠数より少なく減らす | 既存 `accepted` が `waitlisted` に降格。繰り上げ計算で順位逆転に注意 |
| 繰り上げユーザーが有料前払い未決済 | 決済期限超過で再 cancel → 次の補欠繰り上げ (実装次第) |
| 抽選発表後に大量キャンセル | 補欠から順次繰り上げ。発表日以降の新規申込は先着扱いになるので、補欠より新規が先に確定する可能性あり (要設計判断) |
| イベント中止 | 全 `accepted` `waitlisted` ユーザーに中止通知。繰り上げは行わない |
| 強制キャンセルで補欠繰り上げ | 強制キャンセルの場合も同じく繰り上げトリガー |
| 補欠ユーザーが他イベントに重複申込ロック | `accept_overlap = false` の場合、繰り上げ時点で他イベント参加と衝突すると繰り上げを拒否、または下位ユーザーに譲るかは要設計 |
| ゼロ定員枠 | 全員 `waitlisted`。繰り上げ発生せず |
| 削除されたユーザーが補欠リストにいる | 繰り上げ計算からスキップ |

---

## 9. 推測される内部処理

### 9.1 繰り上げトリガーの実装パターン
**パターン A: トランザクション内連鎖更新**
```pseudo
def cancel(participation_id):
  BEGIN TRANSACTION
    SELECT FOR UPDATE participation WHERE id = participation_id
    UPDATE participations SET status='cancelled' WHERE id=participation_id

    IF cancelled.status == 'accepted':
      next = SELECT FROM participations
             WHERE ticket_id=cancelled.ticket_id
               AND status='waitlisted'
             ORDER BY applied_at ASC
             LIMIT 1 FOR UPDATE
      IF next exists:
        UPDATE participations SET status='accepted' WHERE id=next.id
        ENQUEUE promotion_mail_job(next.id)
  COMMIT
```

**パターン B: ドメインイベント方式**
- `ParticipationCancelled` イベント発火 → ハンドラで繰り上げ。
- 非同期ジョブとして処理 (Sidekiq / Resque / Cloud Tasks)。

### 9.2 通知メール送信
- 繰り上げ確定直後にメール送信ジョブを enqueue。
- 「参加に繰り上がりました」テンプレートに、イベント名・日時・受付番号を埋め込む。
- リトライ機構あり (失敗時 3 回程度)。

### 9.3 順位計算
- 補欠リスト表示時には `ROW_NUMBER() OVER (PARTITION BY ticket_id ORDER BY applied_at)` で順位算出。
- 順位はオンザフライ計算、キャッシュは持たない (補欠が増減するため)。

### 9.4 競合制御
- 繰り上げ対象 (`waitlisted` 先頭) を `SELECT ... FOR UPDATE` でロック。
- 同時に複数キャンセルが発生しても、ロック順により決定論的に繰り上げが走る。

### 9.5 締切・開催後の停止
- バッチで終了済みイベントを判定し、繰り上げジョブをスキップする条件分岐。

---

## 10. 模倣実装する際の設計案

### 10.1 ドメインモデル
```ruby
class Participation < ApplicationRecord
  enum status: { pending_lottery: 0, accepted: 1, waitlisted: 2, cancelled: 3 }
  belongs_to :event
  belongs_to :ticket
  belongs_to :user

  after_update_commit :promote_next_waitlisted, if: :saved_change_to_cancelled?

  def saved_change_to_cancelled?
    saved_change_to_status? && status == 'cancelled' && status_before_last_save == 'accepted'
  end

  def promote_next_waitlisted
    PromoteWaitlistedJob.perform_later(ticket_id)
  end
end

class PromoteWaitlistedJob < ApplicationJob
  def perform(ticket_id)
    Ticket.transaction do
      ticket = Ticket.lock.find(ticket_id)
      accepted = Participation.where(ticket_id: ticket_id, status: :accepted).count
      return if accepted >= ticket.capacity

      next_participation = Participation
        .where(ticket_id: ticket_id, status: :waitlisted)
        .order(:applied_at)
        .lock
        .first
      return unless next_participation

      next_participation.update!(status: :accepted)
      PromotionMailer.with(participation: next_participation).notify.deliver_later
    end
  end
end
```

### 10.2 API
- `DELETE /api/events/:id/participations/me`
  - キャンセル処理。レスポンスに繰り上げ結果は含めない (非同期)。
- `GET /api/events/:id/participations/me`
  - 現在の自身のステータス、`waitlist_position` を返す。

### 10.3 通知
- 繰り上げイベントを `NotificationService` に流し、メール + サイト内通知を発行。

### 10.4 設定可能オプション (拡張案)
- `waitlist_auto_promote`: bool — 自動繰り上げを有効化するか。
- `waitlist_promotion_window`: minutes — 開催前 X 分以降は繰り上げ通知を停止。
- `waitlist_paid_confirm_window`: minutes — 有料枠の繰り上げ後、未決済が続けば再 cancel。

### 10.5 テスト観点
- 単純な繰り上げ (1人キャンセル → 1人昇格)
- 連鎖キャンセル (3人連続キャンセル → 順位通り 3人昇格)
- 並列キャンセル (2人同時キャンセル → ロックで決定論的に 2人昇格)
- 補欠ユーザー自身のキャンセル (繰り上げは発生しない)
- 主催者の強制キャンセル経由の繰り上げ
- 定員増加経由の繰り上げ (通知挙動も含む)
- 開催後のキャンセル時に繰り上げをスキップするか
- 有料枠での繰り上げ + 決済期限
