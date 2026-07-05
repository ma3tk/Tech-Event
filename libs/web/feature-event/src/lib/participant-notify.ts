/**
 * 参加者向けトランザクション通知/メールの共通ヘルパー。
 *
 * 対象 kind: `join_confirmed` / `waitlisted` / `promoted_from_waiting` /
 * `approval_result` (+ キャンセル完了メール)。
 *
 * 設計 (cron `run-reminders` のパターンを踏襲):
 * - **NotificationPreference を尊重**: in_app がオフなら Notification 行を作らず、
 *   email がオフ (または `User.receiveNotificationEmail=false`) ならメールを送らない。
 * - **email マーカー行**: in_app オフ & email オンの場合は `channel: "email"` の
 *   Notification 行を残す (readAt 即時セットで未読バッジに出さない)。
 *   これが冪等マーカーになり、既存通知の有無チェックで二重送信を防げる。
 * - **メール送信は DB commit 後**: トランザクション内では
 *   `ParticipantMailTask` (送信内容) を組み立てて返すだけにし、commit 後に
 *   `sendParticipantMailsSafely()` で送信する。送信失敗は catch してログのみ
 *   (申込トランザクションを巻き戻さない)。
 *
 * `promoteWaitingHeadIfEnabled` はヘルパー内部で繰り上げ + 本人通知まで行うため、
 * 他 lib (event-admin 等) から呼ばれた場合も通知が漏れない。
 */

import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import { nextId } from "@/lib/id-gen";
import { sendMail, type MailAttachment } from "@/lib/mailer";
import { buildVCalendar } from "@/lib/ical";
import {
  buildPromotedMailContent,
  isNotificationKindEnabled,
  type MailContent,
} from "@/lib/notification";

/** Prisma interactive transaction のクライアント型。 */
export type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** 参加者本人向けトランザクション通知の kind。 */
export type ParticipantTransactionalKind =
  | "join_confirmed"
  | "waitlisted"
  | "promoted_from_waiting"
  | "approval_result";

/**
 * DB commit 後に送信するメール 1 通分。
 * トランザクション内で組み立て、commit 後 `sendParticipantMailsSafely` に渡す。
 */
export type ParticipantMailTask = {
  to: string;
  content: MailContent;
  attachments?: MailAttachment[];
};

/**
 * Server Action からリクエスト origin (絶対 URL のベース) を復元する。
 * (feature-user の password-reset-actions / cron の `request.nextUrl.origin` 相当)
 *
 * headers() が使えないコンテキストでは `NEXT_PUBLIC_BASE_URL` にフォールバック。
 */
export async function resolveRequestOrigin(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto =
        h.get("x-forwarded-proto") ??
        (host.startsWith("localhost") || host.startsWith("127.")
          ? "http"
          : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // headers() はリクエストスコープ外で throw する。フォールバックへ。
  }
  return process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
}

/** イベントページの絶対 URL。 */
export function eventAbsoluteUrl(origin: string, eventId: bigint): string {
  return `${origin}/event/${eventId.toString()}`;
}

/** 申込完了 / 繰上メールに添付する `.ics` (カレンダー登録用) を組み立てる。 */
export function buildEventIcsAttachment(params: {
  eventId: bigint;
  title: string;
  startedAt: Date;
  endedAt: Date;
  place?: string | null;
  address?: string | null;
  eventUrl: string;
}): MailAttachment {
  const location =
    [params.place, params.address].filter(Boolean).join(" ") || null;
  const ics = buildVCalendar([
    {
      uid: `event-${params.eventId.toString()}@tech-event`,
      summary: params.title,
      dtStart: params.startedAt,
      dtEnd: params.endedAt,
      location,
      url: params.eventUrl,
    },
  ]);
  return {
    filename: "event.ics",
    content: ics,
    contentType: "text/calendar",
  };
}

/**
 * 参加者本人向けの in-app Notification を 1 件作成し、email チャネルの可否を返す。
 *
 * - `dedupeSince` を渡すと、それ以降に同じ (recipient, event, kind) の行が既に
 *   あればスキップ (既存通知の有無チェックによる二重送信防止)。
 * - in_app 有効 → `channel: "in_app"` 行 (未読)。
 * - in_app 無効 & email 有効 → `channel: "email"` マーカー行 (readAt 即時セット)。
 * - 両方無効 → 行を作らない。
 *
 * @returns `created` = 行を作成したか / `emailEnabled` = メールを送ってよいか
 *   (dedupe に引っかかった場合は両方 false = メールも送らない)
 */
