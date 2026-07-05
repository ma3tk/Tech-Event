/**
 * 新パスワード設定ページ `/account/password_reset/[token]`
 *
 * - パスワードリセットメールに記載されたリンクの遷移先。
 * - 新しいパスワード (確認込み) を入力すると `resetPassword` Server Action が
 *   トークンを検証してパスワードを更新し、`/login?reset=1` にリダイレクトする。
 * - トークン不正 / 期限切れ / 使用済みはエラーメッセージを表示し、
 *   再度リセットを要求するよう促す。
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { resetPassword } from "@tech-event/web-feature-user";
import { isActionError } from "@/lib/action-error";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "新しいパスワードの設定",
  description: "パスワード再設定リンクから新しいパスワードを設定します。",
};

type Params = Promise<{ token: string }>;
type SearchParams = Promise<{ error?: string }>;

async function submitAction(formData: FormData): Promise<void> {
  "use server";
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  const base = `/account/password_reset/${encodeURIComponent(token)}`;

  if (password !== passwordConfirm) {
    redirect(`${base}?error=mismatch`);
  }

  let errorCode: string | null = null;
  try {
    await resetPassword(token, password);
  } catch (e) {
    if (isActionError(e)) {
      errorCode = e.code;
    } else {
      throw e;
    }
  }
  if (errorCode) {
    redirect(`${base}?error=${encodeURIComponent(errorCode)}`);
  }
  redirect("/login?reset=1");
}

function errorMessage(code: string): string {
  switch (code) {
    case "mismatch":
      return "パスワード (確認) が一致しません。";
    case "invalid_input":
      return "パスワードは 8 文字以上 200 文字以内で入力してください。";
    case "invalid_token":
      return "リセットリンクが無効か、有効期限が切れています。もう一度リセットを要求してください。";
    default:
      return "パスワードの再設定に失敗しました。もう一度お試しください。";
  }
}

export default async function PasswordResetTokenPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const error = sp.error;

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8 shadow-sm">
        <h1
          data-testid="password-reset-new-title"
          className="text-center text-2xl font-bold"
        >
          新しいパスワードの設定
        </h1>

        <p className="mt-4 text-sm text-muted-foreground">
          新しいパスワードを入力してください。設定後は新しいパスワードでログインできます。
        </p>

        {error && (
          <div
            role="alert"
            data-testid="password-reset-error"
            className="mt-4 rounded-md border border-status-full-bg bg-status-full-bg px-3 py-2 text-sm text-status-full-fg"
          >
            {errorMessage(error)}
          </div>
        )}

        <form action={submitAction} className="mt-6 space-y-4">
          <input type="hidden" name="token" value={token} />

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              新しいパスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={200}
              data-testid="password-reset-new-password"
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-brand-orange focus:outline-none"
            />
            <p className="mt-1 text-xs text-muted-foreground">8 文字以上</p>
          </div>

          <div>
            <label
              htmlFor="passwordConfirm"
              className="block text-sm font-medium text-foreground"
            >
              新しいパスワード (確認)
            </label>
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={200}
              data-testid="password-reset-new-password-confirm"
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-brand-orange focus:outline-none"
            />
          </div>

          <button
            type="submit"
            data-testid="password-reset-new-submit"
            className="w-full rounded-md bg-brand-orange py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-orange-hover"
          >
            パスワードを設定する
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          リンクの有効期限が切れた場合は{" "}
          <Link
            href="/account/password_reset"
            className="text-link hover:text-link-hover"
          >
            再設定をやり直す
          </Link>
        </p>
      </div>
    </div>
  );
}
