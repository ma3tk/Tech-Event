# tech-event 完成度レポート

最終確認日: 2026-07-06 / 環境: Next.js 16.2.7 + Turbopack / SQLite (better-sqlite3 driver adapter) / PostgreSQL は schema + docker compose で準備済

本ドキュメントは connpass + Luma 機能クローンとしての tech-event の達成度を、機能カテゴリ別に可視化し、残課題と次の Top10 タスクを整理することを目的とする。

> **2026-07-06 更新**: connpass/Luma 1:1 パリティ実装 (Wave 1-6b) を反映。
> 完了状況の source of truth は [`parity-gap-tracker.md`](./parity-gap-tracker.md)。

---

## 1. サマリー (自己評価)

| 指標 | 値 | 根拠 |
| --- | --: | --- |
| **connpass コア機能カバー率** | **約 97 % (推計)** | 1:1 パリティ Wave 1-5 完了 (パスワードリセット / プロフィール編集 / 退会 / 47 都道府県 / タグ付与 / blacklist / トランザクションメール / 決済拡張 / API 書き込み CRUD)。残は oEmbed / 権限階層 5 段階 / i18n 全ページ等の磨き込み ([tracker](./parity-gap-tracker.md) 末尾) |
| **Luma 追加機能カバー率** | **約 90 % (推計)** | calendar / co-host / sticky CTA / share modal / discover LP / フォロー / ゲスト招待 / One-Tap RSVP / PWA / QR チケット / Insights ファネル / Plus 課金 / Membership Tiers / Organization / Web Push 実装済。残は Google Cal OAuth / カスタムドメイン / SMS (外部インフラ待ち) + テーマ磨き込み |
| **総合機能カバー率** | **約 95 % (推計)** | 上記の重み付け平均 (connpass 0.7 + Luma 0.3) |
| **1:1 パリティ進捗** | **Wave 1-6b 完了 (2026-07-06)** | [`parity-gap-tracker.md`](./parity-gap-tracker.md)。6b 外部インフラ待ち = Google Cal OAuth / カスタムドメイン / SMS のみ |
| **インフラ準備度** | **PG schema + docker compose 完了** | `src/lib/prisma.ts` の adapter 切替のみ残 |
| **テスト安定性** | **DB スナップショット隔離導入済** | `e2e/global-{setup,teardown}.ts` で flake 構造除去 |
| 公開ページ数 | **68 page.tsx / 48 route.ts** | `apps/web/src/app` 実測 (2026-07-06) |
| 公開 REST API | **12 endpoint** | connpass v2 準拠 (読み取り 10 + 書き込み POST 2) |
| E2E spec ファイル | **83** | `apps/web-e2e/src/*.spec.ts` (2026-07-06 実測、Wave 1-6b で +21) |
| E2E `test()` 件数 | **280** | `test(` 出現数 (2026-07-06 実測) |
| WCAG AA color-contrast | **主要 10 ページ中 9 ページで違反 0** | `screenshots/components/_axe-pages.json` |

---

## 2. 機能網羅マトリクス

凡例: `o` 実装あり / `△` 部分実装 / `-` なし or 該当しない / `o*` E2E テスト網羅

### 2.1 認証・ユーザー

| 機能 | connpass | Luma | clone | E2E |
| --- | :-: | :-: | :-: | :-: |
| メール+パスワード ログイン | o | △ | o | o |
| Magic Link ログイン | - | o | o | o |
| 新規登録 | o | o | o | o |
| dev-login (開発用) | - | - | o | o |
| OAuth (X/GitHub/Facebook) | o | o | △ | - |
| プロフィール編集 (`/settings/profile`) | o | o | o* | o |
| 退会 (`/account/withdraw`) | o | o | o* | o |
| パスワードリセット (`/account/password_reset`) | o | o | o* | o |
| ユーザーフォロー / Followers / Following / Going | - | o | o* | o |

### 2.2 イベント (閲覧 / 参加)

