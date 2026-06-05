# Luma イベント詳細ページ調査メモ

調査日: 2026-06-04
対象URL (サンプリング):
- https://luma.com/devtools (Dev Tools Founder Breakfast — 過去イベント)
- https://luma.com/ai-tinkerers (404 — 既に削除)
- https://luma.com/yarn-yap-7 (404 — slug 形式違いと推測)
- 同種パターンの観察補完: https://luma.com/nyc-tech 内のイベント参照

備考: WebFetch 経由の HTML 観察に基づく。「(推測)」と明記された箇所は実HTMLからは確証が取れず、ヘルプ記事や挙動推定で補完したもの。著作物 (説明文等) は引用に留め、模倣実装ではコピーしない。

---

## 1. 概要・目的

イベント詳細ページは Luma の **ファネルの心臓部** であり、SNS シェアや QR コード経由で来た訪問者に「登録」させることに最適化されている。

役割:

1. **登録コンバージョン**: ヒーロー右側 (Sticky) に "Request to Join" / "Register" / "Get Tickets" を常時表示。
2. **イベント内容の伝達**: タイトル、日時、場所、説明、ホスト、参加者プレビューを左カラムに集約。
3. **シェアと再来訪**: SNS シェア、Add to Calendar、Subscribe (主催カレンダー) を提供。
4. **コミュニティ動線**: 主催者プロフィール、所属カレンダー、関連イベントへの誘導。

`/discover` から流入する人は **そのイベント単発** を見に来るが、Luma の真の狙いはホスト/カレンダーへの Subscribe と「他のイベントの発見」へ繋げること。

---

## 2. URL構造とパスパターン

| パターン | 説明 |
| --- | --- |
| `https://luma.com/{event-slug}` | フラットなスラッグ。短く覚えやすい (例: `/devtools`)。スラッグはホストが自由設定 (一部予約語あり)。 |
| `https://luma.com/event/evt-{xxxxxxxx}` | (推測) システム生成の event id ベース URL。スラッグ未設定時のフォールバックと推測。 |
| `?utm_source=...` | UTM パラメータ多用 (招待メール、Twitter、Slack 等の流入元) |
| `?invite={code}` | 招待コード付き URL (推測。Approval-required event で個別招待を受け取った人用) |
| `?promo={coupon}` | プロモコード適用 (推測) |
| `?ref={user_handle}` | リファラル (推測。Event Referrals 機能のヘルプ記事あり) |

スラッグは Luma ホスト全体で **グローバルユニーク** であり、トップレベル名前空間 `/` を共有するので衝突は早い者勝ち。

---

