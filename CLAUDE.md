# tech-event プロジェクトでの作業方針

このファイルは tech-event プロジェクトで Claude が一貫して守るべき原則をまとめたものです。
今後このプロジェクトで作業するときは、ここに書かれた価値観を最優先で守ってください。

---

## 1. 不変の原則

### 1.1 既存機能・既存テストを削減しない
- **追加・拡張は良いが、削除・縮小は禁止** (ユーザーが明示的に要請した場合のみ削除可)
- 既存の挙動を変える場合は、URL クエリパラメータや環境変数で旧挙動を保持できるように
- 例: `?view=classic` で従来 UI、デフォルトは新 UI
- 例: `STRIPE_SECRET_KEY` 未設定なら従来「現地払い」フォールバック
- リファクタ時も props 型・公開 API は完全維持。内部実装のみ差し替え

### 1.2 完璧主義のループ
- 「完璧」「最強」「100%」を目標として与えられたら、完了通知後も自分で残差分を見つけて次イテレーションに移る
- 「進捗?」と聞かれたら状況を簡潔に答え、止まらず続行する
- 「全部終わらせて」「全部やって」と言われたら残課題リストを徹底的に消化する

### 1.3 並列 agent の積極活用
- 4〜7 並列で agent を起動し、文書化・調査・実装・検証を分担
- 各 agent には「ファイル所有権」を明示してコンフリクト回避
- 完了通知を polling せず待機 (notification 駆動)
- 必要に応じて wave 構成 (wave 1 完了 → wave 2 dispatch)

---

## 2. リサーチファースト

### 2.1 実装前に必ず調査
- 模倣対象 (connpass / lu.ma) を WebFetch で深く調査
- ページ単位 / コンポーネント単位 / 機能単位 / API / データモデル / UX フロー / 非機能 の 7 軸で網羅
- 結果は `research/` 配下に md ファイル群で保存 (1 ファイル 150-200 行目安)
- 全ファイルのインデックスを `research/README.md` に
- 「(推測)」と明示すべき箇所は明記

### 2.2 視覚比較の徹底
- Playwright で本家とクローンのスクショペアを取得
- 3 者並列 (triptych) で connpass / clone / luma を可視化
- `research/visual-diff-report.md` (アーカイブ) → `research/visual-diff-final-report.md` で残差分を ★★★★★ で評価
- 完成度% を連邦推計で算出

---

## 3. テスト・検証

### 3.1 E2E が真実の源
- Playwright の通過 = 完成の判定基準
- chromium-desktop と chromium-mobile の両プロジェクトで PASS が必須
- skipped は 0 を目指す (mobile-only / desktop-only は別)
- flake は許容しない (timing race は locator-based 待機で解消)

### 3.2 視覚回帰 (VRT)
- `toHaveScreenshot()` で全 Storybook story + 主要ページのベースライン管理
- 変更時は `--update-snapshots` でベースライン再生成し、レビュー時に diff を確認
- DiceBear / picsum.photos などランダム要素は `mask:` で除外

### 3.3 a11y 自動チェック
- `@axe-core/playwright` を主要ページに走らせ critical/serious = 0
- light / dark / high-contrast 全モードで違反 0
- WCAG AA 必須、可能なら AAA

### 3.4 テスト隔離
- `e2e/global-setup.ts` で dev.db を baseline コピー、`global-teardown.ts` で復元
- DB 状態に依存する test は serial mode + 固定ユーザー (`test_user`) を使う
- create-flow 系で他テスト用の固定ユーザーを汚さない

---

## 4. デザインシステム

ビジュアル / UI 関連の作業は [Design.md](./Design.md) を最初に読む (本章はコード規約、Design.md はビジュアル規範のトップレベル文書)。

### 4.1 3 層トークン体系
```
src/styles/tokens.css       ← Primitive (color scales, typography, spacing, radius, shadow, z, motion, border-width)
src/styles/semantic.css     ← Semantic alias (テーマ非依存)
src/styles/themes/light.css ← Light theme mapping
src/styles/themes/dark.css  ← Dark theme mapping
src/styles/themes/high-contrast.css  ← AAA mapping (prefers-contrast 対応)
src/app/globals.css         ← @theme inline で Tailwind v4 bridge
```

### 4.2 コンポーネント階層 (Atomic Design)
- **Atom** = `src/components/ui/` の Radix UI + CVA primitives (21 個)
- **Molecule / Organism** = `src/components/` の composite (Header / EventListRow / ShareModal 等)
- **Template** = `/components` showcase ページ
- **Page** = `src/app/**/page.tsx`

### 4.3 ルール
- 既存 Tailwind ユーティリティクラス名は **互換性維持** (refactor 負担最小化)
- 新規コンポーネントは ui/ primitives の上に組む
- 全コンポーネントに Storybook story + variant 100% カバー
- MDX docs を `src/stories/design-system/` に追加
- アイコンは lucide-react、ストロークウェイト 1.5、サイズ 14/16/20/24 px

### 4.4 トークン同期
- `tokens/*.json` を Figma Tokens Studio 互換形式で保持
- `pnpm tokens` で CSS → JSON、`pnpm tokens --reverse` で逆方向
- CI (`.github/workflows/tokens.yml`) で乖離を強制検出

