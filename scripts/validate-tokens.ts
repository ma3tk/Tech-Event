/* ============================================================
 * validate-tokens.ts — トークン定義の整合性検証 (CI 用)
 *
 * 検証項目:
 *   1. tokens.css の全変数が tokens/primitive.json + tokens/motion.json
 *      のいずれかに存在する (CSS → JSON sync 漏れ検出)
 *   2. themes/light.css の全変数が tokens/semantic.light.json に存在
 *   3. themes/dark.css の全変数が tokens/semantic.dark.json に存在
 *   4. 名前空間規則 (--ns-name パターン) 違反検出:
 *        - 単独 `_` (アンダースコア) 禁止
 *        - 全小文字 + ハイフン区切り
 *        - 長すぎる (5 セグメント超) 名前は警告
 *   5. JSON 側の参照 `{x.y.z}` が指す path が実在する (dangling reference 検出)
 *
 * 違反があれば exit code 1 で終了する。
 *
 * 使い方: `pnpm tsx scripts/validate-tokens.ts` または `pnpm tokens:validate`
 * ============================================================ */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const CSS_FILES = {
  primitive: path.join(ROOT, "src/styles/tokens.css"),
  semantic: path.join(ROOT, "src/styles/semantic.css"),
  light: path.join(ROOT, "src/styles/themes/light.css"),
  dark: path.join(ROOT, "src/styles/themes/dark.css"),
} as const;

const JSON_FILES = {
  primitive: path.join(ROOT, "tokens/primitive.json"),
  motion: path.join(ROOT, "tokens/motion.json"),
  light: path.join(ROOT, "tokens/semantic.light.json"),
  dark: path.join(ROOT, "tokens/semantic.dark.json"),
} as const;

type TokenLeaf = { value: string; type: string };
type TokenNode = TokenLeaf | { [k: string]: TokenNode };

const errors: string[] = [];
const warnings: string[] = [];

/* ============================================================
 * CSS パース
 * ============================================================ */

