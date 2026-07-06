"use server";

/**
 * ユーザーフォロー用 Server Actions。
 *
 * - `followUser(followeeId)`: フォローする (ログイン必須 / 自分自身は不可)。
 *   `Follow` レコード作成 + `User.followerCount` / `User.followingCount` を
 *   同一トランザクションで増分する。既にフォロー済みなら no-op (冪等)。
 * - `unfollowUser(followeeId)`: フォロー解除。`Follow` 削除 + カウンタ減分を
 *   同一トランザクションで行う。未フォローなら no-op (冪等 / カウンタ不変)。
 * - `isFollowing(followerId, followeeId)`: フォロー状態の照会ヘルパー。
 * - `followUserAction` / `unfollowUserAction`: `<form action={...}>` から
 *   呼び出す FormData ラッパ (hidden input `followeeId` を読む)。
 *
 * id 採番は `nextId(tx, "follow")` (race は `withRetry` の P2002 リトライで吸収。
 * `@@unique([followerId, followeeId])` があるため二重 INSERT も DB 層で防がれる)。
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { ActionError } from "@/lib/action-error";
import { nextId, withRetry } from "@/lib/id-gen";
import { BigIntIdSchema } from "@/lib/schemas";
import { recordAudit } from "@/lib/audit";

import { getCurrentUser } from "./auth";

const FollowInputSchema = z.object({
  followeeId: BigIntIdSchema,
});

/** followUser / unfollowUser の戻り値 */
export type FollowResult = {
  ok: true;
  /** 実行後のフォロー状態 */
  following: boolean;
  /** 既にその状態で何もしなかったか (冪等 no-op) */
  noop: boolean;
};

/**
 * 対象ユーザー (followee) を取得して存在 & active を検証する。
 * 見つからない / 退会済みは `ActionError("not_found")`。
 */
async function findActiveFollowee(followeeId: bigint) {
  const followee = await prisma.user.findUnique({
    where: { id: followeeId },
    select: { id: true, nickname: true, status: true },
  });
  if (!followee || followee.status !== "active") {
    throw new ActionError("not_found", "対象のユーザーが見つかりません");
  }
  return followee;
}

/** フォロー系 Action 共通の入力検証 (数字文字列 or bigint → bigint)。 */
function parseFolloweeId(raw: bigint | string): bigint {
  const parsed = FollowInputSchema.safeParse({
    followeeId: typeof raw === "bigint" ? raw.toString() : raw,
  });
  if (!parsed.success) {
    throw new ActionError("invalid_input", "対象ユーザーの指定が不正です", {
      field: "followeeId",
    });
  }
  return parsed.data.followeeId;
}

/** プロフィール / ダッシュボードのフォロー表示を再検証する。 */
function revalidateFollowViews(nickname: string, viewerNickname: string): void {
  revalidatePath(`/user/${nickname}`);
  revalidatePath(`/user/${nickname}/followers`);
  revalidatePath(`/user/${viewerNickname}`);
  revalidatePath(`/user/${viewerNickname}/following`);
  revalidatePath("/dashboard");
}

/**
 * `followeeId` のユーザーをフォローする。
 *
 * - 認可: ログイン必須。未ログインは `/login?next=/user/<nickname>` へリダイレクト。
 * - 自分自身のフォローは `ActionError("invalid_input")`。
 * - 冪等: 既にフォロー済みなら何もしない (カウンタも増えない)。
 * - `Follow` 作成 + followee.followerCount / follower.followingCount の増分を
 *   同一 tx で行い、整合性を担保する。
 */
