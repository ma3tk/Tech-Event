/**
 * BigInt id 採番ヘルパー。
 *
 * Prisma 7 + SQLite + Driver Adapter の組み合わせでは
 * `BigInt @id @default(autoincrement())` が機能せず INSERT 時に null になる
 * ため、明示的に最大 id + 1 を割り当てる必要がある (seed.ts でも同様の対応)。
 *
 * 単純な `_max + 1` は並列実行でレースを起こすため、UNIQUE 制約違反 (Prisma の
 * `P2002`) を捕捉して数回リトライする `withRetry` を提供する。
 *
 * 例:
 * ```ts
 * await withRetry(() => prisma.$transaction(async (tx) => {
 *   const id = await nextId(tx, "participant");
 *   await tx.participant.create({ data: { id, ... } });
 * }));
 * ```
 */
import type { prisma as PrismaClient } from "@/lib/prisma";

/** Prisma の interactive transaction client。`tx` 型として利用。 */
export type IdGenClient = Parameters<
  Parameters<(typeof PrismaClient)["$transaction"]>[0]
>[0];

/** `_max+1` 採番が対応する Prisma モデル名 (camelCase)。 */
export type IdGenTable =
  | "user"
  | "oAuthIdentity"
  | "group"
  | "groupAdmin"
  | "groupMember"
  | "event"
  | "eventRole"
  | "participant"
  | "bookmark"
  | "comment"
  | "notification"
  | "notificationPreference"
  | "message"
  | "calendar"
  | "calendarSubscription"
  | "survey"
  | "surveyQuestion"
  | "surveyAnswer"
  | "payment"
  | "presentationMaterial"
  | "auditLog";

/**
 * tx (or prisma) と table 名を受け取り、現存最大 id + 1 を返す。
 *
 * トランザクション内で呼ぶことを推奨。並列に同じ table を `nextId` した場合は
 * 両方が同じ値を返すため、UNIQUE 違反 (`P2002`) を `withRetry` で吸収する。
 */
export async function nextId<T extends IdGenTable>(
  tx: IdGenClient,
  table: T,
): Promise<bigint> {
  // 型: Prisma 生成 client の各 model は `aggregate({ _max: { id: true } })`
  // を持つ。テーブル名でアクセスするため `as` で any-like に narrow する。
  const model = (tx as unknown as Record<string, {
    aggregate(args: { _max: { id: true } }): Promise<{ _max: { id: bigint | null } }>;
  }>)[table];
  const row = await model.aggregate({ _max: { id: true } });
  return (row._max.id ?? BigInt(0)) + BigInt(1);
}

/**
 * Prisma のエラーが UNIQUE 制約違反 (P2002) かを判定する。
 *
 * Prisma の `PrismaClientKnownRequestError` を直接 import すると bundler 経路で
 * 依存が膨らむため、`code` プロパティの duck-typing で判定する。
 */
function isUniqueConstraintError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { code?: unknown; message?: unknown };
  if (e.code === "P2002") return true;
  // better-sqlite3 のドライバ層から漏れたメッセージ
  const msg = typeof e.message === "string" ? e.message : "";
  return /UNIQUE constraint failed/i.test(msg);
}

/**
 * UNIQUE 制約違反 (P2002) を捕捉して指定回数までリトライする。
 *
 * - 採番の race を吸収するための「ベストエフォート」リトライ。
 * - その他の例外 (バリデーション失敗等) はそのまま投げる。
 * - 既定で 3 回 (= 初回 + リトライ 2 回) まで試行。
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < Math.max(1, retries); i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isUniqueConstraintError(err)) {
        throw err;
      }
      // 衝突したら 0..10ms の jitter を挟んで再試行
      const jitter = Math.floor(Math.random() * 10);
      await new Promise((r) => setTimeout(r, jitter));
    }
  }
  throw lastErr;
}
