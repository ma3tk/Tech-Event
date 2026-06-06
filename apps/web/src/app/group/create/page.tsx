/**
 * グループ作成ページ (Server Component + Server Action)
 *
 * - 未ログイン時は /login?next=/group/create にリダイレクト
 * - フォーム送信は createGroup Server Action へ
 * - エラー / 入力復元は searchParams 経由 (Server Action から redirect で返される)
 */

import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { createGroup } from "@/app/actions/group-actions";
import MarkdownEditor from "@/components/MarkdownEditorDynamic";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pickString(
  sp: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const v = sp[key];
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

export default async function GroupCreatePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/group/create")}`);
  }

  const sp = await searchParams;
  const error = pickString(sp, "error");
  const message = pickString(sp, "message");

  const defaults = {
    subdomain: pickString(sp, "subdomain"),
    name: pickString(sp, "name"),
    subtitle: pickString(sp, "subtitle"),
    organization: pickString(sp, "organization"),
    description: pickString(sp, "description"),
    coverImageUrl: pickString(sp, "coverImageUrl"),
    thumbnailUrl: pickString(sp, "thumbnailUrl"),
    websiteUrl: pickString(sp, "websiteUrl"),
    xAccount: pickString(sp, "xAccount"),
    facebookUrl: pickString(sp, "facebookUrl"),
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">グループを作成する</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        コミュニティ・勉強会のための新しいグループを作成します。サブドメインは作成後に変更できません。
      </p>

      {error && (
        <div
          role="alert"
          data-testid="group-create-error"
          className="mt-6 rounded-md border border-status-full-bg bg-status-full-bg/20 px-4 py-3 text-sm text-status-full-fg"
        >
          <strong className="font-semibold">エラー:</strong>{" "}
          {message || error}
        </div>
      )}

      <form
        action={createGroup}
        method="post"
        className="mt-6 space-y-6 rounded-lg border border-border bg-surface p-6"
        data-testid="group-create-form"
      >
        <Field
          label="サブドメイン"
          htmlFor="subdomain"
          help="半角英小文字・数字・ハイフン (3〜63 文字)。後から変更できません。"
          required
        >
          <div className="flex items-center gap-2">
            <input
              id="subdomain"
              name="subdomain"
              type="text"
              required
              minLength={3}
              maxLength={63}
              pattern="[a-z0-9\-]+"
              defaultValue={defaults.subdomain}
              className="block w-48 rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
            />
            <span className="text-sm text-muted-foreground">.tech-event</span>
          </div>
        </Field>

        <Field
          label="グループ名"
          htmlFor="name"
          help="例: 〇〇 株式会社 Tech Group"
          required
        >
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={120}
            defaultValue={defaults.name}
            className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
          />
        </Field>

        <Field label="サブタイトル" htmlFor="subtitle">
          <input
            id="subtitle"
            name="subtitle"
            type="text"
            maxLength={200}
            defaultValue={defaults.subtitle}
            className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
          />
        </Field>

        <Field label="主催組織" htmlFor="organization">
          <input
            id="organization"
            name="organization"
            type="text"
            maxLength={200}
            defaultValue={defaults.organization}
            className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
          />
        </Field>

        <Field
          label="グループの説明 (Markdown)"
          htmlFor="description"
          help="GFM Markdown が利用できます。グループ詳細ページに表示されます。"
        >
          <MarkdownEditor
            id="description"
            name="description"
            rows={8}
            maxLength={20_000}
            defaultValue={defaults.description}
            placeholder="## はじめに&#10;このグループでは..."
            testIdPrefix="group-description-editor"
          />
        </Field>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field label="カバー画像 URL" htmlFor="coverImageUrl">
            <input
              id="coverImageUrl"
              name="coverImageUrl"
              type="url"
              maxLength={2000}
              defaultValue={defaults.coverImageUrl}
              placeholder="https://..."
              className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
            />
          </Field>
          <Field label="サムネイル URL" htmlFor="thumbnailUrl">
            <input
              id="thumbnailUrl"
              name="thumbnailUrl"
              type="url"
              maxLength={2000}
              defaultValue={defaults.thumbnailUrl}
              placeholder="https://..."
              className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Field label="公式サイト" htmlFor="websiteUrl">
            <input
              id="websiteUrl"
              name="websiteUrl"
              type="url"
              maxLength={2000}
              defaultValue={defaults.websiteUrl}
              placeholder="https://..."
              className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
            />
          </Field>
          <Field label="X アカウント" htmlFor="xAccount" help="@ なし">
            <input
              id="xAccount"
              name="xAccount"
              type="text"
              maxLength={100}
              defaultValue={defaults.xAccount}
              placeholder="example_jp"
              className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
            />
          </Field>
          <Field label="Facebook ページ URL" htmlFor="facebookUrl">
            <input
              id="facebookUrl"
              name="facebookUrl"
              type="url"
              maxLength={2000}
              defaultValue={defaults.facebookUrl}
              placeholder="https://facebook.com/..."
              className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-brand-orange-soft"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            data-testid="group-create-submit"
            className="inline-flex h-10 items-center rounded-md bg-brand-orange px-5 text-sm font-semibold text-white shadow hover:bg-brand-orange-hover"
          >
            グループを作成
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  help,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  help?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1 block text-sm font-medium text-foreground"
      >
        {label}
        {required && <span className="ml-1 text-status-cancelled-fg">*</span>}
      </label>
      {children}
      {help && <p className="mt-1 text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}
