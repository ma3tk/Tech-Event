/**
 * ログインページ。
 *
 * - メール + パスワード form は `/api/auth/login` (POST) に送信。
 * - 失敗時は `?error=invalid` がついた状態でリダイレクトされ、エラーメッセージを表示。
 * - 成功時は `?next=` で指定された URL にリダイレクトされる。
 * - OAuth ボタン (X / Facebook / GitHub) は Auth.js v5 (next-auth@beta) の
 *   `signIn` Server Action 経由で `/api/auth/signin/<provider>` に飛ばす。
 * - 開発時用に、シードユーザー上位 5 名で即ログインできるリンクを表示する
 *   (本番環境では出さない)。
 *
 * Server Component なので `searchParams` から `next` を受け取りリンクに反映。
 */

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";
import { MagicLinkForm } from "./MagicLinkForm";
import { loadDict, t } from "@/lib/i18n";

type SearchParams = Promise<{ next?: string; error?: string }>;

const IS_DEV_ENV = process.env.NODE_ENV !== "production";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const next = sp.next ?? "/dashboard";
  const error = sp.error;
  const { dict } = await loadDict();

  // 開発用: 適当なシードユーザー 5 名を取得 (active のみ)
  const devUsers = IS_DEV_ENV
    ? await prisma.user.findMany({
        where: { status: "active" },
        orderBy: { id: "asc" },
        take: 5,
        select: { nickname: true, displayName: true },
      })
    : [];

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8 shadow-sm">
        <h1
          data-testid="login-title"
          className="text-center text-2xl font-bold"
        >
          {t(dict, "auth.loginTitle")}
        </h1>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-md border border-status-full-bg bg-status-full-bg px-3 py-2 text-sm text-status-full-fg"
          >
            {error === "invalid"
              ? "メールアドレスまたはパスワードが正しくありません。"
              : "ログインに失敗しました。"}
          </div>
        )}

        {/* ============ メール + パスワード ============ */}
        <form action="/api/auth/login" method="post" className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next} />

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
              autoComplete="username"
              required
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-brand-orange focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-brand-orange focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              name="remember"
              className="rounded border-border"
            />
            ログイン状態を保持する
          </label>

          <button
            type="submit"
            className="w-full rounded-md bg-brand-orange py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-orange-hover"
          >
            ログインする
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <Link
            href="/account/password_reset"
            className="text-link hover:text-link-hover"
          >
            パスワードを忘れた方はこちら
          </Link>
        </div>

        {/* ============ Magic Link (パスワードレス) ============ */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-2 text-muted-foreground">
              または
            </span>
          </div>
        </div>

        <MagicLinkForm />

        {/* ============ OAuth ============ */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-2 text-muted-foreground">
              SNSでログイン
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <OAuthForm
            provider="twitter"
            label="X (Twitter) でログイン"
            next={next}
          />
          <OAuthForm
            provider="facebook"
            label="Facebook でログイン"
            next={next}
          />
          <OAuthForm
            provider="github"
            label="GitHub でログイン"
            next={next}
          />
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          アカウントをお持ちでない方は{" "}
          <Link
            href={`/signup${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-semibold text-link hover:text-link-hover"
          >
            新規登録
          </Link>
        </p>

        {/* ============ 開発用 ============ */}
        {IS_DEV_ENV && devUsers.length > 0 && (
          <div
            className="mt-8 rounded-md border border-dashed border-border bg-background p-4"
            data-testid="dev-login-section"
          >
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              開発用: シードユーザーでログイン
            </p>
            <ul className="space-y-1 text-sm">
              {devUsers.map((u) => {
                const href = `/api/auth/dev-login?nickname=${encodeURIComponent(
                  u.nickname,
                )}&next=${encodeURIComponent(next)}`;
                return (
                  <li key={u.nickname}>
                    <a
                      href={href}
                      className="text-link hover:text-link-hover"
                      data-testid={`dev-login-${u.nickname}`}
                    >
                      {u.displayName}{" "}
                      <span className="text-muted-foreground">
                        @{u.nickname}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-[11px] text-muted-foreground">
              ※ 開発環境専用。production では 404 を返します。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function OAuthForm({
  provider,
  label,
  next,
}: {
  provider: "twitter" | "facebook" | "github";
  label: string;
  next: string;
}) {
  const colorMap: Record<string, string> = {
    twitter: "bg-black text-white hover:bg-zinc-800",
    facebook: "bg-[#1877f2] text-white hover:bg-[#155fc1]",
    github: "bg-zinc-900 text-white hover:bg-zinc-700",
  };
  // Auth.js v5 の signIn() Server Action を form action として利用。
  // クリックすると `/api/auth/signin/<provider>` にリダイレクトされる。
  async function action() {
    "use server";
    await signIn(provider, { redirectTo: next });
  }
  return (
    <form action={action}>
      <button
        type="submit"
        data-testid={`oauth-signin-${provider}`}
        className={`w-full rounded-md py-2.5 text-sm font-semibold shadow ${colorMap[provider]}`}
      >
        {label}
      </button>
    </form>
  );
}
