# 通知 (メール・サイト内通知)

connpass.com の通知システム (メール + サイト内通知) の種類・トリガー・設定方法を整理する。

---

## 1. 機能の目的とユーザーバリュー

### 目的
- ユーザーがイベント情報を取りこぼさないように、適切なタイミングで適切なチャネル (メール / サイト内) に届ける。
- 主催者が参加者に向けて、定型的な連絡 (リマインダー等) を手動で送らなくても済むようにする。
- 「申込から終了後まで」のイベントライフサイクル全体をカバーする。

### ユーザーバリュー
- **参加者**: 申込確定・抽選結果・繰り上げ・前日リマインダーが自動で届く。新着イベントもプッシュされ、能動的に検索しなくてもよい。
- **主催者**: 新規申込・キャンセル通知で参加者動向を把握。一括メッセージで全員に告知できる。
- **コミュニティ**: グループに所属しているだけで継続的に情報が流れ、コミュニティ活動が活性化する。

---

## 2. 関連するエンティティとフィールド

### NotificationPreference (ユーザー設定)
| Field | 型 | 説明 |
|---|---|---|
| user_id | int | 対象ユーザー |
| email_event_followed_user | bool | フォローユーザーのイベント開催通知 |
| email_followed_user_join | bool | フォローユーザーの参加通知 |
| email_my_event_new_participant | bool | 自分主催イベントの新規参加 |
| email_reminder_day_before | bool | 開催前日リマインダー |
| email_news_letter | bool | サービスニュースレター |

### GroupNotificationPreference (グループ単位)
| Field | 型 | 説明 |
|---|---|---|
| group_id | int | 対象グループ |
| user_id | int | 対象ユーザー |
| on_event_published | bool | イベント公開通知 |
| on_recruitment_start | bool | 参加募集開始通知 |
| on_recruitment_end_1day | bool | 参加募集終了 1 日前通知 |
| on_speaker_recruitment_start | bool | 登壇者募集開始 |
| on_speaker_recruitment_end_1day | bool | 登壇者募集終了 1 日前 |
| on_sponsor_recruitment_start | bool | スポンサー募集開始 |
| on_sponsor_recruitment_end_1day | bool | スポンサー募集終了 1 日前 |
| on_material_added | bool | 新規資料追加通知 |

### Notification (サイト内通知)
| Field | 型 | 説明 |
|---|---|---|
| id | int | 通知 ID |
| user_id | int | 通知対象 |
| type | enum | 通知種別 |
| payload | json | 関連リソースID・テキスト |
| read_at | datetime | 既読日時 |
| created_at | datetime | 発生日時 |

### MailLog
| Field | 型 | 説明 |
|---|---|---|
| user_id | int | 配信先 |
| template_id | string | テンプレート識別子 |
| sent_at | datetime | 送信日時 |
| status | enum | sent / bounced / failed |

---

## 3. 通知種別一覧

### 3.1 参加者向け (自身のアクションに紐づく)
| 種別 | チャネル | トリガー | 受信制御可否 |
|---|---|---|---|
| 申込完了 | メール | 申込成功 | 不可 (システム必須) |
| 抽選当選 | メール | 抽選バッチ実行時 | 不可 |
| 抽選落選 (補欠化) | メール | 抽選バッチ実行時 | 不可 |
| 補欠繰り上げ | メール | 上位キャンセル発生時 | 不可 |
| キャンセル完了 | メール | 自身がキャンセル時 | 不可 |
| 強制キャンセル | メール | 主催者の操作時 | 不可 |
| 開催前日リマインダー | メール | 開催前日バッチ | 可 (設定で停止可) |
| イベント中止通知 | メール | 主催者が中止操作 | 不可 |
| 主催者からの一括メッセージ | メール | 主催者の送信操作 | 不可 (受信拒否不可、退会で対応) |

### 3.2 主催者向け
| 種別 | チャネル | トリガー |
|---|---|---|
| 新規参加申込 | メール / サイト内 | 参加者の申込成功 |
| 参加キャンセル | メール / サイト内 | 参加者のキャンセル |
| 補欠繰り上げ実行 | サイト内 | 自動繰り上げ実行時 |

