/**
 * tech-event BullMQ worker entry point.
 *
 * 3 つの Worker を立てる:
 *   - participation:  申込実処理 (定員 / counter / Participant 行作成)
 *   - notification:   メール / Slack 送信 (失敗時は DLQ)
 *   - lottery:        抽選バッチ (`runLotteryForEvent` 相当)
 *
 * Redis 接続は `@tech-event/shared-data-access-queue` の `getRedisConnection`
 * を共有。SIGTERM/SIGINT で graceful shutdown する。
 *
 * 環境変数:
 *   REDIS_URL                 redis://... (必須)
 *   DATABASE_URL              Prisma 接続文字列 (必須)
 *   WORKER_CONCURRENCY        各 queue の並列実行数 (default 5)
 *   LOG_LEVEL                 pino レベル (default info)
 */
import { Worker } from "bullmq";
import type { Job } from "bullmq";

import {
  getRedisConnection,
  closeRedisConnection,
  closeAllQueues,
  QUEUE_NAMES,
  pushDeadLetter,
  type ParticipationJoinData,
  type LotteryRunData,
  type NotificationData,
} from "@tech-event/shared-data-access-queue";

import { logger } from "./logger";
import { processJoinJob } from "./processors/participation";
import { processLotteryJob } from "./processors/lottery";
import { processNotificationJob } from "./processors/notification";
import { disconnectPrisma } from "./prisma-bridge";

const CONCURRENCY = Number(process.env.WORKER_CONCURRENCY ?? 5);

function requireRedis() {
  const conn = getRedisConnection();
  if (!conn) {
    logger.error("REDIS_URL is not set — worker cannot start");
    process.exit(1);
  }
  return conn;
}

function startParticipationWorker() {
  const connection = requireRedis();
  const w = new Worker<ParticipationJoinData>(
    QUEUE_NAMES.participation,
    async (job: Job<ParticipationJoinData>) => {
      logger.debug({ jobId: job.id, name: job.name }, "participation: start");
      return processJoinJob(job.data);
    },
    { connection, concurrency: CONCURRENCY },
  );
  w.on("completed", (job, result) => {
    logger.info({ jobId: job.id, result }, "participation: completed");
  });
  w.on("failed", (job, err) => {
    logger.error(
      { jobId: job?.id, err: err.message, attempts: job?.attemptsMade },
      "participation: failed",
    );
  });
  return w;
}

function startLotteryWorker() {
  const connection = requireRedis();
  const w = new Worker<LotteryRunData>(
    QUEUE_NAMES.lottery,
    async (job: Job<LotteryRunData>) => {
      logger.debug({ jobId: job.id }, "lottery: start");
      return processLotteryJob(job.data);
    },
    { connection, concurrency: Math.max(1, Math.floor(CONCURRENCY / 2)) },
  );
  w.on("completed", (job, result) => {
    logger.info({ jobId: job.id, result }, "lottery: completed");
  });
  w.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, "lottery: failed");
  });
  return w;
}

function startNotificationWorker() {
  const connection = requireRedis();
  const w = new Worker<NotificationData>(
    QUEUE_NAMES.notification,
    async (job: Job<NotificationData>) => {
      logger.debug({ jobId: job.id, kind: job.data.kind }, "notification: start");
      return processNotificationJob(job.data);
    },
    { connection, concurrency: CONCURRENCY },
  );
  w.on("completed", (job, result) => {
    logger.debug({ jobId: job.id, result }, "notification: completed");
  });
  w.on("failed", async (job, err) => {
    logger.warn(
      { jobId: job?.id, err: err.message, attempts: job?.attemptsMade },
      "notification: failed",
    );
    if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
      try {
        await pushDeadLetter({
          ...(job.data as NotificationData),
          failedReason: err.message,
          originalJobId: job.id ?? null,
        });
        logger.warn({ jobId: job.id }, "notification: pushed to DLQ");
      } catch (dlqErr) {
        logger.error(
          { jobId: job.id, dlqErr: (dlqErr as Error).message },
          "notification: DLQ push failed",
        );
      }
    }
  });
  return w;
}

async function main() {
  logger.info({ concurrency: CONCURRENCY }, "worker starting");

  const workers: Worker[] = [
    startParticipationWorker(),
    startLotteryWorker(),
    startNotificationWorker(),
  ];

  logger.info(
    {
      queues: [
        QUEUE_NAMES.participation,
        QUEUE_NAMES.lottery,
        QUEUE_NAMES.notification,
      ],
    },
    "worker ready",
  );

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, "worker shutting down");
    try {
      await Promise.allSettled(workers.map((w) => w.close()));
      await closeAllQueues();
      await closeRedisConnection();
      await disconnectPrisma();
    } catch (e) {
      logger.error({ err: (e as Error).message }, "shutdown error");
    } finally {
      process.exit(0);
    }
  };

  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((err) => {
  logger.error({ err: err.message, stack: err.stack }, "worker crashed");
  process.exit(1);
});
