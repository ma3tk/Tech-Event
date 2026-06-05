# Luma (luma.com) トップページ調査メモ

調査日: 2026-06-04
対象URL: https://lu.ma/ (301 → https://luma.com/)
備考: 本ドキュメントは公開HTMLおよびWebFetchで取得した構造観察に基づく一次調査メモであり、模倣実装は「機能のクローン」に留め、文言・画像・スタイル等の著作物は直接複製しない方針で記述する。「(推測)」と明記された箇所は実HTMLからは確証が取れず、ヘルプ記事や同種プロダクトの一般的振る舞いから補完したもの。

---

## 1. 概要・目的

Luma のトップ (ルート `/`) は「(ホスト向け) イベントページ作成・チケット販売・コミュニティ運営の SaaS」のランディングである。connpass が「(参加者向け) IT勉強会のディスカバリーハブ」をトップに据えるのと対照的に、Luma は最初のスクリーンを徹底的に **ホスト獲得** に振り切っている点が大きな特徴。

主目的は以下の3点に整理できる。

1. **ホストへの価値訴求**: "Delightful events start here." をヒーローキャッチに据え、"Set up an event page, invite friends and sell tickets. Host a memorable event today." と続けることで「主催者向けプロダクト」であることを最初の1スクロール内で完結させている。
2. **コンバージョン最短経路の提示**: ファーストビューのプライマリ CTA は唯一 "Create Your First Event" のみ。検索バーもイベント一覧も置かず、迷いを排した1ボタン設計。
3. **ディスカバリー導線は格下扱い**: 参加者向けの "Discover Events" はヘッダーのテキストリンクとフッターに格納されるのみで、トップの主役にはしない。

Luma のドメイン戦略は2025年頃に `lu.ma` (短縮ドメイン) から `luma.com` への正規化が進んでおり、`lu.ma` へのアクセスは 301 で `luma.com` にリダイレクトされる。

---

## 2. URL構造とパスパターン

| パターン | 説明 |
| --- | --- |
| `https://lu.ma/` | 旧ドメイン (短縮 URL)。301で `luma.com` にリダイレクト。SNS シェア・短文用途として歴史的に使われてきた。 |
| `https://luma.com/` | 現在の正規ドメイン。トップページ本体。 |
| `https://luma.com/discover` | Discover (公開イベント探索) ハブ。詳細は `discover.md` 参照。 |
| `https://luma.com/pricing` | プラン一覧。詳細は `pricing.md` 参照。 |
| `https://luma.com/signin` | サインイン (詳細は `signin.md`)。`?next=%2F<path>` で遷移先付き。 |
| `https://luma.com/home` | ログイン後ホーム (Upcoming/Past の自分のイベント。未ログインだとサインインに誘導)。 |
| `https://luma.com/create` | イベント作成 (詳細は `create-event.md`)。 |
| `https://luma.com/{slug}` | カレンダー (コミュニティ) または個別イベント。スラッグ衝突は早い者勝ち。 |
| `https://luma.com/user/{handle}` | ユーザープロフィール (詳細は `user-profile.md`)。`@handle` 形式の handle がパスに入る。 |
| `https://luma.com/event/manage/{event_id}/{tab}` | ホスト管理画面。`overview / guests / registration / blasts / insights / more` のサブタブを持つ。 |
| `https://luma.com/{category-slug}?k=t` | カテゴリページ (Tech, AI, Food & Drink, Climate, Fitness, Wellness, Crypto, Arts & Culture)。`k=t` はソース識別子と推測 (Discover からの遷移時に付与される)。 |
| `https://luma.com/{city-slug}?k=p` | シティ別人気ページ (`tokyo`, `singapore`, `new-york-tech-week`, ...)。`k=p` は "Popular" のソース識別子と推測。 |
| `https://luma.com/{calendar-slug}?k=c` | カレンダー (`k=c` は "Calendar")。 |

Luma 最大の URL 構造上の特徴は **トップレベル名前空間がフラット** な点である。connpass が `/event/`, `/series/`, `/explore/` のように prefix で名前空間を分割しているのに対し、Luma は `/{slug}` ひとつでカレンダー・イベント・カテゴリ・シティを同居させ、内部的に判別している。これは「短い URL = 強いブランド体験」を優先する設計判断 (推測) であり、その代償としてスラッグ衝突や予約語管理が複雑になる。

---

