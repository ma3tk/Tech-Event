## 対象ペルソナ

> 「全員向け」は実質「誰のためでもない」。必ず 1–2 ペルソナを優先する。詳細は [`Personas.md`](../Personas.md)。

- 主要: P? ____ (例: P1 山田美咲, P6 小林一郎)
- 副次: P? ____

## サマリー

<!-- 何を変えたか、なぜ変えたかを 2-3 行で -->

## 検証

- [ ] `pnpm nx run-many -t typecheck`
- [ ] `pnpm nx run web:build`
- [ ] `pnpm nx run web-e2e:e2e` (主要 spec)
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

## 関連 Issue

<!-- 例: closes #123 -->
