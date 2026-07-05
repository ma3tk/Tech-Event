/**
 * パスワードリセット要求ページ `/account/password_reset`
 *
 * - ログインページの「パスワードを忘れた方はこちら」リンクの遷移先。
 * - メールアドレスを入力すると、リセットリンクを記載したメールを送信する
 *   (`requestPasswordReset` Server Action)。
 * - アカウントの有無を漏らさないため、送信後は常に「メールを送信しました」
 *   と表示する (enumeration attack 対策)。
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { requestPasswordReset } from "@tech-event/web-feature-user";
import { isActionError } from "@/lib/action-error";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "パスワードの再設定",
  description:
    "登録済みのメールアドレスにパスワード再設定用のリンクを送信します。",
};

type SearchParams = Promise<{ sent?: string; error?: string }>;

async function submitAction(formData: FormData): Promise<void> {
  "use server";
  const email = String(formData.get("email") ?? "");
  let errorCode: string | null = null;
  try {
    await requestPasswordReset(email);
  } catch (e) {
    if (isActionError(e)) {
      errorCode = e.code;
    } else {
      throw e;
    }
  }
  if (errorCode) {
    redirect(`/account/password_reset?error=${encodeURIComponent(errorCode)}`);
  }
  redirect("/account/password_reset?sent=1");
}

export default async function PasswordResetRequestPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const sent = sp.sent === "1";
  const error = sp.error;

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8 shadow-sm">
        <h1
          data-testid="password-reset-title"
          className="text-center text-2xl font-bold"
        >
          パスワードの再設定
        </h1>

        <p className="mt-4 text-sm text-muted-foreground">
          登録済みのメールアドレスを入力してください。パスワード再設定用のリンクをお送りします
          (リンクの有効期限は 1 時間です)。
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-md border border-status-full-bg bg-status-full-bg px-3 py-2 text-sm text-status-full-fg"
          >
            {error === "invalid_input"
              ? "メールアドレスの形式が正しくありません。"
              : "送信に失敗しました。時間をおいて再度お試しください。"}
          </div>
        )}

        {sent ? (
          <div
            role="status"
            data-testid="password-reset-sent"
            className="mt-6 rounded-md border border-brand-orange bg-brand-orange-soft px-3 py-3 text-sm text-brand-orange"
          >
            <p className="font-semibold">メールを送信しました。</p>
            <p className="mt-1">
              入力されたメールアドレスにアカウントが登録されている場合、パスワード再設定用のリンクが届きます。メールが届かない場合は、迷惑メールフォルダもご確認ください。
            </p>
          </div>
        ) : (
          <form action={submitAction} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                data-testid="password-reset-email"
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-brand-orange focus:outline-none"
              />
            </div>

            <button
              type="submit"
              data-testid="password-reset-submit"
              className="w-full rounded-md bg-brand-orange py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-orange-hover"
            >
              再設定用リンクを送信する
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-link hover:text-link-hover">
            ログインページに戻る
          </Link>
        </p>
      </div>
    </div>
  );
}
