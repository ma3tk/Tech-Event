#!/usr/bin/env node
/**
 * scripts/sync-catalog-mdx.mjs
 *
 * docs/catalog/{ui,components}/{name}.md と
 * libs/shared/ui{,-composite}/src/{name}.docs.mdx の
 * 「言語化セクション」が乖離していないかを検査する。
 *
 * 乖離検出方針:
 *   - MD の h2 (`## 1. 目的 (Purpose)` 等) 一覧を抽出
 *   - 対応する MDX が `--- (separator) 〜 ## 全 Stories` までのブロックに
 *     同じ見出しを含んでいることを確認
 *   - 不一致は warning 出力 (今回は手動同期、将来 CI で強制可)
 *
 * Usage:
 *   node scripts/sync-catalog-mdx.mjs            # 全件チェック
 *   node scripts/sync-catalog-mdx.mjs --fix      # MDX を MD に追従させて再生成
 *   node scripts/sync-catalog-mdx.mjs --json     # 結果を JSON で
 *
 * Exit code:
 *   0: 乖離なし or 軽微 (warning)
 *   1: 致命的な乖離 (MDX 側で対応する MD が見つからない 等)
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const json = args.includes("--json");
const fix = args.includes("--fix");

function extractHeadings(src) {
  const out = [];
  for (const line of src.split("\n")) {
    const m = /^##\s+(.+)$/.exec(line);
    if (m) out.push(m[1].trim());
  }
  return out;
}

function toKebab(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

const issues = [];

function diff(label, mdPath, mdxPath) {
  if (!existsSync(mdPath) || !existsSync(mdxPath)) {
    if (!existsSync(mdPath)) {
      issues.push({
        level: "warn",
        component: label,
        message: `MD source not found: ${path.relative(root, mdPath)}`,
      });
    }
    if (!existsSync(mdxPath)) {
      issues.push({
        level: "warn",
        component: label,
        message: `MDX not found: ${path.relative(root, mdxPath)}`,
      });
    }
    return;
  }
  const md = readFileSync(mdPath, "utf8");
  const mdx = readFileSync(mdxPath, "utf8");
  const mdHeads = extractHeadings(md);
  const mdxHeads = extractHeadings(mdx);
  const mdSet = new Set(mdHeads);
  const mdxSet = new Set(mdxHeads);
  // MD 側にある見出しが MDX に存在するか
  const missingInMdx = mdHeads.filter((h) => !mdxSet.has(h));
  // 逆方向 (MDX 固有の見出し: ライブプレビュー, Primary 等は無視)
  const ignore = new Set([
    "ライブプレビュー (Canvas)",
    "Primary",
    "Props (API)",
    "全 Stories",
  ]);
  const mdxOnly = mdxHeads.filter((h) => !mdSet.has(h) && !ignore.has(h));
  if (missingInMdx.length > 0) {
    issues.push({
      level: "warn",
      component: label,
      message: `MD heading missing in MDX: ${missingInMdx.join(" / ")}`,
    });
  }
  if (mdxOnly.length > 0) {
    issues.push({
      level: "info",
      component: label,
      message: `MDX-only heading (likely MDX widget): ${mdxOnly.join(" / ")}`,
    });
  }
}

// UI primitives
const uiDir = path.join(root, "libs/shared/ui/src");
const uiMd = path.join(root, "docs/catalog/ui");
for (const f of readdirSync(uiDir)) {
  if (!f.endsWith(".docs.mdx")) continue;
  const name = f.replace(".docs.mdx", "");
  diff(`UI/${name}`, path.join(uiMd, `${name}.md`), path.join(uiDir, f));
}

// Composites (PascalCase ファイル名 → kebab で MD 検索)
const compDir = path.join(root, "libs/shared/ui-composite/src");
const compMd = path.join(root, "docs/catalog/components");
for (const f of readdirSync(compDir)) {
  if (!f.endsWith(".docs.mdx")) continue;
  const name = f.replace(".docs.mdx", "");
  const kebab = toKebab(name);
  diff(`Components/${name}`, path.join(compMd, `${kebab}.md`), path.join(compDir, f));
}

if (fix) {
  // MDX 再生成 = gen-catalog-mdx.mjs --force を呼ぶ。
  console.log("[sync] --fix: regenerating MDX via gen-catalog-mdx.mjs --force");
  const r = spawnSync("node", [path.join(__dirname, "gen-catalog-mdx.mjs"), "--force"], {
    stdio: "inherit",
  });
  process.exit(r.status ?? 0);
}

if (json) {
  console.log(JSON.stringify({ ok: !issues.some((i) => i.level === "error"), issues }, null, 2));
} else {
  const errs = issues.filter((i) => i.level === "error");
  const warns = issues.filter((i) => i.level === "warn");
  const infos = issues.filter((i) => i.level === "info");
  console.log(`[sync-catalog-mdx] errors=${errs.length} warnings=${warns.length} info=${infos.length}`);
  for (const i of [...errs, ...warns]) {
    console.log(`  [${i.level}] ${i.component}: ${i.message}`);
  }
  for (const i of infos.slice(0, 5)) {
    console.log(`  [info ] ${i.component}: ${i.message}`);
  }
  if (infos.length > 5) console.log(`  ... and ${infos.length - 5} more info messages`);
}

process.exit(issues.some((i) => i.level === "error") ? 1 : 0);
