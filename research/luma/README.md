# Luma (luma.com) 調査資料インデックス

connpass クローン `tech-event` の UI / 機能拡張を検討するための、Luma の構造調査メモ集。
調査日: 2026-06-04 / 全 32 ファイル (pages: 10 / components: 9 / features: 10 / api: 3)。

調査方針:
- 公開 HTML, OpenAPI, ヘルプ記事, WebFetch で取得した構造観察に基づく一次調査メモ。
- 著作物 (文言・画像・スタイル) は複製せず、**機能仕様のクローン**のみを目的とする。
- 「(推測)」と明記された箇所は実 HTML からは確証が取れず、同種プロダクトの一般的振る舞いから補完。

参考: `research/component-verification-report.md` の `HostAvatarStack` セクションで、Luma 由来の "共催者重ねアバター" UI を実装済み。

---

## 1. ページ仕様 (`pages/`)

ページ単位の URL 構造・レイアウト・表示項目・フォーム・状態・遷移・SEO・A11y。

| ファイル | 内容 (1行要約) |
| --- | --- |
| [pages/top.md](pages/top.md) | ルート `/` のホスト獲得ランディング。"Delightful events start here." + 単一 CTA "Create Your First Event" の極端なミニマル設計。 |
| [pages/discover.md](pages/discover.md) | `/discover` (= `/explore` エイリアス) の公開イベント探索ハブ。位置 + 興味 + ソーシャルシグナルのレコメンドが connpass の「新着順」と差別化される。 |
| [pages/event-detail.md](pages/event-detail.md) | イベント詳細 = Luma のファネルの心臓部。SNS / QR 来訪者を 1 ステップで RSVP に落とすために最適化。 |
| [pages/create-event.md](pages/create-event.md) | `/create` ホスト獲得の最終関門。トップの "Create Your First Event" 押下から直接到達するシングルカラムのスマートフォーム。 |
| [pages/calendar.md](pages/calendar.md) | カレンダー (= コミュニティ) ページ。connpass の「グループ」相当だが、軽量で多目的 (Spotify プレイリスト的)。 |
| [pages/host-dashboard.md](pages/host-dashboard.md) | ホスト管理画面。Plus 課金 + チケット手数料というビジネスモデルを支えるリッチなコックピット。 |
| [pages/user-profile.md](pages/user-profile.md) | `/user/{handle}` の公開アイデンティティページ。connpass の `/user/{username}/` に近いがホスト体験寄り。 |
| [pages/signin.md](pages/signin.md) | `/signin` 単一エントリーポイント。サインインとサインアップが分離されない "Magic Link First" 設計。 |
| [pages/pricing.md](pages/pricing.md) | `/pricing` マネタイズの中核。Plus / Enterprise プランへの真剣ホスト → 課金ホスト誘導。 |
| [pages/embed.md](pages/embed.md) | 埋め込みウィジェットの説明ページ。iframe / API key 配布の入口。 |

## 2. UI コンポーネント (`components/`)

再利用 UI の役割・構造・props・状態バリエーション・React 実装案。

| ファイル | 内容 (1行要約) |
| --- | --- |
| [components/event-hero.md](components/event-hero.md) | イベント詳細最上部の巨大ヒーロー。大判カバー + 日時 + タイトル + ホスト + Register CTA を 1 画面凝縮。 |
| [components/event-card.md](components/event-card.md) | Discover / カレンダー / プロフィール / 検索結果の汎用カード。「大判カバー画像 + 余白多めのメタ情報」が体験の核。 |
| [components/calendar-card.md](components/calendar-card.md) | カレンダー (= コミュニティ) を表現する大判カード。Subscribe ボタンで継続フォローを促す Spotify プレイリスト風。 |
| [components/host-avatar.md](components/host-avatar.md) | 主催・共催者の重ねアバター列 (`AvatarStack`)。Luma の co-host 文化 (3〜4名共催が常態) を可視化。 |
| [components/attendee-grid.md](components/attendee-grid.md) | "Who's going" 参加者アバターグリッド。社会的証明 (social proof) によるネットワーク効果を狙う UI。 |
| [components/register-button.md](components/register-button.md) | "One-Tap RSVP" の CTA。ログイン済みなら 1 クリック → DB 登録 → メール送信 まで <500ms。 |
| [components/share-modal.md](components/share-modal.md) | リンクコピー / OG プレビュー / SNS / メール送信を 1 画面に集約する統合モーダル。タイル UI。 |
| [components/header-nav.md](components/header-nav.md) | 全ページ最上部のミニマルヘッダー。リンク 1〜2 個 + Sign In のみの極端な省略 (シリコンバレー流)。 |
| [components/theme-customization.md](components/theme-customization.md) | イベント毎の "ページ全体テーマ" を変えるパネル。背景・グラデ・フォントを CSS Variables 経由で即反映。 |

