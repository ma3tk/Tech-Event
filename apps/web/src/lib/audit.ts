/**
 * Audit log helper.
 *
 * AuditLog テーブルへ「誰が・何を・どこで」を記録するためのユーティリティ。
 * 失敗しても主処理を止めない (catch → console.warn) ように設計する。
 *
 * 主要 Server Action (login / joinEvent / cancelParticipation / publishEvent /
 * createGroup 等) から呼ばれることを想定している。
 *
 * BigInt @id は他のテーブル同様 `_max + 1` 採番。
 */

import { prisma } from "@/lib/prisma";
import { nextId } from "@/lib/id-gen";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** AuditLog 用 ID 採番 (共通ヘルパー)。トランザクション外で呼ばれることもあるため client 引数を許容。 */
async function nextAuditLogId(client: Tx | typeof prisma): Promise<bigint> {
  return nextId(client as Tx, "auditLog");
}

export type AuditLogInput = {
  actorUserId?: bigint | null;
  action: string;
  targetType: string;
  targetId: bigint;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  /** トランザクション内で呼ぶ場合は tx を渡す */
  tx?: Tx;
};

/**
 * 監査ログを 1 件書き込む。失敗時は console.warn して握り潰す。
 *
 * 例:
 * ```ts
 * await recordAudit({
 *   actorUserId: user.id,
 *   action: "login",
 *   targetType: "User",
 *   targetId: user.id,
 *   metadata: { method: "magic_link" },
 * });
 * ```
 */
export async function recordAudit(input: AuditLogInput): Promise<void> {
  const client = input.tx ?? prisma;
  try {
    const id = await nextAuditLogId(client);
    await client.auditLog.create({
      data: {
        id,
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });
  } catch (e) {
    // 監査ログの失敗で主処理は止めない (best-effort)
    console.warn("[audit] failed to record:", e);
  }
}
