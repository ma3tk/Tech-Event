# Luma Host Tools (Insights / Check-in / Door / Discount Codes)

## 概要

Luma のホスト向け管理画面は「**カンファレンス運営に必要なものが Luma 1 つで揃う**」を目指して作られている。connpass は「申込受付」までで止まるが、Luma は **受付 → 集客分析 → 当日入場 → アフターフォロー** までを 1 アプリで完結。

## 主要ツール

| ツール | 目的 |
| --- | --- |
| Guest List | 申込者管理 (approve/decline/check-in 状況) |
| Insights | 集客分析 (ファネル / 流入経路 / 開封率) |
| Blasts | 一斉メッセージ送信 |
| Check-in | 受付チェックイン (Web / モバイルアプリ) |
| Luma Door | 専用入場アプリ (iOS / iPad) |
| Discount Codes / Coupons | クーポンによる割引 |
| Hardware Scanner | ハンディスキャナ連携 |
| Hosts & Managers | 権限ロール管理 |
| Embed | 外部サイト埋め込み |

## Guest List

- 全ゲストをテーブル表示
- カラム: 名前 / メアド / Status / Ticket / Registered at / Checked-in
- フィルタ: approval_status (approved / pending / waitlist / declined / invited)
- 並び替え: name / email / created_at / registered_at / checked_in_at
- アクション: Approve / Decline / Refund / Resend invite / Add note
- CSV import / export (Free でも対応)
- 検索: 名前・メアド・タグ・カスタムフィールドの回答

API: `GET /v1/event/get-guests` (cursor pagination)

## Insights

ホストにとっての**集客 KPI ダッシュボード**。

- **Funnel**: Page views → RSVPs → Checked-in
- **Sources**: どこから来たか (Twitter / Direct / Email / Calendar / Embed)
- **UTM tracking**: カスタム UTM パラメータの集計
- **Email metrics**: Open rate, click rate, bounce rate
- **Demographics**: 国 / 都市 / 職業 (カスタムフィールド回答ベース)
- **Conversion**: ticket tier 別の購入率

connpass の管理画面には参加者数しかないが、Luma は**ファネル + 流入経路**まで提供する。

## Check-in (受付)

3 つのモードを使い分け:

### 1. Web チェックイン
- 管理画面の Check-in タブ
- ゲスト名を検索 → "Check in" クリック
- スマホ・タブレットで受付係が操作

### 2. モバイルアプリ
- iOS / Android の Luma アプリで QR スキャナ起動
- ゲストの QR (メール内 / Wallet パス) を読み取り → 即チェックイン
- オフライン対応 (差分同期)

### 3. Luma Door (iPad アプリ)
- 大規模イベント専用
- iPad 全画面で QR スキャン or 名前検索
- 入場者の写真を撮って後で本人確認
- バッジ印刷連携 (DYMO / Brother プリンタ)
- 来場ピーク時の sub-second 性能

### 4. Hardware Scanner
- バーコードリーダー (USB / Bluetooth)
- 数千人規模のイベント向け

すべての方法で `event_tickets[].check_in_status` が更新される。

## 役割管理 (Hosts & Managers)

| ロール | 権限 |
| --- | --- |
| Host (Primary) | 全権限。請求 / 削除も可 |
| Co-host | 編集 + 承認 + メッセージ送信 |
| Manager | 編集 + 承認 (請求は不可) |
| Check-in Staff | 受付のみ (Plus 限定) |

API:
- `POST /v1/event/hosts/create`
- `POST /v1/event/hosts/update`
- `POST /v1/event/hosts/remove`

## Discount Codes / Coupons

```ts
type Coupon = {
  code: string;
  discount_type: 'percent' | 'fixed';
  amount: number;
  max_uses?: number;
  expires_at?: string;
  applicable_tickets?: string[];
};
```

- イベント単位 or カレンダー単位 (カレンダー内の全イベントに適用)
- パーセント割引 (10% off) or 固定額 (-$10)
- 使用回数上限 + 有効期限
- 特定 tier のみに限定可能
- 100% off クーポンは「招待 = タダ券」に活用される

API:
- `POST /v1/events/coupons/create` (イベント)
- `POST /v1/calendars/coupons/create` (カレンダー)
- `GET /v1/event/coupons`
- `GET /v1/calendar/coupons`

## Tags (組織化)

イベントとコンタクト両方にタグを付けて分類:

- `POST /v1/calendar/event-tags/create`
- `POST /v1/calendar/event-tags/apply`
- 例: "Online" / "Workshop" / "AI" / "Q1 2025"
- カレンダーページで tag フィルタを提供できる

## Feedback Email (アフターフォロー)

- イベント終了後、自動でフィードバックメールが配信
- `feedback_email: { enabled: true, delay_minutes: 60 }` で設定
- ゲストは NPS スコア + 自由記述で回答
- ホストの Insights で集計

## エクスポート / 連携

- CSV export (ゲスト / インサイト)
- Zapier 連携 (Plus 専用) で Notion / Airtable / Slack へ自動連携
- Webhook で完全制御

## モバイル管理アプリ

ホストはモバイルアプリで以下が可能:

- ゲストリスト確認 / 検索
- QR チェックイン
- Blast 送信
- 新規登録の Push 通知受信
- 売上 / 申込数の確認

## 真似すべきポイント

1. **集客ファネルを Insights として可視化** — RSVP 率 / Check-in 率を KPI 化
2. **QR チェックイン標準装備** — メール内 QR + Wallet パス + アプリスキャナ
3. **権限ロールを 4 段階で細かく** — Check-in staff だけ別ロールにする発想
4. **クーポンを 2 階層 (event / calendar)** で扱う設計
5. **モバイル管理アプリ** — 主催者がスマホだけで運営できる
6. **Feedback Email の自動配信** — NPS まで取得して PDCA を回す
