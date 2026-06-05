"use server";

/**
 * 抽選 (lottery) 関連の Server Actions。
 *
 * 抽選方式の参加枠 (`EventRole.recruitmentMethod === 'lottery'`) では、
 * 申込時 (`joinEvent`) に `Participant.status = 'pending'` で保存しておき、
 * 主催者が `runLottery` を実行したタイミングで:
 *   - `pending` の参加者を Fisher-Yates でシャッフル
 *   - capacity 分を `accepted`、残りを `waiting` (`waitingPosition` 採番) に更新
 *   - `Event.acceptedCount` / `waitingCount` を再計算
 *   - 各参加者に `Notification(kind='lottery_result')` を in_app チャネルで作成
 *
 * `runLottery` は主催者 (event.ownerId) または group の owner/admin のみが
 * 実行できる。
 *
 * 内部関数 `runLotteryForRole` はトランザクション (`tx`) を引数に取り、
 * 1 つの参加枠に対する抽選処理を行う純粋なドメインロジック。これは
 * `runLottery` (form action) と `route.ts` のクーロンエンドポイントの両方から
 * 呼び出されることを意図している。
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notifyLotteryResult } from "@/lib/slack";
import { nextId } from "@/lib/id-gen";
import { ActionError } from "@/lib/action-error";

/* ============================================================
 * バリデーション
 * ============================================================ */

function formValue(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
}

const BigIntIdSchema = z
  .string()
  .regex(/^\d+$/, "id must be digits only")
  .transform((s) => BigInt(s));

const RunLotterySchema = z.object({
  eventId: BigIntIdSchema,
  // eventRoleId が指定されていれば該当枠のみ、無ければ event の全 lottery 枠を抽選
  eventRoleId: z
    .string()
    .regex(/^\d+$/)
    .transform((s) => BigInt(s))
    .optional(),
});

/* ============================================================
 * 共通ヘルパー
 * ============================================================ */

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function nextNotificationId(tx: Tx): Promise<bigint> {
  return nextId(tx, "notification");
}

/** owner / admin の判定 */
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

/** Fisher-Yates シャッフル (in-place) */
function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

/* ============================================================
 * 1 枠分の抽選ロジック (公開関数)
 * ============================================================ */

/**
 * `eventRoleId` の枠について、`pending` 状態の参加者を抽選して
 * `accepted` / `waiting` に振り分ける。返り値は当選数 / 落選数。
 *
 * pending が 1 件もない場合は no-op (0, 0) を返す。
 *
 * 抽選後、各参加者に `Notification(kind='lottery_result')` を 1 件ずつ作成する。
 *
 * NOTE: この関数は与えられた `tx` 内ですべての更新を行うので、呼び出し側が
 * 親トランザクションを管理することを想定する。
 */
export async function runLotteryForRole(
  tx: Tx,
  eventId: bigint,
  eventRoleId: bigint,
): Promise<{ accepted: number; waiting: number }> {
  const role = await tx.eventRole.findUnique({ where: { id: eventRoleId } });
  if (!role || role.eventId !== eventId) {
    throw new ActionError("not_found", "参加枠が見つかりません");
  }

  // pending の参加者を全件取得
  const pendings = await tx.participant.findMany({
    where: {
      eventId,
      eventRoleId,
      status: "pending",
    },
    orderBy: { appliedAt: "asc" },
  });

  if (pendings.length === 0) {
    return { accepted: 0, waiting: 0 };
  }

  // 既に accepted な人数を加味して残席を計算する
  const alreadyAccepted = await tx.participant.count({
    where: { eventId, eventRoleId, status: "accepted" },
  });
  const alreadyWaiting = await tx.participant.count({
    where: { eventId, eventRoleId, status: "waiting" },
  });

  const capacity = role.capacity ?? pendings.length; // 定員なしなら全員当選
  const remainingSlots = Math.max(0, capacity - alreadyAccepted);

  // Fisher-Yates でシャッフル
  const shuffled = shuffleInPlace([...pendings]);

  const acceptedSlice = shuffled.slice(0, remainingSlots);
  const waitingSlice = shuffled.slice(remainingSlots);

  const now = new Date();

  // accepted に更新
  for (const p of acceptedSlice) {
    await tx.participant.update({
      where: { id: p.id },
      data: {
        status: "accepted",
        acceptedAt: now,
        waitingPosition: null,
      },
    });
  }

  // waiting に更新 (waitingPosition は既存 waiting の続きから採番)
  let pos = alreadyWaiting;
  for (const p of waitingSlice) {
    pos += 1;
    await tx.participant.update({
      where: { id: p.id },
      data: {
        status: "waiting",
        waitingPosition: pos,
        acceptedAt: null,
      },
    });
  }

  // 通知 (in_app) を作成
  for (const p of acceptedSlice) {
    await tx.notification.create({
      data: {
        id: await nextNotificationId(tx),
        recipientUserId: p.userId,
        kind: "lottery_result",
        eventId,
        payload: JSON.stringify({
          result: "accepted",
          eventRoleId: eventRoleId.toString(),
        }),
        channel: "in_app",
      },
    });
  }
  for (const p of waitingSlice) {
    await tx.notification.create({
      data: {
        id: await nextNotificationId(tx),
        recipientUserId: p.userId,
        kind: "lottery_result",
        eventId,
        payload: JSON.stringify({
          result: "waiting",
          eventRoleId: eventRoleId.toString(),
        }),
        channel: "in_app",
      },
    });
  }

  return { accepted: acceptedSlice.length, waiting: waitingSlice.length };
}

