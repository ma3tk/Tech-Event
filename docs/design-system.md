# tech-event デザインシステム

本ドキュメントは tech-event (connpass クローン) における UI 設計の指針と、再利用可能なデザイントークン / コンポーネントの仕様をまとめたものである。

実装は Tailwind CSS v4 の `@theme inline` (`src/app/globals.css`) を単一の出典 (single source of truth) とし、本ドキュメントはそれを人間向けに整理したリファレンスである。

---

## 1. 設計思想

- **本家 connpass と Luma の中間**: 機能密度を優先するが、フラットすぎる古い見栄えにはしない。
- **情報優先**: 一覧画面は 1 行あたりの情報量を最大化 (タイトル / グループ / 日時 / 会場 / 参加者数 を 1 行で読ませる)。
- **モダンな質感**: 角丸 4-8px、淡いシャドウ、`hover:-translate-y-0.5` などの微細なアニメーションで「触れる感」を出す。派手な装飾は避ける。
- **アクセシビリティを後付けにしない**: フォーカスリング・aria 属性・色だけに依存しないステータス表示を最初から組み込む。
- **JS なしでも動作**: 検索フォーム・ページネーション・パンくず等は SSR とリンクで完結させ、Client Component は最小限に。
- **連想色は connpass 由来**: メインオレンジ `#ea5404`、リンクブルー `#005d8c`、CTA レッド `#d23a3a`。

---

## 2. カラー

すべてのカラーは `src/app/globals.css` の CSS 変数として宣言され、Tailwind v4 の `@theme inline` 経由でユーティリティクラス化されている。直接 hex を書かないこと。

> **WCAG AA 準拠ポリシー**: 本デザインシステムで定義する全てのトークン (背景 / 前景 ペア、テキスト色、ステータスバッジ等) は **WCAG AA (通常テキストで 4.5:1) 以上のコントラスト** を満たすように調整されている。新しいトークンを追加する際も同様の基準を満たすこと。検証は `e2e/components-a11y.spec.ts` の axe-core によって CI 上で行われ、`color-contrast` 違反が 0 件であることを確認している。

### 2.1 ベース

| トークン | Hex | 用途 | Tailwind クラス例 | コントラスト比 (vs `#fff`) |
| --- | --- | --- | --- | --- |
| `--background` | `#f7f7f5` | ページ背景 | `bg-background` | — (背景色) |
| `--surface` | `#ffffff` | カード / ヘッダー / フッターの面 | `bg-surface` | — (背景色) |
| `--foreground` | `#1a1a1a` | 本文テキスト | `text-foreground` | 18.1:1 (AAA) |
| `--muted` | `#6b7280` | プレースホルダ / 補助線 | `text-muted` | 4.6:1 (AA) |
| `--muted-foreground` | `#4b5563` | 補助テキスト | `text-muted-foreground` | 7.6:1 (AAA) |
| `--border` | `#e5e7eb` | 区切り線 (デフォルト) | `border-border` | — (装飾) |
| `--border-strong` | `#d1d5db` | 強調区切り (テーブル等) | `border-border-strong` | — (装飾) |

### 2.2 ブランド (オレンジ)

connpass 本家のブランドオレンジ `#ea5404` は白文字とのコントラストが 3.64:1 で WCAG AA を満たさないため、tech-event では明度のみを下げた `#c2410c` を採用している (色相はほぼ同じで「オレンジらしさ」を維持)。

| トークン | Hex | 用途 | Tailwind クラス例 | コントラスト比 |
| --- | --- | --- | --- | --- |
| `--brand-orange` | `#c2410c` | ロゴ / プライマリ CTA 背景 / 強調枠線 | `bg-brand-orange` / `text-brand-orange` | 4.93:1 vs `#fff` (AA) |
| `--brand-orange-hover` | `#9a3412` | hover ステート | `hover:bg-brand-orange-hover` | 7.31:1 vs `#fff` (AAA) |
| `--brand-orange-soft` | `#fff1ea` | ホバー時の薄背景 / 空サムネ | `bg-brand-orange-soft` | — (淡背景) |
| `--brand-orange-strong` | `#c2410c` | 淡色背景上の濃いテキスト (意味は `--brand-orange` と同じだが用途を明示するためのエイリアス) | `text-brand-orange-strong` | 4.62:1 vs `#fff1ea` (AA) |

