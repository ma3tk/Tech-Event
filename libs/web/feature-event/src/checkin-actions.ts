"use server";

/**
 * 出席チェックイン用 Server Actions。
 *
 * - `checkInWithCode`: 参加者が出席コードを入力してチェックイン。
 *   `Event.attendanceCode` と一致したら自分の Participant を `attended` に更新する。
 *   既に attended なら no-op。
 * - `toggleParticipantAttendance`: 主催者 / GroupAdmin が任意の参加者の出席状態を
 *   切り替える。manual 方式で記録。
 * - `getMyQrTicket`: ログイン中の参加者本人のチケット QR 用署名トークンを発行。
 * - `checkInByQrToken`: 受付スタッフ (主催者 / GroupAdmin) が QR トークンを検証して
 *   参加者を attended に更新。qr 方式で記録。
 *
 * QR トークンの形式: `<participantId>.<base64url(HMAC-SHA256("qr-checkin.v1." + participantId, AUTH_SECRET))>`
 * - シークレットは te_session cookie と同じ `getSessionSecret()` (AUTH_SECRET) を再利用。
 * - ドメイン文字列 `qr-checkin.v1.` を混ぜることで、session cookie の
 *   `signUserId(userId)` 署名との相互流用 (cross-protocol) を防ぐ。
 * - 検証は `timingSafeEqual` (タイミング攻撃対策)。
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSessionSecret } from "@/lib/auth-session";
import { getStringRaw as formValue } from "@/lib/form-data";
import { BigIntIdSchema } from "@/lib/schemas";

/* ============================================================
 * バリデーション
 * ============================================================ */

const CheckInSchema = z.object({
  eventId: BigIntIdSchema,
  code: z.string().trim().min(1, "出席コードを入力してください").max(64),
});

const AdminToggleSchema = z.object({
  eventId: BigIntIdSchema,
  participantId: BigIntIdSchema,
  next: z.enum(["attended", "accepted"]),
});

/* ============================================================
 * ヘルパー
 * ============================================================ */

function loginRedirect(eventId: string): never {
  redirect(`/login?next=${encodeURIComponent(`/event/${eventId}/check-in`)}`);
}

function revalidateAttendance(eventId: bigint): void {
  revalidatePath(`/event/${eventId.toString()}`);
  revalidatePath(`/event/${eventId.toString()}/check-in`);
  revalidatePath(`/event/${eventId.toString()}/admin/check-in`);
  revalidatePath(`/dashboard`);
}

/**
 * 自分が指定イベントを管理できる権限を持つかを判定する。
 *
 * - Event.ownerId == self
 * - もしくは Group.admins (GroupAdmin) に self が居る
 */
export async function isEventAdmin(
  eventId: bigint,
  userId: bigint,
): Promise<boolean> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { ownerId: true, groupId: true },
  });
  if (!event) return false;
  if (event.ownerId === userId) return true;
  const admin = await prisma.groupAdmin.findFirst({
    where: { groupId: event.groupId, userId },
    select: { id: true },
  });
  return !!admin;
}

/* ============================================================
 * checkInWithCode
 * ============================================================ */

export type CheckInResult =
  | { ok: true; alreadyAttended: boolean }
  | { ok: false; error: "invalid_code" | "not_accepted" | "not_allowed" };

/**
 * フォームから呼び出される。チェックイン結果を返り値で返すが、
 * Server Action のリダイレクトは行わずページ側で表示する想定。
 */