## 3. 機能仕様 (`features/`)

機能単位の目的・エンティティ・状態遷移・ルール・ユーザー/主催者フロー・エッジケース・実装案。

| ファイル | 内容 (1行要約) |
| --- | --- |
| [features/event-registration.md](features/event-registration.md) | 1 タップで終わる One-Tap RSVP。Approval / Waitlist / Invite-only の 4 モードを 1 フォームで切替。 |
| [features/calendar-subscription.md](features/calendar-subscription.md) | "Event でなく Calendar (コミュニティ) を購読する" モデル。ニュースレター的体験を志向。 |
| [features/discover-algorithm.md](features/discover-algorithm.md) | 位置 + 興味 + ソーシャルシグナルのレコメンドアルゴリズム。connpass の「新着順」と差別化。 |
| [features/themes-design.md](features/themes-design.md) | イベント毎に UI 全体が変わる仕組み。CSS Variables でページに瞬時反映 → Twitter シェアで目を引く。 |
| [features/ticketing-payment.md](features/ticketing-payment.md) | Stripe をマーチャント・オブ・レコードに。Free=5% / Plus=0% で 1 サービス内決済完結 (connpass の PayPal 一択と対照)。 |
| [features/email-invitations.md](features/email-invitations.md) | SMS / WhatsApp / Push / Email の 4 チャネル内蔵。外部メール配信 (Mailchimp / SendGrid) を不要にする。 |
| [features/host-tools.md](features/host-tools.md) | 受付 → 集客分析 → 当日入場 → アフターフォローまで 1 アプリで完結する主催者ツール群。 |
| [features/host-bio-link.md](features/host-bio-link.md) | `lu.ma/{username}` の Linktree 的プロフィールページ。テック系コミュニティリーダーの個人ブランド構築用。 |
| [features/embed-widget.md](features/embed-widget.md) | iframe 1 行で導入できる埋め込みウィジェット。外部サイトが Luma を「バックエンド」として使う体験。 |
| [features/mobile-app.md](features/mobile-app.md) | Web 版を補完する iOS / Android アプリ。Push 通知 / Wallet / オフラインチェックインを担当。 |

## 4. API 仕様 (`api/`)

公開 API (Plus プラン以上) と Webhook の仕様。

| ファイル | 内容 (1行要約) |
| --- | --- |
| [api/public-api-overview.md](api/public-api-overview.md) | `https://public-api.luma.com` の REST API 全体像。Plus 以上限定、OpenAPI 3.1 仕様公開、フル CRUD。 |
| [api/endpoints.md](api/endpoints.md) | 主要エンドポイント一覧。`/v{n}/{resource}/{action}` 形式、Calendar / Event / Guest / Ticket / Coupon を網羅。 |
| [api/webhooks.md](api/webhooks.md) | Webhook によるイベント駆動連携 (Slack / Notion / CRM / Zapier)。`/v1` と `/v2` が混在する per-route versioning。 |

---

## Luma vs connpass の構造的差分 Top 10

調査結果から抽出した、**サービス設計の本質的な違い** Top 10。

