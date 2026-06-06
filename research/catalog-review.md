# デザインシステムカタログ構成レビュー

レビュー日: 2026-06-06 / レビュアー: catalog-review agent
対象: `docs/catalog/` (進行中、現在は 5 階層の空ディレクトリのみ作成済) /
進行 agent の方針 (Atoms 24 / Molecules 15 / Organisms 8 / Patterns 7 / Foundations 10 / 計 64 本 + Overview + README)

参考一次資料:
- `docs/design-system.md` (一次資料、トークン+規約)
- `docs/component-taxonomy.md` (Atomic 分類: Atom 21 / Molecule 5 / Organism 13)
- `docs/design-system-audit.md` (DS v1.0 26/26 監査結果)
- `src/stories/design-system/*.mdx` (Storybook MDX 14 本)
- `libs/shared/ui/` (24 primitives) + `libs/shared/ui-composite/` (33 composite)
- `CLAUDE.md` § 4 (デザインシステム規範)

---

## エグゼクティブサマリー

### 全体評価: ★★★★☆ (4.2 / 5.0)

**良い点**:
- Atomic Design 5 階層 + Foundations を分離した構造は業界標準 (Polaris / Atlassian / Material 3) と整合的
- 既存の `component-taxonomy.md` / `design-system.md` / Storybook MDX の三層と排他的に位置付けやすい
- テンプレ 13 項目は Polaris の `Best practices / Examples / Accessibility / Related` を網羅

**減点ポイント (-0.8)**:
- 進行 agent の方針は **粒度が一律すぎる** (Button MD と Header MD が同じテンプレでは情報量バランスが崩れる)
- **役割分担ルール (catalog MD vs Storybook MDX vs `docs/design-system.md`)** が宣言されていないため重複リスク大
- tech-event 特有の **イベントドメイン状態機械 (8 status × 4 CTA 種 × 主催者/参加者)** をどこで言語化するかが不明
- 自動生成不可な「人間の判断項目」と、TS 型 / Story から自動抽出可能な項目が混在しており、メンテ負債化のリスク

### 主要な3つの推奨改善 (即座に進行 agent へ追加指示推奨)

1. **【高】`00-overview.md` 内に「役割分担マトリクス」を入れる**
   `docs/design-system.md` (規範) / `catalog/*.md` (言語化された判断基準) / Storybook MDX (視覚化) / Story (動く実物) の 4 媒体で「何をどこに書くか」を 1 表で固定。これがないと半年後に同じ情報が 4 箇所に重複する。

2. **【高】tech-event 固有の `04-patterns/` を 7 本から 9-10 本に増やし、ドメイン状態系の章を追加**
   - `patterns/event-status-orchestration.md` (8 status × バッジ/CTA/メッセージ/通知 を一元) 
   - `patterns/host-vs-participant-ui.md` (主催者 UI と参加者 UI の使い分け)
   - `patterns/cta-matrix.md` (Primary / Action-red / Secondary / Tertiary の使い分け + 申込 10 状態 CTA との対応)
   この 3 本はカタログ全体の **背骨** になる。これがあるから 24 atoms + 23 composite が一貫しているのだと示せる。

3. **【高】コンポーネント MD テンプレに「Props 表は自動生成」「Variants 表は自動生成」を明文化**
   `react-docgen` / `typedoc` / Story の `argTypes` から自動抽出する区画と、人間が書く「いつ使う/使わない/アンチパターン」を **テンプレ内で physically 分ける** (例: `<!-- AUTO-GENERATED -->` ブロック)。これで 64 本のメンテが現実的になる。

---

## 1. 構造評価

### 1.1 5 階層モデルの妥当性: ★★★★☆

| 階層 | 進行方針 | 評価 | コメント |
| --- | --- | :-: | --- |
| 01-atoms (24) | UI primitives 21 + Empty/Error/Loading State 3 | ◎ | 既存 `libs/shared/ui/` と 1:1 対応で配置が綺麗 |
| 02-molecules (15) | TagPill / Breadcrumb / Badge / Pagination / SearchBox 等 | ○ | 既存 `component-taxonomy.md` の Molecule は 5 個。15 は **+10 の新規分類**。何を Molecule とするかの境界線を `00-overview.md` に明示する必要あり |
| 03-organisms (8) | Header / Footer / EventCard / EventListRow 等 | △ | 既存 taxonomy の Organism は 13 個。8 本に絞ると **EventCardCompact / GroupCardSkeleton / RecentlyViewedEvents / EventStickyCTA / MarkdownEditor** が抜ける。意図して "代表のみ" か "全カバー" か方針確認必要 |
| 04-patterns (7) | forms / lists-and-tables / modals / navigation / feedback / cards / data-input | ○ | 一般的だが tech-event 固有のドメインパターン (status / host vs participant / CTA matrix) が欠落 |
| 05-foundations (10) | colors / typography / spacing / iconography / motion / voice-and-tone / a11y / responsive / states / theming | ◎ | 過不足なし。`voice-and-tone` と `states` が含まれているのが特に良い |

