"use server";

/**
 * 発表資料 (PresentationMaterial) 用 Server Actions。
 *
 * data-model review Critical #3 で、`Group.presentationCount` がアプリから一切
 * 更新されない (= 永久に 0) 問題を指摘されたため、主催者向けに
 * 簡易 UI と Server Action を提供する。
 *
 * - addPresentation    : event edit/admin ページから資料を 1 件追加
 * - removePresentation : 主催者が資料を削除
 *
 * 認可は `(event.ownerId === self) || GroupAdmin owner/admin` を要求。
 * BigInt @id は既存パターンに合わせ `_max + 1` で採番。
 * 追加/削除時に `Group.presentationCount` を increment/decrement する。
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { nextId } from "@/lib/id-gen";

const BigIntIdString = z.string().regex(/^\d+$/);

const UrlSchema = z
  .string()
  .min(1, "URL は必須")
  .max(2000)
  .refine((v) => /^https?:\/\//.test(v), "URL は http(s):// で始める");

const AddPresentationSchema = z.object({
  eventId: BigIntIdString,
  title: z.string().min(1, "タイトルは必須").max(200),
  url: UrlSchema,
  presenterDisplayName: z.string().max(200).optional().default(""),
  thumbnailUrl: z
    .string()
    .max(2000)
    .refine((v) => v === "" || /^https?:\/\//.test(v), "URL は http(s):// で始める")
    .optional()
    .default(""),
});

const RemovePresentationSchema = z.object({
  eventId: BigIntIdString,
  presentationId: BigIntIdString,
});

function formValue(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function nextPresentationId(tx: Tx): Promise<bigint> {
  return nextId(tx, "presentationMaterial");
}

async function canManageEvent(
  eventOwnerId: bigint,
  eventGroupId: bigint,
  userId: bigint,
): Promise<boolean> {
  if (eventOwnerId === userId) return true;
  const admin = await prisma.groupAdmin.findUnique({
    where: { groupId_userId: { groupId: eventGroupId, userId } },
  });
  return !!admin && (admin.role === "owner" || admin.role === "admin");
}

/** 発表資料を 1 件追加。`Group.presentationCount` も increment する。 */
export async function addPresentation(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/dashboard")}`);
  }

  const parsed = AddPresentationSchema.safeParse({
    eventId: formValue(formData, "eventId"),
    title: formValue(formData, "title"),
    url: formValue(formData, "url"),
    presenterDisplayName: formValue(formData, "presenterDisplayName"),
    thumbnailUrl: formValue(formData, "thumbnailUrl"),
  });
  if (!parsed.success) {
    throw new Error(
      `invalid_input: ${parsed.error.issues[0]?.message ?? "unknown"}`,
    );
  }
  const data = parsed.data;
  const eventId = BigInt(data.eventId);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, ownerId: true, groupId: true },
  });
  if (!event) throw new Error("event_not_found");
  if (!(await canManageEvent(event.ownerId, event.groupId, user.id))) {
    throw new Error("forbidden");
  }

  await prisma.$transaction(async (tx) => {
    const id = await nextPresentationId(tx);
    // displayOrder は既存最大 + 1
    const existing = await tx.presentationMaterial.aggregate({
      where: { eventId },
      _max: { displayOrder: true },
    });
    const displayOrder = (existing._max.displayOrder ?? 0) + 1;

    await tx.presentationMaterial.create({
      data: {
        id,
        eventId,
        presenterUserId: user.id,
        presenterDisplayName: data.presenterDisplayName || user.displayName,
        title: data.title,
        url: data.url,
        thumbnailUrl: data.thumbnailUrl || null,
        displayOrder,
      },
    });
    // Group.presentationCount を増やす (data-model review Critical #3)
    await tx.group.update({
      where: { id: event.groupId },
      data: { presentationCount: { increment: 1 } },
    });
  });

  revalidatePath(`/event/${eventId.toString()}`);
  revalidatePath(`/event/${eventId.toString()}/edit`);
  revalidatePath(`/event/${eventId.toString()}/admin`);
  redirect(`/event/${eventId.toString()}/edit#presentations`);
}

/** 発表資料を削除。`Group.presentationCount` も decrement する。 */
export async function removePresentation(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/dashboard")}`);
  }

  const parsed = RemovePresentationSchema.safeParse({
    eventId: formValue(formData, "eventId"),
    presentationId: formValue(formData, "presentationId"),
  });
  if (!parsed.success) throw new Error("invalid_input");

  const eventId = BigInt(parsed.data.eventId);
  const presentationId = BigInt(parsed.data.presentationId);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, ownerId: true, groupId: true },
  });
  if (!event) throw new Error("event_not_found");
  if (!(await canManageEvent(event.ownerId, event.groupId, user.id))) {
    throw new Error("forbidden");
  }

  const target = await prisma.presentationMaterial.findUnique({
    where: { id: presentationId },
    select: { id: true, eventId: true },
  });
  if (!target || target.eventId !== eventId) {
    throw new Error("presentation_not_found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.presentationMaterial.delete({ where: { id: presentationId } });
    await tx.group.update({
      where: { id: event.groupId },
      data: { presentationCount: { decrement: 1 } },
    });
  });

  revalidatePath(`/event/${eventId.toString()}`);
  revalidatePath(`/event/${eventId.toString()}/edit`);
  revalidatePath(`/event/${eventId.toString()}/admin`);
  redirect(`/event/${eventId.toString()}/edit#presentations`);
}
