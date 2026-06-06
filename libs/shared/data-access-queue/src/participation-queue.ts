/**
 * 参加申込 (joinEvent) を非同期化するための queue ヘルパー。
 *
 * 受付窓口 (Server Action) は zod 検証と認証だけ済ませて、即 enqueue する。
 * 実処理 (定員チェック / Participant 行作成 / counter 増分 / 通知) は worker 側
 * (`apps/worker/src/processors/participation.ts`) で行う。
 *
 * jobId は `${userId}:${eventId}:${eventRoleId}` を使い、二重申込 (同枠) を
 * BullMQ 側で素早く弾く (idempotency)。Redis 未設定環境では `inlineHandler` が
 * 呼ばれ、従来通り同期で処理される。
 */
import { enqueueJob, type EnqueueResult, getJobStatus, type JobStatus } from "./enqueue";
import { QUEUE_NAMES } from "./queue-names";

export type ParticipationJoinData = {
  /** 申込者の userId (bigint を文字列化) */
  userId: string;
  /** 申込先イベント id (文字列) */
  eventId: string;
  /** 役割 (枠) id (文字列) */
  eventRoleId: string;
};

export const PARTICIPATION_JOB_NAMES = {
  join: "join",
  cancel: "cancel",
} as const;

export function buildJoinJobId(d: ParticipationJoinData): string {
  return `join:${d.userId}:${d.eventId}:${d.eventRoleId}`;
}

/**
 * 申込 job を投入する受付窓口。
 *
 * @param data 申込内容
 * @param inlineHandler Redis 未設定時の fallback (既存同期処理を渡す)
 */
export async function enqueueJoin(
  data: ParticipationJoinData,
  inlineHandler?: (data: ParticipationJoinData) => Promise<unknown>,
): Promise<EnqueueResult> {
  return enqueueJob<ParticipationJoinData>(
    QUEUE_NAMES.participation,
    PARTICIPATION_JOB_NAMES.join,
    data,
    {
      jobId: buildJoinJobId(data),
      // 申込の旧重複 job が残っていても idempotent に処理を試みる
      removeOnComplete: { age: 60 * 60, count: 500 },
      removeOnFail: { age: 24 * 60 * 60, count: 200 },
      attempts: 3,
      backoff: { type: "exponential", delay: 500 },
      inlineHandler,
    },
  );
}

export async function getParticipationJobStatus(
  jobId: string,
): Promise<JobStatus | null> {
  return getJobStatus(QUEUE_NAMES.participation, jobId);
}
