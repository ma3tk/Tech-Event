/**
 * One-Tap RSVP エンドポイント。
 *
 * - GET /rsvp/{token}
 *   - prefetch / SafeLinks 対策: トークンを直接消費せず、確認ページ HTML を返す
 *     (magic-link verify と同じ流儀。no script / no auto-submit)。
 *   - トークン無効・期限切れ・使用済みはエラーページ。
 *
 * - POST /rsvp/{token}
 *   1. 生トークンを sha256 して `Invitation.tokenHash` を検索
 *   2. 期限切れ / 使用済み / 取消済みなら エラーページ
 *   3. email に一致する User を find/create (magic-link と同じ最小ユーザー作成)
 *   4. セッション cookie 発行 (`setSessionCookie`)
 *   5. 既存の `joinEvent` (feature-event) でイベント登録 (既参加は no-op)
 *   6. Invitation.status=accepted / acceptedAt 記録
 *   7. イベントページへ 303 redirect (`?rsvp=accepted`)
 *
 * トークン設計:
 *   - 生トークン = 32byte hex (64 文字)。DB には sha256 のみ保存。
 *   - 生トークンはログ出力しない。
 */
import { createHash } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@tech-event/shared-data-access-prisma";
import { setSessionCookie } from "@/lib/auth";
import { nextId as nextIdGen } from "@/lib/id-gen";
import { recordAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rate-limit";
import { isActionError } from "@/lib/action-error";
import { joinEvent } from "@tech-event/web-feature-event";

/** 生トークンの形式 (32byte hex = 64 文字) */
const TOKEN_RE = /^[0-9a-f]{64}$/;

function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ============================================================
 * HTML レンダリング (magic-link verify と同じ no-script スタイル)
 * ============================================================ */

function htmlResponse(body: string, status: number): NextResponse {
  return new NextResponse(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex,nofollow",
    },
  });
}