### 3.3 グループ通知
| 種別 | チャネル | トリガー | 設定 |
|---|---|---|---|
| グループイベント公開 | メール | グループ管理者がイベント公開 | グループ別 ON/OFF |
| 参加募集開始 | メール | 募集開始日時 (accepted_start_at) 到達 | 同上 |
| 参加募集終了 1 日前 | メール | 募集終了 24h 前 | 同上 |
| 登壇者募集開始 / 終了前 | メール | 同上 | 同上 |
| スポンサー募集開始 / 終了前 | メール | 同上 | 同上 |
| 資料追加 | メール | 主催者が資料アップロード | 同上 |
| グループ一括メッセージ | メール | グループ管理者送信 | 不可 (退会で対応) |

### 3.4 ソーシャル系
| 種別 | チャネル | トリガー |
|---|---|---|
| フォローユーザーのイベント開催 | メール | フォロー対象がイベント主催 |
| フォローユーザーの参加 | メール | フォロー対象がイベントに申込 |
| Facebook 友人のイベント | メール | FB 連携経由のおすすめ |

### 3.5 サイト内通知 (推測)
- 申込状況更新, 繰り上げ, 抽選結果, 主催者メッセージ等を、ヘッダーのベルアイコンに集約。

---

## 4. 状態遷移図 (通知ライフサイクル)

```
[イベント / システム アクション発生]
                |
                v
       [通知イベントを発火]
                |
                v
        [配信対象を解決]
        (preferences確認)
                |
       +--------+--------+
       |                 |
       v                 v
[メール送信ジョブ]   [サイト内通知 INSERT]
       |                 |
       v                 v
  [SMTP / SES]      [Notification.read_at = NULL]
       |                 |
       v                 v
   [配信状態記録]   [既読時に更新]
```

### リマインダーバッチ
```
[Cron 毎時 / 毎日0時]
        |
        v
[開催 24h 後のイベント抽出]
        |
        v
[該当 accepted ユーザー取得]
        |
        v
[reminder_preference = true のみ抽出]
        |
        v
[reminder mail enqueue]
```

---

## 5. ルール・制約

### 5.1 受信拒否可否
- **トランザクション系 (申込確定・繰り上げ・抽選結果・中止)**: 受信拒否不可。サービス利用上必須の連絡。
- **リマインダー / グループ通知 / フォロー通知**: 受信拒否可。
- **主催者一括メッセージ / グループ一括メッセージ**: 受信拒否不可。受信を止めたい場合はイベントキャンセル / グループ退会。

### 5.2 タイミング
- 開催前日リマインダー: 開催日の前日 (定刻バッチ、例: 10:00 配信)。
- 抽選結果: `lottery_at` の 0:00〜2:00 頃の自動バッチ実行直後。
- 補欠繰り上げ: 上位ユーザーのキャンセルと同時 (リアルタイム / 直後)。
- 募集締切 1 日前グループ通知: `accepted_end_at - 24h` のタイミング。

### 5.3 配信先解決
- グループ通知は `GroupNotificationPreference.user_id` + `group_roles` から `member` ・ `guest_member` を抽出。
- 通知設定 (1 つでもチェックが入っていれば送る、全 OFF なら送らない) は項目別に判定。
- ユーザーが退会済みグループ宛は配信しない。

### 5.4 一括メッセージ
- 主催者一括メッセージは「対象選択」で `共同管理者 / 発表者 / 参加者 / 補欠者` から複数選択可能。
- キャンセル済みユーザー宛のメッセージは送信不可。
- 一括メッセージは通知設定にかかわらず必ず受信する仕様。

### 5.5 配信頻度
- 同一ユーザーへの同種通知が短時間に多発する場合は集約 (推測)。
  - 例: 主催イベントへ 5 件連続で申込があった場合、まとめて 1 件に集約。

