# グループの権限管理 (Group Roles)

connpass.com のグループ機能における「管理者」「運営メンバー」「所属メンバー」に相当する役割の権限差を整理する。connpass の公式用語上、明示的に存在するのは「グループ管理者」と「グループメンバー」の 2 階層だが、運用実態として「イベント単位の管理者 (= 運営メンバー)」が独立した役割として機能している。

---

## 1. 機能の目的とユーザーバリュー

### 目的
- 長期的に活動するコミュニティ (= グループ) を、複数の運営者で共同管理できる仕組みを提供する。
- 「コミュニティに所属している = 自動的にイベント情報を受け取る」関係性を形成する。
- 主催者の個人アカウント依存を避け、共同管理者を立てることで継続性を担保する。

### ユーザーバリュー
- **グループ運営**: 複数管理者で運営の負荷分散・引き継ぎが可能。情報配信先 (メンバー) を継続的に保持できる。
- **メンバー**: 興味のあるコミュニティをフォローすることで、新着イベント情報を取りこぼさない。
- **個人主催者**: 自分が忙しい時期に共同管理者に運営を委譲できる。

---

## 2. 関連するエンティティとフィールド

### Group
| Field | 型 | 説明 |
|---|---|---|
| id | int | グループ ID |
| subdomain | string | サブドメイン (例: `hoge.connpass.com`)。**作成後変更不可** |
| name | string | グループ名 |
| description | text | グループ紹介文 (Markdown) |
| website | string | 外部 URL |
| owner_user_id | int | 作成者 (= 最初のオーナー) |
| created_at | datetime | 作成日時 |

### GroupRole (権限テーブル)
| Field | 型 | 説明 |
|---|---|---|
| group_id | int | 対象グループ |
| user_id | int | 対象ユーザー |
| role | enum | `owner` / `admin` / `member` / `guest_member` |
| email | string | guest_member 用。未登録ユーザーをメール経由で紐づける |
| joined_at | datetime | 加入日時 |
| auto_joined | bool | イベント参加経由で自動加入したか |

### EventAdmin (イベント管理者 = 運営メンバー扱い)
| Field | 型 | 説明 |
|---|---|---|
| event_id | int | 対象イベント |
| user_id | int | 共同管理者 |
| invited_by | int | 招待した管理者 |

---

## 3. 状態遷移図

### グループ加入経路
```
[未加入ユーザー]
    |
    +-- グループ詳細「メンバーになる」ボタン押下
    |       |
    |       v
    |   [member]
    |
    +-- グループ紐づきイベントに参加
    |       |
    |       v
    |   [member]  (auto_joined = true)
    |
    +-- 管理者がメールアドレスで追加
            |
            +-- 既存ユーザーあり -> [member]
            +-- 未登録メール    -> [guest_member]
                                       |
                                       | 後日 connpass 登録
                                       v
                                   [member] に昇格 (推測)
```

### 役割昇格・降格
```
[member] --管理者に任命--> [admin]
[admin]  --管理者解除--> [member]
[admin]  --グループ退会--> 退会済 (admin 権限消失)
[owner]  --原則固定--> 譲渡なし (公式機能としては明示されていない)
```

### グループ退会
```
[member / admin / guest_member]
       |
       | 退会ボタン
       v
   [退会済]
       (通知・メッセージ受信停止)
```

---

## 4. 権限マトリクス

