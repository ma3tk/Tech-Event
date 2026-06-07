## 対象ペルソナ

> 「全員向け」は実質「誰のためでもない」。必ず 1–2 ペルソナを優先する。詳細は [`Personas.md`](../Personas.md)。

- 主要: P? ____ (例: P1 山田美咲, P6 小林一郎)
- 副次: P? ____

## サマリー

<!-- 何を変えたか、なぜ変えたかを 2-3 行で -->

## 検証

- [ ] CI 全 job ✅ (`gh pr checks` で確認、`--admin` バイパス禁止 — [`CLAUDE.md §1.0`](../CLAUDE.md))
- [ ] smoke CI 緑 (PR default check: smoke + lint + typecheck + build)
- [ ] Semgrep CI 緑 (新規 SAST 違反なし、`.github/workflows/security.yml`)
- [ ] gitleaks CI 緑 (secrets hardcode なし、`.github/workflows/security.yml`)
- [ ] UI / DB 大改修なら `e2e:full` ラベル付けてフル E2E 緑も確認
- [ ] `pnpm nx run-many -t typecheck`
- [ ] `pnpm nx run web:build`
- [ ] `pnpm nx run web-e2e:e2e --grep @smoke` (smoke のみ高速確認)
- [ ] axe-core violations 0 (主要ページ)
- [ ] Storybook 影響範囲を `pnpm storybook` で目視確認 (UI 変更時)
- [ ] VRT (`pnpm nx run web-e2e:vrt`) baseline 更新確認 (見た目の変更があった場合)
- [ ] light / dark / high-contrast 3 テーマで崩れなし (UI 変更時)
- [ ] mobile (393×852) / desktop (1440×900) 両方で確認 (UI 変更時)

## デザインシステム影響

- [ ] `docs/catalog/*.md` の関連 MD を更新した (または更新不要)
- [ ] `docs/design-system.md` の規範に影響なし (または同期した)
- [ ] Storybook story / MDX に変更不要 (または追加した)
- [ ] 4 媒体役割分担マトリクス (`docs/catalog/00-overview.md` §0) に照らして妥当

## スクリーンショット

<!-- UI 変更がある場合は light / dark / high-contrast + mobile / desktop で添付 -->

## 更新したドキュメント (必須)

> [`CLAUDE.md §5.0`](../CLAUDE.md) ルール: コード変更したら関連 docs/links を **同じ PR で同期**する。リンク切れは blocker。

- [ ] `README.md` (機能/コマンド/環境変数に影響なし or 更新済)
- [ ] `Design.md` (DS 規範に影響なし or 更新済)
- [ ] `Personas.md` (ペルソナ/ジャーニーに影響なし or 更新済)
- [ ] `docs/*.md` (該当領域に影響なし or 更新済)
- [ ] `docs/catalog/{ui,components,blocks,foundations}/*.md` (該当 MD に影響なし or 更新済)
- [ ] `CHANGELOG.md` (リリース粒度の変更なし or 追記済)
- [ ] `.env.example` (環境変数追加・削除なし or 同期済)
- [ ] Storybook story / MDX (該当なし or 追加・更新済)
- [ ] i18n `src/i18n/messages/{ja,en}.json` 両方 (UI 文言追加なし or 同期済)
- [ ] 相対リンク broken 0 (`grep -r '\](\./'` で検証)

## 関連 Issue

<!-- 例: closes #123 -->
