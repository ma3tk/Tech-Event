# Luma Embed Widget

## 概要

Luma は「**自社サイトに Luma のイベント / 登録フォームを埋め込める**」機能を標準提供。iframe 1 行で導入でき、Webflow / Notion / WordPress / 静的 HTML で動作。これにより、外部企業サイトが Luma を「**バックエンドとして使う**」体験が成立する。connpass にはない。

## 埋め込みパターン

| パターン | 用途 | URL |
| --- | --- | --- |
| Event Card | 単一イベントを CTA 付きで掲載 | `luma.com/embed/event/{event_id}` |
| Event List | カレンダー内の Upcoming を縦リスト | `luma.com/embed/{calendar_slug}` |
| Calendar Grid | グリッド表示 | `luma.com/embed/{calendar_slug}?layout=grid` |
| Subscribe Button | カレンダー購読ボタンのみ | `luma.com/embed/subscribe/{calendar_slug}` |
| Checkout | チケット購入ウィジェット | `luma.com/embed/checkout/{event_id}` |

## 基本 iframe スニペット

```html
<iframe
  src="https://luma.com/embed/{slug}"
  width="100%"
  height="600"
  frameborder="0"
  style="border-radius: 16px;"
  allow="payment"
></iframe>
```

`allow="payment"` を付けることで埋め込み先からも Stripe Apple Pay が使える。

## カスタマイズオプション (URL パラメータ)

```
?theme=light|dark|auto
&color=5C66FF
&layout=list|grid|card
&showHosts=true
&hideHeader=true
&limit=5
```

例: 黒背景の自社サイト向けに dark + brand color

```html
<iframe src="https://luma.com/embed/ai-tinkerers?theme=dark&color=00F0FF&layout=grid" />
```

## 仕組み

1. 埋め込み iframe は SSR された軽量 React で配信
2. 親ページとの通信は postMessage (高さ自動調整)
3. Register クリック時:
   - **iframe 内** で完結 (`allow="payment"`) → 同じ枠内で Stripe Checkout
   - or **新規タブで Luma 開く** (旧式)

## SDK 連携 (iframe resize)

Luma は親ページに `postMessage` で高さを通知。これを受けると iframe 自体の `height` が動的に変わる。実装:

```html
<script>
  window.addEventListener('message', (event) => {
    if (event.origin !== 'https://luma.com') return;
    if (event.data.type === 'luma:resize') {
      document.getElementById('luma-frame').height = event.data.height;
    }
  });
</script>
<iframe id="luma-frame" src="..." />
```

## イベントトラッキング

埋め込み Luma から親ページに `postMessage` で発火するイベント:

- `luma:view` — ページ表示
- `luma:register` — 登録完了
- `luma:share` — シェア
- `luma:error`

これを GA / Mixpanel / Posthog 等で計測可能。

## カスタムドメイン (Plus プラン)

- `events.mycompany.com` を CNAME で Luma に向ける
- イベント URL が `events.mycompany.com/{slug}` になる (Luma が SSL 自動発行)
- 埋め込み + カスタムドメインで「Luma を使っていることが分からない自社サイト」が作れる

## SEO 影響

- iframe 内は基本的に親ページの SEO に寄与しない
- そのため、Luma は OG / Schema.org メタデータを親ページに注入する小スクリプトも提供
- 一部 Pro 機能でサーバーサイドレンダリングのプロキシ提供

## 利用シーン

1. **コーポレートサイト** に Upcoming Events セクション
2. **コミュニティ LP** で全イベントを集約表示
3. **EC サイト** の特定商品ページに関連ワークショップ埋め込み
4. **Notion ページ** にカレンダー埋め込み (Notion iframe)
5. **イベントランディング** で Luma を Checkout 専用バックエンド化

## A11y

- 埋め込み iframe は `title="Luma events for {Calendar Name}"` を必須
- 高さ自動調整 (スクロールバー出さない)
- 親ページの prefers-color-scheme を引き継ぐ option

## connpass との対比

connpass にも「グループのバッジ」JS スニペットはあるが、表示専用。Luma は **登録 / 決済まで完結する埋め込み** という点が決定的に違う。

## 真似すべきポイント

1. **iframe + postMessage で高さ自動調整** — 親ページに自然に同居
2. **`allow="payment"`** 対応で Stripe Apple Pay まで通す
3. **URL パラメータでテーマ / レイアウト切替** — エンジニアでなくても貼れる
4. **カスタムドメイン (Plus)** — ホワイトラベル化で B2B 採用しやすい
5. **GA / Posthog 連携イベント** — 埋め込み先で分析できる
