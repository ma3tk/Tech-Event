# `.claude/` — tech-event 用 Claude Code 設定

このディレクトリは tech-event プロジェクトでの Claude Code 作業を効率化するための skills / plugins / agents / commands を一式まとめたもの。

公式 (`anthropics/skills`, `anthropics/claude-plugins-official`) から輸入したものと、本プロジェクト固有に書き下ろしたものを併用する。

---

## 構造

```
.claude/
  settings.local.json           — プロジェクト共有の permission allowlist (commit 対象)
  README.md                     — このファイル
  agents/                       — 独自 project agent (10本)
    nx-affected.md
    prisma-migrator.md
    storybook-story-generator.md
    e2e-stabilizer.md
    feature-lib-extractor.md
    visual-diff-reviewer.md            ★ 新規 (ビジュアル)
    design-token-explorer.md           ★ 新規 (ビジュアル)
    storybook-curator.md               ★ 新規 (ビジュアル)
    component-screenshot-taker.md      ★ 新規 (ビジュアル)
    figma-token-syncer.md              ★ 新規 (ビジュアル)
  commands/                     — 独自スラッシュコマンド (7本)
    test.md                     — /test
    review.md                   — /review
    seed.md                     — /seed
    nx-graph.md                 — /nx-graph
    vrt.md                      — /vrt              ★ 新規
    screenshot.md               — /screenshot       ★ 新規
    contrast.md                 — /contrast         ★ 新規
  skills/                       — 公式 skills (12本)
    frontend-design/
    webapp-testing/
    theme-factory/
    skill-creator/
    mcp-builder/
    algorithmic-art/                   ★ 新規 (visual)
    brand-guidelines/                  ★ 新規 (visual)
    canvas-design/                     ★ 新規 (visual)
    web-artifacts-builder/             ★ 新規 (visual)
    pdf/                               ★ 新規 (visual export)
    pptx/                              ★ 新規 (visual presentation)
    slack-gif-creator/                 ★ 新規 (visual gif)
  plugins/                      — 公式 plugins (9本)
    code-review/
    pr-review-toolkit/
    commit-commands/
    feature-dev/
    claude-md-management/
    code-simplifier/
    typescript-lsp/
    session-report/
    frontend-design/                   ★ 新規 (plugin 形式 / skill と併存)
```

---

## 公式 skills (12本)

`anthropics/skills` から輸入。LICENSE.txt はそれぞれの skill 直下に同梱。

### コア (PR #5 で輸入)

| name | このプロジェクトでの用途 |
|------|------------------------|
| `frontend-design` | デザインシステム (CLAUDE.md §4) と整合する UI / page 構築。Atom → Composite → Page 階層と Tailwind v4 + CVA primitives を尊重。 |
| `webapp-testing` | Playwright pattern。`/test` コマンド・`e2e-stabilizer` agent と組み合わせて使う。 |
| `theme-factory` | light / dark / high-contrast テーマの追加・微調整 (CLAUDE.md §4.1)。 |
| `skill-creator` | 今後 tech-event 固有の skill を増やすときに使うメタ skill。 |
| `mcp-builder` | 自前 MCP server (例: Prisma 経由でイベント検索する MCP) を立てる時。 |

### ビジュアルデザイン系 (今回追加)

| name | このプロジェクトでの用途 |
|------|------------------------|
| `algorithmic-art` | OG 画像 / ヒーロー背景 / 装飾パターンを p5.js で生成。Showcase ページの彩りや、テクノロジー系イベントの背景生成に。 |
| `brand-guidelines` | tech-event 自体のブランドガイドライン定義テンプレ。色 / タイポ / ロゴ規約のドキュメント化に利用。 |
| `canvas-design` | Canvas API で OG image / バナー / 静的アートを生成。Twitter card / 共有用画像など。 |
| `web-artifacts-builder` | React + Tailwind + shadcn/ui で elaborate な HTML artifact 生成。プロトタイピングや共有ドラフトに。 |
| `pdf` | 主催者向けレポート / 参加者向け資料 / 領収書 PDF などの生成・編集。 |
| `pptx` | 社内共有 / 投資家向けピッチデッキ / 機能リリース向けスライド生成。 |
| `slack-gif-creator` | リリースアナウンス / Easter egg のアニメ GIF を Slack 投稿用に最適化。 |

---

## 公式 plugins (9本)

`anthropics/claude-plugins-official` から輸入。各 plugin は `.claude-plugin/plugin.json` を含む形でそのまま導入可能。

| name | このプロジェクトでの用途 |
|------|------------------------|
| `code-review` | 汎用 code review。`/review` (独自) が先に走るがその補助に。 |
| `pr-review-toolkit` | PR review 用の sub-agent / コマンド集。GitHub Actions ベースの CI とは別の手元 review。 |
| `commit-commands` | conventional な commit / amend / fixup ヘルパー。 |
| `feature-dev` | 新機能開発のスキャフォルディング。`feature-lib-extractor` agent と相補。 |
| `claude-md-management` | CLAUDE.md の改善 / 追記をガイドする。プロジェクト方針追加時に。 |
| `code-simplifier` | 既存コード簡素化 (CLAUDE.md §1.1 を破らない範囲で)。 |
| `typescript-lsp` | TypeScript LSP 経由の型情報参照。`strict: true` 維持時に役立つ。 |
| `session-report` | セッション末尾のサマリ HTML 生成。長時間作業のレビュー時に。 |
| `frontend-design` ★ | plugin 形式の frontend-design (skills/frontend-design と内容は重複するが、plugin 機構経由のインボケに使う)。 |

