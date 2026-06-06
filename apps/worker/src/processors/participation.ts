/**
 * 参加申込 (`participation` queue) の processor。
 *
 * 受付窓口 (Next.js Server Action) は zod 検証と認証だけ済ませて即 enqueue する。
 * ここでは実処理だけを行う:
 *  1. event / role の存在チェック
 *  2. 既存 accepted/waiting/pending Participant があれば no-op
 *  3. 承認制 / 抽選方式 / 先着 の分岐で Participant を作成
 *  4. counter (acceptedCount / waitingCount) を増分
 *
 * 既存 Server Action `joinEvent` を呼ぶと revalidatePath / redirect が
 * Node.js 単体プロセスでは動かないため、本 processor は Prisma を直接呼ぶ。
 * 主要なロジックは `libs/web/feature-event/src/event-actions.ts` の joinEvent と
 * 同一構造で実装する (race 対策は BullMQ の同一 jobId による idempotency に委譲)。
 */
import type { ParticipationJoinData } from "@tech-event/shared-data-access-queue";

import { logger } from "../logger";
import { withWorkerPrisma } from "../prisma-bridge";

type AnyTxClient = Parameters<
  Parameters<
    import("@/generated/prisma").PrismaClient["$transaction"]
  >[0]
>[0];

/** Participant.id を採番する (Prisma 7 + Driver Adapter の autoincrement 不全回避)。 */
async function nextParticipantId(tx: AnyTxClient): Promise<bigint> {
  const row = await tx.participant.aggregate({ _max: { id: true } });
  return (row._max.id ?? BigInt(0)) + BigInt(1);
}

export type JoinResult = {
  status: "accepted" | "waiting" | "pending" | "skipped";
  participantId: string | null;
};

export async function processJoinJob(data: ParticipationJoinData): Promise<JoinResult> {
  const userId = BigInt(data.userId);
  const eventId = BigInt(data.eventId);
  const eventRoleId = BigInt(data.eventRoleId);

  return withWorkerPrisma(async (prisma) => {
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) {
        throw new Error(`event ${data.eventId} not found`);
      }
      const role = await tx.eventRole.findUnique({ where: { id: eventRoleId } });
      if (!role || role.eventId !== eventId) {
        throw new Error(`role ${data.eventRoleId} not found`);
      }

      // 既存 accepted/waiting/pending があれば no-op (idempotency 保護)
      const existing = await tx.participant.findFirst({
        where: { eventId, userId, status: { not: "cancelled" } },
      });
      if (existing) {
        return {
          status: existing.status as "accepted" | "waiting" | "pending",
          participantId: existing.id.toString(),
        };
      }

      const now = new Date();
      const id = await nextParticipantId(tx);

      // 承認制 → pending + approvalStatus=pending
      if (event.approvalRequired) {
        const p = await tx.participant.create({
          data: {
            id,
            eventId,
            eventRoleId,
            userId,
            status: "pending",
            approvalStatus: "pending",
            appliedAt: now,
          },
        });
        return { status: "pending" as const, participantId: p.id.toString() };
      }

      // 抽選方式 → pending (定員チェック / counter 増分なし)
      if (role.recruitmentMethod === "lottery") {
        const p = await tx.participant.create({
          data: {
            id,
            eventId,
            eventRoleId,
            userId,
            status: "pending",
            appliedAt: now,
          },
        });
        return { status: "pending" as const, participantId: p.id.toString() };
      }

      // 先着 (fcfs)
      const acceptedInRole = await tx.participant.count({
        where: { eventId, eventRoleId, status: "accepted" },
      });
      const isFull = role.capacity != null && acceptedInRole >= role.capacity;

      if (isFull) {
        const waitingInRole = await tx.participant.count({
          where: { eventId, eventRoleId, status: "waiting" },
        });
        const p = await tx.participant.create({
          data: {
            id,
            eventId,
            eventRoleId,
            userId,
            status: "waiting",
            waitingPosition: waitingInRole + 1,
            appliedAt: now,
          },
        });
        await tx.event.update({
          where: { id: eventId },
          data: { waitingCount: { increment: 1 } },
        });
        return { status: "waiting" as const, participantId: p.id.toString() };
      }

      const p = await tx.participant.create({
        data: {
          id,
          eventId,
          eventRoleId,
          userId,
          status: "accepted",
          appliedAt: now,
          acceptedAt: now,
        },
      });
      await tx.event.update({
        where: { id: eventId },
        data: { acceptedCount: { increment: 1 } },
      });
      return { status: "accepted" as const, participantId: p.id.toString() };
    });

    logger.info(
      {
        userId: data.userId,
        eventId: data.eventId,
        eventRoleId: data.eventRoleId,
        status: result.status,
      },
      "participation: processed",
    );

    return result;
  });
}
