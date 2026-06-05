# connpass エンティティ間のリレーション

`entities.md` で定義した 20 エンティティの間の関連を、概念ベースで整理する。本ドキュメントでは多重度（1:1, 1:N, N:N）と所有関係、ASCII の ER 図、主要なクエリパターンを記述する。

---

## 1. 主要関連サマリ

| 親 | 関係 | 子 | 多重度 | 備考 |
|---|---|---|---|---|
| User | 所有 | OAuthIdentity | 1:N | プロバイダごとに 1 行 |
| User | 主催 | Group | N:N (via GroupAdmin) | role=owner/admin |
| Group | 公開 | Event | 1:N | イベントは必ず Group に属する |
| Event | 持つ | EventRole | 1:N | 1 イベント = 1〜N 参加枠 |
| EventRole | 受ける | Participant | 1:N | - |
| User | 申し込む | Event | N:N (via Participant) | - |
| Event | 紐づく | PresentationMaterial | 1:N | - |
| Event | 持つ | Comment | 1:N | スレッド構造あり |
| Event | 持つ | Survey | 1:N | - |
| Event | タグ付け | Tag | N:N (via EventTag) | - |
| User | 加入 | Group | N:N (via GroupMember) | - |
| Group | 拒否 | User | N:N (via GroupBlacklist) | - |
| User | 保存 | Event | N:N (via Bookmark) | - |
| Participant | 紐づく | Payment | 1:1 | - |
| Event | 統計 | EventStat | 1:1 | - |
| User | 受信 | Notification | 1:N | - |
| Event | 派生 | Event | 自己参照 1:N | parent_event_id (サブイベント / カンファレンス) |
| Survey | 持つ | SurveyQuestion | 1:N | - |
| SurveyQuestion | 持つ | SurveyAnswer | 1:N | - |
| User | 送信 | Message | 1:N | - |

---

## 2. 中核モデル: Group → Event → EventRole → Participant → User

connpass のドメインの中心。

```
+---------+     1   N   +-------+     1   N   +-----------+     1   N   +-------------+   N    1   +------+
|  Group  |------------>| Event |------------>| EventRole |------------>| Participant |---------->| User |
+---------+             +-------+             +-----------+             +-------------+           +------+
     |                      |                                                ^
     | 1:N (admins)         | 1:N (managers)                                 |
     v                      v                                                |
+-----------+         +--------------+                                       |
| GroupAdmin|         | EventManager |                                       |
+-----------+         +--------------+                                       |
     |                      |                                                |
     | N:1                  | N:1                                            |
     v                      v                                                |
+------+              +------+                                               |
| User |              | User |                                               |
+------+              +------+                                               |
                                                                             |
+------+   1   N   +-----------+   N   1   +-------+                         |
| User |---------->| GroupMember|--------->| Group |                         |
+------+           +-----------+           +-------+                         |
                                                                             |
+------+   1   N   +----------+   N   1   +-------+                          |
| User |---------->| Bookmark |---------->| Event |--------------------------+
+------+           +----------+           +-------+
```

ポイント:

- **Event は必ず Group に属する** — connpass で「グループに属さないイベント」は存在しない（ヘルプ Q&A に「イベントを他のグループへ移行することはできない」記載あり）。
- **EventRole がない Event は存在しない** — 「参加枠1」が自動で 1 行作成される。
- **Participant の status は遷移する** — pending → accepted / waiting → (cancel | promote) → attended (check_in_at セット時)。
- **User は Group に対し 2 種のロールを持ち得る** — GroupAdmin（管理権限）と GroupMember（購読権限）。両方に同時所属する。

---

## 3. 抽選と指名のリレーション

抽選方式の Event では Participant が `nominated` フラグを持ち、抽選 cron が `EventRole.recruitment_method=lottery` の枠に対して `applied_at` をシャッフルしつつ、`nominated=TRUE` を優先確定する。

```
                                              抽選 cron バッチ
                                              （lottery_announce_at の 0〜2時に実行）
+-----------+    1   N   +-------------+              |
| EventRole |----------->| Participant |<-------------+
| (lottery) |            | (status=pending,
+-----------+            |  nominated=t/f)
                         +-------------+
                                ↓ batch process
                         +-------------+    +-------------+
                         | Participant |    | Notification|
                         | (accepted   |--->| (lottery_   |
                         |  / waiting) |    |  result)    |
                         +-------------+    +-------------+
```

