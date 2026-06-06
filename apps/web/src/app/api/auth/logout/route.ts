/**
 * ログアウト Route Handler。`te_session` cookie を破棄して `/` に戻す。
 *
 * 監査ログを記録 (security review Medium #31)。
 */
import { NextResponse, type NextRequest } from "next/server";
import { clearSessionCookie, getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 監査ログは clear 前に user を解決して記録する (失敗しても主処理継続)
  try {
    const user = await getCurrentUser();
    if (user) {
      void recordAudit({
        actorUserId: user.id,
        action: "logout",
        targetType: "User",
        targetId: user.id,
        ipAddress: getRequestIp(request),
        userAgent: request.headers.get("user-agent") ?? null,
      });
    }
  } catch {
    /* ignore: 監査ログ失敗で logout は止めない */
  }

  await clearSessionCookie();

  const isJson = (request.headers.get("content-type") ?? "").includes(
    "application/json",
  );
  if (isJson) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
