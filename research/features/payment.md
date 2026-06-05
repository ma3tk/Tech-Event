# 有料イベント・決済 (payment.md)

connpass における有料 (事前決済) イベント機能と、それに付随する PayPal 連携・領収データ発行・キャンセル時の取り扱いについての調査。

## 1. 機能の目的

connpass の有料イベント機能は、主催者がイベント参加費を「事前決済」として徴収できるようにするためのものである。connpass 自体は決済代行業者ではなく、PayPal を介した P2P 決済を「申し込みフロー」に組み込むことで、運営側に金銭情報を保持させない設計になっている。

- 主催者: 会場費・運営費・登壇者謝礼などのコストを参加申込時点で確実に回収できる。当日キャンセル・no-show による損失リスクを低減する。
- 参加者: 当日現金を持参する必要がなく、キャッシュレスで参加できる。経理用の領収データも connpass 側で発行可能。
- プラットフォーム: 決済プロセスを外部 (PayPal) に委譲することで、資金移動業の登録を回避しつつ、決済手数料を抑制する (connpass 自体の手数料は無料)。

「事前決済の手数料は業界最安値」「connpass は手数料をとりません」と公式に強調されており、有料イベント機能は competitive advantage の一つとして位置付けられている。

## 2. 利用シナリオ

| シナリオ | 主催者の動機 | 参加者の体験 |
|----------|--------------|---------------|
| 有償ハンズオン (ハードウェア教材付き) | 教材原価を確実に回収 | 申込時に PayPal で決済、当日は教材を受け取るだけ |
| 有料カンファレンス | 早期割引や懇親会込みのチケット販売 | 参加枠ごとに異なる金額が表示される |
| 懇親会付き勉強会 | 飲食代の事前徴収で当日精算を不要に | 領収データを発行して経費精算 |
| 小規模有料勉強会 | キャンセル率を下げる | キャッシュレスで気軽に参加 |

「当日払い (会場払い)」については、connpass の決済機能では正式に対応しておらず、**主催者がイベント説明文に「当日現金払い◯円」と記載して個別運用するか、参加費を無料設定にしておき会場で徴収する**運用となる。

## 3. 関連エンティティ・フィールド

イベント (有料) を表現するためのフィールド (推定構造):

```
Event
├─ pricing_type: enum {free, paid_prepaid, paid_onsite_text_only}
├─ ticket_tiers: [Ticket]
│   ├─ name: string ("一般枠", "学生枠", "懇親会込み")
│   ├─ price: integer (税込)
│   ├─ capacity: integer
│   └─ accept_waitlist: boolean (有料枠は false 固定)
├─ paypal_account_email: string (主催者の受取先)
├─ refund_policy: text (主催者記述、必須)
├─ contact_email: string (参加者からの問合せ先、必須)
└─ receipt_settings:
    ├─ enabled: boolean
    ├─ issuer_name: string
    ├─ issuer_address: string
    ├─ invoice_registration_number: string(13) (適格請求書発行事業者番号)
    └─ tax_rate: fixed 10%
```

参加 (Application) 側:

```
Application
├─ event_id, user_id, ticket_tier_id
├─ payment_status: enum {pending, paid, refunded, expired}
├─ paypal_transaction_id: string
├─ paid_at: datetime
├─ amount: integer
└─ receipt:
    ├─ recipient_name: string (発行時に参加者が入力、後から変更不可)
    ├─ receipt_number: string
    └─ issued_at: datetime
```

## 4. UI 上の入口と画面

### 4.1 主催者側

1. イベント作成 / 編集画面の「参加費」セクション
   - 「無料」/「会場払い (記述のみ)」/「事前 (PayPal) 払い」を選択
   - 事前払いを選んだ場合に PayPal メールアドレス入力フィールドが現れる
2. 「領収データ発行設定」サブセクション
   - チェックボックス: 発行を有効にする
   - 発行者名 / 発行者所在地 / 適格請求書発行事業者登録番号 (任意)
3. キャンセル・返金ポリシー記述欄 (必須)
4. 参加者向け連絡先入力 (必須)

### 4.2 参加者側

1. イベント詳細画面右上の「PayPal で支払う」ボタン
2. PayPal の決済画面 (外部リダイレクト)
3. PayPal 決済完了後、connpass の「参加完了」画面に戻る
4. 後日、イベント詳細画面の「領収データを見る」ボタンから領収データ画面へ
   - 初回のみ宛名入力モーダルが表示される