/**
 * 指定 event の全 lottery 枠について順次抽選を実行する。
 * 戻り値は枠ごとの結果配列。
 *
 * トランザクション境界は呼び出し側で張る想定。
 */
export async function runLotteryForEvent(
  tx: Tx,
  eventId: bigint,
): Promise<{ eventRoleId: bigint; accepted: number; waiting: number }[]> {
  const lotteryRoles = await tx.eventRole.findMany({
    where: { eventId, recruitmentMethod: "lottery" },
    orderBy: { displayOrder: "asc" },
  });
  const out: { eventRoleId: bigint; accepted: number; waiting: number }[] = [];
  for (const r of lotteryRoles) {
    const res = await runLotteryForRole(tx, eventId, r.id);
    out.push({ eventRoleId: r.id, ...res });
  }

  // Event.acceptedCount / waitingCount を再計算
  const accepted = await tx.participant.count({
    where: { eventId, status: "accepted" },
  });
  const waiting = await tx.participant.count({
    where: { eventId, status: "waiting" },
  });
  await tx.event.update({
    where: { id: eventId },
    data: { acceptedCount: accepted, waitingCount: waiting },
  });

  return out;
}

/* ============================================================
 * runLottery (Server Action)
 * ============================================================ */

export async function runLottery(formData: FormData): Promise<void> {
  const parsed = RunLotterySchema.safeParse({
    eventId: formValue(formData, "eventId"),
    eventRoleId: formValue(formData, "eventRoleId") || undefined,
  });
  if (!parsed.success) {
    throw new ActionError("invalid_input", "入力内容が不正です");
  }
  const { eventId, eventRoleId } = parsed.data;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/event/${eventId.toString()}/admin`)}`);
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new ActionError("not_found", "イベントが見つかりません");

  if (!(await canManageEvent(event.ownerId, event.groupId, user.id))) {
    throw new ActionError("forbidden", "このイベントを操作する権限がありません");
  }

  await prisma.$transaction(async (tx) => {
    if (eventRoleId != null) {
      await runLotteryForRole(tx, eventId, eventRoleId);
      // 単一枠の場合も Event.acceptedCount / waitingCount を再集計
      const accepted = await tx.participant.count({
        where: { eventId, status: "accepted" },
      });
      const waiting = await tx.participant.count({
        where: { eventId, status: "waiting" },
      });
      await tx.event.update({
        where: { id: eventId },
        data: { acceptedCount: accepted, waitingCount: waiting },
      });
    } else {
      await runLotteryForEvent(tx, eventId);
    }
  });

  // Slack 通知 (group.slackWebhookUrl が設定されていれば送信)
  try {
    const eventWithGroup = await prisma.event.findUnique({
      where: { id: eventId },
      include: { group: { select: { slackWebhookUrl: true } } },
    });
    if (eventWithGroup?.group?.slackWebhookUrl) {
      await notifyLotteryResult({
        webhookUrl: eventWithGroup.group.slackWebhookUrl,
        eventId: eventId.toString(),
        eventTitle: eventWithGroup.title,
        acceptedCount: eventWithGroup.acceptedCount,
        waitingCount: eventWithGroup.waitingCount,
      });
    }
  } catch {
    /* 通知失敗は無視 */
  }

  revalidatePath(`/event/${eventId.toString()}`);
  revalidatePath(`/event/${eventId.toString()}/admin`);
  redirect(`/event/${eventId.toString()}/admin`);
}
