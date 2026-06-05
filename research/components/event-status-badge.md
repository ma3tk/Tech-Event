# event-status-badge — イベントステータスバッジ

## 役割と利用箇所

イベントの現在の募集/開催状態を端的に視覚化する小型バッジ。色とテキストの組み合わせで「開催前」「募集中」「満員」「補欠登録受付中」「募集締切」「中止」「終了」を瞬時に判別させる。色のみに依存しないアクセシブルな実装が要求される (色覚多様性配慮)。

利用箇所:
- イベントカード (`event-card`) の右上または日付下
- イベント詳細ヘッダー (`event-detail-header`) のタイトル横
- 検索結果ページの各カード
- カレンダー上の小さなマーカー (色のみ表示)
- ランキングカードのステータス欄
- ダッシュボードの「参加予定イベント」リスト

connpass 実例:
- 「開催前」(青/緑) — 公開済みで開催日前
- 「終了」(グレー) — 開催日経過
- 「公開日: 2026/06/04」(補助ラベル) — 状態ではないが併記される

connpass で確認される状態語彙:
- 開催前 / 開催中 / 終了 / 中止 / 募集中 / 満員 / 補欠登録受付中 / 募集締切

## 視覚的構造

```
[● 募集中]   [● 満員]   [● 補欠]   [● 締切]   [● 中止]   [● 終了]
  green      red       yellow     gray       red       gray
```

サイズバリアント:

```
sm:  [募集中]
md:  [● 募集中]
lg:  [●  募集中  ]
```

アイコン付き:

```
[🟢 募集中]
[🔴 満員]
[⚪ 終了]
[⚠ 中止]
[⏰ 締切間近]
```

カレンダー用 dot のみ:

```
●● (複数イベント・色で種別)
```

## Props 相当の入力データ

```ts
type EventStatus =
  | 'upcoming'    // 開催前
  | 'open'        // 募集中
  | 'full'        // 満員
  | 'waitlist'    // 補欠登録受付中
  | 'closed'      // 募集締切
  | 'cancelled'   // 中止
  | 'ended'       // 終了
  | 'ongoing';    // 開催中

type EventStatusBadgeProps = {
  status: EventStatus;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'subtle' | 'outline' | 'dot';
  showIcon?: boolean;
  label?: string;         // 上書き表示テキスト
  className?: string;
};
```

ステータス → 表示マッピング (推奨デザイントークン):

| status | label | color | icon |
|---|---|---|---|
| upcoming | 開催前 | blue | calendar |
| open | 募集中 | green | check |
| full | 満員 | red | users |
| waitlist | 補欠登録受付中 | yellow | clock |
| closed | 募集締切 | gray | lock |
| cancelled | 中止 | red (dark) | x-circle |
| ended | 終了 | gray | flag |
| ongoing | 開催中 | accent | broadcast |

## 状態バリエーション

| 状態 | 表示 |
|---|---|
| default | テキスト + ドット (色) |
| solid | 背景色塗りつぶし、白文字 |
| subtle | 薄背景 + 濃文字 (デフォルト推奨) |
| outline | 透過 + ボーダー |
| dot | 色付きドットのみ (カレンダー等で省スペース) |
| with-icon | アイコン + テキスト |
| size sm/md/lg | フォントとパディングを切替 |
| pulse (urgent) | 締切間近・残席わずかでアニメ強調 |
| hover (clickable な場合) | わずかな背景色変化 |
| loading (推測中) | スケルトン |
| empty | status 未設定時は描画しない (null 返却) |
| disabled | 半透明 |
| countdown variant | 「残り 3 席」など動的テキスト |
| tooltip | hover/focus で詳細ラベル (「補欠登録受付中: 現在 5 名待機」) |

## レスポンシブでの変化

- 基本的にサイズトークンを維持、ブレークポイントで形状変更しない
- モバイルではテキスト省略やアイコン化 (`with-icon=true` で文字非表示) を検討
- カレンダーの dot variant はモバイルで主要な表現になる
- 一覧の dense モードでは sm を採用

## アクセシビリティ要件

- 色のみで判別させない: ラベルテキストを必ず併記、または `aria-label` で補足
- 装飾的なドットアイコンには `aria-hidden="true"`
- `<span class="c-badge c-badge--full" role="status" aria-label="このイベントは満員です">満員</span>`
- 動的に状態が変わる場合は `aria-live="polite"` 親要素を用意
- 色コントラスト: solid 背景時は AA (4.5:1)、subtle 時はテキスト/背景の差を確保
- 締切間近の pulse アニメは `prefers-reduced-motion` を尊重
- アイコンのみ表示 (dot) では `aria-label` 必須 (例: `aria-label="募集中"`)
- バッジがリンク内に含まれる場合は role="status" を避ける (role はリンク側が主)