## 3. ページレイアウト (ワイヤーフレーム的記述)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Luma logo]        Discover Events              [Sign In]                  │  ← グローバルヘッダー
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│                                                                            │
│                       Delightful events start here.                        │  ← ヒーロー (H1)
│                                                                            │
│         Set up an event page, invite friends and sell tickets.             │  ← サブコピー
│              Host a memorable event today.                                 │
│                                                                            │
│                  ┌──────────────────────────────┐                          │
│                  │  Create Your First Event     │ ← プライマリCTA           │
│                  └──────────────────────────────┘                          │
│                                                                            │
│                                                                            │
│   [装飾的なイベントカードのモックアップ or アニメーション (推測)]            │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│ [Luma logo]   Discover   Pricing   App   Help                              │  ← フッター
│                                                          [IG] [X] [Email]   │
└────────────────────────────────────────────────────────────────────────────┘
```

ファーストビューに収まる要素が極端に少ないのが特徴。connpass トップが「ヘッダー + サブヘッダー + 新着 + ランキング + フッター」のスーパーマーケット型なのに対し、Luma トップは「Apple/Stripe 風の余白の多いマーケサイト型」。下スクロールしても featured testimonials / value props / closing CTA など数セクションのみで、イベントリストやコミュニティ一覧は登場しない (推測: 一部キャンペーン時には Featured 領域が出る可能性)。

---

## 4. 表示される情報項目の網羅リスト

実HTMLから観測できたテキスト/要素:

- ヘッダー
  - Luma ロゴ (左上、`/` リンク)
  - "Discover Events" (テキストリンク → `/discover`)
  - "Sign In" (ボタン風リンク → `/signin?next=%2F`)
- ヒーロー
  - H1: "Delightful events start here."
  - サブコピー: "Set up an event page, invite friends and sell tickets. Host a memorable event today."
  - プライマリCTA: "Create Your First Event" (→ 未ログインなら `/signin?next=%2Fcreate`、ログイン済なら `/create` (推測))
- フッター
  - Luma ロゴ
  - "Discover" → `/discover`
  - "Pricing" → `/pricing`
  - "App" → `/app` または App Store / Play Store リンク (推測)
  - "Help" → `https://help.luma.com/` (外部)
  - SNS: Instagram, X (Twitter), Email (Cloudflare email-protection 経由でエンコード)
  - 法務: Terms, Privacy, Security, DMCA

推測される追加セクション (非ログイン状態で表示される可能性):

- 信頼バッジ ("Trusted by..." 企業ロゴ列)
- 主な機能の3カラム紹介 (Pages / Guests / Payments など)
- お客様の声 / Testimonial
- 大型コミュニティ事例 (NYC Tech Week, Cursor Community, ETH Tokyo 等)
- フッター直上の "Get Started" 反復CTA

---

## 5. UIコンポーネント

| 種別 | 用途 | 備考 |
| --- | --- | --- |
| Logo Link | ヘッダー左 / フッター左 | `<a href="/">` |
| Nav Link | ヘッダー右上 "Discover Events" | プレーンテキストリンク |
| Primary Button | "Sign In", "Create Your First Event" | 黒系ピル形ボタン (Luma の DS の通称 "pill") |
| H1 Display Text | "Delightful events start here." | 大型サンセリフ、トラッキング詰め |
| Sub Copy | ヒーロー直下 | 2行で改行 |
| Social Icon Row | フッター | SVG アイコン (rel="noopener") |
| Legal Link Row | フッター下部 | テキストリンク 4 つ |

ボタンは Luma 共通の "pill" 形状 (角丸 9999px) でラジアスが強い。フォント (推測) は Inter または独自 "Luma Sans"。`prefers-color-scheme: dark` でダーク UI に切り替わる (Luma はダーク基調が標準)。

---

## 6. 状態による出し分け

| 状態 | ヘッダー右上 | ヒーロー CTA | その他 |
| --- | --- | --- | --- |
| 未ログイン | "Sign In" | "Create Your First Event" → /signin?next=/create | フッターは共通 |
| ログイン済 | アバター + ドロップダウン (推測) | "Create Event" or 直接 `/create` | "Discover Events" の隣に "Home" リンクが追加 (推測) |
| Plus 加入済 | アバターに Plus バッジ (推測) | 同上 | 招待上限などのアップセル表記なし |

未ログイン時にトップに来たユーザーには必ず "Create Your First Event" → サインインフローが提示される設計で、参加者として最初に来た人がイベントを見つけるには明示的に "Discover Events" を押す必要がある。

---

## 7. インタラクション

- ロゴ・全リンクは標準的なフルページ遷移 (Next.js App Router と推測される)
- "Create Your First Event" を未ログイン状態で押すと `/signin?next=%2Fcreate` に遷移し、サインイン成功後に `/create` が表示される (オートリダイレクト)
- スクロール時のアニメーション (推測): ヒーローイラストが視差スクロールで動く / フェードイン
- ホバー時はボタンが微妙にスケールアップ (Framer Motion 系の Tap/Hover アニメーション、推測)
- フッターの Email リンクは Cloudflare の email-protection JS が解釈してメーラーを起動

---

## 8. 推測されるAPIコール

トップは静的寄りなページのため、初期表示時の動的フェッチは少ないと推測される:

- `GET /api/me` (or `/api/auth/session`) — セッション確認 → 未ログインなら Sign In 表示、ログイン済ならアバター
- `GET /api/featured-content` (推測) — Featured calendars / Testimonials を CMS から
- `POST /api/analytics/page-view` — 自前計測 + 3rd party (Segment / PostHog / GA4 のいずれかと推測)

