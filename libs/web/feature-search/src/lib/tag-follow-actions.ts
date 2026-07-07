"use server";

/**
 * タグフォロー用 Server Actions。
 *
 * - `followTag(formData)`   : タグをフォローする (冪等: 既フォローなら no-op)
 * - `unfollowTag(formData)` : フォローを解除する (冪等: 未フォローなら no-op)
 *
 * どちらも HTML form (`<form action={followTag}>` + hidden input `tagId`) からの
 * 呼び出しを想定し、`FormData` を受け取る。
 *
 * - 認証必須。未ログインは `/login?next=/tag/{slug}` にリダイレクト。
 * - 入力は Zod (`BigIntIdSchema`) で検証。
 * - id 採番は `nextId(tx, "tagFollow")` + `withRetry` (並列 follow の
 *   UNIQUE 衝突 P2002 を吸収)。
 * - 読み取りヘルパー (`isFollowingTag` / `listFollowedTags` / `relatedTags` /
 *   `suggestTags`) は `./tags.ts` を参照。
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { nextId, withRetry } from "@/lib/id-gen";
import { ActionError } from "@/lib/action-error";
import { getStringRaw as formValue } from "@/lib/form-data";
import { BigIntIdSchema } from "@/lib/schemas";

const TagOnlySchema = z.object({
  tagId: BigIntIdSchema,
});

/** タグの存在確認 (slug はリダイレクト先 / revalidate に使う) */
async function findTagOrThrow(
  tagId: bigint,
): Promise<{ id: bigint; slug: string }> {
  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
    select: { id: true, slug: true },
  });
  if (!tag) {
    throw new ActionError("not_found", "タグが見つかりません");
  }
  return tag;
}

/** タグフォロー関連ページの再検証 */
function revalidateTagPages(slug: string): void {
  revalidatePath(`/tag/${slug}`);
  revalidatePath("/following/tags");
  revalidatePath("/explore");
}

/**
 * タグをフォローする (冪等)。
 *
 * form fields:
 * - `tagId` (必須): フォロー対象タグの id
 */
export async function followTag(formData: FormData): Promise<void> {
  const parsed = TagOnlySchema.safeParse({
    tagId: formValue(formData, "tagId"),
  });
  if (!parsed.success) {
    throw new ActionError("invalid_input", "入力内容が不正です");
  }
  const tag = await findTagOrThrow(parsed.data.tagId);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/tag/${tag.slug}`)}`);
  }

  await withRetry(() =>
    prisma.$transaction(async (tx) => {
      const existing = await tx.tagFollow.findUnique({
        where: { userId_tagId: { userId: user.id, tagId: tag.id } },
        select: { id: true },
      });
      if (existing) return; // 既フォロー: no-op (idempotent)
      await tx.tagFollow.create({
        data: {
          id: await nextId(tx, "tagFollow"),
          userId: user.id,
          tagId: tag.id,
        },
      });
    }),
  );

  void recordAudit({
    actorUserId: user.id,
    action: "tag.follow",
    targetType: "Tag",
    targetId: tag.id,
  });

  revalidateTagPages(tag.slug);
}

/**
 * タグのフォローを解除する (冪等)。
 *
 * form fields:
 * - `tagId` (必須): 解除対象タグの id
 */
export async function unfollowTag(formData: FormData): Promise<void> {
  const parsed = TagOnlySchema.safeParse({
    tagId: formValue(formData, "tagId"),
  });
  if (!parsed.success) {
    throw new ActionError("invalid_input", "入力内容が不正です");
  }
  const tag = await findTagOrThrow(parsed.data.tagId);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/tag/${tag.slug}`)}`);
  }

  await prisma.tagFollow
    .delete({
      where: { userId_tagId: { userId: user.id, tagId: tag.id } },
    })
    .catch(() => {
      // 未フォロー / 既に解除済みでも黙る (idempotent)
    });

  void recordAudit({
    actorUserId: user.id,
    action: "tag.unfollow",
    targetType: "Tag",
    targetId: tag.id,
  });

  revalidateTagPages(tag.slug);
}
