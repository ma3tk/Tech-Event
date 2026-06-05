/**
 * 3者並列ビュー画像 (triptych) 生成スクリプト
 *
 * connpass / clone / luma の3カラムを横並びで合成して
 * `screenshots/triptych/<name>.png` に出力する。
 *
 * 使い方: `pnpm tsx scripts/build-triptych.ts`
 *
 * sharp を使うが、OOM 回避のため各ペアを async で sequential に処理する。
 */
import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";

const ROOT = process.cwd();
const SCREENSHOT_DIR = path.join(ROOT, "screenshots");
const OUT_DIR = path.join(SCREENSHOT_DIR, "triptych");

// 各カラムの目標幅 (本家・clone・lumaそれぞれ表示する横幅 px)。
// 元スクショは fullPage で縦長になりがちなので、横を揃えて vertical match。
const COLUMN_WIDTH = 720;
// 1ペアの最大縦長 (それより長い場合は等比縮小)。
const MAX_HEIGHT = 4_000;
const GUTTER = 16; // カラム間隔
const BG = { r: 245, g: 245, b: 245, alpha: 1 };

type Pair = {
  name: string;
  // 連結する3つ (connpass / clone / luma) のソース。存在しなければ null pass。
  connpass?: string;
  clone?: string;
  luma?: string;
};

// connpass版とluma版でclone側のキーが違うので、ペアを名前で正規化:
// - 表示名 (triptych出力ファイル名)
// - connpass: screenshots/connpass/<file>.png
// - clone (connpass比較版): screenshots/clone/<file>.png
// - clone (luma比較版): screenshots/clone/<file>-luma.png (存在すれば優先)
// - luma: screenshots/luma/<file>.png
const PAIRS: Pair[] = [
  // 既存 6 ペア
  {
    name: "top",
    connpass: "connpass/top.png",
    clone: "clone/top.png",
    luma: "luma/top.png",
  },
  {
    name: "discover",
    connpass: "connpass/explore.png",
    clone: "clone/explore.png",
    luma: "luma/discover.png",
  },
  {
    name: "event-detail",
    connpass: "connpass/event-detail.png",
    clone: "clone/event-detail.png",
    luma: "luma/event-detail.png",
  },
  {
    name: "calendar",
    connpass: "connpass/group-detail.png",
    clone: "clone/group-detail.png",
    luma: "luma/calendar.png",
  },
  {
    name: "user-profile",
    connpass: "connpass/user-profile.png",
    clone: "clone/user-profile.png",
    luma: "luma/user-profile.png",
  },
  {
    name: "signin",
    connpass: "connpass/login.png",
    clone: "clone/login.png",
    luma: "luma/signin.png",
  },
  // 新規 7 ペア
  // 注: clone 側は visual-compare.spec.ts と visual-compare-luma.spec.ts で
  //   それぞれ `<name>.png` と `<name>-luma.png` を撮るが、内容が同じならどちらでも OK。
  //   ここでは connpass 比較で撮った `clone/<name>.png` を採用。
  {
    name: "discover-page",
    connpass: "connpass/discover.png",
    clone: "clone/discover.png",
    luma: "luma/discover-page.png",
  },
  {
    name: "calendar-ai",
    connpass: "connpass/calendar-ai.png",
    clone: "clone/calendar-ai.png",
    luma: "luma/calendar-ai.png",
  },
  {
    name: "calendars",
    connpass: "connpass/calendars.png",
    clone: "clone/calendars.png",
    luma: "luma/calendars.png",
  },
  {
    name: "bookmarks",
    connpass: "connpass/bookmarks.png",
    clone: "clone/bookmarks.png",
    luma: "luma/bookmarks.png",
  },
  {
    name: "notifications",
    connpass: "connpass/notifications.png",
    clone: "clone/notifications.png",
    luma: "luma/notifications.png",
  },
  {
    name: "user-timeline",
    connpass: "connpass/user-timeline.png",
    clone: "clone/user-timeline.png",
    luma: "luma/user-timeline.png",
  },
  {
    name: "group-timeline",
    connpass: "connpass/group-timeline.png",
    clone: "clone/group-timeline.png",
    luma: "luma/group-timeline.png",
  },
];

async function loadColumn(file: string | undefined): Promise<{
  buffer: Buffer;
  width: number;
  height: number;
} | null> {
  if (!file) return null;
  const abs = path.join(SCREENSHOT_DIR, file);
  try {
    await fs.access(abs);
  } catch {
    return null;
  }
  const meta = await sharp(abs).metadata();
  if (!meta.width || !meta.height) return null;
  // 幅を COLUMN_WIDTH に揃える (高さは比率で決まる)。
  let resized = sharp(abs).resize({ width: COLUMN_WIDTH, withoutEnlargement: false });
  let info = await resized.metadata();
  if (!info.height || !info.width) {
    // resize後のmetaが空のことがあるので一旦bufferにしてから測る
    const tmp = await resized.toBuffer();
    info = await sharp(tmp).metadata();
    resized = sharp(tmp);
  }
  // MAX_HEIGHT を超える場合は更に縮小
  let buffer = await resized.toBuffer();
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

async function buildPair(pair: Pair): Promise<void> {
  const [c1, c2, c3] = await Promise.all([
    loadColumn(pair.connpass),
    loadColumn(pair.clone),
    loadColumn(pair.luma),
  ]);
  const columns = [c1, c2, c3];
  const present = columns.filter((x): x is NonNullable<typeof x> => x !== null);
  if (present.length === 0) {
    console.warn(`[triptych] ${pair.name}: 3カラムとも素材なし → スキップ`);
    return;
  }
  const totalHeight = Math.max(...present.map((c) => c.height));
  const totalWidth = COLUMN_WIDTH * 3 + GUTTER * 4;
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
  const presence = columns
    .map((c, i) => (c ? "OK" : "--"))
    .join("/");
  console.log(`[triptych] ${pair.name}: ${presence} → ${out} (${totalWidth}x${totalHeight})`);
}

async function main(): Promise<void> {
  await fs.mkdir(OUT_DIR, { recursive: true });
  // OOM 回避のため sequential
  for (const pair of PAIRS) {
    try {
      await buildPair(pair);
    } catch (e) {
      console.warn(`[triptych] ${pair.name} 失敗: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  console.log("[triptych] 完了");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