### 1.2 Patterns と Organisms の境界

進行方針では明確化されていない。推奨ルール:
- **Organism** = 単一の独立した UI セクション = 1 ファイルで完結 (Header, EventCard) → React コンポーネント実体がある
- **Pattern** = 複数の Organism / Molecule を組み合わせた "やり方" = 抽象。実装は呼び出し側 → React 実体なし、コード片で示す

このルールを `00-overview.md` で宣言すれば、後発メンテ時の "Pattern にすべきか Organism にすべきか" 議論コストがゼロになる。

### 1.3 Foundations の 10 本: 過不足

| Foundation | 必要性 | コメント |
| --- | :-: | --- |
| colors | 必須 | `design-system.md` § 2 と差別化が必要 (人間判断の使い分け原則を中心に) |
| typography | 必須 | 同上 (§ 3 と差別化) |
| spacing | 必須 | 同上 (§ 4 と差別化) |
| iconography | 必須 | `docs/icons.md` の概要に絞る |
| motion | 必須 | `docs/motion.md` の要約 |
| voice-and-tone | 推奨 | tech-event はバイリンガル (ja/en) なので tone-of-voice 章は重要 |
| a11y | 必須 | `design-system.md` § 11 の概要 |
| responsive | 必須 | breakpoint 戦略 + コンテンツ優先順位 |
| states | 必須 | `design-system.md` § 8 と差別化 (interaction state の **意味論** に絞る) |
| theming | 必須 | light / dark / high-contrast の使い分け |

**不足候補** (追加検討):
- `foundations/density.md` — connpass 路線の高密度 UI と Luma 路線の余白多めの比較。本プロジェクトは "中間" 方針なのでドキュメント化価値あり
- `foundations/data-formatting.md` — 日付 (JST, 12h/24h), 人数 (3 桁区切り), 価格 (¥ / $) の表記規範。tech-event はイベント駆動なので必須レベル
- `foundations/content-strategy.md` — 空状態のコピー戦略、エラーメッセージのトーン (これは `voice-and-tone.md` の一部にしてもよい)

**結論**: 10 本は 適切。ただし `data-formatting` を **+1** で 11 本を強く推奨。

### 1.4 目的別エントリー (初心者 / Designer / Developer)

進行方針には未記載。**追加必須**。

推奨配置 (`docs/catalog/README.md` 内):

```markdown
## 目的別エントリー

### 初めての方
1. [00-overview.md](./00-overview.md) を読む
2. [foundations/colors.md](./05-foundations/colors.md) と [foundations/typography.md](./05-foundations/typography.md)
3. [atoms/button.md](./01-atoms/button.md) と [atoms/input.md](./01-atoms/input.md)

### Designer の方
- foundations 全 10 本 → patterns 7 本 → organisms (代表 3 本)
- Figma library link → (TODO)

### Developer の方
- atoms 全 24 本 → molecules (使うもののみ)
- 関連: `libs/shared/ui/`, Storybook (`pnpm storybook`)

### PR レビュアー
- `Design System/Component Checklist` MDX → catalog の関連 MD
```

---

## 2. 業界標準との比較

### 2.1 比較表

| 項目 | tech-event 案 | Polaris | Material 3 | Atlassian DS | shadcn/ui |
| --- | --- | --- | --- | --- | --- |
| 階層モデル | Atom/Molecule/Organism/Pattern/Foundation | Component/Pattern/Token | Component/Foundation/Style | Component/Pattern/Foundation/Brand | Component のみ (フラット) |
| primitives 数 | 24 | ~70 | ~30 | ~50 | ~50 |
| 各 component の説明セクション数 | 13 | 8-10 (Best practices / Examples / A11y / Related) | 6 (Anatomy / States / Specs / Behavior / Adaptive / A11y) | 7 | 4 (Description / Usage / Examples / API) |
| Patterns/Recipes | 7 (汎用のみ) | 28 (Forms / Layouts / Loading 等) | 含む (Layouts / Navigation) | 25+ (Banner / Empty States / Wizards 等) | なし |
| Foundations/Tokens | 10 | 14 (Color / Layout / Icons / Motion / Sound 等) | 12 | 13 | なし (token 中心) |
| Voice and Tone | foundations に含む (◎) | 専用章 (Content) | あり (Writing) | 専用章 (Content design) | なし |
| ドメイン固有パターン | (今回追加推奨) | Shopify 商品 / 配送 / 決済特化 | 汎用 | Jira/Trello 特化 | 汎用 |
| Migration / Deprecation | 進行方針には未記載 | あり (Status タグ) | あり (M2→M3 migration) | あり (Status: experimental / new) | あり (Changelog) |
| Do's & Don'ts | 「アンチパターン」セクション内 | 専用列 (左右並列) | 専用 | 専用 (Usage section) | なし |
| Code playground | (Storybook 連携) | あり | あり | あり | コピペ式 |
| デザイントークン公開 | tokens.json / 自動同期 | あり | あり (Material Theme Builder) | あり | CSS vars のみ |

