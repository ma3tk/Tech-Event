# Design.md — tech-event のビジュアルデザイン規範

このファイルは tech-event のビジュアル / インタラクションを規定するトップレベルの規範です。
コード品質規範は [`CLAUDE.md`](./CLAUDE.md)、詳細実装は [`docs/design-system.md`](./docs/design-system.md) を参照。

`.claude/skills/`, `.claude/agents/`, `.claude/commands/` のすべてのビジュアル系作業はこの規範に従うこと。

---

## 1. 設計哲学

### 1.1 「connpass + Luma の中間」
- **情報密度は connpass 寄り**: 1 行に必要十分な情報を載せる (タイトル / グループ / 日時 / 会場 / 参加者数)
- **質感は Luma 寄り**: フラット過ぎず、ガラス感・グラデ・微細アニメーションで「触れる感」を残す
- ただし **派手なデコレーションは禁止**: tintColor は 1 色まで、グラデは max 2 stop、影は subtle

### 1.2 機能 > 装飾
- ユーザーが「何を、いつ、どこで、誰と」を 1 秒で把握できることが最優先
- アニメーションは status 変化を伝えるためのみ。ループする装飾アニメ禁止
- イラスト・絵文字は CTA / 空状態に絞る

### 1.3 アクセシビリティは前提
- WCAG **AA 必須**、可能なら AAA
- 色のみに依存する情報伝達禁止 (常にテキスト併記)
- フォーカスリングは常に可視 (`:focus-visible` + `outline 2px brand-orange offset 2px`)
- `prefers-reduced-motion` で全アニメ無効化
- `prefers-contrast: more` で high-contrast theme に自動切替

---

## 2. ブランド

| 軸 | 値 |
|---|---|
| Primary brand color | **`#c2410c`** (orange、connpass 系を AA 対応に明度調整) |
| Secondary brand color | **`#d23a3a`** (red、登録 CTA / 強調アクション) |
| Link color | **`#005d8c`** (blue) |
| Tone | 親しみやすく / 端正 / 信頼感 |
| Voice | 日本語: 「です・ます」中心、英語: friendly + concise |
| Logo | テキストロゴ `tech-event` (Noto Sans JP Bold)。アイコン化は禁止 |

ブランド色を**直接 hex で書かない**。必ずトークン経由 (`--brand-orange`、`text-brand-orange` 等)。

---

## 3. トークン

3 層構造で管理:

```
Primitive (raw scales)
  └─ src/styles/tokens.css
       gray/orange/red/green/blue/yellow scale (50-950)
       typography, spacing, radius, shadow, motion, z-index, border-width
            ↓
Semantic (alias)
  └─ src/styles/semantic.css
       background / surface / foreground / muted / border / link / status
            ↓
Theme (mapping)
  └─ src/styles/themes/{light,dark,high-contrast}.css
```

トークン仕様 / 完全一覧は `docs/design-system.md` §2-§7。
JSON 出力: `tokens/*.json` (Figma Tokens Studio 互換)。`pnpm tokens` で CSS ↔ JSON 同期。

### コアトークン早見

| 用途 | クラス |
|---|---|
| ページ背景 | `bg-background` |
| カード面 | `bg-surface` |
| 補助面 | `bg-surface-muted` |
| 本文 | `text-foreground` |
| 補助テキスト | `text-muted-foreground` |
| プレースホルダ | `text-muted` |
| 区切り線 | `border-border` |
| 強区切り | `border-border-strong` |
| プライマリ CTA | `bg-brand-orange hover:bg-brand-orange-hover text-brand-foreground` |
| 強調 CTA (登録系) | `bg-brand-red hover:bg-brand-red-hover` |
| リンク | `text-link hover:text-link-hover hover:underline` |
| ステータス open | `bg-status-open-bg text-status-open-fg` (他に full/waitlist/closed/cancelled/ended/upcoming/ongoing 計 8 種) |

直接 hex / 任意の Tailwind パレット (`bg-zinc-100` 等) を書かない。トークンで足りなければ追加すること。

---

## 4. タイポグラフィ

- **フォント**: Noto Sans JP (Google Fonts、weight 400/500/600/700)、英数字も同フォントで統一
- **スケール**: `--font-size-xs..4xl` (12, 14, 16, 18, 22, 28, 36, 48 px)
- **見出し**: h1=28px/700、h2=22px/700、h3=18px/600、h4=16px/600
- **本文**: 14px/400/line-height 1.7
- **メタ情報**: 12px/500
- 全部 `src/styles/semantic.css` の `--typography-*` で抽象化

