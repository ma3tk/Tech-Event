"use server";

/**
 * パスワードリセット用 Server Actions。
 *
 * `requestPasswordReset(email)`:
 *   - メールアドレスを Zod でバリデートし、該当する active ユーザーがいれば
 *     ワンタイムトークン (32byte hex) を発行してリセットリンクをメール送信する。
 *   - DB には生トークンではなく sha256 ハッシュのみ保存する
 *     (DB 漏洩時にトークンを直接使えなくするため)。
 *   - アカウントの有無を漏らさないため、該当ユーザーがいなくても常に `{ok: true}`
 *     を返す (enumeration attack 対策 — magic-link/request と同じ方針)。
 *   - 有効期限は 1 時間。
 *
 * `resetPassword(token, newPassword)`:
 *   - トークンの sha256 ハッシュで `PasswordResetToken` を照合し、未使用 &
 *     期限内 & ユーザーが active であれば新パスワードを bcrypt (12 rounds) で
 *     ハッシュして `User.passwordHash` を更新する。
 *   - 使用済みトークンは `usedAt` を set してワンタイム化。同一ユーザーの
 *     未使用トークンもまとめて無効化する。
 *
 * パスワードのハッシュ方式は既存ログイン (`/api/auth/login` の bcryptjs) に合わせる。
 */

import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendMail, getMailProvider } from "@/lib/mailer";
import { nextId, withRetry } from "@/lib/id-gen";
import { ActionError } from "@/lib/action-error";
import { recordAudit } from "@/lib/audit";
import { incrementCounter, METRIC_NAMES } from "@/lib/metrics";

/** トークン有効期限: 1 時間 */
const TOKEN_TTL_MS = 60 * 60 * 1000;

const EmailSchema = z.string().email().max(254);
/** 生トークン: randomBytes(32).toString("hex") = 64 文字の hex */
const TokenSchema = z.string().regex(/^[0-9a-f]{64}$/);
/** 新パスワード: signup フォームと同じ 8 文字以上 (login 側の上限 200 に合わせる) */
const PasswordSchema = z.string().min(8).max(200);

/** 生トークン → DB 保存用 sha256 ハッシュ (hex) */
function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Server Action からリクエスト origin を復元する。
 * (Route Handler の `request.nextUrl.origin` 相当)
 */
async function resolveOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * パスワードリセットリンクの発行を要求する。
 *
 * - 常に `{ok: true}` を返す (アカウントの有無を漏らさない)。
 * - メール形式が不正な場合のみ `ActionError("invalid_input")` を投げる。
 */
export async function requestPasswordReset(
  email: string,
): Promise<{ ok: true }> {
  const parsed = EmailSchema.safeParse(email);
  if (!parsed.success) {
    throw new ActionError("invalid_input", "メールアドレスの形式が不正です", {
      field: "email",
    });
  }
  const normalizedEmail = parsed.data.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // 該当ユーザーなし / 退会・停止中でも ok を返す (enumeration 対策)
  if (!user || user.status !== "active") {
    return { ok: true };
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await withRetry(() =>
    prisma.$transaction(async (tx) => {
      const id = await nextId(tx, "passwordResetToken");
      await tx.passwordResetToken.create({
        data: { id, userId: user.id, tokenHash, expiresAt },
      });
    }),
  );

  const origin = await resolveOrigin();
  const resetUrl = `${origin}/account/password_reset/${rawToken}`;

  const result = await sendMail({
    to: user.email,
    subject: "tech-event パスワード再設定のご案内",
    text: [
      "tech-event のパスワード再設定リンクです。",
      "",
      "以下の URL を 1 時間以内に開いて、新しいパスワードを設定してください。",
      resetUrl,
      "",
      "心当たりがない場合は、このメールを無視してください (パスワードは変更されません)。",
    ].join("\n"),
    html: [
      "<p>tech-event のパスワード再設定リンクです。</p>",
      "<p>以下のリンクを 1 時間以内に開いて、新しいパスワードを設定してください。</p>",
      `<p><a href="${resetUrl}">${resetUrl}</a></p>`,
      "<p>心当たりがない場合は、このメールを無視してください (パスワードは変更されません)。</p>",
    ].join(""),
  });
  incrementCounter(METRIC_NAMES.MAIL_SENT_TOTAL, {
    provider: getMailProvider(),
    delivered: result.delivered ? "true" : "false",
  });

  void recordAudit({
    actorUserId: user.id,
    action: "password_reset.requested",
    targetType: "User",
    targetId: user.id,
  });

  return { ok: true };
}

/**
 * トークンを検証して新しいパスワードを設定する。
 *
 * - トークン不正 / 期限切れ / 使用済みは `ActionError("invalid_token")`。
 * - パスワードが短すぎる等は `ActionError("invalid_input")`。
 */
export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ ok: true }> {
  const parsedToken = TokenSchema.safeParse(token);
  if (!parsedToken.success) {
    throw new ActionError(
      "invalid_token",
      "リセットリンクが無効です。もう一度お試しください。",
    );
  }
  const parsedPassword = PasswordSchema.safeParse(newPassword);
  if (!parsedPassword.success) {
    throw new ActionError(
      "invalid_input",
      "パスワードは 8 文字以上 200 文字以内で入力してください",
      { field: "password" },
    );
  }

  const tokenHash = hashToken(parsedToken.data);
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (
    !row ||
    row.usedAt !== null ||
    row.expiresAt.getTime() < Date.now() ||
    row.user.status !== "active"
  ) {
    throw new ActionError(
      "invalid_token",
      "リセットリンクが無効か、有効期限が切れています。もう一度リセットを要求してください。",
    );
  }

  const passwordHash = await bcrypt.hash(parsedPassword.data, 12);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    // 同一ユーザーの未使用トークンをまとめて無効化 (ワンタイム化 + 古いリンクの失効)
    await tx.passwordResetToken.updateMany({
      where: { userId: row.userId, usedAt: null },
      data: { usedAt: now },
    });
    await tx.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    });
  });

  void recordAudit({
    actorUserId: row.userId,
    action: "password_reset.completed",
    targetType: "User",
    targetId: row.userId,
  });

  return { ok: true };
}