| 機能 | connpass | Luma | clone | E2E |
| --- | :-: | :-: | :-: | :-: |
| イベント詳細 | o | o | o | o |
| 参加申込 (先着) | o | o | o | o |
| 参加申込 (抽選) | o | - | o | o |
| キャンセル | o | o | o | o |
| 補欠登録 / 繰上 | o | o | o | o |
| 出席チェックイン | o | o | o | o |
| ブックマーク | o | △ | o | o |
| ShareModal (QR/SNS/Native) | △ | o | o | o |
| Sticky CTA | - | o | o | o |
| カレンダー追加 (Google/iCal) | o | o | o | o |
| 受付期間制御 | o | o | o | o |
| アンケート回答 | o | o | o | o |
| ホストアバター列 (co-host) | △ | o | o | o |
| イベントテーマ (背景色変更) | - | o | o | o |
| 埋め込みウィジェット | - | o | o | o |

### 2.3 主催者 (作成 / 管理)

| 機能 | connpass | Luma | clone | E2E |
| --- | :-: | :-: | :-: | :-: |
| グループ作成・編集 | o | - | o | o |
| イベント作成・編集 | o | o | o | o |
| 参加枠 (EventRole) 動的設定 | o | o | o | o |
| 抽選実行 (手動 + cron) | o | - | o | o |
| 参加者一覧 / CSV エクスポート | o | o | o | o |
| アンケート設計 | o | o | o | o |
| 一斉送信 (blast) | o | o | o (SMTP 実送信) | o |
| グループ一斉メッセージ (`admin/broadcast`) | o | - | o* | o |
| 主催者統計 (insights) | o | o | o | △ |
| Insights ファネル + UTM 流入分析 | - | o | o* | o |
| 受付チェックインスキャナ | o | o | o | o |
| チケット QR (`/event/[id]/ticket`) + カメラスキャナ | - | o | o* | o |
| ゲスト個別招待 + CSV import (`admin/guests`) | - | o | o* | o |
| イベントタグ付与 UI (作成 / 編集) | o | - | o* | o |
| 会場地図埋め込み (OSM iframe) | o | o | o* | o |
| MarkdownEditor | △ | o | o | o |

### 2.4 コミュニティ (Group + Calendar)

| 機能 | connpass | Luma | clone | E2E |
| --- | :-: | :-: | :-: | :-: |
| グループ詳細 | o | - | o | o |
| グループ参加 / 退会 | o | - | o | o |
| グループ admin / blacklist | o | - | o* (BAN UI + 申込ブロック) | o |
| Calendar (Luma) 詳細 | - | o | o | o |
| Calendar 編集 / 管理 | - | o | o | o |
| Calendar サブスクライブ | - | o | o | △ |
| Calendar 一覧 (`/calendars`) | - | o | o | o |
| Membership Tiers (承認制 / 有料購読) | - | o | o* | o |
| Organization 階層 (`/org/[slug]`) | - | o | o* | o |
| Plus プラン課金 (`admin/billing`) | - | o | o* (STRIPE_PLUS_PRICE_ID で有効化) | o |

### 2.5 コミュニケーション

| 機能 | connpass | Luma | clone | E2E |
| --- | :-: | :-: | :-: | :-: |
| コメント (1階層返信) | o | - | o | o |
| 通知センター | o | o | o | o |
| 未読バッジ (ヘッダーベル) | o | o | o | △ |
| メール通知送信 (SMTP) | o | o | o (mailer + provider 切替) | o |
| トランザクション通知 / メール (申込完了 .ics / 補欠 / キャンセル / 繰上 / 承認結果 / 抽選 / 中止 / グループ新着) | o | o | o* | o |
| リマインダー (24h / 1h, `/api/cron/run-reminders`) | o | o | o* | o |
| One-Tap RSVP (`/rsvp/[token]`) | - | o | o* | o |
| Web Push (VAPID env 揃い時に実配信) | - | o | o* (scaffold) | o |

### 2.6 検索 / 発見