| 機能 | owner | admin (共同管理者) | event admin (運営メンバー) | member (所属) | guest_member | 一般ユーザー |
|---|---|---|---|---|---|---|
| グループ作成 | 作成本人 | - | - | - | - | 誰でも可 |
| グループ情報編集 | o | o | - | - | - | - |
| サブドメイン変更 | x (作成時のみ) | x | - | - | - | - |
| 共同管理者追加 | o | o | - | - | - | - |
| メンバー追加 (CSV) | o | o | - | - | - | - |
| メンバー削除 | o | o | - | - | - | - |
| グループ一括メッセージ送信 | o | o | - | - | - | - |
| イベント作成 (グループ紐付け) | o | o | - | - | - | - |
| イベント編集 | o | o | o (自分が作成 or 招待されたイベント) | - | - | - |
| イベント参加者管理 | o | o (※グループ管理者 = 自動的にイベント編集権限を持つかは要確認) | o (受付・出席チェック) | - | - | - |
| 一括メッセージ送信 (イベント) | - | - | o | - | - | - |
| 強制キャンセル | - | - | o | - | - | - |
| グループメンバー一覧閲覧 | o | o | - | o (自身が所属) | - | - |
| グループ通知メール受信 | o | o | - | o | o | - |
| イベント申込 | o | o | o | o | o (要本登録) | o |
| グループ退会 | - | o | - | o | o | - |

注: connpass 公式ヘルプでは「管理者」「メンバー」の 2 階層のみが明言されている。本表における「event admin (運営メンバー)」は、イベント編集ページで「共同管理者」として追加されるが、グループの管理者とは別個に管理されるものを指す (= 特定イベントのみの管理権限)。

---

## 5. ルール・制約

### 5.1 グループ作成・所有
- 任意のユーザーがグループを作成可能 (無料)。
- 作成者が `owner` ロールを取得。
- サブドメインは作成後変更不可。

### 5.2 共同管理者の追加
- グループ編集画面で connpass ユーザー名を入力し、サジェストから選択して追加。
- 追加できる人数の上限は公開情報からは不明 (実用上の上限あり)。
- 共同管理者はグループ情報の編集・メッセージ送信・メンバー管理が可能。

### 5.3 メンバー追加
- 「メンバーになる」ボタンによるユーザー自発的加入。
- グループ紐づけイベントに参加した時の自動加入。
- 管理者による CSV / TSV インポート (`名前,メールアドレス`)。
  - 既存ユーザー: `member` として追加。
  - 未登録メール: `guest_member` として追加 (メール通知のみ)。

### 5.4 ゲストメンバー (guest_member)
- 名前とメールアドレスのみで識別。
- 通知受信可能なメール種別:
  - イベント公開通知
  - 資料追加通知
  - 募集開始通知
  - グループ一括メッセージ
- ログインしないため、ボタン操作・申込はできない。
- 後日 connpass 登録 + 同メールでログインすると `member` に昇格 (推測)。

### 5.5 メンバー削除
- グループ管理者がメンバー一覧画面で対象を選択し、「メンバーを削除」ボタン。
- 削除時、対象メンバーに通知は飛ばないと推測 (要検証)。

### 5.6 イベント管理者 (共同管理者) の追加
- イベント編集ページで connpass ユーザー名を入力し追加。
- イベント単位で完結する権限なので、グループの共同管理者になる必要はない。
- 「イベント作成者と同等」の権限を持つ (編集・参加者管理・メッセージ送信)。
- グループに紐づけたイベントは、グループ管理者も基本的に編集可能と推測 (グループの共同所有関係)。

### 5.7 退会
- メンバー自身の操作で退会可能。
- 退会後はそのグループの通知・メッセージを一切受信しない。
- 退会してもイベント参加履歴は維持される (推測)。

### 5.8 迷惑防止
- 「大量メンバー追加 / 大量メッセージ送信は機能停止やアカウント削除の対象」とヘルプに明記。
- 実装上はレートリミットや不正検知が想定される。

---

## 6. ユーザー視点のフロー

### 6.1 メンバーになる (所属する)
1. グループページにアクセス。
2. 「メンバーになる」ボタンを押下。
3. グループ詳細・新着イベント等の通知を受信し始める。
4. トップページに「所属グループ一覧」が表示される。

### 6.2 イベント参加によって自動加入
1. グループに紐づくイベントに申込。
2. 自動的に `member` として加入 (auto_joined = true)。
3. 退会したい場合はグループページの「グループを退会する」を押す。

