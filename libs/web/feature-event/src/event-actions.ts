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

import { timingSafeEqual } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { addGroupMember } from "@/lib/group-membership";
import { recordAudit } from "@/lib/audit";
import { nextId, withRetry } from "@/lib/id-gen";
import { ActionError } from "@/lib/action-error";
import { getStringRaw as formValue } from "@/lib/form-data";
import { BigIntIdSchema } from "@/lib/schemas";
import {
  buildCancelMailContent,
  buildJoinConfirmedMailContent,
  buildWaitlistedMailContent,
  isNotificationKindEnabled,
} from "@/lib/notification";

import { dispatchWebhook } from "@tech-event/web-feature-group";

import {
  buildEventIcsAttachment,
  createParticipantNotification,
  eventAbsoluteUrl,
  promoteWaitingHeadIfEnabled,
  resolveRequestOrigin,
  sendParticipantMailsSafely,
  type ParticipantMailTask,
} from "./lib/participant-notify";

/* ============================================================
 * バリデーションスキーマ
 * ============================================================ */

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

/** タイミング攻撃を避けた文字列比較 (招待コード照合用) */
function safeCodeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/**
 * 参加枠のゲート条件 (販売期間 / Unlock Code / 寄付額) を検証する。
 *
 * - 販売期間: now が saleStartsAt 前 or saleEndsAt 後なら申込不可 (null は無制限)
 * - Unlock Code: role.unlockCode が設定されている枠は、form の `unlockCode`
 *   (apply フォームの入力欄 or URL `?unlock=` から埋め込まれた値) と一致しないと申込不可
 * - Donation: pricingType=donation の枠は form の `donationAmount` が
 *   donationMinAmount (未設定なら 0) 以上の整数でないと申込不可
 *
 * 戻り値: donation 枠のときは検証済み寄付額、それ以外は null。
 * ゲート違反時は ActionError を throw する。
 */
