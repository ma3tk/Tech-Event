# CI / CD ガイド

`tech-event` は GitHub Actions を採用し、3 つの workflow で品質と公開を担保する。

| workflow | ファイル | トリガー | 主な内容 |
| --- | --- | --- | --- |
| **ci** | `.github/workflows/ci.yml` | PR / main push | `tsc --noEmit` / `lint` / `build` / Playwright 全テスト |
| **tokens** | `.github/workflows/tokens.yml` | PR (token 関連 path に変更) | `tokens:validate` + CSS↔JSON 同期チェック |
| **storybook** | `.github/workflows/storybook.yml` | main push | `build-storybook` + GitHub Pages デプロイ |

すべて **Node.js 22 LTS** + **pnpm 11** + **Ubuntu latest** で実行する
(ローカル開発は Node 26 を使用しているが、CI は安定性重視で LTS を採用)。

pnpm のバージョンは `package.json` の `packageManager` フィールド
(`pnpm@11.5.2`) が single source of truth。`pnpm/action-setup` はこれを読むので、
workflow 側で `version:` を指定しない (指定するとローカルとズレる)。
バージョンを上げるときは `packageManager` だけを書き換える。

## サプライチェーン防御

- **action は commit SHA でピン留め**する (`uses: actions/checkout@df4cb1c... # v6`)。
  可変タグ (`@v6`) はタグ付け替えで中身がすり替わるため使わない。
  SHA は凍結すると upstream の修正を取り込めなくなるので、
  `.github/dependabot.yml` (github-actions ecosystem / 週次 / 1 PR にグループ化) で追従する
- **`pnpm-workspace.yaml`** に `trustPolicy: no-downgrade` / `minimumReleaseAge: 10080` (7 日) /
  `blockExoticSubdeps: true` を設定。検証済みの例外のみ `trustPolicyExclude` に列挙する
  (詳細は同ファイルのコメント)
- **Semgrep のエンジンは `.github/requirements-semgrep.txt` で固定**する。
  未固定だと同一コミットでも実行日によって結果が変わり、ローカルで CI を再現できない

---

## 1. `ci` workflow — メイン品質ゲート

`ci.yml` は 4 つの並列ジョブから構成される。

### 1.1 `typecheck`

```bash
pnpm exec prisma generate
pnpm tsc --noEmit
```

`prisma generate` を先に走らせるのは、`@prisma/client` が build 時生成型に依存
しているため。これを忘れると `import { Prisma } from "@prisma/client"` が解決
できず大量に型エラーが出る。

### 1.2 `lint`

```bash
pnpm lint            # eslint v9 (flat config)
```

`eslint.config.mjs` で `next/core-web-vitals` + storybook ルールを有効化済み。

### 1.3 `build`

```bash
pnpm exec prisma generate
pnpm db:reset                  # SQLite を作り直して seed
pnpm build                     # next build (Turbopack)
```

`db:reset` は **CI のクリーンな環境でのみ** 実行する。 SSG のうち
`/api/explore` 等が build 時に Prisma 経由でデータ取得を行うため、空 DB だと build が
落ちるので seed が必要。

### 1.4 `e2e`

```bash
pnpm db:reset
pnpm exec tsx prisma/seed-test-user.ts
pnpm exec playwright install --with-deps chromium
pnpm exec playwright test
```

`playwright.config.ts` の `projects` は `chromium-desktop` と `chromium-mobile`。
両方で 219+ ケースを実行する。落ちた場合は Playwright HTML report を
`playwright-report` artifact として 14 日間保持する。

---

## 2. `tokens` workflow — デザイントークン同期強制

`tokens.yml` の目的は **「人間が CSS を変えたら JSON も再生成しろ」** を CI で強制すること。

### 2.1 validate

```bash
pnpm tokens:validate
```

`scripts/validate-tokens.ts` で次を検証:

- 名前空間規則 (`--ns-name` パターン)
- `src/styles/tokens.css` ⇔ `tokens/primitive.json + motion.json` の整合性
- `src/styles/themes/light.css` ⇔ `tokens/semantic.light.json`
- `src/styles/themes/dark.css` ⇔ `tokens/semantic.dark.json`
- JSON 側参照 `{color.gray.100}` の解決性 (dangling reference の検出)

### 2.2 sync diff check

```bash
pnpm tokens
git diff --quiet -- tokens/   # 差分があれば fail
```

`scripts/sync-tokens.ts` で CSS から JSON を再生成し、再生成結果が commit 済み JSON と
一致しなければ fail。 これにより:

- 開発者が `src/styles/*.css` を更新するだけで commit しても CI が落ちる
- 「再生成しろ」と教えるエラーメッセージを出す

### 2.3 path フィルタ

`paths` に `src/styles/**` / `tokens/**` / `scripts/sync-tokens.ts` /
`scripts/validate-tokens.ts` のいずれかが含まれる PR でのみ実行する。
無関係な PR では skip。

---

## 3. `storybook` workflow — Storybook を GitHub Pages にデプロイ

main への push 時に `pnpm build-storybook` → `peaceiris/actions-gh-pages@v4` で
`gh-pages` ブランチにデプロイ。

### 3.1 公開 URL

```
https://<owner>.github.io/<repo>/
```

### 3.2 リポジトリ設定 (一度だけ)