### 2.2 tech-event 固有の強み

1. **トークン CI 強制が CSS↔JSON 双方向** (`tokens.yml` ワークフロー) → Polaris/Atlassian と同等以上
2. **WCAG AA 全トークン適合 + 主要 10 ページ axe 0 violation** → Material 3 / Polaris と同等
3. **High Contrast テーマ** → Material 3 にもないので独自強み
4. **Storybook + MDX docs 14 本** → shadcn を超える
5. **多言語 (ja/en) 想定** → connpass を踏襲しつつ Luma の国際版機能まで対応

### 2.3 tech-event 固有の弱み (現方針時点)

1. **ドメイン固有パターン (event status / CTA 4 種 / host vs participant) が patterns に未配置**
   - Polaris の "Customer accounts" や Atlassian の "Issue panel" のような **業務文脈パターン** が欠けると "汎用 OSS DS" と区別がつかない
2. **Migration / Deprecation 状態の表現が未定義**
   - Atlassian は `experimental / new / stable / deprecated` の 4 状態を全 component に付与。tech-event も `component-api-status.md` があるのでこれを catalog 各 MD にバッジ化推奨
3. **Component playground が Storybook 単一依存**
   - Polaris は doc 内に live playground、Material 3 は Sandpack 埋込。catalog MD では難しいが Storybook へのリンク + screenshot embed で代替するルールを overview に明示
4. **Figma component link が未設定** (進行方針未記載)
   - 全 component に "Figma: TODO" プレースホルダを最初から入れておくと、後で Figma 同期したときに穴抜け検出が楽

---

## 3. コンポーネント MD テンプレートの妥当性

### 3.1 13 セクション評価

| セクション | 評価 | コメント |
| --- | :-: | --- |
| 目的 | ◎ | Polaris 同等 |
| いつ使うか | ◎ | Polaris の Best practices と整合 |
| いつ使わないか | ◎ | これがあると判断コストが激減。Material 3 にもある |
| 構造 | ○ | "Anatomy" と呼び替える方が業界標準。図解 (ASCII or 画像) 必須 |
| バリアント | ○ | Story の argTypes と重複。自動生成区画にすべき |
| サイズ | ○ | バリアント に統合してよい (Button の size など) |
| 状態 | ◎ | hover / focus / active / disabled / loading / error を網羅 |
| アクセシビリティ | ◎ | NVDA / VoiceOver の挙動を含めると Polaris 超え |
| レスポンシブ | ◎ | breakpoint 別の崩れ方を書く |
| 使用例 | ◎ | Storybook へのリンクで代替可 |
| アンチパターン | ◎ | Do's & Don'ts と統合してもよい |
| 関連 | ○ | "Related components" として隣接 atoms/molecules への横断 |
| 変更履歴 | △ | `component-api-status.md` と重複しがち。バージョン bump 時のみ書く規約に |

### 3.2 追加推奨セクション

| 追加候補 | 優先度 | 理由 |
| --- | :-: | --- |
| Do's & Don'ts (専用) | 中 | アンチパターン を分離するなら左右並列で書くと Polaris 風で読みやすい。**ただし 13→14 になる前に "アンチパターン" を "Do's & Don'ts" にリネームする** 方が情報量バランス良い |
| Performance considerations | 高 | tech-event は SSR / 動的 import が多い。`MarkdownEditor` / `ShareModal` のような重い Client comp には bundle size と render cost を明記すべき。**全 component に付ける必要はなく "Client Component かつ > 5KB" にのみ義務化** |
| テスト方針 | 中 | E2E が真実の源 (`CLAUDE.md` § 3.1) なので、各 component の Story-based / interaction test / VRT 範囲を明記すると新規 PR 時の参考になる |
| Figma component link | 高 | プレースホルダで全 component に入れる。`Figma: <!-- TODO: link -->` で穴抜けが見える |
| Migration from {prev version} | 低 | Atom 単位ではほぼ不要。`design-system-changelog.md` に集約で十分。**全 MD には不要** |
| Status badge (`experimental` / `stable` / `deprecated`) | 高 | `component-api-status.md` を catalog 各 MD のヘッダに inline 化推奨 |
| Tokens used | 中 | "この component が依存する semantic token" を列挙すると token 削除時のインパクト分析が楽 |

### 3.3 Storybook MDX docs との重複懸念

**重複しやすい箇所**:
- バリアント / サイズ / 状態 → MDX も同じことを書きがち
- コードサンプル → Story と MDX が同期しないリスク

**役割分担ルール (推奨、`00-overview.md` で宣言)**:

| 媒体 | 役割 | 例 |
| --- | --- | --- |
| `libs/shared/ui/button.tsx` | 実装 | コードのみ |
| `libs/shared/ui/button.stories.tsx` | 動く実物 | argTypes / interactions |
| `src/stories/design-system/*.mdx` | **視覚化された規範** (Why) | 色見本 / Tokens 一覧表 |
| `docs/catalog/01-atoms/button.md` | **言語化された判断基準** (When) | いつ使う/使わない/Do's & Don'ts |
| `docs/design-system.md` | **規範本体** (What) | トークン一覧 / 命名規約 |

