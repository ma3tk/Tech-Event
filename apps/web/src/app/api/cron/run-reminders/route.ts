/**
 * 開催前リマインダー (24h 前 / 1h 前) 用の簡易バッチエンドポイント。
 *
 * `GET /api/cron/run-reminders?secret=xxx`
 *
 * - 開催 24 時間前 / 1 時間前のウィンドウ (`now < startedAt <= now + window`)
 *   に入った `status === "published"` の event を抽出する。
 * - 各 event の `accepted` 参加者 (User.status === "active") に対して:
 *     - in-app Notification (`kind: reminder_24h | reminder_1h`) を作成
 *       (NotificationPreference で in_app がオフならスキップ)
 *     - email チャネルが有効 (`User.receiveReminderEmail` かつ
 *       NotificationPreference の email 設定が有効) ならリマインダーメールを送信。
 *       REDIS_URL 設定時は `notification` queue に enqueue して worker が配送、
 *       未設定時は inline で `sendMail` (console フォールバック込み)。
 * - **冪等性**: schema 変更なしで重複送信を防ぐため、同一
 *   (recipientUserId, eventId, kind) の Notification 行が既に存在するかを
 *   毎回チェックし、未送信の participant のみ処理する。
 *   in_app がオフで email のみ送った場合も `channel: "email"` の Notification 行を
 *   マーカーとして残す (readAt を即時セットするので未読バッジには影響しない)。
 * - シークレットは環境変数 `CRON_SECRET` (run-lotteries と共通)。
 *   未設定なら 503、 不一致なら 401。
 * - 戻り値: `{ mode, created, mailedQueued, mailedInline, skipped, errors }`
 *
 * NOTE: 実運用では Vercel Cron / Cloud Scheduler 等から定期的 (10〜15 分間隔目安)
 * に叩く想定。ウィンドウ判定 + Notification 行での dedup なので、どの間隔で
 * 叩いても同一ユーザーへの同一 kind リマインダーは 1 回しか送られない。
 */

import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { nextId, withRetry } from "@/lib/id-gen";
import { sendMail } from "@/lib/mailer";
import {
  REMINDER_KINDS,
  REMINDER_WINDOW_MS,
  buildReminderMailContent,
  isNotificationKindEnabled,
  type ReminderKind,
} from "@/lib/notification";
import {
  enqueueNotification,
  isRedisEnabled,
} from "@tech-event/shared-data-access-queue";

// 動的レンダリングが必要 (環境変数 / DB クエリに依存)
export const dynamic = "force-dynamic";

type ErrorEntry = { eventId: string; userId?: string; message: string };

