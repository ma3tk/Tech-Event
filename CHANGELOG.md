# Changelog

tech-event の主要マイルストーン履歴。
リリース番号は便宜的なもので、社内開発用の作業フェーズ区切りとして記録する。

形式は [Keep a Changelog](https://keepachangelog.com/) ベースだが、本プロジェクトはまだ
パブリックリリースしていないため `Unreleased` も簡易に扱う。

---

## [Unreleased] — 2026-06-07 — CI A 案 (タイプ別パイプライン) + Security 二段構え

### Added
- **`.github/workflows/security.yml`** — Semgrep (SAST) + gitleaks (secrets) の二段構え。
  LLM 生成コードが secrets を hardcode するリスクに備え、PR 差分 / push main / nightly (UTC 18:00) /
  workflow_dispatch で走査。findings は SARIF で GitHub Code Scanning に統合。
  Semgrep は `p/owasp-top-ten` + `p/typescript` + `p/nextjs` + `p/react` + `p/secrets` 等 11 ルールセット、
  gitleaks は PR 差分 + nightly full history で hardcoded secret を検出。
- **`.gitleaks.toml`** — useDefault 組み込みルール + dev placeholder allowlist
  (`dev-public-api-key-please-change` / `ci-cron-secret` / `ci-placeholder-auth-secret-*` 等のみ許可)。
- **`.semgrepignore`** — `node_modules` / `.next` / `dist` / `storybook-static` / `apps/web/src/generated` /
  `prisma/migrations` / `pnpm-lock.yaml` / `.env*` 等を除外し走査時間を 15min 以内に。
- **`.github/workflows/e2e-full.yml`** — フル E2E + a11y-full + VRT。
  発火条件: PR label `e2e:full` / `[full-e2e]` コミット / push main / nightly cron
  (JST 03:00) / `workflow_dispatch`。
- **`.github/workflows/lighthouse.yml`** — nightly Lighthouse 計測 (JST 04:00)。
  artifact 出力のみ (commit はしない)。

### Changed
- **`.github/workflows/ci.yml`** — A 案 (タイプ別運用) に組み換え。PR / push main では
  `lint` + `typecheck` + `build` + **`smoke`** (4 job, ~5min) のみ実行。旧 `e2e (playwright)`
  (20min) と `a11y (axe-core)` は新規 workflow へ移植。
- **`apps/web-e2e/src/smoke.spec.ts`** — 全 test に `@smoke` タグ付与し、`--grep @smoke`
  で抽出可能に。主要 8 ページ SSR / dev-login + イベント申込 / SSE / axe critical=0 を集約。

### Docs
- `CLAUDE.md` §1.0 / §3.1 に A 案ルールを追記。
- `CLAUDE.md` §7.5 に CI セキュリティ二段構え (Semgrep + gitleaks) のポリシーを追記。
- `.github/pull_request_template.md` に smoke / フル E2E label / Semgrep / gitleaks の checkbox を追加。
- `README.md` テストセクションに CI トリガマトリクス + セキュリティスキャンセクションを追記。

---

## [0.9.0] — 2026-06-05 — Design System v1.0.0 (完成度 100 %)

### Added
- **VRT (Visual Regression Test)** — `e2e/vrt-stories.spec.ts` で Storybook 全 190 story を網羅 (warn only)。
  `pnpm vrt` / `pnpm vrt:update` の npm scripts、`screenshots/stories/*.png` raw 保存、
  Playwright baseline (`e2e/vrt-stories.spec.ts-snapshots/`)。
- **Component API 成熟度表** — `docs/component-api-status.md` (39 component × stable/beta/alpha/deprecated) +
  Storybook MDX `src/stories/design-system/ComponentStatus.mdx`。
- **DS Changelog** — `docs/design-system-changelog.md` で DS 単体の履歴を分離管理 (v0.1.0 → v1.0.0)。
- **DS リリース基準** — `docs/release-criteria.md` (audit から分離した運用判定リスト)。
- **CI a11y ジョブ独立化** — `.github/workflows/ci.yml` に `a11y` job を追加。axe レポート (`_axe*.json`) を artifact 保存。
- **Storybook 公開設定** — `managerHead` で `<title>tech-event Design System — Storybook</title>` 設定、
  `.github/workflows/storybook.yml` のデプロイ後に公開 URL を job summary に出力。
- **拡張アイコン 20 種** — Icons.mdx に Extra カテゴリ (calendar / event / group / 配信 / 主催)、合計 70 種。
- `scripts/build-storybook-static.sh` — ローカル静的 export + preview + title 確認。

### Changed
- `docs/design-system-audit.md` — 完成度 91 % → **100 %**、業界標準比較 update、「100 % 達成宣言」セクション。
- `README.md` — Design System セクションを v1.0.0 / 100 % に更新、公開 Storybook URL 記載。

---

## [0.8.0] — 2026-06-05 — Final polish (test isolation + PG ready)

### Added
- Playwright `globalSetup` / `globalTeardown` で **dev.db スナップショット方式のテスト隔離** を導入 (`e2e/global-setup.ts`, `e2e/global-teardown.ts`)。
- **PostgreSQL 16 / Mailpit / MinIO** スタックを `docker-compose.yml` で一括起動可能に。
- `prisma/schema.postgres.prisma` を自動生成する `scripts/sync-schema-pg.ts` と npm scripts (`db:sync-pg`, `db:migrate:pg`, `db:generate:pg`)。
- `docs/architecture.md` — レイヤー / 依存 / データフロー / 認証フロー / テスト戦略を一枚に集約。
- `CHANGELOG.md` (本ファイル) — 主要マイルストーンの公式履歴。

### Changed
- `e2e/create-flow.spec.ts` の dev-login ユーザーを `fast_moon_169` → `test_user` に変更し、`visual-compare-dark` の `/user/fast_moon_169` 撮影との **データ干渉を排除**。
- `README.md` 全面リライト — クイックスタートで SQLite / PG の選択肢を明示、完成度サマリーセクション追加、`docs/` 全ファイルへのリンクを索引化。

### Fixed
- E2E 連続実行で `dev.db` が膨張し、`visual-compare-dark` の `user-profile` スナップショットが flake する問題を **構造的に解消** (globalTeardown 復元 + 専用ユーザーで二重防衛)。

---

## [0.7.0] — 2026-06-04 — Design System 完成 / Storybook v10

### Added
- 3 階層トークン (primitive → semantic → theme) を `src/styles/{tokens,semantic,themes/*}.css` に分離。
- Storybook v10 + `@storybook/addon-a11y` + `@storybook/addon-mcp` + Vitest 連携。
- `Welcome` + `Design System/*` MDX 11 本 (Introduction / Tokens / Colors / Typography / Spacing / Radius / Icons / Components / Accessibility / Dark Mode / Component Checklist)。
- ライト/ダーク切替 (`<html data-theme="dark">` + `ThemeProvider`) + localStorage 永続化。
- `docs/design-system.md` (一次資料, 22K 行) / `docs/design-system-audit.md` / `docs/icons.md` / `docs/component-taxonomy.md` / `docs/motion.md`。
- 視覚比較 spec `e2e/visual-compare-dark.spec.ts` + ダークモード a11y `e2e/a11y-dark.spec.ts`。

### Changed
- UI primitives を 21 個まで拡充 (shadcn ベース)。
- composite components を 18 個 (Molecule 5 + Organism 13)。
- アイコンを `lucide-react` 50 種に絞り込み、strokeWidth 1.5 / 14·16·20·24 px に統一。

---

## [0.6.0] — 2026-06-04 — Phase 7: Luma 由来機能の網羅

### Added
- **Calendar** モデル (Luma 由来) + `/calendars` / `/calendar/[slug]` / `/calendar/[slug]/edit,manage` / `/calendar/[slug]/feed.xml,ics`。
- **Magic Link ログイン** (`/api/auth/magic-link/{request,verify}` + `MagicLinkToken` モデル + `/login` 連動)。
- **Sticky CTA** (詳細ページ下部) / **ShareModal** (リンク/SNS/QR/埋め込み/Native Share API)。
- **Discover** (`/discover`) — 位置 + 興味 + ソーシャル レコメンド。
- **イベントテーマ** (背景色/グラデ/フォント) を `themeTintColor` / `themeBackgroundStyle` / `themeFontStyle` で表現。
- **埋め込みウィジェット** (`/embed/event/[id]`, `/embed/calendar/[subdomain]`) と埋め込みコード生成画面。

---

## [0.5.0] — 2026-06-04 — Phase 6: 公開 REST API + SEO

### Added
- 公開 REST API `/api/v2/*` 10 endpoint (connpass v2 準拠)。
  - `events`, `events/[id]/presentations`, `groups`, `users`, `users/[nickname]/{groups,attended_events,presenter_events}`, `calendars`, `calendars/[slug]/events`, `docs`。
  - `X-API-Key` + `User-Agent` 認証 + 1 req/sec rate limit (`src/lib/public-api.ts`)。
- 動的 `/sitemap.xml` (static 9 + events 1000 + groups + users 5000), 動的 `/robots.txt`, 全体 `/feed.xml`。
- JSON-LD (Event / Organization / Person / WebSite+SearchAction / BreadcrumbList)。
- OG 画像動的生成 `/event/[id]/opengraph-image`, `/group/[subdomain]/opengraph-image` (next/og 1200x630)。
- グループ / Calendar の RSS / iCal (`/group/[subdomain]/feed.xml,ics`, `/calendar/[slug]/feed.xml,ics`)。

---

## [0.4.0] — 2026-06-04 — Phase 5: 主催者ダッシュボード

### Added
- `/event/[id]/admin` 系 (overview / guests / registration / blasts / check-in / insights / survey / more)。
- 抽選自動実行 `GET /api/cron/run-lotteries?secret=...` (Fisher-Yates + `CRON_SECRET`)。
- 参加者 CSV エクスポート `/event/[id]/admin/guests/export.csv`。
- 受付チェックイン (出席コード / QR) `/event/[id]/check-in` + `/event/[id]/admin/check-in`。
- MarkdownEditor (2 カラム WYSIWYG + ライブプレビュー + ツールバー)。
- アンケート設計 / 回答集計 (`Survey`, `SurveyQuestion`, `SurveyAnswer`)。

---

## [0.3.0] — 2026-06-04 — Phase 4: 参加フロー + 通知

### Added
- 先着 / 抽選参加申込 (EventRole 単位)、補欠登録 + 自動繰上。
- ブックマーク (`/bookmarks` 一覧 + 一括 iCal)。
- 通知センター (`/notifications`) + ヘッダー未読バッジ。
- コメント (1 階層返信)、ホストアバター列 (co-host)。
- 一斉送信 (blast) — 送信ログのみ (SMTP 連携前)。
- Google カレンダー追加リンク + イベント iCalendar (`/event/[id]/ics`, RFC 5545)。

---

## [0.2.0] — 2026-06-04 — Phase 2-3: 公開閲覧 + 認証

### Added
- 41 ページ (App Router): `/`, `/explore`, `/explore/groups`, `/search`, `/series`, `/event/[id]`, `/group/[subdomain]`, `/user/[nickname]`, `/ranking`, `/dashboard`, ほか。
- メール+パスワード ログイン / 新規登録 (`/login`, `/signup`, bcryptjs, te_session cookie)。
- dev-login `/api/auth/dev-login` (開発時)。
- middleware (`src/middleware.ts`) で全リクエストに `x-pathname` を付与。
- 28 model の Prisma schema (User / Group / Event / EventRole / Participant / Payment / VoucherCode / Comment / Tag / EventTag / PresentationMaterial / Survey* / Notification / Bookmark / EventStat / Message / MagicLinkToken / Calendar* / AuditLog 等)。
- シード `prisma/seed.ts` 約 1.5K 行 (62 users / 34 groups / 71 events / 696 participants / 151 comments / 200 notifications / 5 calendars / 67 calendar_events / 14 surveys / 15 messages = 約 1,473 件)。

---

## [0.1.0] — 2026-06-04 — Phase 1: Research + 骨格

### Added
- connpass + Luma 一次調査 — `research/` 94 .md / 22,809 行。
  - connpass: pages (10) / components (12) / features (17) / api (6) / ux-flows (4) / data-model / non-functional。
  - Luma: pages (10) / components (9) / features (10) / api (3)。
  - 横断: `visual-diff-report.md` / `component-verification-report.md`。
- プロジェクト骨格 — Next.js 16.2.7 + React 19.2.4 + TypeScript 5 + Tailwind v4 + Prisma 7 (SQLite + better-sqlite3 driver adapter)。
- ESLint v9 + `eslint-config-next` + Storybook v10 (初期セットアップ)。

---

## 凡例

- **Added**: 新機能
- **Changed**: 既存挙動の変更
- **Fixed**: バグ修正
- **Removed**: 削除
- **Security**: 脆弱性対応