**ルール**: catalog MD はコードサンプルを **持たない** (Storybook 参照 link のみ)。Tokens 一覧も持たない (`design-system.md` 参照 link のみ)。これで重複ゼロ。

---

## 4. Storybook MDX との分離

現状 21 MDX + 203 stories と catalog 64 MD の **役割分担ルールが未宣言** → 最大のリスク。

### 4.1 推奨ルール (再掲)

1. **catalog MD は「言語化された判断基準」** = Why / When (color sample 等の視覚資料を持たない)
2. **Storybook MDX は「視覚化された規範」** = What / How visually
3. **Storybook Story は「動く実物」** = How interactively
4. **コードサンプルは Story が唯一の出典**、catalog MD には埋め込まず link のみ
5. **トークン値は `design-system.md` が唯一の出典**、catalog MD には埋め込まず link のみ
6. catalog MD のバリアント表は **TypeScript 型から自動生成**

このルールを `00-overview.md` のトップで宣言すれば、半年後の重複事故を防げる。

---

## 5. カバレッジ

### 5.1 既存 49 components のカバレッジ

進行方針: Atoms 24 + Molecules 15 + Organisms 8 = 47 → 既存 49 を 96 % カバー (2 漏れ)

**確認推奨**:
- `EventCardCompact` / `EventListRowSkeleton` / `EventCardSkeleton` / `GroupCardSkeleton` 等のスケルトン系をどこに分類するか (Loading State atom と統合? それとも独立?)
- `Provider` 系 (`ThemeProvider` / `ToastListener` / `HeaderServer`) は catalog 対象外でよいか (taxonomy.md では "分類外" としている)
- `LanguageSwitcher` / `ThemeSwitcher` は molecules か organisms か (DropdownMenu + Button の組み合わせなので molecules 寄り)

### 5.2 ページパターン (= Templates) の扱い

進行方針には未記載。**追加強く推奨**。

```
docs/catalog/
  06-page-patterns/   ← 新規
    event-detail-layout.md      (3 カラム: sticky CTA / 本文 / sidebar)
    event-list-layout.md        (filter + list + pagination + miniCalendar)
    group-page-layout.md        (header + tabs + timeline + sidebar)
    dashboard-layout.md         (sidebar nav + main + stats)
    auth-layout.md              (centered single column)
    settings-layout.md          (tab navigation + form)
```

これは Polaris / Atlassian DS にも独立カテゴリで存在。Atomic Design の "Template" 層に相当。

### 5.3 i18n 文言ガイドライン

進行方針には `voice-and-tone.md` のみ。**不足**。

推奨追加:
- `foundations/voice-and-tone.md` (トーン全般、敬語の使い分け、ja/en の対応)
- `foundations/data-formatting.md` (日時 / 価格 / 人数の表記)
- `patterns/error-messages.md` (validation error / system error / empty state copy 集)
- `patterns/microcopy.md` (ボタン文言 / フォーム placeholder / トースト文言)

または:
- `foundations/copy/` ディレクトリを切って `voice.md` / `tone.md` / `microcopy.md` / `errors.md` / `data-formatting.md` を 5 本まとめる構成も整理しやすい

### 5.4 エラーメッセージ集 / ステータスコード / トースト文言集

**`patterns/feedback.md` に集約** が現実的:
- Toast (success / error / info / warning) の文言テンプレ
- Validation error (Zod schema からの自動生成 message vs カスタム)
- API error (HTTP 4xx / 5xx の UI 表現)
- Empty state copy (検索結果 0 / 通知 0 / 参加履歴 0)
- Confirmation dialog の文言

これは 1 MD で 200 行程度。十分に独立価値あり。

---

## 6. メンテナビリティ

### 6.1 50+ MD を継続メンテできる仕組みか

**現状方針のままでは厳しい**。理由:
- 64 MD × 13 セクション = 832 セクション。手書き維持はコスト過大
- 自動生成 / 手書き の境界が未定義
- CODEOWNERS / stale 検出ルールが未定義

### 6.2 自動生成可能な箇所

| セクション | 出典 | 自動生成手段 |
| --- | --- | --- |
| Props 表 | TypeScript 型 (`*.tsx` の `Props` interface) | `react-docgen` / `typedoc` |
| バリアント表 | `cva` の variants 設定 | コード解析 (regex でも可) |
| サイズ表 | 同上 | 同上 |
| Story リスト | `*.stories.tsx` の export | Storybook の `csf-tools` |
| Tokens used | コード内の Tailwind class / CSS var 参照 | grep ベース |
| 依存関係 (関連 components) | import 解析 | `madge` / `dependency-cruiser` |
| axe-core 結果リンク | `screenshots/components/_axe.json` | 直 link |
| 変更履歴 | git log + `design-system-changelog.md` 抜粋 | git ベース |

