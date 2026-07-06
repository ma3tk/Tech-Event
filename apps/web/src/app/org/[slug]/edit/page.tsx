/**
 * Organization 編集ページ (owner のみ)
 *
 * - 未ログインは `/login?next=...`、非 owner は `/org/{slug}` へリダイレクト
 * - 名前 / 説明 / ロゴの編集は updateOrganization Server Action
 * - 自分のカレンダーの org への割り当て / 解除は assignCalendarToOrg
 *   (既存 calendar-actions には触れず Calendar.organizationId のみ更新)
 */

import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  assignCalendarToOrg,
  updateOrganization,
} from "@tech-event/web-feature-calendar";

export const dynamic = "force-dynamic";

export default async function OrganizationEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/org/${slug}/edit`)}`);
  }

  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) notFound();
  if (org.ownerUserId !== user.id) {
    redirect(`/org/${slug}`);
  }

  // 自分がオーナーの active カレンダー一覧 (割り当て / 解除の対象)
  const myCalendars = await prisma.calendar.findMany({
    where: { ownerUserId: user.id, status: "active" },
    orderBy: { id: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      organizationId: true,
      subscriberCount: true,
      eventCount: true,
    },
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Organization を編集</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        slug (/org/{org.slug}) は変更できません。
      </p>

      {/* ============ 基本情報 ============ */}
      <form
        action={updateOrganization}
        method="post"
        className="mt-6 space-y-6 rounded-lg border border-border bg-surface p-6"
        data-testid="org-edit-form"
      >
        <input type="hidden" name="organizationId" value={org.id.toString()} />

        <Field label="組織名" htmlFor="name" required>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={120}
            defaultValue={org.name}
            className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
          />
        </Field>

        <Field label="説明 (Markdown)" htmlFor="description">
          <textarea
            id="description"
            name="description"
            rows={6}
            maxLength={20000}
            defaultValue={org.description ?? ""}
            className="block w-full rounded-md border border-border bg-white px-3 py-2 font-mono text-sm focus:border-brand-orange focus:outline-none"
          />
        </Field>

        <Field label="ロゴ画像 URL" htmlFor="logoUrl">
          <input
            id="logoUrl"
            name="logoUrl"
            type="url"
            maxLength={2000}
            defaultValue={org.logoUrl ?? ""}
            placeholder="https://..."
            className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
          />
        </Field>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Link
            href={`/org/${org.slug}`}
            className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-brand-orange-soft"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            data-testid="org-edit-submit"
            className="inline-flex h-10 items-center rounded-md bg-brand-orange px-5 text-sm font-semibold text-white shadow hover:bg-brand-orange-hover"
          >
            保存
          </button>
        </div>
      </form>

      {/* ============ カレンダー割り当て ============ */}
      <section className="mt-10">
        <h2 className="text-xl font-bold">カレンダーの割り当て</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          自分がオーナーのカレンダーをこの組織に割り当てると、/org/{org.slug}{" "}
          にカレンダーとイベントが集約表示されます。解除すると従来どおりの
          個人カレンダーに戻ります。
        </p>

        {myCalendars.length === 0 ? (
          <p className="mt-4 rounded-md border border-border bg-surface p-6 text-sm text-muted-foreground">
            自分がオーナーのカレンダーはまだありません。{" "}
            <Link href="/calendar/create" className="text-link hover:underline">
              カレンダーを作成
            </Link>
            してから割り当ててください。
          </p>
        ) : (
          <ul
            data-testid="org-calendar-assign-list"
            className="mt-4 space-y-3"
          >
            {myCalendars.map((cal) => {
              const inThisOrg = cal.organizationId === org.id;
              const inOtherOrg =
                cal.organizationId !== null && !inThisOrg;
              return (
                <li
                  key={cal.id.toString()}
                  data-testid={`org-calendar-assign-row-${cal.slug}`}
                  className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/calendar/${cal.slug}`}
                      className="text-sm font-semibold text-foreground hover:underline"
                    >
                      {cal.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      /calendar/{cal.slug} ・ 購読者 {cal.subscriberCount} 人 ・
                      イベント {cal.eventCount} 件
                    </p>
                  </div>
                  <div className="shrink-0">
                    {inThisOrg ? (
                      <form action={assignCalendarToOrg}>
                        <input
                          type="hidden"
                          name="calendarId"
                          value={cal.id.toString()}
                        />
                        <input type="hidden" name="organizationId" value="" />
                        <button
                          type="submit"
                          data-testid={`org-unassign-${cal.slug}`}
                          className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-brand-orange-soft"
                        >
                          割り当てを解除
                        </button>
                      </form>
                    ) : inOtherOrg ? (
                      <span className="text-xs text-muted-foreground">
                        別の組織に割り当て済み
                      </span>
                    ) : (
                      <form action={assignCalendarToOrg}>
                        <input
                          type="hidden"
                          name="calendarId"
                          value={cal.id.toString()}
                        />
                        <input
                          type="hidden"
                          name="organizationId"
                          value={org.id.toString()}
                        />
                        <button
                          type="submit"
                          data-testid={`org-assign-${cal.slug}`}
                          className="inline-flex h-9 items-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white shadow hover:bg-brand-orange-hover"
                        >
                          この組織に割り当て
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
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
