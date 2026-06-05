/**
 * Calendar イベント管理ページ (所有者のみ)
 *
 * - Calendar に含まれるイベント一覧 + 削除ボタン
 * - 新規追加フォーム (event ID 指定)
 *
 * 最低限の管理 UI。実運用ではイベント検索・候補ピックを足せる。
 */

import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  addEventToCalendar,
  removeEventFromCalendar,
} from "@/app/actions/calendar-actions";
import { formatEventDateShort } from "@/lib/utils";

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

export default async function CalendarManagePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const error = pickString(sp, "error");
  const message = pickString(sp, "message");

  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/calendar/${slug}/manage`)}`,
    );
  }

  const cal = await prisma.calendar.findUnique({ where: { slug } });
  if (!cal) notFound();
  if (cal.ownerUserId !== user.id) {
    redirect(`/calendar/${slug}`);
  }

  const items = await prisma.calendarEvent.findMany({
    where: { calendarId: cal.id },
    orderBy: { event: { startedAt: "asc" } },
    include: { event: { include: { group: true } } },
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <p className="text-xs text-muted-foreground">
        <Link href={`/calendar/${cal.slug}`} className="text-link hover:underline">
          ← {cal.name}
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-bold">イベントを管理</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        このカレンダーに含めるイベントを追加・削除できます。
      </p>

      {error && (
        <div
          role="alert"
          data-testid="calendar-manage-error"
          className="mt-6 rounded-md border border-status-full-bg bg-status-full-bg/20 px-4 py-3 text-sm text-status-full-fg"
        >
          <strong className="font-semibold">エラー:</strong> {message || error}
        </div>
      )}

      {/* 追加フォーム */}
      <section className="mt-6 rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-bold">イベントを追加</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          イベントID (URL `/event/&lt;ID&gt;` の数字) を入力してください。
        </p>
        <form
          action={addEventToCalendar}
          method="post"
          className="mt-4 flex flex-wrap items-end gap-3"
          data-testid="calendar-add-event-form"
        >
          <input type="hidden" name="slug" value={cal.slug} />
          <div>
            <label
              htmlFor="eventId"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              イベントID
            </label>
            <input
              id="eventId"
              name="eventId"
              type="text"
              required
              pattern="\d+"
              className="block w-48 rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
            />
          </div>
          <button
            type="submit"
            data-testid="calendar-add-event-submit"
            className="inline-flex h-10 items-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white shadow hover:bg-brand-orange-hover"
          >
            追加
          </button>
        </form>
      </section>

      {/* 一覧 */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold">
          含まれるイベント ({items.length})
        </h2>
        {items.length === 0 ? (
          <p className="rounded-md border border-border bg-surface p-6 text-sm text-muted-foreground">
            まだ追加されたイベントはありません。
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border bg-surface">
            {items.map((ce) => (
              <li
                key={ce.event.id.toString()}
                className="flex items-center gap-4 p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    {formatEventDateShort(ce.event.startedAt.toISOString())} ・{" "}
                    {ce.event.group.name}
                  </p>
                  <Link
                    href={`/event/${ce.event.id.toString()}`}
                    className="line-clamp-1 text-sm font-semibold text-foreground hover:text-link"
                  >
                    {ce.event.title}
                  </Link>
                </div>
                <form action={removeEventFromCalendar} method="post">
                  <input type="hidden" name="slug" value={cal.slug} />
                  <input
                    type="hidden"
                    name="eventId"
                    value={ce.event.id.toString()}
                  />
                  <button
                    type="submit"
                    data-testid={`calendar-remove-event-${ce.event.id.toString()}`}
                    className="inline-flex h-9 items-center rounded-md border border-border bg-white px-3 text-sm text-status-cancelled-fg hover:bg-zinc-50"
                  >
                    削除
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
