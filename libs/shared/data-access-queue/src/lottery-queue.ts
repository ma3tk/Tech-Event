/**
 * 抽選バッチを queue 化するためのヘルパー。
 *
 * `/api/cron/run-lotteries` は候補 event を抽出した後、各 event に対して
 * `lottery` キューに job を投入するだけにする。worker が実処理を担う。
 *
 * jobId は `lottery:<eventId>` を採用し、同時刻に複数 cron が走っても
 * 同じ event を二重実行しない (idempotent)。
 */
import { enqueueJob, type EnqueueResult, getJobStatus, type JobStatus } from "./enqueue";
import { QUEUE_NAMES } from "./queue-names";

export type LotteryRunData = {
  eventId: string;
};

export const LOTTERY_JOB_NAMES = {
  run: "run",
} as const;

export function buildLotteryJobId(d: LotteryRunData): string {
  return `lottery:${d.eventId}`;
}

export async function enqueueLottery(
  data: LotteryRunData,
  inlineHandler?: (data: LotteryRunData) => Promise<unknown>,
): Promise<EnqueueResult> {
  return enqueueJob<LotteryRunData>(
    QUEUE_NAMES.lottery,
    LOTTERY_JOB_NAMES.run,
    data,
    {
      jobId: buildLotteryJobId(data),
      attempts: 2,
      backoff: { type: "exponential", delay: 5000 },
      inlineHandler,
    },
  );
}

export async function getLotteryJobStatus(jobId: string): Promise<JobStatus | null> {
  return getJobStatus(QUEUE_NAMES.lottery, jobId);
}
