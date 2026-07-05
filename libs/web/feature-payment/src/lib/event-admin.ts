/**
 * 決済系 Server Action 共通の「イベント管理者」判定。
 *
 * - Event.ownerId == userId
 * - もしくは当該イベントの Group の GroupAdmin に userId が居る
 *
 * feature-event 側の `isEventAdmin` (checkin-actions.ts) と同等だが、
 * feature-payment → feature-event の依存を作らないためにローカル実装する
 * (Nx モジュール境界 / 循環依存の回避)。
 */
import { prisma } from "@/lib/prisma";

/** 指定ユーザーが指定イベントを管理できるか (owner or group admin)。 */
export async function canManageEventPayments(
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