抽選後の繰り上がりについては、`EventRole.auto_promote_from_waiting=TRUE` のとき、`Participant.status=cancelled` が発生したら最も `waiting_position` の小さい補欠者を `accepted` に昇格し、`Notification(kind=promoted_from_waiting)` を発行する。

---

## 4. グループとユーザーの多対多: Member / Admin / Blacklist

ひとつの User は同じ Group に対して 3 つの関係を同時に持ち得る（実運用上は Blacklist と Member は排他的にすべき）。

```
                    +---------+
                    |  User   |
                    +---------+
                    /   |    \
                   /    |     \
           Member /  Admin     \ Blacklist
                 /      |       \
                v       v        v
            +-------------------+
            |       Group       |
            +-------------------+
```

クエリ例:
- 「あなたが所属しているグループの未開催イベント」: `Event JOIN GroupMember ON Event.group_id = GroupMember.group_id AND GroupMember.user_id = :uid WHERE Event.started_at > NOW()`
- 「ブラックリストに含まれているか」: 申込時に `EXISTS (SELECT 1 FROM GroupBlacklist WHERE group_id = :gid AND user_id = :uid)` でブロック。

---

## 5. サブイベントとカンファレンス (自己参照)

`Event.parent_event_id` を用いた自己参照リレーション。

```
+-------+        1   N        +-------+
| Event |-------------------->| Event |
|(親conf)|  parent_event_id   |(子セッション)
+-------+                     +-------+
```

カンファレンス特集機能では、親イベント 1 件の下に複数のセッション (子イベント) がぶら下がり、各セッション単位で参加枠と参加者を管理する。`series_event_position` でセッションの並び順を制御。

---

## 6. 通知の関連

Notification は User を受信者とし、起点となる Event / Group をオプションで持つ。

```
+---------+   N   1   +--------------+
| Event   |---------->| Notification |<---1---N--- User (recipient)
+---------+           +--------------+
+---------+   N   1          ^
| Group   |------------------+
+---------+
```

代表的な kind と発火元:

| kind | 発火タイミング | 関連エンティティ |
|---|---|---|
| event_published | Event.status → published | Event, GroupMember (受信者) |
| lottery_result | 抽選 cron 完了時 | Event, Participant |
| promoted_from_waiting | Cancel に伴う繰り上がり | Event, Participant |
| reminder_24h | 開催 24h 前 cron | Event, Participant |
| new_comment | Comment 作成時 | Event, 関連 User |
| message_from_organizer | Message 送信時 | Event/Group, Message |

---

## 7. 決済まわり

```
+-------------+   1   1   +---------+
| Participant |---------->| Payment |
+-------------+           +---------+
                              |
                              | N:1 (voucher 使用時)
                              v
                       +----------------+
                       | VoucherCode    |
                       +----------------+
                              |
                              | N:1
                              v
                          +-------+
                          | Event |
                          +-------+
```

- `EventRole.pricing_type=prepaid` の場合のみ Payment が必須。
- VoucherCode は Event に紐づき、使用すると Payment.voucher_code_id がセットされる。
- 返金は Payment.status = refunded + Participant.status = cancelled で表現。

---

## 8. アンケート

```
+-------+   1   N   +--------+   1   N   +---------------+   1   N   +--------------+
| Event |---------->| Survey |---------->| SurveyQuestion|---------->| SurveyAnswer |
+-------+           +--------+           +---------------+           +--------------+
                                                                            |
                                                                            | N:1
                                                                            v
                                                                     +-------------+
                                                                     | Participant |
                                                                     +-------------+
```

`Survey.trigger=on_apply` のとき、Participant 作成と同時に SurveyAnswer 作成 UI を表示。`trigger=after_event` のときは Event 終了後にメール通知でアンケート回答を促す。

---

## 9. タグとイベント

```
+-------+   N   N   +-----+
| Event |<--------->| Tag |
+-------+  EventTag +-----+
```

タグはイベント検索ファセットの主軸。Tag.usage_count はマテビュー or 非同期更新で集計。

---

## 10. 監査ログとイベント