## 推測される HTML 構造と CSS 設計の方針

```html
<span class="c-event-badge c-event-badge--open c-event-badge--subtle" role="status">
  <span class="c-event-badge__dot" aria-hidden="true"></span>
  募集中
</span>
```

with-icon:

```html
<span class="c-event-badge c-event-badge--full c-event-badge--solid">
  <svg class="c-event-badge__icon" aria-hidden="true" focusable="false"><use href="#icon-users"/></svg>
  満員
</span>
```

dot only (カレンダー):

```html
<span class="c-event-badge c-event-badge--dot c-event-badge--open" aria-label="募集中"></span>
```

CSS 方針:
```css
.c-event-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;       /* pill にする場合は 999px */
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
}

/* status × variant カラー */
.c-event-badge--open.c-event-badge--subtle  { background: #e6f6ec; color: #1b7d3a; }
.c-event-badge--open.c-event-badge--solid   { background: #1b7d3a; color: #fff; }
.c-event-badge--full.c-event-badge--subtle  { background: #fde8e8; color: #b32020; }
.c-event-badge--waitlist.c-event-badge--subtle { background: #fff7d6; color: #8a6d00; }
.c-event-badge--closed.c-event-badge--subtle   { background: #eceef0; color: #555; }
.c-event-badge--cancelled.c-event-badge--solid { background: #b32020; color: #fff; }
.c-event-badge--ended.c-event-badge--subtle    { background: #eceef0; color: #777; }
.c-event-badge--upcoming.c-event-badge--subtle { background: #e7f0fb; color: #1f63c1; }

.c-event-badge__dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.c-event-badge--dot {
  width: 8px; height: 8px;
  padding: 0;
  border-radius: 50%;
  background: currentColor;
}

.c-event-badge--sm { font-size: 10px; padding: 1px 6px; }
.c-event-badge--lg { font-size: 14px; padding: 4px 12px; }

.c-event-badge--pulse::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  animation: pulse 1.4s ease-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .c-event-badge--pulse::after { animation: none; }
}
```

デザイントークン: ステータス×variant の組み合わせを `tokens/event-status.ts` に集約しダーク/ライト切替も対応する。

## 模倣実装するなら React コンポーネントとしてどう設計するか

```tsx
// EventStatusBadge.tsx
const STATUS_CONFIG: Record<EventStatus, { label: string; color: string; icon: ReactNode }> = {
  upcoming:  { label: '開催前',           color: 'blue',   icon: <CalendarIcon /> },
  open:      { label: '募集中',           color: 'green',  icon: <CheckIcon /> },
  full:      { label: '満員',             color: 'red',    icon: <UsersIcon /> },
  waitlist:  { label: '補欠登録受付中',     color: 'yellow', icon: <ClockIcon /> },
  closed:    { label: '募集締切',         color: 'gray',   icon: <LockIcon /> },
  cancelled: { label: '中止',             color: 'red',    icon: <XCircleIcon /> },
  ended:     { label: '終了',             color: 'gray',   icon: <FlagIcon /> },
  ongoing:   { label: '開催中',           color: 'accent', icon: <BroadcastIcon /> },
};

export function EventStatusBadge({
  status, size = 'md', variant = 'subtle', showIcon = false, label, className,
}: EventStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const text = label ?? config.label;

  if (variant === 'dot') {
    return (
      <span
        className={cx(styles.root, styles.dot, styles[`color-${config.color}`], className)}
        role="status"
        aria-label={text}
      />
    );
  }

  return (
    <span
      className={cx(
        styles.root,
        styles[`size-${size}`],
        styles[variant],
        styles[`color-${config.color}`],
        className,
      )}
      role="status"
    >
      {showIcon ? (
        <span aria-hidden="true" className={styles.icon}>{config.icon}</span>
      ) : (
        <span aria-hidden="true" className={styles.dotInline} />
      )}
      {text}
    </span>
  );
}
```

設計のポイント:
- `STATUS_CONFIG` を 1 か所に集約し、追加状態 (e.g., `archived`) も拡張容易
- `dot` variant は色のみ表現するため必ず `aria-label` で補完
- `label` props で上書き可能 (例: 「残り 3 席」のカスタム表示)
- 国際化: `STATUS_CONFIG` の label を i18n キー化 (`t('event.status.open')`)
- Storybook: status × variant × size のマトリクス自動生成
- Visual regression テスト (Chromatic) で色アクセシビリティチェック
- カレンダーの dot variant はクリック領域を拡張するための padding を親が担う設計
- 親コンポーネントから `computeStatus(event)` (純関数) で導出してから渡す
- 残席わずか・締切間近など派生状態は `derivedStatus(event)` で計算し、status とは別の補助バッジに分離
- a11y テスト: スクリーンリーダーで `aria-label` が読み上げられること、role="status" の `aria-live` 動作確認
