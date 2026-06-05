# Luma Discover / Explore ページ調査メモ

調査日: 2026-06-04
対象URL:
- https://lu.ma/discover (301 → https://luma.com/discover)
- https://lu.ma/explore (301 → https://luma.com/explore、 `/explore` は `/discover` と同じビュー)

備考: WebFetch 経由の HTML 観察に基づく一次調査メモ。「(推測)」と明記された箇所は実HTMLから確証が取れず、ヘルプ記事や挙動推定で補完したもの。

---

## 1. 概要・目的

`/discover` は Luma の **公開イベント探索ハブ** であり、トップが「ホスト獲得」に特化しているのと対照的に、参加者・潜在ユーザーが「自分が行ける/興味あるイベント・コミュニティ」を見つけるための入口。同じ意味で `/explore` も用意されており、両者は同等のコンテンツを返す (実質エイリアス、推測)。

役割は以下の3層:

1. **(位置情報ベースの) Popular Events**: ユーザーの推定都市の人気イベントを直接見せる。サインイン前でも地理情報 (IP) を見て出し分け (推測)。
2. **カテゴリ起点のディスカバリー**: Tech / AI / Food & Drink / Arts & Culture / Climate / Fitness / Wellness / Crypto という8カテゴリでドリルダウン。
3. **コミュニティ/カレンダー起点のディスカバリー**: Featured Calendars と地域別 Local Events で「興味のある主催者」を見つける。

`/discover` は **SEO のメインランディング** にもなっており、各カテゴリ・各シティへ 1 階層で誘導することで内部リンクのハブにもなっている。

---

## 2. URL構造とパスパターン

| パターン | 説明 |
| --- | --- |
| `https://luma.com/discover` | Discover メイン (位置情報自動判定) |
| `https://luma.com/explore` | Discover と同じ内容のエイリアス (推測) |
| `https://luma.com/{category}?k=t` | カテゴリページ (`tech`, `ai`, `food`, `arts`, `climate`, `fitness`, `wellness`, `crypto`)。`k=t` は Tech (= category) 由来のソース識別子と推測 |
| `https://luma.com/{city}?k=p` | シティページ (`tokyo`, `singapore`, `bangkok`, `auckland`, ...)。`k=p` は Popular (= place) 由来 |
| `https://luma.com/{calendar-slug}?k=c` | Featured Calendar (`startup-calendar`, `superteamJapan`, `cursorcommunity`, ...) `k=c` は Calendar 由来 |

`?k=t/p/c` パラメータはクリック元の文脈を保存し、回遊計測やレコメンドのフィードバックに利用していると推測される。

---

## 3. ページレイアウト (ワイヤーフレーム的記述)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Luma logo]        Discover Events              [Sign In]                  │
├────────────────────────────────────────────────────────────────────────────┤
│  Discover Events                                                           │  ← H1
│  Explore popular events near you, browse by category, or check out         │
│  some of the great community calendars.                                    │
├────────────────────────────────────────────────────────────────────────────┤
│  Popular Events                                            [View All →]    │
│                          Tokyo / Singapore / NYC ...                       │  ← 地域名 (自動判定)
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                     │
│  │Card 1│ │Card 2│ │Card 3│ │Card 4│ │Card 5│ │Card 6│                     │  ← 6枚程度
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                     │
├────────────────────────────────────────────────────────────────────────────┤
│  Browse by Category                                                        │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                                               │
│  │Tech│ │ AI │ │Food│ │Arts│                                               │  ← 8カテゴリ (4x2)
│  └────┘ └────┘ └────┘ └────┘                                               │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                                               │
│  │Clim│ │Fit │ │Well│ │Cryp│                                               │
│  └────┘ └────┘ └────┘ └────┘                                               │
├────────────────────────────────────────────────────────────────────────────┤
│  Featured Calendars                                                        │
│  ┌──────────────────────────────────┐ ┌──────────────────────────────────┐ │
│  │ [icon] Startup Calendar  [Sub.]  │ │ [icon] Superteam Japan  [Sub.]   │ │
│  │ 説明文 2行                       │ │ 説明文 2行                       │ │
│  └──────────────────────────────────┘ └──────────────────────────────────┘ │
│  ... (合計10枚)                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│  Explore Local Events                                                      │
│  [Asia & Pacific] [North America] [Europe] [Africa] [South America]        │  ← タブ
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                    │
│  │Tokyo 31│ │Singap48│ │Bengal26│ │Tel A 21│ │Taipei18│ ...                │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘                    │
├────────────────────────────────────────────────────────────────────────────┤
│ [Luma logo]   Discover   Pricing   Help            [IG] [X] [Email]        │  ← フッター
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. 表示される情報項目の網羅リスト

### Popular Events (地域: Tokyo の例)

