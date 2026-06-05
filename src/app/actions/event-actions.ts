"use server";

/**
 * イベント参加 / キャンセル / ブックマーク用 Server Actions。
 *
 * すべての Action は HTML form からの呼び出しを想定し、引数は `FormData` を
 * 受け取る。Zod で必須項目をバリデーションしたうえで Prisma のトランザクション
 * を走らせる。
 *
 * - 認証必須。未ログインなら `/login?next=/event/<id>` にリダイレクトする。
 * - `joinEvent`: 参加申込。EventRole.capacity を超えるなら status=waiting。
 *   既参加なら no-op (idempotent)。
 * - `cancelParticipation`: 自分の参加レコードを cancelled に変更し、
 *   eventRole.autoPromoteFromWaiting=true なら補欠先頭を繰り上げる。
 * - `bookmarkEvent` / `unbookmarkEvent`: ブックマークの追加削除。
 *
 * BigInt / Date は SQLite + Prisma 7 上で正常に動作する。
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { addGroupMember } from "@/lib/group-membership";
import { recordAudit } from "@/lib/audit";
import { nextId, withRetry } from "@/lib/id-gen";
import { ActionError } from "@/lib/action-error";

/* ============================================================
 * バリデーションスキーマ
 * ============================================================ */

/** `form` から来る FormDataEntryValue (string|File) を string に正規化 */
function formValue(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
}

const BigIntIdSchema = z
  .string()
  .regex(/^\d+$/, "id must be digits only")
  .transform((s) => BigInt(s));

const JoinSchema = z.object({
  eventId: BigIntIdSchema,
  eventRoleId: BigIntIdSchema,
});

const EventOnlySchema = z.object({
  eventId: BigIntIdSchema,
});

/* ============================================================
 * 共通ヘルパー
 * ============================================================ */

function loginRedirect(eventId: string): never {
  redirect(`/login?next=${encodeURIComponent(`/event/${eventId}`)}`);
}

function revalidateEvent(eventId: bigint): void {
  // dashboard も再検証 (参加予定一覧が変わる)
  revalidatePath(`/event/${eventId.toString()}`);
  revalidatePath(`/dashboard`);
}

/**
 * 次の `Participant.id` / `Bookmark.id` / `Notification.id` を採番。
 *
 * Prisma 7 + SQLite + Driver Adapter の組み合わせでは
 * `BigInt @id @default(autoincrement())` が機能せず INSERT 時に null になる
 * ため、明示的に最大 id + 1 を割り当てる必要がある。
 * (seed.ts でも同様の対応が入っている)
 *
 * 共通実装 `nextId(tx, table)` (`src/lib/id-gen.ts`) に委譲。並列申込時の
 * UNIQUE 制約衝突は `withRetry` (上位) で吸収する。
 */
async function nextParticipantId(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
): Promise<bigint> {
  return nextId(tx, "participant");
}

async function nextBookmarkId(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
): Promise<bigint> {
  return nextId(tx, "bookmark");
}

async function nextNotificationId(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
): Promise<bigint> {
  return nextId(tx, "notification");
}

/**
 * 主催者向けのサイト内通知を 1 件作成する。
 * 自分自身が主催者の場合や、主催者 id が現在のユーザーと同じ場合はスキップする。
 * NotificationPreference によりオプトアウト済みなら作成しない。
 */
async function notifyOwner(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  params: {
    ownerId: bigint;
    actorUserId: bigint;
    actorDisplayName: string;
    eventId: bigint;
    kind:
      | "participant_joined"
      | "participant_cancelled"
      | "approval_requested";
  },
): Promise<void> {
  if (params.ownerId === params.actorUserId) return;
  // 通知設定でオプトアウトされていれば作成スキップ
  const enabled = await isPreferenceEnabled(
    tx,
    params.ownerId,
    params.kind,
    "in_app",
  );
  if (!enabled) return;
  await tx.notification.create({
    data: {
      id: await nextNotificationId(tx),
      recipientUserId: params.ownerId,
      kind: params.kind,
      eventId: params.eventId,
      payload: JSON.stringify({
        participantUserId: params.actorUserId.toString(),
        participantDisplayName: params.actorDisplayName,
      }),
      channel: "in_app",
    },
  });
}

