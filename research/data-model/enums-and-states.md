# connpass の Enum と状態遷移

connpass を観察した結果、いくつかのエンティティが明確な状態を持ち、UI 表示・通知・権限制御に影響している。本書では各 Enum を列挙し、状態遷移図と業務ルールを記述する。

---

## 1. Event.status (イベント全体の状態)

```
draft ──publish()──► published ──close()──► closed
   │                      │
   │                      └──cancel()──► cancelled
   │
   └──delete()──► (物理削除 or hidden)
```

| 値 | 意味 | UI 露出 | 受付可否 |
|---|---|---|---|
| draft | 編集中・非公開 | 主催者ダッシュボードのみ | 不可 |
| published | 公開済み・募集中 | 検索・トップ・グループページ | 募集期間内のみ可 |
| closed | 募集締切後 | 「募集終了」バッジ | 不可 |
| cancelled | 開催中止 | 「開催中止」バッジ | 不可、自動全員キャンセル |

ヘルプの「イベント管理」FAQ に「イベント削除はできるか」「削除すると参加者にどう影響するか」の項目があり、`cancelled` を経由してから物理削除する 2 段階運用と推測。

---

## 2. Event.event_format (開催形式)

| 値 | 説明 | UI 例 |
|---|---|---|
| offline | 物理会場 | 「会場: 東京都千代田区...」 |
| online | オンライン | 「オンライン」バッジ、`online_url` を参加確定者にのみ表示 |
| hybrid | 物理+オンライン | 両方の情報を併記 |

---

## 3. Event.recruitment_method (受付方式)

| 値 | 意味 | 申込直後の挙動 |
|---|---|---|
| fcfs | 先着順 (first-come-first-served) | 即時 accepted or waiting |
| lottery | 抽選 | pending のまま `lottery_announce_at` まで保留 |

ヘルプの「抽選方式で参加者を募集する」記述から:
- 抽選は 0〜2 時に自動実行。
- 抽選発表日以降の申込は自動的に先着順に切り替わる。

---

## 4. Event.visibility (公開範囲)

| 値 | 説明 |
|---|---|
| public | 検索・トップに出る公開イベント |
| private_link | URL を知る人のみ閲覧 (FAQ「プライベートイベント」項目あり) |
| draft | 主催者しか見えない |

> 注: connpass は「グループ非公開設定はない」と明言しているが、イベント単位の private_link は「プライベートイベントを作成できますか」の FAQ 通り存在する。

---

## 5. EventRole.recruitment_method (参加枠単位の方式)

| 値 | 説明 |
|---|---|
| fcfs | 先着順 |
| lottery | 抽選 (Event.recruitment_method=lottery 時のみ有効) |
| designated | 指名のみ（招待制） |

---

## 6. EventRole.pricing_type (料金タイプ)

| 値 | 説明 |
|---|---|
| free | 無料 |
| on_site | 会場払い |
| prepaid | 事前決済 (PayPal) |

---

## 7. Participant.status (参加申込の状態)

最も複雑な遷移を持つ Enum。

```
                 申込
                  │
        ┌─────────┼──────────┐
        │         │          │
        ▼         ▼          ▼
   accepted    waiting     pending     ← lottery 抽選前
    (先着)     (補欠)        │
        │         │          │ 抽選cron
        │         │          ▼
        │         │     accepted / waiting
        │         │
        │  promote│
        │◄────────┤ (上位キャンセル時)
        │         │
        ▼         ▼
   ┌────────┐  ┌────────┐
   │attended│  │no_show │
   └────────┘  └────────┘
        ▲         ▲
        │         │
        │  cancel │
        │◄────────┤
        ▼
   cancelled
```

| 値 | 説明 | 遷移元 |
|---|---|---|
| pending | 抽選方式の申込で発表前 | (新規) |
| accepted | 参加確定 | pending(lottery), waiting(promote), (新規 fcfs) |
| waiting | 補欠登録 | pending(lottery), (新規 fcfs at full) |
| cancelled | キャンセル | accepted, waiting, pending |
| attended | 出席確定 | accepted (check_in 時) |
| no_show | 欠席 | accepted (イベント終了 + 出席チェック無し) |

業務ルール:
- `accepted` → `cancelled` で `EventRole.auto_promote_from_waiting=TRUE` なら waiting 先頭を accepted に昇格、`Notification(promoted_from_waiting)` 発火。
- `attended` は check_in_at にタイムスタンプを記録し、`check_in_method` (manual / code / qr) も同時に記録。
- `no_show` は終了 24h 後の cron で `accepted` のまま check_in_at NULL のレコードに対しバッチで遷移。

---

## 8. Participant.check_in_method

| 値 | 説明 |
|---|---|
| manual | 主催者が管理画面で出席ボタン押下 |
| code | 出席コード入力による自己出席 |
| qr | 主催者が参加者の QR を読み取り |

---

## 9. Payment.status

```
pending ──succeed()──► succeeded ──refund()──► refunded
   │
   └──fail()──► failed
```

| 値 | 説明 |
|---|---|
| pending | 決済リクエスト発行済み未確定 |
| succeeded | PayPal 完了 |
| refunded | 返金済み（イベントキャンセル時） |
| failed | 決済失敗 |

