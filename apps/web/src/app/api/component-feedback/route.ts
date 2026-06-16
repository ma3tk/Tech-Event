/**
 * POST /api/component-feedback — コンポーネントフィードバック受付 API。
 *
 * Storybook (Gallery / 各 Docs) の HTML フォームから、各コンポーネントへの
 * 評価 (1-5) + 任意コメントを受け付けて `component_feedback` に保存する。
 * 集計・トリアージは /admin/component-feedback で行う (DS 改善ループ)。
 *
 * - 投稿は匿名可。ログイン中なら userId を紐づける。
 * - Zod で入力検証 (CLAUDE.md §6.3)。
 * - IP 単位の rate limit でスパムを抑制。
 * - Storybook (別オリジン: localhost:6006 / GitHub Pages) からの fetch のため
 *   allowlist ベースの CORS を返し、OPTIONS preflight に応答する。
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { nextId, withRetry } from "@tech-event/shared-util-id-gen";
import {
  RATE_LIMITS,
  buildRateLimitResponse,
  getRequestIp,
  rateLimit,
} from "@/lib/rate-limit";

/** Storybook の動作オリジン allowlist (CORS)。 */
const ALLOWED_ORIGINS = new Set([
  "http://localhost:6006",
  "http://127.0.0.1:6006",
  "https://ma3tk.github.io",
]);

/** Origin が allowlist にあれば反映、無ければ same-origin 既定。 */
function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

const FeedbackSchema = z.object({
  /** 対象コンポーネント名 (Storybook 表示名)。 */
  component: z.string().trim().min(1).max(80),
  /** 1-5 の満足度評価。 */
  rating: z.coerce.number().int().min(1).max(5),
  /** 任意コメント。 */
  comment: z.string().trim().max(2000).optional().or(z.literal("")),
  /** 投稿元 URL。 */
  sourceUrl: z.string().trim().max(2000).optional().or(z.literal("")),
});

export function OPTIONS(req: NextRequest): NextResponse {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const cors = corsHeaders(req);

  // ---- レート制限 (IP 単位、コメント投稿と同程度: 10 回 / 分) ----
  const ip = getRequestIp(req);
  const rl = rateLimit(`${ip}:component-feedback`, RATE_LIMITS.comment);
  if (!rl.ok) {
    const res = buildRateLimitResponse(rl);
    for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
    return res;
  }

  // ---- 入力パース ----
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid JSON body" },
      { status: 400, headers: cors },
    );
  }
  const parsed = FeedbackSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid input", issues: parsed.error.flatten() },
      { status: 400, headers: cors },
    );
  }
  const { component, rating } = parsed.data;
  const comment = parsed.data.comment ? parsed.data.comment : null;
  const sourceUrl = parsed.data.sourceUrl ? parsed.data.sourceUrl : null;

  // ---- 任意: ログイン中ユーザーを紐づけ (匿名可) ----
  const user = await getCurrentUser().catch(() => null);
  const userId = user ? user.id : null;

  // ---- 保存 (nextId + race retry) ----
  const created = await withRetry(() =>
    prisma.$transaction(async (tx) => {
      const id = await nextId(tx, "componentFeedback");
      return tx.componentFeedback.create({
        data: { id, component, rating, comment, sourceUrl, userId },
        select: { id: true },
      });
    }),
  );

  return NextResponse.json(
    { ok: true, id: created.id.toString() },
    { status: 201, headers: cors },
  );
}
