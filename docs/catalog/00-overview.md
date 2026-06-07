# デザインシステム概要 (Overview)

> Design.md 準拠 | 一次資料: [`Design.md`](../../Design.md), [`docs/design-system.md`](../design-system.md), [`Personas.md`](../../Personas.md)

このページは tech-event のデザインシステム全体観を 1 ページで掴むためのサマリです。詳細は各リンク先へ。

---

## 0. 4 媒体役割分担マトリクス (最重要)

> 2026-06-07 更新: catalog の MD (テキスト) と Storybook MDX (実物プレビュー込み) を **同一情報源** として明確に区別。MDX は MD を読み込んで Canvas embed を加えた **視覚層**、MD は **言語化の source of truth**。

| 媒体 | 役割 (1 行) | 何を書くか | 例 |
| --- | --- | --- | --- |
| `docs/design-system.md` (規範・正典 / What) | トークン仕様・全コンポーネントの正典 | トークン値・命名規約・全 props 表・全 variant 表 (機械的事実) | "EventStatusBadge の status は 8 種"、"`--color-brand-orange: #c2410c`" |
| **`docs/catalog/*.md` (テキスト source of truth / When)** | 言語化された使い分けガイド (Markdown ソース) | いつ使う / いつ使わない / Do's & Don'ts / 関連 / 対象ペルソナ。**ここを編集すれば catalog 全体が更新される** | "open は 募集中、full は補欠登録に誘導する"、"破壊的アクションは destructive variant" |
| **Storybook MDX (catalog テキスト + 実物統合 / Why visually + Live preview)** | catalog MD の言語化テキスト + 実物 component の Canvas を 1 ページに統合した shadcn/ui スタイルの視覚層 | `<Meta of={Stories} name="Docs" />` + `<Canvas of={...}>` + Controls + 元 MD 全文 | `libs/shared/ui/src/button.docs.mdx` が `docs/catalog/ui/button.md` を取り込み、Button の全 variant を live render |
| Storybook Story (variant 単体 / How) | 各 variant × state の生きた最小実例 | argTypes・interaction・1 variant 1 story | "Button × Default"、"Button × Destructive" 単体 |

### ルール (2026-06-07 改訂)