---

## 10. User.status

| 値 | 説明 | UI |
|---|---|---|
| active | 通常利用 | プロフィール表示 |
| suspended | 運営による一時凍結 | ログイン不可 |
| withdrawn | 退会 | 「退会ユーザー」と表示、過去参加者リスト等にも反映 |

ヘルプの「退会する」「退会ユーザー」とは何かの FAQ から、論理削除のうえ匿名化された表示が行われると推測。

---

## 11. Group.status

| 値 | 説明 |
|---|---|
| active | 通常運用 |
| archived | 活動終了。新規イベント作成不可、説明にアーカイブ表記 |

FAQ「グループは削除できるか」では「メンバーやイベントがあるグループは削除できない」と明示されているため、`archived` をライフサイクル終端として推奨する。

---

## 12. GroupMember.joined_via

| 値 | 説明 |
|---|---|
| manual | メンバーになるボタン |
| event_join | 関連イベントへの申込で自動加入 |
| admin_add | 管理者が CSV/TSV でインポート |

---

## 13. GroupAdmin.role

| 値 | 説明 | 権限 |
|---|---|---|
| owner | 最初の作成者 | 全権限 + 管理者の追加削除 |
| admin | 共同管理者 | グループ編集・メッセージ送信・イベント管理 |

---

## 14. Notification.kind (通知種別)

| 値 | 受信者 | 発火元 |
|---|---|---|
| event_published | グループメンバー | Event.publish |
| lottery_result | 申込者 | 抽選 cron |
| promoted_from_waiting | 補欠者 | 上位の cancel |
| reminder_24h | 参加確定者 | 24h 前 cron |
| reminder_1h | 参加確定者 | 1h 前 cron (オンライン) |
| new_comment | 主催者 / コメントスレッド参加者 | Comment 作成 |
| comment_reply | 親コメント作者 | Comment 返信 |
| message_from_organizer | audience に該当する参加者 | Message.send |
| survey_request | 参加者 | Survey.trigger=after_event |
| payment_succeeded | 申込者 | Payment.succeed |
| payment_refunded | 申込者 | Payment.refund |
| group_message | グループメンバー | グループ一斉メッセージ |
| event_cancelled | 申込者全員 | Event.cancel |
| event_updated | 参加確定者 | 重要フィールド更新時 (会場、日時) |
| bookmark_event_started | ブックマーク者 | イベント開始 |

---

## 15. Notification.channel

| 値 | 説明 |
|---|---|
| email | メール送信 (デフォルト) |
| in_app | サイト内通知センター |
| push | モバイル向けプッシュ (将来) |

ユーザー設定で `receive_notification_email`, `receive_reminder_email`, `receive_recommendation_email` を切り替え可能（FAQ「メール配信を停止したい」項目あり）。

---

## 16. Survey.trigger

| 値 | 説明 |
|---|---|
| on_apply | 申込時にフォーム表示。pricing 設定と組み合わせて参加条件確認に利用 |
| after_event | 開催後にメールでフォーム URL を送信 |

---

## 17. SurveyQuestion.input_type

| 値 | 説明 |
|---|---|
| text | 単一行テキスト |
| textarea | 複数行テキスト |
| single | ラジオボタン |
| multi | チェックボックス |
| scale | 5 段階評価 |

---

## 18. Message.audience (一括メッセージ送信先)

| 値 | 対象 |
|---|---|
| accepted | 参加確定者全員 |
| waiting | 補欠者 |
| cancelled | キャンセル者 |
| all | 申込履歴がある全員 |
| group_members | グループメンバー全員 (Message.group_id 必須) |

---

## 19. AuditLog.action (代表的なアクション)

| 値 | 説明 |
|---|---|
| user.login_success | - |
| user.login_failed | 不正検知用 |
| user.password_change | - |
| user.withdraw | 退会 |
| group.create | - |
| group.update | diff を metadata に記録 |
| group.archive | - |
| event.create | - |
| event.publish | - |
| event.update | - |
| event.cancel | - |
| event.delete | - |
| participant.apply | - |
| participant.cancel | - |
| participant.force_cancel | 主催者による強制キャンセル |
| participant.check_in | - |
| payment.refund | - |
| message.send | - |
| blacklist.add | - |
| blacklist.remove | - |

---

## 20. 状態遷移を機械的に保証する仕組み

1. **DB CHECK 制約**: 単純な値域はカラムレベルで縛る (例: `status IN (...)`)。
2. **遷移テーブル**: アプリ層で `from_status × event → to_status` のテーブルを持ち、許可されない遷移を弾く。
3. **冪等な状態遷移**: 抽選 cron や繰り上がりは「現在の状態が pending か waiting のときのみ遷移」のように冪等にする。
4. **AuditLog の自動付与**: 状態遷移ハンドラ内で AuditLog 記録を必須化。
5. **通知の遅延発火**: 状態遷移コミット後に Notification を非同期キューに enqueue（Outbox パターン）。

これらにより、「補欠の繰り上がり通知」「抽選結果メール」「開催前日のリマインダー」など、connpass の主要ユーザー体験の信頼性を担保する。
