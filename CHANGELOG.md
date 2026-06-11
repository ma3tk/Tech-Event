# Changelog

tech-event の主要マイルストーン履歴。
リリース番号は便宜的なもので、社内開発用の作業フェーズ区切りとして記録する。

形式は [Keep a Changelog](https://keepachangelog.com/) ベースだが、本プロジェクトはまだ
パブリックリリースしていないため `Unreleased` も簡易に扱う。

---

## [Unreleased] — 2026-06-12 — seed の pre-acceptance fixture を確定化 (register-states flaky 解消)

### Fixed
- **`register-states.spec.ts:43` (pre-acceptance) が seed 非決定性で ~15% 落ちる** flaky を解消。
  `prisma/seed.ts` の「future」イベントは `daysAhead = randInt(15, 120)`・`acceptsFrom = start - 30日`
  で生成され、pre-acceptance (acceptsFrom > now) には `daysAhead > 30` が必要。event id 1 / 5 も
  乱数だったため `daysAhead <= 30` を引くと acceptsFrom が過去化し「受付開始前」状態にならず
  テストが非決定的に失敗していた (フル E2E で desktop/mobile 同時に落ちる)。
  - 既存の満員固定 (`isE2EFullTarget = i === 1`) と同じ「E2E fixture をピン留め」方針で、
    pre-acceptance を前提とする event 1 / 5 (i = 0 / 4) の `daysAhead` を 90 に固定し、
    `acceptsFrom` が必ず未来 (約 60 日後) になるようにした。
  - 検証: 再 seed 後 `register-states.spec.ts` を desktop 3 連続 (7/7) + mobile (6/6) で安定 pass。

---

## [Unreleased] — 2026-06-12 — e2e-full flaky 群を安定化 (AUTH_SECRET 整合 + networkidle → web-first 待機)

### Fixed
- **e2e flaky の根本原因: dev-login cookie のサイレント失効** — `apps/web-e2e/playwright.config.ts`
  の `webServer.env.AUTH_SECRET` の fallback (`ci-placeholder-...`) が、`_helpers/auth.ts` の
  `loginByCookie()` が cookie HMAC 署名に使う fallback (`dev-auth-secret-please-change` =
  `util-auth-session` の `getSessionSecret()` default) と食い違っていた。ローカルで
  `AUTH_SECRET` 未設定時にサーバ verify と署名が不一致になり `te_session` cookie が黙って
  無効化 → 未ログイン状態で描画 → 「参加申込」「bookmark-button」等の locator が見つからず
  login/participation 依存の spec が flaky 化していた。fallback をサーバ default と同一文字列に
  統一して解消 (CI は job-level `env: AUTH_SECRET` を設定済みのため影響なし)。
- **timing race の locator 化** — 対象 8 spec から `waitForLoadState("networkidle")` を計 27 箇所
  撲滅し、web-first assertion に置換 (dev server の HMR WebSocket で networkidle が到達せず
  ハングする問題も回避):
  - `toast-actions` / `participate` — 申込/キャンセル/bookmark を「申込ボタン再描画」
    (`toBeVisible`) / `data-bookmarked` 属性確定 (`toHaveAttribute`) / `my-participation-status`
    テキスト確定で待機。
  - `register-states` — 各状態の `[data-testid^="register-state-"]` 出現待ち + 遷移後ボタンの
    `toBeVisible` に置換し、脆い while ループを決定的な遷移待ちへ簡素化。
  - `lottery` — 申込/キャンセルを web-first 待機、抽選実行は `waitForResponse(POST /event/41/admin)`、
    後始末のキャンセルを `toBeHidden` で待機。
  - `approval-flow` — 申請後/承認後/後始末を testid 出現・ボタン detached・`waitForURL` + バッジ消失で待機。
  - `survey` — 質問追加を `waitForResponse(POST /event/{id}/edit)` で待機。
  - `components-mobile` — section screenshot 前に `boundingBox` が連続一致するまで `toPass` で
    レイアウト安定を待機 (固定 sleep なし)。
- 検証: 対象 spec を chromium-desktop で 3 連続 + `-j 2` 並列、chromium-mobile でも 3 連続 pass。
  `waitForTimeout` は導入ゼロ。

### 既知の残課題 (本 PR 対象外)
- `components-mobile.spec.ts` の `toHaveScreenshot` VRT (event-list-row / pagination / group-card) が
  ローカル darwin でフォント/レイアウト差によりベースライン不一致 (CI linux ベースラインとは別)。
  timing flake ではなく、別途 `--update-snapshots` + 視覚レビューでの baseline 再生成が必要 (§3.2)。

---

## [Unreleased] — 2026-06-12 — Storybook deploy の publish_dir 修正 (build 出力パス)

### Fixed
- **`storybook.yml` の Deploy ステップが `ENOENT: ... scandir '.../storybook-static'` で fail**
  していた状態を解消 (prisma スキーマ修正に続く 2 段目の deploy バグ)。`build-storybook` の
  出力は Nx 構造では `apps/web/storybook-static` だが `publish_dir` がリポジトリルートの
  `./storybook-static` を指していた。`./apps/web/storybook-static` に修正。

---

## [Unreleased] — 2026-06-12 — Storybook deploy (GitHub Pages) の red を解消

### Fixed
- **`storybook.yml` (Storybook → GitHub Pages デプロイ) が `Generate Prisma client` ステップで
  `Could not find Prisma Schema` で fail** していた状態を解消。`pnpm exec prisma generate` に
  スキーマパスが無く、リポジトリルートからスキーマ (`apps/web/prisma/schema.prisma`) を解決
  できていなかった。他 job / `e2e-full.yml` と同様に `--schema=apps/web/prisma/schema.prisma`
  を明示。

### Changed
- **`storybook.yml` の push paths フィルタを Nx 構造に更新** — 旧 `src/**` / `.storybook/**`
  (リポジトリルート基準) は Nx 移行後の実体 (`apps/web/src/**` / `apps/web/.storybook/**` /
  `libs/**`) と一致せず、storybook deploy が実質トリガされなくなっていた。実構造に合わせて
  更新し、UI / storybook / token 変更時に Pages が再デプロイされるようにした。

---

## [Unreleased] — 2026-06-11 — e2e-full job から @sb-rendering を除外 (Storybook 未 serve による ECONNREFUSED 解消)

### Fixed
- **nightly `e2e-full` job が `@sb-rendering` テストの hard fail で red** になっていた真因を解消。
  `e2e-full` job (`.github/workflows/e2e-full.yml`) は next dev のみを起動し **Storybook を
  build / serve しない**ため、`storybook-rendering.spec.ts` の `beforeAll` が
  `http://localhost:6006/index.json` に `connect ECONNREFUSED` で throw し、全
  `@sb-rendering` テストが 0ms で hard fail していた (落ちる story が並列ロード順で変わる)。
  - `@sb-rendering` は専用 job (`ci.yml` の `storybook-rendering`: `build-storybook` →
    static serve → `--grep @sb-rendering`) が担当するため、`e2e-full` job の playwright
    実行に `--grep-invert @sb-rendering` を追加して除外 (smoke job と同じ方針)。

### 既知の残課題 (本 PR 対象外)
- `e2e-full` には **seed 非決定性** に起因する flaky が残る (lottery / register-states /
  participate / survey)。`prisma/seed.ts` が固定シードなしの `Math.random()` を使うため
  参加者の accept/waiting/pending 割り当てが run ごとに変わり、特定イベント状態を前提とする
  テストが run ごとに別々に失敗する。根本対処は seed の決定化 (seeded PRNG) または各テストの
  自前 fixture 化で、VRT baseline 等への波及を検証しつつ別途対応する。

---

## [Unreleased] — 2026-06-11 — nightly e2e-full の storybook-rendering hard fail を解消 (env 検証 skip)

### Fixed
- **nightly `e2e-full` workflow が `storybook-rendering.spec.ts` の hard fail で red** に
  なっていた状態を解消。`build-storybook` の **production static build** では
  `NODE_ENV=production` のため `@tech-event/shared-util-env` (@t3-oss/env-nextjs の
  `createEnv`) の strict 検証が走るが、ブラウザ bundle には `DATABASE_URL` /
  `NEXT_PUBLIC_BASE_URL` 等が存在しないため **「Invalid environment variables」を throw**。
  seo ヘルパー (`@/lib/seo` の `absoluteUrl` / `safeJsonLd`) を transitive に読み込む
  component (Breadcrumb / EventCard / Footer / Button docs 等) の story が
  `.sb-errordisplay` で rendering 失敗していた (並列ロードのため落ちる story が run ごとに
  変わる非決定的挙動)。
  - `apps/web/.storybook/main.ts` に `viteFinal` を追加し、`env.ts` が既にサポートする
    escape hatch `process.env.SKIP_ENV_VALIDATION` を Vite `define` でブラウザ bundle に
    `"1"` として inline。Storybook は実行時 env を持たないため検証する意味がなく、
    検証 skip で throw を解消。
  - dev storybook では `NODE_ENV` が production でないため元々再現せず、static build 限定の
    バグだった。再ビルド後 desktop ×3 / mobile ×2 連続で **13/13 pass (決定的 green)** を確認。

### 既知の残課題 (本 PR 対象外)
- nightly `e2e-full` には retry で pass する flaky test が残る (approval-flow:69 /
  survey:46 / components-mobile:152 / queue:57)。job を red にはしないが、別途
  locator-based 待機で安定化したい。

---

## [Unreleased] — 2026-06-10 — nightly Semgrep full scan の red を解消 (誤検出抑制 + vendored 除外)

### Fixed
- **nightly `security` workflow (Semgrep full scan) が 17 blocking findings で fail** していた
  状態を解消。内訳と対応:
  - **`.claude/skills/**` の Python ヘルパー (11 件)** — pptx / mcp-builder / webapp-testing
    等の Claude Code 同梱スキル (vendored third-party)。`defused-xml` / `subprocess-shell-true`
    の指摘は上流ツールの責務であり tech-event のアプリコードではないため、`.semgrepignore`
    に `.claude/` (+ ローカルミラー `.agents/`) を追加して `node_modules` 同様に除外。
  - **`apps/web` の誤検出/意図的実装 (6 件)** — 各サイトに理由付き `// nosemgrep` を付与:
    - `api/auth/login/route.ts` の `DUMMY_PASSWORD_HASH` — timing 攻撃対策の
      `bcrypt.hash("dummy", 12)` 固定ダミー値 (実認証情報ではない)。
    - `middleware.ts` の `X-Frame-Options: DENY` — embed ページは CSP `frame-ancestors`
      で制御する意図的分岐。
    - `group/[subdomain]/page.tsx` / `user/[nickname]/page.tsx` の
      `dangerouslySetInnerHTML` ×4 — `renderMarkdown()` (marked + isomorphic-dompurify で
      sanitize 済み) と `safeJsonLd()` (エスケープ済み JSON-LD) のみ。
  - ローカル `uvx semgrep` で CI と同一 config を実行し **0 findings** を確認済み。

---

## [Unreleased] — 2026-06-09 — Storybook の無スタイル + テーブル消失バグ修正

### Fixed
- **`apps/web/src/app/globals.css`** — `@source` (Tailwind ディレクティブ) が
  `@import "tailwindcss"` と後続の `@import` (tokens / themes / semantic) の間に
  挟まっており、CSS 仕様「`@import` は他の全ての文より前」に違反していた。Next.js
  本体の PostCSS パイプラインは許容するが、Storybook (Vite) は仕様通り後続 `@import`
  を破棄するため、デザイントークン / theme / semantic が読み込まれず全コンポーネントが
  無スタイル化 (primary ボタンが白文字×無背景で不可視)。`@source` を全 `@import` の
  後ろへ移動して解消。
- **`apps/web/.storybook/main.ts` + `remark-gfm@4.0.1`** — catalog `.docs.mdx` が
  GFM パイプテーブル (`| variant | 用途 | ... |`) を生で埋め込んでいるが、MDX v3 は
  デフォルトで GFM を解釈しないため、テーブルが生テキストのまま描画されていた。
  `@storybook/addon-docs` に `mdxPluginOptions.mdxCompileOptions.remarkPlugins: [remarkGfm]`
  を設定し、`<table>` として正しくレンダリングされるよう修正。

---

## [Unreleased] — 2026-06-07 — Catalog を Storybook MDX に統合 (言語化 + 実物 Live Preview)

### Added
- **`libs/shared/ui/src/{name}.docs.mdx` (24)** — UI primitive 全 24 個の Storybook MDX。
  `docs/catalog/ui/{name}.md` の言語化テキストを全文移植し、対応する Story を `<Canvas of={...}>`
  で live preview 化。`<Primary>` + `<Controls>` で props API を表示、末尾に `<Stories>`
  で全 variant 一覧。shadcn/ui スタイルの "Docs + Canvas + API" を 1 ページ統合。
- **`libs/shared/ui-composite/src/{Name}.docs.mdx` (14)** — Composite 14 個 (stories 持ち) の
  MDX。EventCard / Header / EventStatusBadge / ShareModal 等。
- **`apps/web/src/stories/blocks/*.mdx` (7)** — Block パターン MDX。
  - `event-status-orchestration.mdx` — 8 状態 × 全コンポーネントのオーケストレーション
  - `cta-matrix.mdx` — 4 種統一 CTA × variant × size
  - `cards.mdx` / `lists-and-tables.mdx` / `navigation.mdx` / `forms.mdx` / `feedback.mdx`
- **`apps/web/src/stories/foundations/*.mdx` (3)** — Foundation MDX (既存の design-system
  ディレクトリ未カバー分: states / responsive / voice-and-tone)
- **`scripts/gen-catalog-mdx.mjs`** — `docs/catalog/*.md` から `{name}.docs.mdx` を生成。
  YAML front-matter 除去 / h1 除去 / MDX 3 unsafe char (`<`, `>`, `{`, `}`) escape。
  `--force` で上書き、`--dry` で表示のみ。
- **`scripts/sync-catalog-mdx.mjs`** — MD と MDX の見出し乖離を検知。`--fix` で再生成。

### Changed
- **`apps/web/.storybook/preview.tsx`** — sidebar `storySort.order` を更新。
  各 component の `"Docs"` を最上位に固定し、続いて Default → variants → All*。
  Blocks / Foundations を追加。
- **`docs/catalog/00-overview.md` §0** — 4 媒体役割分担マトリクスを再定義。
  catalog MD = テキスト source of truth、Storybook MDX = catalog テキスト + 実物統合の視覚層、
  という新マトリクスを明文化。同期スクリプトの呼び方を追記。
- **`docs/catalog/README.md`** — MD と MDX の関係を明示 (catalog MD を編集すれば
  Storybook MDX に反映される)。
- **`CLAUDE.md` §4.3** — `{name}.docs.mdx` 追加義務を明示。
- **`Design.md` §6.2** — Storybook MDX (docs.mdx) を全コンポーネントに要求と明記。

### Stats
- 作成 MDX 数: 38 (UI 24 + Composite 14) + Blocks 7 + Foundations 3 = **48 MDX**
- Storybook 総 Docs entries: 21 → **59** (Welcome + Design System 20 + UI 24 + Composite 14)
- Storybook build: success (5.61s, blocks chunk 733kB)
- VRT 影響: 新 Docs ページが追加されるが、stories 数自体は不変 (207) のため既存 VRT baseline は影響なし

---

## [Released previously] — 2026-06-07 — CI A 案 (タイプ別パイプライン) + Security 二段構え

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
