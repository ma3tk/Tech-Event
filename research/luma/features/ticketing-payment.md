# Luma Ticketing & Payment

## 概要

Luma は **Stripe** をマーチャント・オブ・レコードとして組み込み、無料・有料・寄付・複数階層チケットを単一の UI で扱える。プラットフォーム手数料は **Free プランで 5%、Plus プランで 0%** (Stripe 手数料 2.9% + 30¢ は別途)。これにより、connpass の有料機能 (Peatix 等への外部依存) と異なり、**1 サービス内で課金完結**する。

## 4 種類の課金モデル

| モデル | 価格設定 | UI |
| --- | --- | --- |
| Free | 0 | Register ボタン |
| Paid | 固定額 | "Get Ticket - $25" |
| Donation | 任意金額 (min / suggested あり) | スライダー or 入力 + Pay |
| Multi-tier | 複数チケットタイプを 1 イベントに | "Select ticket" ドロップダウン |

## Multi-tier の例 (テック系カンファレンス)

| Tier | 価格 | 在庫 | 説明 |
| --- | --- | --- | --- |
| Early Bird | $99 | 50 | 6 月 30 日まで |
| Standard | $149 | 200 | 通常 |
| Student | $25 | 30 | 学生証提示で承認制 |
| Sponsor | $500 | 5 | ブース + 名刺タイム |
| Speaker | $0 | 10 | 招待コード必須 |

各 tier は独立して

- 在庫
- 販売期間 (開始 / 終了日時)
- 承認制 / Unlock Code 必須
- "個別の Registration Questions"

を持てる。

## Stripe 統合

- ホストがカレンダー設定で Stripe Connect (Standard) を接続
- 売上は Stripe アカウント直接入金 (Luma は経由しない、PCI スコープ外)
- プラットフォーム手数料は `application_fee` で控除
- 通貨はカレンダー単位 (USD, EUR, JPY, GBP, etc 多数対応)
- 領収書は Stripe 自動 + Luma カスタムメール

## 決済 UI

1. ユーザーが "Get Ticket" をクリック
2. ティアを選択 (multi-tier 時)
3. メアド入力 (未ログイン時) or 確認 (ログイン済み)
4. **Stripe Payment Element** (カード / Apple Pay / Google Pay / Link / 地域別決済) を埋め込み
5. 決済成功 → 即チケット発行 → "You're in" モーダル
6. 失敗 → 同一モーダルでリトライ可能 (ページ遷移なし)

## 税金 (Tax Collection)

- Plus プランの専用機能
- Stripe Tax を裏で利用
- ホストが州 / 国別の税率を設定 → チェックアウト時に自動計算
- インボイス対応 (EU VAT, GST, 日本の消費税)

## クーポン / 割引

```ts
type Coupon = {
  code: string;
  discount_type: 'percent' | 'fixed';
  amount: number;
  max_uses?: number;
  expires_at?: string;
  applicable_tickets?: string[]; // 特定 tier のみ
};
```

- API: `POST /v1/events/coupons/create`, `POST /v1/calendars/coupons/create`
- カレンダー全体に使えるクーポン or 個別イベント限定
- UI: チェックアウト時にコード入力欄

## Unlock Codes (招待限定 tier)

- "Speaker" や "Investor" のような hidden tier は Unlock Code でのみ visible
- API なし、ホスト管理画面で生成
- 配布: メール / DM / QR で個別配布

## 返金

- 自動返金ルール: イベント 24 時間前まで返金可、以降不可 など、ホスト設定可
- 手動返金: ホストが任意のゲストを refund
- キャンセルされたイベントは全員自動返金 (`POST /v1/event/cancel` 実行時)

## チケット形式

- メール内に PDF + Apple Wallet (.pkpass) + Google Wallet (.googlepay-pass) 添付
- 各チケットに **ユニーク QR コード** (JWT 署名)
- 物理イベントは QR を会場でスキャン (Luma Door アプリ)

## API

| 操作 | エンドポイント |
| --- | --- |
| Ticket type 作成 | `POST /v1/events/ticket-types/create` |
| Ticket type 更新 | `POST /v1/events/ticket-types/update` |
| Ticket type 一覧 | `GET /v1/events/ticket-types/list` |
| Ticket type 削除 | `POST /v1/event/ticket-types/delete` |
| クーポン作成 | `POST /v1/events/coupons/create` (event 単位) / `POST /v1/calendars/coupons/create` (cal 単位) |

## Webhook

- `ticket.registered` — チケット発行 (有料無料両方) 時に発火
- 売上はホスト Stripe ダッシュボードで管理

## 競合との差分

| 機能 | Luma | connpass | Peatix |
| --- | --- | --- | --- |
| 決済内蔵 | ✅ Stripe | ❌ (外部) | ✅ |
| One-page checkout | ✅ | △ | △ |
| Multi-tier | ✅ | △ | ✅ |
| 0% fee plan | ✅ ($59/mo) | N/A | ❌ |
| Apple/Google Wallet | ✅ | ❌ | △ |
| Unlock codes | ✅ | ❌ | △ |
| Stripe Connect 直接入金 | ✅ | ❌ | ❌ (Peatix 経由) |

## 真似すべきポイント

1. **Stripe Connect Standard** を採用して MoR を当事者にしない (法務リスク低)
2. チケットタイプを「**販売期間 + 在庫 + 承認制 + 質問**」セットで作る思想
3. Wallet パス対応 → モバイル UX が圧倒的に上がる
4. クーポンを「カレンダー全体」「イベント個別」の 2 軸で管理 → コミュニティ運営に最適
5. 決済 UI を絶対にページ遷移させない → モーダル + Stripe Payment Element で 1 画面完結