`View All` ボタン付きで 6 件表示。観測されたイベント例:
- Yarn and Yap vol. 7 — Matcha Passport
- Liquid AI Showcase: Frontier Speech Systems, Post-Training RL, and Edge VLMs
- Claude Code Channels でエビを作ろう！
- iiyon!! Run ＠Imperial Palace☕️ — Kaiteki Cafe
- AI Workshop in Tokyo - ElevenLabs — Impact HUB Tokyo
- THE DRIP HOUSE Vol.10 — SUGARY 恵比寿店

各カードに含まれる情報:
- カバー画像 (80×80px、CDN最適化、`cdn-cgi/image` 経由、WEBP、DPR=2、q=75)
- イベントタイトル (H3)
- ホスト名 (ある場合のみ)

### Browse by Category (8件)

| カテゴリ名 | 件数表記 | パス | 補足 |
| --- | --- | --- | --- |
| Tech | 4K Events | `/tech?k=t` | 46K Subscribers |
| Food & Drink | 484 Events | `/food?k=t` | |
| AI | 3K Events | `/ai?k=t` | 74K Subscribers |
| Arts & Culture | 2K Events | `/arts?k=t` | |
| Climate | 785 Events | `/climate?k=t` | |
| Fitness | 2K Events | `/fitness?k=t` | |
| Wellness | 1K Events | `/wellness?k=t` | |
| Crypto | 610 Events | `/crypto?k=t` | |

各カードはアイコン (絵文字または独自アイコン) + 名前 + 件数。

### Featured Calendars (10件) 観測例

1. Startup Calendar｜スタートアップカレンダー (Tokyo)
2. Superteam Japan (Tokyo, Solanaコミュニティ)
3. Pacific Meta (Tokyo)
4. OpenClaw Meetups (グローバル)
5. Reading Rhythms Global ("Not a book club. A reading party.")
6. Build Club (50+ cities, 30K+)
7. South Park Commons
8. Design Buddies (SF/LA + online)
9. Cursor Community
10. Google DeepMind

各カード:
- 48×48px の正方アバター画像
- カレンダー名
- 説明文 (1〜2行)
- Subscribe ボタン (押下で購読、未ログインなら `/signin` 誘導)

### Explore Local Events (タブ + 都市カード)

タブ: `Asia & Pacific` / `North America` / `Europe` / `Africa` / `South America`

Asia & Pacific の都市と件数 (調査時):
Auckland(3), Bangkok(16), Bengaluru(26), Brisbane(5), Dubai(10), Ho Chi Minh City(9), Hong Kong(16), Honolulu(5), Jakarta(8), Kuala Lumpur(12), Manila(5), Melbourne(10), Mumbai(12), New Delhi(11), Seoul(18), Singapore(48), Sydney(11), Taipei(18), Tel Aviv-Yafo(21), Tokyo(31)

各都市: アイコン + 名前 + 件数。

---

## 5. UIコンポーネント

- **セクションヘッダー**: タイトル + 右側 "View All" リンク
- **EventCard (小型)**: 80×80px 画像 + 2行タイトル + 1行ホスト
- **CategoryCard**: アイコン + ラベル + 件数 (4列グリッド)
- **CalendarCard**: アバター + タイトル + 説明 + Subscribe ボタン (2列グリッド)
- **CityCard**: アイコン + 都市名 + 件数 (5列前後グリッド)
- **TabBar**: 地域フィルター。`role="tablist"` 推測
- **Subscribe ボタン**: 押下で `POST /api/calendar/subscribe` (推測) → 楽観UI更新 → 未ログインなら `/signin` リダイレクト

---

## 6. 状態による出し分け

| 状態 | 振る舞い |
| --- | --- |
| 未ログイン | Popular Events の都市が IP から自動推定 (推測)。Subscribe ボタンは押下時にサインインへ |
| ログイン済 | 都市はユーザー設定された "Home City" を優先 (推測)。Subscribed なカレンダーは "Subscribed" バッジ表示 (推測)、ボタンが Unsubscribe トグル |
| 都市判定失敗 | デフォルトでグローバル人気 (推測) |
| 空状態 | 該当都市にイベントなしの場合は近隣都市にフォールバック (推測) |

---

## 7. インタラクション

- Popular Events: カードクリックでイベント詳細 (`/{event-slug}`) へ
- View All: シティページ (`/{city}?k=p`) へ
- Category Card: カテゴリページ (`/{category}?k=t`)
- Calendar Card: カレンダーページ (`/{calendar-slug}?k=c`)
- Subscribe: 楽観UI → API → 成功時にトースト "Subscribed to {Calendar}"。失敗時にロールバック
- Local Events タブ: クライアントサイドでセクション切替 (URLは変えない、推測)
- ホバー時: 画像が微妙にスケールアップ (推測、Luma の標準モーション)

---

## 8. 推測されるAPIコール

