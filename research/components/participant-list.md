# participant-list — 参加者一覧

## 役割と利用箇所

イベントに紐づく参加者を、参加枠/状態 (参加・補欠・キャンセル・主催者) ごとに分けて一覧表示する UI。各参加者は「アバター + ユーザー名 + 自己紹介/コメント + SNS 連携バッジ + 申込時刻」で構成される。

利用箇所:
- `/event/{id}/participation/` — 参加者一覧専用ページ
- `/event/{id}/` のイベント詳細ページ内の「参加者」セクション (簡略版、上位 N 件のアバターだけを表示し「すべて見る」リンク)

connpass の実例:
- 「参加枠 参加者 3人」「参加枠 キャンセル 1人」のようにセクションでカテゴリ分け
- 各カードに「に参加を申し込みました！」というステータス表示
- SNS 連携状況 (Twitter / Facebook / GitHub) のアイコン表示

参加枠が複数定義されているイベント (一般枠/学生枠/LT枠など) では、参加枠ごとに別セクションを表示する。

## 視覚的構造

### タブ + リスト (専用ページ)

```
+----------------------------------------------------------------+
| [参加者 (3)] [補欠 (2)] [キャンセル (1)] [主催者 (1)]            |
+----------------------------------------------------------------+
|                                                                |
|  ▼ 参加枠: 一般枠 (3人)                                          |
|  +----------------------------+  +----------------------------+|
|  | [avatar]  ユーザー名         |  | [avatar] takeyuweb         ||
|  | 自己紹介テキスト              |  | 自己紹介                    ||
|  | [X][FB][GH]  2026/06/04 12:30|  | [X][GH]  2026/06/03 18:20  ||
|  +----------------------------+  +----------------------------+|
|                                                                |
|  ▼ 参加枠: LT枠 (1人)                                            |
|  ...                                                           |
|                                                                |
+----------------------------------------------------------------+
```

### 詳細ページ内の縮約版

```
+----------------------------------------------------------------+
| 参加者 (3人 / 定員 5人)                       [すべて見る>]      |
+----------------------------------------------------------------+
|  [a1] [a2] [a3] [+ 2]                                         |
+----------------------------------------------------------------+
| キャンセル (1人)                                                |
|  [a4]                                                          |
+----------------------------------------------------------------+
```

## Props 相当の入力データ

```ts
type Participant = {
  id: string;
  nickname: string;
  avatarUrl: string;
  profileUrl: string;
  bio?: string;
  comment?: string;       // 申込時コメント (公開設定の場合)
  socials: {
    twitter?: string;
    facebook?: string;
    github?: string;
  };
  appliedAt: string;      // ISO8601
  status: 'attending' | 'waitlist' | 'cancelled';
  ticketName?: string;    // 参加枠名 (例: "一般枠", "LT枠")
};

type ParticipantListProps = {
  groups: Array<{
    ticketName: string;
    capacity: number | null;
    participants: Participant[];
  }>;
  activeTab: 'attending' | 'waitlist' | 'cancelled' | 'organizer';
  counts: { attending: number; waitlist: number; cancelled: number; organizer: number };
  isLoading?: boolean;
  variant?: 'tabs-full' | 'inline-compact';
  onTabChange?: (tab: string) => void;
  onLoadMore?: () => void;
};
```

## 状態バリエーション

| 状態 | 表示 |
|---|---|
| default | アクティブタブ内のリストを表示 |
| active-tab (参加者) | アクティブタブの下線/背景強調 |
| empty (該当0人) | 「現在 {種別} の方はいません」プレースホルダ + イラスト |
| loading | スケルトンカード (アバター円 + テキスト矩形) を 3–6 枚表示 |
| error | 「読み込みに失敗しました [再試行]」 |
| pagination/infinite | 末尾に「もっと見る」ボタン or IntersectionObserver で追加読込 |
| private-list | 参加者一覧が非公開の場合「主催者により非公開に設定」表示 |
| current-user-highlight | 自分の行に「あなた」バッジを付与 |
| hover (カード) | わずかな背景色変化 |
| focus | フォーカスリング |
| no-comment | comment 行は非表示 (空白行を作らない) |
| cancelled-state | アバターを薄色、取り消し線でユーザー名 (オプション) |

## レスポンシブでの変化

- **>= 1024px**: 2–3 カラムグリッド (auto-fit minmax 320px)
- **768px–1023px**: 2 カラム
- **< 768px**: 1 カラム、アバター左 + テキスト右の横並びカード
- タブはモバイルでは横スクロール (`overflow-x: auto`) で全タブにアクセス可能に
- 簡略版のアバター行は overflow 時 `[a1][a2][a3][+2]` のように残数を表示

## アクセシビリティ要件

