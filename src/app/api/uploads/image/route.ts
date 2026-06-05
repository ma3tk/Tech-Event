/**
 * 画像アップロード API。
 *
 * `POST /api/uploads/image`
 *   - Content-Type: multipart/form-data
 *   - フィールド:
 *     - `file` (File) 必須
 *     - `kind` (string) 任意 `event-cover` | `group-thumb` | `group-cover` | `raw`
 *
 *   - 認証: `getCurrentUser()` で `te_session` cookie 必須
 *   - 上限: 5MB
 *   - レート制限: 20 回 / 時 / user (security review Medium #23)
 *   - 戻り値: `{ url: string, provider: "local" | "s3" }`
 *
 * 失敗時:
 *   - 401 (unauthorized)
 *   - 400 (file missing / file too large / unsupported mime / bad kind)
 *   - 429 (rate limit)
 *   - 500 (sharp / s3 等の予期しない例外)
 */
import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { uploadImage, MAX_IMAGE_BYTES, type ImageKind } from "@/lib/storage";
import { withRequestId } from "@/lib/logger";
import { incrementCounter, METRIC_NAMES } from "@/lib/metrics";
import {
  RATE_LIMITS,
  buildRateLimitResponse,
  rateLimit,
} from "@/lib/rate-limit";

const ALLOWED_KINDS: ImageKind[] = [
  "event-cover",
  "group-thumb",
  "group-cover",
  "raw",
];

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // ---- レート制限 (user 単位) ----
  const rl = rateLimit(`user:${user.id}:upload-image`, RATE_LIMITS.imageUpload);
  if (!rl.ok) {
    return buildRateLimitResponse(rl);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form_data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file_required" }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "empty_file" }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "file_too_large", maxBytes: MAX_IMAGE_BYTES },
      { status: 400 },
    );
  }

  const kindRaw = form.get("kind");
  const kind: ImageKind = (() => {
    if (typeof kindRaw === "string" && ALLOWED_KINDS.includes(kindRaw as ImageKind)) {
      return kindRaw as ImageKind;
    }
    return "raw";
  })();

  const mimeType = file.type || "application/octet-stream";
  // FormData の File は Web API なので arrayBuffer から Buffer 化する
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const log = withRequestId(request.headers);
  try {
    const result = await uploadImage(buffer, {
      filename: file.name || "upload",
      mimeType,
      kind,
    });
    incrementCounter(METRIC_NAMES.UPLOADS_TOTAL, {
      provider: result.provider,
      kind,
    });
    return NextResponse.json({ url: result.url, provider: result.provider });
  } catch (err) {
    const message = (err as Error).message;
    if (message.startsWith("unsupported_mime")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (message === "file_too_large") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (message === "invalid_image_signature") {
      return NextResponse.json(
        { error: "invalid_image_signature" },
        { status: 400 },
      );
    }
    log.error({ err, action: "uploads.image" }, "image upload failed");
    incrementCounter(METRIC_NAMES.ERRORS_TOTAL, {
      route: "/api/uploads/image",
    });
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}
