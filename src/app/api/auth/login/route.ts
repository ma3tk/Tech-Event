/**
 * メール + パスワードでログインする Route Handler。
 *
 * - 受け付けは `application/x-www-form-urlencoded` (HTML form 想定) と
 *   `application/json` の両方。
 * - `next` クエリ / フィールドに従ってリダイレクトする。
 *   - JSON リクエスト時は JSON でレスポンスを返す。
 * - パスワード未設定のユーザー (`passwordHash IS NULL`) はログイン不可。
 * - 認証失敗時は `?error=invalid` をつけた `/login` にリダイレクト。
 */
import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
  next: z.string().optional(),
});

/** Open redirect 防止: 相対パスのみ許可。先頭は `/` で始まり `//` (protocol-relative) は禁止。 */
function safeNextPath(raw: string | undefined | null): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/")) return "/dashboard";
  if (raw.startsWith("//")) return "/dashboard";
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

export async function POST(request: NextRequest): Promise<NextResponse> {
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

  if (!user || !user.passwordHash || user.status !== "active") {
    if (isJsonRequest(request)) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }
    return buildErrorRedirect(request, payload.next);
  }

  const ok = await bcrypt.compare(payload.password, user.passwordHash);
  if (!ok) {
    if (isJsonRequest(request)) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
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
