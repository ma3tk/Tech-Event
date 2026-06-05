# Luma Share Modal

## 役割

イベントを SNS / メール / リンクで共有するための統合モーダル。Luma は「**自然と拡散される**」設計を重視しており、Share ボタンを目立つ位置に置き、モーダルは「リンクコピー / OG プレビュー / SNS ボタン / メール送信」を 1 画面に集約。タイル UI で迷いがない。

## 利用箇所

- イベント詳細ページのヒーロー (Share アイコン)
- ホスト管理画面の "Promote" タブ
- 登録完了後の確認モーダル ("Invite your friends")
- カレンダー詳細の Share Calendar

## 構成要素

1. **OG プレビュー** — Twitter/iMessage 風カード (image + title + host)
2. **Copy link** — URL + "Copy" ボタン (コピー後 "✓ Copied" に変化)
3. **Short link toggle** — luma.com/{custom-url} or luma.com/{slug}
4. **SNS row** — X (旧 Twitter), LinkedIn, Facebook, WhatsApp, Telegram, Email, iMessage
5. **QR code** — モバイル経由共有用
6. **Email invite** — 直接メアド入力 + メッセージ
7. **Embed code** — 外部サイト埋め込み iframe スニペット

## Props 相当

```ts
type ShareModalProps = {
  event: {
    title: string;
    url: string;
    shortUrl?: string;
    coverUrl: string;
    startAt: string;
  };
  open: boolean;
  onClose: () => void;
  defaultTab?: 'link' | 'social' | 'email' | 'qr' | 'embed';
};
```

## レイアウト

```
┌─ Share this event ────────────×─┐
│                                  │
│  [OG preview card]               │
│   Cover · Title · Date · Host    │
│                                  │
│  Link                            │
│  [ luma.com/abc123  ] [ Copy ]   │
│                                  │
│  Share to                        │
│  [X] [in] [f] [W] [T] [✉] [📱]  │
│                                  │
│  [ Show QR code ]                │
│  [ Embed on website → ]          │
└──────────────────────────────────┘
```

## 状態バリエーション

- **Default** — 全ボタン active
- **Copy success** — "✓ Copied!" + 緑チェック (2 秒後リセット)
- **Email tab** — 入力フォーム + 送信履歴
- **QR tab** — 中央に大きい QR + Download PNG
- **Embed tab** — iframe スニペット + Preview
- **Native share** (Mobile) — モバイルでは `navigator.share()` を先に試し、対応なら OS のシートに委譲

## A11y

- `<Dialog role="dialog" aria-modal="true" aria-labelledby="share-title">`
- ESC で閉じる、フォーカストラップ必須
- Copy button: クリック時 `aria-live` で "Copied to clipboard" を SR に通知
- QR コードは `<img alt="QR code for event URL">`

## React 実装案

```tsx
export function ShareModal({ event, open, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(event.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent className="max-w-md space-y-6 rounded-2xl p-6">
        <header className="flex items-center justify-between">
          <h2 id="share-title" className="text-lg font-semibold">Share this event</h2>
          <button onClick={onClose} aria-label="Close"><XIcon /></button>
        </header>

        <OGPreview event={event} />

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">Link</label>
          <div className="flex gap-2">
            <input
              readOnly
              value={event.url}
              className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
            <button
              onClick={copy}
              className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
              aria-live="polite"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-neutral-500">Share to</p>
          <div className="flex flex-wrap gap-2">
            <ShareTile platform="x" event={event} />
            <ShareTile platform="linkedin" event={event} />
            <ShareTile platform="facebook" event={event} />
            <ShareTile platform="whatsapp" event={event} />
            <ShareTile platform="telegram" event={event} />
            <ShareTile platform="email" event={event} />
            <ShareTile platform="messages" event={event} />
          </div>
        </div>

        <div className="flex justify-between text-sm">
          <button className="text-neutral-600 hover:underline">Show QR code</button>
          <button className="text-neutral-600 hover:underline">Embed on website →</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## SNS Share URL テンプレート

```ts
const SHARE_TEMPLATES = {
  x: (e) => `https://x.com/intent/tweet?text=${encodeURIComponent(e.title)}&url=${e.url}`,
  linkedin: (e) => `https://www.linkedin.com/sharing/share-offsite/?url=${e.url}`,
  facebook: (e) => `https://www.facebook.com/sharer/sharer.php?u=${e.url}`,
  whatsapp: (e) => `https://wa.me/?text=${encodeURIComponent(`${e.title} ${e.url}`)}`,
  telegram: (e) => `https://t.me/share/url?url=${e.url}&text=${encodeURIComponent(e.title)}`,
  email: (e) => `mailto:?subject=${encodeURIComponent(e.title)}&body=${e.url}`,
};
```

## デザイントークン

- Modal width: 480px / Mobile 全幅
- Border-radius: 16px
- Share tile: 48×48px, rounded-2xl, gap 8px
- Copy button: 32px height, black bg

## 真似すべきポイント

- 「**1 モーダル / 多目的**」設計で導線が迷子にならない
- OG プレビューがその場で見える = ユーザーが「シェアしたらどう見えるか」を事前確認できて拡散意欲が上がる
- QR + Embed まで同じ場所に置くことで、オフライン会場・自社サイトへの導線が一気通貫
