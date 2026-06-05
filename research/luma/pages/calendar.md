# Luma カレンダー (コミュニティ) ページ調査メモ

調査日: 2026-06-04
対象URL (サンプリング):
- https://luma.com/cursorcommunity (Cursor Community)
- https://luma.com/superteamJapan (Superteam Japan)
- https://luma.com/startup-calendar (Startup Calendar｜スタートアップカレンダー)
- https://luma.com/buildercommunityanz (Build Club)
- https://luma.com/nyc-tech (Fractal Campus NYC)
- https://luma.com/tokyo (Tokyo シティページ。実体は地理ベースの "公式" カレンダー)
- https://luma.com/tech, https://luma.com/ai (カテゴリページ。カレンダーとほぼ同じ UI 構造)

備考: WebFetch 経由の HTML 観察に基づく。「(推測)」と明記された箇所は実HTMLから確証が取れず、ヘルプ記事や挙動推定で補完したもの。

---

## 1. 概要・目的

Luma の **Calendar** はコミュニティ・主催者・トピック・場所などをまとめる "コレクションページ" であり、connpass の「グループ (Group)」に近いが、Luma の方が **軽量で多目的** に作られている。

具体的には3種類のカレンダーがある:

1. **コミュニティ・カレンダー** (例: Cursor Community, Build Club, Superteam Japan): ユーザーが作成。複数の主催者が協働してイベントを集約。
2. **シティ・カレンダー** (例: `/tokyo`, `/singapore`): Luma 公式が運営。地理的人気イベントが自動集約 (推測)。
3. **カテゴリ・カレンダー** (例: `/tech`, `/ai`): Luma 公式運営。タクソノミーで自動集約。

すべて URL は `/{slug}` のフラット名前空間で、Discover からの遷移には `?k=c` / `?k=p` / `?k=t` のソース識別子が付く。

役割:

- **Subscribe** で継続フォロー (≒ メール購読 + 通知 + iCal 同期)
- イベント一覧 (Upcoming / Past) を時系列で展開
- コミュニティのブランディング (カバー、説明、SNSリンク)
- (権限がある場合) Submit Event でメンバーがイベント投稿

---

## 2. URL構造とパスパターン

| パターン | 説明 |
| --- | --- |
| `https://luma.com/{slug}` | カレンダー本体。スラッグはホストが指定 |
| `https://luma.com/{slug}?k=c` | Discover の Featured Calendars 経由 |
| `https://luma.com/{city-slug}?k=p` | シティカレンダー (Popular) |
| `https://luma.com/{category}?k=t` | カテゴリカレンダー (Tech 等) |
| `webcal://api.luma.com/ics/calendar/{id}` | (推測) iCal 同期 URL |
| `https://luma.com/{slug}/submit` | Submit Event (推測。実体は `/create?calendar={id}`) |

ヘルプ記事 "iCal Syncing" あり → カレンダー全体を Apple/Google Calendar に流し込める。

---

