/* ============================================================
 * sync-tokens.ts — CSS 変数 ⇄ Figma Tokens Studio JSON 同期
 *
 * 目的:
 *   `src/styles/*.css` の CSS 変数 (primitive / semantic / theme) を
 *   `tokens/*.json` (Figma Tokens Studio 互換) に書き出す。逆方向
 *   (`--reverse`) では JSON を読んで CSS を書き戻す (style-dictionary 風)。
 *
 * 出力ファイル:
 *   tokens/primitive.json       — tokens.css 由来
 *   tokens/semantic.light.json  — themes/light.css 由来
 *   tokens/semantic.dark.json   — themes/dark.css 由来
 *   tokens/motion.json          — tokens.css のうち duration/ease/transition
 *
 * Figma Tokens Studio 互換フォーマット:
 *   { "color": { "gray": { "50": { "value": "#f9fafb", "type": "color" } } } }
 *
 * 名前空間規則 (`tokens/README.md` 参照):
 *   --color-{hue}-{step}   → color.{hue}.{step}
 *   --font-size-{name}     → typography.fontSize.{name}
 *   --font-weight-{name}   → typography.fontWeight.{name}
 *   --line-height-{name}   → typography.lineHeight.{name}
 *   --spacing-{n}          → spacing.{n}
 *   --radius-{name}        → radius.{name}
 *   --shadow-{name}        → shadow.{name}
 *   --z-{name}             → zIndex.{name}
 *   --border-width-{n}     → borderWidth.{n}
 *   --duration-{name}      → motion.duration.{name}
 *   --ease-{name}          → motion.easing.{name}
 *   --(brand|status|...)-* → semantic 配下のネスト
 *
 * 使い方:
 *   pnpm tokens                 # CSS → JSON (default)
 *   pnpm tokens -- --reverse    # JSON → CSS
 * ============================================================ */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// apps/web/scripts → apps/web
const APP_ROOT = path.resolve(__dirname, "..");
// apps/web → workspace root
const WORKSPACE_ROOT = path.resolve(APP_ROOT, "../..");
// tokens は Nx 化で libs/shared/util-design-tokens/src/tokens に移動済み。
const TOKENS_ROOT = path.join(
  WORKSPACE_ROOT,
  "libs/shared/util-design-tokens/src/tokens",
);

const CSS_FILES = {
  primitive: path.join(APP_ROOT, "src/styles/tokens.css"),
  light: path.join(APP_ROOT, "src/styles/themes/light.css"),
  dark: path.join(APP_ROOT, "src/styles/themes/dark.css"),
} as const;

const JSON_FILES = {
  primitive: path.join(TOKENS_ROOT, "primitive.json"),
  light: path.join(TOKENS_ROOT, "semantic.light.json"),
  dark: path.join(TOKENS_ROOT, "semantic.dark.json"),
  motion: path.join(TOKENS_ROOT, "motion.json"),
} as const;

/* ============================================================
 * CSS パーサ (簡易)
 *
 * 対象は `--name: value;` の行のみ。block-scoped (`:root { ... }`,
 * `[data-theme="dark"] { ... }`) の中身もすべて拾うが、`@media` 内の
 * 重複はトップレベルブロックを優先する (= 最初に出てきた定義を採用)。
 * ============================================================ */

type Vars = Record<string, string>;

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * `@media (prefers-reduced-motion: reduce) { :root { ... } }` などの
 * `@media` ブロック全体を除外して、トップレベル定義だけを残す。
 * (Tokens Studio 側にメディアクエリ用の上書きを書き出す手段が無いため。)
 */
function stripMediaBlocks(css: string): string {
  const out: string[] = [];
  let i = 0;
  while (i < css.length) {
    if (css.startsWith("@media", i)) {
      // 次の `{` を見つけてブレースを数えてスキップ
      const braceStart = css.indexOf("{", i);
      if (braceStart === -1) break;
      let depth = 1;
      let j = braceStart + 1;
      while (j < css.length && depth > 0) {
        if (css[j] === "{") depth++;
        else if (css[j] === "}") depth--;
        j++;
      }
      i = j;
    } else {
      out.push(css[i]);
      i++;
    }
  }
  return out.join("");
}

