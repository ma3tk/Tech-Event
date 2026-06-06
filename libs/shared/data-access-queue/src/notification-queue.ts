/**
 * メール / Slack 通知の送信を queue 化するヘルパー。
 *
 * - kind: "email" | "slack" の 2 種類をサポート。
 * - email: 既存 `@/lib/mailer` の sendMail を worker 側で呼ぶ。
 * - slack: 既存 `@/lib/slack` の Webhook 送信を worker 側で呼ぶ。
 * - 失敗時は attempts=3 で指数バックオフ → 最終失敗で DLQ に手動 push する。
 */
import { enqueueJob, type EnqueueResult, getJobStatus, type JobStatus } from "./enqueue";
import { QUEUE_NAMES, DLQ_NAME } from "./queue-names";

export type EmailNotificationData = {
  kind: "email";
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SlackNotificationData = {
  kind: "slack";
  webhookUrl: string;
  text: string;
  /** Block Kit blocks (任意) — JSON でそのまま POST する */
  blocks?: unknown[];
};

export type NotificationData = EmailNotificationData | SlackNotificationData;

export const NOTIFICATION_JOB_NAMES = {
  send: "send",
  /** DLQ への 1 回限りの push (worker から呼ぶ) */
  deadLetter: "dead-letter",
} as const;

export async function enqueueNotification(
  data: NotificationData,
  inlineHandler?: (data: NotificationData) => Promise<unknown>,
): Promise<EnqueueResult> {
  return enqueueJob<NotificationData>(
    QUEUE_NAMES.notification,
    NOTIFICATION_JOB_NAMES.send,
    data,
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      inlineHandler,
    },
  );
}

/**
 * DLQ への push (worker の failed listener から呼ばれる想定)。
 */
export async function pushDeadLetter(
  data: NotificationData & { failedReason: string; originalJobId: string | null },
): Promise<EnqueueResult> {
  return enqueueJob<typeof data>(
    DLQ_NAME,
    NOTIFICATION_JOB_NAMES.deadLetter,
    data,
    {
      // DLQ では再試行しない
      attempts: 1,
      removeOnComplete: false,
      removeOnFail: false,
    },
  );
}

export async function getNotificationJobStatus(jobId: string): Promise<JobStatus | null> {
  return getJobStatus(QUEUE_NAMES.notification, jobId);
}
