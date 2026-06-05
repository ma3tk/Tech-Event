# comment-section — フィード / コメント欄

## 役割と利用箇所

イベント詳細ページ内に置かれる、参加者・主催者・connpass による時系列の活動ログ + コメント投稿欄。connpass では「フィード」と呼ばれることが多い。イベント公開・更新通知、参加者の参加表明、主催者の連絡事項、参加者同士のディスカッション、当日のリマインドなど、複数のイベント関連アクティビティが時系列で蓄積される。

利用箇所:
- `/event/{id}/` の中盤〜下部「フィード」セクション
- `/event/{id}/feed/` の専用フィードページ
- グループページ `/series/{id}/` のアクティビティタイムライン (簡略版)

connpass 実例:
- 「イベント公開日時などのアクティビティログ」
- 「参加表明のアクティビティが記録されています」
- 主催者からの連絡や参加者のコメントが時系列で並ぶ

## 視覚的構造

```
+----------------------------------------------------------------+
| フィード                                                        |
+----------------------------------------------------------------+
| [タブ: 全て | 主催者 | 参加者 | システム]                         |
+----------------------------------------------------------------+
|                                                                |
| ┌─ [avatar] Quatrex (主催)         2026/06/04 18:00 ──────────┐|
| │  ## 当日の参加方法について                                    │|
| │  本日 9:00 から Discord にて開催します。下記リンクから...      │|
| │  [👍 3] [💬 返信]                                           │|
| └────────────────────────────────────────────────────────────┘|
|                                                                |
| ┌─ [avatar] takeyuweb              2026/06/03 12:20 ──────────┐|
| │  「楽しみにしています！」                                      │|
| │  [👍 1] [💬 返信]                                           │|
| │   └─ [avatar] Quatrex                                       │|
| │       「お待ちしております」                                   │|
| └────────────────────────────────────────────────────────────┘|
|                                                                |
| ┌─ [system] ⓘ                     2026/05/30 10:00 ──────────┐|
| │  イベントが公開されました                                      │|
| └────────────────────────────────────────────────────────────┘|
|                                                                |
| ┌─ [avatar] あなた                                              ┐|
| │  [ コメントを書く...                              ]            │|
| │  [送信] (Markdown サポート, max 1000字)                       │|
| └────────────────────────────────────────────────────────────┘|
+----------------------------------------------------------------+
```

## Props 相当の入力データ

```ts
type FeedItem =
  | {
      type: 'comment';
      id: string;
      author: { id: string; nickname: string; avatarUrl: string; role: 'organizer' | 'participant' | 'guest' };
      bodyMarkdown: string;
      createdAt: string;
      updatedAt?: string;
      reactions: { thumbsUp: number };
      replies: FeedItem[];
      canEdit?: boolean;
      canDelete?: boolean;
    }
  | {
      type: 'system';
      id: string;
      kind: 'published' | 'updated' | 'reminder' | 'cancelled' | 'capacity-changed';
      createdAt: string;
      message: string;
    }
  | {
      type: 'apply';
      id: string;
      user: { nickname: string; avatarUrl: string };
      action: 'applied' | 'cancelled' | 'moved-to-waitlist';
      createdAt: string;
    };

type CommentSectionProps = {
  items: FeedItem[];
  currentUser?: { id: string; nickname: string; avatarUrl: string } | null;
  canPost: boolean;
  isLoading?: boolean;
  hasMore?: boolean;
  filter?: 'all' | 'organizer' | 'participant' | 'system';
  onPost?: (markdown: string) => Promise<void>;
  onReply?: (parentId: string, markdown: string) => Promise<void>;
  onReact?: (commentId: string) => void;
  onLoadMore?: () => void;
  onFilterChange?: (f: string) => void;
};
```

## 状態バリエーション

| 状態 | 表示 |
|---|---|
| default | フィード時系列、最新が上 (or 下) |
| empty | 「まだコメントがありません」プレースホルダ |
| loading | スケルトン (アバター + 文字矩形) を 3 件 |
| error | 「読み込みに失敗 [再試行]」 |
| posting (投稿中) | テキストエリア disabled、ボタンに spinner |
| post-success | テキストクリア + 楽観的に末尾へカード追加 |
| post-error | バナー「投稿に失敗しました」 |
| guest (未ログイン) | コメントフォーム部に「ログインしてコメント」 |
| no-permission | 主催者のみ投稿可能の設定時、参加者には form 非表示 |
| reply-open | 返信フォームインライン展開 |
| editing | 自分のコメント編集モード (textarea + cancel/save) |
| deleted | 「このコメントは削除されました」プレースホルダ |
| reported | モデレーション中表示 |
| reaction-pending | リアクションボタンに opacity 効果 |
| filter-active | 「主催者」タブ選択時、該当のみ表示 |
| hover (コメント) | アクションボタン (返信/編集/削除) 表示 |

## レスポンシブでの変化

- **>= 1024px**: アバター左 (48px) + 本文右の横並び、返信は左インデント 24–32px
- **< 768px**: 同じ構造だがアバター 40px、本文 padding を縮小、返信インデント 16px
- フォームはモバイルで textarea を 3 行→拡張可、送信ボタンは右下に floating 化を検討
- 長いコメントは「もっと読む」展開ボタン (Markdown 内の `<details>` 相当)

## アクセシビリティ要件