export async function followUser(
  followeeId: bigint | string,
): Promise<FollowResult> {
  const targetId = parseFolloweeId(followeeId);
  const followee = await findActiveFollowee(targetId);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/user/${followee.nickname}`)}`);
  }
  if (user.id === targetId) {
    throw new ActionError("invalid_input", "自分自身はフォローできません", {
      field: "followeeId",
    });
  }

  const created = await withRetry(() =>
    prisma.$transaction(async (tx) => {
      const existing = await tx.follow.findUnique({
        where: {
          followerId_followeeId: {
            followerId: user.id,
            followeeId: targetId,
          },
        },
        select: { id: true },
      });
      if (existing) return false; // 冪等: 既フォローは no-op

      await tx.follow.create({
        data: {
          id: await nextId(tx, "follow"),
          followerId: user.id,
          followeeId: targetId,
        },
      });
      await tx.user.update({
        where: { id: targetId },
        data: { followerCount: { increment: 1 } },
      });
      await tx.user.update({
        where: { id: user.id },
        data: { followingCount: { increment: 1 } },
      });
      return true;
    }),
  );

  if (created) {
    void recordAudit({
      actorUserId: user.id,
      action: "user.followed",
      targetType: "User",
      targetId: targetId,
    });
  }

  revalidateFollowViews(followee.nickname, user.nickname);
  return { ok: true, following: true, noop: !created };
}

/**
 * `followeeId` のユーザーのフォローを解除する。
 *
 * - 認可: ログイン必須。未ログインは `/login?next=/user/<nickname>` へリダイレクト。
 * - 冪等: 未フォローなら何もしない (カウンタも減らない)。
 * - `Follow` 削除 + カウンタ減分を同一 tx で行う。
 */
export async function unfollowUser(
  followeeId: bigint | string,
): Promise<FollowResult> {
  const targetId = parseFolloweeId(followeeId);
  const followee = await findActiveFollowee(targetId);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/user/${followee.nickname}`)}`);
  }

  const deleted = await withRetry(() =>
    prisma.$transaction(async (tx) => {
      const existing = await tx.follow.findUnique({
        where: {
          followerId_followeeId: {
            followerId: user.id,
            followeeId: targetId,
          },
        },
        select: { id: true },
      });
      if (!existing) return false; // 冪等: 未フォローは no-op

      await tx.follow.delete({ where: { id: existing.id } });
      // カウンタは 0 未満にならないよう保険をかけて減分する
      await tx.user.updateMany({
        where: { id: targetId, followerCount: { gt: 0 } },
        data: { followerCount: { decrement: 1 } },
      });
      await tx.user.updateMany({
        where: { id: user.id, followingCount: { gt: 0 } },
        data: { followingCount: { decrement: 1 } },
      });
      return true;
    }),
  );

  if (deleted) {
    void recordAudit({
      actorUserId: user.id,
      action: "user.unfollowed",
      targetType: "User",
      targetId: targetId,
    });
  }

  revalidateFollowViews(followee.nickname, user.nickname);
  return { ok: true, following: false, noop: !deleted };
}

/**
 * `followerId` が `followeeId` をフォローしているか。
 *
 * Server Component からの表示分岐用の読み取りヘルパー。
 */
export async function isFollowing(
  followerId: bigint | string,
  followeeId: bigint | string,
): Promise<boolean> {
  const follower =
    typeof followerId === "bigint" ? followerId : BigInt(followerId);
  const followee =
    typeof followeeId === "bigint" ? followeeId : BigInt(followeeId);
  const row = await prisma.follow.findUnique({
    where: {
      followerId_followeeId: { followerId: follower, followeeId: followee },
    },
    select: { id: true },
  });
  return row !== null;
}

/** `<form>` から呼ぶフォロー Action (hidden input `followeeId` 必須)。 */
export async function followUserAction(formData: FormData): Promise<void> {
  const raw = formData.get("followeeId");
  if (typeof raw !== "string") {
    throw new ActionError("invalid_input", "対象ユーザーの指定が不正です");
  }
  await followUser(raw);
}

/** `<form>` から呼ぶフォロー解除 Action (hidden input `followeeId` 必須)。 */
export async function unfollowUserAction(formData: FormData): Promise<void> {
  const raw = formData.get("followeeId");
  if (typeof raw !== "string") {
    throw new ActionError("invalid_input", "対象ユーザーの指定が不正です");
  }
  await unfollowUser(raw);
}