## 3. ページレイアウト (ワイヤーフレーム的記述)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Luma logo]   Discover Events                              [Sign In]     │
├──────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────────────┐ │
│ │  [大きめのカバー画像 (帯状)]                                          │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│ ┌──────┐  Cursor Community                                               │
│ │avatar│  Cursor community meetups, hackathons, workshops...             │
│ └──────┘  [X] [Web] [Discord] ...                                        │
│                                                                          │
│   [ Subscribe ]   [ Submit Event ]    [Map view ↗]                       │
│                                                                          │
│   ─────────────────────────────────────────────────────────────────      │
│   [Upcoming]  Past                       0 events pending approval       │
│   ─────────────────────────────────────────────────────────────────      │
│                                                                          │
│   June 2026                                                              │
│   ┌──────────────────────────────────────────────────────────────────┐   │
│   │ Sat 6/13  [event icon] Cursor Hackathon — Yaoundé                │   │
│   │           Yaoundé, Cameroon · +84 going                          │   │
│   ├──────────────────────────────────────────────────────────────────┤   │
│   │ Sun 6/14  [event icon] Cursor Meetup Portoviejo                  │   │
│   │           Portoviejo · +35 going                                 │   │
│   ├──────────────────────────────────────────────────────────────────┤   │
│   │ ...                                                              │   │
│   └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ Footer                                                                   │
└──────────────────────────────────────────────────────────────────────────┘
```

スマホでは1カラム、カバー画像はビューポート全幅、サイドのSubscribeはスティッキー (推測)。

---

## 4. 表示される情報項目の網羅リスト

### ヘッダ部 (Masthead)
- カバー画像 (横長)
- アバター (正方形、48〜96px)
- カレンダー名 (H1)
- 説明文 (1〜2 行)
- 外部リンク群 (X, Instagram, Discord, YouTube, TikTok, LinkedIn, Website, Email など、ホスト設定)
- (シティの場合) 都市の説明 (例: "Tokyo's events span tech, culture, and innovation. The lively scene reflects the city's blend of tradition and futuristic trends")
- (カテゴリの場合) 件数表示 (例: "Tech: 4K Events, 46K Subscribers")

### アクションエリア
- "Subscribe" / "Subscribed" トグルボタン
- "Submit Event" (公開Submission許可時のみ。未ログインなら Sign In 誘導)
- "Map view" トグル (地図表示モード)
- "Manage Calendar" (ホストのみ。`/calendar/manage/{id}` 推測)

### イベントフィルター
- "Upcoming" / "Past" タブ
- (推測) Event Tag フィルター (ヘルプ "Event Tags for Calendar Filtering" あり)
- 月ナビゲーション (例: June)
- "X events pending approval" (ホスト or 管理者のみ)

### イベントリスト
各行に:
- 日付 (例: Sat 6/13)
- 時刻 (現地)
- アイコン or 小型カバー
- イベント名
- 場所 (Williamsburg / 111 Conselyea St / Online 等)
- ホスト名 (オプション)
- 参加者数 (+84 going / +35 going)
- ステータスバッジ (Near Capacity, Sold Out, Waitlist, Free, ¥800, A$25)
- ホバーで詳細プレビュー (推測)

### サンプリングしたイベント例 (Fractal Campus NYC より)
- Enough Agents, I Wanna Deploy!!! — Aurelian Labs
- Roof brunch v2
- The Last SideQuest IRL (#40) — Chandiran
- Fractal Circles — Michael Tong
- AI-Powered Design and the Connected Engineering Team — SWUG NYC
- Trivia Game Night — Laeo Crnkovic-Rubsamen & Daniel Golliher
- Context Engineering Guild: June Edition — Atin Woodard
- Builders NYC: Hack Night #1 — Samuel Michnik (+34 attendees)

---

## 5. UIコンポーネント

- **Masthead Card**: カバー画像 + アバター + タイトル + 説明 + ソーシャル
- **Subscribe Toggle**: ピル形 / 押下で楽観UI + トースト
- **Submit Event Button**: 押下でイベント作成フォーム (カレンダー指定済)
- **Map View Toggle**: 地図 ↔ リスト 切替
- **Tab Bar**: Upcoming / Past
- **Month Section Header**: "June 2026"
- **Event List Row**: 日付バッジ + 時刻 + 小型カバー + メタ
- **Status Pill**: Free / 価格 / Sold Out / Waitlist / Near Capacity
- **Empty State**: "No upcoming events yet."
- **Admin Notice**: "X events pending approval"
- **Past Events Section**: Upcoming と同じ UI で Past タブ時

---

## 6. 状態による出し分け

| 状態 | 振る舞い |
| --- | --- |
| 未ログイン | Subscribe 押下 → サインインへ |
| ログイン × 未購読 | Subscribe ボタン |
| ログイン × 購読済 | "Subscribed" バッジ + 押下で Unsubscribe メニュー |
| ログイン × ホスト | "Manage Calendar" + Pending Approval 件数表示 |
| ログイン × Manager (権限委譲) | 一部管理機能のみ可視 (Collaborating Calendars 機能) |
| Empty | "No upcoming events yet." |
| Submission Closed | Submit Event ボタン非表示 (推測) |

---

## 7. インタラクション

- Subscribe: 楽観UI → API → トースト "Subscribed to {Calendar}" → メール配信開始
- Unsubscribe: ドロップダウン (Subscribed のクリック) → Email頻度設定 (Daily/Weekly/Off) (推測、Newsletter機能あり)
- Submit Event: モーダル or `/create` への遷移 (カレンダー pre-fill)
- Map view: イベントの場所をマップ上にピン (地理ベース)
- 月切替: クライアントサイドでスクロール (推測、URL 不変)
- ホバー時にイベントカードのプレビュー (推測)
- Past タブ: 時系列降順 + フィルター

---

## 8. 推測されるAPIコール

- `GET /api/calendar/{slug}` — カレンダーメタ情報
- `GET /api/calendar/{slug}/events?status=upcoming&limit=50` — イベントリスト
- `GET /api/calendar/{slug}/events?status=past&page=N`
- `POST /api/calendar/{slug}/subscribe` — Subscribe
- `DELETE /api/calendar/{slug}/subscribe`
- `PATCH /api/calendar/{slug}/subscription` — メール頻度設定
- `POST /api/calendar/{slug}/submit-event` — Submit Event
- `GET /ics/calendar/{slug}` — iCal フィード

---

## 9. 関連リンク・遷移先

- `/{event-slug}` 各イベント詳細
- `/user/{host-handle}` カレンダーホストのプロフィール
- 外部ソーシャル (X, Discord, etc.)
- ICS フィード (webcal://)
- (ホストのみ) `/calendar/manage/{id}` または `/event/manage/calendar` 系

---

## 10. SEOメタ情報・OGP

- `<title>`: "{Calendar Name} · Luma"
- `<meta name="description">`: カレンダー説明文
- canonical: `https://luma.com/{slug}` (`?k=c` は除外)
- OGP image: カバー画像 (1200×630)
- `schema.org/EventSeries` or `Organization` (推測)
- ICS / webcal feed の `<link rel="alternate" type="text/calendar">` (推測)

