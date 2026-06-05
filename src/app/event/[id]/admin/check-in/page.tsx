/**
 * 主催者向け出席管理ページ
 *
 * - 認証必須 + Event.owner or GroupAdmin のみアクセス可能 (それ以外は 404 扱い)
 * - accepted / attended の参加者一覧を表示
 * - 各行にチェックインボタン / チェックイン取消ボタン
 * - 出席コードも表示 (主催者のみ参照可)
 */

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  isEventAdmin,
  toggleParticipantAttendance,
} from "@/app/actions/checkin-actions";

export const dynamic = "force-dynamic";

function parseId(raw: string): bigint | null {
  if (!/^\d+$/.test(raw)) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

export default async function AdminCheckInPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  const id = parseId(raw);
  if (!id) notFound();

  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(
        `/event/${id.toString()}/admin/check-in`,
      )}`,
    );
  }

  if (!(await isEventAdmin(id, user.id))) {
    notFound();
  }

  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      attendanceCode: true,
      allowAttendanceCodeCheckIn: true,
    },
  });
  if (!event) notFound();

  const participants = await prisma.participant.findMany({
    where: {
      eventId: id,
      status: { in: ["accepted", "attended"] },
    },
    orderBy: [{ status: "desc" }, { appliedAt: "asc" }],
    include: {
      user: {
        select: {
          id: true,
          nickname: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });

  const eventIdStr = id.toString();
  const acceptedCount = participants.filter(
    (p) => p.status === "accepted",
  ).length;
  const attendedCount = participants.filter(
    (p) => p.status === "attended",
  ).length;

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
      <nav className="mb-4 text-sm">
        <Link
          href={`/event/${eventIdStr}`}
          className="text-link hover:underline"
        >
          ← イベントに戻る
        </Link>
      </nav>

      <h1 className="text-2xl font-bold text-foreground">出席管理 (主催者用)</h1>
      <p className="mt-1 text-sm text-muted-foreground">{event.title}</p>

      <section className="mt-4 grid grid-cols-1 gap-3 rounded-md border border-border bg-surface p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase text-muted-foreground">出席コード</p>
          <p
            className="mt-1 font-mono text-lg font-bold text-foreground"
            data-testid="admin-attendance-code"
          >
            {event.attendanceCode ?? "(未設定)"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">参加確定</p>
          <p className="mt-1 text-lg font-bold text-foreground">
            {acceptedCount} 人
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">出席済み</p>
          <p className="mt-1 text-lg font-bold text-foreground">
            {attendedCount} 人
          </p>
        </div>
      </section>

      <section
        className="mt-6 overflow-x-auto rounded-md border border-border bg-surface"
        aria-labelledby="participants-heading"
      >
        <h2 id="participants-heading" className="sr-only">
          参加者一覧
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-background text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">参加者</th>
              <th className="px-3 py-2">ステータス</th>
              <th className="px-3 py-2">チェックイン</th>
              <th className="px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {participants.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  対象の参加者がいません。
                </td>
              </tr>
            ) : (
              participants.map((p) => {
                const isAttended = p.status === "attended";
                return (
                  <tr
                    key={p.id.toString()}
                    className="border-t border-border"
                    data-testid={`admin-participant-row-${p.user.id.toString()}`}
                  >
                    <td className="px-3 py-2">
                      <Link
                        href={`/user/${p.user.nickname}`}
                        className="font-medium text-link hover:underline"
                      >
                        {p.user.displayName}
                      </Link>
                      <span className="ml-1 text-xs text-muted-foreground">
                        @{p.user.nickname}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {isAttended ? (
                        <span className="rounded bg-status-open-bg px-2 py-0.5 text-xs font-semibold text-status-open-fg">
                          出席済
                        </span>
                      ) : (
                        <span className="rounded bg-status-upcoming-bg px-2 py-0.5 text-xs font-semibold text-status-upcoming-fg">
                          参加確定
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {p.checkInAt
                        ? `${new Date(p.checkInAt).toLocaleString("ja-JP")}${
                            p.checkInMethod ? ` (${p.checkInMethod})` : ""
                          }`
                        : "-"}
                    </td>
                    <td className="px-3 py-2">
                      <form action={toggleParticipantAttendance}>
                        <input
                          type="hidden"
                          name="eventId"
                          value={eventIdStr}
                        />
                        <input
                          type="hidden"
                          name="participantId"
                          value={p.id.toString()}
                        />
                        <input
                          type="hidden"
                          name="next"
                          value={isAttended ? "accepted" : "attended"}
                        />
                        <button
                          type="submit"
                          className={
                            isAttended
                              ? "inline-flex h-8 items-center rounded border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-brand-orange-soft"
                              : "inline-flex h-8 items-center rounded bg-brand-orange px-3 text-xs font-semibold text-white hover:bg-brand-orange-hover"
                          }
                        >
                          {isAttended ? "出席取消" : "出席にする"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
