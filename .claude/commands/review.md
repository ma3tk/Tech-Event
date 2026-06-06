---
description: tech-event 固有の 4 観点 PR review (security / data-model / code-quality / ux-a11y)
---

# /review

このプロジェクト固有の PR review を 4 観点 で並列実施する。CLAUDE.md §1, §6, §7 を判定軸として使う。

## 4 観点

### 1. Security (CLAUDE.md §7)
- `te_session` cookie の HMAC 署名は変更されていないか? AUTH_SECRET 必須運用が崩れていないか?
- OAuth signIn で `email_verified` 確認なしに既存 User と link していないか?
- Stripe Webhook は `constructEvent` で署名検証しているか? 未設定時 503 を維持しているか?
- Markdown 出力は DOMPurify (`renderMarkdown`) を通しているか?
- 外部 Webhook URL は allowlist + private IP 拒否で SSRF 防御されているか?
- 画像アップロードは magic byte 検証しているか? 拡張子だけで判定していないか?
- 公開 API キー比較に `crypto.timingSafeEqual` を使っているか?
- 開発エンドポイント (`/api/auth/dev-login`, `/api/test/*`) は環境変数フラグで gated か?
- Server Action に zod 検証 + 認可チェックがあるか?
- 機微情報 (秘密鍵, .env) が diff に含まれていないか?

### 2. Data Model (CLAUDE.md §6.3)
- BigInt ID は `nextId(tx, "table")` 経由で採番されているか? `_max+1` 直書きが無いか?
- Prisma schema 変更時、SQLite (`schema.prisma`) と PG (`schema.postgres.prisma`) 両方が更新されているか?
- migration 名は意味的か? 破壊的変更を含む場合に旧挙動フォールバックがあるか (§1.1)?
- 新規必須フィールドが追加された場合に seed が更新されているか?

### 3. Code Quality (CLAUDE.md §6)
- TypeScript `strict: true` を保持、`any` ゼロ、`@ts-ignore` ゼロ?
- `as unknown as Foo` の強制キャストが最小限か?
- Server / Client 境界が適切か? (デフォルト Server, interactive のみ Client)
- `cn` の重複定義が無く `@/lib/cn` のみ使われているか?
- `text-muted` 系の低コントラスト直書きが無いか? (`text-muted-foreground` 以上)
- 既存 props / 公開 API が完全互換か? (§1.1)

### 4. UX / a11y (CLAUDE.md §3.3, §4)
- 主要ページで `@axe-core/playwright` の critical/serious = 0 か?
- light / dark / high-contrast 3 テーマで違反 0 か?
- 新規コンポーネントに Storybook story が CVA variant × state 網羅でついているか?
- VRT (`toHaveScreenshot`) ベースラインが更新済 + diff レビュー済か?
- アイコンは lucide-react、stroke 1.5、サイズ 14/16/20/24 を守っているか?
- `waitForTimeout` を新規追加していないか?

## 出力フォーマット

各観点で:
- ★★★★★ (5 段階) で評価
- 指摘 (file:line + 修正案) を箇条書き
- Blocker (merge 不可) / Warning (推奨修正) / Nit (好みの問題) のラベル付け

最後に総合判定 (Approve / Request changes) と全体スコア。

## 使い方

```
/review
```
HEAD の diff を origin/main と比較してレビュー。

```
/review feature/foo
```
指定ブランチを review。