export async function checkInWithCode(
  formData: FormData,
): Promise<CheckInResult> {
  const parsed = CheckInSchema.safeParse({
    eventId: formValue(formData, "eventId"),
    code: formValue(formData, "code"),
  });
  if (!parsed.success) {
    return { ok: false, error: "invalid_code" };
  }
  const { eventId, code } = parsed.data;

  const user = await getCurrentUser();
  if (!user) {
    loginRedirect(eventId.toString());
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      attendanceCode: true,
      allowAttendanceCodeCheckIn: true,
    },
  });
  if (!event) return { ok: false, error: "invalid_code" };
  if (!event.allowAttendanceCodeCheckIn) {
    return { ok: false, error: "not_allowed" };
  }

  if (
    !event.attendanceCode ||
    event.attendanceCode.trim() === "" ||
    event.attendanceCode.trim().toLowerCase() !== code.trim().toLowerCase()
  ) {
    return { ok: false, error: "invalid_code" };
  }

  const participant = await prisma.participant.findFirst({
    where: {
      eventId,
      userId: user.id,
      status: { in: ["accepted", "attended"] },
    },
  });
  if (!participant) {
    return { ok: false, error: "not_accepted" };
  }
  if (participant.status === "attended") {
    return { ok: true, alreadyAttended: true };
  }

  await prisma.participant.update({
    where: { id: participant.id },
    data: {
      status: "attended",
      checkInAt: new Date(),
      checkInMethod: "code",
    },
  });

  revalidateAttendance(eventId);
  return { ok: true, alreadyAttended: false };
}

/* ============================================================
 * toggleParticipantAttendance (主催者用)
 * ============================================================ */

