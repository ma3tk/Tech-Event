# tech-event Design System リリース基準

最終更新: 2026-06-05 / 対象: DS v1.0.0+

本ドキュメントは、`tech-event` のデザインシステムを **「リリース可」** と判定するための
客観的チェック基準を定義する。`docs/design-system-audit.md` から分離した実運用判定リスト。

> 関連: [`docs/design-system-audit.md`](./design-system-audit.md) / [`docs/component-api-status.md`](./component-api-status.md) /
> [`docs/design-system-changelog.md`](./design-system-changelog.md)

---

## 1. リリースカテゴリ

| カテゴリ | 適用範囲 | 判定 |
| --- | --- | --- |
| **patch (x.y.Z)** | バグ修正 / a11y 改善 / 内部リファクタ (public API 変更なし) | § 2 基準のみ通れば OK |
| **minor (x.Y.0)** | 新規 component / 新規トークン追加 | § 2 + § 3 |
| **major (X.0.0)** | API 破壊変更、トークン名 rename / 削除 | § 2 + § 3 + § 4 (移行ガイド必須) |

---

## 2. 全リリース共通の必須基準

| # | 項目 | 期待値 | 検証方法 |
| -- | --- | --- | --- |
| 1 | TypeScript エラー | 0 | `pnpm tsc --noEmit` |
| 2 | ESLint エラー | 0 | `pnpm lint` |
| 3 | Storybook ビルド成功 | exit 0 | `pnpm build-storybook` |
| 4 | E2E (Playwright) 全 PASS | 234+ test PASS | `pnpm exec playwright test` |
| 5 | axe critical / serious 違反 | 0 | `e2e/a11y-pages.spec.ts`, `components-a11y.spec.ts`, `a11y-pages-mobile.spec.ts`, `a11y-dark.spec.ts`, `high-contrast.spec.ts` |
| 6 | Token CSS ↔ JSON 整合性 | 完全一致 | `.github/workflows/tokens.yml` (`pnpm tokens:validate` + `pnpm tokens` 差分 0) |
| 7 | VRT (warn only) | 実行成功 | `pnpm vrt` が exit 0 (差分は warn のみ) |
| 8 | Component API Status 更新 | 該当 component の行更新 | `docs/component-api-status.md` |

---

## 3. minor リリース追加基準 (新規 component / トークン追加)

| # | 項目 | 期待値 |
| -- | --- | --- |
| 9 | 新規 component に `.stories.tsx` | 主要 variant 網羅 |
| 10 | 新規 component の axe critical/serious | 0 |
| 11 | 新規 component の VRT ベースライン | `pnpm vrt:update` 済 |
| 12 | `docs/component-classification.md` 更新 | ui / components / blocks / foundations のいずれかに分類記載 (shadcn/ui スタイル) |
| 13 | `docs/component-api-status.md` 行追加 | 初期 stability = `alpha` で記録 |
| 14 | `docs/design-system-changelog.md` Added 節 | 追加内容を明記 |
| 15 | Storybook MDX (Components / Tokens) 更新 | 該当があれば追記 |

---

## 4. major リリース追加基準 (破壊変更)

| # | 項目 | 期待値 |
| -- | --- | --- |
| 16 | 移行ガイド (Before / After サンプル) | `docs/design-system-changelog.md` に記載 |
| 17 | 旧 API の `@deprecated` JSDoc アノテーション | 1 minor 前から付与 |
| 18 | Component API Status の `deprecated` 化 | 該当 component の stability 変更 |
| 19 | アプリ側の影響範囲 grep 結果 | PR 説明に貼付 |
| 20 | DS Audit § 4 業界標準比較の再評価 | 必要に応じて update |

---

## 5. 自動化されている検証 (CI)

| Workflow | ジョブ | 失敗時の動作 |
| --- | --- | --- |
| `ci.yml` | typecheck | block |
| `ci.yml` | lint | block |
| `ci.yml` | build | block |
| `ci.yml` | e2e (Playwright) | block |
| `ci.yml` | **a11y (axe-core)** | block (critical/serious=0 必須) |
| `tokens.yml` | validate-and-sync | block |
| `storybook.yml` | build-and-deploy | warn (deploy 失敗のみ) |

VRT (`pnpm vrt`) は **warn only** のため、CI を block しない。ローカルで `pnpm vrt:update` を
実行してベースラインを更新する運用。

---

## 6. リリース手順

1. ブランチ作成 (`release/ds-X.Y.Z`)
2. § 2 を全て PASS させる (CI 緑)
3. minor / major なら § 3 / § 4 を満たす
4. `docs/design-system-changelog.md` に変更を追記、`README.md` の DS 完成度% / 版数を更新
5. PR → review → merge to `main`
6. `git tag ds-vX.Y.Z` を打ち push
7. GitHub Pages の Storybook が自動更新される (`.github/workflows/storybook.yml`)

---

## 7. 判定例 — v1.0.0 リリース (2026-06-05)

| 基準 | 結果 |
| --- | --- |
| § 2 / 1-8 全項目 | ✓ 全 PASS |
| § 3 / 9-15 (新規 VRT spec + Component Status MDX + 拡張アイコン 20 種) | ✓ 全 PASS |
| § 4 (major) | 該当なし (本リリースは破壊変更なし) |

→ **DS v1.0.0 リリース可** と判定。