---

## 11. レスポンシブ対応

- カバー画像はスマホで縦長クロップ (object-position: center)
- アクションボタン (Subscribe/Submit) は縦積み
- イベント行は日付ラベルが先頭にラップ
- Map view はスマホで全画面切替 (推測)

---

## 12. A11y観点

- H1 = カレンダー名
- Subscribe ボタンは `aria-pressed` で購読状態を表現 (推測)
- 月セクションは `<section aria-labelledby="month-2026-06">` 構造 (推測)
- イベントリストは `<ul><li>` セマンティクス
- ステータスバッジは色だけでなくテキストで明示

---

## 13. 模倣実装する際の留意点

- **カレンダー = ホスティング主体** という抽象化が秀逸。コミュニティ・シティ・カテゴリを同じ Calendar 型で扱える。
- **Subscribe の軽さ** がコミュニティ拡大の核。メール購読 + 通知 + iCal が1ボタンで連動。
- **Submission Approval フロー** が標準装備 (`X events pending approval`)。コミュニティが大きくなった時のスパム対策。
- **Multi-host / Manager** はヘルプ記事 "Collaborating Calendars" 参照。権限階層の設計を最初から入れる。
- **シティ・カテゴリは Luma 公式運営** のため、ユーザー作成のカレンダーとは別系統。模倣時はこの2階層を分離。
- **Map view** はイベントの地理座標 (lat/lng) を保存していないと出せない。Venue 入力時に geocoding する必要あり。
- **過去イベントの表示**: 後述するように Past タブのUI/データ設計は意外と重い。

---

## 14. connpass との違い / Luma が優れている点・劣っている点

### Luma が優れている点
- **Subscribe の摩擦の低さ**: ワンタップ購読、メール頻度の選択肢、iCal 同期が標準。connpass の「グループ参加」は重く、グループメンバー = (運営的に) 半固定の参加者集団になりがち。
- **複数ホストでの共同運営 (Collaborating Calendars)**: 大型コミュニティが複数人で運営しやすい。connpass はグループに対する管理者ロールはあるが、シャドウ運営しづらい。
- **公式シティ/カテゴリカレンダー**: コミュニティ未所属の人でも "Tokyo の人気" だけで集約閲覧できる。connpass にはこの抽象化がない。
- **Submission フロー**: コミュニティに対して "メンバーがイベント投稿 → 承認" が標準。connpass は基本グループ運営者のみがイベントを作る。
- **カレンダー → ICS フィード**: そのまま Google/Apple Calendar に流せる。connpass にもフィードはあるが ICS 化は弱い。
- **多言語コンテンツ混在**: 同じカレンダーに日英のイベントが共存。

### Luma が劣っている点 / connpass の方が良い点
- **グループ内の参加者プロフィール**: connpass はグループメンバー一覧 + 過去参加履歴があり、運営が「誰が常連か」を把握しやすい。Luma はサブスクライバ数のみ。
- **会員制グループ**: connpass は「参加に承認が必要なグループ」「メンバーのみ可視」が明確。Luma は Calendar 単位での「メンバー限定」は弱く、各イベントの可視性 (Public/Private) で代替するため運用が煩雑。
- **タグ/トピック**: connpass はタグでカテゴリ横断的に発見できる。Luma は Calendar 内の Event Tags が控えめ。
- **資料アーカイブ**: connpass はグループ単位で資料リストがある。Luma は Past タブで個別イベントを開かないと内容が分からない。
- **ランキング/集客力指標**: connpass は「人気グループ」「人気イベント」ランキングが公開。Luma は購読者数程度しか可視化されない。
- **過去イベントの可視性とSEO**: connpass の過去イベントは検索インデックス上の蓄積が大きく SEO に効く。Luma は新規イベントへの誘導を優先しているため過去SEOは弱い (推測)。
