# tech-event Design System Changelog

最終更新: 2026-06-05

本ドキュメントは **デザインシステム単体** のバージョン履歴である。アプリ側 (`CHANGELOG.md`) とは別に、
DS の **API / トークン / ドキュメント** 変更だけを追跡する。

> 関連: [`docs/design-system.md`](./design-system.md) (一次資料) / [`docs/component-api-status.md`](./component-api-status.md) /
> [`docs/design-system-audit.md`](./design-system-audit.md) / `CHANGELOG.md` (アプリ全体)

形式は [Keep a Changelog](https://keepachangelog.com/) に準拠。
バージョニングは Semantic Versioning (DS の major は API 破壊変更を意味する)。

---

## [1.0.0] — 2026-06-05 — Design System 完全版

### Added

- **VRT (Visual Regression Test) スイート** — `e2e/vrt-stories.spec.ts` で全 190 story を網羅。
  Playwright `toHaveScreenshot()` + `screenshots/stories/*.png` raw 保存。warn only モード。
- **Component API 成熟度表** — `docs/component-api-status.md` + Storybook MDX
  `src/stories/design-system/ComponentStatus.mdx`。39 component の stable / beta 分類。
- **DS Changelog** (本ファイル) — v0.1.0 から v1.0.0 までの DS 単体履歴。
- **Storybook 公開 URL** — `https://<owner>.github.io/<repo>/` を `.github/workflows/storybook.yml`
  で自動デプロイ。`managerHead` で `<title>tech-event Design System — Storybook</title>` を設定。
- **`pnpm vrt` / `pnpm vrt:update`** — package.json scripts。
- **`scripts/build-storybook-static.sh`** — ローカル静的 export + preview。
- **`docs/release-criteria.md`** — DS リリース判定基準 (audit から分離)。
- **拡張アイコン 20 種** — `Icons.mdx` に Domain extra カテゴリを追加 (合計 50 + 20 = 70)。

### Changed

- `docs/design-system-audit.md` — 完成度 91 % → **100 %**、業界標準比較を update
  (Polaris / Material 3 / shadcn / Atlassian)、「100 % 達成宣言」セクション追加。
- `README.md` — Design System セクションで完成度 91 % → **100 %**、公開 Storybook URL 追加。
- `.github/workflows/ci.yml` — a11y ジョブを独立化、axe レポート (`_axe*.json`) を artifact 保存。

### Fixed

- Pagination の `aria-prohibited-attr` 解消 (旧 audit § 2 / item 15)。
- `/` トップの `text-muted` コントラスト違反 1 件を `text-muted-foreground` に移行 (旧 audit § 2 / item 16)。

---

## [0.7.0] — 2026-06-04 — Storybook v10 + 3 階層トークン

### Added

- 3 階層トークン (primitive → semantic → theme) を `src/styles/{tokens,semantic,themes/*}.css` に分離。
- Storybook v10 + `@storybook/addon-a11y` + `@storybook/addon-vitest` + `@storybook/addon-mcp`。
- MDX 11 本 (Welcome + Design System: Introduction / Tokens / Colors / Typography / Spacing /
  Radius / Icons / Components / Accessibility / Dark Mode / Component Checklist)。
- ライト/ダーク切替 (`<html data-theme="dark">` + `ThemeProvider`) + localStorage 永続化。
- `docs/design-system.md` 一次資料 22K 行 / `docs/design-system-audit.md` / `docs/icons.md` /
  `docs/component-taxonomy.md` / `docs/motion.md`。
- 視覚比較 spec `e2e/visual-compare-dark.spec.ts` + ダークモード a11y `e2e/a11y-dark.spec.ts` /
  ハイコントラスト `e2e/high-contrast.spec.ts`。
- Motion トークン (`--duration-fast/std/slow`, `--ease-standard/accel/decel`) + `Motion.mdx`。

### Changed

- UI primitives を 21 個まで拡充 (shadcn ベース)。
- Composite components を 18 個 (Molecule 5 + Organism 13)。
- アイコンを `lucide-react` 50 種に絞り込み、strokeWidth 1.5 / 14·16·20·24 px に統一。

---

## [0.6.0] — 2026-06-03 — トークン JSON 出力 + 検証

### Added

- `scripts/sync-tokens.ts` / `scripts/validate-tokens.ts` — CSS ↔ JSON 双方向検証。
- `tokens/{primitive,motion,semantic.light,semantic.dark}.json` — Figma Tokens Studio 互換。
- `.github/workflows/tokens.yml` — JSON / CSS 同期を CI 強制。
- `Tokens.mdx` で primitive / semantic / theme の説明を体系化。

### Changed

- semantic.css の命名規則を `--radius-control` / `--radius-card` に統一。

---

## [0.5.0] — 2026-06-03 — Composite 整備 (Luma 由来含む)

### Added

- `EventStickyCTA` (10 状態) / `ShareModal` (5 タブ) / `HostAvatarStack` (Tooltip 統合) /
  `MiniCalendar` / `EventTimeline` (月見出しグルーピング)。
- `EventStatusBadge` を 8 状態 × 4 visual = 32 variant に拡張。
- `MarkdownEditor` (2 カラム WYSIWYG + ライブプレビュー)。

### Changed

- `GroupCard` を standard / sidebar / compact の 3 variant に再設計。
- `EventCard` を list / grid 2 variant + `EventCardCompact` ラッパー。

---

## [0.4.0] — 2026-06-02 — A11y 強化 + ダークモード

### Added

- ダークモード (`themes/dark.css`) + `ThemeProvider`。
- `e2e/a11y-pages.spec.ts` / `e2e/components-a11y.spec.ts` (axe-core)。
- `prefers-reduced-motion` 対応 (`globals.css`)。
- グローバル `focus-visible` outline。

### Changed

- 全 primitive を Radix UI 上に整理し、a11y を Radix 標準に委譲。

---

## [0.3.0] — 2026-06-02 — Primitive 完備 (shadcn 21 個)

### Added

- 21 primitive (Avatar / Badge / Button / Card / Checkbox / Dialog / DropdownMenu / Form /
  Input / Label / Popover / RadioGroup / Select / Separator / Sheet / Skeleton / Switch /
  Tabs / Textarea / Toast / Tooltip)。
- 各 primitive に `.stories.tsx` を追加 (21 stories file)。
- cva (`class-variance-authority`) で variant 設計を統一。

---

## [0.2.0] — 2026-06-01 — トークン基盤

### Added

- Tailwind CSS v4 設定。
- `src/styles/tokens.css` (primitive: 色スケール / spacing / radius / shadow / z-index)。
- ベースタイポグラフィスケール (`globals.css`)。

---

## [0.1.0] — 2026-06-01 — DS 骨格

### Added

- Storybook 初期セットアップ。
- DS 用ディレクトリ規約 (`src/components/ui/` = primitive, `src/components/` = composite)。

---

## DS バージョン ↔ アプリバージョン 対応表

| DS Version | App Version (CHANGELOG.md) | 日付 | 主要トピック |
| :--: | :--: | :--: | --- |
| **v1.0.0** | v0.8.0 + post-polish | 2026-06-05 | VRT / API status / 公開 URL / 100 % 達成 |
| v0.7.0 | v0.7.0 | 2026-06-04 | Storybook v10 / 3 階層トークン / 21 + 18 component / MDX 11 本 |
| v0.6.0 | v0.7.0 | 2026-06-03 | トークン JSON 出力 / tokens.yml CI |
| v0.5.0 | v0.6.0 | 2026-06-03 | Composite 整備 (Luma 由来含む) |
| v0.4.0 | v0.4.0 - v0.5.0 | 2026-06-02 | A11y / ダークモード |
| v0.3.0 | v0.3.0 | 2026-06-02 | Primitive 21 個完備 (shadcn) |
| v0.2.0 | v0.2.0 | 2026-06-01 | トークン基盤 (Tailwind v4) |
| v0.1.0 | v0.1.0 | 2026-06-01 | DS 骨格 / Storybook |

### バージョニング規約

- **DS major (X.0.0)** — primitive / composite の **公開 props 破壊変更**、または
  トークン名 (`--*`) のリネーム / 削除を含む変更。
- **DS minor (x.Y.0)** — 新規 component 追加、新規トークン追加、ドキュメント大幅拡充。
- **DS patch (x.y.Z)** — バグ修正、内部リファクタ、a11y 改善 (public API 変更なし)。

---

## 凡例

- **Added**: 新規 component / トークン / ドキュメント
- **Changed**: 既存 API / 挙動の変更
- **Fixed**: バグ修正 (API 変更なし)
- **Removed**: 廃止 (DS major のみ)
- **Deprecated**: 次 major で削除予定 (移行ガイドを併記)