function assertRoleGate(
  role: {
    saleStartsAt: Date | null;
    saleEndsAt: Date | null;
    unlockCode: string | null;
    pricingType: string;
    donationMinAmount: number | null;
  },
  formData: FormData,
  now: Date = new Date(),
): number | null {
  // ---- 販売期間 (Early Bird 等) ----
  if (role.saleStartsAt && now < role.saleStartsAt) {
    throw new ActionError(
      "forbidden",
      "この参加枠はまだ販売開始前です (販売期間外)",
    );
  }
  if (role.saleEndsAt && now > role.saleEndsAt) {
    throw new ActionError(
      "forbidden",
      "この参加枠の販売期間は終了しました (販売期間外)",
    );
  }

  // ---- Unlock Code (招待コード限定枠) ----
  if (role.unlockCode) {
    const code = formValue(formData, "unlockCode").trim();
    if (!code || !safeCodeEqual(code, role.unlockCode)) {
      throw new ActionError(
        "forbidden",
        "この参加枠は招待コード限定です。正しい招待コードを入力してください",
      );
    }
  }

  // ---- Donation (寄付型) ----
  if (role.pricingType === "donation") {
    const raw = formValue(formData, "donationAmount").trim();
    const amount = Number(raw);
    const min = role.donationMinAmount ?? 0;
    if (
      !raw ||
      !Number.isInteger(amount) ||
      amount < min ||
      amount > 10_000_000
    ) {
      throw new ActionError(
        "invalid_input",
        `寄付金額は ${min.toLocaleString("ja-JP")} 円以上の整数で入力してください`,
      );
    }
    return amount;
  }
  return null;
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

  // ---- 参加枠ゲート (販売期間 / Unlock Code / 寄付額) の事前チェック ----
  // トランザクション内でも role の存在検証は行うが、ゲート違反は
  // ここで先に弾く (redirect / ActionError をトランザクション外で発生させる)。
  const gateRole = await prisma.eventRole.findUnique({
    where: { id: eventRoleId },
  });
  if (!gateRole || gateRole.eventId !== eventId) {
    throw new ActionError("not_found", "参加枠が見つかりません");
  }
  const donationAmount = assertRoleGate(gateRole, formData);

  // 絶対 URL (メール/通知内リンク) 用の origin はトランザクション前に解決しておく
  const origin = await resolveRequestOrigin();

  // UNIQUE 制約衝突 (採番レース) を最大 3 回までリトライ。
  // 戻り値 = commit 後に送信する参加者向けメール (不要なら null)。
  const mailTask = await withRetry(() => prisma.$transaction(async (tx): Promise<ParticipantMailTask | null> => {
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event) throw new ActionError("not_found", "イベントが見つかりません");

    // グループブラックリスト: BL 登録済みユーザーの申込は入口でブロックする
    const blacklisted = await tx.groupBlacklist.findUnique({
      where: { groupId_userId: { groupId: event.groupId, userId: user.id } },
    });
    if (blacklisted) {
      throw new ActionError(
        "forbidden",
        "このグループの主催者により参加申込がブロックされています",
      );
    }

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
    if (existing) return null;

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
      // 参加はまだ確定していない (承認結果は approval-actions で通知する)
      return null;
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
      // 参加はまだ確定していない (抽選結果は lottery-actions で通知する)
      return null;
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

    // ---- 参加者本人向け通知 (join_confirmed / waitlisted) + メールタスク ----
    // NotificationPreference (in_app / email) を尊重。メール送信自体は
    // DB commit 後 (sendParticipantMailsSafely) に行う。
    const eventUrl = eventAbsoluteUrl(origin, eventId);
    const selfKind = isFull ? "waitlisted" : "join_confirmed";
    const { emailEnabled } = await createParticipantNotification(tx, {
      recipientUserId: user.id,
      eventId,
      kind: selfKind,
      payload: {
        eventTitle: event.title,
        startedAt: event.startedAt.toISOString(),
      },
      receiveNotificationEmail: user.receiveNotificationEmail,
    });
    if (!emailEnabled) return null;

    if (isFull) {
      // 補欠登録メール (.ics なし: 参加は未確定のため)
      return {
        to: user.email,
        content: buildWaitlistedMailContent({
          eventTitle: event.title,
          eventUrl,
        }),
      };
    }
    // 申込完了メール (.ics 添付)
    return {
      to: user.email,
      content: buildJoinConfirmedMailContent({
        eventTitle: event.title,
        startedAt: event.startedAt,
        venue: [event.place, event.address].filter(Boolean).join(" ") || undefined,
        eventUrl,
        roleName: role.name,
      }),
      attachments: [
        buildEventIcsAttachment({
          eventId,
          title: event.title,
          startedAt: event.startedAt,
          endedAt: event.endedAt,
          place: event.place,
          address: event.address,
          eventUrl,
        }),
      ],
    };
  }));

  // メール送信は DB commit 後 (失敗しても throw しない)
  await sendParticipantMailsSafely([mailTask]);

  // Outbound Webhook: guest.registered (DB commit 後)。
  // 配信失敗は dispatchWebhook 内で握りつぶされ、申込処理は止めない。
  try {
    const webhookEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: { groupId: true, title: true },
    });
    if (webhookEvent) {
      await dispatchWebhook(webhookEvent.groupId, "guest.registered", {
        eventId: eventId.toString(),
        eventTitle: webhookEvent.title,
        eventRoleId: eventRoleId.toString(),
        userId: user.id.toString(),
        nickname: user.nickname,
        displayName: user.displayName,
        registeredAt: new Date().toISOString(),
      });
    }
  } catch {
    // dispatchWebhook は throw しない設計だが、万一の失敗も申込成功を壊さない
  }

  // 監査ログ (best-effort, トランザクション外)
  // donation 枠の場合は寄付額を metadata に記録する
  // (prepaid 相当の決済は P1 の決済アクションに委譲。ここは金額記録のみ)
  await recordAudit({
    actorUserId: user.id,
    action: "event.join",
    targetType: "Event",
    targetId: eventId,
    ...(donationAmount != null
      ? {
          metadata: {
            donationAmount,
            eventRoleId: eventRoleId.toString(),
          },
        }
      : {}),
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

  // 絶対 URL (メール内リンク) 用の origin はトランザクション前に解決しておく
  const origin = await resolveRequestOrigin();

  // 戻り値 = commit 後に送信するメール群 (本人向けキャンセル完了 / 繰上当選者向け)
  const mailTasks = await withRetry(() => prisma.$transaction(async (tx): Promise<(ParticipantMailTask | null)[]> => {
    const tasks: (ParticipantMailTask | null)[] = [];

    // 自分の active な参加レコード (accepted | waiting | pending) を取得
    const me = await tx.participant.findFirst({
      where: {
        eventId,
        userId: user.id,
        status: { in: ["accepted", "waiting", "pending"] },
      },
    });
    if (!me) return tasks; // no-op

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

    // 主催者にキャンセル通知 (既存挙動: participant_cancelled は残す)
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (event) {
      await notifyOwner(tx, {
        ownerId: event.ownerId,
        actorUserId: user.id,
        actorDisplayName: user.displayName,
        eventId,
        kind: "participant_cancelled",
      });

      // 本人向けキャンセル完了メール (in-app 通知は作らない)。
      // NotificationPreference は participant_cancelled × email で判定
      // (キャンセル完了専用 kind は無いため最も近い kind を使う)。
      const emailEnabled =
        user.receiveNotificationEmail &&
        (await isNotificationKindEnabled(
          tx,
          user.id,
          "participant_cancelled",
          "email",
        ));
      if (emailEnabled) {
        tasks.push({
          to: user.email,
          content: buildCancelMailContent({
            eventTitle: event.title,
            eventUrl: eventAbsoluteUrl(origin, eventId),
          }),
        });
      }
    }

    // accepted のキャンセル時のみ補欠繰り上げを試みる
    if (!wasAccepted) return tasks;

    // 自動繰り上げ (role.autoPromoteFromWaiting 判定込み)。
    // ヘルパー内部で繰り上がった本人への promoted_from_waiting 通知まで作成し、
    // email pref 有効なら繰上メール (.ics 添付) のタスクを返す。
    tasks.push(
      await promoteWaitingHeadIfEnabled(tx, {
        eventId,
        eventRoleId,
        origin,
        now,
      }),
    );
    return tasks;
  }));

  // メール送信は DB commit 後 (失敗しても throw しない)
  await sendParticipantMailsSafely(mailTasks);

  // 監査ログ (fire-and-forget)
  void recordAudit({
    actorUserId: user.id,
    action: "event.cancel-participation",
    targetType: "Event",
    targetId: eventId,
  });

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

  void recordAudit({
    actorUserId: user.id,
    action: "event.bookmark",
    targetType: "Event",
    targetId: eventId,
  });

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

  void recordAudit({
    actorUserId: user.id,
    action: "event.unbookmark",
    targetType: "Event",
    targetId: eventId,
  });

  revalidateEvent(eventId);
}