---

## 独自 agents (10本)

`/agents/` 配下。CLAUDE.md の不変原則 (削除禁止 / 完璧主義ループ / リサーチファースト) に従う形で書かれている。

### コア (PR #5 で作成)

| agent | 起動契機 |
|-------|---------|
| `nx-affected` | PR 提出前のセルフチェック、CI 時間最小化 |
| `prisma-migrator` | `prisma/schema.prisma` 編集直後 (SQLite ↔ PostgreSQL 両 schema を同期) |
| `storybook-story-generator` | 新規コンポーネント追加直後 (variant × state 100% カバー、VRT + a11y) |
| `e2e-stabilizer` | E2E が断続的に失敗 (`waitForTimeout` 撲滅、locator-based 化) |
| `feature-lib-extractor` | apps/web から `libs/web/feature-*` へ機能を切り出すワークフロー |

### ビジュアルデザイン系 (今回追加)

| agent | 起動契機 |
|-------|---------|
| `visual-diff-reviewer` | 本家 (connpass / luma) と clone のスクショペアを四半期チェックする / PR の見た目変更時 |
| `design-token-explorer` | DS 監査時 / 新カラー追加時 / WCAG コントラスト全件チェック時 |
| `storybook-curator` | 全 story の variant カバレッジ計測 → 不足提案 (新規コンポーネント追加直後 / リリース前) |
| `component-screenshot-taker` | 特定コンポーネント 1 つを 6 軸 (3 テーマ × 2 viewport) でキャプチャ。デザイナー共有 / レビュー用 |
| `figma-token-syncer` | Figma Tokens Studio 側で値変更 / CSS 側で値変更後の双方向同期 |

起動方法 (Claude Code 内):
```
agent run visual-diff-reviewer
agent run design-token-explorer
...
```
もしくは会話で「visual-diff-reviewer 走らせて」と指示するだけでも認識される。

---

## 独自 commands (7本)

`/commands/` 配下。チャットで `/<name>` で実行。

### コア (PR #5 で作成)

| command | 概要 |
|---------|------|
| `/test` | chromium-desktop + chromium-mobile で E2E を並列実行 (-j 2) |
| `/review` | tech-event 4 観点 PR review (security / data-model / code-quality / ux-a11y) |
| `/seed` | dev.db を baseline から作り直し + test_user 投入 + recalc |
| `/nx-graph` | `pnpm nx graph` で依存図を JSON 化し被依存数ランキングを表示 |

### ビジュアルデザイン系 (今回追加)

| command | 概要 |
|---------|------|
| `/vrt` | `pnpm vrt:update` → `pnpm vrt` を順次実行。全 Storybook story のベースライン更新 + 再走検証 |
| `/screenshot <url> [desktop\|mobile]` | 指定 URL を Playwright headless で撮影し `/tmp/screenshots/` に保存 |
| `/contrast <fg> <bg>` | 2 色の WCAG コントラスト比を計算し AA / AAA を判定 (normal text / large text / UI 3 軸) |

---

## ビジュアルワークフロー例

### 1. design system を更新した
```
1. tokens.css または semantic.css を編集
2. /vrt                          ← 全 story のベースライン更新 + 検証
3. agent run design-token-explorer  ← WCAG 全件チェック
4. agent run storybook-curator      ← variant カバレッジ確認
```

### 2. 本家 (connpass) との差分を四半期チェック
```
1. /screenshot https://connpass.com/event/123456/
2. /screenshot http://localhost:3000/events/abc
3. agent run visual-diff-reviewer
   入力: 上記 2 枚 → research/visual-diff-<scope>-<date>.md
```

### 3. 新規コンポーネント追加した
```
1. 実装 (src/components/ui/<name>.tsx)
2. agent run storybook-story-generator   ← story 自動生成
3. agent run component-screenshot-taker  ← 3 テーマ × 2 viewport キャプチャ
4. /vrt                                  ← 全体ベースライン同期
```

### 4. Figma 側でトークン値が変わった
```
1. agent run figma-token-syncer (mode=detect-only)
2. 差分を確認 → mode=json-to-css に切り替え
3. /vrt                                  ← VRT 影響確認
4. agent run design-token-explorer       ← AA/AAA 再判定
```

### 5. PR 前にビジュアル変更の影響範囲を出したい
```
1. agent run nx-affected
2. /vrt
3. agent run visual-diff-reviewer (PR 前 vs PR 後の 2 枚で)
```

---

## settings.local.json の permission rules

CLAUDE.md §8 の検証手順 (pnpm / playwright / tsc / prisma / git / gh / nx) をプロンプトなしで実行できるように allowlist 化している。

