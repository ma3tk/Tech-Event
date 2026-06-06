"use server";

/**
 * コメント投稿 / 削除用 Server Actions。
 *
 * - `postComment`: 認証必須。`Comment` を新規作成する。返信時は parentCommentId を
 *   受け取るが、返信のさらに返信 (孫レス) は許容しない (UI 側で 1 階層のみ表示)。
 * - `deleteComment`: 認証必須。本人 (`userId` 一致) のみ削除可能。物理削除ではなく
 *   `deletedAt` をセットする論理削除。
 *
 * Notification も同時に作成し、参加者向けの「コメント投稿」サイト内通知を残す。
 * (今回は recipient = イベント主催者 + 親コメント投稿者)
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isNotificationKindEnabled } from "@/lib/notification";
import { notifyCommentPosted } from "@/lib/slack";
import { nextId } from "@/lib/id-gen";
import { ActionError } from "@/lib/action-error";
import { recordAudit } from "@/lib/audit";
import { assertRateLimit, RATE_LIMITS, RateLimitError } from "@/lib/rate-limit";
import { getStringRaw as formValue } from "@/lib/form-data";
import { BigIntIdSchema } from "@/lib/schemas";

/* ============================================================
 * バリデーション
 * ============================================================ */

const PostCommentSchema = z.object({
  eventId: BigIntIdSchema,
  body: z
    .string()
    .trim()
    .min(1, "コメント本文を入力してください")
    .max(2000, "コメントは 2000 文字以内"),
  parentCommentId: z
    .string()
    .optional()
    .transform((s) => (s && /^\d+$/.test(s) ? BigInt(s) : null)),
});

const DeleteCommentSchema = z.object({
  commentId: BigIntIdSchema,
  eventId: BigIntIdSchema,
});

/* ============================================================
 * ヘルパー
 * ============================================================ */

function loginRedirect(eventId: string): never {
  redirect(`/login?next=${encodeURIComponent(`/event/${eventId}`)}`);
}

function revalidateEvent(eventId: bigint): void {
  revalidatePath(`/event/${eventId.toString()}`);
}

/** Prisma 7 + SQLite では autoincrement が機能しないため id を明示採番する */
async function nextCommentId(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
): Promise<bigint> {
  return nextId(tx, "comment");
}

async function nextNotificationId(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
): Promise<bigint> {
  return nextId(tx, "notification");
}

/* ============================================================
 * postComment
 * ============================================================ */