/**
 * NotificationPreference を参照し、kind × channel が有効か判定する。
 * レコード無し = 既定で有効として扱う。
 */
async function isPreferenceEnabled(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId: bigint,
  kind: string,
  channel: string,
): Promise<boolean> {
  const pref = await tx.notificationPreference.findUnique({
    where: { userId_kind_channel: { userId, kind, channel } },
  });
  return pref ? pref.enabled : true;
}

/* ============================================================
 * joinEvent
 * ============================================================ */

export async function joinEvent(formData: FormData): Promise<void> {
  const parsed = JoinSchema.safeParse({
    eventId: formValue(formData, "eventId"),
    eventRoleId: formValue(formData, "eventRoleId"),
  });
  if (!parsed.success) {
    throw new ActionError("invalid_input", "入力内容が不正です");
  }
  const { eventId, eventRoleId } = parsed.data;

  const user = await getCurrentUser();
  if (!user) {
    loginRedirect(eventId.toString());
  }

  // UNIQUE 制約衝突 (採番レース) を最大 3 回までリトライ
  await withRetry(() => prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event) throw new ActionError("not_found", "イベントが見つかりません");

    const role = await tx.eventRole.findUnique({ where: { id: eventRoleId } });
    if (!role || role.eventId !== eventId) {
      throw new ActionError("not_found", "参加枠が見つかりません");
    }

    // 既存の Participant (cancelled 以外) があれば no-op
    const existing = await tx.participant.findFirst({
      where: {
        eventId,
        userId: user.id,
        status: { not: "cancelled" },
      },
    });
    if (existing) return;

    const now = new Date();

    // 承認制 (approvalRequired=true) の場合は status=pending + approvalStatus=pending で
    // 申請する。主催者が承認するまで accepted/waiting に進めない。
    // 定員カウンタも更新しない (承認確定後に approveParticipant で増分する)。
    if (event.approvalRequired) {
      const cancelled = await tx.participant.findFirst({
        where: {
          eventId,
          userId: user.id,
          status: "cancelled",
        },
        orderBy: { cancelledAt: "desc" },
      });

      if (cancelled) {
        await tx.participant.update({
          where: { id: cancelled.id },
          data: {
            eventRoleId,
            status: "pending",
            approvalStatus: "pending",
            appliedAt: now,
            cancelledAt: null,
            acceptedAt: null,
            waitingPosition: null,
          },
        });
      } else {
        await tx.participant.create({
          data: {
            id: await nextParticipantId(tx),
            eventId,
            eventRoleId,
            userId: user.id,
            status: "pending",
            approvalStatus: "pending",
            appliedAt: now,
          },
        });
      }
      // 申請として主催者に通知
      await notifyOwner(tx, {
        ownerId: event.ownerId,
        actorUserId: user.id,
        actorDisplayName: user.displayName,
        eventId,
        kind: "approval_requested",
      });
      return;
    }

    // 抽選方式の枠 (役割) の場合は status=pending で保存し、定員チェックや
    // Event.acceptedCount/waitingCount の増分は行わない。
    // 抽選結果は `runLottery` (src/app/actions/lottery-actions.ts) で確定する。
    if (role.recruitmentMethod === "lottery") {
      const cancelled = await tx.participant.findFirst({
        where: {
          eventId,
          userId: user.id,
          status: "cancelled",
        },
        orderBy: { cancelledAt: "desc" },
      });

      if (cancelled) {
        await tx.participant.update({
          where: { id: cancelled.id },
          data: {
            eventRoleId,
            status: "pending",
            appliedAt: now,
            cancelledAt: null,
            acceptedAt: null,
            waitingPosition: null,
          },
        });
      } else {
        await tx.participant.create({
          data: {
            id: await nextParticipantId(tx),
            eventId,
            eventRoleId,
            userId: user.id,
            status: "pending",
            appliedAt: now,
          },
        });
      }
      // 抽選方式でも主催者にサイト内通知を出す
      await notifyOwner(tx, {
        ownerId: event.ownerId,
        actorUserId: user.id,
        actorDisplayName: user.displayName,
        eventId,
        kind: "participant_joined",
      });
      return;
    }

    // 以下は先着 (fcfs) のときの従来挙動

    // role 単位の現在 accepted 数を集計
    const acceptedInRole = await tx.participant.count({
      where: {
        eventId,
        eventRoleId,
        status: "accepted",
      },
    });

    // 定員に空きがあれば accepted、それ以外は waiting
    const isFull =
      role.capacity != null && acceptedInRole >= role.capacity;

    if (isFull) {
      // waitingPosition: 同 role の現在 waiting 数 + 1
      const waitingInRole = await tx.participant.count({
        where: {
          eventId,
          eventRoleId,
          status: "waiting",
        },
      });

      // 過去にキャンセル履歴があれば再利用、なければ新規作成
      const cancelled = await tx.participant.findFirst({
        where: {
          eventId,
          userId: user.id,
          status: "cancelled",
        },
        orderBy: { cancelledAt: "desc" },
      });

      if (cancelled) {
        await tx.participant.update({
          where: { id: cancelled.id },
          data: {
            eventRoleId,
            status: "waiting",
            waitingPosition: waitingInRole + 1,
            appliedAt: now,
            cancelledAt: null,
            acceptedAt: null,
          },
        });
      } else {
        await tx.participant.create({
          data: {
            id: await nextParticipantId(tx),
            eventId,
            eventRoleId,
            userId: user.id,
            status: "waiting",
            waitingPosition: waitingInRole + 1,
            appliedAt: now,
          },
        });
      }

      await tx.event.update({
        where: { id: eventId },
        data: { waitingCount: { increment: 1 } },
      });
    } else {
      const cancelled = await tx.participant.findFirst({
        where: {
          eventId,
          userId: user.id,
          status: "cancelled",
        },
        orderBy: { cancelledAt: "desc" },
      });

      if (cancelled) {
        await tx.participant.update({
          where: { id: cancelled.id },
          data: {
            eventRoleId,
            status: "accepted",
            appliedAt: now,
            acceptedAt: now,
            cancelledAt: null,
            waitingPosition: null,
          },
        });
      } else {
        await tx.participant.create({
          data: {
            id: await nextParticipantId(tx),
            eventId,
            eventRoleId,
            userId: user.id,
            status: "accepted",
            appliedAt: now,
            acceptedAt: now,
          },
        });
      }

      await tx.event.update({
        where: { id: eventId },
        data: { acceptedCount: { increment: 1 } },
      });
    }

    // 主催者向けサイト内通知 (自分が主催者でない場合のみ)
    await notifyOwner(tx, {
      ownerId: event.ownerId,
      actorUserId: user.id,
      actorDisplayName: user.displayName,
      eventId,
      kind: "participant_joined",
    });

    // 参加申込でグループメンバーにも追加 (memberCount を increment)。
    // 既に member の場合は no-op。 (data-model review High #2)
    await addGroupMember(tx, {
      groupId: event.groupId,
      userId: user.id,
      joinedVia: "event_join",
    });
  }));

  // 監査ログ (best-effort, トランザクション外)
  await recordAudit({
    actorUserId: user.id,
    action: "event.join",
    targetType: "Event",
    targetId: eventId,
  });

  revalidateEvent(eventId);
}

