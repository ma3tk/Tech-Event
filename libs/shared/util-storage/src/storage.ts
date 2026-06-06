/**
 * 画像ストレージ抽象。
 *
 * 環境変数 `STORAGE_PROVIDER` で `local` (default) / `s3` を切り替える。
 *
 * - `local`: `public/uploads/{yyyy}/{mm}/{uuid}.{ext}` へ書き出し、
 *   `/uploads/{yyyy}/{mm}/{uuid}.{ext}` の絶対パス URL (origin 抜き) を返す。
 *   Next.js は `public/` 配下を静的配信するため、そのまま `<img src>` で参照可能。
 *
 * - `s3`: AWS SDK v3 (`@aws-sdk/client-s3`) でオブジェクトを put し、
 *   `S3_ENDPOINT` (MinIO 等) を考慮した URL を返す。
 *
 * 画像処理:
 *   `sharp` で `kind` に応じて推奨サイズに resize/format する。
 *   - `event-cover`: 660x370 (connpass の event カバー)
 *   - `group-thumb`: 120x120 (グループサムネ)
 *   - `group-cover`: 1200x630 (group カバー / OG)
 *   - `raw`:         サイズ変換なし (元バッファをそのまま保存)
 *
 * 環境変数:
 *   STORAGE_PROVIDER=local|s3
 *   S3_BUCKET / S3_REGION / S3_ACCESS_KEY / S3_SECRET_KEY / S3_ENDPOINT
 */
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/** アップロードする画像の種別 (resize の決定に使う) */
export type ImageKind = "event-cover" | "group-thumb" | "group-cover" | "raw";

export interface UploadImageOptions {
  /** 元ファイル名 (拡張子推定にのみ使う) */
  filename: string;
  /** MIME (image/png, image/jpeg, image/webp) */
  mimeType: string;
  /** 画像の種別 (resize ルール選択) */
  kind?: ImageKind;
}

export interface UploadImageResult {
  /** 保存後の URL (絶対パスまたは https://...) */
  url: string;
  /** 保存先プロバイダ */
  provider: "local" | "s3";
}

/** 許可する MIME (基本セット) */
const ALLOWED_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

/**
 * 先頭バイト (magic number) で画像形式を判定する。
 * 一致するフォーマットの canonical MIME を返す。判定不能なら null。
 *
 * 参考:
 * - PNG : 89 50 4E 47 0D 0A 1A 0A
 * - JPEG: FF D8 FF
 * - GIF : 47 49 46 38 (37|39) 61  ("GIF87a" / "GIF89a")
 * - WebP: "RIFF" .... "WEBP"
 */
function detectImageMimeFromMagic(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  // GIF
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return "image/gif";
  }
  // WebP: "RIFF" .... "WEBP"
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

/** 宣言された mimeType と magic byte が整合するかチェックする */
function isMimeConsistentWithBuffer(
  buffer: Buffer,
  declaredMime: string,
): boolean {
  const detected = detectImageMimeFromMagic(buffer);
  if (!detected) return false;
  // image/jpg は image/jpeg と等価扱い
  const normalize = (m: string) => (m === "image/jpg" ? "image/jpeg" : m);
  return normalize(detected) === normalize(declaredMime);
}

/** 拡張子を安全に取り出す (英数字のみ、最大 5 文字) */
function safeExt(filename: string, mimeType: string): string {
  const fromName = path
    .extname(filename || "")
    .toLowerCase()
    .replace(/^\./, "")
    .replace(/[^a-z0-9]/g, "");
  if (fromName && fromName.length <= 5) return fromName === "jpg" ? "jpg" : fromName;
  // MIME からフォールバック
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";
  return "bin";
}

/** kind → resize 仕様 */
function resizeSpec(kind: ImageKind | undefined): { w: number; h: number } | null {
  switch (kind) {
    case "event-cover":
      return { w: 660, h: 370 };
    case "group-thumb":
      return { w: 120, h: 120 };
    case "group-cover":
      return { w: 1200, h: 630 };
    case "raw":
    case undefined:
      return null;
  }
}

/**
 * sharp で画像を加工 (resize + format 揃え)。
 * 失敗時 (sharp が読めない / バッファが画像でない 等) は元バッファをそのまま返す。
 */
