/**
 * 抽選結果の参加者通知 (lottery_result)。
 *
 * 抽選の当落確定ロジック自体は `feature-event` の `runLotteryForRole` /
 * `runLotteryForEvent` が担い、その際に in_app の
 * `Notification(kind='lottery_result')` 行 (payload: `{result, eventRoleId}`)
 * を作成する。本モジュールは抽選 **後** に呼び出され、以下を補完する:
 *
 *   1. 既存 lottery_result 行の payload に formatter 用フィールド
 *      (`eventTitle` / `lotteryResult: "won"|"lost"` / `startedAt`) を合流し、
 *      通知センターで「当選しました / 落選となりました」と表示できるようにする。
 *   2. `NotificationPreference (lottery_result × email)` が有効な参加者へ
 *      抽選結果メールを送信する (当選者には .ics 添付)。
 *   3. 行が無い参加者 (抽選が本モジュール導入前に実行された場合など) には
 *      pref を尊重して行を新規作成する。
 *
 * **冪等性**: メール送信済みかどうかは同一 (recipientUserId, eventId,
 * kind='lottery_result') 行の `sentAt` をマーカーとして判定する。
 * `updateMany({where: {sentAt: null}})` の件数で並走時の二重送信も防ぐ。
 * メール送信は行の commit 後に行い、個別失敗は握りつぶしてログする。
 *
 * 呼び出し元: `GET /api/cron/run-lotteries` (inline fallback 経路)。
 * queue (worker) 経路と `runLottery` (手動) 経路は feature-event / worker 側の
 * 変更が必要なため未配線 (このモジュールは import するだけで呼べる形にしてある)。
 */

import { prisma } from "@/lib/prisma";
import { nextId, withRetry } from "@/lib/id-gen";
import { sendMail, type MailAttachment } from "@/lib/mailer";
import {
  buildLotteryResultMailContent,
  isNotificationKindEnabled,
} from "@/lib/notification";
import { buildVCalendar } from "@/lib/ical";
import { logger } from "@/lib/logger";

import { resolveBaseUrl } from "./notification-fanout";

const KIND = "lottery_result";

type TargetResult = "won" | "lost";

type LotteryTarget = {
  userId: bigint;
  email: string;
  result: TargetResult;
};

export type LotteryNotifyResult = {
  /** 新規作成した Notification 行数 */
  created: number;
  /** payload 合流 / sentAt マーキングで更新した既存行数 */
  updated: number;
  /** 送信したメール数 */
  mailed: number;
  /** 冪等 / pref によりスキップした数 */
  skipped: number;
};

/** transaction 1 回分の判定結果 */
type TxOutcome = {
  action: "created" | "updated" | "skipped";
  shouldMail: boolean;
};

/**
 * 指定イベントの抽選結果 (accepted / waiting) を参加者へ通知する。
 *
 * 抽選枠 (`EventRole.recruitmentMethod === 'lottery'`) の participant のうち
 * `accepted` → 当選 (won)、`waiting` → 落選 (lost, 補欠) として扱う。
 * 複数枠に申し込んでいる場合は 1 枠でも accepted なら won。
 */