- ルート: `<section aria-labelledby="feed-title"><h2 id="feed-title">フィード</h2>`
- リスト: `<ol>` (時系列順)、各アイテム `<li>`
- コメント: `<article aria-labelledby="cm-{id}-author">` 内部に著者リンクと `<time datetime="...">`
- 投稿フォーム: `<form aria-label="コメントを投稿">`、textarea に `<label>` または `aria-label`
- 投稿中: ボタンに `aria-busy="true"`、メッセージは `aria-live="polite"` 領域に
- リアクション: `<button aria-pressed="true/false" aria-label="いいね (3)">`
- フィルタタブ: `role="tablist"` + 各 `role="tab"`
- キーボード:
  - Enter で送信、Shift+Enter で改行 (一般的な仕様)
  - Ctrl/Cmd + Enter での送信もサポート (好み)
- 削除ボタン: 確認ダイアログを `<dialog>` または Radix Dialog で出し、フォーカス管理
- システム通知 (apply / system) は `aria-label="システム通知"`、装飾を抑えて視認性を上げる

## 推測される HTML 構造と CSS 設計の方針

```html
<section class="c-feed" aria-labelledby="feed-title">
  <h2 id="feed-title">フィード</h2>
  <div role="tablist" class="c-feed__filter">
    <button role="tab" aria-selected="true">すべて</button>
    <button role="tab" aria-selected="false">主催者</button>
    <button role="tab" aria-selected="false">参加者</button>
  </div>

  <ol class="c-feed__list">
    <li>
      <article class="c-feed-item c-feed-item--comment" aria-labelledby="cm-12-author">
        <a href="/user/quatrex/" class="c-feed-item__avatar">
          <img src="..." alt="" />
        </a>
        <div class="c-feed-item__body">
          <header>
            <a id="cm-12-author" href="/user/quatrex/">Quatrex</a>
            <span class="c-badge c-badge--organizer">主催</span>
            <time datetime="2026-06-04T18:00+09:00">2026/06/04 18:00</time>
          </header>
          <div class="c-feed-item__content">
            <h3>当日の参加方法について</h3>
            <p>本日 9:00 から Discord にて開催します...</p>
          </div>
          <footer class="c-feed-item__actions">
            <button aria-pressed="false" aria-label="いいね (3)">👍 3</button>
            <button>返信</button>
          </footer>
          <ol class="c-feed-item__replies">
            <li><article>...</article></li>
          </ol>
        </div>
      </article>
    </li>
    <li>
      <div class="c-feed-system" role="note">
        <span class="c-feed-system__icon">ⓘ</span>
        イベントが公開されました
        <time datetime="...">2026/05/30 10:00</time>
      </div>
    </li>
  </ol>

  <form class="c-feed__form" aria-label="コメントを投稿">
    <label for="new-comment" class="visually-hidden">コメント</label>
    <textarea id="new-comment" maxlength="1000" placeholder="コメントを書く..."></textarea>
    <button type="submit" class="c-btn c-btn--primary">送信</button>
  </form>
</section>
```

CSS 方針:
- コメントは `display: grid; grid-template-columns: 48px 1fr; gap: 12px;`
- 主催者バッジ: 青背景白文字の小型 chip
- システム通知は背景グレーで簡略表示
- スレッドの返信は `padding-left: 32px; border-left: 2px solid var(--border-soft)`
- textarea: `resize: vertical; min-height: 80px;`
- ボタン disabled 時は opacity 0.5 + cursor not-allowed

## 模倣実装するなら React コンポーネントとしてどう設計するか

```tsx
// CommentSection.tsx
export function CommentSection({ items, currentUser, canPost, onPost, onReply, onReact }: Props) {
  return (
    <section aria-labelledby="feed-title">
      <h2 id="feed-title">フィード</h2>
      <FeedFilterTabs />
      <ol>
        {items.map(item => <FeedItemView key={item.id} item={item} onReact={onReact} onReply={onReply} />)}
      </ol>
      {canPost && currentUser && (
        <CommentForm onSubmit={onPost} placeholder="コメントを書く..." />
      )}
      {!currentUser && <LoginPrompt />}
    </section>
  );
}

// FeedItemView は discriminated union で type ごとに描画
function FeedItemView({ item }: { item: FeedItem }) {
  switch (item.type) {
    case 'comment': return <CommentCard comment={item} />;
    case 'system':  return <SystemNotice notice={item} />;
    case 'apply':   return <ApplyActivity activity={item} />;
  }
}

// CommentForm.tsx
function CommentForm({ onSubmit, placeholder }: { onSubmit: (md: string) => Promise<void> }) {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    setSubmitting(true);
    try { await onSubmit(value); setValue(''); }
    finally { setSubmitting(false); }
  };
  return (
    <form onSubmit={e => { e.preventDefault(); submit(); }} aria-label="コメントを投稿">
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        maxLength={1000}
        placeholder={placeholder}
        aria-busy={submitting}
        disabled={submitting}
      />
      <Button type="submit" disabled={!value.trim() || submitting} loading={submitting}>
        送信
      </Button>
    </form>
  );
}
```

設計のポイント:
- `FeedItem` は discriminated union で型安全に表示分岐
- Markdown レンダラは `react-markdown` + sanitize で XSS 防止
- リアクションは楽観的更新 + ロールバック (`useMutation` + onError)
- 投稿は `useMutation` で再送可。失敗時はバナー表示
- 仮想化 (react-virtual) は 100 件超で導入検討
- 返信は再帰的に `CommentCard` がネスト (深さ 2 まで制限)
- システム通知用に `messageCatalog` を別ファイル化 (公開/更新/中止のテキスト)
- フィルタは URL クエリ `?filter=organizer` と同期
- リアルタイム更新は WebSocket or SSE で `useFeedSubscription(eventId)`
- a11y: Radix Tabs / Radix Dialog (削除確認) を利用
- テスト: 投稿成功・失敗・編集・削除のフローを RTL で網羅