### 5.6 ハンドオフ
- 配信失敗時 (バウンス・ハードバウンス) はメールアドレスを suspended にする。
- 連続バウンス時にメール送信を停止し、ユーザーに「メールアドレス更新を促す」サイト内通知を出す (推測)。

---

## 6. ユーザー視点のフロー

### 6.1 通知を受け取る
1. イベントに申込 → 申込確定メール受信。
2. 抽選イベントなら抽選発表日に当落メール受信。
3. 補欠だったがキャンセル発生 → 繰り上げメール受信。
4. 開催前日 → リマインダーメール受信 (出席コード / 受付票 URL を含む)。

### 6.2 通知設定を変更
1. 設定ページ (`/setting/`) を開く。
2. 「メール通知設定」「グループのメール通知設定」のチェックボックスを操作。
3. 「保存する」を押下で確定。
4. 設定変更は次の通知から反映。

### 6.3 グループ通知を止める
1. 受信不要なグループのページへ。
2. 「グループを退会する」ボタン押下。
3. 以降そのグループの通知を一切受信しない。

---

## 7. 主催者視点のフロー

### 7.1 イベント公開時
1. 「公開する」を押下。
2. グループ紐づけイベントなら、グループメンバー全員に「イベント公開」通知配信。
3. 主催者にはサイト内に「新規参加申込」通知が逐次蓄積。

### 7.2 一括メッセージ送信
1. 参加者管理画面の「一括メッセージ」を開く。
2. 対象を選択 (共同管理者 / 発表者 / 参加者 / 補欠者)。
3. メッセージ本文を入力 → 送信。
4. 通知設定に関わらず全員に届く。

### 7.3 リマインダー連動
- 主催者は前日リマインダーの文面に出席コード等を埋め込めない (=固定テンプレ)。会場詳細は `limited_description` 経由で参加者限定情報として表示。

---

## 8. 関連 UI

| 画面 | コンポーネント |
|---|---|
| 設定ページ (`/setting/`) | メール通知設定セクション (チェックボックス + 保存ボタン) |
| 設定ページ (`/setting/`) | グループ別メール通知設定 (グループごとに 8 項目) |
| ヘッダー (ベルアイコン) | サイト内通知ドロップダウン、未読バッジ |
| 一括メッセージ画面 (`/event/:id/message/`) | 対象選択チェックボックス、本文エディタ |
| メール (各種) | テンプレート + 動的差し込み (イベント名・日時・URL) |

---

## 9. エッジケース

| ケース | 挙動 |
|---|---|
| メールアドレス未確認ユーザー | そもそも申込できないので通知対象外 |
| 退会済みユーザー | 通知対象から除外 |
| バウンス連発 | 自動的に送信停止フラグ。サイト内通知のみで案内 |
| 主催者が大量グループに対しメッセージ送信 | レートリミット (1 日 N 件等) |
| 抽選バッチ失敗 | 翌日リトライ。失敗中は当落メールが届かないので、運用上監視が必要 |
| イベント中止と前日リマインダーの競合 | 中止後はリマインダーをキャンセル |
| 一括メッセージ重複送信 | サーバ側で `message_id` のべき等性保証 |
| グループ通知 ON のユーザーが管理者に昇格 | 管理者にも同じ通知が届く (重複送信は許容、自動 OFF はしない) |
| 開催前日リマインダーがオンラインイベント | リマインダーに参加 URL が含まれる |
| 強制キャンセルされたユーザー宛のメッセージ | キャンセル時のシステムメッセージとは別に主催者メモ送信可 |
| 大量キャンセル時の補欠繰り上げ通知 | 1 件ずつメール送信 (まとめないと連鎖が伝わらない) |

---

## 10. 推測される内部処理

### 10.1 配信パイプライン
```
[Domain Event] -> [Event Bus] -> [Notification Worker]
                                       |
                  +--------------------+--------------------+
                  |                                         |
           [Resolve Recipients]              [Create In-App Notification]
                  |
           [Filter by Preference]
                  |
           [Render Template]
                  |
           [Enqueue Email Job]
                  |
           [SES / Postfix Relay]
                  |
           [Update MailLog]
```