function parseCssVars(file: string): Vars {
  const raw = fs.readFileSync(file, "utf8");
  const cleaned = stripMediaBlocks(stripComments(raw));
  const vars: Vars = {};
  // 値は ; で終わるが、 box-shadow 等で複数行になるケースに対応するため
  // 行末ではなく ";" まで貪欲に読む。
  const re = /(--[a-zA-Z0-9-]+)\s*:\s*([^;{}]+);/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleaned)) !== null) {
    const name = m[1].trim();
    const value = m[2].trim().replace(/\s+/g, " ");
    if (!(name in vars)) vars[name] = value;
  }
  return vars;
}

/* ============================================================
 * 値 → Figma Tokens Studio の `type` 推定
 * ============================================================ */

type TokenType =
  | "color"
  | "fontSizes"
  | "fontWeights"
  | "lineHeights"
  | "spacing"
  | "borderRadius"
  | "boxShadow"
  | "other"
  | "borderWidth"
  | "duration"
  | "cubicBezier";

function inferType(name: string, value: string): TokenType {
  if (name.startsWith("--color-")) return "color";
  if (name.startsWith("--font-size-")) return "fontSizes";
  if (name.startsWith("--font-weight-")) return "fontWeights";
  if (name.startsWith("--line-height-")) return "lineHeights";
  if (name.startsWith("--spacing-")) return "spacing";
  if (name.startsWith("--radius-")) return "borderRadius";
  if (name.startsWith("--shadow-") || name.startsWith("--elevation-"))
    return "boxShadow";
  if (name.startsWith("--border-width-")) return "borderWidth";
  if (name.startsWith("--duration-")) return "duration";
  if (name.startsWith("--ease-")) return "cubicBezier";
  // semantic colors — 色名で始まらないが #/rgb/var(--color- を含めば color
  if (
    /^#|^rgb|^hsl|^var\(--color-/.test(value) ||
    /-bg$|-fg$|-foreground$|^--brand|^--link|^--background$|^--foreground$|^--surface|^--muted|^--border/.test(
      name,
    )
  ) {
    return "color";
  }
  return "other";
}

/* ============================================================
 * 名前空間 (パス) の決定
 *
 * 例:
 *   --color-gray-50            → ["color", "gray", "50"]
 *   --color-link-blue-300      → ["color", "linkBlue", "300"]   (link-blue は別系)
 *   --font-size-xs             → ["typography", "fontSize", "xs"]
 *   --duration-fast            → ["motion", "duration", "fast"]
 *   --ease-out                 → ["motion", "easing", "out"]
 *   --brand-orange-hover       → ["brand", "orange", "hover"]
 *   --status-open-bg           → ["status", "open", "bg"]
 *   --elevation-card           → ["elevation", "card"]
 *   --radius-card              → ["radius", "card"]
 *   --typography-h1-size       → ["typography", "h1", "size"]
 * ============================================================ */

function toPath(name: string): string[] {
  const stripped = name.replace(/^--/, "");

  // 色スケール (color-{hue}-{step})
  if (stripped.startsWith("color-")) {
    const rest = stripped.slice("color-".length);
    // link-blue-300 のように 2 単語の hue を別扱い
    const knownComposite = ["link-blue"];
    for (const c of knownComposite) {
      if (rest.startsWith(c + "-")) {
        const step = rest.slice(c.length + 1);
        return ["color", camelize(c), step];
      }
    }
    // gray-50, orange-700 — hue / step
    const parts = rest.split("-");
    if (parts.length === 2) return ["color", parts[0], parts[1]];
    // color-white / color-black
    if (parts.length === 1) return ["color", parts[0]];
    return ["color", ...parts];
  }

  if (stripped.startsWith("font-size-"))
    return ["typography", "fontSize", stripped.slice("font-size-".length)];
  if (stripped.startsWith("font-weight-"))
    return ["typography", "fontWeight", stripped.slice("font-weight-".length)];
  if (stripped.startsWith("line-height-"))
    return ["typography", "lineHeight", stripped.slice("line-height-".length)];
  if (stripped.startsWith("font-")) return ["typography", "font", stripped.slice("font-".length)];

  if (stripped.startsWith("spacing-"))
    return ["spacing", stripped.slice("spacing-".length)];
  if (stripped.startsWith("radius-"))
    return ["radius", stripped.slice("radius-".length)];
  if (stripped.startsWith("border-width-"))
    return ["borderWidth", stripped.slice("border-width-".length)];

  if (stripped.startsWith("shadow-"))
    return ["shadow", stripped.slice("shadow-".length)];
  if (stripped.startsWith("elevation-"))
    return ["elevation", stripped.slice("elevation-".length)];

  if (stripped.startsWith("z-"))
    return ["zIndex", stripped.slice("z-".length)];

  if (stripped.startsWith("duration-"))
    return ["motion", "duration", stripped.slice("duration-".length)];
  if (stripped.startsWith("ease-"))
    return ["motion", "easing", stripped.slice("ease-".length)];

  if (stripped.startsWith("layout-"))
    return ["layout", stripped.slice("layout-".length)];

  if (stripped.startsWith("typography-")) {
    const rest = stripped.slice("typography-".length);
    // h1-size, h1-line, h1-weight
    const parts = rest.split("-");
    return ["typography", ...parts];
  }

  if (stripped.startsWith("container-"))
    return ["container", stripped.slice("container-".length)];

  if (stripped.startsWith("brand-")) {
    const parts = stripped.slice("brand-".length).split("-");
    return ["brand", ...parts];
  }
  if (stripped.startsWith("status-")) {
    const parts = stripped.slice("status-".length).split("-");
    return ["status", ...parts];
  }
  if (stripped.startsWith("focus-")) {
    const parts = stripped.slice("focus-".length).split("-");
    return ["focus", ...parts];
  }

  // surface, foreground, background, muted, border, link 単体
  if (
    [
      "background",
      "surface",
      "surface-muted",
      "foreground",
      "muted",
      "muted-foreground",
      "border",
      "border-strong",
      "link",
      "link-hover",
    ].includes(stripped)
  ) {
    return stripped.split("-").length === 1 ? [stripped] : stripped.split("-");
  }

  return stripped.split("-");
}

