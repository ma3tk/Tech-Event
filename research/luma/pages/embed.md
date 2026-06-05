# Luma 埋め込みウィジェット (Embed) 調査メモ

調査日: 2026-06-04
対象URL:
- https://luma.com/embed (公開トップは存在せず、トップに近い扱い)
- https://help.luma.com/ の "Embed Luma on Your Website" 記事 (Integrations カテゴリ)
- 関連ヘルプ: "Single Sign-On (SSO)", "Luma API", "Webhooks", "iCal Syncing"

備考: 専用ランディングページは公開で取得できなかったため、ヘルプセンターのカテゴリ・関連機能から再構成。「(推測)」と明記された箇所は実HTMLから確証が取れず、ヘルプの記事リストや一般的な埋め込み実装慣行から補完したもの。

---

## 1. 概要・目的

Luma は自社サイトに Luma の情報を貼り付ける **埋め込みウィジェット** を提供している。役割は:

1. **コミュニティのオウンドサイト誘客**: 自社の WP / Webflow / Astro / Next.js 等に Upcoming Events を埋め込み、CTA をオウンドサイト上で完結。
2. **チェックアウトの埋め込み**: Stripe Checkout 的な購入フォームをサイト内 iframe で表示。
3. **Subscribe ボタン**: コミュニティ購読をオウンドサイトから直接訴求。
4. **Discover の埋め込み (推測)**: 大型コミュニティが「自社が運営する複数カレンダー」を1ページに統合表示。

ヘルプ記事の表題は "Embed Luma on Your Website" であり、複数の埋め込み種を1記事に束ねていると思われる。

---

## 2. URL構造とパスパターン

| パターン | 説明 |
| --- | --- |
| `https://luma.com/embed/event/{event-id}` | (推測) イベントカード iframe ソース |
| `https://luma.com/embed/calendar/{calendar-id}` | (推測) カレンダーリスト iframe |
| `https://luma.com/embed/checkout/{event-id}` | (推測) チェックアウト埋め込み |
| `https://luma.com/embed/subscribe/{calendar-id}` | (推測) Subscribe ボタン |
| `https://embed.luma.com/...` | (推測) サブドメインで分離している可能性 |

ヘルプ内に "Embed code" としてコピー用スニペットが提供される (推測)。

---

## 3. ページレイアウト (ワイヤーフレーム的記述: Help記事として)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Embed Luma on Your Website                                               │  ← H1
├──────────────────────────────────────────────────────────────────────────┤
│ Overview: コミュニティページにイベント・カレンダーを埋め込み...           │
│                                                                          │
│ ## Event Card                                                            │
│   <iframe src="https://luma.com/embed/event/evt-xxx" ...></iframe>       │
│   オプション: width, height, theme=light|dark                             │
│                                                                          │
│ ## Calendar Embed                                                        │
│   <iframe src="https://luma.com/embed/calendar/cal-xxx" ...></iframe>    │
│                                                                          │
│ ## Subscribe Button                                                      │
│   <a href="https://luma.com/{slug}?subscribe=1">Subscribe</a>            │
│                                                                          │
│ ## Checkout Embed (Plus 機能)                                             │
│   <script src="..."></script>                                            │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

実体のスニペット文言は調査時点で取得できず、上記は同種プロダクト (Eventbrite, Tito, Hopin) との比較に基づく推測形。

---

## 4. 表示される情報項目の網羅リスト (推測ベース)

### Event Card Embed
- カバー画像
- タイトル
- 日時 (ローカルタイムゾーン)
- 場所
- "Register" / "Get Tickets" / "Sold Out" CTA (新規タブで luma.com へ)
- Lumaブランディング ("Powered by Luma")

### Calendar Embed
- カレンダー名 + アバター
- Upcoming Events 一覧 (3〜10件)
- Subscribe ボタン
- "View all on Luma" リンク

### Subscribe Embed
- 単独ボタン (アイコン + テキスト)
- 押下で Luma のサブスクライブモーダル (推測)

### Checkout Embed (Plus 機能、推測)
- iframe 内でチケット選択
- メール入力 + Stripe Elements
- 完了後にイベントの参加確定
- 親ページに `postMessage` で完了通知

---

## 5. UIコンポーネント

| 種別 | 用途 |
| --- | --- |
| iframe | 主な埋め込み手段 |
| `<script>` 埋め込み | JS ベースの動的サイズ調整 / 状態通知 (推測) |
| Copy Button | ヘルプ画面でスニペットをコピー |
| Theme Picker | light/dark (推測) |
| Width/Height Picker | px or % |
| Preview | リアルタイムプレビュー (推測) |

---

## 6. 状態による出し分け

| 状態 | 振る舞い |
| --- | --- |
| 公開イベント | フル機能 |
| Calendar Only / Private | 埋め込み不可 or 認証要 (推測) |
| 過去イベント | "Past Event" 表示のみ |
| 売切れ | "Sold Out" + Waitlist リンク |
| theme=auto | 親ページの prefers-color-scheme に追随 |

---

## 7. インタラクション

