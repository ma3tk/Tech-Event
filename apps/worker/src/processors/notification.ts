/**
 * 通知送信 (`notification` queue) の processor。
 *
 * メール / Slack の 2 種類をサポート。worker 内に最小実装を置き、Next.js 依存
 * (`@/env` 等) を回避する。SMTP / Resend / SendGrid の本格的な切替は将来的に
 * `libs/shared/util-storage/mailer` を抽出して共有することを想定。
 *
 * 失敗時は BullMQ の attempts=3 / exponential backoff で再試行され、最終失敗で
 * `notification-dlq` (DLQ) に push される (`pushDeadLetter`)。
 */
import type {
  NotificationData,
  EmailNotificationData,
  SlackNotificationData,
} from "@tech-event/shared-data-access-queue";

import { logger } from "../logger";

export async function processNotificationJob(data: NotificationData): Promise<{
  delivered: boolean;
  channel: "email" | "slack";
}> {
  if (data.kind === "email") {
    await deliverEmail(data);
    return { delivered: true, channel: "email" };
  }
  if (data.kind === "slack") {
    await deliverSlack(data);
    return { delivered: true, channel: "slack" };
  }
  throw new Error(`unknown notification kind: ${(data as { kind: string }).kind}`);
}

async function deliverEmail(d: EmailNotificationData): Promise<void> {
  // SMTP_URL / RESEND_API_KEY / SENDGRID_API_KEY 未設定なら console 出力で fallback
  const provider = (process.env.MAIL_PROVIDER ?? "").toLowerCase();
  if (!provider || provider === "console") {
    logger.info(
      { to: d.to, subject: d.subject },
      "[console-mail] (no provider configured)",
    );
    return;
  }

  if (provider === "smtp") {
    const { default: nodemailer } = await import("nodemailer");
    const transport = nodemailer.createTransport(process.env.SMTP_URL);
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? "noreply@tech-event.local",
      to: d.to,
      subject: d.subject,
      text: d.text,
      html: d.html,
    });
    return;
  }

  if (provider === "resend") {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY ?? "");
    await resend.emails.send({
      from: process.env.SMTP_FROM ?? "noreply@tech-event.local",
      to: d.to,
      subject: d.subject,
      text: d.text,
      html: d.html ?? d.text,
    });
    return;
  }

  if (provider === "sendgrid") {
    const sg = await import("@sendgrid/mail");
    sg.default.setApiKey(process.env.SENDGRID_API_KEY ?? "");
    await sg.default.send({
      from: process.env.SMTP_FROM ?? "noreply@tech-event.local",
      to: d.to,
      subject: d.subject,
      text: d.text,
      html: d.html ?? d.text,
    });
    return;
  }

  throw new Error(`unknown MAIL_PROVIDER: ${provider}`);
}

async function deliverSlack(d: SlackNotificationData): Promise<void> {
  // Webhook URL のホスト allowlist は受付時 (Server Action 側) で行う想定。
  // ここでは渡された URL に POST するだけ。
  const res = await fetch(d.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: d.text, blocks: d.blocks }),
  });
  if (!res.ok) {
    throw new Error(`slack webhook failed: ${res.status} ${res.statusText}`);
  }
}
