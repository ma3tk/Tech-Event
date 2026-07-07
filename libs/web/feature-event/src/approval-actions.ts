"use server";

/**
 * Approval Required イベントの主催者向け Server Actions。
 *
 * - `approveParticipant(formData)` : 申請を承認する。EventRole 定員 (capacity) に
 *   空きがあれば status=accepted、満員なら status=waiting (補欠) として確定する。
 * - `rejectParticipant(formData)`  : 申請を却下する。status=cancelled に倒し
 *   approvalStatus=rejected を残してメモを保存する。
 *
 * 認可: `event.ownerId === self` or `GroupAdmin(owner|admin)`。
 * BigInt id 採番は既存パターン (`_max + 1`) を踏襲。
 *
 * 通知: 承認/却下の決定時に申請者本人にサイト内通知を 1 件作る。
 * (NotificationPreference でオプトアウト済みなら作成スキップ)
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { nextId } from "@/lib/id-gen";
import { recordAudit } from "@/lib/audit";
import { getString as formValue, getStringRaw as formValueRaw } from "@/lib/form-data";
import { buildApprovalResultMailContent } from "@/lib/notification";

import {
  eventAbsoluteUrl,
  resolveRequestOrigin,
  sendParticipantMailsSafely,
  type ParticipantMailTask,
} from "./lib/participant-notify";

/* ============================================================
 * バリデーション
 * ============================================================ */

const ApproveSchema = z.object({
  eventId: z.string().regex(/^\d+$/),
  participantId: z.string().regex(/^\d+$/),
  note: z.string().max(2000).optional().default(""),
});

/* ============================================================
 * 共通
 * ============================================================ */

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function nextNotificationId(tx: Tx): Promise<bigint> {
  return nextId(tx, "notification");
}

async function isPreferenceEnabled(
  tx: Tx,
  userId: bigint,
  kind: string,
  channel: string,
): Promise<boolean> {
  const pref = await tx.notificationPreference.findUnique({
    where: { userId_kind_channel: { userId, kind, channel } },
  });
  return pref ? pref.enabled : true;
}

/**
 * 申請者への承認結果メールタスクを組み立てる (トランザクション内で呼ぶ)。
 * `User.receiveNotificationEmail` + NotificationPreference (approval_result × email)
 * を尊重し、無効なら null。送信自体は commit 後に `sendParticipantMailsSafely` で行う。
 */
async function buildApprovalMailTask(
  tx: Tx,
  params: {
    recipientUserId: bigint;
    eventId: bigint;
    eventTitle: string;
    result: "approved" | "rejected";
    reason: string | null;
    origin: string;
  },
): Promise<ParticipantMailTask | null> {
  const applicant = await tx.user.findUnique({
    where: { id: params.recipientUserId },
    select: { email: true, status: true, receiveNotificationEmail: true },
  });
  if (!applicant || applicant.status !== "active") return null;
  const emailEnabled =
    applicant.receiveNotificationEmail &&
    (await isPreferenceEnabled(
      tx,
      params.recipientUserId,
      "approval_result",
      "email",
    ));
  if (!emailEnabled) return null;
  return {
    to: applicant.email,
    content: buildApprovalResultMailContent({
      eventTitle: params.eventTitle,
      result: params.result,
      reason: params.reason ?? undefined,
      eventUrl: eventAbsoluteUrl(params.origin, params.eventId),
    }),
  };
}

async function canManageEvent(
  eventOwnerId: bigint,
  eventGroupId: bigint,
  userId: bigint,
): Promise<boolean> {
  if (eventOwnerId === userId) return true;
  const admin = await prisma.groupAdmin.findUnique({
    where: { groupId_userId: { groupId: eventGroupId, userId } },
  });
  return !!admin && (admin.role === "owner" || admin.role === "admin");
}

function loginRedirect(eventId: string): never {
  redirect(`/login?next=${encodeURIComponent(`/event/${eventId}/admin/guests`)}`);
}

/* ============================================================
 * approveParticipant
 * ============================================================ */

