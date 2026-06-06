/**
 * イベント出席チェックインページ
 *
 * - 参加者 (status=accepted) が出席コードを入力して自身を attended にする画面。
 * - 未ログイン: `/login?next=...` へリダイレクト。
 * - 未参加 (accepted でない): 参加者向け案内を表示。
 *
 * `?ok=1` のクエリでチェックイン成功メッセージを出す。
 * `?err=<code>` でエラーメッセージを表示。
 */

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkInWithCode } from "@/app/actions/checkin-actions";

export const dynamic = "force-dynamic";

function parseId(raw: string): bigint | null {
  if (!/^\d+$/.test(raw)) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

export default async function CheckInPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; err?: string; already?: string }>;
}) {
  const { id: raw } = await params;
  const id = parseId(raw);
  if (!id) notFound();

  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      allowAttendanceCodeCheckIn: true,
    },
  });
  if (!event) notFound();

  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/event/${id.toString()}/check-in`)}`,
    );
  }

  const participant = await prisma.participant.findFirst({
    where: {
      eventId: id,
      userId: user.id,
      status: { in: ["accepted", "attended"] },
    },
    select: { status: true, checkInAt: true },
  });

  const sp = await searchParams;
  const eventIdStr = id.toString();

  async function handleCheckIn(formData: FormData): Promise<void> {
    "use server";
    const result = await checkInWithCode(formData);
    if (result.ok) {
      redirect(
        `/event/${eventIdStr}/check-in?ok=1${
          result.alreadyAttended ? "&already=1" : ""
        }`,
      );
    } else {
      redirect(
        `/event/${eventIdStr}/check-in?err=${encodeURIComponent(result.error)}`,
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
      <nav className="mb-4 text-sm">
        <Link
          href={`/event/${eventIdStr}`}
          className="text-link hover:underline"
        >
          ← イベントに戻る
        </Link>
      </nav>

      <h1 className="text-2xl font-bold text-foreground">出席チェックイン</h1>
      <p className="mt-1 text-sm text-muted-foreground">{event.title}</p>

      {sp.ok && (
        <div
          className="mt-4 rounded-md border border-status-open-fg bg-status-open-bg p-3 text-sm text-status-open-fg"
          data-testid="checkin-result-ok"
        >
          {sp.already ? "既にチェックイン済みです。" : "チェックインが完了しました。"}
        </div>
      )}
      {sp.err && (
        <div
          className="mt-4 rounded-md border border-status-cancelled-bg bg-status-full-bg p-3 text-sm text-status-cancelled-bg"
          data-testid="checkin-result-err"
        >
          {sp.err === "invalid_code"
            ? "出席コードが正しくありません。"
            : sp.err === "not_accepted"
              ? "このイベントの参加確定者ではありません。"
              : sp.err === "not_allowed"
                ? "このイベントでは出席コードによるチェックインが許可されていません。"
                : "エラーが発生しました。"}
        </div>
      )}

      {!event.allowAttendanceCodeCheckIn ? (
        <p className="mt-6 rounded-md border border-border bg-surface p-4 text-sm text-muted-foreground">
          このイベントでは出席コード入力によるチェックインは無効です。
        </p>
      ) : !participant ? (
        <p className="mt-6 rounded-md border border-border bg-surface p-4 text-sm text-muted-foreground">
          このイベントの参加確定者ではありません。
        </p>
      ) : participant.status === "attended" ? (
        <p
          className="mt-6 rounded-md border border-status-open-fg bg-status-open-bg p-4 text-sm text-status-open-fg"
          data-testid="checkin-already-attended"
        >
          チェックイン済みです。
          {participant.checkInAt && (
            <span className="ml-1 text-muted-foreground">
              ({new Date(participant.checkInAt).toLocaleString("ja-JP")})
            </span>
          )}
        </p>
      ) : (
        <form
          action={handleCheckIn}
          className="mt-6 flex flex-col gap-3 rounded-md border border-border bg-surface p-4"
          data-testid="checkin-form"
        >
          <input type="hidden" name="eventId" value={eventIdStr} />
          <label
            htmlFor="checkin-code"
            className="text-sm font-semibold text-foreground"
          >
            出席コード
          </label>
          <input
            id="checkin-code"
            name="code"
            type="text"
            required
            inputMode="text"
            autoComplete="off"
            placeholder="会場掲示のコードを入力"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <button
            type="submit"
            className="inline-flex h-9 items-center justify-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white hover:bg-brand-orange-hover"
          >
            チェックイン
          </button>
        </form>
      )}
    </div>
  );
}