ホスティングは `vercel.app` の Edge と推測 (HTTP ヘッダの `server`, `x-vercel-cache` 等の典型 — 検証はしていない)。

---

## 9. 関連リンク・遷移先

- `/discover` — Discover/Explore ハブ
- `/pricing` — プラン
- `/signin` — サインイン
- `/create` — イベント作成 (ログイン後)
- `/app` — モバイルアプリ
- `https://help.luma.com/` — ヘルプセンター
- フッター: Terms, Privacy, Security, DMCA
- SNS: Instagram, X, Email

---

## 10. SEOメタ情報・OGP (推測含む)

- `<title>`: "Luma — Delightful Events Start Here" (推測。サインインページのタイトルから類推)
- `<meta name="description">`: ヒーロー文相当
- OGP: 1200×630 のロゴ + キャッチ画像 (推測)
- `<link rel="canonical" href="https://luma.com/" />` (旧 lu.ma を 301 で統合する戦略の一部)
- `og:site_name`: "Luma"
- `twitter:card`: `summary_large_image`
- 多言語: `hreflang` は持たない (現状英語UI中心、ただしイベントタイトル/説明には日本語含む多言語混在)

---

## 11. レスポンシブ対応

- 1カラム中央寄せのヒーロー → スマホ/PC で同じレイアウトを共有
- ヘッダーはスマホでもハンバーガー化せず "Discover Events" と "Sign In" をそのまま並べる (リンクが少ないため成立)
- ヒーローの行送り・フォントサイズだけ可変
- フッターはスマホで縦積み (推測)
- Tailwind CSS と推測される (`max-w-`, `mx-auto` パターンの寸法感)

---

## 12. A11y観点

- ヒーロー H1 は唯一の見出し → スクリーンリーダーで明快
- "Sign In" / "Create Your First Event" はボタン要素 (`<button>` または `<a role="button">`) で focus 可能
- 配色: ダーク背景に高コントラストの白文字 (WCAG AA 以上、推測)
- 画像 alt: ロゴ "Luma" (推測)
- キーボード Tab 順: ロゴ → Discover Events → Sign In → CTA → フッターリンク
- Cloudflare email-protection が JS 無効環境でメール露出を防ぐ → A11y よりセキュリティ寄りの実装

---

## 13. 模倣実装する際の留意点

- ヒーロー1ボタンの "迷わせない" 設計を真似ること、ただし日本市場で「参加者ファースト」の場合は逆効果になり得る。
- フラットなトップレベル名前空間 (`/{slug}`) は最初は便利だが予約語管理が地獄になる。`signin`, `create`, `home`, `discover`, `pricing`, `app`, `event`, `user`, `api`, `embed`, `manage`, `admin`, ... のリストを最初に確保する必要がある。
- 旧ドメイン (`lu.ma`) から新ドメイン (`luma.com`) への 301 戦略のように、短縮ドメインを使う場合は SEO/ブランド変更の労力を見越す。
- フォント・ボタン形状・モーション・余白の取り方が "Luma らしさ" の8割を占めるので、ブランド表現はそこに投資する。
- "Create Your First Event" → サインイン → 作成フォーム の動線は3クリック以内が暗黙の SLA。

---

## 14. connpass との違い / Luma が優れている点・劣っている点

### Luma が優れている点
- **ホスト獲得最適化**: ヒーロー1ボタンでホストになるという主アクションが明確。connpass はトップで「グループ作成」より「イベント探索」を優先するためホスト獲得導線が弱い。
- **ブランド体験の統一感**: 余白・タイポ・モーションが洗練されており、SaaS としてのプレミアム感がある。connpass は情報密度を優先するため牧歌的な見た目。
- **URL の短さ**: `luma.com/{slug}` のシンプルさはシェアしやすい。connpass の `{group}.connpass.com/event/{id}/` は長い。
- **多言語混在の受容**: 日本語イベントも英語UI上で違和感なく並ぶグローバル設計。
- **ホストとカレンダー (コミュニティ) のシームレスな並立**: トップ → Discover → カレンダー → 個別イベントの導線が緩やかに繋がっている。

### Luma が劣っている点 / connpass の方が良い点
- **参加者ファーストではない**: トップで新着イベントやランキングが見えない。日本のIT勉強会文化のように「とりあえず参加したい人」が多い市場では情報量不足。
- **検索バーがトップにない**: connpass はヘッダーに検索アイコン (Discover では検索バー) を置く。Luma は Discover まで遷移しないと検索できない。
- **SEO 流入の取りこぼし**: トップが軽い分、ロングテール SEO は弱め (個別カレンダー/イベントページで稼ぐ設計)。
- **日本語ローカライズ不足**: UI 文言が英語のため、英語が苦手な層には心理障壁。
- **連絡先・ヘルプの可視性**: フッターに小さく Help があるのみで、初訪問者の問い合わせ動線が薄い。
