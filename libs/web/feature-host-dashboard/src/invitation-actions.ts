"use server";

/**
 * ゲスト個別招待 (Invitation) 用 Server Actions (主催者向け)。
 *
 * - `inviteGuests(eventId, emails)` : 招待作成 + One-Tap RSVP リンク付きメール送信
 * - `sendInvitationsAction(form)`   : guests 管理 UI のフォーム (textarea / CSV) 用ラッパ
 * - `listInvitations(eventId)`      : 招待一覧 (serializable)
 * - `cancelInvitation(id)`          : 招待の取消 (行削除 → 再招待可能)
 * - `resendInvitation(id)`          : トークン再発行 + メール再送
 *
 * トークン設計:
 *   - 生トークン = `crypto.randomBytes(32)` の hex (64 文字)。メール内リンクにのみ載せる。
 *   - DB (`Invitation.tokenHash`) には sha256(生トークン) の hex のみ保存する。
 *   - 有効期限は発行から 14 日 (`expiresAt`)。
 *   - 生トークンはログ・監査ログに出力しない。
 *
 * 認可: イベント owner または対象 group の owner/admin のみ。
 */

import { createHash, randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendMail } from "@/lib/mailer";
import { nextId, withRetry } from "@/lib/id-gen";
import { ActionError } from "@/lib/action-error";
import { recordAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { getString as formValue } from "@/lib/form-data";
import { BigIntIdString } from "@/lib/schemas";

import { resolveBaseUrl } from "./lib/notification-fanout";

/* ============================================================
 * 定数 / バリデーション
 * ============================================================ */

/** 招待トークンの有効期限 (日) */
const INVITE_TOKEN_TTL_DAYS = 14;
/** 1 回の呼び出しで受け付ける招待メールの上限 */
const INVITE_MAX_EMAILS = 200;
/** CSV アップロードの上限サイズ (1MB) */
const INVITE_CSV_MAX_BYTES = 1024 * 1024;

const EmailSchema = z.string().trim().toLowerCase().pipe(z.string().email().max(254));

const InviteGuestsSchema = z.object({
  eventId: BigIntIdString,
  emails: z.array(z.string().max(500)).min(1).max(INVITE_MAX_EMAILS),
});

/* ============================================================
 * 型 (serializable)
 * ============================================================ */

export type InviteGuestsResult = {
  /** 新規に招待メールを送った件数 (再発行含む) */
  invited: number;
  /** 既に pending/accepted のためスキップした件数 */
  skipped: number;
  /** email 形式が不正で無視した件数 */
  invalid: number;
};

export type InvitationListItem = {
  id: string;
  email: string;
  /** pending|accepted|declined|expired */
  status: string;
  createdAt: string;
  expiresAt: string | null;
  acceptedAt: string | null;
};

/* ============================================================
 * 内部ヘルパー
 * ============================================================ */

function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/** 生トークン (64 hex) を発行し、DB 保存用ハッシュとペアで返す */
function issueToken(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(32).toString("hex");
  return { rawToken, tokenHash: sha256Hex(rawToken) };
}

function inviteExpiry(now = new Date()): Date {
  return new Date(now.getTime() + INVITE_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * 認可チェック: ログイン済み + (event owner OR group owner/admin)。
 * 通過したら user と event を返す。
 */
async function assertEventAdmin(eventId: bigint) {
  const user = await getCurrentUser();
  if (!user) {
    throw new ActionError("forbidden", "ログインが必要です");
  }
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    throw new ActionError("not_found", "イベントが見つかりません");
  }
  if (event.ownerId !== user.id) {
    const admin = await prisma.groupAdmin.findUnique({
      where: { groupId_userId: { groupId: event.groupId, userId: user.id } },
    });
    const isAdmin = !!admin && (admin.role === "owner" || admin.role === "admin");
    if (!isAdmin) {
      throw new ActionError("forbidden", "この操作にはイベント主催者権限が必要です");
    }
  }
  return { user, event };
}

const EMAIL_RE = /^[^\s@,;"']+@[^\s@,;"']+\.[^\s@,;"']+$/;

/**
 * 自由入力テキスト (改行/カンマ/セミコロン/タブ区切り、CSV 貼り付け含む) から
 * email らしきトークンを抽出する。ヘッダ行 (`email` 等) は自然に弾かれる
 * (EMAIL_RE にマッチしないため)。重複は除去。
 */
function extractEmails(text: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    for (const rawCell of line.split(/[,;\t]/)) {
      const cell = rawCell.trim().replace(/^["']+|["']+$/g, "").trim();
      if (!cell) continue;
      const lowered = cell.toLowerCase();
      if (!EMAIL_RE.test(lowered)) continue;
      if (seen.has(lowered)) continue;
      seen.add(lowered);
      out.push(lowered);
    }
  }
  return out;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatJst(d: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** 招待メール本文を組み立てる (生トークンは RSVP リンクにのみ載せる) */
function buildInviteMail(params: {
  eventTitle: string;
  startedAt: Date;
  inviterName: string;
  rsvpUrl: string;
  expiresAt: Date;
}): { subject: string; text: string; html: string } {
  const { eventTitle, startedAt, inviterName, rsvpUrl, expiresAt } = params;
  const subject = `【招待】${eventTitle} へのご招待`;
  const when = formatJst(startedAt);
  const until = formatJst(expiresAt);

  const text = [
    `${inviterName} さんからイベント「${eventTitle}」に招待されました。`,
    "",
    `開催日時: ${when}`,
    "",
    "以下のリンクを開くと、ワンタップで参加登録が完了します:",
    rsvpUrl,
    "",
    `このリンクの有効期限は ${until} までです。`,
    "心当たりがない場合はこのメールを破棄してください。",
  ].join("\n");

  const html = [
    `<p>${escapeHtml(inviterName)} さんからイベント「${escapeHtml(eventTitle)}」に招待されました。</p>`,
    `<p>開催日時: ${escapeHtml(when)}</p>`,
    `<p><a href="${escapeHtml(rsvpUrl)}" style="display:inline-block;background:#f97316;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">ワンタップで参加登録する</a></p>`,
    `<p style="color:#555;font-size:12px;">ボタンが開けない場合は次の URL をブラウザに貼り付けてください:<br/>${escapeHtml(rsvpUrl)}</p>`,
    `<p style="color:#555;font-size:12px;">このリンクの有効期限は ${escapeHtml(until)} までです。心当たりがない場合はこのメールを破棄してください。</p>`,
  ].join("\n");

  return { subject, text, html };
}

/* ============================================================
 * inviteGuests — 招待作成 + メール送信
 * ============================================================ */

/**
 * 指定イベントへ複数 email を招待する。
 *
 * - email ごとに Invitation を作成 (`@@unique([eventId, email])`)。
 *   - 既に pending (未期限切れ) / accepted の招待がある email はスキップ。
 *   - declined / expired / 期限切れ pending はトークン再発行のうえ再送 (upsert)。
 * - 招待メールに One-Tap RSVP リンク (`/rsvp/{生トークン}`) を絶対 URL で載せる。
 */
export async function inviteGuests(
  eventId: string,
  emails: string[],
): Promise<InviteGuestsResult> {
  const parsed = InviteGuestsSchema.safeParse({ eventId, emails });
  if (!parsed.success) {
    throw new ActionError("invalid_input", "招待の入力内容が不正です");
  }
  const eventIdBig = BigInt(parsed.data.eventId);
  const { user, event } = await assertEventAdmin(eventIdBig);

  // email の正規化 + 不正形式の除外 + 重複除去
  const valid: string[] = [];
  const seen = new Set<string>();
  let invalid = 0;
  for (const raw of parsed.data.emails) {
    const r = EmailSchema.safeParse(raw);
    if (!r.success) {
      invalid++;
      continue;
    }
    if (seen.has(r.data)) continue;
    seen.add(r.data);
    valid.push(r.data);
  }

  const base = resolveBaseUrl();
  const now = new Date();
  const expiresAt = inviteExpiry(now);

  let invited = 0;
  let skipped = 0;

  // commit 後に送信するメールタスク (生トークンは DB へ入れずここだけで保持)
  const mailTasks: { to: string; rawToken: string }[] = [];

  for (const email of valid) {
    const existing = await prisma.invitation.findUnique({
      where: { eventId_email: { eventId: eventIdBig, email } },
    });

    const stillPending =
      existing?.status === "pending" &&
      (!existing.expiresAt || existing.expiresAt.getTime() > now.getTime());

    if (existing && (existing.status === "accepted" || stillPending)) {
      skipped++;
      continue;
    }

    const { rawToken, tokenHash } = issueToken();

    if (existing) {
      // declined / expired / 期限切れ pending → トークン再発行 (upsert 相当)
      await prisma.invitation.update({
        where: { id: existing.id },
        data: {
          tokenHash,
          status: "pending",
          invitedByUserId: user.id,
          expiresAt,
          acceptedAt: null,
        },
      });
    } else {
      await withRetry(() =>
        prisma.$transaction(async (tx) => {
          await tx.invitation.create({
            data: {
              id: await nextId(tx, "invitation"),
              eventId: eventIdBig,
              email,
              tokenHash,
              status: "pending",
              invitedByUserId: user.id,
              expiresAt,
            },
          });
        }),
      );
    }

    mailTasks.push({ to: email, rawToken });
    invited++;
  }

  // メール送信 (DB 反映後)。sendMail は throw しない (console フォールバック)。
  for (const task of mailTasks) {
    const rsvpUrl = `${base}/rsvp/${task.rawToken}`;
    const content = buildInviteMail({
      eventTitle: event.title,
      startedAt: event.startedAt,
      inviterName: user.displayName,
      rsvpUrl,
      expiresAt,
    });
    await sendMail({ to: task.to, ...content });
  }

  // 監査ログ (件数のみ。email 一覧・トークンは記録しない)
  await recordAudit({
    actorUserId: user.id,
    action: "event.invite_guests",
    targetType: "Event",
    targetId: eventIdBig,
    metadata: { invited, skipped, invalid },
  });

  logger.info(
    { eventId: parsed.data.eventId, invited, skipped, invalid },
    "guest invitations sent",
  );

  revalidatePath(`/event/${parsed.data.eventId}/admin/guests`);
  return { invited, skipped, invalid };
}

/* ============================================================
 * sendInvitationsAction — guests 管理 UI フォーム用ラッパ
 * ============================================================ */

/**
 * guests 管理 UI の「ゲストを招待」フォーム用。
 *
 * - `emails` textarea: 改行 / カンマ区切り / CSV 貼り付け
 * - `csvFile` (任意): email 列を含む CSV / テキストファイル
 *
 * 処理後は `?invited=N&invite_skipped=M&invite_invalid=K` を付けて
 * guests ページへ redirect する (結果バナー表示用)。
 */
export async function sendInvitationsAction(formData: FormData): Promise<void> {
  const eventIdRaw = formValue(formData, "eventId");
  const eventIdParsed = BigIntIdString.safeParse(eventIdRaw);
  if (!eventIdParsed.success) {
    throw new ActionError("invalid_input", "イベント ID が不正です");
  }
  const eventId = eventIdParsed.data;
  const guestsPath = `/event/${eventId}/admin/guests`;

  let text = formValue(formData, "emails");

  // CSV ファイル (任意) をテキストとして連結
  const file = formData.get("csvFile");
  if (file instanceof File && file.size > 0) {
    if (file.size > INVITE_CSV_MAX_BYTES) {
      redirect(`${guestsPath}?invite_error=csv_too_large`);
    }
    text += `\n${await file.text()}`;
  }

  const emails = extractEmails(text).slice(0, INVITE_MAX_EMAILS);
  if (emails.length === 0) {
    redirect(`${guestsPath}?invite_error=no_emails`);
  }

  const result = await inviteGuests(eventId, emails);
  redirect(
    `${guestsPath}?invited=${result.invited}&invite_skipped=${result.skipped}&invite_invalid=${result.invalid}`,
  );
}

/* ============================================================
 * listInvitations — 招待一覧
 * ============================================================ */

/** イベントの招待一覧を新しい順に返す (主催者のみ)。 */
export async function listInvitations(
  eventId: string,
): Promise<InvitationListItem[]> {
  const parsed = BigIntIdString.safeParse(eventId);
  if (!parsed.success) {
    throw new ActionError("invalid_input", "イベント ID が不正です");
  }
  const eventIdBig = BigInt(parsed.data);
  await assertEventAdmin(eventIdBig);

  const rows = await prisma.invitation.findMany({
    where: { eventId: eventIdBig },
    orderBy: { createdAt: "desc" },
  });
  const now = Date.now();
  return rows.map((r) => ({
    id: r.id.toString(),
    email: r.email,
    // 期限切れの pending は表示上 expired に寄せる (DB 書換はしない)
    status:
      r.status === "pending" && r.expiresAt && r.expiresAt.getTime() < now
        ? "expired"
        : r.status,
    createdAt: r.createdAt.toISOString(),
    expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
    acceptedAt: r.acceptedAt ? r.acceptedAt.toISOString() : null,
  }));
}

/* ============================================================
 * cancelInvitation / resendInvitation
 * ============================================================ */

/**
 * 招待を取り消す (行削除)。削除後は同じ email に再招待できる。
 * `<form action={cancelInvitation.bind(null, id)}>` から呼ぶ。
 */
export async function cancelInvitation(invitationId: string): Promise<void> {
  const parsed = BigIntIdString.safeParse(invitationId);
  if (!parsed.success) {
    throw new ActionError("invalid_input", "招待 ID が不正です");
  }
  const id = BigInt(parsed.data);

  const invitation = await prisma.invitation.findUnique({ where: { id } });
  if (!invitation) {
    throw new ActionError("not_found", "招待が見つかりません");
  }
  const { user } = await assertEventAdmin(invitation.eventId);

  if (invitation.status === "accepted") {
    throw new ActionError(
      "conflict",
      "受諾済みの招待は取り消せません (参加者一覧から削除してください)",
    );
  }

  await prisma.invitation.delete({ where: { id } });

  await recordAudit({
    actorUserId: user.id,
    action: "event.invitation_cancel",
    targetType: "Event",
    targetId: invitation.eventId,
    metadata: { invitationId: parsed.data },
  });

  revalidatePath(`/event/${invitation.eventId.toString()}/admin/guests`);
}

/**
 * 招待メールを再送する。トークンは再発行 (旧リンクは無効化) し、期限も延長する。
 * `<form action={resendInvitation.bind(null, id)}>` から呼ぶ。
 */
export async function resendInvitation(invitationId: string): Promise<void> {
  const parsed = BigIntIdString.safeParse(invitationId);
  if (!parsed.success) {
    throw new ActionError("invalid_input", "招待 ID が不正です");
  }
  const id = BigInt(parsed.data);

  const invitation = await prisma.invitation.findUnique({ where: { id } });
  if (!invitation) {
    throw new ActionError("not_found", "招待が見つかりません");
  }
  const { user, event } = await assertEventAdmin(invitation.eventId);

  if (invitation.status === "accepted") {
    throw new ActionError("conflict", "受諾済みの招待は再送できません");
  }

  const { rawToken, tokenHash } = issueToken();
  const expiresAt = inviteExpiry();

  await prisma.invitation.update({
    where: { id },
    data: {
      tokenHash,
      status: "pending",
      expiresAt,
      acceptedAt: null,
    },
  });

  const rsvpUrl = `${resolveBaseUrl()}/rsvp/${rawToken}`;
  const content = buildInviteMail({
    eventTitle: event.title,
    startedAt: event.startedAt,
    inviterName: user.displayName,
    rsvpUrl,
    expiresAt,
  });
  await sendMail({ to: invitation.email, ...content });

  await recordAudit({
    actorUserId: user.id,
    action: "event.invitation_resend",
    targetType: "Event",
    targetId: invitation.eventId,
    metadata: { invitationId: parsed.data },
  });

  revalidatePath(`/event/${invitation.eventId.toString()}/admin/guests`);
}
