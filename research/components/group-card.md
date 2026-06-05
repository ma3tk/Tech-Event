# group-card — グループカード

## 役割と利用箇所

connpass の「グループ (シリーズ)」 — 同一主催者が運営する継続的なコミュニティ — を一覧上で 1 件として表現するカード。グループロゴ、グループ名、主催者、メンバー数、開催回数、説明、タグ、公開日などを集約する。

利用箇所:
- `/series/` グループ一覧ページの「新着グループ」セクション
- トップページ `/` の「新着グループ」サイドモジュール
- 検索結果 `/search/` のグループタブ
- ユーザー詳細ページ「所属グループ」セクション
- イベント詳細ページのサイドバー「このイベントを開催するグループ」

connpass 実データから確認できた要素:
- グループ名 (リンク付き)
- 公開日 (「公開日: 2026/06/04」)
- 管理者プロフィール (画像 + 名前、複数の場合「他」)
- メンバー数 (リンク化、例: 1163人)
- イベント開催回数 (例: 864回)

## 視覚的構造

### 標準カード

```
+--------------------------------------------------------------+
| +----------+   グループ名 (h3 リンク)                         |
| |          |   公開日: 2026/06/04                             |
| |  group   |   主催: [avatar] Quatrex 他2名                   |
| |   logo   |                                                  |
| |  120x120 |   グループ説明文 2行省略...                       |
| |          |                                                  |
| +----------+   #Python #勉強会 #オンライン                     |
|                                                              |
|                👥 1,163 人  /  🗓 864 回開催                   |
|                                                              |
|                [グループに参加]                                |
+--------------------------------------------------------------+
```

### コンパクト版 (サイドバー)

```
+--------------------------------+
| [logo] グループ名               |
|        1,163人 / 864回          |
+--------------------------------+
```

## Props 相当の入力データ

```ts
type GroupCardProps = {
  group: {
    id: string;
    name: string;
    description?: string;
    logoUrl?: string;
    subdomain?: string;
    url: string;            // /series/123/
    memberCount: number;
    eventCount: number;
    organizers: Array<{ nickname: string; avatarUrl: string; profileUrl: string }>;
    tags?: string[];
    publishedAt?: string;
    lastEventAt?: string;
    isJoined?: boolean;     // 現在ユーザーが参加済みか
  };
  variant?: 'standard' | 'compact' | 'sidebar';
  onJoin?: () => void;
  onLeave?: () => void;
};
```

## 状態バリエーション

| 状態 | 表示 |
|---|---|
| default | 「グループに参加」ボタン (primary) |
| joined | 「参加中」secondary ボタン (hover で「退会する」) |
| hover | カード box-shadow / タイトル下線 |
| focus-visible | アウトライン |
| loading (一覧) | スケルトン (ロゴ円 + テキスト矩形) |
| empty (説明なし) | description 行は非表示 |
| empty-tags | タグ行非表示 |
| no-logo | デフォルトロゴ画像 |
| inactive (休眠グループ) | 「最終イベントから 12 ヶ月以上」表示 + opacity 0.8 |
| private (招待制) | 「招待制グループ」バッジ + 参加ボタンを「申請する」に変更 |
| join-pending | 「申請中」状態、ボタン disabled |
| join-error | エラートースト |
| compact / sidebar | ロゴ + 名前 + 数字のみ |

## レスポンシブでの変化

- **>= 1024px**: 横長レイアウト (ロゴ 120 + 本文)、2 カラムグリッド可能
- **768px–1023px**: 1 カラム横長、ロゴ 100
- **< 768px**: ロゴ 80、本文を縦積み、「グループに参加」ボタンを全幅化
- メンバー数/イベント回数はカンマ区切りで人間可読 (`1,163`)
- コンパクト版は常時表示 (サイドバー専用)

## アクセシビリティ要件

- ルート: `<article aria-labelledby="group-{id}-name">`
- ロゴ: `<img alt="">` (装飾扱い)
- 名前: `<h3 id="group-{id}-name"><a href="...">グループ名</a></h3>`
- 主催者リスト: `<ul>` で複数表示、`aria-label="主催者一覧"`、各リンク `aria-label="{nickname} のプロフィール"`
- メンバー数: `<span aria-label="メンバー 1163人">👥 1,163人</span>`
- 開催回数: 同様に `aria-label="開催回数 864回"`
- 参加ボタン: `<button aria-pressed="false">グループに参加</button>` (toggle 的に使う場合)
- 参加中の状態は `aria-pressed="true"` で表現
- タグはタグコンポーネントの a11y に準拠 (`<a>` リンク、`aria-label="タグ: Python"`)
- カラーコントラスト AA 準拠