1. **Settings > Pages**:
   - 初回は **"Source: Deploy from a branch"** を選択 (まだ branch が無くても OK)
   - `gh-pages` ブランチは workflow 初回実行時に `peaceiris/actions-gh-pages@v4` が
     自動で作成・push する
   - 一度デプロイされたら Source を **`gh-pages` branch (root)** に設定
2. **Settings > Actions > General**:
   - "Workflow permissions" を **Read and write permissions** に変更
   - "Allow GitHub Actions to create and approve pull requests" を ON

### 3.2.1 初回デプロイのトリガ手順 (Pages 有効化)

1. `main` に commit を push する (どの src/** 変更でも path filter に一致する)
2. もしくは Actions タブから **"storybook"** workflow を選び `workflow_dispatch` で
   手動実行
3. 成功すると **gh-pages ブランチが自動生成** され、`storybook-static/` の中身が push される
4. Settings > Pages で Source を `gh-pages` に切替えると、5-10 分後に
   `https://<owner>.github.io/<repo>/` で公開される
5. 公開 URL は job summary (Actions の "Print public Storybook URL" step) にも出力される

> 初回だけ Source が `None` のままだと 404 になる。**Settings > Pages を必ず確認すること。**

### 3.3 path フィルタ

Storybook に影響しうる `src/**` / `tokens/**` / `.storybook/**` /
`package.json` / `pnpm-lock.yaml` の変更でのみ走る。

---

## 4. Secrets テンプレート

下表の secret を **Settings > Secrets and variables > Actions > Repository secrets** に登録する。
**値はリポジトリに commit しないこと。** いずれも `ci.yml` の `env:` に置いてあるのは
プレースホルダで、実環境では override してもらう。

| Secret 名 | 用途 | 例 |
| --- | --- | --- |
| `PUBLIC_API_KEY` | 公開 API (`/api/public/v1/*`) の認証鍵 | `pk_live_xxxxxxxxxxxxxxxx` |
| `MAGIC_LINK_SECRET` | Magic Link トークン署名鍵 (将来追加予定) | `random-base64-32-bytes` |
| `EMAIL_SMTP_URL` | メール送信用 SMTP URL (将来追加予定) | `smtps://user:pass@smtp.example.com:465` |
| `NEXTAUTH_SECRET` | next-auth セッション暗号化鍵 (将来追加予定) | `random-base64-32-bytes` |
| `NEXT_PUBLIC_BASE_URL` | metadata.metadataBase | `https://tech-event.example.com` |

> `GITHUB_TOKEN` は GitHub Actions が自動発行するので登録不要。
> `storybook.yml` の `peaceiris/actions-gh-pages` はこの自動 token を使う。

---

## 5. Token Studio 連携手順 (Figma)

デザイナーが Figma の Tokens Studio プラグインで色トークンを編集するための連携手順。

### 5.1 初期セットアップ

1. Figma で **Plugins > Tokens Studio for Figma** を開く
2. 右上 **Settings > Sync providers > GitHub** を選択
3. 次の値を入力:
   - **Repository**: `<owner>/tech-event`
   - **Branch**: `tokens-studio-sync` (専用ブランチを切る運用を推奨)
   - **File Path**: `tokens` (ディレクトリを指定すると複数 JSON を扱える)
   - **GitHub Token**: scope `repo` の PAT
4. **Pull** で `tokens/primitive.json` / `semantic.light.json` / `semantic.dark.json` /
   `motion.json` が読み込まれる

### 5.2 編集 → PR 化

1. Figma 側で色値を編集 → `Push` で `tokens-studio-sync` ブランチに commit
2. GitHub で `tokens-studio-sync` → `main` の Pull Request を作成
3. PR で `tokens` workflow が走る:
   - JSON 側のみ変更 → `pnpm tokens` で CSS を再生成しないと `validate-tokens` が fail
   - そのため **ローカルで `pnpm tokens -- --reverse`** を実行して JSON→CSS 反映
   - 再 commit すると CI が通る

### 5.3 名前空間規則

Tokens Studio 側で新しいキーを追加する場合は `tokens/README.md` の規則に従う:

| Tokens Studio キー | CSS 変数 |
| --- | --- |
| `color.gray.100` | `--color-gray-100` |
| `color.linkBlue.300` | `--color-link-blue-300` |
| `typography.fontSize.lg` | `--font-size-lg` |
| `motion.duration.fast` | `--duration-fast` |
| `motion.easing.out` | `--ease-out` |
| `brand.orange.hover` | `--brand-orange-hover` |
| `status.open.bg` | `--status-open-bg` |
| `elevation.card` | `--elevation-card` |

規則違反 (`_` 含む、`-` の連続、大文字混入など) は `validate-tokens` で必ず fail する。

---

## 6. ローカルで CI を再現

CI 上で何が起きているかを手元で確認したい場合:

```bash
# typecheck + lint + build + tokens validate
pnpm exec prisma generate
pnpm tsc --noEmit
pnpm lint
pnpm tokens:validate
pnpm tokens && git diff --quiet -- tokens/ || echo "tokens out of sync"
pnpm build

# Playwright
pnpm exec playwright test --project=chromium-desktop -j 2
```

Storybook 公開プレビューは `pnpm storybook:preview` で `storybook-static/` を
ローカル serve できる (詳細は README 参照)。

`act` (https://github.com/nektos/act) を使えば workflow ファイルそのものを
ローカルで実行できる:

```bash
brew install act
act pull_request -W .github/workflows/tokens.yml --container-architecture linux/amd64
```