## 3. ページレイアウト (ワイヤーフレーム的記述)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Luma logo]        Discover Events                          [Sign In]   │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────┐  ┌─────────────────────────────────────┐ │
│ │                            │  │                                     │ │
│ │   [カバー画像 960×480]      │  │   When (日時 + Add to Calendar)     │ │
│ │                            │  │   ────────────                      │ │
│ │                            │  │   Friday, June 13                   │ │
│ │                            │  │   9:30 AM - 11:00 AM JST            │ │
│ │                            │  │                                     │ │
│ ├────────────────────────────┤  │   Where (場所 + Mapリンク)           │ │
│ │ {Event Title 大型 H1}      │  │   ────────────                      │ │
│ │                            │  │   Blue Bottle Coffee                │ │
│ │ Presented by              │  │   2 S Park St, San Francisco, CA    │ │
│ │ [icon] {Calendar Name}     │  │   [📍 Show on map]                  │ │
│ │                            │  │                                     │ │
│ ├────────────────────────────┤  │   ┌─────────────────────────────┐   │ │
│ │ Hosted By                  │  │   │  Request to Join            │   │ │
│ │ [avatar] Irina Nazarova    │  │   └─────────────────────────────┘   │ │
│ │ [avatar] (Co-Host)         │  │   ※ 状態により Register / Get      │ │
│ │                            │  │      Tickets / Sold Out / Waitlist  │ │
│ ├────────────────────────────┤  │      / Past Event に切替            │ │
│ │ About Event                │  │                                     │ │
│ │ {Rich text 説明文}          │  │   Ticket Price: Free / $XX          │ │
│ │                            │  │   Approval required, etc.           │ │
│ ├────────────────────────────┤  │                                     │ │
│ │ Going (人数)               │  └─────────────────────────────────────┘ │
│ │ [avatar avatar avatar +N]  │                                          │
│ ├────────────────────────────┤                                          │
│ │ Contact the Host           │                                          │
│ │ Report Event               │                                          │
│ └────────────────────────────┘                                          │
├─────────────────────────────────────────────────────────────────────────┤
│ Footer (Discover / Pricing / Help / SNS / Get the App)                  │
└─────────────────────────────────────────────────────────────────────────┘
```

PC: 2カラム (左メイン約 60%、右サイド約 40%、サイドは Sticky)
スマホ: 1カラム (画像 → タイトル → 右サイドが上に移動 → 説明 → ホスト)

---

## 4. 表示される情報項目の網羅リスト

実HTMLで観測できた要素 (Dev Tools Founder Breakfast の例):

- カバー画像 (960×480、CDN最適化)
- イベントタイトル (例: "Dev Tools Founder Breakfast")
- ホスト名 (例: "Irina Nazarova" — アバター付き)
- Co-Host / Manager 表記 (推測、複数ホスト時)
- ステータスバッジ: "Past Event" / "Sold Out" / "Near Capacity" / "Waitlist" / "Going" / "Invited"
- 日時:
  - 開始日時 + 終了日時
  - タイムゾーン (ユーザーのローカルに自動換算、推測)
- 場所:
  - 物理: Venue 名 + 住所 + Google Maps 連携 (例: Blue Bottle Coffee, 2 S Park St, San Francisco, CA 94107, USA)
  - オンライン: "Online" 表示 + Zoom/Google Meet URL は登録後に公開 (推測)
  - Hybrid: 両方表示
- 説明文 (Rich text、見出し・リスト・リンク対応、ヘルプ記事 "Rich Text on Luma" より)
- 登録 CTA: 状態によって
  - "Register" — 一般公開
  - "Request to Join" — 承認制 (Approval required)
  - "Get Tickets" — 有料
  - "Join Waitlist" — 満員
  - "Sold Out" (押下不可)
  - "Past Event" (押下不可)
- 価格: "Free" / "$XX.XX" / "¥XXX" / 複数 Ticket Type
- 主催コミュニティ: "Presented by {Calendar}" のリンク
- 参加者プレビュー: 数人のアバター + "+N going"
- Contact the Host: メール DM (推測)
- Report Event: 通報フォームへ
- Add to Calendar: Google / Apple / ICS ダウンロード (推測)
- Share: Twitter / Facebook / Copy Link (推測)

---

## 5. UIコンポーネント

| 種別 | 用途 |
| --- | --- |
| Hero Cover | 16:8 アスペクトのカバー画像 |
| H1 Title | 大型タイトル |
| HostCard | アバター + 名前 + Host バッジ |
| InfoBlock (When/Where) | アイコン + 1行ラベル + 詳細 |
| CTA Sticky Card | 右サイドに張り付くカード |
| Approval Notice | "This event requires approval." 等の注意書き |
| RichText | 本文 |
| Attendees Strip | アバター列 + 残人数 |
| Action Row | Contact / Report / Add to Calendar / Share |
| Wallet Pass Button | "Add to Apple Wallet" (Mobile Wallet Passes 機能) |

---

## 6. 状態による出し分け

| 状態 | 表示変化 |
| --- | --- |
| 未ログイン × 公開 | "Register" 押下 → サインインフロー後に登録 |
| 未ログイン × 承認制 | "Request to Join" 押下 → サインイン → 質問フォーム |
| 未ログイン × 有料 | "Get Tickets" 押下 → サインイン → チェックアウト |
| ログイン × 未登録 | 上記 CTA 表示 |
| ログイン × 登録済 | "You're In" / "On the Waitlist" バッジ + Cancel registration |
| ログイン × 承認待ち | "Pending Approval" バッジ |
| ログイン × ホスト | CTA エリアに "Manage Event" ボタン (→ `/event/manage/{id}`) |
| 満員 | CTA が "Join Waitlist" に変化 (Waitlist Enabled の場合) |
| 売切れ | "Sold Out" (Waitlist 無効時) |
| 過去 | "Past Event" バッジ + CTA 非活性 + Feedback 収集 (Collect Feedback 機能) |
| Private/Hidden | 招待コード必須。直接 URL アクセスは Sign In or 404 |
| 位置非公開 (Hidden Location) | 「登録後に公開」表示 (Hiding Your Event Location 機能) |

---

## 7. インタラクション

- CTA 押下時: モーダル開き、登録質問 (Collect Registration Questions) を表示
- 質問フォーム: メール、名前 (必須)、ホスト追加項目 (任意/必須切替)
- 承認制: 送信後に "Pending Approval" トースト
- 有料: Stripe Checkout (埋め込み or リダイレクト、推測)
- Add to Calendar: ドロップダウン (Google / Apple / Outlook / ICS)
- Share: モーダルで URL コピー + SNS ボタン
- Contact the Host: モーダルでメッセージ入力 → Host のメールへ転送 (Contacting Event Hosts 機能)
- Report Event: モーダル + 通報理由選択
- カバー画像: クリックで拡大 (推測)
- ホストカード: クリックで `/user/{handle}` へ
- カレンダー名: クリックで `/{calendar-slug}` へ

---

## 8. 推測されるAPIコール

- `GET /api/event/{slug}` — イベントメタ情報 (タイトル、ホスト、説明、ticket types, capacity, status, approval)
- `GET /api/event/{slug}/attendees?limit=8` — 参加者プレビュー
- `POST /api/event/{slug}/register` — 登録 (body: 質問の回答、guest count, payment intent)
- `POST /api/event/{slug}/waitlist` — Waitlistへ
- `POST /api/event/{slug}/cancel` — 登録キャンセル
- `POST /api/event/{slug}/contact-host` — Host への問い合わせ
- `POST /api/event/{slug}/report` — 通報
- Stripe: `POST /v1/payment_intents` (Stripe Connect、ホスト = 接続アカウント、推測)
- `POST /api/event/{slug}/checkin` — チェックイン (QR スキャン、Mobile Wallet)
- WebSocket / SSE: `going` カウント、Waitlist 状態のリアルタイム更新 (推測)

---

## 9. 関連リンク・遷移先

- `/{calendar-slug}` — 主催カレンダー
- `/user/{host-handle}` — ホストプロフィール
- `/event/manage/{event-id}` — (ホストのみ) 管理画面
- 関連イベント (推測): "More from this Calendar" セクションで同カレンダーの他イベント
- Google Maps 外部リンク

---

## 10. SEOメタ情報・OGP

- `<title>`: "{Event Title} · Luma"
- `<meta name="description">`: 説明文先頭 160 文字
- canonical: `https://luma.com/{slug}`
- OGP: カバー画像 (1200×630 にリサイズされて配信)
- 構造化データ: `schema.org/Event` (eventStatus, eventAttendanceMode, location, offers, performer) — 必須項目で Google Events 検索に出る
- "Updating Social Images" ヘルプ記事あり → ホストがカバー差し替え後の OGP キャッシュ問題に対応
- ICS フィードあり (Add to Calendar 連携)

