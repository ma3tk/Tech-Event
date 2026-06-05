# event-card — イベントカード

## 役割と利用箇所

イベント一覧上で 1 イベントを 1 カードとして表現する、connpass の中核 UI コンポーネント。サムネイル画像、開催日、ステータス、グループ名/主催者、タイトル、概要、開催地、参加者数 (現状/定員) を 1 要素に集約し、クリックでイベント詳細 (`/event/{id}/`) へ遷移する。

利用箇所:
- トップページ `/` の「直近開催イベント」「新着イベント」セクション
- イベント一覧/エクスプローラ `/explore/`
- ランキング `/ranking/` (順位ラベル付き)
- 検索結果 `/search/`
- カレンダーページ `/calendar/` (簡略版)
- グループページ (各サブドメイン) の「次回イベント」「過去イベント」
- ユーザー詳細ページ「参加予定/過去参加イベント」

## 視覚的構造

### 標準カード (横長)

```
+------------------------------------------------------------------+
| +-------------+                                                  |
| |             |  [6月 27]   [開催前]   公開日: 2026/06/04        |
| |  thumbnail  |  グループ名 (アイコン)                            |
| |  (16:9)     |                                                  |
| |             |  ## イベントタイトル (h3)                          |
| |             |  概要テキスト 1行省略 (...)                        |
| +-------------+  📍 東京都渋谷区 / または 🌐 オンライン            |
|                  👥 0 / 45 人                                    |
+------------------------------------------------------------------+
```

### グリッド表示 (縦型カード、トップページ向け)

```
+-------------------+
|                   |
|     thumbnail     |
|     (16:9)        |
|                   |
+-------------------+
| [6/27]  [開催前]   |
| グループ名          |
|                   |
| イベントタイトル    |
| 説明 (2行)         |
|                   |
| 📍 場所            |
| 👥 0/45人          |
+-------------------+
```

### ランキング表示 (順位ラベル付き)

```
+---+--------------------------------------------+
| 1 | [thumb] [日] グループ / タイトル / 888/1270人 |
+---+--------------------------------------------+
```

## Props 相当の入力データ

```ts
type EventCardProps = {
  id: string;
  title: string;
  thumbnailUrl: string;
  startedAt: string;          // ISO8601: "2026-06-27T19:00:00+09:00"
  endedAt?: string;
  status: 'upcoming' | 'open' | 'full' | 'waitlist' | 'closed' | 'cancelled' | 'ended';
  group: {
    id: string;
    name: string;
    iconUrl?: string;
    subdomain?: string;
  };
  organizer?: {
    nickname: string;
    avatarUrl?: string;
  };
  location:
    | { type: 'offline'; prefecture: string; address: string }
    | { type: 'online'; platform?: string }
    | { type: 'hybrid'; prefecture: string; address: string };
  accepted: number;            // 現在の参加者数
  limit?: number | null;       // 定員。null = 無制限
  fee?: number;                // 円
  publishedAt?: string;
  excerpt?: string;            // 概要短文
  rank?: number;               // ランキングページ用
  variant?: 'list' | 'grid' | 'rank' | 'compact';
  href: string;                // /event/{id}/
};
```

実例 (connpass より):
- 開催日表示形式: 「6月 27」
- 参加者数: 「0/45人」「888/1270人」
- ステータス: 「開催前」「公開日: 2026/06/04」
- オンライン表記: 「オンライン」/ オフラインは住所表示

## 状態バリエーション

| 状態 | 視覚的差分 |
|---|---|
| default (upcoming) | ステータス: 「開催前」(青/緑バッジ) |
| open (募集中) | 「募集中」緑バッジ、参加ボタン強調 |
| full (満員) | 「満員」赤系バッジ、参加カウントが定員と同じ |
| waitlist (補欠あり) | 「補欠登録受付中」黄バッジ |
| closed (締切) | 「募集締切」グレーバッジ、カード彩度ダウン |
| cancelled (中止) | 「中止」赤バッジ、タイトルに取り消し線 |
| ended (終了) | 「終了」グレーバッジ、全体 opacity 0.7 |
| hover | カード全体に box-shadow + scale(1.01)、タイトル下線 |
| focus-visible | アウトライン 2px solid (キーボード操作) |
| loading | スケルトン (画像/タイトル/メタを矩形プレースホルダ) |
| empty (画像なし) | プレースホルダ画像 (connpass デフォルトロゴ) |
| error (画像取得失敗) | onError でプレースホルダに差し替え |

## レスポンシブでの変化

- **>= 1024px (デスクトップ)**: 横長カード or 3 カラムグリッド。サムネイルは左 240×135 (16:9)
- **768px–1023px (タブレット)**: 2 カラムグリッド、サムネイル 200×112
- **< 768px (モバイル)**: 1 カラム縦並び、サムネイル全幅 (aspect-ratio 16/9)、メタ情報を下に積む
- フォントサイズ: タイトル 14–16px、メタ 12–13px
- タップ領域は最低 44×44px を確保 (モバイル)