async function processImage(
  buffer: Buffer,
  mimeType: string,
  kind: ImageKind | undefined,
): Promise<{ buffer: Buffer; ext: string; mime: string }> {
  const spec = resizeSpec(kind);
  if (!spec) {
    return { buffer, ext: safeExt("", mimeType), mime: mimeType };
  }
  try {
    const sharpMod = await import("sharp");
    const sharp = sharpMod.default ?? sharpMod;
    // GIF はアニメーション保持できないため、kind 指定があっても元のまま保存する
    if (mimeType === "image/gif") {
      return { buffer, ext: "gif", mime: "image/gif" };
    }
    const out = await sharp(buffer)
      .rotate()
      .resize(spec.w, spec.h, { fit: "cover", position: "centre" })
      .webp({ quality: 85 })
      .toBuffer();
    return { buffer: out, ext: "webp", mime: "image/webp" };
  } catch (err) {
    console.error(`[storage] sharp processing failed: ${(err as Error).message}`);
    return { buffer, ext: safeExt("", mimeType), mime: mimeType };
  }
}

/** 5MB 上限 (route側でもガードするがここでも防御) */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * メイン: 画像をアップロードし URL を返す。
 */
export async function uploadImage(
  buffer: Buffer,
  opts: UploadImageOptions,
): Promise<UploadImageResult> {
  if (!ALLOWED_MIMES.has(opts.mimeType)) {
    throw new Error(`unsupported_mime: ${opts.mimeType}`);
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error("file_too_large");
  }
  // 宣言 MIME と先頭バイトの整合を確認 (polyglot / 偽装拒否)
  if (!isMimeConsistentWithBuffer(buffer, opts.mimeType)) {
    throw new Error("invalid_image_signature");
  }

  const processed = await processImage(buffer, opts.mimeType, opts.kind);
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const uuid = randomUUID();
  const filename = `${uuid}.${processed.ext}`;

  const provider = (process.env.STORAGE_PROVIDER || "local").toLowerCase();
  if (provider === "s3") {
    const url = await putToS3({
      key: `uploads/${yyyy}/${mm}/${filename}`,
      buffer: processed.buffer,
      mime: processed.mime,
    });
    return { url, provider: "s3" };
  }
  // local default
  const url = await putToLocal({
    yyyy,
    mm,
    filename,
    buffer: processed.buffer,
  });
  return { url, provider: "local" };
}

/* ============================================================
 * local provider
 * ============================================================ */

async function putToLocal(args: {
  yyyy: string;
  mm: string;
  filename: string;
  buffer: Buffer;
}): Promise<string> {
  const baseDir = path.join(process.cwd(), "public", "uploads", args.yyyy, args.mm);
  await mkdir(baseDir, { recursive: true });
  const fullPath = path.join(baseDir, args.filename);
  await writeFile(fullPath, args.buffer);
  return `/uploads/${args.yyyy}/${args.mm}/${args.filename}`;
}

/* ============================================================
 * s3 provider
 * ============================================================ */

async function putToS3(args: {
  key: string;
  buffer: Buffer;
  mime: string;
}): Promise<string> {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION || "us-east-1";
  const accessKey = process.env.S3_ACCESS_KEY;
  const secretKey = process.env.S3_SECRET_KEY;
  const endpoint = process.env.S3_ENDPOINT; // MinIO 等の S3 互換 endpoint
  if (!bucket) throw new Error("s3_bucket_not_configured");

  // dynamic import: local 運用時に AWS SDK の起動オーバーヘッドを避ける
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({
    region,
    endpoint: endpoint || undefined,
    forcePathStyle: !!endpoint, // MinIO は path-style 必須
    credentials:
      accessKey && secretKey
        ? { accessKeyId: accessKey, secretAccessKey: secretKey }
        : undefined,
  });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: args.key,
      Body: args.buffer,
      ContentType: args.mime,
      ACL: "public-read",
    }),
  );

  if (endpoint) {
    // MinIO: {endpoint}/{bucket}/{key}
    return `${endpoint.replace(/\/$/, "")}/${bucket}/${args.key}`;
  }
  // AWS: https://{bucket}.s3.{region}.amazonaws.com/{key}
  return `https://${bucket}.s3.${region}.amazonaws.com/${args.key}`;
}