---

## 5. ドキュメント文化

### 5.1 ディレクトリ構成
```
research/        — 本家調査資料 (60+ファイル、connpass 64 + Luma 32)
docs/            — プロジェクト固有 docs
  design-system.md          — 設計思想・トークン
  design-system-audit.md    — 完成度監査
  design-system-changelog.md — DS版数管理
  component-taxonomy.md     — Atomic 分類
  component-api-status.md   — API 成熟度
  motion.md                 — モーション規約
  icons.md                  — アイコン規約
  perf-report.md            — パフォーマンス計測
  lighthouse-report.md      — Lighthouse スコア
  completion-report.md      — 機能完成度
  architecture.md           — レイヤー設計
  ci.md                     — CI/CD 説明
src/stories/design-system/ — Storybook MDX (21 ページ)
```

### 5.2 命名規則
- 調査資料: 小文字 kebab-case (e.g. `event-registration.md`)
- 日付は絶対化 (相対日付禁止: 「明日」→「2026-06-05」)
- 推測には「(推測)」明示

---

## 6. コード品質

### 6.1 TypeScript
- `strict: true` 維持、`any` ゼロ、`@ts-ignore` ゼロ
- `as unknown as Foo` 強制キャストは最小化
- `non-null assertion !` は本当に保証されるところのみ

### 6.2 Server / Client 境界
- デフォルトは Server Component
- Client Component は interactive (state / event handlers / browser API) が必要なときのみ
- shadcn primitive のうち Card / Badge / Skeleton / Label は Server で問題なし
- Tooltip / Tabs / Dialog 等は Radix の制約で Client

### 6.3 Server Action
- `'use server'` を明示
- Zod で必ず入力検証
- 認可チェック (主催者 / admin / 参加者) を Server 側で必ず実施
- BigInt ID 採番は `nextId(tx, "table")` ヘルパー経由 (race retry 込み)
- エラーは `ActionError` で型化

### 6.4 アンチパターン
- `_max+1` の生書き禁止 → `nextId()` 使用
- `cn` の重複定義禁止 → `@/lib/cn` のみ
- `waitForTimeout` 禁止 → locator-based 待機
- `text-muted` 系の低コントラスト禁止 → `text-muted-foreground` 以上

---

## 7. セキュリティ最低ライン

- `te_session` cookie は HMAC 署名 (AUTH_SECRET 必須、未設定なら起動時 throw)
- OAuth signIn は email_verified 確認なしで既存 User と link しない
- Stripe Webhook は `constructEvent` 必須、未設定なら 503
- Markdown 出力は DOMPurify で sanitize (`@/lib/markdown` の `renderMarkdown`)
- 外部 Webhook URL (Slack 等) は allowlist + private IP 拒否で SSRF 防御
- 画像アップロードは magic byte 検証 (拡張子だけは不可)
- 公開 API キーは `crypto.timingSafeEqual` で比較
- 開発エンドポイント (`/api/auth/dev-login`, `/api/test/*`) は `ENABLE_DEV_LOGIN` / `ENABLE_TEST_ENDPOINTS` で明示有効化

---

## 8. 開発フロー

### 8.1 起動
```bash
pnpm install
pnpm db:reset                  # migrate + seed + recalc-counters + init-fts
pnpm tsx prisma/seed-test-user.ts
pnpm dev                       # http://localhost:3000
pnpm storybook                 # http://localhost:6006
```

### 8.2 検証
```bash
pnpm tsc --noEmit
pnpm build
pnpm tokens:validate
npx playwright test --project=chromium-desktop -j 2
npx playwright test --project=chromium-mobile -j 2
pnpm build-storybook
```

### 8.3 開発用ログイン
- `http://localhost:3000/api/auth/dev-login?nickname=test_user&next=/dashboard`
- `test_user` は E2E 用固定ユーザー (`prisma/seed-test-user.ts`)
- `fast_moon_169` 等の seed ユーザーは E2E と競合するため使い分け

---

## 9. 進め方の好み (observed)

- ユーザーは短い文 (「進んでる?」「全部終わらせて」「スクショみたい」) で指示を出す。長文の質問は不要
- 「進捗は?」と聞かれたら現状を箇条書きで簡潔に返す。次のステップを聞き返さない
- ユーザーが質問形式で指示してきたら、推奨案を 3 つ以内で提示
- 視覚的確認を好む → スクショは適宜 SendUserFile で送る (proactive)
- 大量 agent 並列を許容している。コンフリクトを慎重に避けながら 4-7 並列で動かす

---

## 10. 完成度の判定

- **機能 100%** = research/luma/ と research/ (connpass) で挙げられた仕様すべて + E2E + axe + Lighthouse 平均 95+
- **DS 100%** = 26/26 監査項目 (token 3層 / light/dark/HC / primitives 20+ / VRT / MDX / icons / motion 等)
- **総合 100%** = 上記 + ドキュメント完備 + flake 0

完成判定後も「より強くできるか」を自問する。次の改善余地は常に `docs/*.md` に残しておく。