/* ============================================================
 * cancelParticipation
 * ============================================================ */

export async function cancelParticipation(formData: FormData): Promise<void> {
  const parsed = EventOnlySchema.safeParse({
    eventId: formValue(formData, "eventId"),
  });
  if (!parsed.success) {
    throw new ActionError("invalid_input", "入力内容が不正です");
  }
  const { eventId } = parsed.data;

  const user = await getCurrentUser();
  if (!user) {
    loginRedirect(eventId.toString());
  }

  await withRetry(() => prisma.$transaction(async (tx) => {
    // 自分の active な参加レコード (accepted | waiting | pending) を取得
    const me = await tx.participant.findFirst({
      where: {
        eventId,
        userId: user.id,
        status: { in: ["accepted", "waiting", "pending"] },
      },
    });
    if (!me) return; // no-op

    const wasAccepted = me.status === "accepted";
    const wasWaiting = me.status === "waiting";
    const eventRoleId = me.eventRoleId;
    const now = new Date();

    await tx.participant.update({
      where: { id: me.id },
      data: {
        status: "cancelled",
        cancelledAt: now,
        waitingPosition: null,
      },
    });

    // Event のカウンタを調整
    if (wasAccepted) {
      await tx.event.update({
        where: { id: eventId },
        data: { acceptedCount: { decrement: 1 } },
      });
    } else if (wasWaiting) {
      await tx.event.update({
        where: { id: eventId },
        data: { waitingCount: { decrement: 1 } },
      });
    }

    // 主催者にキャンセル通知
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (event) {
      await notifyOwner(tx, {
        ownerId: event.ownerId,
        actorUserId: user.id,
        actorDisplayName: user.displayName,
        eventId,
        kind: "participant_cancelled",
      });
    }

    // accepted のキャンセル時のみ補欠繰り上げを試みる
    if (!wasAccepted) return;

    const role = await tx.eventRole.findUnique({
      where: { id: eventRoleId },
    });
    if (!role) return;
    if (!role.autoPromoteFromWaiting) return;

    // 同 role の先頭 waiting (appliedAt 昇順) を 1 件昇格
    const head = await tx.participant.findFirst({
      where: {
        eventId,
        eventRoleId,
        status: "waiting",
      },
      orderBy: [{ waitingPosition: "asc" }, { appliedAt: "asc" }],
    });
    if (!head) return;

    await tx.participant.update({
      where: { id: head.id },
      data: {
        status: "accepted",
        acceptedAt: now,
        waitingPosition: null,
      },
    });

    await tx.event.update({
      where: { id: eventId },
      data: {
        acceptedCount: { increment: 1 },
        waitingCount: { decrement: 1 },
      },
    });
  }));

  revalidateEvent(eventId);
}

