/**
 * Group membership helpers (Server Action 群から呼ばれる内部ユーティリティ)。
 *
 * `Group.memberCount` は denormalized なカウンタなので、GroupMember の
 * 追加/論理削除を行う際は **必ずこのヘルパーを経由**して increment/decrement
 * を併走させる。直接 `tx.groupMember.create` 等を書くと カウンタが乖離する。
 *
 * `/lib/` 配下に置くのは Server Action ("use server") ファイルでは export が
 * すべて Server Action として外部公開されるのを避けるため。
 */
import { prisma } from "@/lib/prisma";
import { nextId } from "@/lib/id-gen";

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** GroupMember の id 採番 (`@/lib/id-gen.nextId` に委譲) */
async function nextGroupMemberId(tx: TxClient): Promise<bigint> {
  return nextId(tx, "groupMember");
}

/**
 * GroupMember を追加する (or 退会済みなら復帰する) ヘルパー。
 *
 * - すでに active (leftAt = NULL) の member が存在する場合は no-op
 * - leftAt が立っている既存レコードがある場合は leftAt を NULL に戻して復帰し、
 *   `memberCount` を increment する
 * - レコードが無ければ新規 create + `memberCount` increment
 *
 * 並列呼出時の UNIQUE 制約 (`@@unique([groupId, userId])`) は catch せずに上位へ伝播。
 */
export async function addGroupMember(
  tx: TxClient,
  params: {
    groupId: bigint;
    userId: bigint;
    joinedVia?: "manual" | "event_join" | "admin_add";
  },
): Promise<void> {
  const existing = await tx.groupMember.findUnique({
    where: {
      groupId_userId: { groupId: params.groupId, userId: params.userId },
    },
  });
  if (existing && existing.leftAt === null) {
    // active のまま → no-op
    return;
  }
  if (existing && existing.leftAt !== null) {
    // 退会済み復帰
    await tx.groupMember.update({
      where: {
        groupId_userId: { groupId: params.groupId, userId: params.userId },
      },
      data: {
        leftAt: null,
        joinedAt: new Date(),
        joinedVia: params.joinedVia ?? existing.joinedVia,
      },
    });
    await tx.group.update({
      where: { id: params.groupId },
      data: { memberCount: { increment: 1 } },
    });
    return;
  }
  await tx.groupMember.create({
    data: {
      id: await nextGroupMemberId(tx),
      groupId: params.groupId,
      userId: params.userId,
      joinedVia: params.joinedVia ?? "manual",
    },
  });
  await tx.group.update({
    where: { id: params.groupId },
    data: { memberCount: { increment: 1 } },
  });
}

/**
 * GroupMember を論理削除 (leftAt セット) する。
 * すでに leftAt が立っている、もしくはレコードが存在しない場合は no-op。
 */
export async function removeGroupMember(
  tx: TxClient,
  params: { groupId: bigint; userId: bigint },
): Promise<void> {
  const existing = await tx.groupMember.findUnique({
    where: {
      groupId_userId: { groupId: params.groupId, userId: params.userId },
    },
  });
  if (!existing || existing.leftAt !== null) return;
  await tx.groupMember.update({
    where: {
      groupId_userId: { groupId: params.groupId, userId: params.userId },
    },
    data: { leftAt: new Date() },
  });
  await tx.group.update({
    where: { id: params.groupId },
    data: { memberCount: { decrement: 1 } },
  });
}
