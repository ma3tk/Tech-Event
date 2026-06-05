# Luma Event Card

## 役割

Discover / カレンダー / プロフィール / 検索結果で繰り返し使う、イベント 1 件を表現するカード。Luma の象徴とも言える「**大判カバー画像 + 余白多めのメタ情報**」が体験の核。connpass のリスト UI が「テキスト密度の高いテーブル風」なのに対し、Luma のカードは Instagram の投稿カードに近い「画像主導 + 縦並びメタ」。

## 利用箇所

- /discover の Popular / Category セクション
- カレンダーページ (community calendar) のイベントリスト
- ユーザーのホーム画面 (Going / Hosting タブ)
- 検索結果
- 埋め込みウィジェット (/embed)

## バリエーション

| バリエーション | 用途 | 画像比率 |
| --- | --- | --- |
| `compact` | Discover の "Popular Events" の小サムネリスト | 80×80 (正方形) |
| `standard` | カレンダー詳細の縦リスト | 16:9 大判 (full width) |
| `featured` | ヒーロー直下の "今週" カード | 21:9 ワイド |
| `grid` | 検索結果の grid 表示 | 4:3 |

## 表示メタ情報

1. **Cover image** — グラデーションオーバーレイ付き。AI 生成風のカラフルグラデが Luma カラーの代名詞
2. **Date pill** — 左上に "JUN 12 · 7:00 PM" のような小ピル (背景半透明白 + 黒文字)
3. **Title** — h3 相当、太字、最大 2 行 line-clamp
4. **Host avatar stack** — 共催 2〜3 名のミニアバターを重ね
5. **Location** — "📍 SoMa, San Francisco" or "🌐 Virtual"
6. **Attendee preview** — "👥 124 going" (任意)
7. **Price** — 有料時のみ右下に "$25" ピル

## Props 相当

```ts
type EventCardProps = {
  id: string;
  slug: string;
  title: string;
  coverUrl: string;
  startAt: string;     // ISO8601
  endAt?: string;
  timezone: string;
  location?: { type: 'physical' | 'virtual'; name?: string; city?: string };
  hosts: Array<{ id: string; name: string; avatarUrl: string }>;
  attendeeCount?: number;
  price?: { amount: number; currency: string } | 'free';
  tintColor?: string;  // ホストが設定したテーマ色
  variant?: 'compact' | 'standard' | 'featured' | 'grid';
  status?: 'upcoming' | 'past' | 'cancelled' | 'sold-out';
};
```

## 状態バリエーション

- **Upcoming** (デフォルト) — 通常表示
- **Past Event** — 全体に opacity-60 + 左上に "Past" 黒バッジ
- **Sold Out / Waitlist** — 右上に "Waitlist" 黄バッジ
- **Cancelled** — 取り消し線 + "Cancelled" 赤バッジ
- **Members Only** — 鍵アイコン + "Members only"
- **Loading skeleton** — グラデ shimmer

## レスポンシブ

- Mobile: 1 列、画像 16:9 フル幅
- Tablet: 2 列 grid, gap 16px
- Desktop: 3〜4 列 (Discover) / 1 列 (Calendar) / 縦 list

## A11y

- カード全体を `<article>` で包む
- 画像 alt は title をフォールバック
- ホスト avatar は装飾扱いで aria-hidden、ホスト名は SR 用に visually-hidden で出力
- 日付は `<time datetime="...">` でマシン可読
- 全カードを `<a>` で囲んで keyboard navigable

## React 実装案

```tsx
export function EventCard({
  title, coverUrl, startAt, hosts, location, price, tintColor, variant = 'standard',
}: EventCardProps) {
  return (
    <a href={`/${slug}`} className="group block overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-[16/9]">
        <img src={coverUrl} alt={title} className="size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold">
          {formatDatePill(startAt)}
        </span>
        {price && price !== 'free' && (
          <span className="absolute right-3 bottom-3 rounded-full bg-black/80 px-2 py-0.5 text-xs text-white">
            ${price.amount}
          </span>
        )}
      </div>
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-2 text-base font-semibold">{title}</h3>
        <p className="text-xs text-neutral-500">{location?.name ?? 'Virtual'}</p>
        <HostAvatarStack hosts={hosts} size="xs" />
      </div>
    </a>
  );
}
```

## デザイントークン

- Border-radius: 16px (rounded-2xl)
- Shadow: 0 1px 2px rgba(0,0,0,0.05), hover 0 8px 24px rgba(0,0,0,0.08)
- Padding: 16px
- Gap (grid): 16〜24px
- グラデーションオーバーレイ: from-black/40 to-transparent (画像にテキストを乗せる場合)

## 強み

Luma カードの「画像が主役」設計により、テック系イベントが**ビジュアルブランド**を持つようになった。connpass のテキスト一覧では各イベントの個性が出にくく、Luma に流れる主因のひとつ。