export async function toggleParticipantAttendance(
  formData: FormData,
): Promise<void> {
  const parsed = AdminToggleSchema.safeParse({
    eventId: formValue(formData, "eventId"),
    participantId: formValue(formData, "participantId"),
    next: formValue(formData, "next"),
  });
  if (!parsed.success) {
    throw new Error("invalid_input");
  }
  const { eventId, participantId, next } = parsed.data;

  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(
        `/event/${eventId.toString()}/admin/check-in`,
      )}`,
    );
  }

  if (!(await isEventAdmin(eventId, user.id))) {
    throw new Error("forbidden");
  }

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
  });
  if (!participant || participant.eventId !== eventId) {
    throw new Error("participant_not_found");
  }

  if (next === "attended") {
    if (participant.status !== "accepted" && participant.status !== "attended") {
      throw new Error("not_accepted");
    }
    await prisma.participant.update({
      where: { id: participantId },
      data: {
        status: "attended",
        checkInAt: new Date(),
        checkInMethod: "manual",
      },
    });
  } else {
    // 取消: attended -> accepted
    if (participant.status !== "attended") {
      throw new Error("not_attended");
    }
    await prisma.participant.update({
      where: { id: participantId },
      data: {
        status: "accepted",
        checkInAt: null,
        checkInMethod: null,
      },
    });
  }

  revalidateAttendance(eventId);
}

/* ============================================================
 * QR チェックイン (署名付きトークン)
 * ============================================================ */

/** HMAC ドメイン分離用プレフィックス (session cookie 署名との混同防止) */
const QR_TOKEN_DOMAIN = "qr-checkin.v1";

/** base64url エンコード (auth-session.ts と同じ RFC 4648 形式) */
function base64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** participantId 文字列に対する QR 用 HMAC-SHA256 署名 (base64url) */
function signQrParticipantId(participantIdStr: string): string {
  const h = createHmac("sha256", getSessionSecret())
    .update(`${QR_TOKEN_DOMAIN}.${participantIdStr}`)
    .digest();
  return base64url(h);
}

/**
 * QR トークンを検証して participantId を返す。改ざん・形式不正は null。
 * 署名比較は `timingSafeEqual` (両者とも SHA-256 base64url = 43 文字だが、
 * 長さ不一致は比較前に弾く)。
 */
function verifyQrToken(token: string): bigint | null {
  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;
  const idStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^\d{1,18}$/.test(idStr)) return null;
  const expected = signQrParticipantId(idStr);
  const given = Buffer.from(sig, "utf8");
  const want = Buffer.from(expected, "utf8");
  if (given.length !== want.length) return null;
  if (!timingSafeEqual(given, want)) return null;
  try {
    return BigInt(idStr);
  } catch {
    return null;
  }
}

export type QrTicketResult =
  | {
      ok: true;
      /** QR にエンコードする署名付きトークン */
      token: string;
      status: "accepted" | "attended";
      checkInAt: string | null;
      roleName: string;
    }
  | {
      ok: false;
      error: "not_logged_in" | "not_found" | "qr_disabled" | "not_participant";
    };

/**
 * ログイン中ユーザー本人の参加チケット (QR トークン) を発行する。
 *
 * 認可: 本人の Participant 行 (accepted / attended) が存在する場合のみ。
 * 他人の participantId を指定してトークンを取得する経路は存在しない。
 */
export async function getMyQrTicket(
  eventIdRaw: string,
): Promise<QrTicketResult> {
  const parsed = BigIntIdSchema.safeParse(eventIdRaw);
  if (!parsed.success) return { ok: false, error: "not_found" };
  const eventId = parsed.data;

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_logged_in" };

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { allowQrCheckIn: true },
  });
  if (!event) return { ok: false, error: "not_found" };
  if (!event.allowQrCheckIn) return { ok: false, error: "qr_disabled" };

  const participant = await prisma.participant.findFirst({
    where: {
      eventId,
      userId: user.id,
      status: { in: ["accepted", "attended"] },
    },
    select: {
      id: true,
      status: true,
      checkInAt: true,
      eventRole: { select: { name: true } },
    },
  });
  if (!participant) return { ok: false, error: "not_participant" };

  const idStr = participant.id.toString();
  return {
    ok: true,
    token: `${idStr}.${signQrParticipantId(idStr)}`,
    status: participant.status === "attended" ? "attended" : "accepted",
    checkInAt: participant.checkInAt
      ? participant.checkInAt.toISOString()
      : null,
    roleName: participant.eventRole.name,
  };
}

export type QrCheckInResult =
  | { ok: true; alreadyAttended: boolean; participantName: string }
  | {
      ok: false;
      error:
        | "not_logged_in"
        | "forbidden"
        | "not_found"
        | "qr_disabled"
        | "invalid_token"
        | "wrong_event"
        | "not_accepted";
    };

const QrTokenSchema = z.string().trim().min(1).max(200);

/**
 * QR トークンで参加者をチェックインする (受付スタッフ用)。
 *
 * 1. 署名検証 (timingSafeEqual) → participantId 抽出
 * 2. 呼び出しユーザーが該当イベントの主催者 / GroupAdmin であることを認可
 * 3. `Event.allowQrCheckIn` が有効であること
 * 4. participant が同一イベントの accepted / attended であること
 * 5. attended へ更新 (`checkInMethod: "qr"`)。既に attended なら no-op
 */
export async function checkInByQrToken(
  eventIdRaw: string,
  token: string,
): Promise<QrCheckInResult> {
  const parsedEvent = BigIntIdSchema.safeParse(eventIdRaw);
  if (!parsedEvent.success) return { ok: false, error: "not_found" };
  const eventId = parsedEvent.data;

  const parsedToken = QrTokenSchema.safeParse(token);
  if (!parsedToken.success) return { ok: false, error: "invalid_token" };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_logged_in" };
  if (!(await isEventAdmin(eventId, user.id))) {
    return { ok: false, error: "forbidden" };
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { allowQrCheckIn: true },
  });
  if (!event) return { ok: false, error: "not_found" };
  if (!event.allowQrCheckIn) return { ok: false, error: "qr_disabled" };

  const participantId = verifyQrToken(parsedToken.data);
  if (participantId === null) return { ok: false, error: "invalid_token" };

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: {
      id: true,
      eventId: true,
      status: true,
      user: { select: { displayName: true } },
    },
  });
  // 存在しない participantId も「無効なトークン」として扱う (情報漏えい防止)
  if (!participant) return { ok: false, error: "invalid_token" };
  if (participant.eventId !== eventId) {
    return { ok: false, error: "wrong_event" };
  }

  if (participant.status === "attended") {
    return {
      ok: true,
      alreadyAttended: true,
      participantName: participant.user.displayName,
    };
  }
  if (participant.status !== "accepted") {
    return { ok: false, error: "not_accepted" };
  }

  await prisma.participant.update({
    where: { id: participant.id },
    data: {
      status: "attended",
      checkInAt: new Date(),
      checkInMethod: "qr",
    },
  });

  revalidateAttendance(eventId);
  return {
    ok: true,
    alreadyAttended: false,
    participantName: participant.user.displayName,
  };
}
