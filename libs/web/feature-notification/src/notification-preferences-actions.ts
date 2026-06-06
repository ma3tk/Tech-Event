"use server";

/**
 * 通知設定 (`NotificationPreference`) 用 Server Actions。
 *
 * `updateNotificationPreference(formData)`:
 *  - 認証必須。未ログインなら `/login` にリダイレクト。
 *  - form の `kind` (例: `event_published`) と `channel` (`email`|`in_app`|`push`)、
 *    `enabled` ("1"/"0") を upsert する。
 *  - 既存レコードがあれば enabled を書き換え、無ければ作成 (BigInt 採番は seed と同じ _max+1)。
 *
 * `bulkUpdateNotificationPreferences(formData)`:
 *  - 設定ページからの一括 PUT (全 kind × channel)。formData 内のキーを
 *    `pref[<kind>][<channel>]=1` 形式で受け取り、まとめて upsert する。
 *
 * 通知作成側 (event-actions.ts, notification-actions.ts) は `isPreferenceEnabled`
 * 経由でレコードを参照し、enabled=false の場合は Notification 作成をスキップする。
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  NOTIFICATION_KIND_KEYS,
  NOTIFICATION_CHANNEL_KEYS,
} from "./lib/notification";
import { nextId } from "@/lib/id-gen";
import { ActionError } from "@/lib/action-error";
import { getStringRaw as formValue } from "@/lib/form-data";

const ChannelEnum = z.enum(["email", "in_app", "push"]);
const KindSchema = z.string().min(1).max(64);

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function nextPreferenceId(tx: Tx): Promise<bigint> {
  return nextId(tx, "notificationPreference");
}

function loginRedirect(): never {
  redirect(`/login?next=${encodeURIComponent("/settings/notifications")}`);
}

/* ============================================================
 * updateNotificationPreference - 単一 kind/channel
 * ============================================================ */

export async function updateNotificationPreference(
  formData: FormData,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) loginRedirect();

  const kindRaw = formValue(formData, "kind");
  const channelRaw = formValue(formData, "channel");
  const enabledRaw = formValue(formData, "enabled");

  const parsedKind = KindSchema.safeParse(kindRaw);
  const parsedChannel = ChannelEnum.safeParse(channelRaw);
  if (!parsedKind.success || !parsedChannel.success) {
    throw new ActionError("invalid_input", "入力内容が不正です");
  }
  const kind = parsedKind.data;
  const channel = parsedChannel.data;
  const enabled = enabledRaw === "1" || enabledRaw === "true";

  await prisma.$transaction(async (tx) => {
    const existing = await tx.notificationPreference.findUnique({
      where: {
        userId_kind_channel: { userId: user.id, kind, channel },
      },
    });
    if (existing) {
      await tx.notificationPreference.update({
        where: { id: existing.id },
        data: { enabled, updatedAt: new Date() },
      });
    } else {
      await tx.notificationPreference.create({
        data: {
          id: await nextPreferenceId(tx),
          userId: user.id,
          kind,
          channel,
          enabled,
        },
      });
    }
  });

  revalidatePath("/settings/notifications");
}

/* ============================================================
 * bulkUpdateNotificationPreferences - 一括保存
 *
 * formData は `pref[<kind>][<channel>]=1` (checked) のみが送られてくる。
 * 該当しない (kind, channel) は disable として扱う。
 * ============================================================ */

export async function bulkUpdateNotificationPreferences(
  formData: FormData,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) loginRedirect();

  // 既知の (kind, channel) 全組み合わせを enabled/disabled で確定する
  const submitted: Record<string, Set<string>> = {};
  for (const [key] of formData.entries()) {
    const m = key.match(/^pref\[([^\]]+)\]\[([^\]]+)\]$/);
    if (!m) continue;
    const k = m[1]!;
    const c = m[2]!;
    if (!ChannelEnum.safeParse(c).success) continue;
    submitted[k] ??= new Set<string>();
    submitted[k]!.add(c);
  }

  await prisma.$transaction(async (tx) => {
    for (const kind of NOTIFICATION_KIND_KEYS) {
      for (const channel of NOTIFICATION_CHANNEL_KEYS) {
        const enabled = submitted[kind]?.has(channel) ?? false;
        const existing = await tx.notificationPreference.findUnique({
          where: {
            userId_kind_channel: { userId: user.id, kind, channel },
          },
        });
        if (existing) {
          if (existing.enabled !== enabled) {
            await tx.notificationPreference.update({
              where: { id: existing.id },
              data: { enabled, updatedAt: new Date() },
            });
          }
        } else {
          // 新規: 既定 (=enabled true) と同値なら作成スキップして冗長レコードを減らす
          if (!enabled) {
            await tx.notificationPreference.create({
              data: {
                id: await nextPreferenceId(tx),
                userId: user.id,
                kind,
                channel,
                enabled,
              },
            });
          }
        }
      }
    }
  });

  revalidatePath("/settings/notifications");
  redirect("/settings/notifications?saved=1");
}