### 6.3 退会
1. グループページの「退会」ボタンを押下。
2. 確認ダイアログ → 退会。
3. 以降そのグループの通知が来なくなる。

---

## 7. 主催者視点のフロー

### 7.1 グループ作成
1. ヘッダーから「グループ作成」を押下。
2. グループ名・サブドメインを入力 (サブドメインは後で変更不可)。
3. 作成完了で自分が `owner`。

### 7.2 共同管理者追加 (グループ単位)
1. グループ編集ページを開く。
2. 「共同管理者」欄に connpass ユーザー名を入力 → サジェストから選択。
3. 追加された管理者はグループ編集・一括メッセージ・メンバー管理が可能になる。

### 7.3 メンバー一括追加
1. グループ管理画面の「メンバー追加」を開く。
2. `名前,メールアドレス` 形式の CSV を貼り付け or アップロード。
3. 確認画面で重複チェック → 登録。
4. 既存ユーザーは `member`、未登録メールは `guest_member` として登録。

### 7.4 イベント単位の管理者 (運営メンバー) 追加
1. イベント編集ページで「共同管理者」欄に connpass ユーザー名を入力。
2. 追加されたユーザーはそのイベントの編集・参加者管理が可能。
3. 退任はイベント編集画面で除外。

### 7.5 一括メッセージ
- グループメンバー (member + guest_member) 宛にメッセージ送信可能。
- 通知設定に関わらず送信される (受信拒否不可)。

---

## 8. 関連 UI

| 画面 | コンポーネント |
|---|---|
| グループ詳細 (`https://<sub>.connpass.com/`) | 「メンバーになる / 退会する」ボタン、メンバー数、所属管理者リスト |
| グループ編集 (`/group/edit/`) | 共同管理者欄、グループ情報入力 |
| メンバー追加 (`/group/members/add/`) | CSV 入力フォーム、確認画面 |
| メンバー一覧 (`/group/members/`) | チェックボックス削除、メンバーステータス表示 |
| イベント編集 | 共同管理者欄 (オートサジェスト) |
| マイページ | 「所属グループ」一覧、「管理しているグループ」一覧 |
| 通知設定 (`/setting/`) | 「メール通知設定」「グループのメール通知設定」セクション |

---

## 9. エッジケース

| ケース | 挙動 |
|---|---|
| owner がアカウント削除 | グループの所有者不在状態。共同管理者がいれば運用継続。いなければ放置グループ化 |
| 共同管理者ゼロでメンバー一括追加 | owner 単独で可能 |
| guest_member と同メールで本登録 | 自動昇格 (推測)。重複加入防止のため、ログイン時にメール一致で紐付け |
| 大量メール追加 | アカウント停止リスク。レートリミット推奨 |
| イベント共同管理者がそのイベントをキャンセル | 管理権限は維持される (参加とは独立) |
| グループの共同管理者がグループ退会 | 退会と同時に管理者権限が外れる |
| グループ削除 | 既存イベントはグループ未所属状態になる or グループ ID を保持して非表示化 |
| サブドメインの空き | 一意制約。既存サブドメインは選べない |
| グループ未所属の管理者がメッセージ送信 | 不可 (管理者は基本的にメンバーでもある) |
| メンバー数 0 でもイベント公開可 | 可能。グループ未所属イベントも作成できる |

---

## 10. 推測される内部処理

### 10.1 ロール解決
- リクエストごとに `(user_id, group_id) -> role` を取得し、ミドルウェアで権限チェック。
- キャッシュは短時間 (5 分程度) でロール変更を反映。

### 10.2 メンバー追加 (CSV)
```pseudo
for each row in csv:
  user = find user by email
  if user:
    UPSERT group_roles (group_id, user_id, role=member)
  else:
    UPSERT group_roles (group_id, email, role=guest_member)
ENQUEUE welcome_mail_job(group_id, identifiers)
```