| 機能 | connpass | Luma | clone | E2E |
| --- | :-: | :-: | :-: | :-: |
| イベント検索 (`/explore`) | o | - | o | o |
| 47 都道府県フィルタ | o | - | o* | o |
| グループ検索 | o | - | o | o |
| シリーズ一覧 (`/series`) | o | - | o | o |
| Discover (位置/興味) | △ | o | o | o |
| Discover 都市別 LP (`/discover/[city]`) | - | o | o* (JSON-LD + sitemap) | o |
| Discover カテゴリ別 LP (`/discover/category/[slug]`) | - | o | o* (JSON-LD + sitemap) | o |
| タグフォロー (`/tag/[slug]`, `/following/tags`) + 関連タグ | o | o | o* | o |
| 人気ランキング (月別) | o | - | o | o |

### 2.7 SEO / Feed

| 機能 | connpass | Luma | clone | E2E |
| --- | :-: | :-: | :-: | :-: |
| sitemap.xml (動的) | o | o | o | o |
| robots.txt | o | o | o | o |
| 全体 RSS (`/feed.xml`) | o | o | o | △ |
| グループ RSS | o | - | o | o |
| Calendar RSS | - | o | o | △ |
| JSON-LD (Event 等) | o | o | o | o |
| OG 画像動的生成 | △ | o | o | o |
| Twitter Card | o | o | o | o |

### 2.8 公開 REST API

| 機能 | connpass | Luma | clone | E2E |
| --- | :-: | :-: | :-: | :-: |
| `GET /events` 検索 | o | o | o | o |
| `GET /events` 拡張パラメータ (keyword_or / publish_ym / publish_ymd / subdomain) | o | - | o* | o |
| `GET /groups` 検索 | o | - | o | o |
| `GET /users` 検索 | o | - | o | o |
| `GET /users/.../{groups,attended,presenter}` | o | - | o | o |
| `GET /calendars`, `/calendars/[slug]/events` | - | o | o | o |
| `POST /events` / `POST /events/[id]/participants` (書き込み CRUD) | - | o | o* (write スコープ) | o |
| API キー発行・管理 UI (`/settings/api-keys`) | o | o | o* (te_live_ sha256 保存) | o |
| Outbound Webhooks (HMAC 署名 + SSRF 防御 + 配信ログ) | - | o | o* | o |
| OpenAPI docs (`/api/v2/docs`) | △ | o | o | - |
| `X-API-Key` + `User-Agent` 認証 | o | o | o (env キー + DB キー両対応) | o |
| Rate limit (1 req/sec) | o | o | o | △ |

### 2.9 付加機能 / 横断

| 機能 | connpass | Luma | clone | E2E |
| --- | :-: | :-: | :-: | :-: |
| iCalendar (event / group / calendar) | o | o | o | o |
| 埋め込みコード生成 | - | o | o | o |
| 抽選 cron (`/api/cron/run-lotteries`) | o | - | o | △ |
| リマインダー cron (`/api/cron/run-reminders`) | o | o | o* | o |
| 決済 (Stripe Checkout) | o | o | o (未設定時は現地払いフォールバック) | o |
| 決済拡張: 返金 (手動 + webhook + 中止時自動全額返金) | o | o | o* | o |
| 決済拡張: 領収データ / 適格請求書番号 (`/event/[id]/receipt`) | o | o | o* (R-{eventId}-{seq} 採番) | o |
| 決済拡張: クーポン / 割引コード (`admin/coupons`) | - | o | o* | o |
| 決済拡張: Unlock Code / Donation / Tier 別販売期間 | - | o | o* | o |
| 決済 (PayPal) | o | - | - | - |
| 画像アップロード (本体) | o | o | o (local / S3 + sharp) | - |
| PWA (manifest / service worker / offline) | - | o | o* | o |
| i18n | △ | o | △ (全ページ網羅は未) | - |
| WCAG AA 準拠デザイントークン | - | △ | o | o (axe) |

---

## 3. 残未実装の優先度別リスト

