"use server";

/**
 * 出席チェックイン用 Server Actions。
 *
 * - `checkInWithCode`: 参加者が出席コードを入力してチェックイン。
 *   `Event.attendanceCode` と一致したら自分の Participant を `attended` に更新する。
 *   既に attended なら no-op。
 * - `toggleParticipantAttendance`: 主催者 / GroupAdmin が任意の参加者の出席状態を
 *   切り替える。manual 方式で記録。
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/* ============================================================
 * バリデーション
 * ============================================================ */

function formValue(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
}

const BigIntIdSchema = z
  .string()
  .regex(/^\d+$/, "id must be digits only")
  .transform((s) => BigInt(s));

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