## 推測される HTML 構造と CSS 設計の方針

```html
<article class="c-group-card" aria-labelledby="grp-123-name">
  <a href="/series/123/" class="c-group-card__logo">
    <img src="..." alt="" />
  </a>
  <div class="c-group-card__body">
    <h3 id="grp-123-name" class="c-group-card__name">
      <a href="/series/123/">システムエンジニア友の会</a>
    </h3>
    <p class="c-group-card__published">公開日: 2026/06/04</p>
    <p class="c-group-card__organizers">
      主催:
      <a href="/user/quatrex/">
        <img src="..." alt="" /> Quatrex
      </a>
      <span>他 2 名</span>
    </p>
    <p class="c-group-card__description">SEやIT業界人がみんなで幸せになるための会...</p>
    <ul class="c-group-card__tags">
      <li><a href="/tag/Python/" class="c-tag">Python</a></li>
      <li><a href="/tag/勉強会/" class="c-tag">勉強会</a></li>
    </ul>
    <dl class="c-group-card__stats">
      <div>
        <dt>メンバー</dt>
        <dd aria-label="メンバー 1163人">👥 1,163人</dd>
      </div>
      <div>
        <dt>開催回数</dt>
        <dd aria-label="開催回数 864回">🗓 864回</dd>
      </div>
    </dl>
    <button class="c-btn c-btn--primary">グループに参加</button>
  </div>
</article>
```

CSS 方針:
- レイアウト: `display: grid; grid-template-columns: 120px 1fr; gap: 16px;`
- ロゴは `aspect-ratio: 1; border-radius: 8px; object-fit: cover;`
- 説明文: `-webkit-line-clamp: 2;`
- タグ: 横並びで wrap、gap 8px
- stats は inline-flex で `gap: 16px`、アイコンは数字より小さく
- 参加ボタンは右下配置、モバイル時は下段全幅
- hover 時: `box-shadow: 0 2px 8px rgba(0,0,0,.08); transform: translateY(-1px);`
- joined 状態は背景色を変えて識別

## 模倣実装するなら React コンポーネントとしてどう設計するか

```tsx
// GroupCard.tsx
export function GroupCard({ group, variant = 'standard', onJoin, onLeave }: Props) {
  if (variant === 'compact' || variant === 'sidebar') {
    return <CompactGroupCard group={group} />;
  }
  return (
    <article className={styles.root} aria-labelledby={`grp-${group.id}-name`}>
      <GroupLogo group={group} />
      <div className={styles.body}>
        <GroupTitle group={group} />
        <Meta group={group} />
        <OrganizersList organizers={group.organizers} />
        {group.description && (
          <p className={styles.description}>{group.description}</p>
        )}
        {group.tags?.length ? <TagList tags={group.tags} /> : null}
        <Stats memberCount={group.memberCount} eventCount={group.eventCount} />
        <JoinButton
          isJoined={group.isJoined}
          onJoin={onJoin}
          onLeave={onLeave}
        />
      </div>
    </article>
  );
}

function JoinButton({ isJoined, onJoin, onLeave }: ...) {
  const [pending, setPending] = useState(false);
  const handle = async () => {
    setPending(true);
    try { isJoined ? await onLeave?.() : await onJoin?.(); }
    finally { setPending(false); }
  };
  return (
    <Button
      variant={isJoined ? 'secondary' : 'primary'}
      onClick={handle}
      loading={pending}
      aria-pressed={isJoined}
    >
      {isJoined ? '参加中' : 'グループに参加'}
    </Button>
  );
}
```

設計のポイント:
- variant で `standard / compact / sidebar` を切り替えて再利用
- `OrganizersList` は 3 名超で「他 N 名」に折り畳む
- `Stats` は数値表示を `Intl.NumberFormat('ja-JP')` で
- 参加ボタンは Mutation API (`useJoinGroup(groupId)`) を呼び、楽観的更新
- Skeleton コンポーネント `GroupCardSkeleton` を別ファイルで提供
- 説明文の line-clamp は CSS で行う
- ロゴ取得失敗時は `onError` でデフォルトに差し替え
- Storybook で `default / joined / pending / no-logo / private` のストーリー
- a11y テスト: フォーカス順序、aria-pressed の切替動作
- アナリティクス: カードクリック/参加クリックを `data-track` 属性で送信
