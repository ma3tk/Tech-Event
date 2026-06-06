/**
 * Job enqueue helper。
 *
 * 設計方針:
 * - `REDIS_URL` 未設定 (dev) では Queue 自体が null になるため、
 *   `inlineHandler` を呼び出して**同期実行**にフォールバックする。
 *   既存挙動 (joinEvent の `$transaction` 直接呼び出し等) を壊さない。
 * - idempotency: 呼び出し側が `jobId` を渡せるようにする。
 *   BullMQ は同一 jobId を「既に enqueue 済み」として無視する。
 */
import type { JobsOptions } from "bullmq";

import { getQueue } from "./queue-factory";
import { isRedisEnabled } from "./connection";

export type EnqueueResult = {
  /** queue/inline どちらで処理されたか */
  mode: "queued" | "inline";
  /** BullMQ job id (queued モードのみ) */
  jobId: string | null;
};

export type EnqueueOptions<TData> = JobsOptions & {
  /**
   * Redis 未設定時に呼ばれる同期処理。fallback の本体。
   *
   * 戻り値は捨てる (queued モードでは worker が結果を Redis に書き込む)。
   */
  inlineHandler?: (data: TData) => Promise<unknown> | unknown;
};

/**
 * 指定キューに job を投入。Redis 無効なら inline 実行に fallback。
 *
 * @example
 * await enqueueJob('participation', 'join', { userId, eventId, eventRoleId }, {
 *   jobId: `${userId}:${eventId}:${eventRoleId}`,
 *   inlineHandler: async (data) => runJoinSync(data),
 * });
 */
export async function enqueueJob<TData>(
  queueName: string,
  jobName: string,
  data: TData,
  opts: EnqueueOptions<TData> = {},
): Promise<EnqueueResult> {
  const { inlineHandler, ...jobOptions } = opts;

  if (!isRedisEnabled()) {
    if (inlineHandler) {
      await inlineHandler(data);
    }
    return { mode: "inline", jobId: null };
  }

  const queue = getQueue(queueName);
  if (!queue) {
    // 設定はあるが接続失敗等で取れなかった: inline fallback
    if (inlineHandler) {
      await inlineHandler(data);
    }
    return { mode: "inline", jobId: null };
  }

  const job = await queue.add(jobName, data, jobOptions);
  return { mode: "queued", jobId: job.id ?? null };
}

/**
 * Job 状態を返す軽量 query。
 *
 * - `null`     : job が見つからない (期限切れ含む)
 * - 状態文字列 : 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused' | 'waiting-children'
 */
export type JobState =
  | "waiting"
  | "active"
  | "completed"
  | "failed"
  | "delayed"
  | "paused"
  | "waiting-children"
  | "unknown";

export type JobStatus = {
  id: string;
  state: JobState | null;
  /** BullMQ の JobProgress は number | string | boolean | object のいずれか */
  progress: number | string | boolean | object;
  returnvalue: unknown;
  failedReason: string | null;
  attemptsMade: number;
  data: unknown;
};

export async function getJobStatus(
  queueName: string,
  jobId: string,
): Promise<JobStatus | null> {
  if (!isRedisEnabled()) return null;
  const queue = getQueue(queueName);
  if (!queue) return null;

  const job = await queue.getJob(jobId);
  if (!job) return null;

  const state = (await job.getState()) as JobState;
  return {
    id: String(job.id),
    state,
    progress: (job.progress as number | string | boolean | object) ?? 0,
    returnvalue: job.returnvalue ?? null,
    failedReason: job.failedReason ?? null,
    attemptsMade: job.attemptsMade ?? 0,
    data: job.data,
  };
}
