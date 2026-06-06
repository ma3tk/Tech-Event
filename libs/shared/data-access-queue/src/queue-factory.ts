/**
 * BullMQ Queue / QueueEvents の factory。
 *
 * - 同一プロセスでは同一名のキューを共有 (globalThis cache)。
 * - Redis 未設定なら null を返す。
 * - 上位 (enqueueJob 等) が null を受けたら inline 実行 fallback に切り替える。
 */
import { Queue, QueueEvents } from "bullmq";
import type { Queue as QueueType, QueueEvents as QueueEventsType } from "bullmq";

import { getRedisConnection, isRedisEnabled } from "./connection";

type Caches = {
  queues: Map<string, QueueType>;
  events: Map<string, QueueEventsType>;
};

const GLOBAL_KEY = "__teBullCache__" as const;
type GlobalCache = { [GLOBAL_KEY]?: Caches };
const g = globalThis as unknown as GlobalCache;

function getCaches(): Caches {
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = { queues: new Map(), events: new Map() };
  }
  return g[GLOBAL_KEY]!;
}

/**
 * 名前指定で Queue を取得。Redis 未設定なら null。
 *
 * 同名のキューを複数 instantiate しないようキャッシュする。
 */
export function getQueue(name: string): QueueType | null {
  if (!isRedisEnabled()) return null;
  const conn = getRedisConnection();
  if (!conn) return null;

  const caches = getCaches();
  const cached = caches.queues.get(name);
  if (cached) return cached;

  const q = new Queue(name, {
    // 直接 ioredis@5.11 と bullmq 同梱の ioredis@5.10 が併存する関係で
    // 型が同一だが別シンボル扱いになる。ランタイムは互換のため強制 cast する。
    connection: conn as unknown as ConstructorParameters<typeof Queue>[1] extends { connection: infer C } ? C : never,
    defaultJobOptions: {
      // 成功 job は 1 時間 / 100 件まで保持 (デフォルトは無制限で Redis を圧迫)
      removeOnComplete: { age: 60 * 60, count: 100 },
      // 失敗は 24 時間保持して調査に使う
      removeOnFail: { age: 24 * 60 * 60, count: 200 },
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
    },
  });
  caches.queues.set(name, q);
  return q;
}

/**
 * QueueEvents を取得 (job 状態 polling / completed 待ち受け用)。
 */
export function getQueueEvents(name: string): QueueEventsType | null {
  if (!isRedisEnabled()) return null;
  const conn = getRedisConnection();
  if (!conn) return null;

  const caches = getCaches();
  const cached = caches.events.get(name);
  if (cached) return cached;

  const ev = new QueueEvents(name, { connection: conn as unknown as ConstructorParameters<typeof QueueEvents>[1] extends { connection?: infer C } ? C : never });
  caches.events.set(name, ev);
  return ev;
}

/**
 * すべてのキャッシュ済み Queue/QueueEvents を閉じる (shutdown 用)。
 */
export async function closeAllQueues(): Promise<void> {
  if (!g[GLOBAL_KEY]) return;
  const caches = g[GLOBAL_KEY]!;
  await Promise.allSettled([
    ...[...caches.queues.values()].map((q) => q.close()),
    ...[...caches.events.values()].map((ev) => ev.close()),
  ]);
  caches.queues.clear();
  caches.events.clear();
}
