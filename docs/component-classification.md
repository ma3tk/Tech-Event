# tech-event コンポーネント分類 (shadcn/ui スタイル)

本ドキュメントは `tech-event` の全コンポーネントを **shadcn/ui 公式 (https://ui.shadcn.com/) の分類** に倣って整理したものである。
分類の目的は「どの粒度で再利用すべきか」を明確にし、新規追加時に **重複定義** を防ぐこと。

> 関連: `docs/design-system.md` § 12 (既存コンポーネント一覧)、`src/stories/design-system/Components.mdx`、`docs/catalog/README.md`

---

## 1. カテゴリモデル (4 軸)

| カテゴリ | 配置 | 役割 | 例 |
| --- | --- | --- | --- |
| **ui** | `libs/shared/ui/` | Radix UI ベースの primitive。ドメイン知識を持たない最小単位 | `Button`, `Input`, `Card`, `Dialog`, `Avatar` |
| **components** | `libs/shared/ui-composite/` | ui primitive を組み合わせた機能コンポーネント (旧 molecules + organisms をフラット化) | `Header`, `EventListRow`, `EventStatusBadge`, `TagPill`, `ShareModal` |
| **blocks** | `docs/catalog/blocks/` | 事前構成された UI セクション / 構成パターン (複数 components の組み合わせの典型) | `event-status-orchestration`, `cta-matrix`, `host-vs-participant-ui`, `forms`, `lists-and-tables` |
| **foundations** | `src/styles/tokens.css` / `docs/catalog/foundations/` | デザイントークン・原則 (colors / typography / spacing / motion 等) | `colors`, `typography`, `spacing`, `motion`, `theming` |

データ取得 (Prisma クエリ / `searchParams` 処理) は **Page でのみ** 行い、components 以下は受け取った props のみで描画する。

---

## 2. 判定基準 (新規コンポーネントをどこに置くか)

新規コンポーネントを追加するとき、以下の質問を順に答えてカテゴリを決める:

### Q1. ドメイン知識を持つか?
- **No** → `ui` 候補 (Q2 へ)
- **Yes** → `components` 候補 (Q3 へ)

### Q2. Radix UI primitive (もしくはそれ相当の汎用 primitive) のラッパーか?
- **Yes** → **`ui`** に置く。`libs/shared/ui/` の `.tsx` + `.stories.tsx` + `docs/catalog/ui/<name>.md` を 3 点セットで作る
- **No (純粋な div composition)** → 検討: 本当に primitive か。Card / Skeleton 等は OK だが、`HostAvatarStack` のように domain (host = 主催者) が透ける場合は components へ

### Q3. UI セクション (固定構成のパターン) か?
- **Yes (再利用される 1 つのコンポーネントではなく "構成パターン")** → **`blocks`** として MD のみ作る (実装は components の組み合わせで現場ごとに微調整可)
- **No (1 つの再利用可能なコンポーネント)** → **`components`** に置く。`libs/shared/ui-composite/` の `.tsx` + `.stories.tsx` + `docs/catalog/components/<name>.md` を 3 点セットで作る

### Q4. それは部品ではなく "デザインの原則" か?
- **Yes** (色の使い分け、フォーカスリングの規約、モーションの duration テーブル等) → **`foundations`** に MD として記述 (`docs/catalog/foundations/<topic>.md`)

---

## 3. ui (24) — `libs/shared/ui/`

Radix UI ベース + Tailwind トークン直接参照。
**ドメイン知識を持たない**ため、別プロジェクトに移植可能。

| Component | 役割 | ベース |
| --- | --- | --- |
| `Avatar` | アバター画像 + フォールバック | `@radix-ui/react-avatar` |
| `Badge` | 小ラベル | cva |
| `Button` | ボタン (6 variant × 5 size) | `@radix-ui/react-slot` + cva |
| `Card` | カード枠 (Header / Title / Description / Content / Footer) | div composition |
| `Checkbox` | チェックボックス (indeterminate 対応) | `@radix-ui/react-checkbox` |
| `Dialog` | モーダルダイアログ | `@radix-ui/react-dialog` |
| `DropdownMenu` | ドロップダウン (Item / Separator / Sub / Radio / Check) | `@radix-ui/react-dropdown-menu` |
| `EmptyState` | 空状態表示 | div composition |
| `ErrorState` | エラー状態表示 | div composition |
| `Form` | RHF + Zod ラッパー (FieldError / Description 統合) | `react-hook-form` |
| `Input` | テキスト入力 (`size` / `error` / 左右アイコン) | native input + cva |
| `Label` | フォームラベル (`for` 自動連携) | `@radix-ui/react-label` |
| `LoadingState` | ローディング状態表示 | div composition |
| `Popover` | ポップオーバー | `@radix-ui/react-popover` |
| `RadioGroup` | ラジオグループ | `@radix-ui/react-radio-group` |
| `Select` | セレクトボックス | `@radix-ui/react-select` |
| `Separator` | 区切り線 (horizontal / vertical) | `@radix-ui/react-separator` |
| `Sheet` | サイドシート (left / right / top / bottom) | `@radix-ui/react-dialog` |
| `Skeleton` | ローディングスケルトン | `animate-pulse` |
| `Switch` | トグルスイッチ | `@radix-ui/react-switch` |
| `Tabs` | タブ (List / Trigger / Content) | `@radix-ui/react-tabs` |
| `Textarea` | 複数行入力 | native textarea |
| `Toast` | 通知トースト | `@radix-ui/react-toast` + Sonner |
| `Tooltip` | ツールチップ | `@radix-ui/react-tooltip` |

**合計: 24 個**

---

## 4. components (23) — `libs/shared/ui-composite/`

ui primitive を 2-3 個以上組み合わせた機能コンポーネント。
`EventStatus` のようなドメイン値型は持つが、副作用 (DB アクセス / fetch / Server Action 呼び出し) は持たない (Server Action 呼び出しが必要なものは page 側で `'use server'` ラッパーを噛ませる)。

| Component | 役割 | 主な構成 |
| --- | --- | --- |
| `Breadcrumb` | パンくず (JSON-LD 出力可) | リンク + `ChevronRight` |
| `EventCard` | イベントカード本体 (`list` / `grid` variant) | Card + EventStatusBadge + HostAvatarStack + TagPill |
| `EventCardCompact` | `EventCard` の `grid` ラッパー | EventCard |
| `EventListRow` | リスト 1 行型コンパクト表示 (`showRank` 対応) | EventStatusBadge + HostAvatarStack + lucide icons |
| `EventStatusBadge` | イベント 8 状態バッジ (subtle / solid / outline / dot) | Badge + `EventStatus` 型 |
| `EventStickyCTA` | 詳細ページ下部のフローティング申込バー (10 状態対応) | Button + IntersectionObserver |
| `EventTimeline` | Luma 風タイムライン (月見出し自動グルーピング) | EventListRow |
| `Footer` | グローバルフッター (リンク群 + SNS) | リンクリスト + Separator |
| `GroupCard` | グループカード (standard / sidebar / compact) | Card + Button + Avatar |
| `Header` | グローバルヘッダー (Client) | SearchBox + DropdownMenu + Avatar + lucide icons + ThemeToggle |
| `HeaderServer` | Header の Server Component ラッパー (current user / 通知数解決) | Header |
| `HostAvatarStack` | 共催アバター重ね表示 + "+N" 集約 + SR 対応 | Avatar 複数 + Tooltip |
| `LanguageSwitcher` | 言語切替 | DropdownMenu + lucide icons |
| `MarkdownEditor` | 2 カラム WYSIWYG (Markdown + ライブプレビュー) | Textarea + marked |
| `MiniCalendar` | サイドバー用ミニカレンダー (開催日にドット) | grid + date-fns |
| `Pagination` | 数値ページネーション + `computePages` ヘルパー | Button + lucide chevrons |
| `ParticipantBadge` | アバター + ニックネーム | Avatar + Link |
| `RecentlyViewedEvents` | sessionStorage 連動「最近見た」パネル | Card + Link |
| `SearchBox` | 検索フォーム (`<form method="get">` JS なし動作) | Input + Button |
| `ShareModal` | OG / リンクコピー / SNS / QR / 埋め込み統合ダイアログ | Dialog + Tabs + Button + QR (svg) |
| `TagPill` | タグ表示 (default / filter / selectable / outline) | Badge ベース |
| `ThemeSwitcher` | テーマ切替 | DropdownMenu + lucide icons |
| `UserMenuDropdown` | ユーザーメニュー | DropdownMenu + Avatar + Link |

**合計: 23 個**

> ディレクトリ名 `libs/shared/ui-composite/` は据え置き (内部実装の rename は別タスク)。MD カタログでは `components` 命名で統一する。

---

## 5. blocks (10) — `docs/catalog/blocks/`

事前構成された UI セクション / 構成パターン。
1 つの再利用 component ではなく、「複数 components を組み合わせる際の典型構成・使い分けガイド」。

**汎用 (7)**

| Block | 何を解く |
| --- | --- |
| `forms` | フォーム全般 (フィールド配置・エラー表示・送信ボタン位置) |
| `lists-and-tables` | 一覧表示 (list view と table view の使い分け) |
| `modals-and-sheets` | Dialog vs Sheet の使い分け、入れ子の禁止 |
| `navigation` | グローバルナビ・サイドナビ・breadcrumb の使い分け |
| `feedback` | Toast / Banner / Inline error の使い分け |
| `cards` | カード型 UI (情報密度・action 配置) |
| `data-input` | 入力フォームの粒度・段階開示 |

**tech-event ドメイン固有 (3)**

| Block | 何を解く |
| --- | --- |
| `event-status-orchestration` | 8 ステータス (open/full/waitlist/closed/cancelled/ended/upcoming/ongoing) の状態機械と UI 表現の一貫性 |
| `cta-matrix` | 4 CTA (参加申込/補欠登録/抽選に申し込む/参加リクエストを送信) の使い分け + multi-state ボタン設計 |
| `host-vs-participant-ui` | 主催者 (P6/P7/P8) と参加者 (P1-P5) で見せ方が変わるパターン |

**合計: 10 個**

---

## 6. foundations (10) — `docs/catalog/foundations/`

デザイン言語そのもの。コンポーネントではなく「色・文字・間・動き」の原則。
実装は `src/styles/tokens.css` (Primitive) → `src/styles/semantic.css` (Semantic alias) → `src/styles/themes/*.css` (Theme mapping) の 3 層トークン。

| Foundation | 何を扱う |
| --- | --- |
| `colors` | カラーパレット・コントラスト比・ブランド色のトークン |
| `typography` | フォント・スケール・行間・5 原則 |
| `spacing` | スケール・gap / padding / margin の選び方 |
| `iconography` | lucide-react 規約・サイズ・stroke |
| `motion` | duration / easing トークン・reduced-motion |
| `voice-and-tone` | 文言の語り口 (ja / en) |
| `accessibility` | WCAG AA 必須・focus-visible・色非依存 |
| `responsive` | breakpoint・mobile-first |
| `states` | default / hover / focus / disabled / loading / empty / error |
| `theming` | light / dark / high-contrast 3 テーマ |

**合計: 10 個**

---

## 7. Page (40+) — `apps/web/src/app/**/page.tsx`

Next.js App Router の page.tsx。データ取得 + 認可 + components 配置を行う。
Page から下のレイヤーへの依存方向は **Page → components → ui** に固定 (逆禁止)。

### 主要 Page (代表 10)

| ページ | URL | 主に呼び出す components |
| --- | --- | --- |
| トップ | `/` | Header + EventCard 一覧 + MiniCalendar |
| イベント一覧 | `/explore` | EventListRow + Pagination + TagPill (filter) |
| イベント詳細 | `/event/[id]` | EventStickyCTA + HostAvatarStack + ShareModal + ParticipantBadge |
| グループ詳細 | `/group/[subdomain]` | EventTimeline + GroupCard (sidebar) + Tabs |
| ユーザープロフィール | `/user/[nickname]` | Tabs + EventListRow + GroupCard |
| カレンダー詳細 | `/calendar/[slug]` | EventTimeline + Subscribe Button |
| 主催ダッシュボード | `/event/[id]/admin` | StatsCard + Tabs |
| 検索 | `/search` | SearchBox + EventListRow + Pagination |
| 通知センター | `/notifications` | Tabs + NotificationRow |
| ブックマーク | `/bookmarks` | EventListRow |

**合計: 68 page (route manifest 基準)。** 詳細は `pnpm build` の Route 出力参照。

---

## 8. 依存方向 (重要)

```
Page         (データ取得 + 認可)
  ↓ props
components  (ui primitive を組み合わせた機能コンポーネント。副作用なし or Client hook のみ)
  ↓
ui          (Radix UI primitive。ドメイン知識ゼロ)
```

横断的に参照されるもの:

```
blocks       — components の組み合わせパターンを言語化 (MD のみ、実装無し)
foundations — 全レイヤーが参照するデザイントークン (CSS 変数 + MD)
```

- ui が components を import するのは **禁止**。
- components が他の同じレイヤーの components を import するのは OK (例: EventCard → EventStatusBadge)。
- ui が `prisma` / Server Action を import するのは **禁止**。
- Page から ui を直接 import するのは **OK** (Card 等で枠だけ使う用途を許可)。

---

## 9. 統計

| カテゴリ | 数 | 配置 |
| --- | --: | --- |
| ui | 24 | `libs/shared/ui/` |
| components | 23 | `libs/shared/ui-composite/` |
| blocks | 10 | `docs/catalog/blocks/` (MD のみ) |
| foundations | 10 | `docs/catalog/foundations/` + `src/styles/*` |
| Page | 68 | `apps/web/src/app/**/page.tsx` |

合計: ui + components = **47 reusable components**、blocks + foundations = **20 言語化資料**、Page まで含めると **135+**。

---

## 10. 旧 Atomic Design 命名との対応 (移行記録)

2026-06-06 にカタログの命名を Atomic Design (atoms / molecules / organisms / patterns / foundations) から **shadcn/ui スタイル** (ui / components / blocks / foundations) に統一した。
両方を知っているメンバーが残るうちは、過去 PR / Slack ログを読む際の参照に使うこと。

| 旧 (Atomic Design) | 新 (shadcn/ui スタイル) | 補足 |
| --- | --- | --- |
| `ui/` (24 MD) | `ui/` (24 MD) | そのまま rename。中身の構造・本文は変更なし |
| `components/` (15 MD) | `components/` (15 MD 由来) | `components/` と統合。下位/上位の階層概念を廃止 |
| `components/` (8 MD) | `components/` (8 MD 由来) | `components/` と統合。フラット化 |
| `blocks/` (10 MD) | `blocks/` (10 MD) | shadcn/ui 公式の "blocks" 命名に揃える |
| `foundations/` (10 MD) | `foundations/` (10 MD) | プレフィックス番号を削除 |

### 用語マッピング

| 旧 | 新 |
| --- | --- |
| Atom | ui (primitive) |
| Molecule | component (小型 composite) |
| Organism | component (大型 composite) |
| Pattern | block |
| Foundation | foundation (変更なし) |
| Atomic 階層 | コンポーネント階層 / shadcn/ui スタイル分類 |
| Atomic Design | shadcn/ui スタイル分類 |

### 廃止理由

- Atomic Design の "atom / molecule / organism" の境界判定は人によって揺れる (Header は organism? molecule? 議論コストが発生していた)
- shadcn/ui 公式が **ui / components / blocks** の 3 分類に収束した結果、社内既存知識が再利用できる
- フラット化 (`molecules + organisms = components`) により、サイズによる階層分けではなく **役割 (primitive か composite か)** で割り切れるようになった

### 影響範囲

- `docs/catalog/` 配下 (60 MD) の rename + 内部リンク置換
- `docs/component-classification.md` (旧 `component-taxonomy.md`) の全面書き直し
- `Design.md` / `CLAUDE.md` / `Personas.md` / `README.md` の参照更新
- Storybook sidebar の order 更新
- `.claude/agents/storybook-curator.md` などの agent 設定

詳細は git log の commit `feat: Atomic Design 廃止 → shadcn/ui スタイル統一` を参照。
