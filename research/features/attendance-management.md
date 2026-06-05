# 出欠管理 (Attendance Management)

connpass.com の主催者向け出欠管理機能 (受付、チェックイン、出席率算出) の仕様を整理する。

---

## 1. 機能の目的とユーザーバリュー

### 目的
- 当日の受付業務を効率化し、参加者の本人確認とチェックインを高速化する。
- イベントごとの「実出席率」を蓄積することで、主催者・参加者双方に行動指標を提供する。
- 連続無断キャンセルの抑止 (= no-show コストの可視化)。

### ユーザーバリュー
- **主催者**: QR コード読み取り・出席コード入力・手動チェックの 3 通りから自分の運用に合った方法を選べる。共同管理者を複数登録して並列受付できる。
- **参加者**: 受付列に並ばずスマホで出席コードを入力するだけで受付完了。受付票の QR を見せる方式も可能。
- **コミュニティ**: 出席率データが残ることで「キャンセル率が高いユーザー / グループ」を把握でき、信頼関係の指標になる。

---

## 2. 関連するエンティティとフィールド

### Event 関連
| Field | 型 | 説明 |
|---|---|---|
| Event.attendance_code | string | 出席コード (英数字, 自動生成 or 任意設定) |
| Event.checkin_url | string | 主催者用 QR 読み取りページ URL (推測) |
| Event.started_at | datetime | 受付開始の参考時刻 |
| Event.ended_at | datetime | 出席締切の参考時刻 |

### Participation
| Field | 型 | 説明 |
|---|---|---|
| Participation.attended | bool | 出席フラグ |
| Participation.attended_at | datetime | チェックイン時刻 |
| Participation.receipt_number | int | 受付番号 (イベント内ユニーク, 参加者一覧の並び順や QR 識別に使用) |
| Participation.receipt_qr_token | string | 受付票 QR の署名済みトークン |
| Participation.checked_in_by | int | 受付処理した管理者の user_id (推測) |

### User の集計値
| Field | 型 | 説明 |
|---|---|---|
| User.attendance_rate | float | (出席イベント数 / 参加確定イベント数) × 100 |
| User.attended_count | int | 参加確定でかつ出席したイベント総数 |
| User.absent_count | int | 参加確定だが出席しなかったイベント総数 |

### EventManager (共同管理者)
- 当日受付を分担するために複数管理者を登録可能。

---

## 3. 状態遷移図

```
参加確定 (accepted)
        |
        | イベント開催
        v
   受付タイミング
        |
   +----+----+--------------+----------------+
   |         |              |                |
   v         v              v                v
QR読み取り  出席コード入力  管理者手動チェック  (何もしない)
   |         |              |                |
   +----+----+--------------+                |
        |                                    |
        v                                    v
   attended = true                    attended = false
   attended_at = NOW()                (= no-show)
        |
        | (任意) 取消
        v
   attended = false
```

### 主催者目線
```
[募集中] -> [当日] -> [受付モード ON] -> [チェックイン処理] -> [集計]
                                          ^
                                          |
                                  3方式から選択
```

---

## 4. ルール・制約

### 4.1 受付の前提
- 出席チェック対象は `status = 'accepted'` のユーザーのみ。
- 補欠 (`waitlisted`) のユーザーは受付対象外 (当日繰り上げで `accepted` になれば対象化)。

### 4.2 受付方法
公式に提示されている方式は 3 つ:

1. **管理者による手動チェック**
   - 参加者管理画面で各行の「出席」ボタンをクリック。
   - 受付番号・受付票と対応させながら操作。
2. **出席コード入力**
   - イベント公開時に自動生成される `attendance_code` を会場に掲示。
   - 参加者が自分のスマホ等から `attendance_code` を入力すると `attended = true` になる。
3. **QR コード読み取り**
   - 各参加者の受付票に印刷された QR を、主催者側のカメラで読み取り。
   - 共同管理者を複数追加することで並列受付可能。

### 4.3 出席コード
- 出席コードはイベントごとに発行され、当日の会場掲示が前提。
- イベント公開時に自動生成 (任意で主催者が変更可能)。
- セキュリティ要件として、SNS 等への流出で外部不正出席を許す可能性があるため、コード値は推測困難な英数字。

### 4.4 受付番号
- イベント内ユニーク。
- 抽選方式の場合、抽選確定後に採番されると推測。先着方式の場合は `accepted` 確定時に採番。
- 受付番号は受付票 (QR と一緒に表示) や CSV ダウンロードでも利用。