**推奨**: `<!-- AUTO-GENERATED:START -->` `<!-- AUTO-GENERATED:END -->` マーカーで上記を囲み、`pnpm catalog:sync` スクリプトで再生成。これがあると 64 MD のメンテが現実的。

### 6.3 CI で stale 検出

- TS 型変更 → 関連 catalog MD の Props 表が古くなる → CI で diff 検出
- 新規 component 追加 → 対応 catalog MD が存在するか CI でチェック (`scripts/check-catalog-coverage.ts`)
- `design-system-changelog.md` に書かれた変更 → 該当 catalog MD の最終更新日との乖離検出
- Story 追加 → catalog MD の "使用例" 節がリンクしているか確認

### 6.4 CODEOWNERS

64 MD を全部誰か 1 人で見るのは不可能。推奨:
- `01-atoms/` → UI primitives 担当
- `02-molecules/`, `03-organisms/` → Application 担当
- `04-patterns/` → Tech Lead + Designer
- `05-foundations/` → Designer + a11y 担当
- `00-overview.md`, `README.md` → Tech Lead

これを `.github/CODEOWNERS` に書く。

---

## 7. アクセシビリティ・観点の網羅

### 7.1 axe-core 結果との紐付け

**強く推奨**。各 component MD の A11y セクションに:
- `[axe-core CI result](../../../screenshots/components/_axe.json#button)` のような fragment 付き link
- 既知の violation がある場合は **その component MD に明示** (例: Pagination の `aria-prohibited-attr` は v1.0 で解消済だが履歴として残す)

### 7.2 スクリーンリーダー固有挙動

**含める強い推奨**。`design-system.md` § 11 にはまだない情報。catalog MD で初めて記述する価値あり:
- Button + aria-label: NVDA は "ボタン" を後置、VoiceOver は前置
- Dialog 開閉時のフォーカス trap: VoiceOver は `aria-modal` 必須、NVDA は `role="dialog"` だけで OK
- Toast 通知: `role="status"` (assertive ではなく polite) の SR 別読み上げタイミング差
- DropdownMenu の Roving tabindex: TalkBack は 1 タブで全項目を読まないので別動作

これらは Polaris / Atlassian にも書かれている "差別化情報"。

### 7.3 推奨フォーマット

各 component MD の A11y セクション内:

```markdown
## Accessibility

### キーボード操作
- Tab / Enter / Space / Escape の挙動

### スクリーンリーダー
| SR | OS | 挙動 |
| --- | --- | --- |
| NVDA | Windows | ... |
| VoiceOver | macOS / iOS | ... |
| TalkBack | Android | ... |

### axe-core 結果
- [最新走査結果](../../screenshots/components/_axe.json)
- 既知 violations: なし / N 件 (詳細 link)
```

---

## 8. i18n / l10n

### 8.1 カタログ自体のバイリンガル化

**現時点では非推奨**。理由:
- 64 MD × 2 言語 = 128 MD のメンテは非現実的
- 英語版が古くなり信頼性を失うリスク大

**推奨段階方針**:
1. **Phase 1 (現在)**: ja のみ。コード ID / Tailwind class 名 / トークン名は英語のまま (これは既存通り)
2. **Phase 2 (将来)**: `00-overview.md` と `05-foundations/*` のみ ja+en バイリンガル化
3. **Phase 3 (もし OSS 化したら)**: 全 MD バイリンガル化 + CI で同期検証

### 8.2 文言ガイド (敬語 / トーン) を Foundations に追加

**妥当**。すでに `foundations/voice-and-tone.md` が予定されているので OK。

追加推奨:
- 敬語レベル (「です・ます」固定 / 主催者向けはやや丁寧)
- 一人称 (「私たち」を使わない / システム視点で書く)
- ボタン動詞 (「保存」「キャンセル」「削除」の使い分け — 「OK」は禁止)
- エラーメッセージのトーン (責めない / 解決手段を示す)

---

## 9. このプロジェクト独自の追加すべき項目

### 9.1 ステータス表現パターン集 (強く推奨)

`patterns/event-status-orchestration.md` を **必須** で追加。

内容:
- 8 status (`open` / `full` / `waitlist` / `closed` / `cancelled` / `ended` / `upcoming` / `ongoing`) ×
- 4 表現先 (`EventStatusBadge` / `EventStickyCTA` / 通知文言 / メール件名) のマトリクス
- 状態遷移図 (募集中 → 満員 → 補欠 → 締切 → 終了)
- 色 / アイコン / コピー の対応表

これは tech-event の **背骨**。これがあるから 24 atoms + 23 composite が一貫しているのだと示せる。catalog 最重要 MD の 1 つ。

### 9.2 CTA 4 種の使い分けマトリクス (強く推奨)

`patterns/cta-matrix.md` を追加。

