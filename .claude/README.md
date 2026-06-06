# `.claude/` — tech-event 用 Claude Code 設定

このディレクトリは tech-event プロジェクトでの Claude Code 作業を効率化するための skills / plugins / agents / commands を一式まとめたもの。

公式 (`anthropics/skills`, `anthropics/claude-plugins-official`) から輸入したものと、本プロジェクト固有に書き下ろしたものを併用する。

---

## 構造

```
.claude/
  settings.local.json           — プロジェクト共有の permission allowlist (commit 対象)
  README.md                     — このファイル
  agents/                       — 独自 project agent (5本)
    nx-affected.md
    prisma-migrator.md
    storybook-story-generator.md
    e2e-stabilizer.md
    feature-lib-extractor.md
  commands/                     — 独自スラッシュコマンド (4本)
    test.md                     — /test
    review.md                   — /review
    seed.md                     — /seed
    nx-graph.md                 — /nx-graph
  skills/                       — 公式 skills (5本)
    frontend-design/
    webapp-testing/
    theme-factory/
    skill-creator/
    mcp-builder/
  plugins/                      — 公式 plugins (8本)
    code-review/
    pr-review-toolkit/
    commit-commands/
    feature-dev/
    claude-md-management/
    code-simplifier/
    typescript-lsp/
    session-report/
```

---

## 公式 skills (5本)

`anthropics/skills` から輸入。LICENSE.txt はそれぞれの skill 直下に同梱。

| name | このプロジェクトでの用途 |
|------|------------------------|
| `frontend-design` | デザインシステム (CLAUDE.md §4) と整合する UI / page 構築。Atom → Composite → Page 階層と Tailwind v4 + CVA primitives を尊重。 |
| `webapp-testing` | Playwright pattern。`/test` コマンド・`e2e-stabilizer` agent と組み合わせて使う。 |
| `theme-factory` | light / dark / high-contrast テーマの追加・微調整 (CLAUDE.md §4.1)。 |
| `skill-creator` | 今後 tech-event 固有の skill を増やすときに使うメタ skill。 |
| `mcp-builder` | 自前 MCP server (例: Prisma 経由でイベント検索する MCP) を立てる時。 |

---

## 公式 plugins (8本)

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

---

## 独自 agents (5本)

`/agents/` 配下。CLAUDE.md の不変原則 (削除禁止 / 完璧主義ループ / リサーチファースト) に従う形で書かれている。

| agent | 起動契機 |
|-------|---------|
| `nx-affected` | PR 提出前のセルフチェック、CI 時間最小化 |
| `prisma-migrator` | `prisma/schema.prisma` 編集直後 (SQLite ↔ PostgreSQL 両 schema を同期) |
| `storybook-story-generator` | 新規コンポーネント追加直後 (variant × state 100% カバー、VRT + a11y) |
| `e2e-stabilizer` | E2E が断続的に失敗 (`waitForTimeout` 撲滅、locator-based 化) |
| `feature-lib-extractor` | apps/web から `libs/web/feature-*` へ機能を切り出すワークフロー |

起動方法 (Claude Code 内):
```
agent run nx-affected
agent run prisma-migrator
...
```
もしくは会話で「nx-affected 走らせて」と指示するだけでも認識される。

---

## 独自 commands (4本)

`/commands/` 配下。チャットで `/<name>` で実行。

| command | 概要 |
|---------|------|
| `/test` | chromium-desktop + chromium-mobile で E2E を並列実行 (-j 2) |
| `/review` | tech-event 4 観点 PR review (security / data-model / code-quality / ux-a11y) |
| `/seed` | dev.db を baseline から作り直し + test_user 投入 + recalc |
| `/nx-graph` | `pnpm nx graph` で依存図を JSON 化し被依存数ランキングを表示 |

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
| Prisma schema を変更した | 会話で「prisma-migrator で migration 作って」 |
| 新規コンポーネントを追加した | 会話で「storybook-story-generator で story 生成」 |
| E2E が flaky | 会話で「e2e-stabilizer で安定化」 |
| feature を libs に切り出したい | 会話で「feature-lib-extractor で <feature> を抽出」 |
| PR 前の自己チェック | 会話で「nx-affected で affected を全部回して」 |
| 公式 skill / plugin を使いたい | 会話で skill / plugin 名を呼ぶ (例: 「frontend-design に従って...」) |

---

## tech-event 固有のカスタマイズ箇所

1. `.claude/agents/prisma-migrator.md` — SQLite (dev) と PostgreSQL (prod) の 2 schema 体制に対応
2. `.claude/agents/feature-lib-extractor.md` — Nx monorepo の libs/shared / libs/web tag 体系を前提
3. `.claude/agents/e2e-stabilizer.md` — `global-setup.ts` の baseline コピー方式を尊重 (削除しない)
4. `.claude/commands/review.md` — CLAUDE.md §1, §6, §7 を判定軸として明示
5. `.claude/commands/seed.md` — `prisma/seed-test-user.ts` を含む 2 段 seed
6. `.claude/settings.local.json` — `pnpm nx`, `npx prisma`, `npx playwright` を allowlist

---

## ライセンス

- `.claude/skills/<name>/LICENSE.txt` — 各 skill のライセンス (Anthropic)
- `.claude/plugins/<name>/LICENSE` または `.claude/plugins/LICENSE` — plugins のライセンス (Anthropic)
- 独自 agents / commands / README は本リポジトリのライセンスに従う
