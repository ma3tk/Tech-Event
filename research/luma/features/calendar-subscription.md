# Luma Calendar Subscription (コミュニティ購読)

## 概要

Luma の根幹コンセプトは「**Event ではなく Calendar (コミュニティ) を購読する**」というモデル。カレンダーは「特定のテーマで継続的にイベントを開く団体」を表し、ユーザーは Subscribe するとそのカレンダーの新着イベントを受動的に受け取れる。connpass の「グループ」と類似だが、UI 文化と通知重視で**ニュースレター的な体験**になっている。

## カレンダーの 3 階層

```
Organization (org) — 法人・大規模主催者
  ↳ Calendar — テーマ別の継続コミュニティ (例: AI Tinkerers SF)
      ↳ Event — 単一の開催
```

組織内に複数カレンダー、カレンダー内に多数イベントを所属させる。

## Subscribe (フォロー) アクション

1. ユーザーがカレンダーページ訪問
2. **Subscribe** ボタン (Calendar Card と同様 UI)
3. クリック → 即時フォロー、ボタンが "✓ Subscribed" に
4. これ以降:
   - 新規イベントが追加されると通知 (push / email / SMS 設定可)
   - ユーザーの "Discover" ホームに優先表示
   - Calendar feed (.ics URL) でカレンダーアプリに同期可

## 通知設定

```ts
type SubscriptionPreferences = {
  newEventNotifications: 'all' | 'matches-interests' | 'none';
  channels: Array<'email' | 'push' | 'sms'>;
  weeklyDigest: boolean;
  newsletterOptIn: boolean;
};
```

- ホスト側は購読者全員に **Blast** (一斉メール / SMS / push / WhatsApp) を送れる
- Free プラン: 週 500 通、Plus プラン: 週 5,000 通
- 配信状況は Insights タブで確認 (open rate / click rate)

## .ics フィード (カレンダーアプリ統合)

各カレンダーは

```
webcal://luma.com/cal/{slug}/feed.ics
```

形式の購読可能フィードを発行。これを Google Calendar / Outlook / Apple Calendar に「URL でカレンダー追加」すると、新着イベントが自動同期。connpass の RSS と違い、**カレンダーアプリにネイティブ統合**される点が強い。

## メンバー制カレンダー

- カレンダー setting で `visibility: members-only` を選ぶと、Subscribe するのに承認が必要
- Membership Tiers (有料 / 無料) を設定可
- 例: 月額 $10 で限定イベントアクセス、年額 $99 で VIP イベント参加

API:
- `GET /v1/memberships/tiers/list`
- `POST /v1/memberships/members/add`
- `POST /v1/memberships/members/update-status`

## カレンダー間の関連性

- 同一 Organization の他カレンダーを "Related" として表示
- 共通ホスト (cross-host) でつながるカレンダー同士もレコメンド
- "People you follow also follow" レコメンドあり

## カレンダー作成

```
POST /v2/organizations/calendars/create
{
  "name": "AI Tinkerers Tokyo",
  "slug": "ai-tinkerers-tokyo",
  "description_md": "...",
  "cover_url": "...",
  "logo_url": "...",
  "tint_color": "#5C66FF",
  "visibility": "public",
  "default_event_theme": {...}
}
```

## Discover との関係

- /discover の Featured Calendars セクションが Subscribe 入り口
- ジオ・カテゴリで絞り込み (Tech / AI / Crypto / Fitness / Food 等)
- "ユーザーがフォローしている人がフォローしているカレンダー" を優先表示する社会的レコメンド

## ホスト視点での運用メリット

1. **継続的なメーリングリスト** を Luma が持ってくれる (CRM 不要)
2. **メール送信制限が緩い** (Free でも週 500 通、Plus で 5,000 通)
3. **コミュニティブランドが育つ** (カバー画像 / ロゴ / tintColor がカレンダー全体に適用)
4. **Approve 制** にすることで Spam フィルタ
5. **イベントが終わっても関係が続く** (1 回きりの集まりではなくシリーズ化される)

## ユーザー視点でのメリット

1. 興味あるテーマを **1 回 Subscribe するだけ**で継続フォロー
2. カレンダーアプリに自動同期
3. ニュースレター的に新着が届く
4. "Following" タブで自分のフォロー一覧 → 二重情報摂取の整理

## Webhook

- `calendar.event.added` — カレンダーにイベント追加
- `calendar.person.subscribed` — 新規購読者
  → CRM 連携や Slack 通知のトリガーに使える

## connpass との対比

| 機能 | Luma | connpass |
| --- | --- | --- |
| 継続コミュニティ | Calendar (中核) | グループ (周辺機能) |
| 購読導線 | Subscribe ボタン (大) | グループ参加 (目立たない) |
| 新着通知 | email/push/SMS/WhatsApp | メールのみ |
| .ics フィード | あり (webcal://) | なし |
| カバー / ブランディング | 強い | 弱い |
| メンバー制 + 有料 | あり | なし |
| ニュースレター送信機能 | 内蔵 (Blast) | なし |

## 真似すべきポイント

1. **Calendar を一等市民にする** — グループより上位の概念として中心に置く
2. **Subscribe ボタンを目立たせる** — ユーザーの継続関係を最重要 KPI に
3. **.ics フィードを発行する** — カレンダーアプリ統合は熱心ユーザーの定着率を爆上げ
4. **Blast 機能を内蔵** — 外部メーリングサービス依存をなくす
5. **Membership Tiers でマネタイズ** — 月額制コミュニティを支援