内容:
- Primary (brand-orange): 申込 / 続きを見る
- Action (brand-red): イベント作成 / 削除 / 退会
- Secondary: キャンセル / 戻る
- Tertiary (link): "もっと見る" / 補助操作
- ページごとの "1 ページに Primary は 1 つだけ" ルール
- `EventStickyCTA` の 10 状態 (`pre_open` / `joined_waitlist` / `joined` / `cancel_window` / ...) との対応

### 9.3 主催者 UI vs 参加者 UI

`patterns/host-vs-participant-ui.md` を追加。

内容:
- 配置の違い (主催者: 編集ボタン左上、参加者: 申込ボタン下部 sticky)
- 情報密度の違い (主催者: 統計 / フィルタ多用、参加者: 単純な閲覧)
- 色の違い (主催者: brand-red 系の管理操作、参加者: brand-orange の招待 / 申込)
- 主催者専用 UI の `<HostOnly>` ガード規約

### 9.4 その他独自パターン候補

| パターン | 価値 | 優先度 |
| --- | :-: | :-: |
| `patterns/calendar-export.md` (ICS / Google Calendar) | 中 | 中 |
| `patterns/share-strategy.md` (OG / QR / 埋め込みコード) | 中 | 中 |
| `patterns/notification-strategy.md` (通知センター / Toast / メール) | 高 | 高 |
| `patterns/timezone-handling.md` (JST 固定 / ユーザー TZ 切替) | 中 | 中 |
| `patterns/seo-structured-data.md` (JSON-LD / OG / Twitter card) | 中 | 低 |

---

## 10. 配布

### 10.1 Storybook MDX としても serve すべきか

**部分的に Yes**。

推奨方針:
1. `05-foundations/` 10 本は Storybook MDX として **重複配置** する価値あり (デザイナー / UI レビュー時の参照先として)
2. `04-patterns/` 7-10 本も Storybook MDX 化推奨 (live preview と紐付けやすい)
3. `01-atoms/` `02-molecules/` `03-organisms/` の MD は Storybook 側は既存 Story / argTypes / MDX 14 本に任せ、catalog MD は **読み物として独立** で良い

理由: Foundations / Patterns は "規範文書" で読まれ方が長い。Atoms / Molecules は "実装リファレンス" で短い。媒体特性が違う。

### 10.2 Docusaurus / Nextra で公開ドキュメントサイト化

**Phase 2 で検討。今は不要**。

現状の Storybook は GitHub Pages にデプロイされている (`storybook.yml`)。これに加えて Docusaurus を立てると 2 サイト維持コストになるため:
- **Phase 1 (現在)**: `docs/catalog/` の MD をそのまま GitHub で読む / Claude / AI agent が活用
- **Phase 2 (将来)**: Storybook の sidebar から catalog MD へ link する hub MDX (`Welcome.mdx` 拡張)
- **Phase 3 (もし OSS / 外部公開)**: Docusaurus or Nextra で本格 public site 化

### 10.3 AI エージェント活用の観点

現状の MD だけでも Claude や他の AI エージェントは十分活用できる。**ただし**:
- 各 MD の **冒頭に YAML front-matter** を入れると AI が type / status / tags を抽出しやすい

```yaml
---
title: Button
category: atom
status: stable
since: v1.0.0
deprecated: false
related: [Link, IconButton]
storybook: /story/atom-button--default
figma: TODO
---
```

これがあるとプログラマブルに catalog 全体を解析できるので、将来的に `scripts/catalog-index.ts` 等で全 component のマトリクスを自動生成できる。

---

## 業界標準比較サマリ表 (再掲・縦持ち)

| カタログ要素 | tech-event 案 | Polaris | Material 3 | Atlassian | shadcn |
| --- | --- | --- | --- | --- | --- |
| 階層 | 5 (Atom/Mol/Org/Pat/Found) | 3 (Comp/Pat/Token) | 3 (Comp/Found/Style) | 4 (Comp/Pat/Found/Brand) | 1 (Comp フラット) |
| primitives 数 | 24 | ~70 | ~30 | ~50 | ~50 |
| Patterns 章 | 7 (汎用のみ) | 28 (業務含む) | 含む | 25+ | なし |
| Foundations 章 | 10 | 14 | 12 | 13 | なし |
| Voice and Tone | foundations 内 | 専用章 | あり | 専用章 | なし |
| ドメイン固有 Pattern | (要追加) | 専用充実 | 汎用 | 専用充実 | 汎用 |
| Component セクション数 | 13 | 8-10 | 6 | 7 | 4 |
| Do's & Don'ts | アンチパターン内 | 専用左右並列 | 専用 | 専用 | なし |
| 状態 (`experimental` 等) | (要追加) | あり | あり | あり | あり |
| Migration 章 | (per-MD 要否要決定) | あり | あり | あり | あり |
| Figma link | (TODO 推奨) | あり | あり | あり | (Tweakcn) |
| 自動生成 props 表 | (推奨) | あり | あり | あり | あり |
| Token 公開 | tokens.json + CSS | JSON / CSS | Material Theme Builder | あり | CSS vars |
| A11y per-component | あり (axe link 推奨) | あり | あり | あり | minimal |
| 多言語 | ja のみ (Phase 1) | en のみ | 多言語 | en のみ | en のみ |