---

## 11. レスポンシブ対応

- PC: 2カラム (左 説明 + 右 Sticky CTA)
- タブレット: 1カラムだが CTA カードが画面下部に Sticky (推測)
- スマホ: 1カラム + 画面下部固定の CTA バー (Apple/Eventbrite 風、推測)
- カバー画像はビューポート幅にフィット、`object-fit: cover`

---

## 12. A11y観点

- H1 1個 (タイトル)
- CTA ボタンに状態に応じた aria-label
- フォームの label / required / aria-invalid
- アバター画像: alt にホスト名
- "Past Event" 等のバッジは `role="status"` (推測)
- カラーオンリーでステート伝達しないように、テキスト併用
- フォーカスリングが視認できるダーク系コントラスト (Luma の DS)

---

## 13. 模倣実装する際の留意点

- **Sticky CTA カード**は CVR の核。スクロール追従、満員/有料/過去で状態切替、登録済の時の表示など状態数が多い。状態マシン化必須。
- **Approval required + Capacity + Waitlist + Ticket Type** の組み合わせ爆発が業務複雑度の8割。データモデル設計を最初に固める。
- **OGP の動的生成** は SNS 流入の生命線。`vercel/og` 等で 1200×630 を即時生成する設計が必要。
- **構造化データ (`schema.org/Event`)** は Google 検索からの流入に直結。必ず実装する。
- **承認制 + 質問項目 + 招待コード** の3つは「クローズドコミュニティ」の主催者に刺さる Luma の差別化要素。
- **画像 CDN**: Cloudflare Image Resizing を使うか、Next.js Image + Vercel か、自前か、決め打ちが必要。
- **タイムゾーン**: 「日本のホストが米国時間で開催」のケースが頻発。表示は閲覧者のローカル、保存は UTC + IANA tz (Asia/Tokyo 等)。