### 10.3 自動加入
- イベント参加成立時のドメインイベント `ParticipationConfirmed` を購読。
- そのイベントが group_id を持つ場合、ユーザーを `member` として upsert。
- 既存 `member` の場合はスキップ。

### 10.4 通知送信
- グループメッセージ送信時、`group_roles` で `member` または `guest_member` を取得。
- guest_member 用には登録メール、member 用には User の primary email に配信。

### 10.5 ゲストメンバー → メンバー昇格
- ユーザー登録時 (またはメール確認時) に、同メールで `guest_member` が存在する場合、`role` を `member` に変更し `user_id` を埋める。

### 10.6 イベント管理者の権限
- `event_admins (event_id, user_id)` テーブルで管理。
- イベント編集 / 参加者管理エンドポイントでは `event_admin OR group_admin OR group_owner` のいずれかを要求。

---

## 11. 模倣実装する際の設計案

### 11.1 ロール定義
```python
class Role(Enum):
    OWNER = "owner"            # グループ作成者
    ADMIN = "admin"            # 共同管理者 (グループ全体)
    MEMBER = "member"          # 所属メンバー
    GUEST_MEMBER = "guest"     # メール通知のみのゲスト

class EventRole(Enum):
    EVENT_ADMIN = "event_admin"  # イベント単位の共同管理者
```

### 11.2 認可ポリシー
```python
class GroupPolicy:
    def can_edit_group(self, user, group):
        role = self.role_of(user, group)
        return role in (Role.OWNER, Role.ADMIN)

    def can_add_member(self, user, group):
        return self.can_edit_group(user, group)

    def can_send_bulk_message(self, user, group):
        return self.can_edit_group(user, group)

class EventPolicy:
    def can_edit_event(self, user, event):
        if event.group_id:
            group_role = GroupPolicy().role_of(user, event.group)
            if group_role in (Role.OWNER, Role.ADMIN): return True
        return EventAdmin.exists(event_id=event.id, user_id=user.id) or event.author_id == user.id
```

### 11.3 DB スキーマ
```sql
CREATE TABLE groups (
  id BIGSERIAL PRIMARY KEY,
  subdomain TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  owner_user_id BIGINT REFERENCES users(id)
);

CREATE TABLE group_roles (
  id BIGSERIAL PRIMARY KEY,
  group_id BIGINT NOT NULL REFERENCES groups(id),
  user_id BIGINT REFERENCES users(id),
  email TEXT,
  role TEXT NOT NULL,
  auto_joined BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (role = 'guest' AND user_id IS NULL AND email IS NOT NULL) OR
    (role IN ('owner','admin','member') AND user_id IS NOT NULL)
  )
);
CREATE UNIQUE INDEX idx_group_roles_user ON group_roles (group_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX idx_group_roles_email ON group_roles (group_id, email) WHERE email IS NOT NULL;

CREATE TABLE event_admins (
  event_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  invited_by BIGINT,
  PRIMARY KEY (event_id, user_id)
);
```

### 11.4 ゲストメンバー昇格
```python
@user_created.connect
def promote_guest_members(user):
    GroupRole.where(email=user.email, role='guest').update(
        user_id=user.id, role='member', email=None
    )
```

### 11.5 セキュリティ
- 大量追加防止: 1 グループあたり 1 日 N 件、1 アカウントあたり 1 時間 M 件のレートリミット。
- 一括メッセージ: 1 日の送信上限、テンプレート審査オプション。
- guest_member のメール: スパム判定。CAN-SPAM 準拠の unsubscribe (= 退会扱い) を必須化。

### 11.6 テスト観点
- owner / admin / event_admin / member / guest / 一般 のそれぞれで権限境界をテスト。
- ゲストメンバー → 本登録時の昇格。
- 自動加入の冪等性。
- グループ削除時の関連データ整合性。
- 共同管理者の追加上限 (運用上の制約)。
