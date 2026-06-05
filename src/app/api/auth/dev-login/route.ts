/**
 * 開発用ログイン Route Handler。
 *
 * `GET /api/auth/dev-login?nickname=<nickname>&next=<path>`
 * - nickname に一致するユーザーをパスワードなしで強制ログイン状態にする。
 * - production では disable し 404 を返す。
 *
 * 用途:
 * - シードユーザーを使った E2E / 動作確認
 * - 開発者がローカルでさっとログイン状態を作る
 */
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";

function safeNextPath(raw: string | null): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/")) return "/dashboard";
  if (raw.startsWith("//")) return "/dashboard";
  return raw;
}

/**
 * 有効化判定: 2 段ガード。
 * - production では強制 404 (ENABLE_DEV_LOGIN 無視)
 * - 非 production でも `ENABLE_DEV_LOGIN=1` のときのみ有効。
 *   デフォルトは disable で fail-close。
 */
function isDevLoginEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.ENABLE_DEV_LOGIN === "1";
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isDevLoginEnabled()) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const url = new URL(request.url);
  const nickname = url.searchParams.get("nickname")?.trim();
  const next = safeNextPath(url.searchParams.get("next"));

  if (!nickname) {
    return NextResponse.json(
      { error: "nickname is required" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { nickname } });
  if (!user) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  await setSessionCookie(user.id);

  return NextResponse.redirect(new URL(next, request.url), { status: 303 });
}