> **2026-07-06 更新**: Wave 1-6b 完了後の残課題は次の 3 グループのみ
> (詳細: [`parity-gap-tracker.md`](./parity-gap-tracker.md))。
>
> 1. **6b 外部インフラ待ち** (コードは実装済 or 未着手のインフラ依存):
>    - Plus/Membership 実課金 — `STRIPE_SECRET_KEY` + `STRIPE_PLUS_PRICE_ID` 設定で有効化 (実装済)
>    - Web Push 実配信 — `pnpm add web-push` + VAPID 鍵設定で有効化 (実装済)
>    - Google Calendar OAuth 自動同期 / カスタムドメイン (CNAME) / SMS・WhatsApp 配信 — 外部アカウント・インフラ契約が必要 (未着手)
> 2. **部分実装の磨き込み**: イベントテーマ プリセット / OG テーマ tint / 埋め込みウィジェット パラメータ /
>    Registration Questions 型追加 / oEmbed 自動埋め込み / グループ権限階層 5 段階 / i18n 全ページ /
>    Calendar 購読別通知プリファレンス
> 3. **通知の残り 1 件**: `bookmark_event_started` の発生源接続
>
> 以下の優先度別リストは 2026-06-05 時点の記録。完了したものに ✅ を付けて履歴として残す。

### P0 (本番投入の障壁)

1. ~~**SMTP 連携**~~ ✅ **完了** (`src/lib/mailer.ts` + nodemailer; SMTP_URL 未設定時 console.log フォールバック)
2. ~~**画像アップロード**~~ ✅ **完了** (`src/lib/storage.ts` + `ImageUploader.tsx` + `/api/uploads/image`; local / S3 切替 + sharp resize)
3. **OAuth UI 配線**: `oauth_identities` テーブルはあるが画面導線がない (next-auth provider 設定 + DB adapter 紐付け)。
4. **本番 DB (PostgreSQL) ラストワンマイル**: schema (`prisma/schema.postgres.prisma`) + docker-compose は準備済。残るは `src/lib/prisma.ts` で adapter を `@prisma/adapter-pg` に切替えるだけ。
5. **AUTH_SECRET の本番暗号化**: 現在は te_session を平文cookieで運用しているため、署名付きセッショントークンに置き換え。

### P1 (機能完成度ギャップ)

6. ~~**決済 (Stripe Checkout 推奨)**~~ ✅ **完了** (Stripe Checkout + Wave 3 決済拡張: 返金 / 領収 / クーポン / Unlock / Donation / 販売期間、2026-07-06)
7. ~~**メール一斉送信 (blast)**~~ ✅ **完了** (SMTP 実送信 + Wave 2 トランザクションメール 8 種 + グループ broadcast、2026-07-06)
8. **検索 FTS インデックス**: 現在は LIKE 部分一致。SQLite FTS5 / Postgres tsvector で全文検索化。
9. **Pagination の aria-disabled 修正**: axe-core で唯一の serious 違反 (3 ノード)。`<a aria-label>` を `<button disabled>` 化。
10. **`/` のカラーコントラスト 1 件**: 装飾淡背景上の補助テキストを `text-muted-foreground` に統一。

### P2 (UX 改善)

11. **i18n (英語)**: Luma 風に切替可能にする。next-intl 候補。
12. **MarkdownEditor の dynamic import**: First Load JS から 40 KB 削減 (perf-report 参照)。
13. **ShareModal の dynamic import**: qrcode-svg を遅延ロード。
14. **イベントの繰り返し開催 (series)**: 現在は手動コピー。RRULE で繰り返し設定。
15. **コメント multilevel (2 階層以上)**: 現状 1 階層。
16. ~~**モバイル PWA (manifest.json + service worker)**~~ ✅ **完了** (Wave 6a: manifest.webmanifest + sw.js + offline.html + install prompt、2026-07-06)

### P3 (大改修)

17. **Edge Runtime 対応**: 現状全リクエスト Node。Prisma adapter を edge 互換版に。
18. **CDN キャッシュ前提のレスポンス設計**: `revalidate` を全公開ページに付与。
19. **OG 画像を WASM 化** (`@resvg/resvg-wasm`)。
20. ~~**ホスト課金 / Plus プラン (Luma)**~~ ✅ **完了** (Wave 6b: Stripe subscription checkout + isGroupPlus 機能ゲート + billing UI。実課金は `STRIPE_PLUS_PRICE_ID` 設定で有効化、2026-07-06)