### 10.2 ジョブキュー
- Sidekiq / Resque / Cloud Tasks を想定。
- リトライ: 失敗時は指数バックオフで 3〜5 回。
- DLQ: 失敗ジョブを別キューに退避。

### 10.3 バッチ処理
- 開催前日リマインダー: `cron` で毎日 10:00 実行、`started_at` BETWEEN now+24h AND now+25h のイベント抽出。
- 募集締切 1 日前: 毎時実行、`accepted_end_at` BETWEEN now+24h AND now+25h を抽出。
- 抽選結果: 毎日 0:00 実行、`lottery_at = today` のイベント抽選後にメール一斉送信。

### 10.4 設定保存
- 「保存する」ボタンで全項目を 1 トランザクションで upsert。
- グループ通知は `GroupNotificationPreference` の行を更新。

### 10.5 集約 (抑制)
- 短時間多発の通知は 5 分単位でバッチング。
- 例: `pending_notifications` テーブルに溜め、5 分後に集約メール送信。

### 10.6 メールテンプレート
- I18n 対応。日本語ベース。
- リッチ HTML + プレーンテキストの両方を生成。
- 件名と本文に「イベント名」「日時」「URL」を埋め込み。

### 10.7 サイト内通知
- WebSocket または Server-Sent Events で push (推測)。
- 未読数はヘッダーバッジに反映。
- 既読化はクリック時に `read_at = NOW()`。

---

## 11. 模倣実装する際の設計案

### 11.1 ドメインイベント設計
```python
class DomainEvents:
    PARTICIPATION_CONFIRMED = "participation.confirmed"
    PARTICIPATION_LOTTERY_DRAWN = "participation.lottery_drawn"
    PARTICIPATION_PROMOTED = "participation.promoted"
    PARTICIPATION_CANCELLED = "participation.cancelled"
    EVENT_PUBLISHED = "event.published"
    EVENT_CANCELLED = "event.cancelled"
    EVENT_REMINDER_DUE = "event.reminder_due"
    BULK_MESSAGE_SENT = "event.bulk_message"
```

### 11.2 通知ハンドラ
```python
@subscribe(DomainEvents.PARTICIPATION_PROMOTED)
def on_promoted(event):
    participation = Participation.get(event.participation_id)
    NotificationService.send(
        user=participation.user,
        template="promotion",
        context={ "event": participation.event, "ticket": participation.ticket },
        channel=("email", "in_app"),
        forced=True,  # 設定で停止不可
    )
```

### 11.3 設定モデル
```python
class NotificationPreference(BaseModel):
    user_id: int
    email_event_followed_user: bool = True
    email_reminder_day_before: bool = True
    email_news_letter: bool = True
    # ... 他項目

class GroupNotificationPreference(BaseModel):
    user_id: int
    group_id: int
    on_event_published: bool = True
    on_recruitment_start: bool = True
    on_recruitment_end_1day: bool = True
    # ...
```

### 11.4 配信エンジン
- 抽象 `NotificationChannel` インターフェース (email, in_app, push)。
- レンダラ: Jinja2 / Liquid。
- フィルタリング: `forced=True` は preference 無視。
- べき等性: `idempotency_key = hash(event_id, user_id, template, version)` で重複送信防止。

### 11.5 バッチ
- Airflow / Celery beat で定時バッチ。
- 冪等性: 同日に複数回実行されても重複送信しないよう `notification_log` テーブルで送信履歴を確認。

### 11.6 計測
- 配信成功率、開封率 (UTM 付与)、クリック率。
- 一括メッセージのスパムスコア監視。

### 11.7 テスト観点
- 通知設定 OFF 時のスキップ。
- forced 通知の通過。
- 同一通知のべき等性 (二重送信防止)。
- バッチの境界 (24h 前のちょうど境界線で送信されるか)。
- 退会済みユーザーへの送信抑止。
- 抽選バッチ失敗時のリトライ。
