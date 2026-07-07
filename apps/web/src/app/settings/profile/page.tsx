/**
 * プロフィール編集ページ `/settings/profile`
 *
 * - 認証必須。未ログインは /login にリダイレクト (本人のみ編集可)。
 * - `User` の編集可能フィールド (表示名 / ニックネーム / 自己紹介 / 所属 /
 *   場所 / Web サイト / X / Facebook / GitHub) を 1 フォームで更新する。
 * - 更新は `updateProfile` Server Action (Zod 検証つき) 経由。
 * - 保存成功で `?saved=1`、検証エラーは `?error=<code>&message=...` で戻す
 *   (`/settings/notifications` の実装スタイルを踏襲)。
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { getCurrentUser } from "@/lib/auth";
import { updateProfile } from "@tech-event/web-feature-user";
import { isActionError } from "@/lib/action-error";
import Breadcrumb from "@/components/Breadcrumb";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "プロフィール編集",
  description:
    "tech-event の公開プロフィール (表示名・自己紹介・所属・SNS アカウント) を編集します。",
};

type SearchParams = Promise<{ saved?: string; error?: string; message?: string }>;

async function submitAction(formData: FormData): Promise<void> {
  "use server";
  const str = (key: string): string => String(formData.get(key) ?? "");

  let errorCode: string | null = null;
  let errorMessage: string | null = null;
  try {
    await updateProfile({
      displayName: str("displayName"),
      nickname: str("nickname"),
      bio: str("bio"),
      affiliation: str("affiliation"),
      location: str("location"),
      websiteUrl: str("websiteUrl"),
      xAccount: str("xAccount"),
      facebookAccount: str("facebookAccount"),
      githubAccount: str("githubAccount"),
    });
  } catch (e) {
    if (isActionError(e)) {
      errorCode = e.code;
      errorMessage = e.userMessage;
    } else {
      throw e;
    }
  }
  if (errorCode) {
    const sp = new URLSearchParams({ error: errorCode });
    if (errorMessage) sp.set("message", errorMessage);
    redirect(`/settings/profile?${sp.toString()}`);
  }
  redirect("/settings/profile?saved=1");
}

/** テキスト入力 1 行分 (label + input) */
function Field({
  id,
  label,
  defaultValue,
  required,
  placeholder,
  hint,
  type = "text",
  pattern,
  title,
  maxLength,
}: {
  id: string;
  label: string;
  defaultValue: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  type?: string;
  pattern?: string;
  title?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-foreground"
      >
        {label}
        {required && <span className="ml-1 text-status-full-fg">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        pattern={pattern}
        title={title}
        maxLength={maxLength}
        data-testid={`profile-${id}`}
        className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-brand-orange focus:outline-none"
      />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default async function ProfileSettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/settings/profile");
  }

  const sp = await searchParams;
  const saved = sp.saved === "1";
  const error = sp.error;
  const message = sp.message;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: "設定", href: "/settings/profile" },
          { label: "プロフィール編集" },
        ]}
      />
      <h1 className="mt-4 text-2xl font-bold">プロフィール編集</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        公開プロフィール (
        <Link
          href={`/user/${user.nickname}`}
          className="text-link hover:text-link-hover"
        >
          @{user.nickname}
        </Link>
        ) に表示される情報を編集できます。
      </p>

      {saved && (
        <p
          role="status"
          data-testid="profile-settings-saved"
          className="mt-4 rounded-md border border-brand-orange bg-brand-orange-soft px-3 py-2 text-sm text-brand-orange"
        >
          プロフィールを保存しました。
        </p>
      )}

      {error && (
        <p
          role="alert"
          data-testid="profile-settings-error"
          className="mt-4 rounded-md border border-status-full-bg bg-status-full-bg px-3 py-2 text-sm text-status-full-fg"
        >
          {message || "入力内容をご確認ください。"}
        </p>
      )}

      <form
        action={submitAction}
        className="mt-6 space-y-6"
        data-testid="profile-form"
      >
        <section className="space-y-4 rounded-md border border-border bg-surface p-4">
          <h2 className="text-sm font-bold">基本情報</h2>
          <Field
            id="displayName"
            label="表示名"
            defaultValue={user.displayName}
            required
            maxLength={50}
          />
          <Field
            id="nickname"
            label="ニックネーム"
            defaultValue={user.nickname}
            required
            pattern="[A-Za-z0-9_\-]{3,30}"
            title="半角英数字 + _ - のみ、3 ～ 30 文字"
            hint={`半角英数字と _ - 、3 ～ 30 文字。プロフィール URL (/user/${user.nickname}) に使われます。`}
          />
          <div>
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-foreground"
            >
              自己紹介
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              maxLength={1000}
              defaultValue={user.bio ?? ""}
              data-testid="profile-bio"
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-brand-orange focus:outline-none"
            />
            <p className="mt-1 text-xs text-muted-foreground">1000 文字まで</p>
          </div>
          <Field
            id="affiliation"
            label="所属 (会社・組織)"
            defaultValue={user.affiliation ?? ""}
            maxLength={100}
          />
          <Field
            id="location"
            label="場所"
            defaultValue={user.location ?? ""}
            placeholder="例: 東京都"
            maxLength={100}
          />
        </section>

        <section className="space-y-4 rounded-md border border-border bg-surface p-4">
          <h2 className="text-sm font-bold">Web サイト / SNS</h2>
          <Field
            id="websiteUrl"
            label="Web サイト URL"
            defaultValue={user.websiteUrl ?? ""}
            type="url"
            placeholder="https://example.com"
            maxLength={300}
          />
          <Field
            id="xAccount"
            label="X (Twitter) アカウント"
            defaultValue={user.xAccount ?? ""}
            placeholder="例: tech_event"
            hint="@ を除いたアカウント名"
            maxLength={100}
          />
          <Field
            id="facebookAccount"
            label="Facebook アカウント"
            defaultValue={user.facebookAccount ?? ""}
            maxLength={100}
          />
          <Field
            id="githubAccount"
            label="GitHub アカウント"
            defaultValue={user.githubAccount ?? ""}
            placeholder="例: octocat"
            maxLength={100}
          />
        </section>

        <div className="flex items-center justify-between">
          <Link
            href="/account/withdraw"
            className="text-sm text-muted-foreground underline hover:text-foreground"
            data-testid="profile-withdraw-link"
          >
            退会をご希望の方はこちら
          </Link>
          <button
            type="submit"
            data-testid="profile-save"
            className="inline-flex h-10 items-center rounded-md bg-brand-orange px-5 text-sm font-semibold text-white shadow hover:bg-brand-orange-hover"
          >
            保存する
          </button>
        </div>
      </form>
    </div>
  );
}