### 4.5 出席率
- 個人別: 「参加確定したイベント中、出席フラグがついた割合」。
- 過去のイベントは時間経過で出席判定 (主催者がチェックインしないままイベント終了すると未出席扱い)。
- イベント終了から一定期間 (例: 1 週間) を「出席率反映猶予」とする可能性あり。
- 主催者は自分のイベントの出席率 (= 出席者数 / 参加確定数) を集計可能。

### 4.6 共同管理者
- 並列受付のため複数管理者を追加可能。
- 全員が同じ受付権限を持つ (主催者 = 共同管理者は同等)。

### 4.7 CSV ダウンロード
- 参加者一覧を CSV でダウンロード可能。出席状況、アンケート回答、受付番号、名前等を含む。

---

## 5. ユーザー視点のフロー

### 5.1 出席コード方式
1. 会場に掲示された出席コードを確認。
2. スマホでイベント詳細を開き「出席コード入力」リンクを押下。
3. コードを入力し送信。
4. `attended = true` に変更され、画面上で「出席済み」表示。

### 5.2 QR 受付方式
1. 事前に「受付票」(QR コード付き) を発行してスマホ or 印刷で持参。
2. 会場で主催者にスマホを見せる / 印刷物を見せる。
3. 主催者がカメラで QR を読み取る。
4. 自動で `attended = true` に。

### 5.3 出席後の体験
- マイページの「過去の参加イベント」に出席ステータスが反映される。
- ユーザーの出席率に加算される (公開・非公開はユーザー設定次第)。

---

## 6. 主催者視点のフロー

### 6.1 事前準備
1. イベント編集画面で `attendance_code` を確認 (自動生成済) または変更。
2. 共同管理者を追加 (受付を分担する場合)。
3. 受付票・参加者リストを印刷 or 共同管理者の端末で参照可能にしておく。

### 6.2 当日 (手動チェック)
1. 参加者管理画面を開く。
2. 受付の参加者を検索 (名前・受付番号)。
3. 「出席」ボタンを押す。

### 6.3 当日 (出席コード)
1. 会場に出席コードを掲示 (プロジェクター / 案内ボードなど)。
2. 参加者が自分でコードを入力。
3. 主催者画面上ではリアルタイムに出席者数が増加。

### 6.4 当日 (QR 受付)
1. 主催者がスマホで「QR 受付ページ」を開く。
2. 参加者から提示された QR を読み取る。
3. 認証成功で「出席済み」表示、ピッ音などの UI フィードバック。

### 6.5 イベント終了後
1. 参加者管理画面で出席者数 / 不参加者数を確認。
2. CSV ダウンロードでデータをエクスポート。
3. アンケート回答の確認・分析。

---

## 7. 関連 UI

| 画面 | 関連コンポーネント |
|---|---|
| 主催者: 参加者管理 (`/event/:id/participation/`) | ステータスタブ, 出席チェック列, 出席率サマリ, CSV ダウンロードボタン |
| 主催者: QR 受付モード (`/event/:id/checkin/`) | カメラビュー, スキャン履歴, 共同管理者表示 |
| 参加者: 受付票 (`/event/:id/ticket/`) | 受付番号, QR コード, 出席コード入力フォーム |
| 参加者: イベント詳細 | 「出席コードを入力」リンク (開催当日のみ表示) |
| マイページ | 出席イベント一覧, 出席率バッジ |
| メール: リマインダー | 「出席コード入力 URL」「受付票 QR URL」を含む |
| 主催者: イベント編集 | 出席コード設定欄, 共同管理者追加欄 |

---

## 8. エッジケース

| ケース | 挙動 |
|---|---|
| 開催前に出席コードを入力 | エラー or 「まだ受付開始していません」表示。`started_at` 以前は受付不可。 |
| 開催後遅れて出席コード入力 | `ended_at` を一定時間超過すると受付不可。猶予はイベント終了から例: 24 時間。 |
| QR 二重スキャン | 既に `attended = true` の場合「既に出席済み」アラート。 |
| 補欠ユーザーが出席コード入力 | 「参加確定していません」エラー。 |
| 当日繰り上げで `accepted` 化 | 通知メール内に受付票 / 出席コード入力 URL を含めて即座に受付可能化。 |
| QR を SNS で他人に共有 | 受付番号・トークンが一意なので他人が使うと不正検知 (理論上は本人と分かる) |
| 出席コードが SNS に流出 | 不正な出席が発生する可能性。主催者が後から目視で修正可能 |
| 主催者が「出席」ボタンを誤クリック | 取消ボタンで `attended = false` に戻せる |
| 開催形式がオンライン | 出席コード方式が主流 (会場掲示できないため Zoom チャット等にコード掲載) |
| CSV ダウンロード時の個人情報 | アンケート回答含むため取り扱い注意。アカウント所有者と紐づくため要規約遵守 |
| イベント終了せずに放置 | 出席集計が確定しないまま。バッチで自動 close が必要 |