function pageShell(title: string, inner: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="robots" content="noindex,nofollow,noarchive" />
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background:#f5f5f7; margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; }
  .card { background:#fff; padding:32px; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.08); max-width:440px; width:100%; }
  h1 { font-size:20px; margin:0 0 12px; color:#111; }
  p { color:#555; line-height:1.6; font-size:14px; margin:0 0 16px; }
  .meta { color:#333; font-size:14px; margin:0 0 24px; }
  button { background:#f97316; color:#fff; border:0; border-radius:8px; padding:12px 20px; font-size:15px; font-weight:600; cursor:pointer; width:100%; }
  button:hover { background:#ea580c; }
  a.link { color:#f97316; font-weight:600; text-decoration:none; }
  a.link:hover { text-decoration:underline; }
</style>
</head>
<body>
  <div class="card">${inner}</div>
</body>
</html>`;
}

/** エラー / 案内ページ */
function renderMessagePage(params: {
  title: string;
  message: string;
  status: number;
  eventLink?: { href: string; label: string };
}): NextResponse {
  const link = params.eventLink
    ? `<p><a class="link" href="${escapeHtml(params.eventLink.href)}" data-testid="rsvp-event-link">${escapeHtml(params.eventLink.label)}</a></p>`
    : "";
  const inner = `
    <h1 data-testid="rsvp-error-title">${escapeHtml(params.title)}</h1>
    <p data-testid="rsvp-error-message">${escapeHtml(params.message)}</p>
    ${link}`;
  return htmlResponse(pageShell(params.title, inner), params.status);
}

/** 確認ページ (GET)。POST は同一 URL に対して行う (token は path のみ)。 */
function renderConfirmPage(params: {
  eventTitle: string;
  startedAt: Date;
  email: string;
}): NextResponse {
  const when = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(params.startedAt);
  const inner = `
    <h1 data-testid="rsvp-confirm-title">イベントへの参加を確定しますか?</h1>
    <p class="meta">
      イベント: <strong>${escapeHtml(params.eventTitle)}</strong><br/>
      開催日時: ${escapeHtml(when)}<br/>
      招待メール: ${escapeHtml(params.email)}
    </p>
    <p>ボタンを押すと参加登録が完了し、このメールアドレスでログインします。</p>
    <form method="POST">
      <button type="submit" data-testid="rsvp-confirm">参加を確定する</button>
    </form>`;
  return htmlResponse(pageShell("参加を確定", inner), 200);
}

/* ============================================================
 * Invitation 解決
 * ============================================================ */

type InvitationWithEvent = Prisma.InvitationGetPayload<{
  include: { event: true };
}>;

type ResolveResult =
  | { ok: true; invitation: InvitationWithEvent }
  | { ok: false; response: NextResponse };

/**
 * 生トークンから招待を解決し、無効な場合はエラーページ Response を返す。
 * (GET / POST 共通の前段チェック。ここでは消費しない)
 */
async function resolveInvitation(rawToken: string): Promise<ResolveResult> {
  if (!TOKEN_RE.test(rawToken)) {
    return {
      ok: false,
      response: renderMessagePage({
        title: "無効な招待リンク",
        message: "この招待リンクは正しくありません。URL を確認してください。",
        status: 400,
      }),
    };
  }

  const tokenHash = sha256Hex(rawToken);
  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash },
    include: { event: true },
  });

  if (!invitation) {
    return {
      ok: false,
      response: renderMessagePage({
        title: "招待が見つかりません",
        message:
          "この招待リンクは無効か、すでに取り消されています。主催者にお問い合わせください。",
        status: 404,
      }),
    };
  }

  const eventPath = `/event/${invitation.eventId.toString()}`;

  if (invitation.status === "accepted") {
    return {
      ok: false,
      response: renderMessagePage({
        title: "受付済みの招待です",
        message: "この招待はすでに使用されています。",
        status: 200,
        eventLink: { href: eventPath, label: "イベントページを開く" },
      }),
    };
  }

  if (invitation.status === "declined") {
    return {
      ok: false,
      response: renderMessagePage({
        title: "辞退済みの招待です",
        message: "この招待は辞退されています。主催者にお問い合わせください。",
        status: 410,
      }),
    };
  }

  const expired =
    invitation.status === "expired" ||
    (invitation.expiresAt !== null &&
      invitation.expiresAt.getTime() < Date.now());
  if (expired) {
    // 期限切れを DB にも反映 (best-effort)
    if (invitation.status === "pending") {
      try {
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { status: "expired" },
        });
      } catch {
        // ignore
      }
    }
    return {
      ok: false,
      response: renderMessagePage({
        title: "招待リンクの期限切れ",
        message:
          "この招待リンクは有効期限が切れています。主催者に再送を依頼してください。",
        status: 410,
      }),
    };
  }

  if (invitation.event.status === "cancelled") {
    return {
      ok: false,
      response: renderMessagePage({
        title: "イベントは中止されました",
        message: "このイベントは中止されたため参加登録できません。",
        status: 410,
        eventLink: { href: eventPath, label: "イベントページを開く" },
      }),
    };
  }

  return { ok: true, invitation };
}

/* ============================================================
 * ユーザー解決 (magic-link verify と同じ find/create パターン)
 * ============================================================ */

function emailToNickname(email: string): string {
  const local = email.split("@")[0] ?? "guest";
  const cleaned = local.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 32);
  return cleaned || "guest";
}

async function findOrCreateUserByEmail(email: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  const id = await nextIdGen(prisma, "user");

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
      id,
      nickname,
      displayName: nickname,
      email,
      // 招待メールに届いたリンクを開けている = email 到達済み
      emailVerifiedAt: new Date(),
      status: "active",
      avatarUrl: `https://api.dicebear.com/8.x/notionists/svg?seed=${nickname}`,
    },
  });
}

/* ============================================================
 * 参加枠の自動選択
 * ============================================================ */

/**
 * 招待経由で自動登録する参加枠を選ぶ。
 * 優先: 無料 & ゲート (unlockCode / 販売期間 / 寄付) なし → ゲートなし → なし (null)。
 */
async function pickJoinableRole(eventId: bigint): Promise<bigint | null> {
  const roles = await prisma.eventRole.findMany({
    where: { eventId },
    orderBy: { displayOrder: "asc" },
  });
  const now = Date.now();
  const open = roles.filter(
    (r) =>
      !r.unlockCode &&
      r.pricingType !== "donation" &&
      (!r.saleStartsAt || r.saleStartsAt.getTime() <= now) &&
      (!r.saleEndsAt || r.saleEndsAt.getTime() >= now),
  );
  const free = open.find((r) => r.pricingType === "free");
  const picked = free ?? open[0];
  return picked ? picked.id : null;
}

/* ============================================================
 * Handlers
 * ============================================================ */

type RouteContext = { params: Promise<{ token: string }> };

/** GET: 確認ページのみ (prefetch / SafeLinks でトークンが消費されないように) */
export async function GET(
  _request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const { token } = await context.params;
  const resolved = await resolveInvitation(token);
  if (!resolved.ok) return resolved.response;

  const { invitation } = resolved;
  return renderConfirmPage({
    eventTitle: invitation.event.title,
    startedAt: invitation.event.startedAt,
    email: invitation.email,
  });
}

/** POST: トークン消費 (ユーザー解決 → セッション発行 → joinEvent → accepted) */
export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const { token } = await context.params;
  const resolved = await resolveInvitation(token);
  if (!resolved.ok) return resolved.response;

  const { invitation } = resolved;
  const eventPath = `/event/${invitation.eventId.toString()}`;

  // 1) email に一致する User を find/create
  const user = await findOrCreateUserByEmail(invitation.email);
  if (user.status !== "active") {
    return renderMessagePage({
      title: "登録できません",
      message: "このメールアドレスのアカウントは現在利用できません。",
      status: 403,
    });
  }

  // 2) セッション cookie を発行 (以降 joinEvent はこのユーザーとして動く)
  await setSessionCookie(user.id);

  // 3) 参加枠を選択して joinEvent (既参加なら no-op / 満席なら waiting)
  const roleId = await pickJoinableRole(invitation.eventId);
  if (roleId === null) {
    return renderMessagePage({
      title: "参加登録できません",
      message:
        "現在申込可能な参加枠がありません。イベントページから直接お申し込みください。",
      status: 409,
      eventLink: { href: eventPath, label: "イベントページを開く" },
    });
  }

  try {
    const form = new FormData();
    form.set("eventId", invitation.eventId.toString());
    form.set("eventRoleId", roleId.toString());
    await joinEvent(form);
  } catch (err) {
    if (isActionError(err)) {
      return renderMessagePage({
        title: "参加登録できません",
        message: err.userMessage,
        status: 409,
        eventLink: { href: eventPath, label: "イベントページを開く" },
      });
    }
    throw err;
  }

  // 4) 招待を受諾済みにする (トークン再利用防止)
  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { status: "accepted", acceptedAt: new Date() },
  });

  // 監査ログ (トークンは記録しない)
  void recordAudit({
    actorUserId: user.id,
    action: "event.rsvp_accept",
    targetType: "Event",
    targetId: invitation.eventId,
    ipAddress: getRequestIp(request),
    userAgent: request.headers.get("user-agent") ?? null,
    metadata: { invitationId: invitation.id.toString(), method: "one_tap_rsvp" },
  });

  return NextResponse.redirect(
    new URL(`${eventPath}?rsvp=accepted`, request.url),
    { status: 303 },
  );
}