1. **言語化テキストの編集は `docs/catalog/{ui,components,blocks,foundations}/{name}.md` のみ**。MDX は自動同期される視覚層
2. **MDX (`{name}.docs.mdx`) の編集は Canvas 追加 / Controls 配置の変更のみ**。テキストは MD 由来
3. **コードサンプルは Story が唯一の出典** — catalog MD には埋め込まず Story link のみ
4. **トークン値は `docs/design-system.md` が唯一の出典** — catalog MD には値を書かず参照 link のみ
5. **Props 表 / Variant 表は TS 型・cva 設定から自動生成** (将来) — 現状は手書き、`<!-- AUTO-GENERATED START/END -->` で区画化済み
6. **判断基準 (いつ使う / 使わない / Don'ts) は catalog MD が唯一の出典** — Storybook MDX は同内容を Live Preview 付きで見せるだけ
7. **ペルソナ (`Personas.md` の P1–P9) 参照は catalog blocks/components が一次** — 各コンポーネントは「対象ペルソナ」セクションで明示

### 同期スクリプト

- `scripts/gen-catalog-mdx.mjs` — `.md` 内容を取り込んで `.docs.mdx` を生成 / 更新
- `scripts/sync-catalog-mdx.mjs` — MD と MDX の見出し乖離をチェック (CI で警告)
  - `--fix` で MDX を MD に追従させて再生成

### 守らないとどうなるか

- DS リファクタ時に同じ情報を 4 箇所更新する羽目になる
- ドキュメント間で値がズレた状態が放置される (半年で必ず発生)
- 「どこを信じればいいか」が新規メンバーに伝わらず、catalog 自体の信頼が落ちる
- MDX で実物 preview がない → 言語化と実装の乖離検知が遅れる

---

## 1. 設計哲学 (Design.md §1 から)

### 1.1 「connpass + Luma の中間」
- **情報密度は connpass 寄り**: 1 行に必要十分な情報 (タイトル / グループ / 日時 / 会場 / 参加者数) を載せる
- **質感は Luma 寄り**: ガラス感・微細アニメ・淡い影で「触れる感」を残す
- **派手なデコは禁止**: tintColor は 1 色 / グラデは max 2 stop / 影は subtle

### 1.2 機能 > 装飾
- 「何を、いつ、どこで、誰と」を 1 秒で把握できることが最優先
- アニメは status 変化を伝えるためのみ。ループ装飾アニメは禁止 (skeleton pulse は例外)
- イラスト / 絵文字は CTA / 空状態のみ

### 1.3 アクセシビリティは前提
- WCAG **AA 必須**、可能なら AAA
- 色のみに依存する情報伝達は禁止 (必ずテキスト併記)
- `:focus-visible` で常時可視のフォーカスリング (`outline 2px brand-orange offset 2px`)
- `prefers-reduced-motion` で全アニメ無効化、`prefers-contrast: more` で high-contrast 自動切替

---

## 2. ブランド (Design.md §2)

| 軸 | 値 |
|---|---|
| Primary | `#c2410c` (orange) — プライマリ CTA |
| Secondary | `#d23a3a` (red) — 登録 CTA / 強調 |
| Link | `#005d8c` (blue) |
| Tone | 親しみやすく / 端正 / 信頼感 |
| Voice (ja) | 「です・ます」中心 |
| Voice (en) | friendly + concise |
| Logo | テキストロゴ `tech-event` (Noto Sans JP Bold) — アイコン化禁止 |

ブランド色は **必ずトークン経由** (`bg-brand-orange` 等) で参照。`#c2410c` をコードに直書きしない。

詳細: [`foundations/colors.md`](./foundations/colors.md)

---

## 3. 3 層トークン (Design.md §3)

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

| 用途 | クラス |
|---|---|
| ページ背景 | `bg-background` |
| カード面 | `bg-surface` |
| 補助面 | `bg-surface-muted` |
| 本文 | `text-foreground` |
| 補助テキスト | `text-muted-foreground` |
| プレースホルダ | `text-muted` |
| 区切り線 | `border-border` |
| プライマリ CTA | `bg-brand-orange hover:bg-brand-orange-hover` |
| 強調 CTA | `bg-brand-red hover:bg-brand-red-hover` |
| リンク | `text-link hover:text-link-hover hover:underline` |
| ステータス open | `bg-status-open-bg text-status-open-fg` (8 種) |

詳細: [`docs/design-system.md` §2](../design-system.md#2-カラー)

---

## 4. タイポグラフィ (Design.md §4)

- **フォント**: Noto Sans JP (weight 400 / 500 / 600 / 700)
- **スケール**: 12 / 14 / 16 / 18 / 22 / 28 / 36 / 48 px
- **見出し**: h1=28/700, h2=22/700, h3=18/600, h4=16/600
- **本文**: 14px / 400 / line-height 1.7
- **メタ**: 12px / 500

### 5 原則
1. ライン長 65-90 文字 (`max-w-prose`)
2. 行間 本文 1.7 / 見出し 1.2
3. ハイフネーション禁止 (日本語)
4. `word-break: keep-all` + `overflow-wrap: anywhere`
5. 数字は 3 桁区切り (`Intl.NumberFormat`)

詳細: [`foundations/typography.md`](./foundations/typography.md)

---

## 5. レイアウト (Design.md §5)

- コンテナ max-w **1280px**
- 主要ページは **メイン + 右サイド** 2 カラム (lg 以上、2:1〜3:1)
- スペーシング: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px のみ (任意値禁止)

詳細: [`foundations/spacing.md`](./foundations/spacing.md), [`foundations/responsive.md`](./foundations/responsive.md)

---

## 6. コンポーネント原則 (Design.md §6)

### 6.1 コンポーネント階層 (shadcn/ui スタイル)
| カテゴリ | 場所 | 例 |
|---|---|---|
| ui | `libs/shared/ui/` (24) | Button / Input / Badge / Card / Dialog (Radix UI + CVA primitives) |
| components | `libs/shared/ui-composite/` (23) | Header / EventListRow / ShareModal / TagPill / EventStatusBadge |
| blocks | `docs/catalog/blocks/` (10) | event-status-orchestration / cta-matrix / host-vs-participant-ui (構成パターン) |
| foundations | `src/styles/tokens.css` 他 (10) | colors / typography / spacing / motion (デザイン言語) |
| Page | `apps/web/src/app/**/page.tsx` | 各画面 |

### 6.2 設計原則
- props 公開 API を破壊変更しない (refactor 時)
- 全コンポーネントに Storybook story (variant + state 100%)
- 内部実装は **Radix UI primitive + CVA**
- カスタム CSS 禁止 (Tailwind utility のみ)
- `data-testid` は kebab-case

### 6.3 状態 (全コンポーネント共通)
default / hover / focus-visible / active / disabled / loading / empty / error

詳細: [`foundations/states.md`](./foundations/states.md)

---

## 7. テーマ (Design.md §7)

light / dark / high-contrast の 3 テーマすべてで:
- WCAG AA 必須 (high-contrast は AAA 7:1+)
- `data-theme` 属性 + `ThemeProvider` で切替
- `localStorage["tech-event:theme"]` で永続化
- `prefers-color-scheme` / `prefers-contrast` 検知

`bg-white` / `bg-zinc-100` などハードコード禁止 → 必ず `bg-surface` / `bg-surface-muted`。

詳細: [`foundations/theming.md`](./foundations/theming.md)

---

## 8. モーション (Design.md §8)

| Token | 値 | 用途 |
|---|---|---|
| instant | 0 | reduced-motion フォールバック |
| fast | 150ms | button hover / focus / link underline |
| normal | 200ms | card hover (lift + shadow) |
| slow | 300ms | dialog open / sheet slide |
| slower | 500ms | page transition (ほぼ未使用) |

Easing: `ease-out` (開く) / `ease-in` (閉じる) / `ease-in-out` (同質) / `ease-spring` (微弾み)。

詳細: [`foundations/motion.md`](./foundations/motion.md)

---

## 9. アイコン (Design.md §9)

- ライブラリ: **lucide-react** 一本化
- ストローク: 1.5
- サイズ: 14 / 16 / 20 / 24 px (`h-3.5 w-3.5` 〜 `h-6 w-6`)
- 機能の意味補強用 (装飾はしない)

詳細: [`foundations/iconography.md`](./foundations/iconography.md), [`docs/icons.md`](../icons.md)

---

## 10. 状態表現の規約 (Design.md §10)

### 10.1 ステータスバッジ (8 種)
open / full / waitlist / closed / cancelled / ended / upcoming / ongoing

色だけでなく **必ずテキストラベル併記**。

### 10.2 CTA ラベル (4 種統一)
- 参加申込 / Register
- 補欠登録 / Join Waitlist
- 抽選に申し込む / Apply for Lottery
- 参加リクエストを送信 / Request to Join

混在禁止 (「参加する」「申込む」等を独自に増やさない)。

---

## 11. 守るべきルール Top 10 (Design.md §14 から)

1. 直接 hex を書かない → トークン経由
2. WCAG AA 違反を main に入れない → axe-core CI で阻止
3. props 公開 API を破壊変更しない
4. `bg-white` / `bg-zinc-*` 等のハードコード禁止 → `bg-surface` 系
5. status は色だけで表現しない → ラベル併記
6. アニメは情報伝達目的のみ → ループ装飾禁止
7. CTA ラベルは 4 種に統一
8. Storybook stories で全 variant + state をカバー → VRT で守る
9. アイコンは lucide-react、サイズ 14/16/20/24 → 任意 SVG 禁止
10. 新トークン追加時はコントラスト比を併記 → `docs/design-system.md` のテーブルに登録

---

## 12. このカタログの位置付け

- **トップ規範**: [`Design.md`](../../Design.md) — 11 章で規範を定義
- **詳細仕様**: [`docs/design-system.md`](../design-system.md) — トークン値・コンポーネント API
- **言語化ガイド**: 本カタログ — 「いつ何をどう使うか」「アンチパターン」を言語化
- **視覚カタログ**: Storybook — variant / state の見え方

4 つは相互補完。新規実装時は 4 つすべてを参照する。
