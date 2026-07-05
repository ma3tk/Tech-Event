/**
 * 退会 (アカウント削除) 確認ページ `/account/withdraw`
 *
 * - 認証必須。未ログインは /login にリダイレクト。
 * - 退会内容の確認 → 同意チェック → 実行の 2 段階。
 * - 実行すると `withdrawAccount` Server Action が `User.status = "withdrawn"` を
 *   set + セッションを破棄し、`/login?withdrawn=1` にリダイレクトする。
 * - 退会後は既存の withdrawn 分岐によりログイン不可・プロフィール非公開になる。
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { getCurrentUser } from "@/lib/auth";
import { withdrawAccount } from "@tech-event/web-feature-user";
import Breadcrumb from "@/components/Breadcrumb";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "退会の手続き",
  description: "tech-event の退会 (アカウント削除) 手続きページです。",
};

type SearchParams = Promise<{ error?: string }>;

async function submitAction(formData: FormData): Promise<void> {
  "use server";
  if (formData.get("confirm") !== "1") {
    redirect("/account/withdraw?error=confirm");
  }
  await withdrawAccount();
  redirect("/login?withdrawn=1");
}

export default async function WithdrawPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/account/withdraw");
  }

  const sp = await searchParams;
  const error = sp.error;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: "設定", href: "/settings/profile" },
          { label: "退会の手続き" },
        ]}
      />
      <h1 className="mt-4 text-2xl font-bold" data-testid="withdraw-title">
        退会の手続き
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        @{user.nickname} ({user.displayName}) さんのアカウントを退会します。
      </p>

      {error && (
        <p
          role="alert"
          data-testid="withdraw-error"
          className="mt-4 rounded-md border border-status-full-bg bg-status-full-bg px-3 py-2 text-sm text-status-full-fg"
        >
          {error === "confirm"
            ? "退会するには注意事項への同意が必要です。"
            : "退会の手続きに失敗しました。もう一度お試しください。"}
        </p>
      )}

      <section className="mt-6 rounded-md border border-border bg-surface p-4">
        <h2 className="text-sm font-bold">退会前にご確認ください</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-foreground">
          <li>退会するとログインできなくなります。</li>
          <li>
            公開プロフィールページ (
            <Link
              href={`/user/${user.nickname}`}
              className="text-link hover:text-link-hover"
            >
              /user/{user.nickname}
            </Link>
            ) は表示されなくなります。
          </li>
          <li>
            参加履歴・コメントなどの投稿済みコンテンツは、イベント運営の記録として残る場合があります。
          </li>
          <li>
            主催中のグループ・イベントがある場合は、退会前に他の管理者への引き継ぎをおすすめします。
          </li>
        </ul>
      </section>

      <form action={submitAction} className="mt-6 space-y-4" data-testid="withdraw-form">
        <label className="flex items-start gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            name="confirm"
            value="1"
            required
            data-testid="withdraw-confirm"
            className="mt-1 rounded border-border"
          />
          <span>上記の注意事項を確認し、退会に同意します</span>
        </label>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            data-testid="withdraw-submit"
            className="inline-flex h-10 items-center rounded-md bg-status-full-fg px-5 text-sm font-semibold text-white shadow hover:opacity-90"
          >
            退会する
          </button>
          <Link
            href="/settings/profile"
            className="text-sm text-link hover:text-link-hover"
            data-testid="withdraw-cancel"
          >
            キャンセルして戻る
          </Link>
        </div>
      </form>
    </div>
  );
}
