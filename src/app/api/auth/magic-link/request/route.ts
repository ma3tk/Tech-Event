/**
 * Magic Link 発行エンドポイント (Luma を参考にしたパスワードレスログイン)。
 *
 * POST /api/auth/magic-link/request
 *   - body: `{ email: string }` (application/json or x-www-form-urlencoded)
 *   - 動作:
 *     1. メールアドレスを zod でバリデート
 *     2. UUID v4 トークンを生成し `MagicLinkToken` テーブルに保存 (期限 15 分)
 *     3. メール送信は console.log でモック
 *     4. アカウントの有無を漏らさないため、形式が正しい限り常に `{ok: true}` を返す
 *
 * セキュリティ:
 *   - レスポンスはアカウントの存在有無を返さない (enumeration attack 対策)
 *   - トークンは UUID v4 (122bit のランダム性)
 *   - 期限は 15 分
 */
import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";

const RequestSchema = z.object({
  email: z.string().email().max(254),
});

/** 期限: 15 分 */
const TOKEN_TTL_MS = 15 * 60 * 1000;

async function parseBody(
  request: NextRequest,
): Promise<{ email: string } | null> {
  const contentType = request.headers.get("content-type") ?? "";
  let raw: Record<string, unknown> = {};
  if (contentType.includes("application/json")) {
    try {
      raw = (await request.json()) as Record<string, unknown>;
    } catch {
      return null;
    }
  } else {
    const form = await request.formData();
    raw = Object.fromEntries(form.entries());
  }
  const parsed = RequestSchema.safeParse(raw);
  if (!parsed.success) return null;
  return { email: parsed.data.email.toLowerCase() };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const payload = await parseBody(request);
  if (!payload) {
    return NextResponse.json(
      { ok: false, error: "invalid_email" },
      { status: 400 },
    );
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.magicLinkToken.create({
    data: {
      id: token,
      email: payload.email,
      expiresAt,
    },
  });

  // メール送信: SMTP_URL が設定されていれば実送信、未設定なら console.log にフォールバック
  const origin = request.nextUrl.origin;
  const verifyUrl = `${origin}/api/auth/magic-link/verify?token=${token}`;
  // 既存 E2E (e2e/magic-link.spec.ts) は console.log の verifyUrl を直接見ているわけでは
  // ないが、開発時にコンソールへ verify URL を出す互換性を維持するため、ログは sendMail
  // 内部のフォールバックに任せつつ、ここでも 1 行だけ出力する。
  console.log(`[magic-link] ${verifyUrl}`);
  await sendMail({
    to: payload.email,
    subject: "tech-event ログイン用リンク",
    text: [
      "tech-event のログインリンクです。",
      "",
      "以下の URL を 15 分以内にクリックすると、ログインが完了します。",
      verifyUrl,
      "",
      "心当たりがない場合は、このメールを無視してください。",
    ].join("\n"),
    html: [
      "<p>tech-event のログインリンクです。</p>",
      "<p>以下のリンクを 15 分以内にクリックすると、ログインが完了します。</p>",
      `<p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
      "<p>心当たりがない場合は、このメールを無視してください。</p>",
    ].join(""),
  });

  return NextResponse.json({
    ok: true,
    message: "メールを送信しました",
  });
}
