/**
 * `@tech-event/shared-data-access-queue` — BullMQ ベースの非同期キュー基盤。
 *
 * 提供:
 *  - Redis 接続シングルトン (`getRedisConnection`, `isRedisEnabled`, `closeRedisConnection`)
 *  - Queue / QueueEvents factory (`getQueue`, `getQueueEvents`, `closeAllQueues`)
 *  - 汎用 enqueue ヘルパー (`enqueueJob`, `getJobStatus`)
 *  - ドメイン別キュー (`participation-queue`, `lottery-queue`, `notification-queue`)
 *
 * 設計原則:
 *  - `REDIS_URL` 未設定なら `inlineHandler` を同期実行する (既存挙動の温存)。
 *  - jobId は呼び出し側で安定化 (二重 enqueue を BullMQ 側で抑止)。
 */
export * from "./connection";
export * from "./queue-names";
export * from "./queue-factory";
export * from "./enqueue";
export * from "./participation-queue";
export * from "./lottery-queue";
export * from "./notification-queue";
