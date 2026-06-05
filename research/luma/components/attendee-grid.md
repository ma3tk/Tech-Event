# Luma Attendee Grid

## 役割

イベント詳細の下部に表示される「**Who's going**」セクション。アバターをグリッドで並べ、何人参加するか・誰が参加するかを可視化する。**社会的証明 (social proof)** と「あの人が来るなら自分も行こう」のネットワーク効果を生む UI。connpass の「参加者一覧テーブル」と違い、写真主体で軽量。

## 利用箇所

- イベント詳細ページの本文下
- 共有モーダル
- ホスト側の Guest List 管理画面
- メール内の参加者プレビュー

## 構成要素

1. **見出し** — "124 going" + 副情報 "+ 8 waitlist"
2. **Avatar grid** — 36px〜48px のアバターを 6〜10 列で並べる
3. **+N more button** — 全員見るためのモーダル展開
4. **Filters** (ホストのみ) — Status (Going / Pending / Waitlist / Invited / Declined)

## Props 相当

```ts
type Attendee = {
  id: string;
  name: string;
  avatarUrl?: string;
  status: 'going' | 'pending' | 'waitlist' | 'invited' | 'declined';
  isHost?: boolean;
  isYou?: boolean;
};

type AttendeeGridProps = {
  attendees: Attendee[];
  totalCount: number;
  maxVisible?: number;          // 例: 40 (5 行 × 8 列)
  showStatus?: boolean;         // ホスト視点で色分けする
  onAttendeeClick?: (a: Attendee) => void;
  onSeeAll?: () => void;
};
```

## 状態バリエーション

- **Public view** — 名前は伏せ、アバターのみ + "+N more"
- **Logged-in view** — 自分のアバターに "You" バッジ、フレンドにマーク
- **Host view** — 各アバターの右下に status ドット (緑=going / 黄=pending / 灰=waitlist / 赤=declined)
- **Empty state** — "Be the first to register" + イラスト
- **Privacy: hidden** — ホストが Guest list を非公開設定 → 数字だけ "124 going"

## レイアウト

```
Who's going · 124
┌──┬──┬──┬──┬──┬──┬──┬──┐
│🧑│👨│👩│👨│👩│👩│👨│👩│
├──┼──┼──┼──┼──┼──┼──┼──┤
│👩│👨│👨│👩│👨│👩│👨│👩│
├──┼──┼──┼──┼──┼──┼──┼──┤
│👨│👨│👩│👩│👨│👩│👨│+87│
└──┴──┴──┴──┴──┴──┴──┴──┘
[ See all 124 attendees → ]
```

## レスポンシブ

- Mobile: 5 列 × 4 行 = 20 名
- Tablet: 7 列 × 4 行 = 28 名
- Desktop: 10 列 × 5 行 = 50 名

ホスト管理画面 (Guest List) では list / grid 切替で詳細情報 (email, ticket, check-in time) も表示。

## A11y

- 全体を `<section aria-labelledby="going-heading">`
- アバター個別に `<button aria-label="Alice Smith (going)">` (クリックでプロフ表示する場合)
- ステータスのドットは色だけでなく `aria-label` で意味伝達
- "+87 more" ボタンは `aria-haspopup="dialog"`

## React 実装案

```tsx
export function AttendeeGrid({
  attendees, totalCount, maxVisible = 40, showStatus, onSeeAll,
}: AttendeeGridProps) {
  const visible = attendees.slice(0, maxVisible);
  const overflow = totalCount - visible.length;

  return (
    <section aria-labelledby="going-heading" className="space-y-4">
      <header className="flex items-baseline justify-between">
        <h2 id="going-heading" className="text-lg font-semibold">
          {totalCount} going
        </h2>
        {onSeeAll && (
          <button onClick={onSeeAll} className="text-sm text-neutral-500 hover:underline">
            See all →
          </button>
        )}
      </header>

      <ul className="grid grid-cols-5 gap-2 sm:grid-cols-7 lg:grid-cols-10">
        {visible.map((a) => (
          <li key={a.id} className="relative aspect-square">
            <Avatar
              host={a}
              className={cn(
                'size-full rounded-full ring-2 ring-white',
                a.isYou && 'ring-2 ring-indigo-500',
              )}
            />
            {showStatus && <StatusDot status={a.status} />}
          </li>
        ))}
        {overflow > 0 && (
          <li>
            <button
              onClick={onSeeAll}
              className="grid aspect-square size-full place-items-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700"
            >
              +{overflow}
            </button>
          </li>
        )}
      </ul>
    </section>
  );
}

function StatusDot({ status }: { status: Attendee['status'] }) {
  const color = { going: 'bg-emerald-500', pending: 'bg-amber-400', waitlist: 'bg-neutral-400', invited: 'bg-sky-400', declined: 'bg-rose-500' }[status];
  return (
    <span
      aria-label={status}
      className={cn('absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-white', color)}
    />
  );
}
```

## デザイントークン

- Avatar size: 40px (mobile) / 48px (desktop)
- Gap: 8px (mobile) / 10px (desktop)
- Status dot: 12px, white 2px ring

## 真似すべきポイント

- **数字 + 顔写真**が最強の social proof。connpass の「100 人参加」だけより 5 倍効く
- "You" バッジで「自分も入ってる」感を視覚化
- ホストには status ドットで一目で管理状況が分かる
- グリッドの最後を "+N more" にしてクリック誘導 → モーダルで全員 + フィルタが基本パターン