/* ============================================================
 * bookmarkEvent / unbookmarkEvent
 * ============================================================ */

export async function bookmarkEvent(formData: FormData): Promise<void> {
  const parsed = EventOnlySchema.safeParse({
    eventId: formValue(formData, "eventId"),
  });
  if (!parsed.success) throw new ActionError("invalid_input", "入力内容が不正です");
  const { eventId } = parsed.data;

  const user = await getCurrentUser();
  if (!user) {
    loginRedirect(eventId.toString());
  }

  await withRetry(() => prisma.$transaction(async (tx) => {
    const existing = await tx.bookmark.findUnique({
      where: { userId_eventId: { userId: user.id, eventId } },
    });
    if (existing) return;
    await tx.bookmark.create({
      data: {
        id: await nextBookmarkId(tx),
        userId: user.id,
        eventId,
      },
    });
  }));

  revalidateEvent(eventId);
}

export async function unbookmarkEvent(formData: FormData): Promise<void> {
  const parsed = EventOnlySchema.safeParse({
    eventId: formValue(formData, "eventId"),
  });
  if (!parsed.success) throw new ActionError("invalid_input", "入力内容が不正です");
  const { eventId } = parsed.data;

  const user = await getCurrentUser();
  if (!user) {
    loginRedirect(eventId.toString());
  }

  await prisma.bookmark
    .delete({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId,
        },
      },
    })
    .catch(() => {
      // 既に削除済みでも黙る
    });

  revalidateEvent(eventId);
}
