/**
 * 新規登録ページ (UI のみ)
 *
 * 入力項目:
 * - メール / パスワード (確認用含む) / ニックネーム / 表示名
 * - 利用規約同意 (必須)
 *
 * OAuth (X / Facebook / GitHub) でも登録可能。
 */

import Link from "next/link";
import { loadDict, t } from "@/lib/i18n";

type SearchParams = Promise<{ next?: string; error?: string }>;

export default async function SignupPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const next = sp.next ?? "/dashboard";
  const error = sp.error;
  const { dict } = await loadDict();

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8 shadow-sm">
        <h1
          data-testid="signup-title"
          className="text-center text-2xl font-bold"
        >
          {t(dict, "auth.signupTitle")}
        </h1>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-md border border-status-full-bg bg-status-full-bg px-3 py-2 text-sm text-status-full-fg"
          >
            登録に失敗しました。入力内容をご確認ください。
          </div>
        )}

        {/* ============ OAuth (上に配置: タップ離脱を防ぐ) ============ */}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          外部アカウントで簡単登録
        </p>
        <div className="mt-2 space-y-2">
          <OAuthForm provider="twitter" label="X (Twitter) で登録" />
          <OAuthForm provider="facebook" label="Facebook で登録" />
          <OAuthForm provider="github" label="GitHub で登録" />
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-2 text-muted-foreground">
              またはメールで登録
            </span>
          </div>
        </div>

        {/* ============ メール登録フォーム ============ */}
        <form action="/api/auth/signup" method="post" className="space-y-4">
          <input type="hidden" name="callbackUrl" value={next} />

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              メールアドレス <span className="text-status-full-fg">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-brand-orange focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="nickname"
              className="block text-sm font-medium text-foreground"
            >
              ニックネーム (URL に使われます){" "}
              <span className="text-status-full-fg">*</span>
            </label>
            <input
              id="nickname"
              name="nickname"
              type="text"
              autoComplete="username"
              required
              pattern="[A-Za-z0-9_\-]{3,30}"
              title="半角英数字 + _ - のみ、3 ～ 30 文字"
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-brand-orange focus:outline-none"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              半角英数字と <code>_</code> <code>-</code>、3 ～ 30 文字 (登録後変更不可)
            </p>
          </div>

          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-foreground"
            >
              表示名 <span className="text-status-full-fg">*</span>
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              required
              maxLength={50}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-brand-orange focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              パスワード <span className="text-status-full-fg">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-brand-orange focus:outline-none"
            />
            <p className="mt-1 text-xs text-muted-foreground">8 文字以上</p>
          </div>

          <div>
            <label
              htmlFor="passwordConfirm"
              className="block text-sm font-medium text-foreground"
            >
              パスワード (確認){" "}
              <span className="text-status-full-fg">*</span>
            </label>
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-brand-orange focus:outline-none"
            />
          </div>

          <label className="flex items-start gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              name="agreeTerms"
              required
              className="mt-1 rounded border-border"
            />
            <span>
              <Link
                href="/terms"
                target="_blank"
                className="text-link hover:text-link-hover"
              >
                利用規約
              </Link>
              {" と "}
              <Link
                href="/privacy"
                target="_blank"
                className="text-link hover:text-link-hover"
              >
                プライバシーポリシー
              </Link>
              に同意します
            </span>
          </label>

          <button
            type="submit"
            className="w-full rounded-md bg-brand-orange py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-orange-hover"
          >
            登録する
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          すでにアカウントをお持ちの方は{" "}
          <Link
            href={`/login${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-semibold text-link hover:text-link-hover"
          >
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}

function OAuthForm({
  provider,
  label,
}: {
  provider: "twitter" | "facebook" | "github";
  label: string;
}) {
  const colorMap: Record<string, string> = {
    twitter: "bg-black text-white hover:bg-zinc-800",
    facebook: "bg-[#1877f2] text-white hover:bg-[#155fc1]",
    github: "bg-zinc-900 text-white hover:bg-zinc-700",
  };
  return (
    <form action={`/api/auth/signin/${provider}`} method="post">
      <button
        type="submit"
        className={`w-full rounded-md py-2.5 text-sm font-semibold shadow ${colorMap[provider]}`}
      >
        {label}
      </button>
    </form>
  );
}
