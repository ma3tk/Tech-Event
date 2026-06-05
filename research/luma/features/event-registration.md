# Luma Event Registration

## 概要

Luma の参加登録フローは「**1 タップで終わらせる**」が哲学。ログイン済みなら 1 クリック → DB 登録 → メール送信が <500ms で完了する One-Tap RSVP。これに加えて承認制 (Approval Required) / ウェイトリスト (Waitlist) / 招待制 (Invite-only) の 4 モードを 1 つのフォームで切替設定できる。

## 4 つの登録モード

| モード | UI ラベル | 振る舞い |
| --- | --- | --- |
| Open RSVP | Register | 即時 approved。チケット即発行 |
| Approval Required | Request to Join | pending_approval → ホスト承認で approved 化 |
| Waitlist (capacity 到達後) | Join Waitlist | waitlist 状態。空きが出ると自動 approve or 通知 |
| Invite-only (private) | (URL を知っている人のみ) | URL もしくは email 招待のみ |

## One-Tap RSVP の体験

1. ユーザーが Register ボタンを押す
2. **すでに Cookie で Luma にログイン済み** なら、確認ダイアログなしで即時登録
3. 同一ページにモーダルが表示 (「You're in! 🎉」+ チケット QR)
4. 並行して
   - Calendar invite (.ics) を含む確認メール送信
   - 開催前リマインダー (24 時間前、1 時間前) を自動スケジュール
   - SMS / WhatsApp / Push のリマインダーを (設定により) 配信

## 未ログインユーザー

1. Register クリック → メールアドレス入力モーダル
2. メアド入力 + 名前 → "Send link" でマジックリンクメール
3. メール内リンクをクリックすると同時に
   - アカウント作成
   - 該当イベントへの登録完了
4. リンクから戻ったページが「You're in」状態になっている (シングルセッションで完結)

connpass の「会員登録 → ログイン → 申し込み」3 ステップに対し Luma は **0 アカウントから 2 クリック** で完了。

## 承認制 (Approval Required)

- ホストが「Require Approval」をオン
- 追加で **Registration Questions** を設定可能 (自由テキスト / 単一選択 / 複数選択 / 会社名 / Twitter/LinkedIn URL など)
- ユーザーは Request to Join 後、`pending_approval` 状態
- ホストの管理画面に承認キューが表示 → Approve / Decline をワンクリック
- 承認時にカスタムメッセージを添付可能
- API: `POST /v1/event/update-guest-status` で `approval_status: approved`

## ウェイトリスト

- capacity (max_capacity) 到達後、Register ボタンが "Join Waitlist" に変身
- waitlist 状態のゲストはホスト管理画面で順位表示
- キャンセル発生時、上位から自動 approve (Auto-Approve オプション)
- もしくはホストが手動で繰り上げ
- API: `POST /v1/event/add-guests` で `approval_status: waitlist`

## カスタムフィールド (Registration Questions)

```ts
type Question = {
  type: 'text' | 'textarea' | 'dropdown' | 'checkbox' | 'company' | 'social' | 'phone' | 'website';
  label: string;
  required: boolean;
  options?: string[];   // dropdown / checkbox 用
  hostOnly?: boolean;   // 回答をホストのみに見せる
};
```

テック系イベントでよく使われる質問:
- "What's your role?" (Engineer / PM / Designer / Founder / Other)
- "What's your Twitter/X handle?"
- "Are you looking to hire?"
- "What do you hope to learn?"

## 招待制 (Private Event)

- visibility = "private" → URL シェアした人のみが見れる
- visibility = "members-only" → カレンダー購読者のみ
- 招待コード方式: 特定の Unlock Code を持つ人だけが Register 可能 (シークレットイベント向け)

## 二重登録防止

- 同一メアドの 2 度目の登録は no-op (既存チケットを再発行)
- 別のチケットタイプへ変更したい場合は明示的にキャンセル → 再登録

## キャンセル

- ユーザー: チケット詳細から "Can't make it" ボタン → 即キャンセル
- ホスト: 管理画面でゲストを decline 状態に
- 有料イベント: Stripe を介して自動返金 (ホスト設定によりルール変更可能)

## API

| 操作 | エンドポイント |
| --- | --- |
| ゲスト追加 | `POST /v1/event/add-guests` |
| ステータス更新 | `POST /v1/event/update-guest-status` |
| ゲスト一覧 | `GET /v1/event/get-guests` (`approval_status` フィルタ可) |
| 個別ゲスト | `GET /v1/events/guests/get` |
| 招待送信 | `POST /v1/event/send-invites` (email + SMS) |

## Webhook 連携

- `guest.registered` — 新規登録時
- `guest.updated` — 承認・キャンセル時
- `ticket.registered` — チケット発行時 (有料無料問わず)

外部 CRM (HubSpot, Notion DB) への自動連携、Slack 通知などに使える。

## A11y / UX

- Register 完了モーダルは `aria-live="polite"` で SR に成功を通知
- Magic link メールは 60 分で expire (セキュリティ)
- 確認メールには .ics 添付 + Apple Wallet / Google Wallet パス
- 全状態を URL 反映せず、モーダル + Toast でフローを止めない

## 真似すべきポイント

1. **マジックリンクでパスワード不要** にする
2. **未ログインでも 2 タップで完了** する設計
3. **承認 / ウェイトリストを同じ Register ボタン** で表現する (ラベル切替)
4. **登録 = チケット即発行 + Calendar invite** をワンセットでやる