export async function postComment(formData: FormData): Promise<void> {
  const parsed = PostCommentSchema.safeParse({
    eventId: formValue(formData, "eventId"),
    body: formValue(formData, "body"),
    parentCommentId: formValue(formData, "parentCommentId") || undefined,
  });
  if (!parsed.success) {
    throw new ActionError("invalid_input", "入力内容が不正です");
  }
  const { eventId, body, parentCommentId } = parsed.data;

  const user = await getCurrentUser();
  if (!user) {
    loginRedirect(eventId.toString());
  }

  // ---- レート制限 (user 単位 / 10 回/分) ----
  try {
    assertRateLimit(`user:${user.id}:postComment`, RATE_LIMITS.comment);
  } catch (e) {
    if (e instanceof RateLimitError) {
      throw new ActionError("rate_limited", e.message);
    }
    throw e;
  }

  await prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event) throw new ActionError("not_found", "イベントが見つかりません");

    // 親コメントが指定されたら、同イベントに属するか / さらに親があるか確認
    let normalizedParent: bigint | null = null;
    if (parentCommentId) {
      const parent = await tx.comment.findUnique({
        where: { id: parentCommentId },
      });
      if (parent && parent.eventId === eventId) {
        // 孫レス禁止: 親に parentCommentId があれば自分はその親 (ルート) にぶら下げる
        normalizedParent = parent.parentCommentId ?? parent.id;
      }
    }

    await tx.comment.create({
      data: {
        id: await nextCommentId(tx),
        eventId,
        userId: user.id,
        parentCommentId: normalizedParent,
        body,
      },
    });

    // サイト内通知: 主催者宛 (自分が主催者なら省略)
    if (event.ownerId !== user.id) {
      // 通知設定でオプトアウト済みなら skip (kind: new_comment, channel: in_app)
      if (
        await isNotificationKindEnabled(
          tx,
          event.ownerId,
          "new_comment",
          "in_app",
        )
      ) {
        await tx.notification.create({
          data: {
            id: await nextNotificationId(tx),
            recipientUserId: event.ownerId,
            kind: "comment_posted",
            eventId,
            payload: JSON.stringify({
              commenterUserId: user.id.toString(),
              commenterDisplayName: user.displayName,
              excerpt: body.slice(0, 80),
            }),
            channel: "in_app",
          },
        });
      }
    }

    // 返信の場合は親投稿者にも通知 (自分宛は除く)
    if (normalizedParent) {
      const parent = await tx.comment.findUnique({
        where: { id: normalizedParent },
      });
      if (
        parent &&
        parent.userId !== user.id &&
        parent.userId !== event.ownerId
      ) {
        if (
          await isNotificationKindEnabled(
            tx,
            parent.userId,
            "comment_reply",
            "in_app",
          )
        ) {
          await tx.notification.create({
            data: {
              id: await nextNotificationId(tx),
              recipientUserId: parent.userId,
              kind: "comment_replied",
              eventId,
              payload: JSON.stringify({
                commenterUserId: user.id.toString(),
                commenterDisplayName: user.displayName,
                excerpt: body.slice(0, 80),
              }),
              channel: "in_app",
            },
          });
        }
      }
    }
  });

  // Slack 通知 (group.slackWebhookUrl が設定されていれば送信)
  // - トランザクション外で呼び、失敗しても DB はロールバックしない。
  try {
    const eventWithGroup = await prisma.event.findUnique({
      where: { id: eventId },
      include: { group: { select: { slackWebhookUrl: true } } },
    });
    if (eventWithGroup?.group?.slackWebhookUrl) {
      await notifyCommentPosted({
        webhookUrl: eventWithGroup.group.slackWebhookUrl,
        eventId: eventId.toString(),
        eventTitle: eventWithGroup.title,
        authorDisplayName: user.displayName,
        bodyExcerpt: body,
      });
    }
  } catch {
    /* 通知失敗は無視 (主処理は成功扱い) */
  }

  // 監査ログ (fire-and-forget)
  void recordAudit({
    actorUserId: user.id,
    action: "comment.post",
    targetType: "Event",
    targetId: eventId,
    metadata: { length: body.length },
  });

  revalidateEvent(eventId);
}

/* ============================================================
 * deleteComment
 * ============================================================ */

export async function deleteComment(formData: FormData): Promise<void> {
  const parsed = DeleteCommentSchema.safeParse({
    commentId: formValue(formData, "commentId"),
    eventId: formValue(formData, "eventId"),
  });
  if (!parsed.success) {
    throw new ActionError("invalid_input", "入力内容が不正です");
  }
  const { commentId, eventId } = parsed.data;

  const user = await getCurrentUser();
  if (!user) {
    loginRedirect(eventId.toString());
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });
  if (!comment) return;
  if (comment.userId !== user.id) {
    throw new ActionError("forbidden", "このコメントを削除する権限がありません");
  }
  if (comment.deletedAt) {
    // 既に削除済みなら no-op
    revalidateEvent(eventId);
    return;
  }

  await prisma.comment.update({
    where: { id: commentId },
    data: { deletedAt: new Date() },
  });

  // 監査ログ
  void recordAudit({
    actorUserId: user.id,
    action: "comment.delete",
    targetType: "Comment",
    targetId: commentId,
    metadata: { eventId: eventId.toString() },
  });

  revalidateEvent(eventId);
}
