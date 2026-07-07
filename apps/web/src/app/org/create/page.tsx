/**
 * Organization 作成ページ (Server Component + Server Action)
 *
 * - 未ログイン時は `/login?next=/org/create` にリダイレクト
 * - フォーム送信は createOrganization Server Action へ
 * - エラー / 入力復元は searchParams 経由 (calendar/create と同パターン)
 */

import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { createOrganization } from "@tech-event/web-feature-calendar";

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

export default async function OrganizationCreatePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/org/create")}`);
  }

  const sp = await searchParams;
  const error = pickString(sp, "error");
  const message = pickString(sp, "message");

  const defaults = {
    slug: pickString(sp, "slug"),
    name: pickString(sp, "name"),
    description: pickString(sp, "description"),
    logoUrl: pickString(sp, "logoUrl"),
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Organization を作成する</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        複数のカレンダーを 1 つの組織にまとめて、配下のイベントを集約表示します。
        slug は作成後に変更できません。
      </p>

      {error && (
        <div
          role="alert"
          data-testid="org-create-error"
          className="mt-6 rounded-md border border-status-full-bg bg-status-full-bg/20 px-4 py-3 text-sm text-status-full-fg"
        >
          <strong className="font-semibold">エラー:</strong> {message || error}
        </div>
      )}

      <form
        action={createOrganization}
        method="post"
        className="mt-6 space-y-6 rounded-lg border border-border bg-surface p-6"
        data-testid="org-create-form"
      >
        <Field
          label="slug"
          htmlFor="slug"
          help="半角英小文字・数字・ハイフン (3〜63 文字)。後から変更できません。"
          required
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">/org/</span>
            <input
              id="slug"
              name="slug"
              type="text"
              required
              minLength={3}
              maxLength={63}
              pattern="[a-z0-9\-]+"
              defaultValue={defaults.slug}
              className="block w-64 rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
            />
          </div>
        </Field>

        <Field
          label="組織名"
          htmlFor="name"
          help="例: Tech Community Tokyo"
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

        <Field
          label="説明 (Markdown)"
          htmlFor="description"
          help="この組織の活動方針などを記述します。"
        >
          <textarea
            id="description"
            name="description"
            rows={6}
            maxLength={20000}
            defaultValue={defaults.description}
            className="block w-full rounded-md border border-border bg-white px-3 py-2 font-mono text-sm focus:border-brand-orange focus:outline-none"
          />
        </Field>

        <Field label="ロゴ画像 URL" htmlFor="logoUrl">
          <input
            id="logoUrl"
            name="logoUrl"
            type="url"
            maxLength={2000}
            defaultValue={defaults.logoUrl}
            placeholder="https://..."
            className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
          />
        </Field>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Link
            href="/calendars"
            className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-brand-orange-soft"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            data-testid="org-create-submit"
            className="inline-flex h-10 items-center rounded-md bg-brand-orange px-5 text-sm font-semibold text-white shadow hover:bg-brand-orange-hover"
          >
            Organization を作成
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