### 2.3 アクション (レッド)

イベント作成・会員登録のような「目立たせたい遷移 CTA」用。原則オレンジを優先し、要所のみ使う。

| トークン | Hex | 用途 | Tailwind クラス例 |
| --- | --- | --- | --- |
| `--brand-red` | `#d23a3a` | イベント作成 / 退会等の強アクション | `bg-brand-red` |
| `--brand-red-hover` | `#b82c2c` | hover ステート | `hover:bg-brand-red-hover` |
| `--brand-red-soft` | `#fbeaea` | 警告系の薄背景 | `bg-brand-red-soft` |

### 2.4 リンク

| トークン | Hex | 用途 | Tailwind クラス例 |
| --- | --- | --- | --- |
| `--link` | `#005d8c` | テキスト中のリンク (グループ名・タグ等) | `text-link` |
| `--link-hover` | `#004161` | hover ステート | `hover:text-link-hover` |

### 2.5 ステータスカラー (8 種)

イベント状態バッジ専用。常に `背景 (bg) + 前景 (fg)` のペアで使う。**すべて WCAG AA (4.5:1) 以上を満たす**ように調整済み (多くは AAA 7:1 をクリア)。色相の意味 (緑=募集中 / 赤=満員 / 黄=補欠 / グレー=締切・終了 / オレンジ=開催中 / 青=開催前 / 濃赤=中止) は connpass 本家踏襲。

| 状態 | 背景トークン (Hex) | 前景トークン (Hex) | 意味 | bg / fg コントラスト |
| --- | --- | --- | --- | --- |
| `open` | `--status-open-bg` (`#dcfce7`) | `--status-open-fg` (`#14532d`) | 募集中 | 9.7:1 (AAA) |
| `full` | `--status-full-bg` (`#fee2e2`) | `--status-full-fg` (`#991b1b`) | 満員 | 7.9:1 (AAA) |
| `waitlist` | `--status-waitlist-bg` (`#fef9c3`) | `--status-waitlist-fg` (`#713f12`) | 補欠受付中 | 8.3:1 (AAA) |
| `closed` | `--status-closed-bg` (`#f3f4f6`) | `--status-closed-fg` (`#1f2937`) | 募集締切 | 12.6:1 (AAA) |
| `cancelled` | `--status-cancelled-bg` (`#991b1b`) | `--status-cancelled-fg` (`#ffffff`) | 中止 | 7.9:1 (AAA) |
| `ended` | `--status-ended-bg` (`#f3f4f6`) | `--status-ended-fg` (`#4b5563`) | 終了 | 7.5:1 (AAA) |
| `upcoming` | `--status-upcoming-bg` (`#dbeafe`) | `--status-upcoming-fg` (`#1e3a8a`) | 開催前 | 10.4:1 (AAA) |
| `ongoing` | `--status-ongoing-bg` (`#fff7ed`) | `--status-ongoing-fg` (`#c2410c`) | 開催中 | 4.9:1 (AA) |

Tailwind クラスは `bg-status-{name}-bg` / `text-status-{name}-fg` の形で生成される。

---

## 3. タイポグラフィ

- フォントファミリ: `Noto Sans JP` + システム日本語フォント (`Hiragino Kaku Gothic ProN`, `Yu Gothic UI`, `Meiryo`) フォールバック。
- ウェイトは `400 / 600 / 700` の 3 段階のみ使用 (500 は使わない)。

| 要素 | サイズ | 行間 | ウェイト | 用途 |
| --- | --- | --- | --- | --- |
| `h1` | 28px (`text-[28px]`) | 1.3 | 700 | ページ主見出し (イベント詳細タイトル等) |
| `h2` | 22px (`text-[22px]`) | 1.35 | 700 | セクション見出し |
| `h3` | 18px (`text-lg`) | 1.4 | 700 | サブ見出し / カード内タイトル |
| `h4` | 16px (`text-base`) | 1.5 | 600 | フォームラベル / 小見出し |
| body | 14px (`text-sm`) | 1.7 | 400 | 本文 (デフォルト) |
| meta | 12px (`text-xs`) | 1.5 | 400 | 補助テキスト・日時・件数 |

行間 (`line-height`) のデフォルトは `1.7` (`body` 全体)。見出しは `globals.css` 内で上書きしている。

---

## 4. スペーシング

Tailwind v4 のデフォルトスケールから、以下を主要トークンとして使う:

