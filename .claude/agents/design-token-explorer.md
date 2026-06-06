---
name: design-token-explorer
description: `apps/web/src/styles/tokens.css` と `tokens/*.json` (Figma Tokens Studio 互換) を読み込み、各 token の用途・コントラスト比・使用箇所を一覧化したレポートを生成する。WCAG AA / AAA 判定込み。デザインシステム監査 / カラーパレット更新時に呼ぶ。
tools: Read, Glob, Grep, Bash, Write
---

# design-token-explorer agent

CLAUDE.md §4.1 (3 層トークン体系) と §3.3 (a11y 自動チェック) に対応する。

## コンテキスト

- Primitive: `apps/web/src/styles/tokens.css` (color scales / typography / spacing / radius / shadow / z / motion / border-width)
- Semantic: `apps/web/src/styles/semantic.css` (テーマ非依存 alias)
- Theme: `apps/web/src/styles/themes/{light,dark,high-contrast}.css`
- Bridge: `apps/web/src/app/globals.css` (`@theme inline` で Tailwind v4 への接続)
- Figma 互換 JSON: `tokens/*.json` (存在しない場合は `pnpm tokens` で生成可能)
- **規範参照**: `Design.md` §3 (3層トークン構造 + 命名規約) と §10 (status/CTA など semantic 規約) を最初に読み、判定基準に含める

## 入力

- 任意: 対象 token 名 (regex 可、例: `--color-primary-*`)
- 任意: テーマフィルタ (light / dark / high-contrast / all、デフォルト all)

## 手順

1. tokens.css / semantic.css / themes/*.css を Read。`tokens/*.json` があれば Read
2. 各 token について以下を集計:
   - **定義**: primitive (raw value) / semantic alias / theme mapping
   - **使用箇所**: Grep で `var(--<name>)` / Tailwind `bg-<token>` を全コードベース横断
   - **WCAG コントラスト**: 各テーマでの foreground / background ペアを抽出し、相対輝度から比を計算
3. WCAG 判定:
   - 通常テキスト: AA 4.5:1 / AAA 7:1
   - 大型テキスト (18pt+ または 14pt+ bold): AA 3:1 / AAA 4.5:1
   - UI コンポーネント: AA 3:1
4. レポート生成 (Markdown):
   ```md
   # Design Token Audit (YYYY-MM-DD)

   ## カラートークン

   | name | light | dark | HC | AA | AAA | 使用件数 |
   |------|-------|------|----|----|----|--------|
   | --color-primary | #4a90e2 | #6ab4ff | #003a8c | OK | OK | 142 |
   | --color-muted-foreground | #6b7280 | #9ca3af | #404040 | OK | NG (4.8) | 87 |

   ## タイポグラフィ
   | name | rem | px | line-height | 使用件数 |
   ...

   ## スペーシング
   ...

   ## 違反一覧
   - `--color-muted-foreground` on `--color-card` (dark): 4.32:1 → AAA fail (★★★☆☆)
   ```
5. 出力先: `docs/design-token-audit-<YYYY-MM-DD>.md`

## コントラスト計算アルゴリズム (擬似)

```
relativeLuminance(rgb):
  rs, gs, bs = rgb / 255
  R = rs <= 0.03928 ? rs/12.92 : ((rs+0.055)/1.055)^2.4
  G = (同上)
  B = (同上)
  return 0.2126*R + 0.7152*G + 0.0722*B

contrast(c1, c2):
  L1, L2 = sort([luminance(c1), luminance(c2)], desc)
  return (L1 + 0.05) / (L2 + 0.05)
```

実装は Bash で node ワンライナーで計算しても良いし、`apps/web/scripts/validate-tokens.ts` を流用しても良い。

## 違反トークン検出 (Design.md §3 準拠)

以下を全コードベース横断で Grep し、違反として報告する (削除はしない、指摘のみ):

- **hex 直書き**: `#[0-9a-fA-F]{3,8}` を `*.tsx` / `*.ts` / `*.css` / `*.mdx` で検索。`tokens.css` / `themes/*.css` の primitive 定義箇所を除外
- **許容外 Tailwind パレット**: `bg-(slate|gray|zinc|neutral|stone)-\d+` / `text-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+` 等の生パレット直書き (Design.md §3 では semantic token 経由 `bg-brand-orange` / `text-link` 等のみ許容)
- **ブランド色の hex 直書き**: `#c2410c` / `#d23a3a` / `#005d8c` を Grep し、token 経由でない箇所を「ブランド色 hex 直書き違反」として最上位の重要度で報告

違反は判定レポートの「## 違反一覧」セクションに集約する。

## 出力

- 生成した md ファイル path
- token 総数 / 違反件数 (AA / AAA 別)
- 未使用 token (使用件数 0) の一覧 → 削除提案ではなく「使用状況の指摘」のみ (§1.1 削除禁止)
- Design.md §3 違反トークン件数 (hex 直書き / 許容外 Tailwind パレット / ブランド hex)

## 注意

- token の削除提案は禁止。「未使用ですが残します」と明示
- HC (high-contrast) テーマでは AAA を必達目標 (CLAUDE.md §4.1)
- ランダム値や生成時刻に依存する token (例: `--theme-version-stamp`) は対象外