AuditLog は任意のエンティティに対する polymorphic 関連（target_type + target_id）。Rails の `belongs_to :target, polymorphic: true` 相当の構造。これにより以下のような行が蓄積される:

```
+----------------------------------------------------------------------+
| AuditLog                                                              |
|  actor=User#42, action=event.update, target=Event#100,                |
|  metadata={ diff: {"limit": [50, 80]} }                               |
+----------------------------------------------------------------------+
+----------------------------------------------------------------------+
| AuditLog                                                              |
|  actor=User#42, action=participant.force_cancel,                      |
|  target=Participant#9001, metadata={ reason: "重複申込" }            |
+----------------------------------------------------------------------+
```

---

## 11. 推奨インデックス戦略

| クエリ用途 | 対象テーブル | 推奨インデックス |
|---|---|---|
| 新着イベント | Event | `(status, published_at DESC)` |
| カレンダー検索 | Event | `(started_at)` Btree |
| グループ別イベント | Event | `(group_id, started_at DESC)` |
| ユーザーの申込履歴 | Participant | `(user_id, applied_at DESC)` |
| 出席チェック | Participant | `(event_id, status, check_in_at)` |
| タグ検索 | EventTag | `(tag_id, event_id)` |
| 地理検索 | Event | GIST `(lat, lon)` |
| 全文検索 | Event | GIN `to_tsvector('japanese', title || ' ' || description)` |

---

## 12. ER 図 (全体俯瞰)

```
  ┌────────────┐
  │ OAuthIdent.│
  └─────▲──────┘
        │ N:1
        │
  ┌─────┴───────┐ 1:N  ┌──────────────┐
  │    User     │─────►│ Notification │
  └──┬──┬──┬──┬─┘      └──────────────┘
     │  │  │  │
     │  │  │  └────────────┐
     │  │  └──────┐         │
     │  └─┐        │         │
     │    │        │         │
     ▼    ▼        ▼         ▼
┌────────┐ ┌──────────┐ ┌────────────┐ ┌──────────┐
│Bookmark│ │GroupMember│ │GroupAdmin  │ │Participant│
└───┬────┘ └─────┬─────┘ └─────┬──────┘ └─────┬─────┘
    │            │              │              │
    │            │              │              │
    │            ▼              ▼              ▼
    │      ┌──────────────────────────┐   ┌──────────┐
    │      │          Group           │◄──┤EventRole │
    │      └────────┬─────────────────┘   └─────▲────┘
    │               │ 1:N                       │ N:1
    │               ▼                           │
    │           ┌───────┐                       │
    └──────────►│ Event │───────────────────────┘
                └───┬───┘
                    │ 1:N (self ref:子セッション)
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   ┌────────┐ ┌──────────┐ ┌──────┐
   │Comment │ │Presentat.│ │Survey│
   └────────┘ └──────────┘ └──┬───┘
                              │
                              ▼
                       ┌───────────────┐
                       │SurveyQuestion │
                       └───────┬───────┘
                               │
                               ▼
                       ┌───────────────┐
                       │ SurveyAnswer  │
                       └───────────────┘
```

---

## 13. ドメイン不変条件 (Invariants)

設計上保たねばならない代表的な不変条件:

1. **Event.group_id は NOT NULL** — どのイベントもいずれかのグループに所属する。
2. **Event.recruitment_method=lottery のとき lottery_announce_at は NOT NULL** — DB レベルの CHECK 制約。
3. **Event.recruitment_method=lottery のとき accepts_from < lottery_announce_at <= started_at**。
4. **Participant.status=cancelled のとき cancelled_at IS NOT NULL**。
5. **Participant.status=attended のとき check_in_at IS NOT NULL かつ accepted_at IS NOT NULL**。
6. **EventRole.capacity の総和 ≦ Event.capacity** (Event.capacity が NULL のときはチェック不要)。
7. **Participant.event_id = EventRole.event_id** — 整合性は FK + アプリ層 validation。
8. **GroupBlacklist にあるユーザーは GroupMember を保有できない** — トリガまたはアプリ層で排他。
9. **EventRole.pricing_type=prepaid のとき price > 0**。
10. **Event.visibility=draft のときは Notification(kind=event_published) を発行しない**。

これらの不変条件は次の `enums-and-states.md` でステート遷移と合わせてさらに詳細化する。