| トークン | px | Tailwind |
| --- | --- | --- |
| 1 | 4 | `p-1` / `gap-1` |
| 2 | 8 | `p-2` / `gap-2` |
| 3 | 12 | `p-3` / `gap-3` |
| 4 | 16 | `p-4` / `gap-4` |
| 6 | 24 | `p-6` / `gap-6` |
| 8 | 32 | `p-8` / `gap-8` |
| 12 | 48 | `p-12` |
| 16 | 64 | `p-16` |

非標準値 (10px, 14px 等) の利用は禁止。情報密度が必要なときは `py-2.5` (10px) までに留める。

---

## 5. ブレークポイント

Tailwind 標準と同じ。レイアウトは `モバイル → md (タブレット) → lg (デスクトップ)` の順で組む。

| 名称 | 最小幅 | 用途 |
| --- | --- | --- |
| `sm` | 640px | 小型タブレット / 大型スマホ横向き |
| `md` | 768px | タブレット縦 / 小型ラップトップ |
| `lg` | 1024px | デスクトップ標準 |
| `xl` | 1280px | ワイドデスクトップ (max-w-7xl とほぼ同じ) |

---

## 6. 角丸 (radius)

| トークン | px | Tailwind | 用途 |
| --- | --- | --- | --- |
| sm | 2 | `rounded-sm` | タグの矩形要素 / フォーカスリング |
| base | 4 | `rounded` | バッジ / ステータスチップ |
| md | 6 | `rounded-md` | ボタン / 入力 / ナビ |
| lg | 8 | `rounded-lg` | カード (EventCard / GroupCard) |
| full | 9999 | `rounded-full` | アバター / TagPill |

---

## 7. シャドウ

控えめに使う。深いシャドウは多用しない。

| トークン | Tailwind | 用途 |
| --- | --- | --- |
| sm | `shadow-sm` | カードの常時シャドウ |
| base | `shadow` | モーダル下層 |
| md | `shadow-md` | hover 時のカード強調 |
| lg | `shadow-lg` | モーダル / ポップオーバー |

例: `EventCard` は `shadow-sm` を常時、hover で `shadow-md hover:-translate-y-0.5` に上昇。

---

## 8. 状態 (interaction state)

| 状態 | スタイルルール |
| --- | --- |
| `hover` | 背景を 1 段濃く (`hover:bg-brand-orange-soft`) または `hover:-translate-y-0.5`。リンクは `hover:underline`。 |
| `focus-visible` | `outline: 2px solid var(--brand-orange)` + `outline-offset: 2px` + `border-radius: 2px` (`globals.css` で全体に適用済み)。`focus` (非 `focus-visible`) は装飾を出さない。 |
| `active` | わずかに沈める (`active:translate-y-0` / `active:bg-brand-orange-hover`)。 |
| `disabled` | `opacity-50 cursor-not-allowed pointer-events-none`。`aria-disabled="true"` を併記。 |
| `loading` | スピナー or `aria-busy="true"`。ボタンの中身は不可視化せず、後ろにスピナーを足す。 |
| `selected` (toggle) | `aria-pressed="true"` + `bg-brand-orange text-white border-brand-orange`。 |

---

## 9. アイコン