function camelize(s: string): string {
  return s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

/* ============================================================
 * Tokens Studio JSON ビルド
 * ============================================================ */

type TokenLeaf = { value: string; type: TokenType };
type TokenNode = TokenLeaf | { [key: string]: TokenNode };

/**
 * CSS `var(--xxx)` 参照を Tokens Studio の `{path.to.token}` 参照に変換する。
 * 解決できない場合は原文を残す。
 */
function valueToTokensStudio(value: string): string {
  return value.replace(/var\((--[a-zA-Z0-9-]+)\)/g, (_, varName: string) => {
    const p = toPath(varName).join(".");
    return `{${p}}`;
  });
}

/**
 * 深い位置に leaf を設定。
 *
 * `--surface` (leaf at "surface") と `--surface-muted` (leaf at "surface.muted")
 * の両方がある場合、Tokens Studio では同じキーに leaf と subtree を同居させら
 * れないため、単独の leaf は `DEFAULT` キー (Tailwind 規約) に移動する。
 */
function setDeep(root: Record<string, TokenNode>, p: string[], leaf: TokenLeaf): void {
  if (p.length === 1) {
    const k = p[0];
    const existing = root[k];
    if (existing && !isLeaf(existing)) {
      // すでに subtree が存在 → DEFAULT として置く
      (existing as Record<string, TokenNode>).DEFAULT = leaf;
    } else {
      root[k] = leaf;
    }
    return;
  }
  let cur: Record<string, TokenNode> = root;
  for (let i = 0; i < p.length - 1; i++) {
    const k = p[i];
    const existing = cur[k];
    if (existing == null) {
      cur[k] = {};
    } else if (isLeaf(existing)) {
      // 既存 leaf を DEFAULT に降格してから subtree 化
      cur[k] = { DEFAULT: existing };
    }
    cur = cur[k] as Record<string, TokenNode>;
  }
  const lastKey = p[p.length - 1];
  const existing = cur[lastKey];
  if (existing && !isLeaf(existing)) {
    (existing as Record<string, TokenNode>).DEFAULT = leaf;
  } else {
    cur[lastKey] = leaf;
  }
}

function isLeaf(node: TokenNode): node is TokenLeaf {
  return (
    node !== null &&
    typeof node === "object" &&
    "value" in node &&
    "type" in node &&
    typeof (node as TokenLeaf).value === "string"
  );
}

type Filter = (name: string) => boolean;

function buildTree(vars: Vars, filter?: Filter): Record<string, TokenNode> {
  const root: Record<string, TokenNode> = {};
  for (const [name, value] of Object.entries(vars)) {
    if (filter && !filter(name)) continue;
    const p = toPath(name);
    const type = inferType(name, value);
    const v = valueToTokensStudio(value);
    setDeep(root, p, { value: v, type });
  }
  return root;
}

/* ============================================================
 * CSS → JSON 方向
 * ============================================================ */

function isMotionName(name: string): boolean {
  return name.startsWith("--duration-") || name.startsWith("--ease-");
}

function isPrimitiveName(name: string): boolean {
  if (isMotionName(name)) return false;
  // 全部 primitive 扱い (tokens.css に書いてあるもの)
  return true;
}

function exportToJson(): void {
  const primitiveVars = parseCssVars(CSS_FILES.primitive);
  const lightVars = parseCssVars(CSS_FILES.light);
  const darkVars = parseCssVars(CSS_FILES.dark);

  fs.mkdirSync(TOKENS_ROOT, { recursive: true });

  const primitive = buildTree(primitiveVars, (n) => isPrimitiveName(n));
  const motion = buildTree(primitiveVars, isMotionName);
  const light = buildTree(lightVars);
  const dark = buildTree(darkVars);

  fs.writeFileSync(JSON_FILES.primitive, JSON.stringify(primitive, null, 2) + "\n", "utf8");
  fs.writeFileSync(JSON_FILES.motion, JSON.stringify(motion, null, 2) + "\n", "utf8");
  fs.writeFileSync(JSON_FILES.light, JSON.stringify(light, null, 2) + "\n", "utf8");
  fs.writeFileSync(JSON_FILES.dark, JSON.stringify(dark, null, 2) + "\n", "utf8");

  const counts = {
    primitive: countLeaves(primitive),
    motion: countLeaves(motion),
    light: countLeaves(light),
    dark: countLeaves(dark),
  };
  console.log("[sync-tokens] CSS → JSON 完了");
  console.log(`  tokens/primitive.json      : ${counts.primitive} tokens`);
  console.log(`  tokens/motion.json         : ${counts.motion} tokens`);
  console.log(`  tokens/semantic.light.json : ${counts.light} tokens`);
  console.log(`  tokens/semantic.dark.json  : ${counts.dark} tokens`);
  console.log(`  total                      : ${counts.primitive + counts.motion + counts.light + counts.dark}`);
}

function countLeaves(node: TokenNode | Record<string, TokenNode>): number {
  if (isLeaf(node as TokenNode)) return 1;
  let sum = 0;
  for (const v of Object.values(node as Record<string, TokenNode>)) {
    sum += countLeaves(v);
  }
  return sum;
}

/* ============================================================
 * JSON → CSS 方向 (--reverse)
 *
 * 既存 CSS のフォーマット (コメント / 順序 / 空行) を保持するため、
 * 「行単位で `--name: value;` を見つけて、JSON 側に存在する場合のみ
 * value を置換する」アプローチを取る。新規追加には対応しない。
 * ============================================================ */

function pathFromTreeAndKey(
  node: Record<string, TokenNode>,
  found: Map<string, string>,
  prefix: string[] = [],
): void {
  for (const [k, v] of Object.entries(node)) {
    // DEFAULT は親のパスに対する leaf として扱う
    const p = k === "DEFAULT" ? prefix : [...prefix, k];
    if (isLeaf(v)) {
      // Tokens Studio reference `{...}` を `var(--...)` に戻す
      const value = v.value.replace(/\{([^}]+)\}/g, (_, ref: string) => {
        const segs = ref.split(".").filter((s: string) => s !== "DEFAULT");
        return `var(${pathToCssVar(segs)})`;
      });
      found.set(p.join("."), value);
    } else {
      pathFromTreeAndKey(v as Record<string, TokenNode>, found, p);
    }
  }
}

