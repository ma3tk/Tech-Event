# tech-event デザインシステムカタログ

> Design.md 準拠 | Storybook (視覚) と相互補完する **言語化された使い分けガイド**

このカタログは、Storybook (live visual) と並んで「**いつ何を、どう使うか**」を言語化した一次資料です。
コンポーネント実装の細部は `libs/shared/ui/*.tsx` / `libs/shared/ui-composite/*.tsx` を、視覚は Storybook (`pnpm storybook` → http://localhost:6006) を、本カタログは **設計意図・使い分け・アンチパターン** を担当します。

---

## 1. 階層 (5 layers)

| 階層 | 場所 | 説明 |
|---|---|---|
| [00 Overview](./00-overview.md) | このフォルダ直下 | デザインシステム概要 (Design.md の要約) |
| [01 Atoms](./01-atoms/) | `libs/shared/ui/` | Radix UI + CVA primitives (21 個) |
| [02 Molecules](./02-molecules/) | `libs/shared/ui-composite/` の小さい組合せ | 単機能の小ユニット |
| [03 Organisms](./03-organisms/) | `libs/shared/ui-composite/` の大きい組合せ | 自立した UI セクション |
| [04 Patterns](./04-patterns/) | 構成パターン | 複数コンポーネント組合せの典型 |
| [05 Foundations](./05-foundations/) | デザイン言語 | colors / typography / spacing / motion 等 |

---

## 2. 初めて使う人へ

1. まず [`00-overview.md`](./00-overview.md) を読んで全体観をつかむ
2. 自分が触ろうとしているコンポーネントを **早見表** (下) で探す
3. 該当 MD の **「いつ使うか」「いつ使わないか」「アンチパターン」** を読む
4. Storybook で実物を見ながら variant を選ぶ
5. コピペした後、対応する [04 Patterns](./04-patterns/) を読んで構成を整える

困ったら **[`05-foundations/`](./05-foundations/)** に立ち戻る。色 / 文字 / 間 / 動きの 4 軸で判断基準が言語化されています。

---

## 3. コンポーネント早見表 (アルファベット順)

### Atoms (21)
| Component | Path | 概要 |
|---|---|---|
| Avatar | [01-atoms/avatar.md](./01-atoms/avatar.md) | アバター画像 + フォールバック |
| Badge | [01-atoms/badge.md](./01-atoms/badge.md) | 小ラベル / ステータス bit |
| Button | [01-atoms/button.md](./01-atoms/button.md) | ボタン (6 variant × 5 size) |
| Card | [01-atoms/card.md](./01-atoms/card.md) | カード枠 (Header / Title / Content / Footer) |
| Checkbox | [01-atoms/checkbox.md](./01-atoms/checkbox.md) | チェック / indeterminate 対応 |
| Dialog | [01-atoms/dialog.md](./01-atoms/dialog.md) | モーダルダイアログ |
| DropdownMenu | [01-atoms/dropdown-menu.md](./01-atoms/dropdown-menu.md) | ドロップダウンメニュー |
| EmptyState | [01-atoms/empty-state.md](./01-atoms/empty-state.md) | 空表示 |
| ErrorState | [01-atoms/error-state.md](./01-atoms/error-state.md) | エラー表示 |
| Form | [01-atoms/form.md](./01-atoms/form.md) | RHF + Zod ラッパー |
| Input | [01-atoms/input.md](./01-atoms/input.md) | テキスト入力 |
| Label | [01-atoms/label.md](./01-atoms/label.md) | フォームラベル |
| LoadingState | [01-atoms/loading-state.md](./01-atoms/loading-state.md) | ローディング表示 |
| Popover | [01-atoms/popover.md](./01-atoms/popover.md) | ポップオーバー |
| RadioGroup | [01-atoms/radio-group.md](./01-atoms/radio-group.md) | ラジオグループ |
| Select | [01-atoms/select.md](./01-atoms/select.md) | セレクトボックス |
| Separator | [01-atoms/separator.md](./01-atoms/separator.md) | 区切り線 |
| Sheet | [01-atoms/sheet.md](./01-atoms/sheet.md) | サイドシート |
| Skeleton | [01-atoms/skeleton.md](./01-atoms/skeleton.md) | ローディング骨格 |
| Switch | [01-atoms/switch.md](./01-atoms/switch.md) | トグルスイッチ |
| Tabs | [01-atoms/tabs.md](./01-atoms/tabs.md) | タブ |
| Textarea | [01-atoms/textarea.md](./01-atoms/textarea.md) | 複数行入力 |
| Toast | [01-atoms/toast.md](./01-atoms/toast.md) | 通知トースト |
| Tooltip | [01-atoms/tooltip.md](./01-atoms/tooltip.md) | ツールチップ |

### Molecules (15)
| Component | Path | 概要 |
|---|---|---|
| Breadcrumb | [02-molecules/breadcrumb.md](./02-molecules/breadcrumb.md) | パンくず |
| EventStatusBadge | [02-molecules/event-status-badge.md](./02-molecules/event-status-badge.md) | イベント 8 状態バッジ |
| EventStickyCTA | [02-molecules/event-sticky-cta.md](./02-molecules/event-sticky-cta.md) | フローティング申込バー |
| HostAvatarStack | [02-molecules/host-avatar-stack.md](./02-molecules/host-avatar-stack.md) | 共催アバター重ね |
| LanguageSwitcher | [02-molecules/language-switcher.md](./02-molecules/language-switcher.md) | 言語切替 |
| MarkdownEditor | [02-molecules/markdown-editor.md](./02-molecules/markdown-editor.md) | 2 カラム Markdown |
| MiniCalendar | [02-molecules/mini-calendar.md](./02-molecules/mini-calendar.md) | サイドバー用カレンダー |
| Pagination | [02-molecules/pagination.md](./02-molecules/pagination.md) | ページネーション |
| ParticipantBadge | [02-molecules/participant-badge.md](./02-molecules/participant-badge.md) | 参加者アバター + 名 |
| RecentlyViewedEvents | [02-molecules/recently-viewed-events.md](./02-molecules/recently-viewed-events.md) | sessionStorage 連動 |
| SearchBox | [02-molecules/search-box.md](./02-molecules/search-box.md) | 検索フォーム |
| ShareModal | [02-molecules/share-modal.md](./02-molecules/share-modal.md) | OG/SNS/QR シェア |
| TagPill | [02-molecules/tag-pill.md](./02-molecules/tag-pill.md) | タグ表示 |
| ThemeSwitcher | [02-molecules/theme-switcher.md](./02-molecules/theme-switcher.md) | テーマ切替 |
| UserMenuDropdown | [02-molecules/user-menu-dropdown.md](./02-molecules/user-menu-dropdown.md) | ユーザーメニュー |

### Organisms (8)
| Component | Path | 概要 |
|---|---|---|
| EventCard | [03-organisms/event-card.md](./03-organisms/event-card.md) | イベントカード |
| EventCardCompact | [03-organisms/event-card-compact.md](./03-organisms/event-card-compact.md) | グリッド表示 |
| EventListRow | [03-organisms/event-list-row.md](./03-organisms/event-list-row.md) | 1 行リスト |
| EventTimeline | [03-organisms/event-timeline.md](./03-organisms/event-timeline.md) | Luma 風タイムライン |
| Footer | [03-organisms/footer.md](./03-organisms/footer.md) | グローバルフッター |
| GroupCard | [03-organisms/group-card.md](./03-organisms/group-card.md) | グループカード |
| Header | [03-organisms/header.md](./03-organisms/header.md) | グローバルヘッダー (Client) |
| HeaderServer | [03-organisms/header-server.md](./03-organisms/header-server.md) | Header の Server ラッパー |

### Patterns (7)
| Pattern | Path |
|---|---|
| Forms | [04-patterns/forms.md](./04-patterns/forms.md) |
| Lists and tables | [04-patterns/lists-and-tables.md](./04-patterns/lists-and-tables.md) |
| Modals and sheets | [04-patterns/modals-and-sheets.md](./04-patterns/modals-and-sheets.md) |
| Navigation | [04-patterns/navigation.md](./04-patterns/navigation.md) |
| Feedback | [04-patterns/feedback.md](./04-patterns/feedback.md) |
| Cards | [04-patterns/cards.md](./04-patterns/cards.md) |
| Data input | [04-patterns/data-input.md](./04-patterns/data-input.md) |

### Foundations (10)
| Foundation | Path |
|---|---|
| Colors | [05-foundations/colors.md](./05-foundations/colors.md) |
| Typography | [05-foundations/typography.md](./05-foundations/typography.md) |
| Spacing | [05-foundations/spacing.md](./05-foundations/spacing.md) |
| Iconography | [05-foundations/iconography.md](./05-foundations/iconography.md) |
| Motion | [05-foundations/motion.md](./05-foundations/motion.md) |
| Voice and tone | [05-foundations/voice-and-tone.md](./05-foundations/voice-and-tone.md) |
| Accessibility | [05-foundations/accessibility.md](./05-foundations/accessibility.md) |
| Responsive | [05-foundations/responsive.md](./05-foundations/responsive.md) |
| States | [05-foundations/states.md](./05-foundations/states.md) |
| Theming | [05-foundations/theming.md](./05-foundations/theming.md) |

---

## 4. Storybook との対応

- 視覚 (variant / state の見え方) → **Storybook**
- 言語 (使い分け / アンチパターン / 設計意図) → **このカタログ**

各カタログ MD 冒頭に Storybook へのリンクを記載しています。逆に主要 Storybook の Meta description にもカタログへのリンクを追加しています。

---

## 5. 関連ドキュメント

- [`Design.md`](../../Design.md) — トップレベル規範 (本カタログの上位文書)
- [`docs/design-system.md`](../design-system.md) — トークン詳細・全コンポーネント仕様
- [`docs/component-taxonomy.md`](../component-taxonomy.md) — Atomic 分類
- [`docs/motion.md`](../motion.md) — モーション詳細
- [`docs/icons.md`](../icons.md) — アイコン規約

---

## 6. 更新ポリシー

- 新規コンポーネント追加時は **必ず** 対応する MD を作成する (テンプレートを使う)
- 既存コンポーネントの propsAPI 変更時は MD の「使用例」「バリアント」「アンチパターン」を更新
- ブランド変更・トークン追加時は [`05-foundations/colors.md`](./05-foundations/colors.md) と [`docs/design-system.md`](../design-system.md) を同期
