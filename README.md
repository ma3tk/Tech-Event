# tech-event — connpass + Luma クローン

エンジニア向けの勉強会・カンファレンス・ミートアップを管理する Web プラットフォーム。
[connpass.com](https://connpass.com) を主参考に、加えて [lu.ma](https://lu.ma) の Calendar / Co-host / Share Modal / Sticky CTA など先進的な UX を取り込んだ機能クローン。

> 著作物 (ロゴ・固有テキスト・画像) は一切複製していない。本リポジトリの実装はすべて research/ の自前調査資料に基づく独自再構築である。

---

## 1. 構成

| カテゴリ | 採用技術 |
| --- | --- |
| フレームワーク | Next.js **16.2.7** (App Router + **Turbopack**) |
| UI | React **19.2.4** / TypeScript **5.9** / Tailwind CSS **v4** / lucide-react |
| DB | Prisma **7.8** + SQLite (`@prisma/adapter-better-sqlite3`) |
| 認証 | 簡易セッション cookie (`te_session`, HttpOnly) + bcryptjs / Magic Link (メールトークン) / next-auth (一部利用) |
| Markdown | marked v18 |
| バリデーション | Zod v4 |
| OG 画像 | next/og + sharp |
| QR コード | qrcode-svg |
| テスト | Playwright (E2E + visual + a11y), Vitest (unit), Storybook |
| 開発支援 | ESLint v9, Storybook v10, @axe-core/playwright |

---

## 2. クイックスタート

### 2.1 SQLite (デフォルト・推奨)

```bash
pnpm install
pnpm db:reset                          # マイグレーション + 全シード (62 users / 34 groups / 71 events / 696 participants ほか)
pnpm tsx prisma/seed-test-user.ts      # test@example.com / password の追加 (E2E 用)
pnpm dev                               # http://localhost:3000
```

`.env` の `DATABASE_URL` は `file:./dev.db` のままで OK。

### 2.2 PostgreSQL (オプション・本番想定)

```bash
# 1. PostgreSQL + Mailpit + MinIO を docker compose で起動
docker compose up -d postgres mailpit minio minio-init

# 2. PG 用 schema を生成 (prisma/schema.postgres.prisma)
pnpm db:sync-pg

# 3. .env を PG 接続文字列に書き換え
#    DATABASE_URL="postgresql://techevent:techevent@localhost:5432/techevent?schema=public"

# 4. マイグレーション (schema.postgres.prisma を渡す)
pnpm db:migrate:pg

# 5. 起動
pnpm dev
```

注: 現状、`src/lib/prisma.ts` は better-sqlite3 driver adapter 固定。
PG で起動するには adapter を `@prisma/adapter-pg` に切替える別 PR が必要 (将来作業)。
`docker compose up postgres` まではすぐ動作確認できる。

### 2.3 開発時の手早いログイン

- `http://localhost:3000/api/auth/dev-login?nickname=fast_moon_169` で即セッション cookie 設定 (next= で遷移先指定可)
- `/login` ページ最下部の「開発用ログイン」リンク
- Magic Link テスト: `/login` → 「メールでログイン」→ `/api/auth/magic-link/request` → トークンを `/api/auth/magic-link/verify` で確認

### 2.4 完成度サマリー (2026-06-05 時点)

| 指標 | 値 | 補足 |
| --- | --: | --- |
| connpass コア機能カバー率 | **約 88 %** | research/ 17 カテゴリのうち 15 実装 |
| Luma 追加機能カバー率 | **約 70 %** | calendar / co-host / sticky CTA / share modal / discover / theme 実装済 |
| 総合機能カバー率 | **約 83 %** | 重み付け平均 (connpass 0.7 + Luma 0.3) |
| 公開ページ数 | **68** | `pnpm build` ルートマニフェスト |
| 公開 REST API | **10 endpoint** | connpass v2 準拠 |
| E2E spec / `test()` | **34 / 234+** | `e2e/*.spec.ts`、fullyParallel + globalSetup/Teardown 隔離、`e2e/vrt-stories.spec.ts` (VRT) を追加 |
| デザインシステム完成度 | **100 %** (DS v1.0.0) | `docs/design-system-audit.md` の自己評価 |
| Storybook stories | **35 file / 190 story entries** (21 ui + 14 composite) | + 14 MDX ドキュメント (Welcome + Design System 13) |
| WCAG AA color-contrast | 10 ページ全てで違反 0 | axe critical/serious=0 (CI 強制) |

---

## 3. 実装済み機能 (全カテゴリ網羅)

### 3.1 公開閲覧

| 機能 | 場所 | 備考 |
| --- | --- | --- |
| トップページ | `/` | 注目/新着/おすすめグループ/タグ + 右サイドCTA・ミニカレンダー |
| イベント一覧/検索 | `/explore`, `/explore/groups`, `/search`, `/series` | 左フィルタ + ソートタブ + ページネーション + 右広告枠 |
| イベント詳細 | `/event/[id]` | 紺ヒーロー / 申込ボックス / 参加者タブ / コメント / 発表資料 / JSON-LD |
| グループ詳細 | `/group/[subdomain]` | タブナビ: 開催予定 / 過去 / メンバー / 管理者 / グループについて |
| ユーザープロフィール | `/user/[nickname]` | タブ: 参加履歴 / 主催 / 発表 / 所属グループ |
| カレンダー詳細 | `/calendar/[slug]` | Luma 風コミュニティ。サブスクライブ可能 |
| カレンダー一覧 | `/calendars` | 全公開カレンダー |
| ディスカバー | `/discover` | Luma 風レコメンド (位置 + 興味 + ソーシャル) |
| 人気ランキング | `/ranking` | 月別 / 金銀銅バッジ |
| 公開コンポーネント | `/components` | デザインシステムショーケース |

### 3.2 認証

| 機能 | 場所 | 備考 |
| --- | --- | --- |
| メール+パスワードログイン | `/login`, `POST /api/auth/login` | bcryptjs |
| 新規登録 | `/signup` | nickname / email / password |
| ログアウト | `POST /api/auth/logout` | te_session を破棄 |
| Magic Link ログイン | `/api/auth/magic-link/{request,verify}` | DB トークンを発行 → メール (デモ用は console.log) |
| dev-login | `/api/auth/dev-login` | 開発時の高速ログイン |
| ミドルウェア | `src/middleware.ts` | 全リクエストに `x-pathname` を付与 |

### 3.3 参加

| 機能 | 場所 | 備考 |
| --- | --- | --- |
| 先着参加申込 | `/event/[id]` の申込ボックス | EventRole 単位 |
| 抽選申込 | `/event/[id]/apply` | `recruitmentMethod=lottery` |
| キャンセル | 申込ボックス | 補欠繰り上げ自動実行 |
| 補欠登録 | 申込ボックス (満員時) | 自動繰上げ |
| ブックマーク | 詳細ページ / `/bookmarks` | お気に入り一覧 + 一括 iCal 出力 |
| 出席チェックイン (来場者) | `/event/[id]/check-in` | 出席コード入力 |
| EventStickyCTA | 詳細ページ下部 | スクロール時の常時申込バー |

### 3.4 主催者

| 機能 | 場所 | 備考 |
| --- | --- | --- |
| グループ作成・編集 | `/group/create`, `/group/[subdomain]/edit` | owner / admin 権限制御 |
| イベント作成・編集 | `/event/create`, `/event/[id]/edit` | 草稿 / 公開 / 中止 |
| 参加枠 (EventRole) 設定 | edit 画面内 | 動的追加・定員・抽選/先着 |
| 主催者ダッシュボード | `/event/[id]/admin` | 概要 + 統計 |
| 参加者管理 | `/event/[id]/admin/guests` | 一覧 / 抽選実行 / 手動繰り上げ / CSV 出力 (`/export.csv`) |
| 登録設定 | `/event/[id]/admin/registration` | 受付期間 / 定員調整 |
| 一斉メール (blast) | `/event/[id]/admin/blasts` | 参加者向け全体送信 (送信ログのみ、SMTP 未連携) |
| 受付チェックイン | `/event/[id]/admin/check-in` | スキャナ画面 |
| 主催者統計 | `/event/[id]/admin/insights` | 申込推移 / キャンセル率 |
| アンケート設計 | `/event/[id]/admin/survey` | 設問追加 / 回答集計 |
| その他設定 | `/event/[id]/admin/more` | 削除等 |

### 3.5 コミュニケーション

| 機能 | 場所 | 備考 |
| --- | --- | --- |
| コメント投稿・削除 | 詳細ページ | 1 階層返信 |
| 通知センター | `/notifications` | タブ: 全て / 未読 / 既読、既読化、一括既読 |
| ヘッダー通知ベル | 全ページ | 未読バッジ |
| アンケート回答 | 詳細ページ + `/event/[id]/admin/survey` | 主催者は集計閲覧 |
| ShareModal | 詳細ページ | リンクコピー / SNS / QR / 埋め込みコード / Native Share API |

### 3.6 コミュニティ (Group + Calendar)

| 機能 | 場所 | 備考 |
| --- | --- | --- |
| グループ参加 / 退会 | グループ詳細 | GroupMember |
| グループ admin 権限 | DB `GroupAdmin` | owner / admin |
| グループ blacklist | DB `GroupBlacklist` | 主催者によるブロック |
| グループ RSS | `/group/[subdomain]/feed.xml` | グループ別 |
| グループ iCalendar | `/group/[subdomain]/ics` | 今後30日 VCALENDAR 連結 |
| Calendar (Luma 由来) | `/calendar/[slug]` | 主催者・コミュニティが束ねる「テーマ別カレンダー」 |
| Calendar 編集 / 管理 | `/calendar/[slug]/edit`, `/manage` | owner |
| Calendar サブスクライブ | `/calendars` | フォロワー機能 |
| Calendar RSS / iCal | `/calendar/[slug]/feed.xml`, `/ics` | 公開購読 |

### 3.7 付加機能

| 機能 | 場所 | 備考 |
| --- | --- | --- |
| 抽選自動実行 | `GET /api/cron/run-lotteries?secret=...` | Fisher-Yates / CRON_SECRET 必須 |
| MarkdownEditor | 各種編集フォーム | 2 カラム WYSIWYG + ライブプレビュー + ツールバー |
| イベントテーマ | event detail | 背景色 / グラデを CSS variables で反映 |
| 埋め込みウィジェット | `/embed/event/[id]`, `/embed/calendar/[subdomain]` | iframe 用 |
| 埋め込みコード生成 | `/event/[id]/embed-code` | コピー可能 iframe スニペット |
| イベント iCalendar | `/event/[id]/ics` | RFC 5545 |
| Google カレンダー追加 | 詳細ページのボタン | リンク生成 |
| 最近見たイベント | RecentlyViewedEvents component | sessionStorage 連動 |
| HostAvatarStack | 詳細ページ + 一覧 | 共催 (co-host) 重ねアバター |

### 3.8 公開 REST API (connpass v2 準拠)

| エンドポイント | 用途 |
| --- | --- |
| `GET /api/v2/events` | keyword / prefecture / online / ym / order |
| `GET /api/v2/events/[id]/presentations` | 発表資料一覧 |
| `GET /api/v2/groups?subdomain=...` | グループ検索 |
| `GET /api/v2/users?nickname=...` | ユーザー検索 |
| `GET /api/v2/users/[nickname]/groups` | 所属グループ |
| `GET /api/v2/users/[nickname]/attended_events` | 参加履歴 |
| `GET /api/v2/users/[nickname]/presenter_events` | 発表履歴 |
| `GET /api/v2/calendars` | Luma 由来カレンダー |
| `GET /api/v2/calendars/[slug]/events` | カレンダー所属イベント |
| `GET /api/v2/docs` | OpenAPI ドキュメント (static) |

認証: `X-API-Key` (PUBLIC_API_KEY) + `User-Agent` 必須。1 req/sec のレート制限。

### 3.9 SEO

| 機能 | 場所 | 備考 |
| --- | --- | --- |
| sitemap | `/sitemap.xml` | 動的: static 9 + events 1000 + groups + users 5000、1h revalidate |
| robots | `/robots.txt` | 動的 |
| 全体 RSS | `/feed.xml` | RSS 2.0、10m revalidate |
| グループ RSS | `/group/[subdomain]/feed.xml` | グループ別 |
| Calendar RSS | `/calendar/[slug]/feed.xml` | カレンダー別 |
| metadata + OG + Twitter Card | 全ページ | canonical 含む |
| JSON-LD | Event / Organization / Person / WebSite+SearchAction / BreadcrumbList | |
| OG 画像生成 | `/event/-/opengraph-image`, `/group/-/opengraph-image` | next/og 動的 1200x630 PNG |

---

## 4. 環境変数 (`.env`)

完全リスト:

```bash
# Prisma / DB 接続 (better-sqlite3 driver adapter)
DATABASE_URL="file:./dev.db"

# 抽選自動実行エンドポイントのシークレット (`GET /api/cron/run-lotteries?secret=...`)
# 未設定なら 503 を返す
CRON_SECRET="dev-cron-secret"

# 公開 REST API (`/api/v2/*`) の API キー。リクエスト header `X-API-Key` で検証
# 未設定 or 不一致なら 401
PUBLIC_API_KEY="dev-public-api-key-please-change"

# SEO 用の絶対 URL ベース (sitemap.xml / robots.txt / canonical / OG URL)
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

production 移行時の追加候補 (現状はコード内デフォルトで動作):

```bash
# Magic Link / 主催者 Blast の実送信 (未設定なら console.log フォールバック)
SMTP_URL=                                # 例: smtp://user:pass@host:587
SMTP_FROM=                               # 例: noreply@example.com

# 画像アップロード (`STORAGE_PROVIDER` 未設定なら local 動作)
STORAGE_PROVIDER=local                   # local | s3
S3_BUCKET=
S3_REGION=us-east-1
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_ENDPOINT=                             # MinIO 等の S3 互換 endpoint

# next-auth セッション暗号化 (現状の te_session は単純 cookie で署名のみ)
AUTH_SECRET=

# OAuth (現状 schema には oauth_identities テーブルあり、UI 未配線)
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### 4.1 SMTP 開発手順 (Mailpit)

`SMTP_URL` を実際に試したいときは [Mailpit](https://github.com/axllent/mailpit) が便利。

```bash
# Mailpit を起動 (SMTP=1025, Web UI=8025)
docker run --rm -p 1025:1025 -p 8025:8025 axllent/mailpit

# .env で SMTP を有効化
echo 'SMTP_URL=smtp://localhost:1025'        >> .env
echo 'SMTP_FROM=noreply@tech-event.local'    >> .env

pnpm dev
```

- `/login` から Magic Link を発行すると、Mailpit Web UI (`http://localhost:8025`)
  に届く。本文の verify URL を踏むとログインが完了する。
- 主催者の「一斉メール」(`/event/[id]/admin/blasts`) も Mailpit 経由で全参加者に
  実送信される。
- `SMTP_URL` 未設定時は console.log に `[mail:fallback] to=... subject=...`
  形式で出力される (互換動作)。

### 4.2 画像アップロード手順

- デフォルトは `STORAGE_PROVIDER=local` で `public/uploads/{yyyy}/{mm}/{uuid}.{ext}`
  に保存される (`public/uploads/` は `.gitignore` 済み)。
- イベント編集 (`/event/<id>/edit`) / グループ編集 (`/group/<sub>/edit`) の
  カバー・サムネイル欄に `ImageUploader` が配置されており、画像選択 →
  `POST /api/uploads/image` 経由で保存 → URL がフォームに反映される。
- `sharp` で kind 別に resize される (`event-cover=660x370`,
  `group-thumb=120x120`, `group-cover=1200x630`)。出力は `.webp` (GIF はそのまま)。
- S3 / MinIO に切替えるときは `STORAGE_PROVIDER=s3` + `S3_BUCKET` ほかを設定。
  MinIO は `S3_ENDPOINT=http://localhost:9000` (path-style) で動作する。

---

## 5. 開発手順

### 5.1 初期化

```bash
pnpm install                           # 依存導入
pnpm db:reset                          # prisma migrate reset --force + seed
pnpm tsx prisma/seed-test-user.ts      # E2E 用テストユーザー追加
```

### 5.2 シード

`prisma/seed.ts` (約 1.5K 行) が以下を投入:

- 62 users / 34 groups / 71 events / 696 participants
- 151 comments / 200 notifications / 137 event_tags / 20 tags
- 5 calendars + 67 calendar_events (Luma 由来)
- 14 surveys / 15 messages

### 5.3 開発サーバ

```bash
pnpm dev                               # http://localhost:3000 (Turbopack)
```

### 5.4 テスト

```bash
# E2E (Playwright)
npx playwright install chromium
npx playwright test --project=chromium-desktop -j 2

# perf 計測のみ
npx playwright test --project=chromium-desktop e2e/perf.spec.ts

# unit (Vitest)
pnpm vitest                            # or `pnpm vitest run`
```

#### テスト隔離 (DB スナップショット方式)

`playwright.config.ts` の `globalSetup` で `dev.db` を `dev.db.baseline` にコピー、
`globalTeardown` で復元する設計を採用。これにより:

- `e2e/create-flow.spec.ts` のような **書き込みテスト** が同一 run 内の
  `visual-compare-dark.spec.ts` 等を flake させない (専用 `test_user` 利用で二重防衛)。
- ローカル連続実行で `dev.db` が膨らまず、シード直後の状態が常に再現される。

挙動制御:

- `SKIP_DB_SNAPSHOT=1` ... globalSetup でスナップショットを取らない (CI で時間節約)
- `SKIP_DB_RESTORE=1` ... globalTeardown で復元せず、テスト後 DB 状態を保持 (調査用)

詳細は `e2e/global-setup.ts` / `e2e/global-teardown.ts` のヘッダコメント参照。

### 5.5 docker-compose (本番想定スタック)

```bash
docker compose up -d                      # postgres + mailpit + minio + minio-init
docker compose up postgres                # 必要なものだけ
docker compose down -v                    # ボリュームごと削除
```

| サービス | ポート | 用途 |
| --- | --: | --- |
| postgres | 5432 | PostgreSQL 16 (DB 接続先) |
| mailpit | 1025 / 8025 | SMTP 受信 + Web UI (`http://localhost:8025`) |
| minio | 9000 / 9001 | S3 互換 API + Web UI (`http://localhost:9001`) |
| minio-init | — | `tech-event` バケットを冪等作成 |

### 5.6 Storybook

```bash
pnpm storybook                         # http://localhost:6006
pnpm build-storybook                   # storybook-static/
pnpm storybook:preview                 # build → serve storybook-static/ をローカル静的配信
```

公開 Storybook は **main ブランチへの push 時に GitHub Pages に自動デプロイ** される
(`.github/workflows/storybook.yml`)。公開 URL は `https://<owner>.github.io/<repo>/`。
詳細は [`docs/ci.md`](./docs/ci.md) を参照。

### 5.7 production build

```bash
pnpm build                             # next build (Turbopack)
pnpm start                             # production server
```

### 5.8 typecheck / lint

```bash
pnpm tsc --noEmit
pnpm lint
```

### 5.9 PG schema 同期

```bash
pnpm db:sync-pg                        # prisma/schema.prisma → schema.postgres.prisma 再生成
pnpm db:migrate:pg                     # PG 向けマイグレーション (要 DATABASE_URL=postgres://...)
pnpm db:generate:pg                    # PG 向け Prisma Client 生成 (src/generated/prisma-pg/)
```

---

## 6. ディレクトリ構造

```
research/                             # connpass + Luma 調査資料 (94 .md / 22,809 行)
  pages/                              # connpass ページ仕様 (10 ファイル)
  components/                         # UI 仕様 (12 ファイル)
  features/                           # 機能仕様 (17 ファイル)
  api/                                # 公開 / 内部 API (6 ファイル)
  data-model/                         # ER / Prisma スキーマ案
  ux-flows/                           # ユーザーフロー (4 ファイル)
  non-functional/                     # SEO / A11y / Perf / Security
  luma/                               # Luma 調査 (32 ファイル)
    pages/ components/ features/ api/
    README.md
  visual-diff-report.md               # 本家とのビジュアル差分
  component-verification-report.md    # コンポーネント実装検証
  README.md                           # 調査資料インデックス

prisma/
  schema.prisma                       # 全 28 モデル (SQLite 正本)
  schema.postgres.prisma              # 自動生成 (scripts/sync-schema-pg.ts; PostgreSQL 用)
  migrations/                         # マイグレーション履歴
  seed.ts                             # 全シード
  seed-test-user.ts                   # テストユーザー追加 (E2E 用 test_user)

src/
  middleware.ts                       # x-pathname header 付与
  app/                                # Next.js App Router (page.tsx × 41 / route.ts × 23)
    page.tsx                          # トップ
    layout.tsx, globals.css           # 共通レイアウト + Tailwind theme
    sitemap.ts, robots.ts             # 動的 SEO
    feed.xml/                         # 全体 RSS
    actions/                          # Server Actions (calendar / comment / event / event-admin / group / lottery / notification / survey / checkin)
    api/v2/                           # 公開 REST API
    api/auth/                         # login / logout / dev-login / magic-link
    api/cron/                         # 抽選自動実行
    event/[id]/                       # 詳細 / apply / edit / check-in / embed-code / ics / opengraph-image / admin/*
    group/[subdomain]/                # 詳細 / edit / feed.xml / ics / opengraph-image
    calendar/[slug]/                  # 詳細 / edit / manage / feed.xml / ics
    user/[nickname]/                  # プロフィール
    explore/, search/, ranking/, series/, discover/, calendars/
    bookmarks/, notifications/, dashboard/
    login/, signup/, embed/, components/
    about/, terms/, privacy/
  components/                         # UI 部品 (.tsx × 20 + .stories.tsx × 14)
  lib/                                # auth / prisma / utils / serialize / ical / notification / categories / public-api / seo
  generated/prisma/                   # Prisma Client (生成物)
  types/                              # 型定義 (TS)

e2e/                                  # Playwright tests (33 spec / 181 test())
  global-setup.ts                     # dev.db → dev.db.baseline スナップショット
  global-teardown.ts                  # dev.db.baseline で復元
docs/
  architecture.md                     # レイヤー / 依存 / データフロー / 認証フロー
  design-system.md                    # デザイントークン + コンポーネント (本ドキュメント)
  design-system-audit.md              # 最終 DS 監査 + 業界標準比較 + Top10 残課題
  icons.md                            # アイコン規約 (lucide-react 70 種 = 推奨 50 + Extra 20)
  component-taxonomy.md               # Atomic 分類
  motion.md                           # モーション規約
  perf-report.md                      # bundle 分析 + ページ応答時間計測
  completion-report.md                # 完成度 / Connpass+Luma カバー率 / 残課題

scripts/
  sync-schema-pg.ts                   # SQLite schema → PostgreSQL schema 生成
  sync-tokens.ts, validate-tokens.ts  # デザイントークン同期 / 検証
  build-triptych.ts, build-light-dark-comparison.ts  # 視覚比較合成

docker-compose.yml                    # postgres + mailpit + minio + minio-init
CHANGELOG.md                          # 主要マイルストーン履歴 (0.1.0 → 0.9.0)

screenshots/                          # 視覚比較 / a11y / components / mobile / triptych
public/                               # static assets
```

---

## 7. デザインシステム

`tech-event` のデザインシステムは **DS v1.0.0 / 完成度 100 %** に達した。
3 階層トークン (primitive → semantic → theme) を基盤とし、
21 個の UI primitives + 18 個の composite components + 14 本の MDX ドキュメント +
全 190 story を網羅する VRT スイートから構成される。

**公開 Storybook URL** (GitHub Pages 自動デプロイ):
`https://<owner>.github.io/tech-event/`
(`.github/workflows/storybook.yml` で main push 時に更新。実際の owner / repo は GitHub 設定参照)

詳細: [`docs/design-system-audit.md`](docs/design-system-audit.md) /
[`docs/component-api-status.md`](docs/component-api-status.md) /
[`docs/design-system-changelog.md`](docs/design-system-changelog.md) /
[`docs/release-criteria.md`](docs/release-criteria.md)

### 7.1 構成

| 階層 | 配置 | 数 |
| --- | --- | :-: |
| Primitive tokens | `src/styles/tokens.css` | 色スケール / spacing / radius / shadow / z-index |
| Semantic tokens | `src/styles/semantic.css` | radius-control / radius-card 等のエイリアス |
| Themes (light / dark / high-contrast) | `src/styles/themes/*.css` | テーマ別の意味付け |
| UI primitives (Atom) | `src/components/ui/` | **21** |
| Composite (Molecule / Organism) | `src/components/` | **18** (Molecule 5 + Organism 13) |
| MDX documentation | `src/stories/design-system/` + Welcome | **14** |
| Storybook stories | `*.stories.tsx` | 35 file / **190 story entries** (21 ui + 14 composite) |
| アイコン | lucide-react | **70 種** (推奨 50 + Extra 20) |
| VRT (Visual Regression Test) | `e2e/vrt-stories.spec.ts` | 全 190 story、warn only |

### 7.2 Storybook

```bash
pnpm storybook                         # http://localhost:6006
pnpm build-storybook                   # storybook-static/
pnpm storybook:preview                 # build + serve storybook-static/
bash scripts/build-storybook-static.sh preview   # build + http://localhost:6007 でプレビュー (title 確認込)
```

サイドバー順序は `.storybook/preview.tsx` の `storySort` で **Welcome → Design System → UI → Components** に固定されている。

公開 Storybook (`https://<owner>.github.io/tech-event/`) は `.github/workflows/storybook.yml` で
main ブランチ push 時に自動デプロイされ、ジョブの summary に URL が表示される。

### 7.2.1 VRT (Visual Regression Test)

```bash
pnpm build-storybook                   # 先に静的 export を生成
pnpm vrt                               # 全 190 story を走査 (warn only)
pnpm vrt:update                        # ベースライン再生成
```

VRT は warn only モード (CI を block しない)。差分が出ても console.warn で通知される。

### 7.3 ドキュメント

| ファイル | 内容 |
| --- | --- |
| [docs/design-system.md](docs/design-system.md) | デザイントークン / コンポーネント仕様 / a11y チェックリスト (axe 結果含む) ※一次資料 |
| [docs/design-system-audit.md](docs/design-system-audit.md) | 最終 DS 監査レポート + 業界標準 (Polaris / Material 3 / shadcn / Atlassian) 比較 + Top10 残課題 |
| [docs/icons.md](docs/icons.md) | アイコン規約 (lucide-react / 14·16·20·24 px / strokeWidth 1.5 / 70 種選定 = 推奨 50 + Extra 20) |
| [docs/component-taxonomy.md](docs/component-taxonomy.md) | Atom / Molecule / Organism / Template / Page の分類 |
| [docs/motion.md](docs/motion.md) | モーション規約 (duration / easing / reduced-motion) |
| Storybook (`Welcome`) | カタログのトップランディング |
| Storybook (`Design System/*`) | Introduction / Tokens / Colors / Typography / Spacing / Radius / Icons / Components / Accessibility / Dark Mode / Component Checklist |

### 7.4 ガバナンス

- 新規コンポーネント追加時は Storybook `Design System/Component Checklist` を参照。
- アイコン追加は `docs/icons.md` § 7 の一覧に PR で追記してから採用。
- トークン追加は `src/styles/tokens.css` (primitive) → `themes/{light,dark}.css` (意味) の順で定義。
- WCAG AA は `e2e/components-a11y.spec.ts` + `e2e/a11y-pages.spec.ts` で CI 検査。

---

## 8. 関連ドキュメント

### 8.1 アーキテクチャ / 進捗

| ファイル | 内容 |
| --- | --- |
| [docs/architecture.md](docs/architecture.md) | レイヤーアーキテクチャ / 依存関係 / データフロー / 認証フロー / テスト戦略 |
| [docs/completion-report.md](docs/completion-report.md) | 完成度サマリ / 機能網羅マトリクス / 残課題 / プロジェクト統計 |
| [docs/perf-report.md](docs/perf-report.md) | production build / bundle 分析 / 主要 10 ページの応答時間計測 |
| [CHANGELOG.md](CHANGELOG.md) | 主要マイルストーン履歴 (0.1.0 → 0.9.0) |

### 8.2 デザインシステム

| ファイル | 内容 |
| --- | --- |
| [docs/design-system.md](docs/design-system.md) | デザイントークン / コンポーネント仕様 / a11y チェックリスト (axe 結果含む) |
| [docs/design-system-audit.md](docs/design-system-audit.md) | DS 最終監査レポート (**完成度 100 %** / 業界標準比較 / 100 % 達成宣言) |
| [docs/component-api-status.md](docs/component-api-status.md) | Component API 成熟度表 (39 component × stable/beta/alpha/deprecated) |
| [docs/design-system-changelog.md](docs/design-system-changelog.md) | DS 単体の Changelog (v0.1.0 → v1.0.0) |
| [docs/release-criteria.md](docs/release-criteria.md) | DS リリース判定基準 (patch / minor / major) |
| [docs/icons.md](docs/icons.md) | アイコン規約 (lucide-react 70 種 = 推奨 50 + Extra 20) |
| [docs/component-taxonomy.md](docs/component-taxonomy.md) | コンポーネント分類 (Atomic Design ベース) |
| [docs/motion.md](docs/motion.md) | モーション規約 |

### 8.3 一次調査資料

| ファイル | 内容 |
| --- | --- |
| [research/README.md](research/README.md) | connpass 調査資料インデックス |
| [research/luma/README.md](research/luma/README.md) | Luma 調査資料インデックス |
| [research/visual-diff-report.md](research/visual-diff-report.md) | 本家 connpass とのビジュアル差分 (旧 visual-diff-final-report の最新版) |
| [research/component-verification-report.md](research/component-verification-report.md) | コンポーネント実装検証レポート |

---

## 9. 未実装 (将来作業)

- OAuth (X / GitHub / Facebook) のフルセットアップ (schema は対応済)
- PayPal / Stripe 決済
- i18n (英語 / 中国語)
- 検索の FTS 全文インデックス
- PostgreSQL 本番化のラストワンマイル: `src/lib/prisma.ts` で driver adapter を
  `@prisma/adapter-pg` に切替える (schema / migrations / docker compose は対応済)

### 9.1 完了済み (旧未実装)

- SMTP 連携: `src/lib/mailer.ts` + `nodemailer` で Magic Link / Blast を実送信
  (`SMTP_URL` 未設定なら console.log フォールバック)
- 画像アップロード: `src/lib/storage.ts` + `src/components/ImageUploader.tsx` +
  `/api/uploads/image` (local / s3 ・ sharp resize)
- E2E テスト隔離: Playwright `globalSetup`/`Teardown` で `dev.db` を baseline 復元
  (`e2e/global-setup.ts` / `e2e/global-teardown.ts`)
- PG 対応の準備: `prisma/schema.postgres.prisma` (自動生成) + `docker-compose.yml`
  (postgres + mailpit + minio) + `pnpm db:migrate:pg`

---

## 10. ライセンス

- `research/` の調査資料は connpass.com / lu.ma の公開情報に基づく独自整理。
- ソースコードは社内利用想定 (公開時は別途ライセンス検討)。
- 本家からの素材複製 (ロゴ / 固有テキスト / 画像) は一切行っていない。
