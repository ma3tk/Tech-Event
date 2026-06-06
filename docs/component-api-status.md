# tech-event Component API 成熟度表

最終レビュー日: 2026-06-05 / 対象: `tech-event` v1.0 DS (21 primitive + 18 composite = 39 component)

本ドキュメントは、デザインシステムを構成する全コンポーネントの **API 安定性** を
明示するものである。利用側 (Page / 他 component) はこの表をもとに依存度を判断する。

> 関連: [`docs/design-system.md`](./design-system.md) / [`docs/component-classification.md`](./component-classification.md) /
> [`docs/design-system-changelog.md`](./design-system-changelog.md) / `src/stories/design-system/ComponentStatus.mdx`

---

## 1. Stability 基準

| Stability | 意味 | 利用許可 | 破壊的変更 |
| --- | --- | --- | --- |
| **stable** | 公開 API 凍結。Story / a11y / ダーク / RTL すべて検証済 | ◎ どこでも | minor 以下、major 移行は CHANGELOG + 移行ガイド必須 |
| **beta** | 仕様凍結に近いが、内部実装の調整が残る | ○ アプリ全域 | minor で可 (PR レビュー要) |
| **alpha** | 実験的。命名 / props 変更の可能性あり | △ 単一 page 限定 | 予告なく可 |
| **deprecated** | 廃止予定。新規利用禁止、既存は次マイルストンで置換 | × | 廃止 |

### テストカバレッジの定義

- **Storybook stories**: `.stories.tsx` に該当 component の主要 variant が網羅されている → ✓
- **axe-core**: `e2e/components-a11y.spec.ts` で critical/serious=0 → ✓
- **VRT**: `e2e/vrt-stories.spec.ts` のベースラインに含まれている → ✓
- **Coverage %** = (stories ✓ + axe ✓ + VRT ✓) / 3 × 100

---

## 2. ui (primitives) — `libs/shared/ui/`

すべて Radix UI ベース + cva。ドメイン知識なし、`tech-event` 以外でも再利用可能。

| # | Component | Stability | Variants | Coverage | Last reviewed | Known issues |
| --: | --- | --- | --: | --: | --- | --- |
| 1 | Avatar | stable | 3 (image / fallback / group) | 100 % | 2026-06-05 | — |
| 2 | Badge | stable | 4 (default / secondary / destructive / outline) | 100 % | 2026-06-05 | — |
| 3 | Button | stable | 6 × 5 = 30 (variant × size) | 100 % | 2026-06-05 | — |
| 4 | Card | stable | 5 サブパート (Header / Title / Description / Content / Footer) | 100 % | 2026-06-05 | — |
| 5 | Checkbox | stable | 3 (default / checked / indeterminate) | 100 % | 2026-06-05 | — |
| 6 | Dialog | stable | 3 (small / default / large) | 100 % | 2026-06-05 | フォーカストラップは Radix 依存 (上流追従) |
| 7 | DropdownMenu | stable | 6 (Item / Separator / Sub / Radio / Check / Group) | 100 % | 2026-06-05 | — |
| 8 | Form | beta | RHF + Zod ラッパー | 67 % | 2026-06-05 | VRT 対象外 (props 駆動のみ) |
| 9 | Input | stable | 3 sizes × error / icon | 100 % | 2026-06-05 | — |
| 10 | Label | stable | 1 | 100 % | 2026-06-05 | — |
| 11 | Popover | stable | 4 (位置 4 方向) | 100 % | 2026-06-05 | — |
| 12 | RadioGroup | stable | 2 (default / disabled) | 100 % | 2026-06-05 | — |
| 13 | Select | stable | 3 sizes | 100 % | 2026-06-05 | — |
| 14 | Separator | stable | 2 (horizontal / vertical) | 100 % | 2026-06-05 | — |
| 15 | Sheet | stable | 4 (left / right / top / bottom) | 100 % | 2026-06-05 | — |
| 16 | Skeleton | stable | 3 (line / block / circle) | 100 % | 2026-06-05 | — |
| 17 | Switch | stable | 2 (default / disabled) | 100 % | 2026-06-05 | — |
| 18 | Tabs | stable | 3 (List / Trigger / Content) | 100 % | 2026-06-05 | — |
| 19 | Textarea | stable | 3 sizes | 100 % | 2026-06-05 | — |
| 20 | Toast | stable | 4 (default / success / error / info) | 100 % | 2026-06-05 | Sonner 上流の reduced-motion 対応に依存 |
| 21 | Tooltip | stable | 2 (default / delayed) | 100 % | 2026-06-05 | — |