---

## 9. 推測される内部処理

### 9.1 出席チェックイン API
```pseudo
POST /api/events/:id/checkin
  body: { method: 'code' | 'qr' | 'manual',
          code?: string,
          qr_token?: string,
          participation_id?: int }
  auth:
    - 'code': 参加者本人ログイン
    - 'qr': 共同管理者ログイン
    - 'manual': 共同管理者ログイン

  処理:
    case method:
      'code':
        if request.code != event.attendance_code: 401
        if participation.status != 'accepted': 400
        if NOW < event.started_at - buffer: 400
      'qr':
        verify qr_token signature
        participation = find by qr_token
      'manual':
        participation = find by participation_id

    UPDATE participations SET
      attended = true,
      attended_at = NOW(),
      checked_in_by = current_user_id
    WHERE id = participation.id
```

### 9.2 出席率の集計
- 個人別: 定期バッチで `User.attendance_rate` を再計算 (重い計算なのでキャッシュ更新)。
- イベント別: リアルタイム計算で `accepted` 件数 / `attended` 件数を出す。

### 9.3 QR トークン生成
- 参加確定時に `participation.receipt_qr_token = sign({event_id, participation_id, user_id})` を発行。
- HMAC SHA-256 + シークレットキー。

### 9.4 受付番号採番
- イベントごとに `Event.next_receipt_number` をインクリメント。
- 抽選方式は抽選確定後に一括採番、先着方式は `accepted` 確定時に逐次採番。

### 9.5 リマインダー連携
- 開催 1 日前のリマインダーメールで「受付票 URL」「出席コード」を埋め込み。

### 9.6 出席締切
- バッチで `ended_at` から X 時間経過したイベントを「出席締切」にし、未出席ユーザーを `attended = false` 確定化。

---

## 10. 模倣実装する際の設計案

### 10.1 ドメインモデル
```ruby
class Participation
  def check_in!(by:)
    raise NotAcceptedError unless accepted?
    raise AlreadyCheckedInError if attended?
    update!(attended: true, attended_at: Time.current, checked_in_by: by.id)
  end
end
```

### 10.2 エンドポイント
- 参加者: `POST /events/:id/attendance_code` body: `{ code }` (本人認証)
- 主催者: `POST /events/:id/participations/:pid/check_in` (管理者認証)
- 主催者: `POST /events/:id/checkin/qr` body: `{ qr_token }` (管理者認証)

### 10.3 QR コード
- ペイロード: `signed(event_id || participation_id || version)`
- フォーマット: JWT or Signed URL
- スキャン側はオフラインでも署名検証可能 (= 通信不安定な会場でも処理可能)

### 10.4 出席率ロジック
```ruby
class AttendanceRateCalculator
  def self.for_user(user)
    finished_accepted = user.participations
      .where(status: :accepted)
      .joins(:event)
      .where('events.ended_at < ?', Time.current)
    return nil if finished_accepted.empty?
    attended = finished_accepted.where(attended: true).count
    (attended.to_f / finished_accepted.count * 100).round(1)
  end
end
```

### 10.5 受付モード UI
- WebSocket でリアルタイム更新 (受付済み数を全管理者の端末に同期)。
- オフライン耐性: IndexedDB に受付済みトークンをキャッシュし、復旧時に同期。

### 10.6 セキュリティ
- 出席コードのレートリミット (1 ユーザーあたり 5 回 / 分)。
- 出席コードを 1 イベント 1 つに限定 (チェックイン後ローテーションしない)。
- 個別 QR は失効可能 (取り消し時のため)。

### 10.7 テスト観点
- 開催前 / 開催中 / 開催後の受付可否
- 補欠ユーザーの拒否
- 二重チェックインの冪等性
- QR トークン署名検証 (改ざん検知)
- 出席率計算の正確性 (キャンセル含む)
- 当日繰り上げ → 即時 QR 発行 → 受付の一連流れ
- レートリミットによる出席コード総当たり攻撃の防止
