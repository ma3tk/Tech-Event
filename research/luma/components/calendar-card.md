# Luma Calendar Card (Community Calendar)

## 役割

Luma の差別化要素である「**カレンダー (= コミュニティ)**」をリスト表示する大判カード。例: AI Tinkerers, NYC Tech Events, ETHGlobal などの**継続イベント主催コミュニティ**を 1 枚で表現し、Subscribe ボタンで継続フォローを促す。connpass の「グループ」相当だが、デザインは Spotify のプレイリストに近い。

## 利用箇所

- /discover の "Featured Calendars" セクション
- カレンダー詳細ページの "Similar Calendars"
- ユーザーホームの "Following" タブ
- 検索結果 (カレンダーセクション)

## 構成要素

1. **Cover banner** — カレンダー固有のグラデまたは画像 (16:9 or 4:3)
2. **Logo / icon** — banner の左下にオーバーレイされた円形ロゴ
3. **Calendar name** — 太字、最大 1 行
4. **Tagline** — グレー、最大 2 行
5. **Stats** — "🗓 14 upcoming · 👥 4.2k members"
6. **Subscribe button** — 黒丸 outline → クリックで Subscribed (チェックアイコン)
7. **Member avatars** (任意) — 直近フォロワー 5 名のスタック

## Props 相当

```ts
type CalendarCardProps = {
  calendar: {
    id: string;
    slug: string;        // luma.com/{slug}
    name: string;
    tagline?: string;
    coverUrl: string;
    logoUrl?: string;
    tintColor?: string;
    upcomingCount: number;
    memberCount: number;
    isVerified?: boolean;
  };
  isSubscribed: boolean;
  variant?: 'standard' | 'featured' | 'compact';
  onSubscribe: () => void;
};
```

## バリエーション

- **standard** — 320 × 280px くらいの縦カード
- **featured** — トップに置く 2 倍幅、横長レイアウト + 直近 3 イベントを内側に並べる
- **compact** — 検索結果用、横並び 64×64 logo + 1 行タイトル + 1 行 tagline

## 状態バリエーション

- **Default** — Subscribe ボタン (white outline)
- **Subscribed** — チェックアイコン + "Subscribed" (背景塗り)
- **Pending invite** — "Request to Join" バッジ
- **Members only / private** — 鍵アイコン
- **Loading** — skeleton

## レスポンシブ

- Mobile: 1 列、横スワイプ可能カルーセル (snap)
- Tablet: 2 列
- Desktop: 3〜4 列 grid

## A11y

- `<article aria-labelledby="cal-name-{id}">`
- Subscribe ボタンは `aria-pressed={isSubscribed}` でトグル状態を SR に通知
- カバー画像は装飾扱い `alt=""`、ロゴは `alt="{name} logo"`

## React 実装案

```tsx
export function CalendarCard({ calendar, isSubscribed, onSubscribe, variant = 'standard' }: CalendarCardProps) {
  return (
    <article
      className="overflow-hidden rounded-2xl border border-neutral-100 bg-white transition hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <img src={calendar.coverUrl} alt="" className="size-full object-cover" />
        <div
          className="absolute inset-0 mix-blend-overlay"
          style={{ background: `linear-gradient(135deg, ${calendar.tintColor}, transparent)` }}
        />
        {calendar.logoUrl && (
          <img
            src={calendar.logoUrl}
            alt={`${calendar.name} logo`}
            className="absolute -bottom-6 left-4 size-16 rounded-2xl border-4 border-white shadow"
          />
        )}
      </div>
      <div className="space-y-3 px-4 pb-4 pt-10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-base font-semibold">
              {calendar.name}
              {calendar.isVerified && <VerifiedBadge className="ml-1 inline" />}
            </h3>
            {calendar.tagline && (
              <p className="line-clamp-2 text-sm text-neutral-500">{calendar.tagline}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onSubscribe}
            aria-pressed={isSubscribed}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold transition',
              isSubscribed
                ? 'bg-black text-white'
                : 'border border-neutral-300 text-neutral-900 hover:bg-neutral-50',
            )}
          >
            {isSubscribed ? '✓ Subscribed' : 'Subscribe'}
          </button>
        </div>
        <p className="text-xs text-neutral-500">
          {calendar.upcomingCount} upcoming · {formatCount(calendar.memberCount)} members
        </p>
      </div>
    </article>
  );
}
```

## デザイントークン

- Border-radius: 16px
- Logo overlap: -bottom-6 + 64px logo (4px white border)
- Subscribe button: 36px height, 12px horizontal padding, 14px font
- Hover: shadow-lg + 1px translate-y

## 真似すべきポイント

- 「**Subscribe = 継続的なリレーション**」という概念を connpass にない形で UI 化している
- カレンダー単位で「新着通知 / カバー画像 / メンバーカウント」を持つことで、コミュニティブランドが育つ
- Cover image + Logo overlap のレイアウトは Spotify のプレイリストと同じ視覚言語で親しみやすい
