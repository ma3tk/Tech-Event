/**
 * メール + パスワードでログインする Route Handler。
 *
 * - 受け付けは `application/x-www-form-urlencoded` (HTML form 想定) と
 *   `application/json` の両方。
 * - `next` クエリ / フィールドに従ってリダイレクトする。
 *   - JSON リクエスト時は JSON でレスポンスを返す。
 * - パスワード未設定のユーザー (`passwordHash IS NULL`) はログイン不可。
 * - 認証失敗時は `?error=invalid` をつけた `/login` にリダイレクト。
 *
 * セキュリティ対策:
 * - レート制限: 5 回 / 5 分 / IP (security review Medium #23)
 * - User enumeration timing 対策: 存在しないメールでも dummy bcrypt 比較を実行
 *   して応答時間を一定にする (security review Medium #22)
 * - エラーメッセージは「メールアドレスまたはパスワードが違います」で統一
 */
import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import {
  RATE_LIMITS,
  buildRateLimitResponse,
  getRequestIp,
  rateLimit,
} from "@/lib/rate-limit";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
  next: z.string().optional(),
});

/**
 * Open redirect 防止: 相対パスのみ許可。
 * - 先頭は `/` で始まる
 * - `//` (protocol-relative) を拒否
 * - `:` を含むパスは `/javascript:` などの危険パターンを排除するため拒否
 */
function safeNextPath(raw: string | undefined | null): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/")) return "/dashboard";
  if (raw.startsWith("//")) return "/dashboard";
  if (raw.includes(":")) return "/dashboard";
  return raw;
}

async function parsePayload(
  request: NextRequest,
): Promise<{ email: string; password: string; next: string } | null> {
  const contentType = request.headers.get("content-type") ?? "";

  let raw: Record<string, unknown> = {};
  if (contentType.includes("application/json")) {
    try {
      raw = (await request.json()) as Record<string, unknown>;
    } catch {
      return null;
    }
  } else {
    // x-www-form-urlencoded or multipart/form-data
    const form = await request.formData();
    raw = Object.fromEntries(form.entries());
  }

  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) return null;

  return {
    email: parsed.data.email,
    password: parsed.data.password,
    next: safeNextPath(parsed.data.next),
  };
}

function isJsonRequest(request: NextRequest): boolean {
  return (request.headers.get("content-type") ?? "").includes(
    "application/json",
  );
}

function buildErrorRedirect(request: NextRequest, nextPath: string): NextResponse {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", "invalid");
  if (nextPath && nextPath !== "/dashboard") {
    url.searchParams.set("next", nextPath);
  }
  return NextResponse.redirect(url, { status: 303 });
}

/**
 * 存在しないユーザーでも bcrypt の作業時間 (~250ms) を消費するための dummy hash。
 * 12 ラウンドで bcrypt.hash("dummy", 12) を一度生成した固定値。
 *
 * user enumeration via timing 対策 (security review Medium #22)。
 */
const DUMMY_PASSWORD_HASH =
  "$2b$12$NQ7tH9.4n.4vGgTpUcAYP.qY3jzqWXvF2/QzGZkXmgYqL9YGv0fJG";

export async function POST(request: NextRequest): Promise<NextResponse> {
  // ---- レート制限 (IP 単位) ----
  const ip = getRequestIp(request);
  const rl = rateLimit(`${ip}:login`, RATE_LIMITS.login);
  if (!rl.ok) {
    return buildRateLimitResponse(rl);
  }

  const payload = await parsePayload(request);

  if (!payload) {
    if (isJsonRequest(request)) {
      return NextResponse.json(
        { error: "invalid_request" },
        { status: 400 },
      );
    }
    return buildErrorRedirect(request, "/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  // ユーザーが存在しないか pwHash 未設定の場合でも、bcrypt.compare を必ず走らせて
  // 応答時間を一定に揃える。最終的にこのパスは invalid_credentials になる。
  const hashToCompare = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
  const passwordOk = await bcrypt.compare(payload.password, hashToCompare);

  if (!user || !user.passwordHash || user.status !== "active" || !passwordOk) {
    // 監査ログ (失敗ログイン)
    void recordAudit({
      actorUserId: user?.id ?? null,
      action: "login.failed",
      targetType: "User",
      targetId: user?.id ?? BigInt(0),
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      metadata: { method: "password", reason: !user ? "no_user" : "invalid" },
    });
    if (isJsonRequest(request)) {
      // メッセージは存在/不一致を区別せず固定文言
      return NextResponse.json(
        {
          error: "invalid_credentials",
          message: "メールアドレスまたはパスワードが違います",
        },
        { status: 401 },
      );
    }
    return buildErrorRedirect(request, payload.next);
  }

  await setSessionCookie(user.id);

  // 最終ログイン時刻を更新 (失敗してもログイン成功は妨げない)
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
  } catch {
    // ignore
  }

  // 監査ログ (data-model review High #6 / dead model 整理)
  void recordAudit({
    actorUserId: user.id,
    action: "login",
    targetType: "User",
    targetId: user.id,
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    metadata: { method: "password" },
  });

  if (isJsonRequest(request)) {
    return NextResponse.json({
      ok: true,
      userId: user.id.toString(),
      next: payload.next,
    });
  }
  return NextResponse.redirect(new URL(payload.next, request.url), {
    status: 303,
  });
}