**Primitive 集計**: 21 / 21 が stable, 平均 Coverage **98.4 %**

---

## 3. components (composite) — `libs/shared/ui-composite/`

| # | Component | Stability | Variants | Coverage | Last reviewed | Known issues |
| --: | --- | --- | --: | --: | --- | --- |
| 22 | Breadcrumb | stable | 2 (default / with JSON-LD) | 100 % | 2026-06-05 | — |
| 23 | TagPill | stable | 4 (default / filter / selectable / outline) | 100 % | 2026-06-05 | — |
| 24 | EventStatusBadge | stable | 8 状態 × 4 visual (subtle / solid / outline / dot) = 32 | 100 % | 2026-06-05 | — |
| 25 | ParticipantBadge | stable | 3 (default / compact / lottery) | 100 % | 2026-06-05 | — |
| 26 | SearchBox | stable | 2 (default / with-filter) | 100 % | 2026-06-05 | JS なし動作 (form GET) |
| 27 | Header | stable | 2 (signed-in / guest) | 100 % | 2026-06-05 | HeaderServer と二段構成 |
| 28 | Footer | stable | 1 | 100 % | 2026-06-05 | — |
| 29 | EventCard | stable | 2 (list / grid) | 100 % | 2026-06-05 | — |
| 30 | EventCardCompact | stable | 1 (EventCard grid ラッパー) | 67 % | 2026-06-05 | story なし (EventCard で代替) |
| 31 | EventListRow | stable | 2 (default / showRank) | 100 % | 2026-06-05 | — |
| 32 | EventTimeline | stable | 1 (月見出し自動グルーピング) | 100 % | 2026-06-05 | — |
| 33 | EventStickyCTA | beta | 10 状態 | 67 % | 2026-06-05 | IntersectionObserver、story は静止状態のみ |
| 34 | GroupCard | stable | 3 (standard / sidebar / compact) | 100 % | 2026-06-05 | — |
| 35 | Pagination | stable | 1 + computePages helper | 100 % | 2026-06-05 | `aria-disabled` を `<button>` 化済 (旧 known issue 解消) |
| 36 | MiniCalendar | stable | 1 | 100 % | 2026-06-05 | — |
| 37 | HostAvatarStack | stable | 3 (1-2-3+ アバター + Tooltip) | 100 % | 2026-06-05 | — |
| 38 | ShareModal | beta | 5 タブ (link / SNS / QR / embed / native) | 67 % | 2026-06-05 | Native Share API は story 不可 (実機検証) |
| 39 | MarkdownEditor | beta | 2 (default / preview-only) | 67 % | 2026-06-05 | marked v18 依存、dynamic import |

**Composite 集計**: 15 stable + 3 beta + 0 alpha + 0 deprecated, 平均 Coverage **94.4 %**

---

## 4. 集計

| カテゴリ | 総数 | stable | beta | alpha | deprecated | 平均 Coverage |
| --- | --: | --: | --: | --: | --: | --: |
| ui (primitives) | 21 | 20 | 1 | 0 | 0 | 98.4 % |
| components (composite) | 18 | 15 | 3 | 0 | 0 | 94.4 % |
| **合計** | **39** | **35** | **4** | **0** | **0** | **96.6 %** |

→ **35 / 39 = 89.7 % が stable**, alpha / deprecated は 0 件。
DS は新規利用に対し **十分な API 安定性を保証** している。

---

## 5. レビュー運用

- **四半期に 1 回** 本ドキュメントを再評価する (次回: 2026-09-05)。
- 新規 component 追加時は本ドキュメントに行を追加し、初期 stability を `alpha` で記録。
- `stable` 昇格条件: 連続 2 マイルストン (= 約 2 ヶ月) で破壊的変更なし + Coverage ≥ 90 %。
- `deprecated` 化時は [`docs/design-system-changelog.md`](./design-system-changelog.md) に
  移行ガイド (Before / After) を明記する。

---

## 6. Storybook MDX

本表と同等の内容は Storybook の **Design System / Component Status** ページで閲覧できる
(`src/stories/design-system/ComponentStatus.mdx`)。MDX 側は対話的なフィルタ (stability / coverage) を提供する。
