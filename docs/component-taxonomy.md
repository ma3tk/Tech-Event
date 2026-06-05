# tech-event コンポーネント分類 (アトミックレベル)

本ドキュメントは `tech-event` の全コンポーネントを Atomic Design ベースの 5 階層に分類したものである。
分類の目的は「どの粒度で再利用すべきか」を明確にし、新規追加時に**重複定義**を防ぐこと。

> 関連: `docs/design-system.md` § 12 (既存コンポーネント一覧)、`src/stories/design-system/Components.mdx`

---

## 1. 階層モデル

| レベル | 配置 | 役割 | 例 |
| --- | --- | --- | --- |
| **Atom** | `src/components/ui/` | ドメイン知識を持たない最小単位 | `Button`, `Input`, `Card` |
| **Molecule** | `src/components/` | Atom を 2-3 個組み合わせた単機能ユニット | `TagPill`, `Breadcrumb`, `EventStatusBadge` |
| **Organism** | `src/components/` | 複数の Molecule / Atom を束ねた独立セクション | `Header`, `EventCard`, `ShareModal` |
| **Template** | `src/app/components/page.tsx` 他 | コンポーネントの showcase / 試着場 | `/components` ページ |
| **Page** | `src/app/**/page.tsx` | データ取得 + Template にデータを流し込む実画面 | `/`, `/event/[id]`, `/group/[subdomain]` |

データ取得 (Prisma クエリ / `searchParams` 処理) は **Page でのみ** 行い、Organism 以下は受け取った props のみで描画する。

---

## 2. Atom (21) — `src/components/ui/`

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
| `Form` | RHF + Zod ラッパー (FieldError / Description 統合) | `react-hook-form` |
| `Input` | テキスト入力 (`size` / `error` / 左右アイコン) | native input + cva |
| `Label` | フォームラベル (`for` 自動連携) | `@radix-ui/react-label` |
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

**合計: 21 個**

---

## 3. Molecule (5) — `src/components/`

単機能の小さな組み立て部品。`EventStatus` のようなドメイン値型は持つが、
副作用 (DB アクセス / fetch / Server Action 呼び出し) は持たない。

| Component | 役割 | 構成する Atom |
| --- | --- | --- |
| `Breadcrumb` | パンくず (JSON-LD 出力可) | リンク + `ChevronRight` |
| `TagPill` | タグ表示 (default / filter / selectable / outline) | Badge ベース |
| `EventStatusBadge` | イベント 8 状態バッジ (subtle / solid / outline / dot) | Badge + `EventStatus` 型 |
| `ParticipantBadge` | アバター + ニックネーム | Avatar + Link |
| `SearchBox` | 検索フォーム (`<form method="get">` JS なし動作) | Input + Button |

**合計: 5 個**

---

## 4. Organism (12) — `src/components/`

複数の Molecule / Atom を束ねた独立した UI セクション。
画面の中に「カードレイアウトをまるごと埋め込む」粒度。

| Component | 役割 | 主な構成 |
| --- | --- | --- |
| `Header` | グローバルヘッダー (Client) | SearchBox + DropdownMenu + Avatar + lucide icons + ThemeToggle |
| `HeaderServer` | Header の Server Component ラッパー (current user / 通知数解決) | Header |
| `Footer` | グローバルフッター (リンク群 + SNS) | リンクリスト + Separator |
| `EventCard` | イベントカード本体 (`list` / `grid` variant) | Card + EventStatusBadge + HostAvatarStack + TagPill |
| `EventCardCompact` | `EventCard` の `grid` ラッパー | EventCard |
| `EventListRow` | リスト 1 行型コンパクト表示 (`showRank` 対応) | EventStatusBadge + HostAvatarStack + lucide icons |
| `EventTimeline` | Luma 風タイムライン (月見出し自動グルーピング) | EventListRow |
| `EventStickyCTA` | 詳細ページ下部のフローティング申込バー (10 状態対応) | Button + IntersectionObserver |
| `GroupCard` | グループカード (standard / sidebar / compact) | Card + Button + Avatar |
| `Pagination` | 数値ページネーション + `computePages` ヘルパー | Button + lucide chevrons |
| `MiniCalendar` | サイドバー用ミニカレンダー (開催日にドット) | grid + date-fns |
| `HostAvatarStack` | 共催アバター重ね表示 + "+N" 集約 + SR 対応 | Avatar 複数 + Tooltip |
| `RecentlyViewedEvents` | sessionStorage 連動「最近見た」パネル | Card + Link |
| `ShareModal` | OG / リンクコピー / SNS / QR / 埋め込み統合ダイアログ | Dialog + Tabs + Button + QR (svg) |
| `MarkdownEditor` | 2 カラム WYSIWYG (Markdown + ライブプレビュー) | Textarea + marked |

**合計: 13 個** (上記表 + ThemeProvider は Provider なので分類外)

> Header / HeaderServer を別カウントするか議論余地ありだが、責務 (Client / Server) が異なるため別ファイル維持。

---

## 5. Template (1) — `/components` ショーケース

UI の組み合わせを実画面と同じレイアウトで見せる「試着場」。データはダミー / 限定的。

| ページ | 役割 | URL |
| --- | --- | --- |
| Components Showcase | 全 Composite を 1 画面で網羅 | `/components` |

通常 Atomic Design の Template は「データ抜きのページ骨格」と定義されるが、
本リポジトリでは Storybook (UI カタログ) と `/components` ページ (実装ショーケース) の 2 系統で代替している。

---

## 6. Page (40+) — `src/app/**/page.tsx`

Next.js App Router の page.tsx。データ取得 + 認可 + Template 配置を行う。
Page から下のレイヤーへの依存方向は **Page → Organism → Molecule → Atom** に固定 (逆禁止)。

### 主要 Page (代表 10)

| ページ | URL | 主に呼び出す Organism |
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

## 7. 依存方向 (重要)

```
Page         (データ取得 + 認可)
  ↓ props
Organism    (複数 Molecule の組み合わせ。副作用なし or Client hook のみ)
  ↓
Molecule    (単機能。ドメイン値型を持つ)
  ↓
Atom        (汎用 UI primitives。ドメイン知識ゼロ)
```

- Atom が Molecule を import するのは **禁止**。
- Molecule が Organism を import するのは **禁止**。
- Atom が `prisma` / Server Action を import するのは **禁止**。
- Page から Atom を直接 import するのは **OK** (Card 等で枠だけ使う用途を許可)。

---

## 8. 統計

| 階層 | 数 | 配置 |
| --- | --: | --- |
| Atom | 21 | `src/components/ui/` |
| Molecule | 5 | `src/components/` |
| Organism | 13 | `src/components/` |
| Template | 1 | `src/app/components/page.tsx` |
| Page | 68 | `src/app/**/page.tsx` |

合計: Atom + Molecule + Organism = **39 reusable components**、Page まで含めると **107+**。
