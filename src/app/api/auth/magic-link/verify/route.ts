/**
 * Magic Link 検証エンドポイント。
 *
 * - GET /api/auth/magic-link/verify?token=...
 *   - prefetch / SafeLinks 対策: トークンを直接消費せず、確認ページ HTML を返す。
 *   - 「ログインを続行」ボタンを押すと POST が送られ、そこで初めて消費する。
 *   - 確認ページは HTML のみ (no fetch / no auto-submit prefetch trigger)。
 *
 * - POST /api/auth/magic-link/verify  (form: token=...)
 *   - 1. token を `MagicLinkToken` から検索
 *   - 2. 期限切れ or 使用済みなら 400
 *   - 3. 一致したら email base で User を find/create
 *   - 4. token に `usedAt` を埋めて再利用を防ぐ
 *   - 5. セッション cookie を発行して `/dashboard` へリダイレクト
 *
 * NOTE: クライアントが古いリンクを GET 一発で消費したいケースに備え、
 *       環境変数 `MAGIC_LINK_LEGACY_GET=1` が設定されていれば GET でも従来挙動を維持。
 *       デフォルトでは GET は確認ページのみ。
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { nextId as nextIdGen } from "@/lib/id-gen";

const TokenSchema = z.string().uuid();

/** email から nickname の候補を作る */
function emailToNickname(email: string): string {
  const local = email.split("@")[0] ?? "user";
  const cleaned = local.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 32);
  return cleaned || "user";
}

async function findOrCreateUserByEmail(email: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  // 採番: user.id は BigInt 自前採番 (共通ヘルパー)
  const nextId = await nextIdGen(prisma, "user");

  // nickname の衝突を避ける
  const base = emailToNickname(email);
  let nickname = base;
  for (let i = 1; i < 50; i++) {
    const conflict = await prisma.user.findUnique({ where: { nickname } });
    if (!conflict) break;
    nickname = `${base}_${i + 1}`;
  }

  return prisma.user.create({
    data: {
      id: nextId,
      nickname,
      displayName: nickname,
      email,
      emailVerifiedAt: new Date(),
      status: "active",
      avatarUrl: `https://api.dicebear.com/8.x/notionists/svg?seed=${nickname}`,
    },
  });
}

/**
 * 共通の token 検証 + ログイン処理。
 * セッション cookie を発行し、`/dashboard` への 303 リダイレクト Response を返す。
 */
async function consumeTokenAndLogin(
  request: NextRequest,
  token: string,
): Promise<NextResponse> {
  const row = await prisma.magicLinkToken.findUnique({ where: { id: token } });
  if (!row) {
    return NextResponse.json(
      { ok: false, error: "token_not_found" },
      { status: 400 },
    );
  }
  if (row.usedAt) {
    return NextResponse.json(
      { ok: false, error: "token_already_used" },
      { status: 400 },
    );
  }
  if (row.expiresAt.getTime() < Date.now()) {
    return NextResponse.json(
      { ok: false, error: "token_expired" },
      { status: 400 },
    );
  }

  const user = await findOrCreateUserByEmail(row.email);
  if (user.status !== "active") {
    return NextResponse.json(
      { ok: false, error: "user_not_active" },
      { status: 403 },
    );
  }

  // トークンを使用済みにする (DB エラーが起きてもログインは継続)
  try {
    await prisma.magicLinkToken.update({
      where: { id: token },
      data: { usedAt: new Date() },
    });
  } catch {
    // ignore
  }

  // 最終ログイン時刻も更新 (ベストエフォート)
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
  } catch {
    // ignore
  }

  await setSessionCookie(user.id);

  // 監査ログ
  void recordAudit({
    actorUserId: user.id,
    action: "login",
    targetType: "User",
    targetId: user.id,
    metadata: { method: "magic_link" },
  });

  return NextResponse.redirect(new URL("/dashboard", request.url), {
    status: 303,
  });
}

/**
 * 確認ページ HTML。
 * - `<form method="POST">` で submit すると POST ハンドラで token が消費される。
 * - クライアント JS なし (no script) のため SafeLinks / prefetch でも実行されない。
 */
function renderConfirmPage(token: string): NextResponse {
  // token は uuid のみ通過しているので XSS の余地はないが、念のため確認。
  const safeToken = token.replace(/[^a-zA-Z0-9-]/g, "");
  const body = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="robots" content="noindex,nofollow,noarchive" />
<title>ログインを続行</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background:#f5f5f7; margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; }
  .card { background:#fff; padding:32px; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.08); max-width:420px; width:100%; }
  h1 { font-size:20px; margin:0 0 12px; color:#111; }
  p { color:#555; line-height:1.6; font-size:14px; margin:0 0 24px; }
  button { background:#f97316; color:#fff; border:0; border-radius:8px; padding:12px 20px; font-size:15px; font-weight:600; cursor:pointer; width:100%; }
  button:hover { background:#ea580c; }
</style>
</head>
<body>
  <div class="card">
    <h1>ログインを続行しますか?</h1>
    <p>Magic Link のセキュリティのため、ボタンを押してログインを完了してください。</p>
    <form method="POST" action="/api/auth/magic-link/verify">
      <input type="hidden" name="token" value="${safeToken}" />
      <button type="submit" data-testid="magic-link-confirm">ログインを続行</button>
    </form>
  </div>
</body>
</html>`;
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex,nofollow",
    },
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const rawToken = url.searchParams.get("token");

  const parsed = TokenSchema.safeParse(rawToken);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_token" },
      { status: 400 },
    );
  }
  const token = parsed.data;

  // 後方互換: 環境変数で旧 GET 挙動 (直接ログイン) を有効化
  if (process.env.MAGIC_LINK_LEGACY_GET === "1") {
    return consumeTokenAndLogin(request, token);
  }

  // デフォルト: prefetch / SafeLinks による誤消費を防ぐため、確認ページを返す。
  return renderConfirmPage(token);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // form-data / x-www-form-urlencoded / JSON のいずれかを受け付ける
  let token: string | null = null;
  const ct = request.headers.get("content-type") ?? "";
  try {
    if (ct.includes("application/json")) {
      const body = (await request.json()) as { token?: string };
      token = typeof body.token === "string" ? body.token : null;
    } else {
      const form = await request.formData();
      const v = form.get("token");
      token = typeof v === "string" ? v : null;
    }
  } catch {
    // fall through to query fallback
  }
  if (!token) {
    // 後方互換: クエリでも受け付ける
    token = new URL(request.url).searchParams.get("token");
  }

  const parsed = TokenSchema.safeParse(token);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_token" },
      { status: 400 },
    );
  }
  return consumeTokenAndLogin(request, parsed.data);
}