export async function approveParticipant(formData: FormData): Promise<void> {
  const parsed = ApproveSchema.safeParse({
    eventId: formValue(formData, "eventId"),
    participantId: formValue(formData, "participantId"),
    note: formValueRaw(formData, "note"),
  });
  if (!parsed.success) throw new Error("invalid_input");
  const eventId = BigInt(parsed.data.eventId);
  const participantId = BigInt(parsed.data.participantId);
  const note = parsed.data.note || null;

  const user = await getCurrentUser();
  if (!user) loginRedirect(parsed.data.eventId);

  // 絶対 URL (メール内リンク) 用の origin はトランザクション前に解決しておく
  const origin = await resolveRequestOrigin();

  // 戻り値 = commit 後に申請者へ送る承認結果メール (不要なら null)
  const mailTask = await prisma.$transaction(async (tx): Promise<ParticipantMailTask | null> => {
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error("event_not_found");
    if (!(await canManageEvent(event.ownerId, event.groupId, user.id))) {
      throw new Error("forbidden");
    }
    const participant = await tx.participant.findUnique({
      where: { id: participantId },
    });
    if (!participant || participant.eventId !== eventId) {
      throw new Error("participant_not_found");
    }
    // すでに承認済 (= status accepted/waiting で approvalStatus approved) なら no-op
    // (この no-op ガードが通知/メールの二重送信防止も兼ねる)
    if (participant.approvalStatus === "approved") return null;

    const role = await tx.eventRole.findUnique({
      where: { id: participant.eventRoleId },
    });
    if (!role) throw new Error("role_not_found");

    const acceptedInRole = await tx.participant.count({
      where: {
        eventId,
        eventRoleId: participant.eventRoleId,
        status: "accepted",
      },
    });
    const isFull =
      role.capacity != null && acceptedInRole >= role.capacity;
    const now = new Date();

    if (isFull) {
      const waitingInRole = await tx.participant.count({
        where: {
          eventId,
          eventRoleId: participant.eventRoleId,
          status: "waiting",
        },
      });
      await tx.participant.update({
        where: { id: participantId },
        data: {
          status: "waiting",
          approvalStatus: "approved",
          approvalNote: note,
          waitingPosition: waitingInRole + 1,
          acceptedAt: null,
        },
      });
      await tx.event.update({
        where: { id: eventId },
        data: { waitingCount: { increment: 1 } },
      });
    } else {
      await tx.participant.update({
        where: { id: participantId },
        data: {
          status: "accepted",
          approvalStatus: "approved",
          approvalNote: note,
          acceptedAt: now,
          waitingPosition: null,
        },
      });
      await tx.event.update({
        where: { id: eventId },
        data: { acceptedCount: { increment: 1 } },
      });
    }

    // 申請者に通知
    if (
      await isPreferenceEnabled(
        tx,
        participant.userId,
        "approval_result",
        "in_app",
      )
    ) {
      await tx.notification.create({
        data: {
          id: await nextNotificationId(tx),
          recipientUserId: participant.userId,
          kind: "approval_result",
          eventId,
          payload: JSON.stringify({
            result: "approved",
            // formatNotificationText が参照するフィールド
            approvalResult: "approved",
            eventTitle: event.title,
            note: note ?? "",
            reason: note ?? "",
          }),
          channel: "in_app",
        },
      });
    }

    // 申請者への承認結果メール (email pref 有効時のみ、送信は commit 後)
    return buildApprovalMailTask(tx, {
      recipientUserId: participant.userId,
      eventId,
      eventTitle: event.title,
      result: "approved",
      reason: note,
      origin,
    });
  });

  // メール送信は DB commit 後 (失敗しても throw しない)
  await sendParticipantMailsSafely([mailTask]);

  // 監査ログ
  void recordAudit({
    actorUserId: user.id,
    action: "participant.approve",
    targetType: "Participant",
    targetId: participantId,
    metadata: { eventId: eventId.toString() },
  });

  revalidatePath(`/event/${eventId.toString()}`);
  revalidatePath(`/event/${eventId.toString()}/admin/guests`);
  revalidatePath("/dashboard");
}

/* ============================================================
 * rejectParticipant
 * ============================================================ */

export async function rejectParticipant(formData: FormData): Promise<void> {
  const parsed = ApproveSchema.safeParse({
    eventId: formValue(formData, "eventId"),
    participantId: formValue(formData, "participantId"),
    note: formValueRaw(formData, "note"),
  });
  if (!parsed.success) throw new Error("invalid_input");
  const eventId = BigInt(parsed.data.eventId);
  const participantId = BigInt(parsed.data.participantId);
  const note = parsed.data.note || null;

  const user = await getCurrentUser();
  if (!user) loginRedirect(parsed.data.eventId);

  // 絶対 URL (メール内リンク) 用の origin はトランザクション前に解決しておく
  const origin = await resolveRequestOrigin();

  // 戻り値 = commit 後に申請者へ送る却下結果メール (不要なら null)
  const mailTask = await prisma.$transaction(async (tx): Promise<ParticipantMailTask | null> => {
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error("event_not_found");
    if (!(await canManageEvent(event.ownerId, event.groupId, user.id))) {
      throw new Error("forbidden");
    }
    const participant = await tx.participant.findUnique({
      where: { id: participantId },
    });
    if (!participant || participant.eventId !== eventId) {
      throw new Error("participant_not_found");
    }
    // (この no-op ガードが通知/メールの二重送信防止も兼ねる)
    if (participant.approvalStatus === "rejected") return null;

    const wasAccepted = participant.status === "accepted";
    const wasWaiting = participant.status === "waiting";

    await tx.participant.update({
      where: { id: participantId },
      data: {
        status: "cancelled",
        approvalStatus: "rejected",
        approvalNote: note,
        cancelledAt: new Date(),
        waitingPosition: null,
      },
    });

    if (wasAccepted) {
      await tx.event.update({
        where: { id: eventId },
        data: { acceptedCount: { decrement: 1 } },
      });
    } else if (wasWaiting) {
      await tx.event.update({
        where: { id: eventId },
        data: { waitingCount: { decrement: 1 } },
      });
    }

    if (
      await isPreferenceEnabled(
        tx,
        participant.userId,
        "approval_result",
        "in_app",
      )
    ) {
      await tx.notification.create({
        data: {
          id: await nextNotificationId(tx),
          recipientUserId: participant.userId,
          kind: "approval_result",
          eventId,
          payload: JSON.stringify({
            result: "rejected",
            // formatNotificationText が参照するフィールド
            approvalResult: "rejected",
            eventTitle: event.title,
            note: note ?? "",
            reason: note ?? "",
          }),
          channel: "in_app",
        },
      });
    }

    // 申請者への却下結果メール (email pref 有効時のみ、送信は commit 後)
    return buildApprovalMailTask(tx, {
      recipientUserId: participant.userId,
      eventId,
      eventTitle: event.title,
      result: "rejected",
      reason: note,
      origin,
    });
  });

  // メール送信は DB commit 後 (失敗しても throw しない)
  await sendParticipantMailsSafely([mailTask]);

  // 監査ログ
  void recordAudit({
    actorUserId: user.id,
    action: "participant.reject",
    targetType: "Participant",
    targetId: participantId,
    metadata: { eventId: eventId.toString() },
  });

  revalidatePath(`/event/${eventId.toString()}`);
  revalidatePath(`/event/${eventId.toString()}/admin/guests`);
  revalidatePath("/dashboard");
}
