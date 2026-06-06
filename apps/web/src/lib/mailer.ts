/**
 * メール送信抽象化。
 *
 * 環境変数 `MAIL_PROVIDER` でプロバイダを切替える:
 *
 *   - `smtp`     (default): nodemailer (Mailpit / 自前 SMTP)
 *   - `resend`   : Resend (RESEND_API_KEY)
 *   - `sendgrid` : SendGrid (SENDGRID_API_KEY)
 *   - `console`  : console.log フォールバック (CI / dev)
 *
 * 各プロバイダ SDK は **dynamic import** で読み込むため、未使用の SDK は
 * bundle に含まれない (lazy 化)。`MAIL_PROVIDER` 未設定 + `SMTP_URL` 未設定なら
 * `console` フォールバックで動作する (= 既存挙動の互換)。
 *
 * From アドレス:
 *   `SMTP_FROM` を全プロバイダ共通で使う (例: `tech-event <noreply@example.com>`).
 *
 * 開発時の SMTP 確認は Mailpit が手軽:
 *   docker run --rm -p 1025:1025 -p 8025:8025 axllent/mailpit
 *   # .env で SMTP_URL=smtp://localhost:1025
 *   # ブラウザ: http://localhost:8025 で送信メールを確認
 */
import type { Transporter } from "nodemailer";

import { env } from "@/env";

/** 送信ペイロード */
export interface SendMailInput {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export type MailProvider = "smtp" | "resend" | "sendgrid" | "console";

/** SMTP 設定が無いときに使うデフォルト From */
const DEFAULT_FROM = "noreply@tech-event.local";

let _transporter: Transporter | null | undefined;

/** テスト用 in-memory 受信箱 (`E2E_MAIL_CAPTURE=1` 時のみ使用) */
const _captured: SendMailInput[] = [];

function resolveProvider(): MailProvider {
  const explicit = env.MAIL_PROVIDER;
  if (explicit) return explicit;
  // 未指定なら `SMTP_URL` の有無で smtp / console を決める (後方互換)
  if (env.SMTP_URL) return "smtp";
  return "console";
}

async function getSmtpTransporter(): Promise<Transporter | null> {
  if (_transporter !== undefined) return _transporter;
  const url = env.SMTP_URL;
  if (!url) {
    _transporter = null;
    return null;
  }
  // nodemailer は dynamic import (CJS interop) で読み込む
  const nm = await import("nodemailer");
  _transporter = nm.createTransport(url);
  return _transporter;
}

/* ============================================================
 * 各プロバイダ実装
 * ============================================================ */

async function sendViaSmtp(
  input: SendMailInput,
  from: string,
): Promise<{ delivered: boolean; messageId?: string }> {
  const transporter = await getSmtpTransporter();
  if (!transporter) {
    return sendViaConsole(input, from, "smtp_unconfigured");
  }
  try {
    const info = await transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return { delivered: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[mail:smtp:error] ${(err as Error).message}`);
    return sendViaConsole(input, from, "smtp_error");
  }
}

async function sendViaResend(
  input: SendMailInput,
  from: string,
): Promise<{ delivered: boolean; messageId?: string }> {
  const key = env.RESEND_API_KEY;
  if (!key) {
    console.error("[mail:resend] RESEND_API_KEY not set, falling back to console");
    return sendViaConsole(input, from, "resend_unconfigured");
  }
  try {
    const mod = await import("resend");
    const ResendCtor = (mod as unknown as { Resend: new (k: string) => unknown })
      .Resend;
    const client = new ResendCtor(key) as {
      emails: {
        send: (p: {
          from: string;
          to: string | string[];
          subject: string;
          html?: string;
          text?: string;
        }) => Promise<{
          data?: { id?: string } | null;
          error?: { message?: string } | null;
        }>;
      };
    };
    const result = await client.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    if (result.error) {
      console.error(`[mail:resend:error] ${result.error.message ?? "unknown"}`);
      return sendViaConsole(input, from, "resend_api_error");
    }
    return { delivered: true, messageId: result.data?.id };
  } catch (err) {
    console.error(`[mail:resend:error] ${(err as Error).message}`);
    return sendViaConsole(input, from, "resend_exception");
  }
}

async function sendViaSendgrid(
  input: SendMailInput,
  from: string,
): Promise<{ delivered: boolean; messageId?: string }> {
  const key = env.SENDGRID_API_KEY;
  if (!key) {
    console.error(
      "[mail:sendgrid] SENDGRID_API_KEY not set, falling back to console",
    );
    return sendViaConsole(input, from, "sendgrid_unconfigured");
  }
  try {
    const mod = await import("@sendgrid/mail");
    const sg = (mod as unknown as { default?: typeof mod }).default ?? mod;
    const sgmail = sg as unknown as {
      setApiKey: (k: string) => void;
      send: (p: {
        from: string;
        to: string;
        subject: string;
        html?: string;
        text?: string;
      }) => Promise<[{ headers: Record<string, string> }, unknown]>;
    };
    sgmail.setApiKey(key);
    const [resp] = await sgmail.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return {
      delivered: true,
      messageId: resp.headers["x-message-id"] as string | undefined,
    };
  } catch (err) {
    console.error(`[mail:sendgrid:error] ${(err as Error).message}`);
    return sendViaConsole(input, from, "sendgrid_exception");
  }
}

function sendViaConsole(
  input: SendMailInput,
  from: string,
  reason?: string,
): { delivered: boolean } {
  if (env.E2E_MAIL_CAPTURE) {
    _captured.push({ ...input });
  }
  const tag = reason ? `mail:fallback:${reason}` : "mail:fallback";
  const lines = [
    `[${tag}] to=${input.to}`,
    `[${tag}] from=${from}`,
    `[${tag}] subject=${input.subject}`,
  ];
  if (input.text) lines.push(`[${tag}] text=${input.text}`);
  if (input.html && !input.text) lines.push(`[${tag}] html=${input.html}`);
  for (const l of lines) console.log(l);
  return { delivered: false };
}

/* ============================================================
 * 公開 API
 * ============================================================ */

/**
 * メールを送信する。`MAIL_PROVIDER` に従って各プロバイダへ振り分ける。
 * 未設定 / エラー時は console.log フォールバックする。
 *
 * 戻り値:
 *   - `delivered: true`  実際の送信を行った
 *   - `delivered: false` console フォールバック
 */
export async function sendMail(
  input: SendMailInput,
): Promise<{ delivered: boolean; messageId?: string }> {
  const from = env.SMTP_FROM || DEFAULT_FROM;
  const provider = resolveProvider();

  switch (provider) {
    case "resend":
      return sendViaResend(input, from);
    case "sendgrid":
      return sendViaSendgrid(input, from);
    case "smtp":
      return sendViaSmtp(input, from);
    case "console":
    default:
      return sendViaConsole(input, from);
  }
}

/**
 * 現在のプロバイダ識別 (debug / metrics 用)。
 */
export function getMailProvider(): MailProvider {
  return resolveProvider();
}

/**
 * テスト用: capture された送信内容を取り出す (`E2E_MAIL_CAPTURE=1` 時のみ動作)。
 */
export function getCapturedMailsForTesting(): SendMailInput[] {
  return [..._captured];
}

/**
 * テスト用: capture buffer をクリアする。
 */
export function clearCapturedMailsForTesting(): void {
  _captured.length = 0;
}

/**
 * テスト用: transporter キャッシュをリセットする。
 */
export function resetTransporterCacheForTesting(): void {
  _transporter = undefined;
}
