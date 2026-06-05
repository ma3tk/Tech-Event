/**
 * 主催者ダッシュボード Registration タブ
 *
 * - 受付設定の編集 (受付開始/終了日時、定員、参加枠の追加削除)
 * - 申込フォームの質問項目設定 (今は表示のみ。編集は次タスク #18 予定)
 * - 抽選方式の切替
 *
 * 編集系は既存の `updateEvent` Server Action を再利用する。受付関連フィールド
 * のみを薄く UI から渡す形にし、他のフィールド (タイトル / 説明 / 場所等) は
 * 既存 /event/[id]/edit に委ねる。
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { updateEvent } from "@/app/actions/event-admin-actions";

export const dynamic = "force-dynamic";

function toLocalDateTimeInput(d: Date | null | undefined): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EventAdminRegistrationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  if (!/^\d+$/.test(raw)) notFound();
  const eventId = BigInt(raw);

  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/event/${raw}/admin/registration`)}`,
    );
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      roles: { orderBy: { displayOrder: "asc" } },
      surveys: {
        include: { questions: { orderBy: { displayOrder: "asc" } } },
      },
    },
  });
  if (!event) notFound();
  const isOwner = event.ownerId === user.id;
  const admin = await prisma.groupAdmin.findUnique({
    where: { groupId_userId: { groupId: event.groupId, userId: user.id } },
  });
  const isAdmin =
    !!admin && (admin.role === "owner" || admin.role === "admin");
  if (!isOwner && !isAdmin) notFound();

  const eventIdStr = event.id.toString();

  return (
    <div data-testid="admin-panel-registration">
      <h2 className="text-xl font-bold">Registration</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        受付期間・定員・抽選方式・参加枠を管理します。
      </p>

      {/* ============ 受付期間 / 定員 / 抽選 ============ */}
      <section className="mt-6">
        <h3 className="text-base font-semibold">受付設定</h3>
        <form
          action={updateEvent}
          className="mt-3 grid grid-cols-1 gap-4 rounded-md border border-border bg-surface p-4 sm:grid-cols-2"
          data-testid="admin-registration-form"
        >
          {/* updateEvent は title 等を必須にしているため、現値を hidden で渡す */}
          <input type="hidden" name="eventId" value={eventIdStr} />
          <input type="hidden" name="title" value={event.title} />
          <input
            type="hidden"
            name="catchPhrase"
            value={event.catchPhrase ?? ""}
          />
          <input
            type="hidden"
            name="description"
            value={event.description ?? ""}
          />
          <input
            type="hidden"
            name="coverImageUrl"
            value={event.coverImageUrl ?? ""}
          />
          <input type="hidden" name="hashTag" value={event.hashTag ?? ""} />
          <input
            type="hidden"
            name="eventFormat"
            value={event.eventFormat}
          />
          <input type="hidden" name="place" value={event.place ?? ""} />
          <input type="hidden" name="address" value={event.address ?? ""} />
          <input
            type="hidden"
            name="onlineUrl"
            value={event.onlineUrl ?? ""}
          />
          <input
            type="hidden"
            name="startedAt"
            value={toLocalDateTimeInput(event.startedAt)}
          />
          <input
            type="hidden"
            name="endedAt"
            value={toLocalDateTimeInput(event.endedAt)}
          />
          <input type="hidden" name="status" value={event.status} />

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              受付開始日時
            </span>
            <input
              type="datetime-local"
              name="acceptsFrom"
              defaultValue={toLocalDateTimeInput(event.acceptsFrom)}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              受付終了日時
            </span>
            <input
              type="datetime-local"
              name="acceptsUntil"
              defaultValue={toLocalDateTimeInput(event.acceptsUntil)}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              全体定員
            </span>
            <input
              type="number"
              name="capacity"
              defaultValue={event.capacity ?? ""}
              min={0}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              抽選方式
            </span>
            <select
              name="recruitmentMethod"
              defaultValue={event.recruitmentMethod}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
              data-testid="admin-registration-recruitment-method"
            >
              <option value="fcfs">先着順</option>
              <option value="lottery">抽選</option>
            </select>
          </label>
          {event.recruitmentMethod === "lottery" && (
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">
                抽選結果発表予定日時
              </span>
              <input
                type="datetime-local"
                name="lotteryAnnounceAt"
                defaultValue={toLocalDateTimeInput(event.lotteryAnnounceAt)}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
              />
            </label>
          )}

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-md bg-brand-orange px-5 text-sm font-semibold text-white hover:bg-brand-orange-hover"
              data-testid="admin-registration-save"
            >
              受付設定を保存
            </button>
          </div>
        </form>
      </section>

      {/* ============ 参加枠 ============ */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">参加枠</h3>
          <Link
            href={`/event/${eventIdStr}/edit`}
            className="text-xs text-link hover:underline"
          >
            参加枠の追加・削除はイベント編集ページから
          </Link>
        </div>
        <div className="mt-3 overflow-x-auto rounded-md border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-background text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">表示順</th>
                <th className="px-3 py-2 text-left">名前</th>
                <th className="px-3 py-2 text-right">定員</th>
                <th className="px-3 py-2 text-left">募集方式</th>
                <th className="px-3 py-2 text-left">料金</th>
              </tr>
            </thead>
            <tbody>
              {event.roles.map((r) => (
                <tr
                  key={r.id.toString()}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-3 py-2">{r.displayOrder}</td>
                  <td className="px-3 py-2 font-medium">{r.name}</td>
                  <td className="px-3 py-2 text-right">
                    {r.capacity ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    {r.recruitmentMethod === "lottery" ? "抽選" : "先着"}
                  </td>
                  <td className="px-3 py-2">
                    {r.pricingType === "free"
                      ? "無料"
                      : `${r.price.toLocaleString()} ${r.currency}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ============ 申込フォーム質問項目 (表示のみ) ============ */}
      <section className="mt-8" data-testid="admin-registration-questions">
        <h3 className="text-base font-semibold">申込フォームの質問</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          編集機能は次のタスク (#18) で実装予定。現在は登録済みの質問項目を表示のみ。
        </p>
        {event.surveys.length === 0 ? (
          <div className="mt-3 rounded-md border border-dashed border-border bg-surface p-6 text-sm text-muted-foreground">
            このイベントに紐づくアンケートはありません。
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {event.surveys.map((s) => (
              <li
                key={s.id.toString()}
                className="rounded-md border border-border bg-surface p-4"
              >
                <p className="font-semibold">{s.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  実行タイミング: {s.trigger === "on_apply" ? "申込時" : "終了後"}
                  {s.required ? " ・ 必須" : ""}
                </p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                  {s.questions.map((q) => (
                    <li key={q.id.toString()}>
                      {q.body}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({q.inputType}
                        {q.required ? " / 必須" : ""})
                      </span>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
