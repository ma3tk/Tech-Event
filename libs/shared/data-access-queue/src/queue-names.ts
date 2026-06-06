/**
 * tech-event で使う BullMQ キュー名の集約。
 *
 * - participation: 申込受付 (joinEvent 等の重い処理を非同期化)
 * - notification:  メール / Slack 通知の送信
 * - lottery:       抽選バッチ (`runLotteryForEvent` を queue 経由で)
 *
 * リテラル文字列を散らさず、テスト/ダッシュボードでも参照できるよう定数化。
 */
export const QUEUE_NAMES = {
  participation: "participation",
  notification: "notification",
  lottery: "lottery",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export const ALL_QUEUE_NAMES: ReadonlyArray<QueueName> = Object.values(QUEUE_NAMES);

/**
 * DLQ (Dead Letter Queue) 名。
 *
 * notification のリトライ上限超過 job は DLQ に手動 / hook 経由で送られる。
 */
export const DLQ_NAME = "notification-dlq" as const;