---

## 改善提案 Top 10 (優先度順)

1. **【高】役割分担マトリクスを `00-overview.md` に必ず入れる** — `design-system.md` (規範) / catalog MD (判断基準) / Storybook MDX (視覚化) / Story (実物) の 4 媒体で「何をどこに書くか」を 1 表で固定。最重要。

2. **【高】tech-event 固有 patterns 3 本を追加** — `patterns/event-status-orchestration.md` / `patterns/cta-matrix.md` / `patterns/host-vs-participant-ui.md`。これがあるから catalog 全体が一貫していると示せる。

3. **【高】コンポーネント MD テンプレに「自動生成区画」を物理的に分離** — `<!-- AUTO-GENERATED:START -->` で Props 表 / Variants 表 / Tokens used を囲む規約をテンプレに明文化。手書き部分は「いつ使う/使わない/Do's & Don'ts」のみに絞る。

4. **【高】Status badge (`experimental` / `stable` / `deprecated`) を全 MD ヘッダに付与** — `component-api-status.md` を catalog 各 MD のヘッダに inline 化。YAML front-matter で。

5. **【高】Page Patterns (Template 層) カテゴリを追加** — `06-page-patterns/` を新設し event-detail / event-list / group / dashboard / auth / settings の 6 ページレイアウトを文書化。Atomic Design の Template に相当。

6. **【中】Figma link プレースホルダを全 component MD に最初から入れる** — 後で穴抜けが見える。YAML front-matter の `figma: TODO` で OK。

7. **【中】Performance considerations セクションを "Client comp かつ > 5KB" にのみ義務化** — `MarkdownEditor` / `ShareModal` 等の重い Client comp に bundle size / render cost を明記。

8. **【中】`foundations/data-formatting.md` を追加 (Foundations 11 本に)** — 日付 / 価格 / 人数の表記規範。tech-event はイベント駆動なので必須レベル。

9. **【中】Feedback / Microcopy 集約 MD を追加** — `patterns/feedback.md` に Toast / Validation error / Empty state copy / Confirmation dialog 文言テンプレを集約。

10. **【中】`scripts/catalog:sync` + `scripts/catalog:coverage` の自動化 CI を追加** — Props 表自動再生成 + 新規 component に対する catalog MD 存在チェック。これがないと 6 ヶ月後に stale 化する。

---

## 追加すべき MD ファイル一覧

| パス | 種別 | 優先度 | 理由 |
| --- | --- | :-: | --- |
| `05-foundations/voice-and-tone.md` | 既予定 | — | OK |
| `05-foundations/data-formatting.md` | **新規** | 高 | 日付 / 価格 / 人数の表記規範 |
| `04-patterns/event-status-orchestration.md` | **新規** | 高 | 8 status × 4 表現先のマトリクス |
| `04-patterns/cta-matrix.md` | **新規** | 高 | Primary / Action / Secondary / Tertiary + 10 状態 CTA |
| `04-patterns/host-vs-participant-ui.md` | **新規** | 高 | 主催者 UI と参加者 UI の使い分け |
| `04-patterns/feedback.md` | (既予定の中身を拡充) | 中 | Toast / Validation error / Empty state copy 集 |
| `04-patterns/notification-strategy.md` | **新規** | 中 | 通知センター / Toast / メール の使い分け |
| `06-page-patterns/event-detail-layout.md` | **新規** | 高 | 3 カラムレイアウト規範 |
| `06-page-patterns/event-list-layout.md` | **新規** | 中 | filter + list + pagination |
| `06-page-patterns/group-page-layout.md` | **新規** | 中 | header + tabs + timeline + sidebar |
| `06-page-patterns/dashboard-layout.md` | **新規** | 中 | sidebar nav + main + stats |
| `06-page-patterns/auth-layout.md` | **新規** | 低 | centered single column |
| `00-overview.md` 内に「役割分担マトリクス」 | (既予定の中身を拡充) | 最高 | 4 媒体の役割 |
| `00-overview.md` 内に「目的別エントリー」 | (既予定の中身を拡充) | 高 | 初心者 / Designer / Developer / Reviewer |

---

## 削減できる MD

| パス | 理由 |
| --- | --- |
| `01-atoms/loading-state.md` | `Skeleton` MD と統合可能 (重複大) |
| `01-atoms/empty-state.md` | `patterns/feedback.md` に統合し、atom MD は最小に |
| `01-atoms/error-state.md` | 同上 |
| 各 MD の "Migration from {prev version}" | atom 単位ではほぼ不要。`design-system-changelog.md` に集約 |
| 各 MD の "サイズ" 独立節 | "バリアント" に統合可 (Button size 等) |

