/**
 * ログアウト Route Handler。`te_session` cookie を破棄して `/` に戻す。
 */
import { NextResponse, type NextRequest } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  await clearSessionCookie();

  const isJson = (request.headers.get("content-type") ?? "").includes(
    "application/json",
  );
  if (isJson) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