---

## 4. 次に取り組むべき Top 10 課題

優先度 / インパクト / 工数のバランスで順位付け。

| # | 課題 | 優先度 | 推定工数 | 期待効果 |
| --- | --- | :-: | --- | --- |
| 1 | Pagination の aria-prohibited-attr 修正 | P1 | 30min | axe-core blocker 0 達成、CI グリーン化 |
| 2 | MarkdownEditor の `next/dynamic` 化 | P2 | 1h | First Load JS から ~40 KB 削減 |
| 3 | ShareModal の `next/dynamic` 化 + qrcode-svg 遅延 | P2 | 1h | First Load JS から ~30 KB 削減 |
| 4 | `src/lib/prisma.ts` の adapter を env で SQLite / PG 切替 | P0 | 4h | docker compose で立てた PG にアプリが繋がる |
| 5 | seed.ts を PG generated client (`prisma-pg`) からも import 可能に | P0 | 4h | PG でも 1,473 件のシードが投入できる |
| 6 | OAuth (GitHub + X) 配線 | P1 | 1d | login 体験 / オンボーディング向上 |
| 7 | 検索 FTS 化 (Postgres tsvector / SQLite FTS5) | P1 | 1d | LIKE → relevance ランキング |
| 8 | 主催者統計 insights の E2E 追加 | P1 | 2h | カバレッジ向上、回帰防止 |
| 9 | i18n (英語) のフレーム導入 (next-intl) | P2 | 2d | グローバル展開準備 |
| 10 | ~~Stripe Checkout (有料イベント)~~ ✅ | P1 | 2d | 完了 (2026-07-06 Wave 3 で返金/領収/クーポン/Unlock/Donation まで拡張済) |

### 完了済み (旧 Top 10)

- ~~SMTP 連携~~ → `src/lib/mailer.ts` + nodemailer で実装済
- ~~画像アップロード~~ → `src/lib/storage.ts` + ImageUploader + sharp で実装済
- ~~E2E テスト DB 隔離~~ → `e2e/global-setup.ts` / `global-teardown.ts` で実装済
- ~~PostgreSQL schema 準備~~ → `prisma/schema.postgres.prisma` + `scripts/sync-schema-pg.ts` 実装済
- ~~Stripe Checkout + 決済拡張~~ → Wave 3 (2026-07-06): 返金 (手動 + webhook + 中止時自動) / 領収 + 適格請求書番号 / クーポン / Unlock Code / Donation / Tier 別販売期間
- ~~connpass/Luma 1:1 パリティ Wave 1-6b~~ → [`parity-gap-tracker.md`](./parity-gap-tracker.md) 参照 (2026-07-06)。次の Top 課題は同 tracker の「部分実装で残る磨き込み」8 項目

---

## 5. プロジェクト統計

### 5.1 ソースコード

| 区分 | 行数 | ファイル数 | 備考 |
| --- | --: | --: | --- |
| `src/` (TS/TSX 全体) | **90,631** | — | `wc -l` 合計 |
| `src/app/` page.tsx | — | 41 | App Router ページ |
| `src/app/` route.ts | — | 23 | API / RSS / sitemap 等 |
| `src/app/actions/` | — | 9 | Server Actions |
| `src/components/` `.tsx` | — | 20 | UI 部品 |
| `src/components/` Storybook | — | 14 | `.stories.tsx` |
| `src/lib/` | — | 13 | 共通ユーティリティ |
| `src/middleware.ts` | — | 1 | x-pathname 付与 |

### 5.2 テスト