---

## 14. connpass との違い / Luma が優れている点・劣っている点

### Luma が優れている点
- **有料イベント・チケット販売がネイティブ**: Stripe Connect で即販売開始。connpass は基本無料イベント中心で、有料化のハードルが高い (`connpass チケット販売` で別フロー)。
- **承認制 (Request to Join)**: ワンクリックで導入。クローズドな勉強会・VIP集客に最適。connpass にも参加者承認はあるがUI/UXは旧式。
- **モバイルウォレットパス**: Apple Wallet / Google Wallet にチケットを保存可。当日チェックインが滑らか。
- **Sticky CTA + 状態マシンの完成度**: 満員 → Waitlist、承認制 → Pending、有料 → Stripe Checkout がシームレス。
- **SNS シェア時のカバー画像**: 16:8 アスペクトのカバー画像が OGP に映える。connpass はバナー画像が小さく地味。
- **Add to Calendar / ICS 自動連携**: 即カレンダーに入れられる。connpass はリマインダーメール頼り。
- **Rich Text 説明**: 見出し・リスト・画像・リンクで装飾可能。connpass は Markdown だがリッチ感は劣る。

### Luma が劣っている点 / connpass の方が良い点
- **抽選機能の弱さ**: connpass は厳密な抽選UIがあり、不正対策・先着/抽選切替が定番。Luma は基本「先着 + 承認制 + Waitlist」で抽選は非ネイティブ。
- **資料公開・アンケート**: connpass は発表資料 (Speaker Deck/SlideShare) リンク欄が標準。Luma は説明欄に貼るのみ。
- **参加費の領収書**: connpass は会社経費精算のための領収書発行UIあり。Luma は Stripe Receipt 中心。
- **過去イベント検索性**: connpass は過去イベントから参加者 (の所属) を辿れる。Luma は過去イベントの可視性が弱い (ホストの管理画面側)。
- **コメント欄**: connpass はイベント詳細にコメント欄があり、Q&A が公開される。Luma は Event Chat (有料) として別機能化。
- **キャンセル時の振る舞い**: connpass は補欠繰り上げ・繰り下げのルールが明確。Luma は Waitlist の自動繰り上げはあるが日本の「キャンセル文化」とは違う。
- **日本語ローカライズ**: タイムゾーン表記・日付フォーマットなどが英語前提。