function pathToCssVar(segs: string[]): string {
  // segs を `--seg1-seg2-...` に戻す (camelCase → kebab-case)
  const kebab = segs
    .map((s) => s.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase())
    .join("-");
  // 既知のプレフィックス変換: color.* → --color-*, motion.duration.* → --duration-*
  // segs[0] が "motion" のとき特殊
  if (segs[0] === "motion" && segs[1] === "duration") {
    return `--duration-${segs.slice(2).join("-")}`;
  }
  if (segs[0] === "motion" && segs[1] === "easing") {
    return `--ease-${segs.slice(2).join("-")}`;
  }
  if (segs[0] === "typography" && segs[1] === "fontSize") {
    return `--font-size-${segs.slice(2).join("-")}`;
  }
  if (segs[0] === "typography" && segs[1] === "fontWeight") {
    return `--font-weight-${segs.slice(2).join("-")}`;
  }
  if (segs[0] === "typography" && segs[1] === "lineHeight") {
    return `--line-height-${segs.slice(2).join("-")}`;
  }
  if (segs[0] === "typography" && segs.length === 3) {
    // typography.h1.size → --typography-h1-size
    return `--typography-${segs[1]}-${segs[2]}`;
  }
  if (segs[0] === "zIndex") {
    return `--z-${segs.slice(1).join("-")}`;
  }
  if (segs[0] === "borderWidth") {
    return `--border-width-${segs.slice(1).join("-")}`;
  }
  if (segs[0] === "color" && segs[1] === "linkBlue") {
    return `--color-link-blue-${segs.slice(2).join("-")}`;
  }
  return `--${kebab}`;
}