1. **トップページの方向性**: Luma は「ホスト獲得 1 ボタン (`Create Your First Event`)」のみ。connpass は「参加者向けディスカバリ (検索 + 新着 + ランキング)」が前面。
2. **登録フロー**: Luma は **One-Tap RSVP** (ログイン済 1 クリック)。connpass は「フォーム入力 → 確認 → 完了」の 3 ステップ + メール確認ゲート。
3. **コミュニティ単位**: Luma は **Calendar (購読型)**。connpass は **Group (参加型)**。前者はニュースレター文化、後者はメンバーシップ文化。
4. **テーマ機能**: Luma は **イベント毎に UI 全体 (背景・フォント・グラデ) を差し替え可能**。connpass はサービス全体で固定デザイン。
5. **共催文化**: Luma は **AvatarStack** が基本パーツ (3〜4 名共催が常態)。connpass は単一主催者中心。
6. **決済**: Luma は **Stripe を統合 (Free=5% / Plus=0%)**。connpass は **PayPal 一択 (3.6%+40円, 返金は主催者対応)**。
7. **公開 API**: Luma は **Plus 以上に全 CRUD API + Webhook を提供**。connpass は **GET 7 本のみ・法人月額 297,000 円**。
8. **メール / 招待**: Luma は **SMS / WhatsApp / Push / Email の 4 チャネル内蔵**。connpass は基本メールのみ + 外部 SNS 連携。
9. **埋め込み**: Luma は **iframe 1 行で外部サイトに統合**。connpass は OGP + iCal のみで、外部統合は限定的。
10. **モバイル戦略**: Luma は **専用アプリで Push / Wallet / オフラインチェックイン**を担保。connpass は Web 主体 + iCal 連携。

---

## Lumaから模倣すべきUI Top 5

`tech-event` (connpass クローン) に**取り込む価値が高い** UI / インタラクション。

1. **HostAvatarStack (共催者重ねアバター)** [components/host-avatar.md](components/host-avatar.md)
   - 既に `src/components/HostAvatarStack.tsx` として実装済み。Showcase の `section-host-avatar-stack` で全 variant 検証中。
   - 「主催: A / 共催: B, C」を 1 行で凝縮表現できるため、connpass の縦並びテキスト列より圧倒的に省スペース。
2. **One-Tap RSVP ボタン (Register Button)** [components/register-button.md](components/register-button.md)
   - 既存 connpass フローは 3 ステップ。Luma 流の「ログイン済なら 1 クリック確定」を `EventDetailPage` の最上部 CTA に導入できれば登録率は明確に向上する。
   - 実装の鍵は **楽観的 UI 更新** + **クライアントセッション** + **メール送信非同期化**。
3. **Event Hero (大判カバー + メタ凝縮)** [components/event-hero.md](components/event-hero.md)
   - 現在の `EventCard` は connpass 風のリスト密度重視。 詳細ページの above-the-fold だけは Luma 流の余白多め・カバー画像主体に振ると SNS シェア時の見栄えが上がる。
4. **Share Modal (タイル統合)** [components/share-modal.md](components/share-modal.md)
   - 既存 `ShareModal.tsx` は QR + リンクコピーのみ。Luma 流の「リンクコピー / OG プレビュー / X / メール送信 / カレンダー追加」をタイル UI で並列配置すると拡散経路が増える。
5. **Theme Customization (イベント毎テーマ)** [features/themes-design.md](features/themes-design.md) / [components/theme-customization.md](components/theme-customization.md)
   - 既に `themeTintColor` / `themeBackgroundStyle` / `themeFontStyle` のフィールドは Prisma 側に存在 (event detail page で参照済)。
   - 「主催者がイベント毎にブランド表現する」体験は Luma 最大の差別化要素。実装するなら CSS Variables 経由でページレベル上書き。

---

## 利用上の注意

- 本調査は 2026-06-04 時点。Luma の UI / 機能変更により陳腐化する可能性あり。
- 「(推測)」と明示された箇所はログイン後画面・OpenAPI 推測等から逆算した想定。
- 実装時、Luma の固有テキスト・ロゴ・配色は複製せず、構造とインタラクションのみを参考にする。