### 5 原則
1. **ライン長**: 本文は 1 行 65-90 文字 (`max-w-prose`)
2. **行間**: 本文 1.7、見出し 1.2
3. **ハイフネーション禁止** (日本語特有)
4. **改行位置**: `word-break: keep-all` + `overflow-wrap: anywhere`
5. **数字**: 3桁区切り (`Intl.NumberFormat`)、locale 動的

---

## 5. レイアウト

### 5.1 グリッド
- コンテナ max-w: **1280px** (`--container-max-w`)
- 主要ページは **メイン + 右サイド** 2 カラム (lg 以上、メイン:right = 2:1 〜 3:1)
- モバイルは 1 カラム

### 5.2 スペーシング
4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px のスケール。`gap-2 / gap-4 / gap-6 / gap-8` を多用。
任意の `gap-[13px]` 禁止。

### 5.3 セクション
- セクション間 `mt-12 mb-8` (デスクトップ) / `mt-8 mb-6` (モバイル)
- セクション見出しは h2 (22px)、左上に小さなアイコン (16px) を添える

### 5.4 イベントカード行 (EventListRow) 厳格仕様
1 行 ~88-96px。左から:
1. サムネ 80x60 (16:9 を内包) — 無ければ brand-orange グラデ + Calendar アイコン
2. ステータスバッジ + (タグピル + グループ名)
3. タイトル (15-16px / bold) — `line-clamp-2`
4. 日付 + 会場 (12px / muted)
5. 右端: 参加者 N/M + 「参加」(縦積み、自前 nowrap)

connpass を踏襲し、Luma 並みの余白は取らない。

---

## 6. コンポーネント原則

### 6.1 Atomic 階層
| 階層 | 場所 | 例 |
|---|---|---|
| Atom | `libs/shared/ui/` | Button / Input / Badge / Avatar / Card / Dialog |
| Molecule | `libs/shared/ui-composite/` | TagPill / Breadcrumb / EventStatusBadge |
| Organism | `libs/shared/ui-composite/` | Header / EventListRow / ShareModal |
| Template | `apps/(showcase)/components/` | `/components` showcase |
| Page | `apps/web/src/app/**/page.tsx` | 各画面 |

### 6.2 設計原則
- **propsの公開APIは変えない** (refactor 時) — 互換性で破壊しない
- 全コンポーネントに対応する **Storybook story** (variant + state 100% カバー)
- 内部実装は **Radix UI primitive + CVA** で variant 管理
- カスタムCSSは禁止 (Tailwind utility で完結)
- `data-testid` を主要要素に付与 (CamelCase でなく kebab-case)

### 6.3 状態
コンポーネントが取り得る状態:
- default / hover / focus-visible / active / disabled / loading / empty / error
全状態を Storybook story で表現する。

---

## 7. テーマ (light / dark / high-contrast)

3 テーマ全てで:
- WCAG AA を必ず満たす (high-contrast は AAA 7:1+)
- `data-theme` 属性 + `ThemeProvider` で切替
- `localStorage["tech-event:theme"]` で永続化
- `prefers-color-scheme` / `prefers-contrast` を検知

dark mode で `bg-white` `bg-zinc-100` などのハードコード禁止 → 必ず `bg-surface` / `bg-surface-muted` を使う。

---

## 8. モーション

| Token | 値 | 用途 |
|---|---|---|
| `--duration-instant` | 0 | reduced-motion 時のフォールバック |
| `--duration-fast` | 150ms | button hover / focus / link underline |
| `--duration-normal` | 200ms | card hover (lift + shadow) |
| `--duration-slow` | 300ms | dialog open / sheet slide |
| `--duration-slower` | 500ms | page transition (ほぼ使わない) |

| Easing | 用途 |
|---|---|
| `ease-out` | 開く・現れる |
| `ease-in` | 閉じる・消える |
| `ease-in-out` | 同質変化 |
| `ease-spring` | 微小な弾み (アバター stack の hover 等) |

ループする装飾アニメ禁止 (skeleton の pulse は例外、それでも `prefers-reduced-motion` で停止)。

---

## 9. アイコン

- ライブラリ: **lucide-react** 一本化
- ストローク: 1.5
- サイズ: 14 / 16 / 20 / 24 px
- アイコンは **機能の意味補強** に使う (装飾はしない)
- 機能的アイコンには aria-hidden を付け、近接テキストで読み上げを担保
- 装飾的アイコンは aria-hidden + sr-only ラベル

許可されたアイコン一覧は `docs/icons.md`。新規導入は要レビュー。

---

## 10. 状態表現の規約

### 10.1 ステータスバッジ (EventStatusBadge)
| status | 色 | ラベル (ja/en) |
|---|---|---|
| open | green | 募集中 / Open |
| full | red | 満員 / Full |
| waitlist | yellow | 補欠登録受付中 / Waitlist |
| closed | gray | 募集締切 / Closed |
| cancelled | dark-red | 中止 / Cancelled |
| ended | gray | 終了 / Ended |
| upcoming | blue | 開催前 / Upcoming |
| ongoing | orange | 開催中 / Ongoing |

