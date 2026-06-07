# tech-event デザインシステムカタログ

> Design.md + Personas.md 準拠 | **Storybook MDX で実物 Live Preview 込み** に視覚化される **言語化された使い分けガイド**

このカタログは、Storybook (live visual) と並んで「**いつ何を、どう使うか**」を言語化した一次資料です。
コンポーネント実装の細部は `libs/shared/ui/*.tsx` / `libs/shared/ui-composite/*.tsx` を、本カタログ MD は **設計意図・使い分け・アンチパターン (テキスト source of truth)** を担当し、各 MD の内容は対応する Storybook MDX (`{name}.docs.mdx`) で **言語化テキスト + 実物 Canvas + Controls** として 1 ページに統合されます。

> **重要**: ドキュメント追加・更新時は必ず [`00-overview.md` §0 「4 媒体役割分担マトリクス」](./00-overview.md#0-4-媒体役割分担マトリクス-最重要) を読むこと。**何をどこに書くか** が固定されています (半年で重複事故しないために)。

### MD と MDX の関係 (2026-06-07 改訂)

- `docs/catalog/ui/button.md` — **テキスト source of truth** (このファイルを編集する)
- `libs/shared/ui/src/button.docs.mdx` — 上記 MD を取り込み、`<Canvas of={ButtonStories.Default}>` 等で実物プレビューを追加した Storybook ページ
- 生成 / 同期: `node scripts/gen-catalog-mdx.mjs --force`、ズレ検知: `node scripts/sync-catalog-mdx.mjs`
- ローカルで Storybook 起動: `pnpm storybook` → http://localhost:6006 → 各 component の「Docs」タブ

---

## 1. 階層 (shadcn/ui スタイル 4 カテゴリ + Overview)

shadcn/ui 公式の分類 (https://ui.shadcn.com/) に倣う。

| カテゴリ | 場所 | 説明 |
|---|---|---|
| [00 Overview](./00-overview.md) | このフォルダ直下 | デザインシステム概要 (Design.md の要約) |
| [ui](./ui/) | `libs/shared/ui/` | Radix UI + CVA primitives (24 個) |
| [components](./components/) | `libs/shared/ui-composite/` | composite (23 個、機能を持った組み合わせ部品) |
| [blocks](./blocks/) | カタログのみ | 構成パターン (10 個、複数 component を組み合わせた UI セクション) |
| [foundations](./foundations/) | `src/styles/*` 他 | デザイン言語 (10 個、colors / typography / spacing / motion 等) |

> 旧 Atomic Design 命名 (atoms / molecules / organisms / patterns) との対応は [`../component-classification.md`](../component-classification.md) 末尾の対応表を参照。

---

## 2. 初めて使う人へ

1. まず [`00-overview.md`](./00-overview.md) を読んで全体観をつかむ
2. 自分が触ろうとしているコンポーネントを **早見表** (下) で探す
3. 該当 MD の **「いつ使うか」「いつ使わないか」「アンチパターン」** を読む
4. Storybook で実物を見ながら variant を選ぶ
5. コピペした後、対応する [blocks](./blocks/) を読んで構成を整える

困ったら **[`foundations/`](./foundations/)** に立ち戻る。色 / 文字 / 間 / 動きの 4 軸で判断基準が言語化されています。

---

## 3. コンポーネント早見表 (アルファベット順)

### ui (24) — Radix UI primitives
| Component | Path | 概要 |
|---|---|---|
| Avatar | [ui/avatar.md](./ui/avatar.md) | アバター画像 + フォールバック |
| Badge | [ui/badge.md](./ui/badge.md) | 小ラベル / ステータス bit |
| Button | [ui/button.md](./ui/button.md) | ボタン (6 variant × 5 size) |
| Card | [ui/card.md](./ui/card.md) | カード枠 (Header / Title / Content / Footer) |
| Checkbox | [ui/checkbox.md](./ui/checkbox.md) | チェック / indeterminate 対応 |
| Dialog | [ui/dialog.md](./ui/dialog.md) | モーダルダイアログ |
| DropdownMenu | [ui/dropdown-menu.md](./ui/dropdown-menu.md) | ドロップダウンメニュー |
| EmptyState | [ui/empty-state.md](./ui/empty-state.md) | 空表示 |
| ErrorState | [ui/error-state.md](./ui/error-state.md) | エラー表示 |
| Form | [ui/form.md](./ui/form.md) | RHF + Zod ラッパー |
| Input | [ui/input.md](./ui/input.md) | テキスト入力 |
| Label | [ui/label.md](./ui/label.md) | フォームラベル |
| LoadingState | [ui/loading-state.md](./ui/loading-state.md) | ローディング表示 |
| Popover | [ui/popover.md](./ui/popover.md) | ポップオーバー |
| RadioGroup | [ui/radio-group.md](./ui/radio-group.md) | ラジオグループ |
| Select | [ui/select.md](./ui/select.md) | セレクトボックス |
| Separator | [ui/separator.md](./ui/separator.md) | 区切り線 |
| Sheet | [ui/sheet.md](./ui/sheet.md) | サイドシート |
| Skeleton | [ui/skeleton.md](./ui/skeleton.md) | ローディング骨格 |
| Switch | [ui/switch.md](./ui/switch.md) | トグルスイッチ |
| Tabs | [ui/tabs.md](./ui/tabs.md) | タブ |
| Textarea | [ui/textarea.md](./ui/textarea.md) | 複数行入力 |
| Toast | [ui/toast.md](./ui/toast.md) | 通知トースト |
| Tooltip | [ui/tooltip.md](./ui/tooltip.md) | ツールチップ |

### components (23) — composite (composition of ui primitives)
| Component | Path | 概要 |
|---|---|---|
| Breadcrumb | [components/breadcrumb.md](./components/breadcrumb.md) | パンくず |
| EventCard | [components/event-card.md](./components/event-card.md) | イベントカード |
| EventCardCompact | [components/event-card-compact.md](./components/event-card-compact.md) | グリッド表示 |
| EventListRow | [components/event-list-row.md](./components/event-list-row.md) | 1 行リスト |
| EventStatusBadge | [components/event-status-badge.md](./components/event-status-badge.md) | イベント 8 状態バッジ |
| EventStickyCTA | [components/event-sticky-cta.md](./components/event-sticky-cta.md) | フローティング申込バー |
| EventTimeline | [components/event-timeline.md](./components/event-timeline.md) | Luma 風タイムライン |
| Footer | [components/footer.md](./components/footer.md) | グローバルフッター |
| GroupCard | [components/group-card.md](./components/group-card.md) | グループカード |
| Header | [components/header.md](./components/header.md) | グローバルヘッダー (Client) |
| HeaderServer | [components/header-server.md](./components/header-server.md) | Header の Server ラッパー |
| HostAvatarStack | [components/host-avatar-stack.md](./components/host-avatar-stack.md) | 共催アバター重ね |
| LanguageSwitcher | [components/language-switcher.md](./components/language-switcher.md) | 言語切替 |
| MarkdownEditor | [components/markdown-editor.md](./components/markdown-editor.md) | 2 カラム Markdown |
| MiniCalendar | [components/mini-calendar.md](./components/mini-calendar.md) | サイドバー用カレンダー |
| Pagination | [components/pagination.md](./components/pagination.md) | ページネーション |
| ParticipantBadge | [components/participant-badge.md](./components/participant-badge.md) | 参加者アバター + 名 |
| RecentlyViewedEvents | [components/recently-viewed-events.md](./components/recently-viewed-events.md) | sessionStorage 連動 |
| SearchBox | [components/search-box.md](./components/search-box.md) | 検索フォーム |
| ShareModal | [components/share-modal.md](./components/share-modal.md) | OG/SNS/QR シェア |
| TagPill | [components/tag-pill.md](./components/tag-pill.md) | タグ表示 |
| ThemeSwitcher | [components/theme-switcher.md](./components/theme-switcher.md) | テーマ切替 |
| UserMenuDropdown | [components/user-menu-dropdown.md](./components/user-menu-dropdown.md) | ユーザーメニュー |

### blocks (10)

**汎用 (7)**
| Block | Path |
|---|---|
| Forms | [blocks/forms.md](./blocks/forms.md) |
| Lists and tables | [blocks/lists-and-tables.md](./blocks/lists-and-tables.md) |
| Modals and sheets | [blocks/modals-and-sheets.md](./blocks/modals-and-sheets.md) |
| Navigation | [blocks/navigation.md](./blocks/navigation.md) |
| Feedback | [blocks/feedback.md](./blocks/feedback.md) |
| Cards | [blocks/cards.md](./blocks/cards.md) |
| Data input | [blocks/data-input.md](./blocks/data-input.md) |

**tech-event ドメイン固有 (3)** — カタログ全体の **背骨**。Badge / Button / Card / Sticky CTA / Toast はすべてここに従う。
| Block | Path | 何を解く |
|---|---|---|
| Event status orchestration | [blocks/event-status-orchestration.md](./blocks/event-status-orchestration.md) | 8 ステータス (open/full/waitlist/closed/cancelled/ended/upcoming/ongoing) の状態機械と UI 表現の一貫性 |
| CTA matrix | [blocks/cta-matrix.md](./blocks/cta-matrix.md) | 4 CTA (参加申込/補欠登録/抽選に申し込む/参加リクエストを送信) の使い分け + multi-state ボタン設計 |
| Host vs participant UI | [blocks/host-vs-participant-ui.md](./blocks/host-vs-participant-ui.md) | 主催者 (P6/P7/P8) と参加者 (P1-P5) で見せ方が変わるパターン (情報密度・権限境界・dashboard) |

### foundations (10)
| Foundation | Path |
|---|---|
| Colors | [foundations/colors.md](./foundations/colors.md) |
| Typography | [foundations/typography.md](./foundations/typography.md) |
| Spacing | [foundations/spacing.md](./foundations/spacing.md) |
| Iconography | [foundations/iconography.md](./foundations/iconography.md) |
| Motion | [foundations/motion.md](./foundations/motion.md) |
| Voice and tone | [foundations/voice-and-tone.md](./foundations/voice-and-tone.md) |
| Accessibility | [foundations/accessibility.md](./foundations/accessibility.md) |
| Responsive | [foundations/responsive.md](./foundations/responsive.md) |
| States | [foundations/states.md](./foundations/states.md) |
| Theming | [foundations/theming.md](./foundations/theming.md) |

---

## 4. Storybook との対応

- 視覚 (variant / state の見え方) → **Storybook**
- 言語 (使い分け / アンチパターン / 設計意図) → **このカタログ**

各カタログ MD 冒頭に Storybook へのリンクを記載しています。逆に主要 Storybook の Meta description にもカタログへのリンクを追加しています。

Storybook sidebar の順序: Welcome → Design System (MDX) → UI (primitives) → Components (composite) → Blocks (patterns)

---

## 5. 関連ドキュメント

- [`Design.md`](../../Design.md) — トップレベル規範 (本カタログの上位文書)
- [`docs/design-system.md`](../design-system.md) — トークン詳細・全コンポーネント仕様
- [`docs/component-classification.md`](../component-classification.md) — コンポーネント分類 (shadcn/ui スタイル) + 旧 Atomic 対応表
- [`docs/motion.md`](../motion.md) — モーション詳細
- [`docs/icons.md`](../icons.md) — アイコン規約

---

## 6. 更新ポリシー

- 新規コンポーネント追加時は **必ず** 対応する MD を作成する (テンプレートを使う)
- 既存コンポーネントの propsAPI 変更時は MD の「使用例」「バリアント」「アンチパターン」を更新
- ブランド変更・トークン追加時は [`foundations/colors.md`](./foundations/colors.md) と [`docs/design-system.md`](../design-system.md) を同期