**注意**: ユーザー固有の overrides は `.claude/settings.local.json` ではなく `~/.claude/settings.json` 側で行うこと。このファイルはチーム共有設定として commit 対象。

---

## 起動方法サマリ

| 何をしたい | アクション |
|----------|-----------|
| E2E 走らせたい | `/test` または `/test <grep-pattern>` |
| PR を 4 観点でレビュー | `/review` |
| dev.db を綺麗にしたい | `/seed` |
| 依存グラフを見たい | `/nx-graph` |
| 全 VRT を再生成して検証したい | `/vrt` |
| URL のスクショ 1 枚取りたい | `/screenshot <url>` |
| 2 色のコントラスト比を知りたい | `/contrast <fg> <bg>` |
| Prisma schema を変更した | 会話で「prisma-migrator で migration 作って」 |
| 新規コンポーネントを追加した | 会話で「storybook-story-generator で story 生成」 |
| 1 コンポーネントだけ 3 テーマで撮りたい | 会話で「component-screenshot-taker で <name> を撮って」 |
| Storybook の variant 抜けを知りたい | 会話で「storybook-curator で監査」 |
| 本家とのビジュアル差分レポート | 会話で「visual-diff-reviewer で <pair> を比較」 |
| トークンの WCAG 監査 | 会話で「design-token-explorer で全部チェック」 |
| Figma との token 同期 | 会話で「figma-token-syncer で双方向確認」 |
| E2E が flaky | 会話で「e2e-stabilizer で安定化」 |
| feature を libs に切り出したい | 会話で「feature-lib-extractor で <feature> を抽出」 |
| PR 前の自己チェック | 会話で「nx-affected で affected を全部回して」 |
| 公式 skill / plugin を使いたい | 会話で skill / plugin 名を呼ぶ (例: 「frontend-design に従って...」、「canvas-design で OG 画像」) |

---

## tech-event 固有のカスタマイズ箇所

1. `.claude/agents/prisma-migrator.md` — SQLite (dev) と PostgreSQL (prod) の 2 schema 体制に対応
2. `.claude/agents/feature-lib-extractor.md` — Nx monorepo の libs/shared / libs/web tag 体系を前提
3. `.claude/agents/e2e-stabilizer.md` — `global-setup.ts` の baseline コピー方式を尊重 (削除しない)
4. `.claude/agents/visual-diff-reviewer.md` — `research/visual-diff-final-report.md` の記法を継承
5. `.claude/agents/design-token-explorer.md` — `apps/web/src/styles/tokens.css` と `apps/web/scripts/validate-tokens.ts` 前提
6. `.claude/agents/storybook-curator.md` — `apps/web/src/components/{ui,}/*.tsx` の階層を前提
7. `.claude/agents/component-screenshot-taker.md` — `apps/web-e2e/playwright.config.ts` の chromium-desktop / chromium-mobile 設定を流用
8. `.claude/agents/figma-token-syncer.md` — `pnpm tokens` / `pnpm tokens --reverse` 双方向スクリプトに依存
9. `.claude/commands/review.md` — CLAUDE.md §1, §6, §7 を判定軸として明示
10. `.claude/commands/seed.md` — `prisma/seed-test-user.ts` を含む 2 段 seed
11. `.claude/commands/vrt.md` — `pnpm vrt` / `pnpm vrt:update` の package.json scripts に依存
12. `.claude/settings.local.json` — `pnpm nx`, `npx prisma`, `npx playwright` を allowlist

---

## Design.md について

[`../Design.md`](../Design.md) は tech-event の**ビジュアル / インタラクション規範のトップレベル文書**であり、`.claude/` 配下のビジュアル系作業 (agent / skill / command / plugin) すべての**最上位規範**として扱う。

- ビジュアル系 agent (`visual-diff-reviewer`, `design-token-explorer`, `storybook-curator`, `component-screenshot-taker`, `figma-token-syncer`) は **作業前に必ず Design.md を読む**
- ビジュアル系 command (`/vrt`, `/screenshot`, `/contrast`) も Design.md の §2 (ブランド) / §11 (継続的検証) を参照する設計
- 輸入した公式 visual 系 skill (`algorithmic-art`, `brand-guidelines`, `canvas-design`, `web-artifacts-builder`, `pdf`, `pptx`, `slack-gif-creator`) は各 `SKILL.md` 末尾の「tech-event 固有メモ」で Design.md を参照する形になっている
- コード品質規範は引き続き [`../CLAUDE.md`](../CLAUDE.md)、詳細実装は [`../docs/design-system.md`](../docs/design-system.md)

ビジュアル系作業を始める前に、`Design.md` の Top 10 ルールを最低限頭に入れること。`design-token-explorer` agent は Design.md §3 違反 (hex 直書き / 許容外 Tailwind パレット / ブランド色 hex 直書き) を自動検出する。

---

## ライセンス

- `.claude/skills/<name>/LICENSE.txt` — 各 skill のライセンス (Anthropic)
- `.claude/plugins/<name>/LICENSE` または `.claude/plugins/LICENSE` — plugins のライセンス (Anthropic)
- 独自 agents / commands / README は本リポジトリのライセンスに従う