export async function createParticipantNotification(
  tx: Tx,
  params: {
    recipientUserId: bigint;
    eventId: bigint;
    kind: ParticipantTransactionalKind;
    payload: Record<string, unknown>;
    /** 参加者本人のメール受信可否 (User.receiveNotificationEmail)。 */
    receiveNotificationEmail: boolean;
    /** これ以降の既存通知があれば二重送信としてスキップする。 */
    dedupeSince?: Date;
  },
): Promise<{ created: boolean; emailEnabled: boolean }> {
  const { recipientUserId, eventId, kind } = params;

  if (params.dedupeSince) {
    const existing = await tx.notification.findFirst({
      where: {
        recipientUserId,
        eventId,
        kind,
        createdAt: { gte: params.dedupeSince },
      },
      select: { id: true },
    });
    if (existing) return { created: false, emailEnabled: false };
  }

  const inAppEnabled = await isNotificationKindEnabled(
    tx,
    recipientUserId,
    kind,
    "in_app",
  );
  const emailEnabled =
    params.receiveNotificationEmail &&
    (await isNotificationKindEnabled(tx, recipientUserId, kind, "email"));

  if (!inAppEnabled && !emailEnabled) {
    return { created: false, emailEnabled: false };
  }

  const now = new Date();
  await tx.notification.create({
    data: {
      id: await nextId(tx, "notification"),
      recipientUserId,
      kind,
      eventId,
      payload: JSON.stringify(params.payload),
      // in_app オフ (email のみ) の場合は email マーカー行として残す。
      channel: inAppEnabled ? "in_app" : "email",
      sentAt: emailEnabled ? now : null,
      readAt: inAppEnabled ? null : now,
    },
  });
  return { created: true, emailEnabled };
}

/**
 * 補欠先頭 1 名の自動繰り上げ (`EventRole.autoPromoteFromWaiting`)。
 *
 * 従来 `cancelParticipation` にインラインだったロジックの共通ヘルパー化。
 * ヘルパー内部で本人向け `promoted_from_waiting` 通知まで作成するため、
 * 他 lib (event-admin 等) からトランザクション内で呼んでも通知が漏れない。
 *
 * 1. role の `autoPromoteFromWaiting` が無効なら何もしない
 * 2. 同 role の先頭 waiting (waitingPosition → appliedAt 昇順) を accepted に昇格
 * 3. Event の acceptedCount/waitingCount を調整
 * 4. 本人へ `promoted_from_waiting` in-app 通知 (pref 尊重 + 既存通知 dedupe)
 * 5. email pref 有効なら繰上メール (.ics 添付) の送信タスクを返す
 *
 * **メール送信は DB commit 後に** `sendParticipantMailsSafely([task])` で行うこと。
 *
 * @returns 繰り上げが発生しなかった / メール不要なら null
 */
export async function promoteWaitingHeadIfEnabled(
  tx: Tx,
  params: {
    eventId: bigint;
    eventRoleId: bigint;
    /** 絶対 URL 生成用 origin (`resolveRequestOrigin()` の戻り値)。 */
    origin: string;
    now?: Date;
  },
): Promise<ParticipantMailTask | null> {
  const { eventId, eventRoleId, origin } = params;
  const now = params.now ?? new Date();

  const role = await tx.eventRole.findUnique({ where: { id: eventRoleId } });
  if (!role) return null;
  if (!role.autoPromoteFromWaiting) return null;

  // 同 role の先頭 waiting (appliedAt 昇順) を 1 件昇格
  const head = await tx.participant.findFirst({
    where: {
      eventId,
      eventRoleId,
      status: "waiting",
    },
    orderBy: [{ waitingPosition: "asc" }, { appliedAt: "asc" }],
  });
  if (!head) return null;

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

  // 繰り上がった本人への通知 + メール
  const event = await tx.event.findUnique({ where: { id: eventId } });
  const promotedUser = await tx.user.findUnique({
    where: { id: head.userId },
    select: {
      email: true,
      status: true,
      receiveNotificationEmail: true,
    },
  });
  if (!event || !promotedUser) return null;

  const eventUrl = eventAbsoluteUrl(origin, eventId);
  const { emailEnabled } = await createParticipantNotification(tx, {
    recipientUserId: head.userId,
    eventId,
    kind: "promoted_from_waiting",
    payload: {
      eventTitle: event.title,
      startedAt: event.startedAt.toISOString(),
    },
    receiveNotificationEmail: promotedUser.receiveNotificationEmail,
    // 同一申込サイクル内 (appliedAt 以降) に既に繰上通知済みならスキップ
    dedupeSince: head.appliedAt,
  });
  if (!emailEnabled || promotedUser.status !== "active") return null;

  return {
    to: promotedUser.email,
    content: buildPromotedMailContent({
      eventTitle: event.title,
      startedAt: event.startedAt,
      eventUrl,
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
}

/**
 * DB commit 後のメール送信。失敗しても throw せずログのみ
 * (メール送信失敗が申込トランザクションを巻き戻さないため)。
 */
export async function sendParticipantMailsSafely(
  tasks: (ParticipantMailTask | null | undefined)[],
): Promise<void> {
  for (const task of tasks) {
    if (!task) continue;
    try {
      await sendMail({
        to: task.to,
        subject: task.content.subject,
        text: task.content.text,
        html: task.content.html,
        attachments: task.attachments,
      });
    } catch (e) {
      console.error(
        `[participant-notify] mail send failed (to=${task.to}, subject=${task.content.subject}):`,
        e,
      );
    }
  }
}