## アクセシビリティ要件

- ルート要素: `<article aria-labelledby="event-{id}-title">`
- 全体クリッカブルにする場合は内側に隠しリンク (Stretched link パターン) または最外殻を `<a>` にする
- タイトル: `<h3 id="event-{id}-title">` (一覧ページの見出しレベルに合わせる)
- 画像: `<img alt="">` (装飾扱い、タイトルが直後にあるため alt 空でも可)、または `alt="{title} のイベント画像"`
- ステータスバッジ: テキスト併記 (色だけで判断させない)。`<span class="badge badge--full" aria-label="満員">満員</span>`
- 参加者数: `<span aria-label="参加者 0人、定員 45人">0/45人</span>`
- 開催日時: `<time datetime="2026-06-27T19:00+09:00">6月27日</time>`
- キーボード操作: Tab で 1 カードあたり 1 フォーカス停止 (リンクは複数あっても、Stretched link でひとつに)
- フォーカススタイル: 明確なアウトライン

## 推測される HTML 構造と CSS 設計の方針

```html
<article class="c-event-card" aria-labelledby="ev-356828-title">
  <a class="c-event-card__link" href="/event/356828/">
    <div class="c-event-card__thumb">
      <img src="..." alt="" loading="lazy" />
      <span class="c-event-card__date">
        <time datetime="2026-06-27">
          <span class="month">6月</span>
          <span class="day">27</span>
        </time>
      </span>
    </div>
    <div class="c-event-card__body">
      <div class="c-event-card__meta">
        <span class="c-badge c-badge--upcoming">開催前</span>
        <span class="c-event-card__published">公開日: 2026/06/04</span>
      </div>
      <p class="c-event-card__group">
        <img src="..." alt="" class="c-event-card__group-icon" />
        システムエンジニア友の会
      </p>
      <h3 id="ev-356828-title" class="c-event-card__title">
        プロジェクトマネージャ試験勉強会
      </h3>
      <p class="c-event-card__excerpt">生成AIに助けてもらってPM試験の合格を目指す...</p>
      <ul class="c-event-card__footer">
        <li class="c-event-card__location">🌐 オンライン</li>
        <li class="c-event-card__count" aria-label="参加者 3人、定員 5人">
          👥 3/5人
        </li>
      </ul>
    </div>
  </a>
</article>
```

CSS 方針:
- Flex / Grid を変数 `--card-variant` で切り替え (list/grid)
- 画像は `aspect-ratio: 16/9; object-fit: cover; background: #eee;`
- 日付バッジは画像左上に絶対配置 (`position: absolute; top: 8px; left: 8px`)
- カード hover: `transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,.1)`
- タイトルは 2 行で `-webkit-line-clamp: 2; overflow: hidden`
- 概要は 1–2 行で同様の line-clamp
- 終了状態は `filter: grayscale(.3); opacity: .8`

## 模倣実装するなら React コンポーネントとしてどう設計するか

```tsx
// EventCard.tsx
type EventCardProps = {
  event: Event;
  variant?: 'list' | 'grid' | 'rank' | 'compact';
  rank?: number;
};

export function EventCard({ event, variant = 'list', rank }: EventCardProps) {
  const status = computeStatus(event);  // upcoming/open/full/...
  return (
    <article
      className={cx(styles.root, styles[variant])}
      aria-labelledby={`ev-${event.id}-title`}
    >
      {rank && <RankBadge rank={rank} />}
      <Link href={event.href} className={styles.link}>
        <Thumbnail src={event.thumbnailUrl} date={event.startedAt} />
        <div className={styles.body}>
          <CardMeta status={status} publishedAt={event.publishedAt} />
          <GroupRow group={event.group} />
          <h3 id={`ev-${event.id}-title`}>{event.title}</h3>
          {event.excerpt && <p className={styles.excerpt}>{event.excerpt}</p>}
          <CardFooter location={event.location} accepted={event.accepted} limit={event.limit} />
        </div>
      </Link>
    </article>
  );
}
```

設計のポイント:
- `EventStatusBadge`, `Thumbnail`, `GroupRow`, `CardFooter` などサブコンポーネントへ分割し、他カード (検索結果カード、カレンダーセル内表示) と再利用
- `computeStatus(event)` は純関数として `lib/event.ts` に切り出しテスト
- 画像は `next/image` で最適化 (`loading="lazy"`, `sizes`)
- ステータス→色のマッピングは `src/tokens/event-status.ts` に集約
- Storybook で全状態 (default/full/cancelled/loading) のストーリーを用意
- スケルトン用に `<EventCardSkeleton />` を別ファイルで提供
- aria-label の文字列生成はヘルパー `formatParticipantsLabel(accepted, limit)` に
- variant 切替で list/grid/rank/compact をデザイントークンレベルで分岐
