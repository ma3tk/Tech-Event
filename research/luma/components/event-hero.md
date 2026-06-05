# Luma Event Hero

## 役割

イベント詳細ページの最上部 (above the fold) を占める巨大なヒーローセクション。**大きなカバー画像 + 日時 + タイトル + ホストアバター + Register CTA** を 1 画面に凝縮し、ファーストビューで「行きたい」と思わせる設計。Luma のページ転換率の高さはこのヒーローの完成度に依存している。

## 利用箇所

- イベント詳細ページ (luma.com/{slug}, luma.com/{custom-url})
- カレンダーから遷移したイベントページ
- 埋め込みプレビュー
- メール内 OG プレビュー (画像のみ転用)

## レイアウトパターン

Luma はデスクトップで「**2 カラム (画像 + 情報)**」、モバイルで「**1 カラムスタック**」を採用。

### Desktop

```
┌────────────────────────────────────────────┐
│  [HeaderNav]                                │
├──────────────────────┬─────────────────────┤
│                      │  📅 Thu, Jun 12     │
│                      │  7:00 PM - 9:00 PM  │
│   [Cover Image       │                     │
│    aspect 1:1        │  Title (h1, 32px)   │
│    rounded-3xl ]     │                     │
│                      │  Hosted by          │
│                      │  [Avatar] Alice +2  │
│                      │                     │
│                      │  📍 SoMa, SF        │
│                      │                     │
│                      │  ┌────────────────┐ │
│                      │  │   Register     │ │
│                      │  └────────────────┘ │
└──────────────────────┴─────────────────────┘
```

## 構成要素

1. **Cover image** — 正方形 (1:1) または 4:5。`rounded-3xl` で角丸大きめ。`object-cover`。ホスト設定の `tint_color` を背景グラデに使用。
2. **Date / time block** — 大きめのカレンダーアイコン (Apple のカレンダーアプリ風) + "Thursday, June 12" + 時間帯 + タイムゾーン略号
3. **Title** — `h1` 32〜40px, font-weight 600, line-height 1.1
4. **Host row** — `Hosted by` ラベル + アバタースタック (重ね) + 名前
5. **Location** — 物理は地図サムネイル付き、virtual は Zoom/Meet/Custom アイコン + "Virtual" 表記
6. **Register button** — ファーストビュー内に常に表示。スクロール後は sticky フッターに変身
7. **Going avatars** — Register ボタン下に "+124 going" の小サムネ列

## Props 相当

```ts
type EventHeroProps = {
  event: {
    title: string;
    coverUrl: string;
    startAt: string;
    endAt: string;
    timezone: string;
    tintColor?: string;
    location: { type: 'physical' | 'virtual'; address?: string; coordinate?: [number, number] };
    hosts: Host[];
    goingCount: number;
    goingAvatars: string[];
    capacity?: number;
    waitlistEnabled: boolean;
    status: 'open' | 'approval-required' | 'sold-out' | 'past' | 'cancelled';
  };
  onRegister: () => void;
};
```

## 状態バリエーション

- **Open** — Register (primary)
- **Approval Required** — "Request to Join" ラベルに変化
- **Sold Out + waitlist** — "Join Waitlist"
- **Sold Out (no waitlist)** — "Sold Out" disabled
- **Past** — "Event Ended" + Going だった人にはチェックインリンク
- **Already Registered** — "You're in! 🎉" + チケット詳細ボタンに置換
- **Cancelled** — 赤帯 "This event has been cancelled"

## レスポンシブ

- **Mobile (< 768px)**: 縦スタック。画像 → 日時 → タイトル → ホスト → Register。Register は sticky bottom CTA に切り替え。
- **Tablet (768–1023px)**: 2 カラムだが画像比率を 4:5 に。
- **Desktop (≥ 1024px)**: 2 カラム 1:1 グリッド、max-w 1080px センター。

## A11y

- `<section aria-labelledby="event-title">` で囲む
- 画像 alt は空文字 (装飾) ではなく title を入れる
- `<time datetime>` で開始時刻
- ホストアバタースタックには `aria-label="Hosted by Alice, Bob, Carol"`
- Register button は十分なコントラスト (WCAG AA)

## React 実装案

```tsx
export function EventHero({ event, onRegister }: EventHeroProps) {
  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: event.tintColor ?? '#0a0a0a' }}
    >
      <div
        className="absolute inset-0 opacity-30 blur-3xl"
        style={{ background: `radial-gradient(circle at 30% 20%, ${event.tintColor}, transparent)` }}
      />
      <div className="relative mx-auto grid max-w-5xl gap-10 px-6 py-12 md:grid-cols-2 md:py-20">
        <div className="aspect-square overflow-hidden rounded-3xl shadow-2xl">
          <img src={event.coverUrl} alt={event.title} className="size-full object-cover" />
        </div>
        <div className="flex flex-col gap-6 text-white">
          <DateBlock startAt={event.startAt} endAt={event.endAt} tz={event.timezone} />
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">{event.title}</h1>
          <HostRow hosts={event.hosts} />
          <LocationRow location={event.location} />
          <RegisterButton event={event} onClick={onRegister} />
          <GoingPreview avatars={event.goingAvatars} count={event.goingCount} />
        </div>
      </div>
    </section>
  );
}
```

## デザイントークン

- 画像角丸: 24px (rounded-3xl)
- タイトル: 40px / 600 / -0.02em letter-spacing
- 背景: tint_color の HSL に opacity 0.85 を被せた合成色
- Register button: 高さ 48px、角丸 12px、box-shadow 0 8px 24px rgba(tint,0.4)

## 真似すべきポイント

- 「日時 → タイトル → ホスト → 場所 → CTA」の縦読み順が直感的
- カバー画像と CTA を **同じファーストビュー** に入れる
- tint_color を背景グラデにすると、各イベントが**独自のブランド色**を持てる
