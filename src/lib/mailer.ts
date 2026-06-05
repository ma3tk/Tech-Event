/**
 * SMTP メール送信ヘルパー。
 *
 * - `SMTP_URL` (例: `smtp://user:pass@host:587`) が設定されていれば nodemailer
 *   transport を構築して送信する。
 * - `SMTP_URL` が未設定なら **console.log にフォールバック** する。これにより
 *   開発環境や CI/E2E では追加設定なしで動作する。
 * - `SMTP_FROM` (例: `tech-event <noreply@tech-event.local>`) が From に使われる。
 *   未設定なら `noreply@tech-event.local` をデフォルトとして用いる。
 *
 * 開発時の SMTP 確認は Mailpit が手軽:
 *   docker run --rm -p 1025:1025 -p 8025:8025 axllent/mailpit
 *   # .env で SMTP_URL=smtp://localhost:1025
 *   # ブラウザ: http://localhost:8025 で送信メールを確認
 */
import type { Transporter } from "nodemailer";

/** 送信ペイロード */
export interface SendMailInput {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

/** SMTP 設定が無いときに使うデフォルト From */
const DEFAULT_FROM = "noreply@tech-event.local";

let _transporter: Transporter | null | undefined;

async function getTransporter(): Promise<Transporter | null> {
  if (_transporter !== undefined) return _transporter;
  const url = process.env.SMTP_URL;
  if (!url) {
    _transporter = null;
    return null;
  }
  // nodemailer は dynamic import (CJS interop) で読み込む
  const nm = await import("nodemailer");
  _transporter = nm.createTransport(url);
  return _transporter;
}

/**
 * メールを送信する。SMTP_URL 未設定なら console.log にフォールバックする。
 * 戻り値:
 *   - `delivered: true` 実際の SMTP 送信を行った
 *   - `delivered: false` console.log フォールバックで送信していない
 */
export async function sendMail(
  input: SendMailInput,
): Promise<{ delivered: boolean; messageId?: string }> {
  const from = process.env.SMTP_FROM || DEFAULT_FROM;

  const transporter = await getTransporter();

  if (!transporter) {
    // console.log フォールバック (現状互換の挙動)
    const lines = [
      `[mail:fallback] to=${input.to}`,
      `[mail:fallback] from=${from}`,
      `[mail:fallback] subject=${input.subject}`,
    ];
    if (input.text) lines.push(`[mail:fallback] text=${input.text}`);
    if (input.html && !input.text)
      lines.push(`[mail:fallback] html=${input.html}`);
    for (const l of lines) console.log(l);
    return { delivered: false };
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
    // SMTP エラーは握りつぶさず log してフォールバック (UX を止めない)
    console.error(`[mail:error] sendMail failed: ${(err as Error).message}`);
    console.log(
      `[mail:fallback] to=${input.to} subject=${input.subject} (after error)`,
    );
    return { delivered: false };
  }
}

/**
 * テスト用: transporter キャッシュをリセットする。
 */
export function resetTransporterCacheForTesting(): void {
  _transporter = undefined;
}