## 5. 外部サービス連携

### 5.1 PayPal 連携

- 主催者は **本人確認手続きが完了している PayPal アカウント** (パーソナル / ビジネス両方可) を保有していることが必須。
- 決済成功時、決済代金は **手数料 (3.6% + 40円) を控除した額が即座に主催者の PayPal アカウントに振り込まれる**。
- connpass は決済の中継のみを行い、エスクローや一時保留は行わない。
- 認可フローは PayPal Express Checkout 相当 (リダイレクト型)。connpass 側はトランザクション ID を保持して参加と紐付ける。
- 支払いページが表示されてから **30 分以内** に決済を完了しないとセッションが切れる。

### 5.2 領収データ

- connpass 内で PDF / HTML として表示し、参加者自身が印刷して使う。
- 適格請求書 (インボイス制度) に対応した記載項目を備える。
- 税率は 10% 固定。

## 6. ルール・制約

### 6.1 主催者側

- PayPal 本人確認未完了の場合、決済が pending 状態で保留される可能性がある。
- 既に参加受付完了している人数を下回るように定員を減らすことはできない (=既決済分を勝手に無効化できない)。
- 主催者の都合でイベントを中止する場合、返金は主催者が PayPal 側または個別対応で実施する責任を負う。
- 一度発行した領収データの発行者情報を変更しても、過去分は再生成されない (新規分のみ反映)。

### 6.2 参加者側

- 有料枠には **補欠登録ができない** (定員到達 = 申込不可)。
- connpass 側のキャンセル操作だけでは返金されない。返金は主催者ポリシーに従う。
- キャンセル後の再申込みは、再度決済が発生する。
- 領収データの宛名は初回入力後は変更不可。

### 6.3 プラットフォーム側

- connpass は払い戻し機能を提供していない (= API 上「refund」エンドポイントが存在しない)。
- connpass の手数料は無料。発生するのは PayPal 側の決済手数料のみ。
- 通貨は JPY のみ (国内 PayPal アカウント前提)。

## 7. 模倣実装時の代替案

### 7.1 決済プロバイダ

PayPal は法人 PayPal アカウント取得のハードルがやや高い & 国内シェアが落ちているため、代替候補:

| プロバイダ | メリット | デメリット |
|------------|---------|-------------|
| **Stripe** | 国内決済シェアが高く、Connect 機能で主催者個人への送金 (Marketplace 型) に対応 | KYC が必要、振込スケジュールが翌週など遅延あり |
| **Stripe Checkout + Express Connect** | 主催者ごとの本人確認・送金を Stripe が代行 | プラットフォーム手数料設計が必要 |
| **PAY.JP** | 国内提供、開発が容易 | 主催者単位の入金分割が標準ではない (要設計) |
| **Square** | POS との統合 (当日払いハイブリッド) | 用途がやや限定的 |
| **Pay.jp + 銀行振込** | シンプル | 自動消込が必要 |

模倣実装としては **Stripe Connect (Express)** を採用し、主催者がオンボーディング画面で本人確認 → connpass 相当のプラットフォームが application_fee を取らずに pass-through する、という設計が最も近似となる。

### 7.2 領収データ

- 適格請求書 (インボイス) 対応は必須要件。`registration_number` (T+13桁) と税率内訳を保持する。
- PDF 生成は puppeteer / wkhtmltopdf / react-pdf などで HTML→PDF 化。
- 「宛名の後変更不可」ルールは、改竄防止のため `recipient_name_locked_at` カラムを設けて運用ルールとして強制する。

### 7.3 当日払いハイブリッド

connpass 本体にない「当日払い」機能を追加するなら、`pricing_type` に `paid_onsite` を追加し、QR 受付時にステータスを `paid` に手動更新できる UI を主催者向けに用意する。

### 7.4 キャンセル時の返金フロー

connpass にない「自動返金」を実装するなら Stripe の Refund API を叩く UI を提供する。ただしリファンド可能期間 (Stripe では 180 日) や手数料返却ポリシーを UI に明示する必要がある。

### 7.5 Webhook による状態同期

PayPal の IPN は廃止傾向にあるため、Stripe Webhook (`checkout.session.completed`, `charge.refunded`) を使って `Application.payment_status` を同期するのが現実的。

---

参考: <https://help.connpass.com/organizers/paid-event-edit>, <https://help.connpass.com/participants/join-paid-event>, <https://help.connpass.com/organizers/event-receipt>, <https://help.connpass.com/participants/show-event-receipt>
