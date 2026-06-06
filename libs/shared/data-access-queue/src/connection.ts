/**
 * Redis 接続シングルトン。
 *
 * BullMQ は `ioredis` の `Redis` インスタンスを共有する設計が公式推奨。
 * Next.js dev HMR 中は接続を使い回すため、`globalThis` にキャッシュする。
 *
 * `REDIS_URL` が未設定なら `null` を返し、上位は inline fallback に切り替える。
 *
 * 環境変数:
 *   REDIS_URL  redis://[:password@]host:port[/db]
 *
 * NOTE: BullMQ は `maxRetriesPerRequest: null` と `enableReadyCheck: false` を
 * 推奨するため、ここで強制する。 (https://docs.bullmq.io/guide/connections)
 */
import IORedis from "ioredis";
import type { Redis as IORedisType, RedisOptions } from "ioredis";

const GLOBAL_KEY = "__teRedis__" as const;

type GlobalCache = {
  [GLOBAL_KEY]?: IORedisType | null;
};

const globalForRedis = globalThis as unknown as GlobalCache;

export function isRedisEnabled(): boolean {
  return Boolean(process.env.REDIS_URL);
}

/**
 * Redis 接続を返す。未設定なら null。
 *
 * 同一プロセス内で常に同じインスタンスを返す。
 */
export function getRedisConnection(): IORedisType | null {
  if (!isRedisEnabled()) {
    return null;
  }
  if (globalForRedis[GLOBAL_KEY]) {
    return globalForRedis[GLOBAL_KEY] ?? null;
  }

  const url = process.env.REDIS_URL!;
  const options: RedisOptions = {
    // BullMQ 推奨 (ブロッキングコマンドのために必須)
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    // 接続失敗時の自動 reconnect
    retryStrategy: (times: number) => Math.min(times * 200, 2000),
    lazyConnect: false,
  };

  const client = new IORedis(url, options);

  // 接続エラーを silently swallow せず stderr に出す (本番調査向け)
  client.on("error", (err: Error) => {
    // eslint-disable-next-line no-console
    console.error("[redis] connection error:", err.message);
  });

  globalForRedis[GLOBAL_KEY] = client;
  return client;
}

/**
 * Redis 接続を閉じる (graceful shutdown 用)。
 *
 * worker / Next.js プロセスの SIGTERM ハンドラから呼ぶ。
 */
export async function closeRedisConnection(): Promise<void> {
  const client = globalForRedis[GLOBAL_KEY];
  if (client) {
    try {
      await client.quit();
    } catch {
      // already closed
    }
    globalForRedis[GLOBAL_KEY] = null;
  }
}
