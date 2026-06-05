# Luma Host Bio Link (lu.ma/{username})

## 概要

Luma の各ユーザー / 組織は `lu.ma/{username}` という個別 URL を持ち、Linktree 的なホストプロフィールページとして機能する。「**自分の名前で URL が立つ**」「過去 / 未来のイベントが集約される」「他カレンダーへのリンクハブになる」という 3 つを兼ね、テック系コミュニティのリーダーが**個人ブランド構築**に使う。

## 構成

```
lu.ma/{username}
├─ Hero
│   ├─ Avatar (大)
│   ├─ Name + verified badge
│   ├─ Bio (1〜2 行)
│   └─ Links (Twitter / LinkedIn / Website / Email)
├─ Upcoming events (自分がホスト or 共催)
├─ Past events
├─ Calendars (自分が運営する Calendar 一覧)
├─ Communities (自分が member の Calendar)
└─ Followers count
```

## バリエーション

| 種類 | URL 例 | 用途 |
| --- | --- | --- |
| Personal | lu.ma/alice | 個人プロフィール |
| Organization | lu.ma/openai | 企業・団体 |
| Calendar | lu.ma/ai-tinkerers | コミュニティページ (カレンダー詳細と統合) |

すべて同じ URL 名前空間で一意。

## カスタムスラッグ

- 早い者勝ちで好きな username を取得 (3 〜 30 文字)
- 既存名と被ったら別名提案
- Plus プランは更に短い (3 文字) も可

## イベント表示 (タブ)

- **Upcoming** (デフォルト): 未来のイベントを cover card で
- **Past**: 過去のイベント (info + attendee 数)
- **Hosting**: 自分が host のみ
- **Going**: 自分が going の他人のイベント (公開設定次第)

## ソーシャル要素

- **Followers** カウント: 自分をフォローしている人 (Calendar の Subscribe と類似)
- **Following**: 自分がフォローしているカレンダー / 個人
- Twitter / LinkedIn / GitHub / Website / Email リンク
- 公開設定でアバター + 名前のみ表示にも

## SEO

- 個人 URL は SSR で生成、OG タグも個別 (名前 + 直近イベント image)
- Google 検索で `alice` などのクエリで露出
- イベントの Schema.org (`Person` + `Event` markup) で構造化データ

## 利用シーン (テック系)

1. **Twitter プロフィール URL を Luma に置き換える** — 自分のイベントが常に最新で見える
2. **名刺代わり** — QR コードを物理名刺に印刷
3. **採用ページ** — "Join my events" としてエンジニア採用フックに
4. **登壇者ポートフォリオ** — 過去登壇したイベント一覧が綺麗にまとまる

## API

- `GET /v1/entity/lookup?slug={username}` — slug でユーザー / カレンダー / 組織を解決
- `GET /v1/users/get-self` — 自分のプロフィール取得

## connpass との対比

connpass にも個別ユーザーページはあるが:
- 標準的なリストレイアウト
- カバー画像なし
- フォロー機能弱い
- カスタム URL なし (数字 ID のみ)

Luma は「URL を持つこと自体が個人ブランド資産」という Web2.5 的価値観を取り入れている。

## 真似すべきポイント

1. **lu.ma/{username} 形式の短い URL** — 名刺 / Twitter Bio に貼りたくなる
2. **Past / Upcoming タブ** で時系列に履歴が見える
3. **Calendar 運営者を 1 ページに集約** — 個人 + 法人 + コミュニティを統一名前空間で管理
4. **OG / Schema.org 対応** で検索流入を自動増やす
5. **Follow ボタン** を個人にも置く — 「あの人のイベントを追いたい」需要に応える