- タブ: `<div role="tablist" aria-label="参加者ステータス">`、各タブ `<button role="tab" aria-selected aria-controls="panel-attending">`
- パネル: `<div role="tabpanel" id="panel-attending" tabindex="0">`
- カード: `<article aria-labelledby="user-{id}">`
- アバター: `<img alt="">` (装飾扱い、名前が直後)、または `alt="{nickname} のプロフィール画像"`
- SNS バッジ: 各 `<a aria-label="Xプロフィールへ (新しいタブ)">`
- 申込時刻: `<time datetime="...">2026/06/04 12:30</time>`
- ステータス: 「参加を申し込みました」のテキストを `<span class="visually-hidden">` で補足し、視覚はアイコンで簡潔に
- タブのキーボード操作:
  - ← → でタブ間移動
  - Home/End で先頭末尾
  - Enter/Space でアクティブ化
- カードフォーカス順序: アバター画像/名前リンク → SNS → 次のカード
- 「もっと見る」: `<button aria-label="さらに参加者を読み込む">`、追加読み込み中は `aria-busy="true"`

## 推測される HTML 構造と CSS 設計の方針

```html
<section class="c-participants" aria-labelledby="ph">
  <h2 id="ph">参加者</h2>
  <div role="tablist" aria-label="参加者ステータス" class="c-participants__tabs">
    <button role="tab" aria-selected="true" id="tab-att" aria-controls="panel-att">
      参加者 <span class="count">(3)</span>
    </button>
    <button role="tab" aria-selected="false" id="tab-wait" aria-controls="panel-wait">
      補欠 <span class="count">(2)</span>
    </button>
    <button role="tab" aria-selected="false" id="tab-can" aria-controls="panel-can">
      キャンセル <span class="count">(1)</span>
    </button>
  </div>

  <div role="tabpanel" id="panel-att" aria-labelledby="tab-att">
    <h3 class="c-participants__group-title">一般枠 (3 / 5人)</h3>
    <ul class="c-participants__list">
      <li>
        <article class="c-participant-card" aria-labelledby="u-101">
          <a href="/user/foo/" class="c-participant-card__avatar">
            <img src="..." alt="" />
          </a>
          <div class="c-participant-card__body">
            <a id="u-101" href="/user/foo/" class="c-participant-card__name">
              MIKAMI Yoshiyuki
            </a>
            <p class="c-participant-card__bio">Ruby 大好き</p>
            <p class="c-participant-card__comment">「楽しみにしています」</p>
            <ul class="c-participant-card__socials">
              <li><a href="..." aria-label="Xプロフィール"><svg/></a></li>
            </ul>
            <time datetime="2026-06-04T12:30+09:00">2026/06/04 12:30</time>
            <p class="visually-hidden">に参加を申し込みました</p>
          </div>
        </article>
      </li>
    </ul>
    <button class="c-btn c-btn--ghost">もっと見る</button>
  </div>
</section>
```

CSS 方針:
- リスト: `display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;`
- カード: `display: flex; gap: 12px; padding: 16px; border: 1px solid var(--border); border-radius: 8px;`
- アバター: 56×56 円形 (`border-radius: 50%`)
- タブ: 下線アクティブ表現 (`border-bottom: 2px solid var(--accent)`)
- ステータス色: 参加=緑 / 補欠=黄 / キャンセル=グレー / 主催=青
- bio / comment は `line-clamp: 2`
- ホバー時 `background-color: var(--hover-bg)`

## 模倣実装するなら React コンポーネントとしてどう設計するか

```tsx
// ParticipantList.tsx
export function ParticipantList({ groups, activeTab, counts, onTabChange }: Props) {
  return (
    <section className={styles.root}>
      <h2>参加者</h2>
      <Tabs value={activeTab} onChange={onTabChange} counts={counts}>
        <Tab id="attending">参加者</Tab>
        <Tab id="waitlist">補欠</Tab>
        <Tab id="cancelled">キャンセル</Tab>
      </Tabs>
      <TabPanel id={activeTab}>
        {groups.map(g => (
          <ParticipantGroupSection key={g.ticketName} group={g} />
        ))}
      </TabPanel>
    </section>
  );
}

function ParticipantCard({ p }: { p: Participant }) {
  return (
    <article aria-labelledby={`u-${p.id}`} className={styles.card}>
      <Avatar src={p.avatarUrl} href={p.profileUrl} />
      <div>
        <Link id={`u-${p.id}`} href={p.profileUrl}>{p.nickname}</Link>
        {p.bio && <p>{p.bio}</p>}
        {p.comment && <blockquote>「{p.comment}」</blockquote>}
        <SocialBadges socials={p.socials} />
        <time dateTime={p.appliedAt}>{formatDate(p.appliedAt)}</time>
      </div>
    </article>
  );
}
```

設計のポイント:
- `Tabs` / `TabPanel` は Headless UI または Radix Tabs で a11y を担保
- `ParticipantCard` は単体で Storybook 化、SNS なし/コメントありなど全パターン
- データ取得: `useEvent(eventId).participants` を SWR でキャッシュ
- ページネーション: cursor ベースで `useInfiniteQuery`
- skeleton: `ParticipantCardSkeleton` を別ファイル
- カウントはサーバーから一括取得 (タブ切替時に再取得しない)
- current user ハイライト: 親で `currentUserId` を渡し、`isCurrentUser` プロパティをカードに付与
- アクセシビリティテスト: axe-core で違反 0
- i18n: 「参加者」「補欠」「キャンセル」は messages に切り出し