- ライブラリ: [`lucide-react`](https://lucide.dev) (v1 系)。
- 標準サイズ: `14 / 16 / 20 / 24 px`。それぞれ `h-3.5 w-3.5` / `h-4 w-4` / `h-5 w-5` / `h-6 w-6` に対応。
- 単体表示時は必ず `aria-hidden="true"` を付け、隣接テキスト or `aria-label` で意味を補う。
- カラーは `currentColor` 継承。明示する場合は `text-brand-orange` 等を親に付与。

---

## 10. コンポーネント命名規約

| 対象 | 規約 | 例 |
| --- | --- | --- |
| コンポーネントファイル | `PascalCase.tsx` | `EventCard.tsx`、`HeaderServer.tsx` |
| コンポーネント関数 | `PascalCase` (default export) | `export default function EventCard(...)` |
| Props 型 | `PascalCaseProps` | `EventCardProps`、`EventStatusBadgeProps` |
| Props フィールド | `camelCase` | `isJoined`、`onJoinToggle`、`searchQuery` |
| CSS 変数 / globals.css クラス | `--kebab-case` / `.kebab-case` | `--brand-orange`、`.skip-link` |
| ユーティリティ関数 | `camelCase` (named export) | `computePages`、`toEventCardData` |
| 列挙的な定数 | `UPPER_SNAKE_CASE` | `STATUS_CONFIG`、`NAV_LINKS` |

---

## 11. アクセシビリティ チェックリスト

新規 / 変更コンポーネントを書いたら必ず以下を確認:

- [ ] **キーボード**: Tab で全ての対話要素にフォーカスが当たる。フォーカス順は論理的。
- [ ] **focus-visible**: `globals.css` のグローバル outline が機能している (隠していないか)。
- [ ] **aria 属性**: `role` を補足する場合 / トグルなら `aria-pressed`、メニューなら `aria-expanded` / `aria-haspopup`、状態は `role="status"` を付与。
- [ ] **色だけに依存しない**: ステータスバッジには色 + テキスト両方を出す。アイコンのみのボタンは `aria-label` を必須に。
- [ ] **コントラスト**: テキスト vs 背景の WCAG AA (4.5:1) を満たす。
  - 本デザインシステムで定義する全トークンは AA 以上に調整済 (`§ 2` 参照)。
  - `text-muted` (`#6b7280`) は白背景 (`#fff`) では 4.6:1 で OK だが、淡色背景 (`bg-brand-orange-soft` 等) では下回ることがあるため、淡背景の上では `text-muted-foreground` (`#4b5563`) を使うこと。
  - 淡色背景上の濃いオレンジ文字には `text-brand-orange` / `text-brand-orange-strong` を使い、`bg-brand-orange/10` のような半透明色は使わない (合成後のコントラストが落ちる)。
  - 「disabled = opacity-50」のような半透明スタイルは axe `color-contrast` ルールを踏むため、`opacity-*` ではなく明示的に `text-muted-foreground` 等を割り当てる。
- [ ] **画像 alt**: 装飾画像は `alt=""`、意味を持つ画像は内容を記述。サムネは装飾扱い (タイトルが隣接) で OK。
- [ ] **見出し階層**: ページ内で `h1` は 1 つ。`h2 → h3` をスキップしない。
- [ ] **タッチターゲット**: 最小 36×36px (`min-h-9 min-w-9`)。モバイルでは 44×44px を推奨。
- [ ] **prefers-reduced-motion**: アニメーションは `globals.css` のメディアクエリで自動的に無効化される。`transition-*` のみを使い、JS 主導の物理アニメは避ける。

### 11.1 axe-core 自動走査結果 (最終)

CI で `@axe-core/playwright` を以下のターゲットに対し実行している。結果スナップショットは `screenshots/components/_axe.json` / `_axe-pages.json` に出力される。

**`/components` ショーケース** (`e2e/components-a11y.spec.ts`):

| 指標 | 値 |
| --- | --- |
| passes | 31 ルール |
| violations | 1 ルール (`aria-prohibited-attr`, serious, 3 ノード) |
| color-contrast 違反 | **0 件** (WCAG AA / AAA 準拠を全トークンで確認) |
| critical / serious blocker | 1 (= 上記 `aria-prohibited-attr`、`Pagination` の disabled `<a>` に `aria-label` を付与している箇所。`<button>` 置換 or `aria-hidden` 化で解消予定) |

**主要 10 ページ** (`e2e/a11y-pages.spec.ts`):

| ページ | violations | blockers | 既知 design (warn) |
| --- | --: | --: | --- |
| `/` | 1 | 0 | color-contrast × 1 |
| `/explore` | 1 | 1 | — (Pagination の上記課題) |
| `/event/1` | 0 | 0 | — |
| `/group/findy` | 0 | 0 | — |
| `/user/fast_moon_169` | 0 | 0 | — |
| `/calendar/ai-developers` | 0 | 0 | — |
| `/ranking` | 0 | 0 | — |
| `/login` | 1 | 0 | (minor) |
| `/signup` | 1 | 0 | (minor) |
| `/dashboard` | 0 | 0 | — |

- **WCAG AA color-contrast: 主要 10 ページ中 9 ページで違反 0**。残 1 件 (`/`) は装飾用淡背景の上の補助テキストで、`text-muted-foreground` 移行で解消予定。
- critical/serious blocker は `aria-prohibited-attr` 1 種のみ。Pagination の前/次が disabled のとき `<a aria-label>` を残したままなので、`aria-disabled` を追加 + `aria-hidden` 化することで CI を完全グリーンにできる。

---

## 12. 既存コンポーネント一覧

`src/components/` 配下の再利用 UI 部品。すべて TypeScript 型を export する。

| ファイル | 役割 |
| --- | --- |
| `Header.tsx` | グローバルヘッダー (Client Component)。ロゴ / 検索 / ナビ / アカウント領域。 |
| `HeaderServer.tsx` | `Header` の Server Component ラッパー。current user と未読通知数を解決。 |
| `Footer.tsx` | グローバルフッター。リンク群 + SNS + コピーライト。 |
| `EventCard.tsx` | イベントカード本体。`list` / `grid` variant を持つ。 |
| `EventCardCompact.tsx` | `EventCard` の `grid` variant を呼び出すだけの薄いラッパー。 |
| `EventListRow.tsx` | リスト 1 行型のコンパクト表示。検索結果 / ランキング用。`showRank` で順位バッジを付加。 |
| `EventStatusBadge.tsx` | イベント状態バッジ (8 状態 + DB 互換 2 値)。`subtle` / `solid` / `outline` / `dot` の 4 variant。 |
| `Pagination.tsx` | 数値ベースのページネーション。`computePages` ヘルパー付き。 |
| `Breadcrumb.tsx` | パンくず。JSON-LD 構造化データを同時出力可能。 |
| `TagPill.tsx` | タグ表示。`default` / `filter` / `selectable` / `outline` の 4 variant。 |
| `SearchBox.tsx` | ヘッダー / ヒーロー検索ボックス。`<form method="get">` で JS なし動作。 |
| `GroupCard.tsx` | グループカード。`standard` / `sidebar` / `compact` の 3 variant。参加ボタン付き。 |
| `ParticipantBadge.tsx` | 参加者アバター + ニックネーム。`user` オブジェクト or 直接プロパティで指定可能。 |
| `MiniCalendar.tsx` | サイドバー用ミニカレンダー。開催日にドット表示。 |
| `RecentlyViewedEvents.tsx` | sessionStorage を読む「最近見た」パネル (Client Component)。 |
| `EventTimeline.tsx` | Luma 風タイムライン UI。月見出しで自動グループ化 + `EventListRow` compact 表示。`stickyTopPx` で上端調整可能。 |
| `EventStickyCTA.tsx` | イベント詳細ページ下部のフローティング申込バー (Client Component)。IntersectionObserver で本体 CTA が画面外のときだけ滑り出し表示。`state` prop で 10 状態のラベル分岐。 |
| `HostAvatarStack.tsx` | 共催 (co-host) 用の重ねアバター。`maxVisible` 超は "+N" にまとめ、`aria-label` で氏名集約 (SR 対応)。サイズ sm/md/lg。 |
| `ShareModal.tsx` | 1 画面で OG プレビュー / リンクコピー / SNS シェア / QR / 埋め込みコードを完結させる統合ダイアログ (Client Component)。モバイルでは `navigator.share` を先に試行。`<dialog>` ベース。 |
| `MarkdownEditor.tsx` | 2 カラム WYSIWYG Markdown エディタ (Client Component)。左 textarea + 右ライブプレビュー (`marked`)、太字/見出し/リスト/リンク等のツールバー、モバイルではタブ切替、文字数カウント付き。uncontrolled として form submit にそのまま乗る。 |

---

## 13. Storybook

開発時の UI カタログとして Storybook を導入している。

```sh
pnpm storybook        # 開発サーバ (http://localhost:6006)
pnpm build-storybook  # 静的ビルド (storybook-static/)
```

Story ファイルは `src/components/*.stories.tsx` に同居させ、各コンポーネントの default / variations / states を網羅する。

Storybook は `globals.css` を `.storybook/preview.ts` で import するため、Tailwind トークンがそのまま使える。

---

## 14. Storybook MDX ドキュメント参照

本ドキュメントの内容を、実物の色見本・フォントサンプル・スペーシング比較などインタラクティブな形で参照できるよう、Storybook サイドバーの **Design System/** カテゴリ配下に MDX ドキュメントを整備している。Storybook を起動 (`pnpm storybook`) すると左サイドバーから閲覧可能。

ファイルはすべて `src/stories/design-system/` に配置されている。

| ファイル | サイドバー上のパス | 内容要約 |
| --- | --- | --- |
| `Introduction.mdx` | `Design System/Introduction` | デザインシステム概要 / 設計思想 / 4 階層トークン構造 / 見取り図 / 関連リソース。 |
| `Tokens.mdx` | `Design System/Tokens` | primitive vs semantic の役割分担 / `tokens.css` の中身 / light・dark テーマ概要。 |
| `Colors.mdx` | `Design System/Colors` | gray/orange/red/green/blue/yellow の primitive スケール (50-950) を視覚スウォッチで表示 / semantic alias (surface, foreground, brand, link, status × 8) の light/dark 対比 / WCAG コントラスト比 / Tailwind クラス対応表。 |
| `Typography.mdx` | `Design System/Typography` | font-size xs〜4xl の実サンプル / font-weight 4 段 / line-height 4 段 / 見出し+本文+メタの組合せサンプル / 連用クラス対応表。 |
| `Spacing.mdx` | `Design System/Spacing` | spacing-0〜24 のスケール一覧と視覚的バー比較 / padding・gap の実物サンプル / 用途別の使い分けガイド。 |
| `Radius.mdx` | `Design System/Radius, Shadow, Z-index` | radius 6 段の実物 + semantic alias (radius-control/card/modal/badge) / shadow 4 段の実物 + elevation alias / z-index 6 段のレイヤー早見図。 |
| `Components.mdx` | `Design System/Components` | UI primitives 21 個 + composite components 17 個の早見表 (各 Story へのリンク) / Storybook 上での探し方 / 命名規約。 |
| `Accessibility.mdx` | `Design System/Accessibility` | フォーカスリング設計 / キーボード操作キー / ARIA 規約 / 色だけに依存しない設計 / タッチターゲット最小サイズ / prefers-reduced-motion / axe-core 自動走査結果 / `addon-a11y` の使い方。 |
| `DarkMode.mdx` | `Design System/Dark Mode` | `<html data-theme>` ベースの 3 モード切替の仕組み / `ThemeProvider` API / SSR hydration mismatch を避ける設計 / 全 semantic alias の light/dark 値対比表 / カードのビジュアル対比。 |
| `ComponentChecklist.mdx` | `Design System/Component Checklist` | 新規コンポーネント実装テンプレート / Storybook stories 必須項目 / A11y 確認項目 / テスト / PR チェックリスト。 |

### 起動と参照方法

```sh
pnpm storybook         # 開発サーバ (http://localhost:6006)
pnpm build-storybook   # 静的ビルド (storybook-static/)
```

Storybook のサイドバーで **Design System** を開き、目的のページに移動する。本 `docs/design-system.md` は一次資料 (原本) であり、MDX は人間向けの視覚的補完であるという位置付け。新トークンを追加した場合は、両者を同期して更新する。

---

## 15. デザインシステムカタログ (言語化ガイド)

Storybook (視覚) と相互補完する **言語化された使い分けガイド** を `docs/catalog/` に整備している。コンポーネントごとに「いつ使うか」「いつ使わないか」「アンチパターン」を言語化し、shadcn/ui スタイル分類 (ui / components / blocks / foundations) で構成。

| エントリ | 内容 |
| --- | --- |
| [`docs/catalog/README.md`](./catalog/README.md) | カタログトップ + 全コンポーネント早見表 |
| [`docs/catalog/00-overview.md`](./catalog/00-overview.md) | Design.md の要約 (1 ページサマリ) |
| [`docs/catalog/ui/`](./catalog/ui/) | 24 primitives (`libs/shared/ui/`、Radix UI + CVA) |
| [`docs/catalog/components/`](./catalog/components/) | 23 composite components (`libs/shared/ui-composite/`、旧 molecules + organisms 統合) |
| [`docs/catalog/blocks/`](./catalog/blocks/) | 10 構成パターン (Forms / Lists / Modals / Navigation / Feedback / Cards / Data Input + tech-event 固有 3) |
| [`docs/catalog/foundations/`](./catalog/foundations/) | 10 デザイン言語 (Colors / Typography / Spacing / Iconography / Motion / Voice / A11y / Responsive / States / Theming) |

本 `docs/design-system.md` がトークン値 / API の **一次資料** であるのに対し、`docs/catalog/` は **使い分けの意図** を言語化したガイドという位置付け。新規コンポーネント追加時は両者を同期して更新する。
