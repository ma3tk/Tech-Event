/**
 * light / dark 並列比較画像生成スクリプト
 *
 * `screenshots/clone/<name>.png` (light) と
 * `screenshots/clone-dark/<name>.png` (dark) を横並びに合成して
 * `screenshots/light-dark/<name>.png` に出力する。
 *
 * 使い方: `pnpm tsx scripts/build-light-dark-comparison.ts`
 *
 * 既存 `scripts/build-triptych.ts` と同じパターン (sharp で sequential 合成)。
 * OOM 回避のため各ページを async で sequential に処理する。
 */
import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";

const ROOT = process.cwd();
const SCREENSHOT_DIR = path.join(ROOT, "screenshots");
const OUT_DIR = path.join(SCREENSHOT_DIR, "light-dark");

// 横並び合成の見栄え用パラメータ。
// build-triptych.ts と同じ思想で 720px に揃え、長すぎる場合はリサイズで打ち切る。
const COLUMN_WIDTH = 720;
const MAX_HEIGHT = 4_000;
const GUTTER = 16;
const BG = { r: 245, g: 245, b: 245, alpha: 1 };

type Pair = {
  name: string;
  /** `screenshots/clone/<file>.png` 相対パス */
  light: string;
  /** `screenshots/clone-dark/<file>.png` 相対パス */
  dark: string;
};

// visual-compare-dark.spec.ts の 10 ページに対応。
// clone 側のファイル名は既存 visual-compare.spec.ts に合わせる
// (`/explore` は `explore.png`、`/discover` は `discover.png` 等)。
const PAIRS: Pair[] = [
  { name: "top", light: "clone/top.png", dark: "clone-dark/top.png" },
  {
    name: "explore",
    light: "clone/explore.png",
    dark: "clone-dark/explore.png",
  },
  {
    name: "event-detail",
    light: "clone/event-detail.png",
    dark: "clone-dark/event-detail.png",
  },
  {
    name: "group-detail",
    light: "clone/group-detail.png",
    dark: "clone-dark/group-detail.png",
  },
  {
    name: "user-profile",
    light: "clone/user-profile.png",
    dark: "clone-dark/user-profile.png",
  },
  {
    name: "calendar-ai",
    light: "clone/calendar-ai.png",
    dark: "clone-dark/calendar-ai.png",
  },
  { name: "ranking", light: "clone/ranking.png", dark: "clone-dark/ranking.png" },
  {
    name: "discover",
    light: "clone/discover.png",
    dark: "clone-dark/discover.png",
  },
  {
    name: "bookmarks",
    light: "clone/bookmarks.png",
    dark: "clone-dark/bookmarks.png",
  },
  {
    name: "notifications",
    light: "clone/notifications.png",
    dark: "clone-dark/notifications.png",
  },
];

async function loadColumn(file: string): Promise<{
  buffer: Buffer;
  width: number;
  height: number;
} | null> {
  const abs = path.join(SCREENSHOT_DIR, file);
  try {
    await fs.access(abs);
  } catch {
    return null;
  }
  const meta = await sharp(abs).metadata();
  if (!meta.width || !meta.height) return null;
  let buffer = await sharp(abs)
    .resize({ width: COLUMN_WIDTH, withoutEnlargement: false })
    .toBuffer();
  let meta2 = await sharp(buffer).metadata();
  if (meta2.height && meta2.height > MAX_HEIGHT) {
    const scale = MAX_HEIGHT / meta2.height;
    const newW = Math.round((meta2.width ?? COLUMN_WIDTH) * scale);
    buffer = await sharp(buffer).resize({ width: newW }).toBuffer();
    meta2 = await sharp(buffer).metadata();
  }
  return {
    buffer,
    width: meta2.width ?? COLUMN_WIDTH,
    height: meta2.height ?? 0,
  };
}

async function buildPair(pair: Pair): Promise<boolean> {
  const [light, dark] = await Promise.all([
    loadColumn(pair.light),
    loadColumn(pair.dark),
  ]);
  const columns = [light, dark];
  const present = columns.filter((x): x is NonNullable<typeof x> => x !== null);
  if (present.length === 0) {
    console.warn(`[light-dark] ${pair.name}: 両カラムとも素材なし → スキップ`);
    return false;
  }
  const totalHeight = Math.max(...present.map((c) => c.height));
  const totalWidth = COLUMN_WIDTH * 2 + GUTTER * 3;
  const composites: sharp.OverlayOptions[] = [];
  columns.forEach((col, idx) => {
    if (!col) return;
    const left = GUTTER + idx * (COLUMN_WIDTH + GUTTER);
    composites.push({ input: col.buffer, top: 0, left });
  });
  const out = path.join(OUT_DIR, `${pair.name}.png`);
  await sharp({
    create: {
      width: totalWidth,
      height: totalHeight,
      channels: 4,
      background: BG,
    },
  })
    .composite(composites)
    .png()
    .toFile(out);
  const presence = columns.map((c) => (c ? "OK" : "--")).join("/");
  console.log(
    `[light-dark] ${pair.name}: light/dark=${presence} → ${out} (${totalWidth}x${totalHeight})`,
  );
  return true;
}

async function main(): Promise<void> {
  await fs.mkdir(OUT_DIR, { recursive: true });
  let ok = 0;
  for (const pair of PAIRS) {
    try {
      const written = await buildPair(pair);
      if (written) ok += 1;
    } catch (e) {
      console.warn(
        `[light-dark] ${pair.name} 失敗: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
  console.log(`[light-dark] 完了 (${ok}/${PAIRS.length} 件出力)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
