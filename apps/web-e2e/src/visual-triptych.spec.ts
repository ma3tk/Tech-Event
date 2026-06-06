import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

// PNG ファイルの IHDR チャンクから width/height を直接読む簡易リーダ。
// (pngjs / sharp に依存しない: spec の依存を最小化)
function readPngMeta(file: string): { width: number; height: number } {
  const buf = fs.readFileSync(file);
  // 8 byte signature + 4 byte length + "IHDR" + width(4) + height(4)
  if (
    buf[0] !== 0x89 ||
    buf[1] !== 0x50 ||
    buf[2] !== 0x4e ||
    buf[3] !== 0x47
  ) {
    throw new Error(`${file} は PNG ではない`);
  }
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

// `screenshots/triptych/*.png` が指定6ペア分生成されていて、
// 各画像が「横3列+ガター」程度の最低横幅を持つことを sanity check する。
//
// 画像生成は `pnpm tsx scripts/build-triptych.ts` 側の責務。
// このspecは生成済みファイルの存在確認 + 幅/高さの妥当性のみ確認する。

const REQUIRED_NAMES = [
  // 既存 6 ペア
  "top",
  "discover",
  "event-detail",
  "calendar",
  "user-profile",
  "signin",
  // 新規 7 ペア
  "discover-page",
  "calendar-ai",
  "calendars",
  "bookmarks",
  "notifications",
  "user-timeline",
  "group-timeline",
] as const;

const TRIPTYCH_DIR = path.join(process.cwd(), "screenshots", "triptych");

// 1カラム最小幅 200px * 3 + ガター程度 = 約 650px (実運用ではcolumn=720px、合計>2200px想定)
const MIN_WIDTH = 600;
// fullPage で連結したものなので低くても 400 はあるはず
const MIN_HEIGHT = 400;

test.describe("triptych images", () => {
  for (const name of REQUIRED_NAMES) {
    test(`triptych:${name} が存在し最低限の寸法を満たす`, () => {
      const file = path.join(TRIPTYCH_DIR, `${name}.png`);
      expect(fs.existsSync(file), `${file} が存在する`).toBe(true);
      const { width, height } = readPngMeta(file);
      expect(width).toBeGreaterThanOrEqual(MIN_WIDTH);
      expect(height).toBeGreaterThanOrEqual(MIN_HEIGHT);
    });
  }
});
