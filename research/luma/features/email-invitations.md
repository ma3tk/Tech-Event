# Luma Email Invitations & Blasts

## 概要

Luma の招待・メール体験は「**ホストが大量配信ツールを持ち、ユーザーは 1 タップで返事できる**」を両立する設計。SMS / WhatsApp / Push / Email の 4 チャネルが内蔵され、外部のメール配信サービス (Mailchimp / SendGrid) を不要にする。connpass と差別化される最大の機能群のひとつ。

## 招待の 3 種類

| 種類 | 用途 | 操作 |
| --- | --- | --- |
| 個別招待 (Add Guests) | 知り合いに直接送る | API or 管理画面でメアド入力 |
| Blast (一斉送信) | 購読者全員にお知らせ | カレンダーから配信 |
| Unlock Code | コード持参者のみ登録可能 | コード生成 → 配布 |

## 個別招待 (Add Guests)

- ホストがメアドのリストを入力 (CSV インポート対応)
- 各ゲストに対し `approval_status` を選択 (approved / pending / invited / waitlist)
- 既存 Luma ユーザー: そのアカウントへ紐付け
- 新規ユーザー: 仮アカウント作成 → マジックリンクで本登録

API:
```
POST /v1/event/add-guests
{
  "event_id": "evt-...",
  "guests": [
    { "email": "alice@example.com", "name": "Alice" },
    { "email": "bob@example.com" }
  ],
  "approval_status": "approved",
  "send_email": true
}
```

## 招待メールの中身

1. **件名**: "{Host} invited you to {Event Title}"
2. **本文上部**: イベントカバー画像 (full bleed)
3. **日時 / 場所 / ホスト**: アイコン付きで簡潔
4. **ボタン**:
   - "View Event" → イベントページ
   - "I'm Going" → **One-Tap RSVP** (メール内クリックだけで登録完了)
5. **カスタムメッセージ** (最大 200 文字): ホストが書いた一言
6. **添付**: .ics (カレンダーに追加)

メール内 "I'm Going" ボタンは **署名付きトークン URL** で、クリックするだけで Luma 上での registration が完了。

## Send Invites API (個別)

```
POST /v1/event/send-invites
{
  "event_id": "evt-...",
  "guests": [{ "email": "alice@example.com" }],
  "message": "Hey, would love to see you there!"
}
```

メール + (電話番号が紐付いていれば) SMS の両方を送る。

## Blast (一斉送信)

ホストがカレンダー全体の購読者・特定イベントの参加者に一斉メッセージを送る機能。

- 配信先:
  - All subscribers
  - All registered guests (going)
  - Pending approval のみ
  - Waitlist のみ
  - Specific tag (Contact Tags でセグメント)
- チャネル: Email / SMS / Push / WhatsApp から複数選択
- スケジューリング: 即時 or 予約配信
- A/B テスト: タイトルのバリアント (Plus プランの一部)
- インサイト: open rate, click rate, RSVP conversion を表示

## 配信量

| プラン | 週次上限 |
| --- | --- |
| Free | 500 通 / 週 |
| Plus | 5,000 通 / 週 (アドオンで拡張) |
| Enterprise | 個別交渉 |

## Contact Tags (セグメンテーション)

- カレンダーの contact list に対し任意のタグを付与
- 例: "VIP", "Tokyo", "AI Engineer", "Sponsor"
- Blast 時にタグでフィルタ可能
- API:
  - `POST /v1/calendars/contact-tags/create`
  - `POST /v1/calendars/contact-tags/apply`
  - `POST /v1/calendars/contact-tags/unapply`

## 自動リマインダー

ホスト設定なしで自動配信されるシステムメール:

| タイミング | チャネル | 内容 |
| --- | --- | --- |
| 登録直後 | Email | 確認 + .ics + QR チケット |
| 24 時間前 | Email + Push | リマインダー + 場所案内 |
| 1 時間前 | Push + SMS | "Heading there soon?" |
| イベント後 | Email | フィードバック依頼 (feedback_email 設定時) |

`reminders_disabled: true` で個別イベント単位の自動配信を停止可。

## Unlock Codes (招待コード)

- ホストが任意コードを生成 (例: `SPEAKER2025`)
- そのコードを知っている人だけが特定 tier のチケットを取得可能
- 招待制 + 有料 を組み合わせるとカンファレンスの登壇者招待が綺麗に表現できる

## メアド非公開ポリシー

- ホストは個別ゲストのメアドを管理画面で閲覧 + CSV export 可
- 一般参加者は他のゲストのメアドを見れない
- API レスポンスでも、認証されたカレンダー API キーでのみ email を返す

## 配信品質

- Luma はメール配信を Postmark / SendGrid 系で運用
- DKIM / SPF / DMARC 適用済み
- ホストのドメインを使うカスタム送信元 (Plus プラン) も提供

## A11y / UX

- メール本文は plain text + HTML 両方
- 全 CTA に明示テキスト (ボタン非対応クライアント向け)
- "Unsubscribe from {Calendar Name}" リンクが Blast にだけ表示 (個別招待にはなし)

## 真似すべきポイント

1. **メール内 CTA で登録完了** = 通常の URL ではなく署名トークンで One-Tap
2. **4 チャネル統合 Blast** = ホストがツールを 1 つに集約できる
3. **自動リマインダー 4 回 × 複数チャネル** で no-show を減らす
4. **Contact Tags + セグメント送信** で CRM の置き換えになる
5. **.ics 添付の標準化** でカレンダーアプリ統合体験
