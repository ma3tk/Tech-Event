"use server";

/**
 * 通知 (Notification) 用 Server Actions。
 *
 * - `markRead`: 単一通知を既読化する。`Notification.recipientUserId` が
 *   現在ユーザーと一致する場合のみ更新する。
 * - `markAllRead`: 現在ユーザーが受信した未読通知をすべて既読化する。
 *
 * いずれも form 経由から呼び出される想定で、引数は `FormData`。
 * 通知センターのリストとヘッダーの未読バッジを更新したいので、
 * `/notifications` をはじめ複数の path を `revalidatePath` する。
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function formValue(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
}

const BigIntIdSchema = z
  .string()
  .regex(/^\d+$/, "id must be digits only")
  .transform((s) => BigInt(s));

const MarkReadSchema = z.object({
  id: BigIntIdSchema,
});

function loginRedirect(): never {
  redirect(`/login?next=${encodeURIComponent("/notifications")}`);
}

function revalidateNotificationViews(): void {
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout"); // header 未読数
}

/**
 * 単一通知を既読化する。本人宛のみ。
 * 既に既読でも no-op。存在しなければ no-op。
 */
export async function markRead(formData: FormData): Promise<void> {
  const parsed = MarkReadSchema.safeParse({
    id: formValue(formData, "id"),
  });
  if (!parsed.success) {
    throw new Error("invalid_input");
  }
  const { id } = parsed.data;

  const user = await getCurrentUser();
  if (!user) loginRedirect();

  const target = await prisma.notification.findUnique({ where: { id } });
  if (!target) {
    revalidateNotificationViews();
    return;
  }
  if (target.recipientUserId !== user.id) {
    throw new Error("forbidden");
  }
  if (target.readAt) {
    revalidateNotificationViews();
    return;
  }

  await prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  });

  revalidateNotificationViews();
}

/**
 * 現在ユーザー宛の未読通知をすべて既読にする。
 */
export async function markAllRead(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) loginRedirect();

  await prisma.notification.updateMany({
    where: { recipientUserId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidateNotificationViews();
}
