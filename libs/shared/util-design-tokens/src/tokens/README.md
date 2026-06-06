# Design Tokens — JSON エクスポート

このディレクトリは `src/styles/*.css` (CSS 変数で書かれたソース・オブ・トゥルース)
を **Figma Tokens Studio 互換 JSON** にエクスポートしたものです。 Figma 側のデザイ
ナーは Tokens Studio プラグインからこの JSON を読み込むことで、CSS と Figma の
トークン値を 1:1 で揃えられます。

## 1. ファイル構成

| ファイル | 由来 CSS | 内容 |
| --- | --- | --- |
| `primitive.json` | `src/styles/tokens.css` | 生の値: color スケール (gray/orange/red/green/blue/yellow/link-blue × 50..950)、typography、spacing、radius、shadow、z-index、border-width、layout |
| `motion.json` | `src/styles/tokens.css` (motion セクション) | duration (instant/fast/normal/slow/slower) と easing (linear/in/out/in-out/spring) |
| `semantic.light.json` | `src/styles/themes/light.css` | light テーマの semantic alias (background, foreground, brand-*, link, status-*, elevation-*) |
| `semantic.dark.json` | `src/styles/themes/dark.css` | dark テーマの semantic alias |

## 2. フォーマット仕様

Figma Tokens Studio の標準フォーマットに準拠:

```json
{
  "color": {
    "gray": {
      "50": { "value": "#f9fafb", "type": "color" },
      "100": { "value": "#f3f4f6", "type": "color" }
    }
  }
}
```

- `value` — 値そのもの (色 / 数値 / 文字列)。他のトークンへの参照は `{color.gray.100}` の波括弧記法。
- `type` — Tokens Studio が認識する type 名: `color`, `fontSizes`, `fontWeights`, `lineHeights`, `spacing`, `borderRadius`, `boxShadow`, `borderWidth`, `duration`, `cubicBezier`, `other`。

### `DEFAULT` キーについて

`--surface` (leaf) と `--surface-muted` (nested) のように、同じプレフィックスで
leaf と subtree が混在するケースは Tokens Studio で表現できないため、
Tailwind 規約に倣い leaf 側を `DEFAULT` キーに格納します。

```json
{
  "surface": {
    "DEFAULT": { "value": "{color.white}", "type": "color" },
    "muted":   { "value": "{color.gray.100}", "type": "color" }
  }
}
```

## 3. 名前空間規則

CSS 変数 ⇔ JSON path のマッピングは `scripts/sync-tokens.ts` で定義されています。

| CSS 変数 | JSON path |
| --- | --- |
| `--color-{hue}-{step}` | `color.{hue}.{step}` |
| `--color-link-blue-{step}` | `color.linkBlue.{step}` (camelCase) |
| `--font-size-{name}` | `typography.fontSize.{name}` |
| `--font-weight-{name}` | `typography.fontWeight.{name}` |
| `--line-height-{name}` | `typography.lineHeight.{name}` |
| `--typography-{h1..h6,body,small}-{size,line,weight}` | `typography.{name}.{property}` |
| `--spacing-{n}` | `spacing.{n}` |
| `--radius-{name}` | `radius.{name}` |
| `--shadow-{name}` | `shadow.{name}` |
| `--z-{name}` | `zIndex.{name}` |
| `--border-width-{n}` | `borderWidth.{n}` |
| `--duration-{name}` | `motion.duration.{name}` |
| `--ease-{name}` | `motion.easing.{name}` |
| `--brand-{family}[-{variant}]` | `brand.{family}[.variant]` |
| `--status-{name}-{bg\|fg}` | `status.{name}.{bg\|fg}` |
| `--elevation-{name}` | `elevation.{name}` |

違反は `pnpm tokens:validate` で検出されます。

## 4. 更新ワークフロー

### A. CSS が source of truth (デフォルト)

エンジニアが `src/styles/*.css` を編集したとき:

```bash
pnpm tokens          # CSS → JSON 再生成
pnpm tokens:validate # 整合性チェック
git add tokens/ src/styles/
git commit
```

Figma 側 (Tokens Studio プラグイン) は `tokens/` ディレクトリを GitHub から
プル: Tokens Studio の `Settings → Sync providers → GitHub` でこのリポジトリの
`tokens/` を指定。

### B. Figma が source of truth (デザインリードが値を決めるとき)

1. デザイナーが Figma の Tokens Studio で値を変更
2. プラグインから「Push to GitHub」で PR を作成 (この `tokens/` 配下が更新される)
3. エンジニアが PR を pull した後:

```bash
pnpm tokens -- --reverse   # JSON → CSS に書き戻し
pnpm tokens:validate       # 念のため整合性チェック
```

4. 差分を確認して commit。

> **注意**: `--reverse` モードは「既存 CSS 内の `--name: value;` のうち、JSON 側
> に対応 path がある行だけ value を上書き」する追記しないモードです。新規トー
> クンの追加は CSS 側を手で編集してから `pnpm tokens` を流す方が安全です。

## 5. CI 連携

`.github/workflows/*.yml` から `pnpm tokens:validate` を呼び出すことで、

- CSS だけ更新して JSON を忘れた / その逆
- 名前空間規則違反
- JSON 内 `{x.y.z}` 参照の dangling

を防止できます。

## 6. Tokens Studio 側の読み込み手順 (Figma)

1. Figma で **Tokens Studio for Figma** プラグインを起動
2. `Settings → Sync providers → GitHub` を選択
3. このリポジトリ + `tokens/` ディレクトリを指定
4. `Pull from Github` を実行
5. 各 set (primitive / motion / semantic.light / semantic.dark) をアクティブ化
6. semantic.light か semantic.dark のいずれかを「Active theme」に設定

## 7. 関連ドキュメント

- `docs/motion.md` — duration / easing の使い分け規約
- `src/stories/design-system/Motion.mdx` — Storybook 上の実物デモ
- `src/stories/design-system/Tokens.mdx` — トークン全体像
