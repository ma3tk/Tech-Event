# デザインシステム概要 (Overview)

> Design.md 準拠 | 一次資料: [`Design.md`](../../Design.md), [`docs/design-system.md`](../design-system.md), [`Personas.md`](../../Personas.md)

このページは tech-event のデザインシステム全体観を 1 ページで掴むためのサマリです。詳細は各リンク先へ。

---

## 0. 4 媒体役割分担マトリクス (最重要)

> このマトリクスを冒頭に置く理由: tech-event のデザイン情報は 4 媒体に分散しているため、何をどこに書くかをルール化しないと **半年で同じ情報が 4 箇所に重複し、ズレた状態で放置される** ことが catalog review (`research/catalog-review.md`) で指摘された。新規ドキュメント追加・既存更新は **必ずこの表に照らして「どの媒体に書くべきか」を判断する**。

| 媒体 | 役割 (1 行) | 何を書くか | 例 |
| --- | --- | --- | --- |
| `docs/design-system.md` (規範本体 / What) | トークン仕様・全コンポーネントの正典 | トークン値・命名規約・全 props 表・全 variant 表 (機械的事実) | "EventStatusBadge の status は 8 種"、"`--color-brand-orange: #c2410c`" |
| `docs/catalog/*.md` (判断基準 / When) | 言語化された使い分けガイド | いつ使う / いつ使わない / Do's & Don'ts / 関連コンポーネント / 対象ペルソナ | "open は 募集中、full は補欠登録に誘導する"、"破壊的アクションは destructive variant" |
| Storybook MDX (視覚化 / Why visually) | コンセプト・初心者ガイド | DS 全体図・トークン使い方の視覚資料・ガイド文 | "DS 全体図"、"トークンの使い方マップ" |
| Storybook Story (実物 / How) | 全 variant × state の生きた実例 | argTypes・interaction・全 variant の同時表示 | "Button × 6 variants × 5 sizes" の matrix story |

### ルール

1. **コードサンプルは Story が唯一の出典** — catalog MD には埋め込まず Story link のみ (重複ゼロ)
2. **トークン値は `docs/design-system.md` が唯一の出典** — catalog MD には値を書かず参照 link のみ
3. **Props 表 / Variant 表は TS 型・cva 設定から自動生成** — 手書き禁止 (将来 `react-docgen` 連携。現状は手書きだが `<!-- AUTO-GENERATED START/END -->` で区画化済み)
4. **判断基準 (いつ使う / 使わない / Don'ts) は catalog MD が唯一の出典** — Storybook MDX / Story には書かない
5. **ペルソナ (`Personas.md` の P1–P9) 参照は catalog patterns/organisms が一次** — 各コンポーネントは「対象ペルソナ」セクションで明示

### 守らないとどうなるか

- DS リファクタ時に同じ情報を 4 箇所更新する羽目になる
- ドキュメント間で値がズレた状態が放置される (半年で必ず発生)
- 「どこを信じればいいか」が新規メンバーに伝わらず、catalog 自体の信頼が落ちる

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

詳細: [`05-foundations/colors.md`](./05-foundations/colors.md)

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

詳細: [`05-foundations/typography.md`](./05-foundations/typography.md)

---

## 5. レイアウト (Design.md §5)

- コンテナ max-w **1280px**
- 主要ページは **メイン + 右サイド** 2 カラム (lg 以上、2:1〜3:1)
- スペーシング: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px のみ (任意値禁止)

詳細: [`05-foundations/spacing.md`](./05-foundations/spacing.md), [`05-foundations/responsive.md`](./05-foundations/responsive.md)

---

## 6. コンポーネント原則 (Design.md §6)

### 6.1 Atomic 階層
| 階層 | 場所 | 例 |
|---|---|---|
| Atom | `libs/shared/ui/` (21) | Button / Input / Badge / Card / Dialog |
| Molecule | `libs/shared/ui-composite/` | TagPill / Breadcrumb / EventStatusBadge |
| Organism | `libs/shared/ui-composite/` | Header / EventListRow / ShareModal |
| Template | `apps/(showcase)/components/` | `/components` showcase |
| Page | `apps/web/src/app/**/page.tsx` | 各画面 |

### 6.2 設計原則
- props 公開 API を破壊変更しない (refactor 時)
- 全コンポーネントに Storybook story (variant + state 100%)
- 内部実装は **Radix UI primitive + CVA**
- カスタム CSS 禁止 (Tailwind utility のみ)
- `data-testid` は kebab-case

### 6.3 状態 (全コンポーネント共通)
default / hover / focus-visible / active / disabled / loading / empty / error

詳細: [`05-foundations/states.md`](./05-foundations/states.md)

---

## 7. テーマ (Design.md §7)

light / dark / high-contrast の 3 テーマすべてで:
- WCAG AA 必須 (high-contrast は AAA 7:1+)
- `data-theme` 属性 + `ThemeProvider` で切替
- `localStorage["tech-event:theme"]` で永続化
- `prefers-color-scheme` / `prefers-contrast` 検知

`bg-white` / `bg-zinc-100` などハードコード禁止 → 必ず `bg-surface` / `bg-surface-muted`。

詳細: [`05-foundations/theming.md`](./05-foundations/theming.md)

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

詳細: [`05-foundations/motion.md`](./05-foundations/motion.md)

---

## 9. アイコン (Design.md §9)

- ライブラリ: **lucide-react** 一本化
- ストローク: 1.5
- サイズ: 14 / 16 / 20 / 24 px (`h-3.5 w-3.5` 〜 `h-6 w-6`)
- 機能の意味補強用 (装飾はしない)

詳細: [`05-foundations/iconography.md`](./05-foundations/iconography.md), [`docs/icons.md`](../icons.md)

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
