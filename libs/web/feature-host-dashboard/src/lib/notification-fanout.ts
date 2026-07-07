/**
 * 通知ファンアウト共通ヘルパー (主催者発の一斉通知用)。
 *
 * `cancelEvent` (イベント中止) / `publishEvent` (グループ新着イベント公開) など、
 * 「複数ユーザーへ in_app 通知 + メールを一括で飛ばす」処理を共通化する。
 *
 * 設計 (cron `run-reminders` の規約を踏襲):
 *   - `NotificationPreference` (kind × channel) を尊重する。
 *     - in_app OFF → Notification 行は `channel: "email"` のマーカー行として残し、
 *       `readAt` を即時セットして未読バッジ / 通知センターの未読タブに出さない。
 *     - email OFF → メールを送らない (`sentAt` は null のまま)。
 *     - 両方 OFF → 行を作らずスキップ。
 *   - **冪等性**: `dedupeByEvent: true` の場合、同一
 *     (recipientUserId, eventId, kind) の既存 Notification 行があるユーザーは
 *     スキップする (二重送信防止)。transaction 内でも再チェックする。
 *   - メール送信は Notification 行の **commit 後** に行い、1 通ごとに try/catch で
 *     失敗を握りつぶしてログする (1 通の失敗が全体を止めない)。
 */

import { prisma } from "@/lib/prisma";
import { nextId, withRetry } from "@/lib/id-gen";
import { sendMail, type MailAttachment } from "@/lib/mailer";
import { isNotificationKindEnabled, type MailContent } from "@/lib/notification";
import { logger } from "@/lib/logger";

/**
 * 絶対 URL の基準となるベース URL。
 * `feature-payment` / `util-slack` と同じ規約 (`NEXT_PUBLIC_BASE_URL` 優先)。
 */
export function resolveBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

/** ファンアウト対象 1 ユーザー分 */
export type FanoutRecipient = {
  userId: bigint;
  email: string;
};

type ResolvedTarget = FanoutRecipient & {
  inAppEnabled: boolean;
  emailEnabled: boolean;
};

export type FanoutResult = {
  /** 作成した Notification 行数 */
  created: number;
  /** 送信を試みて成功した (= sendMail が例外を投げなかった) メール数 */
  mailed: number;
  /** 冪等スキップ / 全チャネル OFF でスキップした数 */
  skipped: number;
};

/**
 * 複数ユーザーへ通知 (in_app Notification 行 + メール) をファンアウトする。
 *
 * この関数自体は throw し得る (呼び出し側で try/catch し、本体処理を
 * 止めないこと)。メール送信の個別失敗は内部で握りつぶしてログする。
 */
export async function fanoutNotifications(params: {
  kind: string;
  eventId?: bigint;
  groupId?: bigint;
  recipients: FanoutRecipient[];
  /** formatter (`formatNotificationText`) 用フィールドを含む payload */
  payload: Record<string, unknown>;
  /** true なら (recipientUserId, eventId, kind) の既存行があるユーザーをスキップ */
  dedupeByEvent?: boolean;
  /** 指定時のみメール送信 (email チャネル有効ユーザーへ) */
  buildMail?: (
    recipient: FanoutRecipient,
  ) => MailContent & { attachments?: MailAttachment[] };
}): Promise<FanoutResult> {
  const { kind, eventId, groupId, recipients, payload, dedupeByEvent, buildMail } =
    params;

  // ユーザー単位にユニーク化
  const byUser = new Map<string, FanoutRecipient>();
  for (const r of recipients) {
    const key = r.userId.toString();
    if (!byUser.has(key)) byUser.set(key, r);
  }
  if (byUser.size === 0) return { created: 0, mailed: 0, skipped: 0 };

  // 冪等性: 既存 (recipientUserId, eventId, kind) 行がある宛先を除外
  let sentSet = new Set<string>();
  if (dedupeByEvent && eventId != null) {
    const existing = await prisma.notification.findMany({
      where: {
        eventId,
        kind,
        recipientUserId: {
          in: Array.from(byUser.keys()).map((s) => BigInt(s)),
        },
      },
      select: { recipientUserId: true },
    });
    sentSet = new Set(existing.map((n) => n.recipientUserId.toString()));
  }

  // NotificationPreference (kind × channel) の判定
  const targets: ResolvedTarget[] = [];
  let skipped = 0;
  for (const [uidStr, r] of byUser) {
    if (sentSet.has(uidStr)) {
      skipped += 1;
      continue;
    }
    const inAppEnabled = await isNotificationKindEnabled(
      prisma,
      r.userId,
      kind,
      "in_app",
    );
    const emailEnabled = await isNotificationKindEnabled(
      prisma,
      r.userId,
      kind,
      "email",
    );
    if (!inAppEnabled && !emailEnabled) {
      skipped += 1;
      continue;
    }
    targets.push({ ...r, inAppEnabled, emailEnabled });
  }
  if (targets.length === 0) return { created: 0, mailed: 0, skipped };

  const payloadJson = JSON.stringify(payload);
  const now = new Date();

  // transaction 内で dedup を再確認してから createMany (並走時の二重送信防止)
  const createdTargets = await withRetry(() =>
    prisma.$transaction(async (tx) => {
      let fresh = targets;
      if (dedupeByEvent && eventId != null) {
        const dup = await tx.notification.findMany({
          where: {
            eventId,
            kind,
            recipientUserId: { in: targets.map((t) => t.userId) },
          },
          select: { recipientUserId: true },
        });
        const dupSet = new Set(dup.map((n) => n.recipientUserId.toString()));
        fresh = targets.filter((t) => !dupSet.has(t.userId.toString()));
      }
      if (fresh.length === 0) return [] as ResolvedTarget[];

      const baseId = await nextId(tx, "notification");
      await tx.notification.createMany({
        data: fresh.map((t, i) => ({
          id: baseId + BigInt(i),
          recipientUserId: t.userId,
          kind,
          eventId: eventId ?? null,
          groupId: groupId ?? null,
          payload: payloadJson,
          // in_app OFF (email のみ) の場合は email マーカー行として残す
          channel: t.inAppEnabled ? "in_app" : "email",
          sentAt: t.emailEnabled ? now : null,
          readAt: t.inAppEnabled ? null : now,
        })),
      });
      return fresh;
    }),
  );

  // メール送信は commit 後。個別失敗は握りつぶしてログ (全体を止めない)。
  let mailed = 0;
  if (buildMail) {
    for (const t of createdTargets) {
      if (!t.emailEnabled) continue;
      try {
        const mail = buildMail(t);
        await sendMail({
          to: t.email,
          subject: mail.subject,
          text: mail.text,
          html: mail.html,
          attachments: mail.attachments,
        });
        mailed += 1;
      } catch (e) {
        logger.warn(
          {
            kind,
            eventId: eventId?.toString(),
            groupId: groupId?.toString(),
            userId: t.userId.toString(),
            err: e instanceof Error ? e.message : String(e),
          },
          "notification fanout: mail send failed",
        );
      }
    }
  }

  return {
    created: createdTargets.length,
    mailed,
    skipped: skipped + (targets.length - createdTargets.length),
  };
}
