#!/usr/bin/env node
/**
 * scripts/gen-catalog-mdx.mjs
 *
 * docs/catalog/{ui,components}/*.md と libs/shared/ui{,-composite}/src/*.stories.tsx
 * を突き合わせて、各 primitive / composite の `{name}.docs.mdx` を生成する。
 *
 * 生成された MDX は:
 *   - `<Meta of={Stories} name="Docs" />` で対応する CSF と紐付き
 *   - 元の `docs/catalog/.../{name}.md` の本文 (h1 を除く言語化テキスト) を全文移植
 *   - 主要 Story (Default / 代表的 variant) を `<Canvas of={...}>` で live preview 化
 *   - 末尾に `<Stories />` (全 Story 一覧) と `<Controls />` (props API)
 *
 * 既存の MDX を上書きしない (`--force` 指定時のみ上書き)。
 *
 * Usage:
 *   node scripts/gen-catalog-mdx.mjs                 # 新規のみ生成
 *   node scripts/gen-catalog-mdx.mjs --force         # 既存も上書き
 *   node scripts/gen-catalog-mdx.mjs --dry           # 表示のみ
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const force = args.includes("--force");
const dry = args.includes("--dry");

/** kebab/camel → PascalCase (button → Button, dropdown-menu → DropdownMenu) */
function toPascal(name) {
  return name
    .split(/[-_]/g)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

/** PascalCase → kebab-case (EventCard → event-card) */
function toKebab(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

/** Story export 一覧を抽出 (`export const Foo: Story = ...`) */
function extractStoryExports(storiesPath) {
  if (!existsSync(storiesPath)) return [];
  const src = readFileSync(storiesPath, "utf8");
  const re = /^export const ([A-Z][A-Za-z0-9_]*)\s*:\s*Story/gm;
  const out = [];
  let m;
  while ((m = re.exec(src))) out.push(m[1]);
  return out;
}

/**
 * MD 本文から h1 (`# Foo`) を取り除き、front-matter も除き、
 * MDX-safe な形に正規化する。
 *
 * MDX 3 は `<` を JSX として parse しようとするため、
 * fenced code block (` ``` `) と inline backtick の外にある `<` を
 * HTML entity (`&lt;`) に置換する必要がある。
 *
 * - YAML front-matter (---) を除去
 * - 先頭の `# タイトル` 行を除去
 * - fence / backtick 外の `<` を `&lt;` に escape
 */
function normalizeMd(raw) {
  let src = raw;
  // front-matter 除去
  src = src.replace(/^---\n[\s\S]*?\n---\n/, "");
  // 先頭の空白行を除去してから h1 (および付随する blockquote 1 行) を除去
  src = src.replace(/^\s+/, "");
  src = src.replace(/^# [^\n]+\n+/, "");
  // 直後の blockquote (一次資料リンク等) は MDX 側で別途案内するので除去
  src = src.replace(/^>[^\n]*\n+/, "");
  src = src.replace(/^\s+/, "");

  // fence / backtick 外の `<` `>` `{` `}` を escape する。
  // 行単位で処理: fence (```) の中はそのまま。それ以外の行で
  // backtick code span (\`...\`) の中はそのまま、外は escape。
  const lines = src.split("\n");
  let inFence = false;
  const out = [];
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }
    if (inFence) {
      out.push(line);
      continue;
    }
    // backtick code span 単位で escape 切り替え
    let result = "";
    let i = 0;
    let inCode = false;
    while (i < line.length) {
      const ch = line[i];
      if (ch === "`") {
        inCode = !inCode;
        result += ch;
        i++;
        continue;
      }
      if (!inCode) {
        if (ch === "<") {
          result += "&lt;";
        } else if (ch === ">") {
          // markdown blockquote (`> ...`) は行頭のみ意味があるので
          // 既に位置 0 を過ぎていれば escape
          if (i === 0 || (i > 0 && line.slice(0, i).trim() === "")) {
            result += ch;
          } else {
            result += "&gt;";
          }
        } else if (ch === "{" || ch === "}") {
          result += `&#${ch.charCodeAt(0)};`;
        } else {
          result += ch;
        }
      } else {
        result += ch;
      }
      i++;
    }
    out.push(result);
  }
  return out.join("\n").trim();
}

/**
 * UI primitive / composite の MDX を生成する。
 *
 * @param {object} opts
 * @param {string} opts.name        — kebab-case 名 (button, dropdown-menu)
 * @param {string} opts.title       — Storybook title (UI/Button)
 * @param {string} opts.storiesRel  — MDX からの相対 import path (./button.stories)
 * @param {string} opts.mdPath      — docs/catalog/.../button.md の絶対パス
 * @param {string[]} opts.storyExports — Story exports
 * @param {string} opts.subtitle    — 1 行説明 (MD の最初の段落から)
 * @param {string} opts.pascalStoriesAlias — import alias (例: ButtonStories)
 */
function buildMdx({
  name,
  title,
  storiesRel,
  mdPath,
  storyExports,
  subtitle,
  pascalStoriesAlias,
}) {
  const md = existsSync(mdPath) ? normalizeMd(readFileSync(mdPath, "utf8")) : "";
  const primaryStory = storyExports[0] ?? null;
  // Canvas embed: 最初の 1〜3 個 (Default + 代表的 variant 想定)
  const canvasEmbeds = storyExports.slice(0, 3).map(
    (s) => `<Canvas of={${pascalStoriesAlias}.${s}} />`
  );
  const canvasBlock = canvasEmbeds.length
    ? `## ライブプレビュー (Canvas)\n\n${canvasEmbeds.join("\n\n")}\n`
    : "";

  return `import { Meta, Title, Subtitle, Description, Primary, Controls, Stories, Source, Canvas } from "@storybook/addon-docs/blocks";
import * as ${pascalStoriesAlias} from "${storiesRel}";

<Meta of={${pascalStoriesAlias}} name="Docs" />

<Title />
<Subtitle>${subtitle
  .replace(/[<>{}]/g, "")
  .replace(/\n/g, " ")
  .slice(0, 180)}</Subtitle>

> 一次資料: \`docs/catalog/${title.toLowerCase().startsWith("ui/") ? "ui" : "components"}/${name}.md\`。
> ここは **言語化テキスト + 実物 Live Preview** を 1 ページに統合した shadcn/ui スタイルの docs。
> 元の \`.md\` ファイルが source of truth、本 MDX は同内容を Storybook 上でレンダリングする視覚層。

${canvasBlock}
## Primary

<Primary />

## Props (API)

<Controls />

---

${md}

---

## 全 Stories

<Stories includePrimary={false} />
`;
}

/** UI primitive 生成 */
const uiDir = path.join(root, "libs/shared/ui/src");
const uiMdDir = path.join(root, "docs/catalog/ui");
const uiPrimitives = readdirSync(uiDir)
  .filter((f) => f.endsWith(".stories.tsx"))
  .map((f) => f.replace(".stories.tsx", ""));

let createdUi = 0;
let skippedUi = 0;
for (const name of uiPrimitives) {
  const mdxPath = path.join(uiDir, `${name}.docs.mdx`);
  if (existsSync(mdxPath) && !force) {
    skippedUi++;
    continue;
  }
  const storiesPath = path.join(uiDir, `${name}.stories.tsx`);
  const mdPath = path.join(uiMdDir, `${name}.md`);
  const storyExports = extractStoryExports(storiesPath);
  // subtitle: MD の最初の段落 1 行を抜く (見つからなければ汎用)
  let subtitle = `Radix UI + CVA primitive`;
  if (existsSync(mdPath)) {
    const md = readFileSync(mdPath, "utf8");
    const after = md
      .replace(/^---\n[\s\S]*?\n---\n/, "")
      .replace(/^\s+/, "")
      .replace(/^# [^\n]+\n+/, "")
      .replace(/^>[^\n]*\n+/, "");
    // 「## 1. 目的 (Purpose)」 のような目的セクション直下の段落 (prose) を探す。
    // 見つからなければ最初の prose 段落へフォールバック。
    const sections = after.split(/\n(?=## )/);
    let firstPara = null;
    const purposeSection = sections.find((s) =>
      /^##\s+(\d+\.?\s+)?(目的|Purpose|概要|Overview)/.test(s.trim())
    );
    // heading 行を除去してから空行 split
    const target = (purposeSection ?? after).replace(/^##[^\n]*\n+/, "");
    for (const p of target.split(/\n\n/)) {
      const t = p.trim();
      if (!t) continue;
      if (t.startsWith(">")) continue;
      if (t.startsWith("#")) continue;
      if (t.startsWith("```")) continue;
      // markdown list (`- ` `* `) は除外。ただし bold (`**...**`) は prose なので除外しない。
      if (/^- /.test(t) || /^\* /.test(t)) continue;
      if (t.startsWith("|")) continue;
      if (t.startsWith("<!--")) continue;
      firstPara = t;
      break;
    }
    if (firstPara) {
      subtitle = firstPara
        .replace(/\n/g, " ")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .slice(0, 200);
    }
  }
  const pascalStoriesAlias = `${toPascal(name)}Stories`;
  const mdx = buildMdx({
    name,
    title: `UI/${toPascal(name)}`,
    storiesRel: `./${name}.stories`,
    mdPath,
    storyExports,
    subtitle,
    pascalStoriesAlias,
  });
  if (dry) {
    console.log(`[dry] would write ${mdxPath}`);
  } else {
    writeFileSync(mdxPath, mdx, "utf8");
    createdUi++;
  }
}

/** Composite (PascalCase ファイル名) 生成 */
const compDir = path.join(root, "libs/shared/ui-composite/src");
const compMdDir = path.join(root, "docs/catalog/components");
const composites = readdirSync(compDir)
  .filter((f) => f.endsWith(".stories.tsx"))
  .map((f) => f.replace(".stories.tsx", ""));

let createdComp = 0;
let skippedComp = 0;
for (const name of composites) {
  // 出力ファイル名は kebab-case 化して衝突しないようにする
  const kebab = toKebab(name);
  const mdxPath = path.join(compDir, `${name}.docs.mdx`);
  if (existsSync(mdxPath) && !force) {
    skippedComp++;
    continue;
  }
  const storiesPath = path.join(compDir, `${name}.stories.tsx`);
  const mdPath = path.join(compMdDir, `${kebab}.md`);
  const storyExports = extractStoryExports(storiesPath);
  let subtitle = `Composite component`;
  if (existsSync(mdPath)) {
    const md = readFileSync(mdPath, "utf8");
    const after = md
      .replace(/^---\n[\s\S]*?\n---\n/, "")
      .replace(/^\s+/, "")
      .replace(/^# [^\n]+\n+/, "")
      .replace(/^>[^\n]*\n+/, "");
    // 「## 1. 目的 (Purpose)」 のような目的セクション直下の段落 (prose) を探す。
    // 見つからなければ最初の prose 段落へフォールバック。
    const sections = after.split(/\n(?=## )/);
    let firstPara = null;
    const purposeSection = sections.find((s) =>
      /^##\s+(\d+\.?\s+)?(目的|Purpose|概要|Overview)/.test(s.trim())
    );
    // heading 行を除去してから空行 split
    const target = (purposeSection ?? after).replace(/^##[^\n]*\n+/, "");
    for (const p of target.split(/\n\n/)) {
      const t = p.trim();
      if (!t) continue;
      if (t.startsWith(">")) continue;
      if (t.startsWith("#")) continue;
      if (t.startsWith("```")) continue;
      // markdown list (`- ` `* `) は除外。ただし bold (`**...**`) は prose なので除外しない。
      if (/^- /.test(t) || /^\* /.test(t)) continue;
      if (t.startsWith("|")) continue;
      if (t.startsWith("<!--")) continue;
      firstPara = t;
      break;
    }
    if (firstPara) {
      subtitle = firstPara
        .replace(/\n/g, " ")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .slice(0, 200);
    }
  }
  const pascalStoriesAlias = `${name}Stories`;
  const mdx = buildMdx({
    name: kebab,
    title: `Components/${name}`,
    storiesRel: `./${name}.stories`,
    mdPath,
    storyExports,
    subtitle,
    pascalStoriesAlias,
  });
  if (dry) {
    console.log(`[dry] would write ${mdxPath}`);
  } else {
    writeFileSync(mdxPath, mdx, "utf8");
    createdComp++;
  }
}

console.log(
  `[gen-catalog-mdx] UI: created=${createdUi}, skipped=${skippedUi}; Composite: created=${createdComp}, skipped=${skippedComp}`
);
