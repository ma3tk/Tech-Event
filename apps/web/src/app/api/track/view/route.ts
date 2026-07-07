/**
 * POST /api/track/view — イベント詳細ページの閲覧記録 beacon。
 *
 * `EventViewTracker` (Client Component) がイベント詳細ページのマウント時に
 * 送信する。EventView へ「閲覧 1 件」を記録し、Insights のファネル
 * (Page views → RSVP → Check-in) と流入経路 / UTM 集計の元データになる。
 *
 * 設計 (CLAUDE.md §6.3 / §7 準拠):
 * - 認証不要 (匿名閲覧も計測対象)。ログイン中なら userId を紐づける。
 * - Zod で入力検証。eventId は実在チェック (存在しなければ 404)。
 * - 匿名セッション識別は `te_vid` cookie (crypto.randomUUID)。
 *   無ければこのエンドポイントが発行する (SameSite=Lax / 180 日)。
 * - 過剰記録防止:
 *   1. IP 単位 rate limit (in-memory, IP は保存しない)
 *   2. 同一 session × event は DEDUP_WINDOW_MS 内は再記録しない
 *   3. body サイズ上限 (4KB)
 *   4. 明らかな crawler UA はスキップ (200 を返すが記録しない)
 * - Privacy: PII を保存しない。保存するのは referrer / UTM / 匿名 sessionId /
 *   (ログイン時のみ) userId。IP の生値は保存しない。
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { nextId, withRetry } from "@tech-event/shared-util-id-gen";
import {
  buildRateLimitResponse,
  getRequestIp,
  rateLimit,
  type RateLimitConfig,
} from "@/lib/rate-limit";

/** 匿名セッション cookie 名 (te = tech-event, vid = visitor id) */
const SESSION_COOKIE = "te_vid";

/** 同一 session × event の再記録抑制ウィンドウ (30 分) */
const DEDUP_WINDOW_MS = 30 * 60 * 1000;

/** body サイズ上限 (beacon payload は高々数百 byte) */
const MAX_BODY_BYTES = 4096;

/**
 * beacon 用レート制限: 120 回 / 分 / IP。
 * ページ閲覧のたびに 1 発なので通常ユーザーは到達しない。
 * (E2E は多数のイベント詳細ページを同一 IP から開くため、緩めに設定)
 */
const TRACK_VIEW_LIMIT: RateLimitConfig = { windowMs: 60 * 1000, max: 120 };

/**
 * 明らかな crawler / bot の UA パターン。
 * 注意: Playwright (HeadlessChrome) は E2E 計測対象のため "headless" は含めない。
 */
const BOT_UA_RE =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|pinterest|vkshare|whatsapp/i;

/** 発行済み cookie の形式チェック (改ざん値をそのまま保存しない) */
const SESSION_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

const TrackViewSchema = z.object({
  /** イベント ID (数字文字列)。 */
  eventId: z.string().regex(/^\d{1,18}$/),
  /** document.referrer (無ければ省略)。 */
  referrer: z.string().trim().max(500).optional().or(z.literal("")),
  /** ?utm_source= */
  utmSource: z.string().trim().max(100).optional().or(z.literal("")),
  /** ?utm_medium= */
  utmMedium: z.string().trim().max(100).optional().or(z.literal("")),
  /** ?utm_campaign= */
  utmCampaign: z.string().trim().max(100).optional().or(z.literal("")),
});

/** 空文字を null に正規化 */
function emptyToNull(v: string | undefined): string | null {
  return v ? v : null;
}

/** sessionId cookie をレスポンスへ (再) セットする */
function setSessionCookie(res: NextResponse, sessionId: string): void {
  res.cookies.set(SESSION_COOKIE, sessionId, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 180, // 180 日
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ---- レート制限 (IP はキーとしてのみ使用し保存しない) ----
  const ip = getRequestIp(req);
  const rl = rateLimit(`${ip}:track-view`, TRACK_VIEW_LIMIT);
  if (!rl.ok) return buildRateLimitResponse(rl);

  // ---- body サイズ制限 ----
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, error: "payload too large" },
      { status: 413 },
    );
  }

  // ---- 入力パース + 検証 ----
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid JSON body" },
      { status: 400 },
    );
  }
  const parsed = TrackViewSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const eventId = BigInt(parsed.data.eventId);
  const referrer = emptyToNull(parsed.data.referrer);
  const utmSource = emptyToNull(parsed.data.utmSource);
  const utmMedium = emptyToNull(parsed.data.utmMedium);
  const utmCampaign = emptyToNull(parsed.data.utmCampaign);

  // ---- eventId 実在チェック (存在しない ID への書き込みを拒否) ----
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true },
  });
  if (!event) {
    return NextResponse.json(
      { ok: false, error: "event not found" },
      { status: 404 },
    );
  }

  // ---- 匿名セッション cookie (無ければ発行) ----
  const cookieVal = req.cookies.get(SESSION_COOKIE)?.value;
  const sessionId =
    cookieVal && SESSION_ID_RE.test(cookieVal)
      ? cookieVal
      : crypto.randomUUID();

  // ---- 明らかな crawler は記録しない (200 で応答だけ返す) ----
  const ua = req.headers.get("user-agent") ?? "";
  if (BOT_UA_RE.test(ua)) {
    const res = NextResponse.json({ ok: true, recorded: false });
    setSessionCookie(res, sessionId);
    return res;
  }

  // ---- 同一 session × event の短時間再記録を抑制 ----
  const recent = await prisma.eventView.findFirst({
    where: {
      eventId,
      sessionId,
      createdAt: { gte: new Date(Date.now() - DEDUP_WINDOW_MS) },
    },
    select: { id: true },
  });
  if (recent) {
    const res = NextResponse.json({ ok: true, recorded: false, deduped: true });
    setSessionCookie(res, sessionId);
    return res;
  }

  // ---- ログイン中なら userId を紐づけ (匿名可) ----
  const user = await getCurrentUser().catch(() => null);
  const userId = user ? user.id : null;

  // ---- 保存 (nextId + race retry, CLAUDE.md §6.4) ----
  await withRetry(() =>
    prisma.$transaction(async (tx) => {
      const id = await nextId(tx, "eventView");
      return tx.eventView.create({
        data: {
          id,
          eventId,
          sessionId,
          userId,
          referrer,
          utmSource,
          utmMedium,
          utmCampaign,
        },
        select: { id: true },
      });
    }),
  );

  const res = NextResponse.json({ ok: true, recorded: true }, { status: 201 });
  setSessionCookie(res, sessionId);
  return res;
}