色だけでなく **必ずテキストラベル併記**。

### 10.2 CTA ラベル (4種統一)
| 状況 | ラベル |
|---|---|
| open | 参加申込 / Register |
| full | 補欠登録 / Join Waitlist |
| lottery | 抽選に申し込む / Apply for Lottery |
| approval_required | 参加リクエストを送信 / Request to Join |

混在禁止 (「参加する」「申込む」等を独自に増やさない)。

---

## 11. 視覚比較・継続的検証

### 11.1 本家との比較
- 比較対象: connpass / Luma (`research/visual-diff-final-report.md`)
- 比較ツール: Playwright `e2e/visual-compare*.spec.ts` + `scripts/build-triptych.ts`
- 16 connpass pair + 13 Luma pair + 13 triptych
- 完成度を ★★★★★ で記録、四半期で更新

### 11.2 VRT (Visual Regression Testing)
- 全 Storybook story (203 stories) を `toHaveScreenshot()` で baseline 管理
- 主要ページの light/dark/high-contrast 全モードで baseline
- 変更時は `pnpm vrt:update`

### 11.3 a11y 自動チェック
- `@axe-core/playwright` で critical/serious = 0 を main で常時保証
- 全テーマ・全主要ページに対して走査
- 結果は `screenshots/components/_axe*.json` に保存

---

## 12. 関連スキル / エージェント

このファイルは以下から参照される:

### `.claude/skills/`
- `frontend-design` — UI 全般の設計
- `theme-factory` — テーマ生成・調整
- `brand-guidelines` — ブランド適用
- `canvas-design` — 視覚要素生成
- `web-artifacts-builder` — HTML/CSS/JS artifact

### `.claude/agents/`
- `visual-diff-reviewer` — 本家との視覚比較
- `design-token-explorer` — トークン体系の探索
- `storybook-curator` — story カバレッジ管理
- `component-screenshot-taker` — Playwright 経由のスクショ取得
- `figma-token-syncer` — Figma Tokens Studio との同期

### `.claude/commands/`
- `/vrt` — 全 story の VRT 再生成
- `/screenshot {url}` — 任意 URL のスクショ
- `/contrast {fg} {bg}` — WCAG コントラスト比

これら全エージェント・スキルは `Design.md` を**最初に読み**、ここの規約を遵守すること。

---

## 13. 参照ドキュメント

| ドキュメント | 内容 |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | コード品質・作業フロー規範 |
| [`docs/design-system.md`](./docs/design-system.md) | トークン詳細・全コンポーネント仕様 |
| [`docs/design-system-audit.md`](./docs/design-system-audit.md) | DS 100% 監査 |
| [`docs/design-system-changelog.md`](./docs/design-system-changelog.md) | DS バージョン管理 (v1.0.0+) |
| [`docs/component-taxonomy.md`](./docs/component-taxonomy.md) | Atomic 分類 |
| [`docs/component-api-status.md`](./docs/component-api-status.md) | API 成熟度 (stable/beta/alpha) |
| [`docs/motion.md`](./docs/motion.md) | モーション詳細規約 |
| [`docs/icons.md`](./docs/icons.md) | アイコン使い分けガイド |
| [`research/visual-diff-final-report.md`](./research/visual-diff-final-report.md) | 本家比較 |
| [`research/component-verification-report.md`](./research/component-verification-report.md) | コンポーネント検証 |
| [Storybook](./storybook-static/index.html) | live コンポーネントカタログ |
| `tokens/*.json` | Figma Tokens Studio 互換 |

---

## 14. 守るべきルール (Top 10、忘れたらここに戻る)

1. **直接 hex を書かない** → トークン経由
2. **WCAG AA 違反を main に入れない** → axe-core CI で阻止
3. **propsの公開APIは破壊変更しない** → refactor は内部のみ
4. **`bg-white`/`bg-zinc-*` 等のハードコード禁止** → `bg-surface`系
5. **status は色だけで表現しない** → ラベル併記
6. **アニメーションは情報伝達目的のみ** → ループ装飾禁止
7. **CTA ラベルは 4 種に統一** → 「参加申込/補欠登録/抽選に申し込む/参加リクエストを送信」
8. **Storybook stories で全 variant + state をカバー** → VRT で守る
9. **アイコンは lucide-react、サイズ 14/16/20/24** → 任意 SVG 禁止
10. **新トークン追加時は コントラスト比を必ず併記** → `docs/design-system.md` のテーブルに登録

これに違反するコードを書かないこと。違反したらリファクタを優先する。