export async function sendLotteryResultNotifications(
  eventIdInput: bigint | string,
): Promise<LotteryNotifyResult> {
  const eventId =
    typeof eventIdInput === "bigint" ? eventIdInput : BigInt(eventIdInput);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      roles: {
        where: { recruitmentMethod: "lottery" },
        select: { id: true },
      },
    },
  });
  if (!event || event.roles.length === 0) {
    return { created: 0, updated: 0, mailed: 0, skipped: 0 };
  }

  const roleIds = event.roles.map((r) => r.id);
  const participants = await prisma.participant.findMany({
    where: {
      eventId,
      eventRoleId: { in: roleIds },
      status: { in: ["accepted", "waiting"] },
    },
    select: {
      userId: true,
      status: true,
      user: { select: { email: true, status: true } },
    },
  });

  // ユーザー単位に集約 (複数枠は accepted 優先) + 退会/停止ユーザー除外
  const byUser = new Map<string, LotteryTarget>();
  for (const p of participants) {
    if (p.user.status !== "active") continue;
    const key = p.userId.toString();
    const result: TargetResult = p.status === "accepted" ? "won" : "lost";
    const cur = byUser.get(key);
    if (!cur) {
      byUser.set(key, { userId: p.userId, email: p.user.email, result });
    } else if (cur.result === "lost" && result === "won") {
      cur.result = "won";
    }
  }

  const eventUrl = `${resolveBaseUrl()}/event/${eventId.toString()}`;
  const out: LotteryNotifyResult = {
    created: 0,
    updated: 0,
    mailed: 0,
    skipped: 0,
  };

  for (const t of byUser.values()) {
    try {
      const inAppEnabled = await isNotificationKindEnabled(
        prisma,
        t.userId,
        KIND,
        "in_app",
      );
      const emailEnabled = await isNotificationKindEnabled(
        prisma,
        t.userId,
        KIND,
        "email",
      );

      const now = new Date();
      const outcome = await withRetry(() =>
        prisma.$transaction(async (tx): Promise<TxOutcome> => {
          const existing = await tx.notification.findFirst({
            where: { recipientUserId: t.userId, eventId, kind: KIND },
            orderBy: { id: "desc" },
          });

          const enrichedPayload = (base: string): string => {
            let merged: Record<string, unknown> = {};
            try {
              const parsed: unknown = JSON.parse(base || "{}");
              if (parsed && typeof parsed === "object") {
                merged = parsed as Record<string, unknown>;
              }
            } catch {
              merged = {};
            }
            merged["eventTitle"] = event.title;
            merged["lotteryResult"] = t.result;
            merged["startedAt"] = event.startedAt.toISOString();
            return JSON.stringify(merged);
          };

          if (existing) {
            if (emailEnabled && existing.sentAt == null) {
              // sentAt を冪等マーカーとして先に立てる (並走時の二重送信防止)
              const res = await tx.notification.updateMany({
                where: { id: existing.id, sentAt: null },
                data: { sentAt: now, payload: enrichedPayload(existing.payload) },
              });
              return { action: "updated", shouldMail: res.count > 0 };
            }
            if (existing.sentAt == null) {
              // email OFF: 表示用 payload の合流のみ
              await tx.notification.update({
                where: { id: existing.id },
                data: { payload: enrichedPayload(existing.payload) },
              });
              return { action: "updated", shouldMail: false };
            }
            // 既にメール送信済み → 何もしない (冪等)
            return { action: "skipped", shouldMail: false };
          }

          if (!inAppEnabled && !emailEnabled) {
            return { action: "skipped", shouldMail: false };
          }

          await tx.notification.create({
            data: {
              id: await nextId(tx, "notification"),
              recipientUserId: t.userId,
              kind: KIND,
              eventId,
              payload: enrichedPayload("{}"),
              channel: inAppEnabled ? "in_app" : "email",
              sentAt: emailEnabled ? now : null,
              readAt: inAppEnabled ? null : now,
            },
          });
          return { action: "created", shouldMail: emailEnabled };
        }),
      );

      if (outcome.action === "created") out.created += 1;
      else if (outcome.action === "updated") out.updated += 1;
      else out.skipped += 1;

      if (!outcome.shouldMail) continue;

      // メール送信 (commit 後)。当選者には .ics を添付。
      const mail = buildLotteryResultMailContent({
        eventTitle: event.title,
        result: t.result,
        startedAt: event.startedAt,
        eventUrl,
      });
      const attachments: MailAttachment[] | undefined =
        t.result === "won"
          ? [
              {
                filename: `event-${eventId.toString()}.ics`,
                content: buildVCalendar([
                  {
                    uid: `event-${eventId.toString()}@tech-event`,
                    summary: event.title,
                    description: event.catchPhrase,
                    location: event.place,
                    url: eventUrl,
                    dtStart: event.startedAt,
                    dtEnd: event.endedAt,
                  },
                ]),
                contentType: "text/calendar; charset=utf-8; method=PUBLISH",
              },
            ]
          : undefined;
      await sendMail({
        to: t.email,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
        attachments,
      });
      out.mailed += 1;
    } catch (e) {
      // 1 人分の失敗が全体を止めないように握りつぶしてログ
      logger.warn(
        {
          eventId: eventId.toString(),
          userId: t.userId.toString(),
          err: e instanceof Error ? e.message : String(e),
        },
        "lottery result notification failed",
      );
    }
  }

  return out;
}