- `GET /api/discover?city={city}` — Popular Events リスト
- `GET /api/categories` — カテゴリと件数
- `GET /api/featured-calendars` — Featured Calendars
- `GET /api/cities?region=asia-pacific` — 都市別件数
- `POST /api/calendar/{id}/subscribe` — 購読
- `GET /api/geolocate` — クライアント IP → 都市 推定

画像は `https://cdn-cgi/image/w=160,h=160,dpr=2,q=75,fmt=webp/...` の形式で Cloudflare Image Resizing を利用。

---

## 9. 関連リンク・遷移先

- `/{city}?k=p` 各シティページ
- `/{category}?k=t` 各カテゴリ
- `/{calendar}?k=c` 各カレンダー
- `/event/{event-slug}` イベント詳細 (実際は `/{slug}` フラットに見える)
- `/signin` (未ログインでSubscribe押下時)

---

## 10. SEOメタ情報・OGP (推測含む)

- `<title>`: "Discover Events | Luma"
- `<meta name="description">`: "Explore popular events near you, browse by category, or check out some of the great community calendars."
- canonical: `https://luma.com/discover` (`/explore` からも同じ canonical)
- OGP image: ブランドキービジュアル
- 構造化データ: `ItemList` でイベント、`Place` で都市 (推測)
- hreflang: なし
- 各カテゴリへのリンクは `nofollow` ではなく通常リンクで内部リンクパワーを流す設計

---

## 11. レスポンシブ対応

- PC: 6カラム → タブレット: 3〜4カラム → スマホ: 2カラム (推測)
- TabBar はスマホで横スクロール
- カレンダーカードはスマホで縦1列に
- スクロール起点で都市セクションが画面に入ったらフェードイン (推測)

---

## 12. A11y観点

- H1 "Discover Events" 1個
- セクション見出しは H2 (Popular Events / Browse by Category / Featured Calendars / Explore Local Events) (推測)
- TabBar は `role="tablist"` + `aria-selected` (推測)
- 画像 alt: カレンダー名・都市名・イベント名がそのまま入る (推測)
- "View All" のリンクには文脈付き aria-label (例: "View all popular events in Tokyo") があると望ましい

---

## 13. 模倣実装する際の留意点

- **都市/カテゴリ/カレンダーの3軸ディスカバリ**は Luma の核。connpass の「グループ + イベント + ランキング」の3軸とは異なる切り口で、コミュニティ (カレンダー) を一級市民として扱うのが特徴。
- **位置情報の自動判定**は UX が良いが「東京住みで NY イベントを見たい」時の切替 UI が必要。Luma はタブで対応している。
- カテゴリは8つに絞り込んでいる。connpass のタグ (自由入力) ではなく **固定タクソノミー** を採用している点に注意。
- Featured Calendars は手動キュレーションと推測 (キュレーション運用が事業の一部)。
- 件数表記は「4K」のように大胆に丸める (心理的効果優先)。

---

## 14. connpass との違い / Luma が優れている点・劣っている点

### Luma が優れている点
- **カレンダー(コミュニティ) を Subscribe するという UX が一級**: connpass はグループ参加 (≒メンバー登録) という重い概念。Luma の Subscribe はワンタップで購読でき、メール配信と新着通知が自動。
- **地理ベースのファーストビュー**: 「Tokyo の人気イベント」が真っ先に見える。connpass の Discover はすべてのイベントが時系列で混ざる。
- **固定カテゴリ + 件数表示**: 8カテゴリに絞ったことで初学者が迷わない。connpass はタグ多すぎ問題。
- **グローバル地理ツリー**: 5大陸 → 都市 のドリルダウン。connpass は基本日本国内のみ。
- **キュレーション主導の Featured**: 良質な大型カレンダーが目立つ位置に常駐。

### Luma が劣っている点 / connpass の方が良い点
- **検索バーが目立たない**: Luma の Discover に検索フィールドが (調査時点で) ほぼ無く、トップレベルからフルテキスト検索しづらい。connpass はキーワード検索が前面。
- **新着順タイムライン無し**: connpass は「新着順」「開催日順」のソートが選べる。Luma は人気順固定。
- **タグ自由度の喪失**: 固定8カテゴリは初学者には親切だが、ニッチコミュニティ (Rust, GraphQL, Go, etc.) のディスカバリーには弱い。connpass のタグ検索の細やかさには劣る。
- **日本語キーワード検索**: connpass は日本語形態素含めた検索精度が高い。Luma は英語スラッグ + 全文検索の精度がやや弱い (推測)。
- **大学・企業フィルタなし**: connpass は所属で参加者を絞れるが、Luma にはない。
- **無料/有料フィルタが Discover に無い**: connpass は無料イベントだけを絞り込める。Luma は個別カレンダー/シティに入らないと絞れない。