- iframe 内クリック → luma.com の新規タブで開く (デフォルト、推測)
- Checkout 埋め込み: Stripe Elements / 3DS チャレンジを iframe 内で完結
- `postMessage` API で親ページに登録完了通知 → Google Analytics / Segment 連携 (推測)
- レスポンシブ: 幅 100% で親に合わせる

---

## 8. 推測されるAPIコール

- 初回ロード: `GET /embed/event/{id}/render` → SSR された静的 HTML
- メタ情報 fetch: `GET /api/event/{id}/public` (一般公開情報のみ)
- 購入時: Stripe Elements 経由 + `POST /api/event/{id}/embed-checkout`
- 完了通知: `window.parent.postMessage({type:'luma:register:success', eventId})`

CSP / X-Frame-Options 設定: `frame-ancestors *` を許可 (埋め込み許可、推測)。Subdomain 分離していれば `embed.luma.com` で別 CSP。

---

## 9. 関連リンク・遷移先

- 親ページから "Register" を押下したら luma.com の対応 URL へ
- ヘルプ記事 "Embed Luma on Your Website"
- Luma API / Webhooks ドキュメント
- Zapier 連携でフォームと組み合わせ可能

---

## 10. SEOメタ情報・OGP

- iframe 内コンテンツは親ページの SEO に貢献しない (検索エンジンが iframe を辿らない)
- そのため、各埋め込み元イベント詳細ページは別途 SEO 最適化される
- 親ページの構造化データに `schema.org/Event` を追加するのは別途必要

---

## 11. レスポンシブ対応

- iframe は `width="100%"` で親幅に合わせる
- 高さは JS で動的調整 (`postMessage` で iframe 内が親に高さ通知、推測)
- スマホ: 単一カラム表示

---

## 12. A11y観点

- iframe には `title` 属性必須 (例: `title="Luma event registration"`)
- iframe 内のフォーカス管理はブラウザに委ねる (キーボードトラップに注意)
- 親ページの背景色に合わせて theme 設定が必要
- 縮小表示でも WCAG コントラスト基準を満たすデザイン

---

## 13. 模倣実装する際の留意点

- **iframe vs Web Components**: iframe は安全だが UX 制約あり (高さ動的調整、フォントスタイル不統一)。Web Components (Shadow DOM) はスタイル独立性高いが iframe ほどの分離は得られない。
- **`X-Frame-Options` 制御**: 埋め込み許可ホストを制御するには CSP `frame-ancestors` で動的に設定。Tito / Eventbrite と同じ手法。
- **CORS**: 親ページからの API 呼び出しは CORS preflight が必要。`Access-Control-Allow-Origin: *` でなく許可リスト方式が望ましい (Plus 機能の API キー紐付け)。
- **Subdomain 分離** (`embed.luma.com`): セッション共有・Cookie 設定が複雑になる。SameSite=None; Secure 必須。
- **Branding 制約**: Free プランは "Powered by Luma" 表示、Plus で非表示 (推測)。
- **postMessage の origin 検証**: `event.origin === 'https://embed.luma.com'` を必ず検証。
- **Stripe Checkout の埋め込み**: 3DS チャレンジは PaymentElement で可、ただしモバイル時のフルスクリーン化に注意。
- **Discover Embed (もしあれば)**: 自社の複数カレンダーをまとめて見せたい大型コミュニティ向け。

---

## 14. connpass との違い / Luma が優れている点・劣っている点

### Luma が優れている点
- **埋め込み種別の豊富さ**: イベントカード / カレンダー / Subscribe / Checkout の4種類 (推測)。connpass のウィジェットはカレンダー埋め込みが中心。
- **iframe + Stripe Checkout の組合せ**: オウンドサイトで即購入完了。connpass はそこまで踏み込まない。
- **Theme サポート (light/dark)**: 親ページのデザインに合わせやすい。
- **postMessage / Webhook 連携**: GA / Segment / 自前 CDP に登録イベントを送れる。
- **Subscribe ボタン埋め込み**: コミュニティ拡大に直接寄与。connpass には類似機能なし。
- **Plus 機能の差別化**: Custom Branding / Branding 非表示など、課金理由を明確化。

### Luma が劣っている点 / connpass の方が良い点
- **ドキュメントの透明性**: connpass のウィジェット (公式ガジェット) は仕様が公開されてコピペで済む。Luma は Help 内に分散しており、特に Checkout 埋め込みは Plus 機能で実装の難易度が高い (推測)。
- **無料での自由度**: connpass のウィジェットは無料でも自由に使える。Luma は機能を絞っている (推測)。
- **日本語のサンプル**: connpass は日本語サンプル豊富。Luma は英語ベース。
- **SEO への寄与**: connpass の埋め込みは自社サイトの SEO に効くアンカー (構造化データ含む) を返すケースがある。Luma は iframe メインのため親ページの SEO に貢献しない。
- **既存 CMS との親和性**: WordPress プラグインなど、connpass は日本でデファクトの統合がある。Luma の WP プラグインは公式ではない (推測)。
- **アクセス制御**: connpass はグループメンバー限定の埋め込みなど、和の意思決定が反映しやすい。