| 区分 | 件数 | 備考 |
| --- | --: | --- |
| E2E spec ファイル | **83** | `apps/web-e2e/src/*.spec.ts` (2026-07-06 実測、Wave 1-6b で +21) |
| E2E `test()` 件数 | **280** | `test(` 出現数 (2026-07-06 実測) |
| E2E 総行数 | **12,402** | `wc -l` (2026-07-06 実測) |
| Playwright プロジェクト | 2 | chromium-desktop / chromium-mobile |
| a11y チェック対象ページ | 10 | `e2e/a11y-pages.spec.ts` |
| visual diff スクリーンショット | 9 ペア | `e2e/visual-compare.spec.ts` |
| **DB スナップショット隔離** | **あり** | `e2e/global-setup.ts` + `global-teardown.ts` |
| Vitest config | あり | `vitest.config.ts` |
| Storybook stories | 14 | UI カタログ |

### 5.3 調査資料 (`research/`)

| 区分 | 値 | 備考 |
| --- | --: | --- |
| 全 `.md` ファイル数 | **94** | |
| 全行数 | **22,809** | |
| connpass pages | 10 | `research/pages/` |
| connpass components | 12 | `research/components/` |
| connpass features | 17 | `research/features/` |
| connpass api | 6 | `research/api/` |
| connpass ux-flows | 4 | `research/ux-flows/` |
| Luma 調査 | 32 | `research/luma/` (pages 10 / components 9 / features 10 / api 3) |
| visual-diff-report.md | あり | 本家との UI 差分 |

### 5.3.5 DB schema (2026-07-06 追記)

| 区分 | 値 | 備考 |
| --- | --: | --- |
| Prisma モデル数 | **40** | `apps/web/prisma/schema.prisma` (Wave 1-6b で +13: PasswordResetToken / Coupon / CouponRedemption / Follow / TagFollow / ApiKey / WebhookEndpoint / WebhookDelivery / Invitation / EventView / CalendarMembershipTier / Organization / PushSubscription) |
| Wave 1-6b migration | **6 本** | `20260706000000_add_password_reset` 〜 `20260706050000_add_billing_org_push` (PG schema 同期済) |

### 5.4 DB シード規模

| テーブル | 件数 |
| --- | --: |
| users | 62 |
| groups | 34 |
| events | 71 |
| participants | 696 |
| comments | 151 |
| notifications | 200 |
| tags | 20 |
| event_tags | 137 |
| bookmarks | 1 |
| calendars | 5 |
| calendar_events | 67 |
| surveys | 14 |
| messages | 15 |

合計レコード: **約 1,473 件** (主要 13 テーブル合算)

### 5.5 build / bundle

| 区分 | 値 |
| --- | --- |
| 公開ルート | 68 |
| static prerender | 4 (`/feed.xml`, `/sitemap.xml`, `/robots.txt`, `/api/v2/docs`) |
| Compile time | 4.1s (Turbopack) |
| TypeScript check | 4.3s (0 error) |
| First Load JS (合計) | 約 564 KB (uncompressed) |
| Tailwind CSS bundle | 280 KB |

---

## 6. 自己評価所感

> **2026-07-06 追記**: 以下の所感は 2026-06-05 時点の記録。その後 Wave 1-6b で決済 (Stripe + 拡張)・
> 画像アップロード・トランザクションメール・ソーシャル・プラットフォーム API・PWA・課金/組織/Push が
> 実装完了し、残課題は §3 冒頭の 3 グループ (外部インフラ待ち / 磨き込み / bookmark 通知 1 件) に縮小した。

- connpass の機能仕様 17 カテゴリのうち、主要 15 を実装済み。残る決済と画像アップロードは外部サービス連携が必要なため、本リポジトリ内では未着手とする判断。
- Luma の差分機能 (calendar / co-host / sticky CTA / share modal / discover / theme) を取り込んだことで、単なる connpass 模倣ではなく "現代的な勉強会プラットフォーム" として一歩前に進んでいる。
- E2E 181 件 / 33 spec で機能網羅の自動回帰がほぼ取れている。a11y も axe-core で常時走査され、主要 10 ページの 90% で違反 0。
- bundle は 564 KB と中庸 (Next.js + React DOM の素の量に近い)。dynamic import で 70 KB 削減余地あり (perf-report.md §1.6)。
- 残課題は明確で、優先度別に整理できているため、次の開発スプリント計画に直結する。