function stripComments(s: string): string {
  return s.replace(/\/\*[\s\S]*?\*\//g, "");
}
function stripMediaBlocks(css: string): string {
  const out: string[] = [];
  let i = 0;
  while (i < css.length) {
    if (css.startsWith("@media", i)) {
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

function parseCssVars(file: string): Set<string> {
  const raw = fs.readFileSync(file, "utf8");
  const cleaned = stripMediaBlocks(stripComments(raw));
  const set = new Set<string>();
  const re = /(--[a-zA-Z0-9-]+)\s*:\s*[^;{}]+;/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleaned)) !== null) {
    set.add(m[1].trim());
  }
  return set;
}

/* ============================================================
 * JSON 走査
 * ============================================================ */

function isLeaf(n: TokenNode): n is TokenLeaf {
  return (
    n !== null &&
    typeof n === "object" &&
    "value" in n &&
    "type" in n &&
    typeof (n as TokenLeaf).value === "string"
  );
}

/**
 * JSON ツリーから全 leaf の path (DEFAULT を含む元の CSS 変数名)
 * を再構築する。
 */
function collectCssVarNames(
  node: Record<string, TokenNode>,
  prefix: string[] = [],
  out: Set<string> = new Set(),
): Set<string> {
  for (const [k, v] of Object.entries(node)) {
    const p = k === "DEFAULT" ? prefix : [...prefix, k];
    if (isLeaf(v)) {
      out.add(pathToCssVar(p));
    } else {
      collectCssVarNames(v as Record<string, TokenNode>, p, out);
    }
  }
  return out;
}

function collectAllReferences(
  node: Record<string, TokenNode>,
  out: string[] = [],
): string[] {
  for (const v of Object.values(node)) {
    if (isLeaf(v)) {
      const refs = [...v.value.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
      out.push(...refs);
    } else {
      collectAllReferences(v as Record<string, TokenNode>, out);
    }
  }
  return out;
}

function lookupPath(node: Record<string, TokenNode>, segs: string[]): TokenNode | null {
  let cur: TokenNode | undefined = node[segs[0]];
  for (let i = 1; i < segs.length; i++) {
    if (cur == null || isLeaf(cur)) return null;
    cur = (cur as Record<string, TokenNode>)[segs[i]];
  }
  return cur ?? null;
}

/* ============================================================
 * path → CSS 変数名
 *
 * scripts/sync-tokens.ts と同じ規則。
 * ============================================================ */

function pathToCssVar(segs: string[]): string {
  if (segs[0] === "motion" && segs[1] === "duration")
    return `--duration-${segs.slice(2).join("-")}`;
  if (segs[0] === "motion" && segs[1] === "easing")
    return `--ease-${segs.slice(2).join("-")}`;
  if (segs[0] === "typography" && segs[1] === "fontSize")
    return `--font-size-${segs.slice(2).join("-")}`;
  if (segs[0] === "typography" && segs[1] === "fontWeight")
    return `--font-weight-${segs.slice(2).join("-")}`;
  if (segs[0] === "typography" && segs[1] === "lineHeight")
    return `--line-height-${segs.slice(2).join("-")}`;
  if (segs[0] === "typography" && segs.length === 3)
    return `--typography-${segs[1]}-${segs[2]}`;
  if (segs[0] === "typography")
    return `--${segs.join("-")}`;
  if (segs[0] === "zIndex")
    return `--z-${segs.slice(1).join("-")}`;
  if (segs[0] === "borderWidth")
    return `--border-width-${segs.slice(1).join("-")}`;
  if (segs[0] === "color" && segs[1] === "linkBlue")
    return `--color-link-blue-${segs.slice(2).join("-")}`;
  const kebab = segs
    .map((s) => s.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase())
    .join("-");
  return `--${kebab}`;
}

/* ============================================================
 * 名前空間ルール
 * ============================================================ */

const NAMESPACE_PATTERNS: RegExp[] = [
  /^--color-(?:white|black|gray|orange|red|green|blue|yellow|link-blue)-?[a-z0-9-]*$/,
  /^--font-(?:size|weight)-[a-z0-9-]+$/,
  /^--line-height-[a-z]+$/,
  /^--spacing-\d+$/,
  /^--radius-[a-z0-9-]+$/,
  /^--shadow-[a-z]+$/,
  /^--elevation-[a-z]+$/,
  /^--z-[a-z]+$/,
  /^--border-width-\d+$/,
  /^--duration-[a-z]+$/,
  /^--ease-(?:linear|in|out|in-out|spring)$/,
  /^--typography-[a-z0-9]+-[a-z]+$/,
  /^--layout-[a-z-]+$/,
  /^--container-[a-z0-9-]+$/,
  /^--brand-(?:orange|red|foreground)(?:-[a-z]+)?$/,
  /^--link(?:-hover)?$/,
  /^--status-[a-z]+-(?:bg|fg)$/,
  /^--focus-ring-[a-z]+$/,
  // 既存の semantic 単独名
  /^--(?:background|foreground|surface|surface-muted|muted|muted-foreground|border|border-strong)$/,
];

function isValidNamespace(name: string): boolean {
  if (!/^--[a-z0-9-]+$/.test(name)) return false; // 大文字 / _ 禁止
  if (name.includes("--", 2)) return false; // 連続ハイフン
  return NAMESPACE_PATTERNS.some((re) => re.test(name));
}

/* ============================================================
 * 検証ロジック
 * ============================================================ */

function check(label: string, cssVars: Set<string>, jsonVars: Set<string>): void {
  for (const v of cssVars) {
    if (!jsonVars.has(v)) {
      errors.push(`[${label}] CSS変数 ${v} が JSON に存在しません`);
    }
  }
  for (const v of jsonVars) {
    if (!cssVars.has(v)) {
      errors.push(`[${label}] JSON 側の ${v} が CSS に存在しません (orphan)`);
    }
  }
}

function checkNamespaces(cssVars: Set<string>, label: string): void {
  for (const v of cssVars) {
    if (!isValidNamespace(v)) {
      errors.push(`[${label}] 名前空間規則違反: ${v}`);
    }
    const segCount = v.replace(/^--/, "").split("-").length;
    if (segCount > 6) {
      warnings.push(`[${label}] 名前が長すぎます (${segCount} segments): ${v}`);
    }
  }
}

function checkReferences(
  label: string,
  node: Record<string, TokenNode>,
  primitiveRoot: Record<string, TokenNode>,
): void {
  // semantic JSON の参照 (e.g. {color.gray.100}) は primitive ツリーに対して引く
  const refs = collectAllReferences(node);
  for (const r of refs) {
    const segs = r.split(".");
    const found =
      lookupPath(node, segs) ??
      lookupPath(primitiveRoot, segs);
    if (found == null) {
      errors.push(`[${label}] 参照先 {${r}} がどの JSON にも存在しません`);
    }
  }
}

function main(): void {
  const cssPrimitive = parseCssVars(CSS_FILES.primitive);
  const cssSemantic = parseCssVars(CSS_FILES.semantic);
  const cssLight = parseCssVars(CSS_FILES.light);
  const cssDark = parseCssVars(CSS_FILES.dark);

  const primJson = JSON.parse(fs.readFileSync(JSON_FILES.primitive, "utf8")) as Record<
    string,
    TokenNode
  >;
  const motionJson = JSON.parse(fs.readFileSync(JSON_FILES.motion, "utf8")) as Record<
    string,
    TokenNode
  >;
  const lightJson = JSON.parse(fs.readFileSync(JSON_FILES.light, "utf8")) as Record<
    string,
    TokenNode
  >;
  const darkJson = JSON.parse(fs.readFileSync(JSON_FILES.dark, "utf8")) as Record<
    string,
    TokenNode
  >;

  // 名前空間規則検証
  checkNamespaces(cssPrimitive, "primitive");
  checkNamespaces(cssSemantic, "semantic");
  checkNamespaces(cssLight, "light");
  checkNamespaces(cssDark, "dark");

  // primitive: tokens.css = primitive.json ∪ motion.json
  const primJsonVars = collectCssVarNames(primJson);
  const motionJsonVars = collectCssVarNames(motionJson);
  const allPrimVars = new Set([...primJsonVars, ...motionJsonVars]);
  check("primitive", cssPrimitive, allPrimVars);

  // themes: leaf 名は CSS と JSON で一致するはず
  check("light", cssLight, collectCssVarNames(lightJson));
  check("dark", cssDark, collectCssVarNames(darkJson));

  // 参照整合性
  checkReferences("light", lightJson, primJson);
  checkReferences("dark", darkJson, primJson);
  checkReferences("primitive", primJson, primJson);
  checkReferences("motion", motionJson, primJson);

  // semantic.css は primitive を参照するだけなので JSON とは比較しない (定数 alias)
  // 但し名前空間規則は適用済み。

  for (const w of warnings) {
    console.warn(`WARN  ${w}`);
  }
  if (errors.length > 0) {
    for (const e of errors) {
      console.error(`ERROR ${e}`);
    }
    console.error(`\n[validate-tokens] 失敗: ${errors.length} 件のエラー、${warnings.length} 件の警告`);
    process.exit(1);
  }
  console.log(
    `[validate-tokens] OK — primitive(${cssPrimitive.size}) + semantic(${cssSemantic.size}) + light(${cssLight.size}) + dark(${cssDark.size}) 変数を検証 (警告 ${warnings.length} 件)`,
  );
}

main();
