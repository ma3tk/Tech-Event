# Luma ホスト管理画面 (Event Dashboard) 調査メモ

調査日: 2026-06-04
対象URL:
- https://luma.com/event/manage (404 — 単独パス不可、event_id 必須)
- https://luma.com/event/manage/{event_id}/{tab} (実体。観測時に `Overview / Guests / Registration / Blasts / Insights / More` のサブタブが確認された)
- https://help.luma.com/c/events (ホスト機能のヘルプ目次)
- https://help.luma.com/c/calendars (カレンダー管理のヘルプ)
- https://help.luma.com/c/making-money (収益化)

備考: ホスト管理画面はログイン必須でありゲストとして観察可能な情報は限定的。本ドキュメントはヘルプセンターの記事一覧と URL パターン観察、Luma の機能リスト (Pricing 含む) からの再構成。「(推測)」と明記された箇所は実HTMLからは確証が取れない。

---

## 1. 概要・目的

ホスト管理画面は、イベント主催者・カレンダー管理者が **イベント作成後のすべての運営アクション** を実施する場所。Luma のビジネスモデルの中心 (Plus 課金とチケット手数料) はこの画面のリッチさによって支えられている。

主要な責務:

1. **イベントメタの編集**: 日時、場所、説明、可視性、定員、Approval、Waitlist
2. **ゲスト管理**: 一覧 / 検索 / 承認 / 拒否 / 返金 / チェックイン / CSV
3. **告知 (Blast)**: 招待メール、リマインダー、Newsletter
4. **収益・チケット**: Stripe 連携、価格、クーポン、税、Group Registration
5. **分析**: Event Insights (登録率、Source、地域)
6. **コラボ**: Hosts / Managers の招待、権限管理

---

## 2. URL構造とパスパターン

| パターン | 説明 |
| --- | --- |
| `https://luma.com/event/manage/{event_id}` | デフォルトで Overview にリダイレクト (推測) |
| `https://luma.com/event/manage/{event_id}/overview` | 概要 |
| `https://luma.com/event/manage/{event_id}/guests` | ゲストリスト |
| `https://luma.com/event/manage/{event_id}/registration` | 登録設定 (チケット種別、承認制、質問項目) |
| `https://luma.com/event/manage/{event_id}/blasts` | メール/SMS/WhatsApp の Blast 配信 |
| `https://luma.com/event/manage/{event_id}/insights` | Insights / Analytics |
| `https://luma.com/event/manage/{event_id}/more` | 詳細設定 (削除、複製、ロゴ、テーマ、共同ホスト) |
| `https://luma.com/calendar/manage/{calendar_id}` | カレンダー全体の管理 (推測) |

event_id は `evt-` プレフィックス + 8桁 (推測)。`/event/manage` 単独は 404 だがログイン済みのコンテキストでは "管理可能なイベント一覧" にリダイレクト (推測)。

---

## 3. ページレイアウト (ワイヤーフレーム的記述)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Luma logo]   Discover Events                              [Avatar▾]     │
├──────────────────────────────────────────────────────────────────────────┤
│  ← Back to Event Page          {Event Title}                             │
│                                                                          │
│  [Overview]  [Guests]  [Registration]  [Blasts]  [Insights]  [More]      │  ← サブタブ
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Overview の例:                                                  │    │
│  │                                                                  │    │
│  │   {Going: 84}  {Waitlist: 12}  {Pending: 3}                      │    │
│  │                                                                  │    │
│  │   Quick Actions:                                                 │    │
│  │   [Send Blast]  [Check In]  [Edit Event]  [Manage Tickets]      │    │
│  │                                                                  │    │
│  │   Recent Activity:                                               │    │
│  │   - John Doe registered (5min ago)                               │    │
│  │   - Jane Smith joined waitlist (10min ago)                       │    │
│  │   ...                                                            │    │
│  │                                                                  │    │
│  │   Co-Hosts:                                                      │    │
│  │   [avatar][avatar][+ Add]                                        │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

タブ単位で異なる画面を表示するアプリ的な作り (Next.js App Router の Parallel/Intercepting Routes、または別 page、推測)。

---

## 4. 表示される情報項目の網羅リスト (ヘルプから推定)

### Overview タブ
- Going / Waitlist / Pending / Invited 数 (推測)
- Capacity 進捗バー
- Quick Actions: Send Blast, Check-In, Edit Event, Add to Calendar
- Recent Activity フィード
- Co-Hosts / Managers 表示
- Event Page URL コピー + QR Code (Mobile Wallet Passes 関連)

### Guests タブ
- 検索バー (名前/メール)
- フィルター: Status (Going / Waitlist / Pending / Declined / Refunded), Ticket Type, Check-In Status, Tags
- カラム: Avatar, Name, Email, Ticket Type, Registered At, Status, Check-In, Actions
- 一括選択 → メール送信 / Approve / Reject / Refund / Resend / Delete
- "Download Guest List as CSV" (ヘルプ記事あり)
- "Expanded Guest Table" (有料機能)
- Add Guest 手動追加
- 個別ゲスト詳細モーダル (登録質問の回答も表示)

