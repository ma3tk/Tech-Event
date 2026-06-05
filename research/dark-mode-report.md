# Dark mode 検証レポート

## 概要

tech-event クローンの主要 10 ページにおける dark mode の視覚検証 / a11y チェックの結果まとめ。
`ThemeProvider` (`src/components/ThemeProvider.tsx`) と `<html data-theme>` 切替の仕組みを使い、
`localStorage["tech-event:theme"] = "dark"` を E2E で注入したうえでスクショとアクセシビリティ走査を行った。

- 検証対象: `/, /explore, /event/1, /group/findy, /user/fast_moon_169, /calendar/ai-developers, /ranking, /discover, /bookmarks, /notifications`
- スクショ: `screenshots/clone-dark/*.png` (10 枚) と `screenshots/light-dark/*.png` (10 枚)
- 視覚回帰ベースライン: `e2e/visual-compare-dark.spec.ts-snapshots/*.png` (10 枚)
- a11y サマリ: `screenshots/components/_axe-dark.json`
- 関連 E2E: `e2e/visual-compare-dark.spec.ts` / `e2e/dark-mode.spec.ts` / `e2e/a11y-dark.spec.ts`

## ページ別 light vs dark

横並び画像は `pnpm tsx scripts/build-light-dark-comparison.ts` で `screenshots/light-dark/<name>.png` に生成される。

| ページ | light | dark | 並列比較 | 観察 |
| --- | --- | --- | --- | --- |
| top (`/`) | `screenshots/clone/top.png` | `screenshots/clone-dark/top.png` | `screenshots/light-dark/top.png` | カテゴリカードのカラーが映え、ヒーローのオレンジ系 CTA も視認性良好。dark で特に見栄えがよい。 |
| explore (`/explore`) | `screenshots/clone/explore.png` | `screenshots/clone-dark/explore.png` | `screenshots/light-dark/explore.png` | カード/サイドバーともに整っている。フィルタチップのアクティブ色も読める。 |
| event-detail (`/event/1`) | `screenshots/clone/event-detail.png` | `screenshots/clone-dark/event-detail.png` | `screenshots/light-dark/event-detail.png` | 本文/サイドバーの分離は維持。`color-contrast` 1 件 (本文中の補助テキスト)。 |
| group-detail (`/group/findy`) | `screenshots/clone/group-detail.png` | `screenshots/clone-dark/group-detail.png` | `screenshots/light-dark/group-detail.png` | ヘッダ写真の上に浮く group 名のコントラストが light より高く好印象。 |
| user-profile (`/user/fast_moon_169`) | `screenshots/clone/user-profile.png` | `screenshots/clone-dark/user-profile.png` | `screenshots/light-dark/user-profile.png` | 「他のユーザー」グリッドの青タイル文字は dark でやや沈むが許容範囲。 |
| calendar-ai (`/calendar/ai-developers`) | `screenshots/clone/calendar-ai.png` | `screenshots/clone-dark/calendar-ai.png` | `screenshots/light-dark/calendar-ai.png` | ヒーロー写真の縁取りが暗背景に溶け込み、最も dark 適性が高いページの一つ。 |
| ranking (`/ranking`) | `screenshots/clone/ranking.png` | `screenshots/clone-dark/ranking.png` | `screenshots/light-dark/ranking.png` | 上位 3 位の金/銀/銅バッジは dark でより目立つ。リスト本体も読みやすい。 |
| discover (`/discover`) | `screenshots/clone/discover.png` | `screenshots/clone-dark/discover.png` | `screenshots/light-dark/discover.png` | カテゴリカードのグラデが dark で発色良し。検索バーの outline も維持。 |
| bookmarks (`/bookmarks`) | `screenshots/clone/bookmarks.png` | `screenshots/clone-dark/bookmarks.png` | `screenshots/light-dark/bookmarks.png` | コンテンツが少ないページ。背景の暗さに対して見出しが浮き、十分視認可能。 |
| notifications (`/notifications`) | `screenshots/clone/notifications.png` | `screenshots/clone-dark/notifications.png` | `screenshots/light-dark/notifications.png` | リストの罫線が dark でやや薄め (区切り知覚が弱い)。後述「残課題」参照。 |

