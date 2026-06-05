# Luma Discover (アルゴリズム / フィルタ)

## 概要

Luma の /discover は「**今、自分の街で何が起きているか**」を発見するためのページ。connpass の「新着イベント順」と違い、**位置情報 + 興味カテゴリ + ソーシャルシグナル**を組み合わせたレコメンドアルゴリズムで並ぶ。テックイベントを地理的に探したい時の第一選択肢になっている。

## ページ構造

```
/discover
├─ Hero: "Popular Events in {City}"
│     └─ 大きな event card 4〜6 枚 (横スクロール)
├─ Categories
│     └─ Tech / AI / Food & Drink / Arts & Culture / Climate
│        / Fitness / Wellness / Crypto (8 カテゴリ × イベント数バッジ)
├─ Featured Calendars
│     └─ 10 個のコミュニティカレンダー (Calendar Card)
├─ Explore Local Events
│     └─ 地域別 (Asia & Pacific / North America / Europe / Africa / SA)
│        └─ 各都市名 + イベント数
└─ Footer
```

## 8 つの基本カテゴリ

| カテゴリ | アイコン | 主なイベント |
| --- | --- | --- |
| Tech | 💻 | 開発者ミートアップ |
| AI | 🤖 | ML / LLM ハッカソン |
| Food & Drink | 🍽 | テイスティング / クッキング |
| Arts & Culture | 🎨 | ギャラリーオープニング |
| Climate | 🌍 | サステナビリティ |
| Fitness | 💪 | ランクラブ / ヨガ |
| Wellness | 🧘 | メディテーション |
| Crypto | 💎 | Web3 / DeFi |

カテゴリ追加・編集はホストの権限で自由 (ただし基本 8 つはデフォルト)。

## ランキングアルゴリズム

Luma は公式に明示していないが、観察から推定されるシグナル:

1. **地理近接性** — ユーザーの IP / 位置情報から半径 N km 以内を優先
2. **カテゴリマッチ** — ユーザーが過去 RSVP したカテゴリと一致
3. **時間近接性** — 開催が近いほど上位
4. **ソーシャルシグナル**:
   - フォロー中のホストが主催
   - フォロー中のカレンダーに所属
   - フォロー中の友達が going
5. **品質スコア**:
   - cover image があるか
   - 説明が十分か
   - ホストアバター有無
   - 過去イベントの完遂率 (cancellation rate)
6. **エンゲージメント**:
   - 直近の RSVP 速度 (急速に埋まっているイベントを上げる)
   - View → RSVP コンバージョン
7. **新鮮さ**: 直近作成されたイベントに小さなブースト

## フィルタ / 検索

- **Search**: フルテキスト検索 (タイトル + 説明 + ホスト名 + カレンダー名)
- **Location**: 都市選択 (近隣検索 or "Anywhere")
- **Date**: Today / This Week / This Weekend / Custom Range
- **Category**: 上記 8 カテゴリ複数選択
- **Price**: Free / Paid
- **Format**: In-person / Virtual

## 地域別エクスプローラ

```
Asia & Pacific
  Tokyo (3,200) / Singapore (1,800) / Hong Kong / Sydney / Bangkok / Seoul ...

North America
  New York (4K) / SF (3.5K) / LA / Toronto / Austin / Seattle / Boston ...

Europe
  London / Berlin / Paris / Amsterdam / Lisbon / Barcelona ...

Africa
  Lagos / Cape Town / Nairobi ...

South America
  São Paulo / Buenos Aires / Bogotá ...
```

各都市ページは `luma.com/discover/{city}` で SEO 最適化された LP に。

## SEO

- カテゴリページ: `luma.com/discover/category/{slug}`
- 都市ページ: `luma.com/discover/{city-slug}`
- それぞれが構造化データ (Schema.org Event リスト) を持ち、Google の "Things to do in {city}" 結果に出やすい

## パーソナライズ

- ログインユーザー: フォロー / 過去 RSVP を元にレコメンド
- 未ログイン: 都市 + 一般人気度で並ぶ
- "Following" タブで自分のフォローしているカレンダーの新着のみ

## モバイル UX

- カテゴリは横スクロール chips
- イベントカードは縦リスト
- 都市切替は地図アイコンタップ → ボトムシート

## API

- 公開 API としては /discover アルゴリズム自体は公開されていない
- ただし `GET /v1/calendar/list-events` でカレンダー単位のリスト取得は可能
- `GET /v1/entity/lookup?slug=...` で都市・カテゴリ slug を解決

## 競合との対比

| 機能 | Luma | connpass |
| --- | --- | --- |
| 地域別ページ | あり (50+ 都市) | あり (都道府県のみ) |
| カテゴリ | 8 つ統一 | 多数 (タグベース) |
| パーソナライズ | あり | なし (時系列のみ) |
| Featured 推薦 | あり | 控えめ |
| ビジュアル中心 | ◎ | △ |
| 国際性 | グローバル 50 都市 | 日本中心 |

## 真似すべきポイント

1. **都市単位の Discover** — テックイベントは地域性が強いので必須
2. **8 カテゴリに絞る** — 多すぎるタグより少数厳選の方が UX 良い
3. **Featured Calendars をトップに置く** — コミュニティ起点の発見
4. **品質スコアで並べる** — cover image なしのイベントを下げるだけで全体の UX 改善
5. **Things to do in {city} SEO** — Google で都市名検索からの流入を取りに行く