### Registration タブ
- "Setting your Event Visibility" (Public / Calendar Only / Private / Unlisted)
- Capacity (Unlimited or 数値)
- Waitlist Enabled トグル
- Require Approval トグル
- Ticket Types (複数種別、価格、定員、Sale Period) "Setting Up Ticket Types"
- Group Registration トグル (Group Purchase)
- Registration Questions (テキスト / 選択 / 必須・任意 / 表示順)
- Unlock Codes (招待コード)
- Coupons (Plus 機能)
- Tax/VAT 設定 (Plus 機能)
- Apply Payment + Require Approval 併用設定

### Blasts タブ
- 新規 Blast 作成 (件名, 本文, スケジュール送信時刻)
- 配信対象: All Guests / Going / Waitlist / Pending / カスタムセグメント
- 配信履歴 (送信時刻 / 開封率 / クリック率)
- "Sending or Scheduling Event Blasts" ヘルプ記事
- SMS / WhatsApp 配信 (Plus 機能、"SMS / WhatsApp Messages")
- 週次の送信上限 (Free: 500/週, Plus: 5,000/週, アドオン購入で 10K/25K/100K/週)

### Insights タブ
- 登録数推移 (時系列折れ線)
- Source 別ブレークダウン (Direct / Discover / Calendar / Referral / 各SNS)
- 地域別ブレークダウン (国/都市)
- "Event Insights" ヘルプ記事
- (推測) 開封率 / クリック率 / コンバージョン率
- CSV エクスポート

### More タブ
- "Adding Hosts and Managers" (権限ロール: Host / Manager / Check-In Manager (Plus機能))
- "Cloning Events" (複製)
- "Multi-Session / Recurring Events" (連続開催)
- "Hybrid Events" (オンライン+物理併用)
- "Canceling an Event"
- "Hiding Your Event Location" (登録後に住所公開)
- "Event Themes and Customization" (テーマ/カラー)
- "Event Cover Images"
- "Custom URL" (Plus 機能)
- "Crypto Features in Luma" (NFT verification gating)
- Refund Policy / Event Terms (利用規約)

---

## 5. UIコンポーネント

- Tab Bar (上部の6タブ)
- Stat Card (数値KPI)
- Activity Feed
- Guest Table (検索 + フィルター + 一括操作)
- Drawer (個別ゲスト詳細)
- Toggle Switch (Approval, Waitlist 等)
- Date/Time Picker
- Rich Text Editor (説明文)
- Image Uploader (カバー)
- Stripe Connect ボタン
- Coupon Builder
- Question Builder (Drag&Drop で並び替え推測)
- Blast Composer (メールエディタ)
- Chart (Insights タブ)
- Permission Matrix (Hosts / Managers / Check-In)

---

## 6. 状態による出し分け

| ロール | アクセス |
| --- | --- |
| Owner (作成者) | 全機能 |
| Host (Adding Hosts機能) | 大部分の機能 (削除以外、推測) |
| Manager | ゲスト管理 / Blast / Check-In のみ (推測) |
| Check-In Manager (Plus) | チェックインのみ |
| Free プラン | プラットフォーム手数料5%、SMS/WhatsApp/カスタムURL/Tax/Zapier/API 制限 |
| Plus プラン | プラットフォーム手数料0% + 多機能解放 |
| Enterprise | SSO, SLA, カスタムサポート |

---

## 7. インタラクション

- タブ切替: ルーティング (URL 変更)
- ゲスト承認: チェックボックス一括 → "Approve" → 確認モーダル → トースト
- Blast 送信: プレビューモーダル → スケジュール or 即時送信 → 送信中スピナー → 完了
- チェックイン: QR スキャナーモーダル / 手動チェック / NFC タップ (Hardware Scanners、Enterprise)
- 設定変更: 楽観UI + autosave (推測)
- イベント複製: モーダルで複製範囲選択 → 新規イベント生成 → 編集ページへ遷移

---

## 8. 推測されるAPIコール

- `GET /api/event/{id}/manage/overview` — KPI + 直近アクティビティ
- `GET /api/event/{id}/guests?status=going&search=...&page=...`
- `POST /api/event/{id}/guests/bulk` — 一括 Approve/Reject/Refund
- `GET /api/event/{id}/guests/{guest_id}` — 個別詳細
- `POST /api/event/{id}/blasts` — Blast 作成
- `GET /api/event/{id}/blasts` — Blast 履歴
- `GET /api/event/{id}/insights?range=7d`
- `PATCH /api/event/{id}` — メタ情報更新
- `POST /api/event/{id}/clone`
- `POST /api/event/{id}/cancel`
- `POST /api/event/{id}/hosts` — Co-Host 招待
- `POST /api/event/{id}/checkin?guest_id=...`
- `GET /api/event/{id}/export?type=guests&format=csv`
- Stripe Connect Webhook (`payment_intent.succeeded`, `charge.refunded` 等)

