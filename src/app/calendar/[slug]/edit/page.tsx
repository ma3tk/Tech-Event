/**
 * Calendar 編集ページ (所有者のみ)
 *
 * - 未ログイン or 所有者でない場合は notFound / redirect。
 * - フォーム送信は updateCalendar Server Action。
 */

import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { updateCalendar } from "@/app/actions/calendar-actions";

export const dynamic = "force-dynamic";

export default async function CalendarEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/calendar/${slug}/edit`)}`,
    );
  }

  const cal = await prisma.calendar.findUnique({ where: { slug } });
  if (!cal) notFound();
  if (cal.ownerUserId !== user.id) {
    redirect(`/calendar/${slug}`);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">カレンダーを編集</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        slug (/calendar/{cal.slug}) は変更できません。
      </p>

      <form
        action={updateCalendar}
        method="post"
        className="mt-6 space-y-6 rounded-lg border border-border bg-surface p-6"
        data-testid="calendar-edit-form"
      >
        <input type="hidden" name="calendarId" value={cal.id.toString()} />

        <Field label="カレンダー名" htmlFor="name" required>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={120}
            defaultValue={cal.name}
            className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
          />
        </Field>

        <Field label="説明 (Markdown)" htmlFor="description">
          <textarea
            id="description"
            name="description"
            rows={6}
            maxLength={20000}
            defaultValue={cal.description ?? ""}
            className="block w-full rounded-md border border-border bg-white px-3 py-2 font-mono text-sm focus:border-brand-orange focus:outline-none"
          />
        </Field>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field label="カバー画像 URL" htmlFor="coverImageUrl">
            <input
              id="coverImageUrl"
              name="coverImageUrl"
              type="url"
              maxLength={2000}
              defaultValue={cal.coverImageUrl ?? ""}
              placeholder="https://..."
              className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
            />
          </Field>
          <Field label="テーマ色" htmlFor="tintColor">
            <input
              id="tintColor"
              name="tintColor"
              type="text"
              maxLength={20}
              defaultValue={cal.tintColor ?? ""}
              placeholder="#5b21b6"
              className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Link
            href={`/calendar/${cal.slug}`}
            className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-brand-orange-soft"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            data-testid="calendar-edit-submit"
            className="inline-flex h-10 items-center rounded-md bg-brand-orange px-5 text-sm font-semibold text-white shadow hover:bg-brand-orange-hover"
          >
            保存
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
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
    </div>
  );
}