> 上記は **強制削減ではなく統合推奨**。Loading/Error/Empty State は state という概念の独立 atom として価値はあるので、テンプレ 13 セクションをフルに書く必要はなく **5 セクション (目的 / いつ使う / 構造 / 関連 / 例)** の軽量版 MD でよい。

---

## 自動化可能な箇所

| 項目 | 出典 | 手段 | 優先度 |
| --- | --- | --- | :-: |
| Props 表 | `*.tsx` の Props interface | `react-docgen` / `typedoc` | 高 |
| Variants / Sizes 表 | `cva` 設定 | コード解析 (regex / AST) | 高 |
| Story リスト | `*.stories.tsx` exports | `csf-tools` | 高 |
| Tokens used | コード内 Tailwind class / CSS var | grep 集計 | 中 |
| 依存関係 (関連 components) | import 解析 | `madge` / `dependency-cruiser` | 中 |
| axe-core 結果 | `screenshots/components/_axe.json` | 直 link | 高 |
| 変更履歴 | git log + `design-system-changelog.md` | 抜粋スクリプト | 中 |
| カバレッジ検証 | 新規 component と catalog MD の対応 | `scripts/check-catalog-coverage.ts` | 高 |
| Stale 検出 | TS 型 hash と catalog MD の Props 表 hash | CI で diff | 中 |

実装スクリプト推奨:
```
scripts/
  catalog-sync.ts        # AUTO-GENERATED 区画を全 MD で再生成
  catalog-coverage.ts    # 既存 component に対する catalog MD 存在チェック
  catalog-validate.ts    # YAML front-matter スキーマ検証
  catalog-stale-check.ts # TS 型変更 vs Props 表 hash の diff 検出
```

CI ワークフロー (`.github/workflows/catalog.yml`):
- `pnpm catalog:coverage` で新規 component の文書化漏れ検出
- `pnpm catalog:validate` で front-matter スキーマ検証
- PR diff で catalog MD の手書き部分が AUTO-GENERATED 区画を浸食していないか検証

---

## 結論

### 進行中の方針は: **一部修正** (大幅再構築は不要)

進行 agent の方針 (Atoms 24 / Molecules 15 / Organisms 8 / Patterns 7 / Foundations 10 = 64 本) は **構造として妥当**。Atomic Design 5 階層は業界標準と整合的で、Foundations の 10 本も過不足なく、Polaris / Atlassian / Material 3 を概ね踏襲している。

ただし、以下を **即座に進行 agent へ追加指示** することを強く推奨:

### 即座に進行 agent へ追加指示すべき項目

1. **`00-overview.md` に 4 媒体役割分担マトリクスを必ず入れる** (catalog MD / Storybook MDX / `design-system.md` / Story の使い分け)
2. **tech-event 固有 patterns 3 本を追加発注**: `event-status-orchestration.md` / `cta-matrix.md` / `host-vs-participant-ui.md`
3. **`06-page-patterns/` カテゴリを新設し 6 本** (event-detail / event-list / group / dashboard / auth / settings)
4. **`foundations/data-formatting.md` を Foundations に +1** (10 → 11 本)
5. **各 component MD の冒頭に YAML front-matter** (`title` / `category` / `status` / `since` / `deprecated` / `related` / `storybook` / `figma` の 8 項目)
6. **MD テンプレに `<!-- AUTO-GENERATED:START -->` 区画を物理的に明示** (Props 表 / Variants 表 / Tokens used を手書き対象から除外)
7. **`00-overview.md` に「目的別エントリー」セクション** (初心者 / Designer / Developer / Reviewer)
8. **Loading/Empty/Error State の 3 atom は軽量版テンプレ (5 セクション)** で書く (フル 13 セクションは過剰)
9. **Figma link プレースホルダを全 MD に最初から TODO で入れる** (後の穴抜け検出を楽に)
10. **CI 自動化スクリプト 4 本の追加実装** (catalog-sync / coverage / validate / stale-check)

### 最終評価

- **構造妥当性**: ★★★★☆ (4.5) — Atomic Design 5 階層は正しい
- **業界標準整合性**: ★★★★☆ (4.0) — Polaris / Atlassian と肩を並べるが Patterns カバレッジが薄い
- **テンプレート品質**: ★★★★☆ (4.2) — 13 セクションは適切だが自動生成区画の分離が必要
- **Storybook 分離**: ★★★☆☆ (3.0) — 役割分担ルールが宣言されていない (最大課題)
- **カバレッジ**: ★★★★☆ (4.0) — 49 components 96% カバーは良いが Page Patterns 不足
- **メンテナビリティ**: ★★★☆☆ (3.2) — 自動化前提の設計になっていない (要追加)
- **ドメイン特化度**: ★★★☆☆ (3.0) — tech-event 固有の patterns 3 本がないと汎用 OSS DS と区別不能 (最大の伸びしろ)

**総合 ★★★★☆ (4.2 / 5.0)** — 即座に進行可能な方針。ただし上記 10 項目を追加指示すれば ★★★★★ に到達可能。