## 視覚的な所見

### dark で特に見栄えがよいページ

1. **`/calendar/ai-developers`** — ヒーロー画像の暗いトーンが背景と自然に繋がり、本家 (luma) の dark 風 UI に近い質感になっている。
2. **`/` (top)** — オレンジ系 CTA とカテゴリカードのアクセントカラーが暗背景でより鮮やかに映える。
3. **`/ranking`** — 上位 3 位の金/銀/銅バッジが dark でくっきり浮き上がる。
4. **`/discover`** — カテゴリタイル (purple/blue/orange/teal) のグラデが light より鮮やかに見える。

### 注意したいページ

1. **`/notifications`** — 行間の罫線色がトークン上 `border` 系で、dark 背景に対してかなり薄い (`oklch` 上ほぼ背景同色)。読みやすさは保てているが、視覚的なグルーピングが弱い。
2. **`/user/fast_moon_169`** — 「他のユーザー」セクションで青タイル + 白文字の名前ラベルが dark 背景下でやや沈む (薄青になる)。
3. **共通** — ヘッダの検索 input の右側にある通知ベル等のアイコンは dark でも `text-foreground` のままで OK だが、ヘッダ下部の境界線が見えにくいため、ヘッダとコンテンツ領域の境目が淡く感じるページがある。

## a11y チェック結果

`e2e/a11y-dark.spec.ts` で主要 5 ページに axe-core を走らせた結果 (詳細は `screenshots/components/_axe-dark.json`)。

| ページ | violationCount | blockerCount (critical/serious 既知デザイン除く) | knownDesign |
| --- | --- | --- | --- |
| top | 1 | **0** | color-contrast: 5 nodes |
| explore | 1 | **0** | color-contrast: 2 nodes |
| event-1 | 1 | **0** | color-contrast: 1 node |
| group-findy | 1 | **0** | color-contrast: 2 nodes |
| user-fast_moon_169 | 1 | **0** | color-contrast: 2 nodes |

**結論: critical / serious 違反 (既知デザイン違反を除く) は全ページで 0 件。**

`color-contrast` は light モード走査でも既知デザイン違反として warn 扱いしているもので、dark でも同様の取り扱い。`_axe-dark.json` に
ノード数を残してあるので、今後トークン調整時のリグレッション検出に利用できる。

## 残課題

1. **`/notifications` の罫線コントラスト** — `--color-border` の dark 値を 1 段明るくして区切り視認性を改善する余地あり。
2. **「他のユーザー」グリッドタイル** — `/user/*` の青タイル `background` を dark で若干持ち上げる (現状: 純度の高い `blue-500` 相当、dark では `blue-400` 付近が望ましい)。
3. **`color-contrast` の axe 警告ノード数** — top で 5 nodes と多い。フッタ補助テキスト/サブタイトル系トーンの調整を継続。
4. **モバイル dark** — 今回の検証は `chromium-desktop` プロジェクトのみ。`chromium-mobile` での dark 表示 (バナー/モバイル CTA など) は別途検証要。
5. **`prefers-color-scheme: dark` のサーバ初期描画** — 現状 ThemeProvider は SSR 時に必ず light 描画 → mount 後に dark へ切替えるため、ブラウザがすぐ表示する初期フレームに一瞬 light が見える可能性。`<script>` で head 内インラインで data-theme を立てる対策が将来的に検討候補。

## 再現手順

```sh
# 1) dark スクショ取得 + 視覚回帰ベースライン更新
npx playwright test --project=chromium-desktop e2e/visual-compare-dark.spec.ts --update-snapshots

# 2) light/dark 並列画像生成
pnpm tsx scripts/build-light-dark-comparison.ts

# 3) dark mode toggle E2E
npx playwright test --project=chromium-desktop e2e/dark-mode.spec.ts

# 4) dark a11y
npx playwright test --project=chromium-desktop e2e/a11y-dark.spec.ts
```