function importFromJson(): void {
  const primitive = JSON.parse(fs.readFileSync(JSON_FILES.primitive, "utf8")) as Record<
    string,
    TokenNode
  >;
  const motion = JSON.parse(fs.readFileSync(JSON_FILES.motion, "utf8")) as Record<
    string,
    TokenNode
  >;
  const light = JSON.parse(fs.readFileSync(JSON_FILES.light, "utf8")) as Record<
    string,
    TokenNode
  >;
  const dark = JSON.parse(fs.readFileSync(JSON_FILES.dark, "utf8")) as Record<
    string,
    TokenNode
  >;

  const primitiveMap = new Map<string, string>();
  pathFromTreeAndKey(primitive, primitiveMap);
  pathFromTreeAndKey(motion, primitiveMap);

  const lightMap = new Map<string, string>();
  pathFromTreeAndKey(light, lightMap);

  const darkMap = new Map<string, string>();
  pathFromTreeAndKey(dark, darkMap);

  rewriteCss(CSS_FILES.primitive, primitiveMap);
  rewriteCss(CSS_FILES.light, lightMap);
  rewriteCss(CSS_FILES.dark, darkMap);

  console.log("[sync-tokens] JSON → CSS 完了");
  console.log(`  ${path.relative(APP_ROOT, CSS_FILES.primitive)}`);
  console.log(`  ${path.relative(APP_ROOT, CSS_FILES.light)}`);
  console.log(`  ${path.relative(APP_ROOT, CSS_FILES.dark)}`);
}

/**
 * 既存 CSS の `--name: value;` を JSON 値で書き換える。
 *
 * 注意点:
 *   - `@media` ブロック内 (e.g. prefers-reduced-motion オーバーライド) は
 *     置換対象から除外する。 Tokens Studio はメディアクエリを表現できない
 *     ため、そこを書き換えてしまうとオーバーライドが消えてしまう。
 *   - コメントブロックは温存する。
 */
function rewriteCss(file: string, valuesByDotPath: Map<string, string>): void {
  const raw = fs.readFileSync(file, "utf8");

  // `@media (...) { ... }` の範囲を [start, end) の配列で記録
  const mediaRanges: Array<[number, number]> = [];
  {
    let i = 0;
    while (i < raw.length) {
      const idx = raw.indexOf("@media", i);
      if (idx === -1) break;
      const braceStart = raw.indexOf("{", idx);
      if (braceStart === -1) break;
      let depth = 1;
      let j = braceStart + 1;
      while (j < raw.length && depth > 0) {
        if (raw[j] === "{") depth++;
        else if (raw[j] === "}") depth--;
        j++;
      }
      mediaRanges.push([idx, j]);
      i = j;
    }
  }

  const isInMedia = (pos: number): boolean =>
    mediaRanges.some(([a, b]) => pos >= a && pos < b);

  const re = /(--[a-zA-Z0-9-]+)(\s*:\s*)([^;{}]+)(;)/g;
  let out = "";
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    out += raw.slice(last, m.index);
    if (isInMedia(m.index)) {
      out += m[0];
    } else {
      const name = m[1];
      const sep = m[2];
      const end = m[4];
      const p = toPath(name).join(".");
      const v = valuesByDotPath.get(p);
      out += v == null ? m[0] : `${name}${sep}${v}${end}`;
    }
    last = m.index + m[0].length;
  }
  out += raw.slice(last);

  fs.writeFileSync(file, out, "utf8");
}

/* ============================================================
 * Entry
 * ============================================================ */

function main(): void {
  const args = process.argv.slice(2);
  if (args.includes("--reverse")) {
    importFromJson();
  } else {
    exportToJson();
  }
}

main();