---

## 9. 関連リンク・遷移先

- `← Back to Event Page` (公開ページへ)
- Stripe Dashboard (外部リンク、Connect アカウント)
- ヘルプ記事への直リンク (各設定の右側に "?" アイコン推測)
- Luma API ドキュメント (Plus 機能)

---

## 10. SEOメタ情報・OGP

- 認証必須 / `noindex, nofollow` (推測)
- OGP は不要 (管理画面のため)

---

## 11. レスポンシブ対応

- タブはスマホで縦並びまたは横スクロール
- ゲストテーブルはスマホでカード表示に切替 (推測)
- Insights のチャートはスマホで簡略表示
- モバイルアプリ (iOS / Android) でも管理可能 ("Luma iOS App", "Luma Android App" ヘルプ記事あり)

---

## 12. A11y観点

- テーブルは `<table>` セマンティクス + `aria-sort`
- 一括操作は `aria-live` でアクション結果を読み上げ
- Toggle は `role="switch"` + `aria-checked`
- フォームバリデーションは `aria-invalid` + `aria-describedby`

---

## 13. 模倣実装する際の留意点

- **6タブの責務分割** は Eventbrite/Hopin など他プラットフォームでも踏襲されている定番。最初からこの構造で IA を設計する。
- **権限ロールが4階層** (Owner / Host / Manager / Check-In Manager) と細かい。RBAC を Casbin / next-auth で実装するか自作するか決め打ちが必要。
- **Blast 配信の送信上限** は ESP (SendGrid/Postmark/Resend) のクォータと連動。
- **Stripe Connect** はホストごとに connect_account を持たせる Express アカウント方式が標準。Payout / Refund / Dispute のフックも実装。
- **Insights** は CDP (Segment/PostHog/Mixpanel) もしくは自前 ClickHouse / BigQuery 集計。
- **Cloning Events / Multi-Session** はイベントエンティティの設計に影響大。`series_id` を持たせるなど検討。
- **Mobile Wallet Passes** は Apple Wallet (.pkpass) / Google Wallet JWT 署名が必要。鍵管理が地味に重い。
- **Crypto Gating** (NFT 所有確認) は Web3 walletconnect の連携。
- **Hardware Scanners** (Enterprise) は Bluetooth/USB スキャナーの WebHID API 連携。

---

## 14. connpass との違い / Luma が優れている点・劣っている点

### Luma が優れている点
- **タブ構造の明快さ** (Overview/Guests/Registration/Blasts/Insights/More) で初学ホストでも迷いにくい。connpass の管理画面はサイドメニュー型でやや散らかった印象。
- **Blast (メール配信)** が標準装備。connpass の「参加者向け連絡メール」より自由度が高く、開封率/クリック率まで取れる。
- **Insights の濃さ**: ソース別/地域別ブレークダウン、CSV エクスポート。connpass はアンケート結果と CSV だけ。
- **Check-In Manager 専用ロール**: 当日スタッフだけに権限を絞れる。connpass は管理権限が雑。
- **Cloning / Recurring**: 連続開催コミュニティ向けの効率化。connpass にも「再利用」はあるが弱め。
- **Stripe Connect での即課金**: 銀行口座を繋げばその場で売上発生。connpass は P2P 系の有料機能はあるが弱い。
- **権限階層**: 4ロールで設計されている。connpass はオーナーと管理者の2層。
- **多言語ホスト体験**: 同じ管理画面で多言語イベントを扱える。

### Luma が劣っている点 / connpass の方が良い点
- **抽選機能**: connpass の "先着 + 抽選 + キャンセル待ち + 補欠繰り上げ" のレシピは日本のイベント文化に最適化されており、Luma の Waitlist より細かい。
- **領収書発行 / 経費精算**: connpass は領収書/インボイス発行が標準。Luma は Stripe Receipt 中心で日本企業の経費精算に通らないケースあり。
- **参加者の所属表示**: connpass は管理画面で参加者の「所属企業」「肩書き」が確認できる (採用文脈)。Luma は Bio 任意。
- **アンケート/フィードバック**: Luma は Collect Feedback あるが日本でよく使われる5段階評価+自由記述などのUIは未対応 (推測)。
- **無料イベント中心の体験**: connpass は無料イベント前提でUIが軽快。Luma は有料含めて重め。
- **資料公開UI**: connpass は登壇者ごとの資料リンク欄が標準。Luma は説明文の中に貼るしかない。
- **連絡先メアド (ホストの)** が表に出にくい。connpass はホストへの問い合わせフォームが目立つ。