/** 送信対象 1 件分の判定結果 */
type ReminderTarget = {
  userId: bigint;
  email: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "cron_disabled", reason: "CRON_SECRET is not set" },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const provided = url.searchParams.get("secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const origin = request.nextUrl.origin;

  const errors: ErrorEntry[] = [];
  let created = 0;
  let mailedQueued = 0;
  let mailedInline = 0;
  let skipped = 0;

  for (const kind of REMINDER_KINDS) {
    const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MS[kind]);

    // ウィンドウに入った公開イベント (開始済みは対象外)
    const events = await prisma.event.findMany({
      where: {
        status: "published",
        startedAt: { gt: now, lte: windowEnd },
      },
      select: { id: true, title: true, startedAt: true },
    });

    for (const event of events) {
      try {
        const result = await processEventReminder({
          kind,
          eventId: event.id,
          eventTitle: event.title,
          startedAt: event.startedAt,
          origin,
          errors,
        });
        created += result.created;
        mailedQueued += result.mailedQueued;
        mailedInline += result.mailedInline;
        skipped += result.skipped;
      } catch (e) {
        errors.push({
          eventId: event.id.toString(),
          message: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }

  return NextResponse.json({
    mode: isRedisEnabled() ? "queued" : "inline",
    created,
    mailedQueued,
    mailedInline,
    // 後方互換用の合計値 (run-lotteries の `processed` に相当)
    processed: created,
    skipped,
    errors,
  });
}

/**
 * 1 event × 1 kind 分のリマインダーを処理する。
 *
 * 1. accepted 参加者 (active ユーザー) を列挙
 * 2. 既存 Notification (eventId, kind) で送信済みユーザーを除外
 * 3. NotificationPreference (in_app / email) と User.receiveReminderEmail を判定
 * 4. Notification 行を transaction 内で dedup 再確認しつつ createMany
 * 5. email 有効ユーザーへメール送信 (queue 経由 / inline フォールバック)
 */
async function processEventReminder(params: {
  kind: ReminderKind;
  eventId: bigint;
  eventTitle: string;
  startedAt: Date;
  origin: string;
  errors: ErrorEntry[];
}): Promise<{
  created: number;
  mailedQueued: number;
  mailedInline: number;
  skipped: number;
}> {
  const { kind, eventId, eventTitle, startedAt, origin, errors } = params;

  const participants = await prisma.participant.findMany({
    where: { eventId, status: "accepted" },
    select: {
      userId: true,
      user: {
        select: {
          id: true,
          email: true,
          status: true,
          receiveReminderEmail: true,
        },
      },
    },
  });

  // 同一ユーザーが複数枠で accepted のケースをユニーク化 + 退会/停止ユーザー除外
  const byUser = new Map<string, (typeof participants)[number]["user"]>();
  for (const p of participants) {
    if (p.user.status !== "active") continue;
    byUser.set(p.userId.toString(), p.user);
  }
  if (byUser.size === 0) {
    return { created: 0, mailedQueued: 0, mailedInline: 0, skipped: 0 };
  }

  // 冪等性: 既に (recipientUserId, eventId, kind) の Notification 行があれば送信済み
  const existing = await prisma.notification.findMany({
    where: {
      eventId,
      kind,
      recipientUserId: { in: Array.from(byUser.keys()).map((s) => BigInt(s)) },
    },
    select: { recipientUserId: true },
  });
  const sentSet = new Set(existing.map((n) => n.recipientUserId.toString()));

  // 通知設定 (kind × channel) を判定して送信対象を確定する
  const targets: ReminderTarget[] = [];
  let skipped = 0;
  for (const [uidStr, user] of byUser) {
    if (sentSet.has(uidStr)) continue;
    const userId = BigInt(uidStr);
    const inAppEnabled = await isNotificationKindEnabled(
      prisma,
      userId,
      kind,
      "in_app",
    );
    const emailEnabled =
      user.receiveReminderEmail &&
      (await isNotificationKindEnabled(prisma, userId, kind, "email"));
    if (!inAppEnabled && !emailEnabled) {
      // 全チャネルオプトアウト: 行を作らずスキップ (次回も再判定されるだけで送信はされない)
      skipped += 1;
      continue;
    }
    targets.push({ userId, email: user.email, inAppEnabled, emailEnabled });
  }
  if (targets.length === 0) {
    return { created: 0, mailedQueued: 0, mailedInline: 0, skipped };
  }

  const payload = JSON.stringify({
    eventTitle,
    startedAt: startedAt.toISOString(),
  });
  const nowDate = new Date();

  // transaction 内で dedup を再確認してから createMany (cron 並走時の二重送信防止)
  const createdTargets = await withRetry(() =>
    prisma.$transaction(async (tx) => {
      const dup = await tx.notification.findMany({
        where: {
          eventId,
          kind,
          recipientUserId: { in: targets.map((t) => t.userId) },
        },
        select: { recipientUserId: true },
      });
      const dupSet = new Set(dup.map((n) => n.recipientUserId.toString()));
      const fresh = targets.filter((t) => !dupSet.has(t.userId.toString()));
      if (fresh.length === 0) return [] as ReminderTarget[];

      const baseId = await nextId(tx, "notification");
      await tx.notification.createMany({
        data: fresh.map((t, i) => ({
          id: baseId + BigInt(i),
          recipientUserId: t.userId,
          kind,
          eventId,
          payload,
          // in_app オフ (email のみ) の場合は email マーカー行として残す。
          // readAt を即時セットして未読バッジ/未読タブに出さない。
          channel: t.inAppEnabled ? "in_app" : "email",
          sentAt: t.emailEnabled ? nowDate : null,
          readAt: t.inAppEnabled ? null : nowDate,
        })),
      });
      return fresh;
    }),
  );

  // メール送信 (Notification 行 = 冪等マーカーを作成済みなので、送信失敗しても
  // 二重送信にはならない。失敗は errors に積んで response で可視化する)
  let mailedQueued = 0;
  let mailedInline = 0;
  for (const t of createdTargets) {
    if (!t.emailEnabled) continue;
    const mail = buildReminderMailContent({
      kind,
      eventTitle,
      startedAt,
      eventUrl: `${origin}/event/${eventId.toString()}`,
    });
    try {
      const result = await enqueueNotification(
        {
          kind: "email",
          to: t.email,
          subject: mail.subject,
          text: mail.text,
          html: mail.html,
        },
        async () => {
          // fallback: REDIS_URL 未設定なら inline で送信 (console フォールバック込み)
          await sendMail({
            to: t.email,
            subject: mail.subject,
            text: mail.text,
            html: mail.html,
          });
        },
      );
      if (result.mode === "queued") {
        mailedQueued += 1;
      } else {
        mailedInline += 1;
      }
    } catch (e) {
      errors.push({
        eventId: eventId.toString(),
        userId: t.userId.toString(),
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return { created: createdTargets.length, mailedQueued, mailedInline, skipped };
}
