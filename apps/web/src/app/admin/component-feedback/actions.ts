"use server";

/**
 * コンポーネントフィードバックのトリアージ用 Server Action。
 *
 * 認可: admin / organizer のみ (管理画面と同じ)。状態を open → triaged →
 * resolved / wontfix と更新して改善ループを回す。
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isFeedbackAdmin } from "./_auth";

const VALID_STATUS = ["open", "triaged", "resolved", "wontfix"] as const;

const Schema = z.object({
  id: z.string().regex(/^\d+$/),
  status: z.enum(VALID_STATUS),
});

export async function updateFeedbackStatus(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!isFeedbackAdmin(user)) {
    throw new Error("forbidden");
  }

  const parsed = Schema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    throw new Error("invalid input");
  }

  await prisma.componentFeedback.update({
    where: { id: BigInt(parsed.data.id) },
    data: { status: parsed.data.status },
  });

  revalidatePath("/admin/component-feedback");
}
