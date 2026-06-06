/**
 * 抽選バッチ (`lottery` queue) の processor。
 *
 * `/api/cron/run-lotteries` が候補 event を抽出して各 event id を enqueue する。
 * 本 processor は 1 event ぶんの抽選を Prisma で実行する。
 *
 * 抽選ロジック自体は `libs/web/feature-event/src/lottery-actions.ts` の
 * `runLotteryForEvent` に依存する想定だが、Next.js 依存を避けるため worker 側では
 * 同等のロジックを最小実装する (capacity に応じて pending を accepted/rejected に振分)。
 */
import type { LotteryRunData } from "@tech-event/shared-data-access-queue";

import { logger } from "../logger";
import { withWorkerPrisma } from "../prisma-bridge";

export async function processLotteryJob(data: LotteryRunData): Promise<{
  processedRoles: number;
  accepted: number;
  rejected: number;
}> {
  const eventId = BigInt(data.eventId);

  return withWorkerPrisma(async (prisma) => {
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) {
        throw new Error(`event ${data.eventId} not found`);
      }

      const roles = await tx.eventRole.findMany({
        where: {
          eventId,
          recruitmentMethod: "lottery",
        },
      });

      let acceptedTotal = 0;
      let rejectedTotal = 0;
      let processedRoles = 0;

      for (const role of roles) {
        const pendings = await tx.participant.findMany({
          where: { eventId, eventRoleId: role.id, status: "pending" },
        });
        if (pendings.length === 0) continue;
        processedRoles++;

        // capacity に応じてランダムに抽選 (capacity null なら全員 accepted)
        const capacity = role.capacity ?? pendings.length;
        const shuffled = [...pendings].sort(() => Math.random() - 0.5);
        const winners = shuffled.slice(0, capacity);
        const losers = shuffled.slice(capacity);

        const now = new Date();
        for (const w of winners) {
          await tx.participant.update({
            where: { id: w.id },
            data: { status: "accepted", acceptedAt: now },
          });
        }
        for (const l of losers) {
          await tx.participant.update({
            where: { id: l.id },
            data: { status: "rejected" },
          });
        }
        acceptedTotal += winners.length;
        rejectedTotal += losers.length;

        if (winners.length > 0) {
          await tx.event.update({
            where: { id: eventId },
            data: { acceptedCount: { increment: winners.length } },
          });
        }
      }

      return { processedRoles, accepted: acceptedTotal, rejected: rejectedTotal };
    });

    logger.info(
      { eventId: data.eventId, ...result },
      "lottery: processed",
    );
    return result;
  });
}
