/**
 * 主催者ダッシュボード Blasts (一斉メッセージ) タブ
 *
 * - 件名 / 本文 / 対象 (確定 / 補欠 / キャンセル / 全員) を選んで送信
 * - 送信履歴は Message モデルから取得して表示
 * - Server Action `sendBlast` を呼び出す
 * - 実際のメール配信はモック (console.log)
 *
 * `?sent=1` で着地した場合は完了バナーを表示。
 */
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendBlast } from "@/app/actions/event-admin-actions";

export const dynamic = "force-dynamic";

const AUDIENCES = [
  { value: "accepted", label: "参加確定者" },
  { value: "waiting", label: "補欠 (抽選中含む)" },
  { value: "cancelled", label: "キャンセルした人" },
  { value: "all", label: "全員" },
] as const;

export default async function EventAdminBlastsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id: raw } = await params;
  if (!/^\d+$/.test(raw)) notFound();
  const eventId = BigInt(raw);

  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/event/${raw}/admin/blasts`)}`,
    );
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) notFound();
  const isOwner = event.ownerId === user.id;
  const admin = await prisma.groupAdmin.findUnique({
    where: { groupId_userId: { groupId: event.groupId, userId: user.id } },
  });
  const isAdmin =
    !!admin && (admin.role === "owner" || admin.role === "admin");
  if (!isOwner && !isAdmin) notFound();

  const sp = await searchParams;
  const justSent = sp.sent === "1";

  const messages = await prisma.message.findMany({
    where: { eventId },
    orderBy: { sentAt: "desc" },
    take: 50,
    include: {
      sender: { select: { displayName: true, nickname: true } },
    },
  });

  const eventIdStr = event.id.toString();

  return (
    <div data-testid="admin-panel-blasts">
      <h2 className="text-xl font-bold">Blasts (一斉メッセージ)</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        確定 / 補欠 / 全員などの宛先を選んでメッセージを送信できます。
        現在は SMTP 送信はモックで、サイト内通知のみが各受信者に届きます。
      </p>

      {justSent && (
        <div
          className="mt-4 rounded-md border border-status-open-fg/30 bg-status-open-bg/30 px-4 py-3 text-sm text-status-open-fg"
          data-testid="admin-blasts-sent-banner"
          role="status"
        >
          メッセージを送信しました。
        </div>
      )}

      {/* 送信フォーム */}
      <form
        action={sendBlast}
        className="mt-6 grid grid-cols-1 gap-4 rounded-md border border-border bg-surface p-4"
        data-testid="admin-blasts-form"
      >
        <input type="hidden" name="eventId" value={eventIdStr} />

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            宛先
          </span>
          <select
            name="audience"
            defaultValue="accepted"
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
            data-testid="admin-blasts-audience"
            required
          >
            {AUDIENCES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            件名
          </span>
          <input
            type="text"
            name="subject"
            maxLength={200}
            required
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
            data-testid="admin-blasts-subject"
            placeholder="例: 開催前リマインドのご連絡"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            本文
          </span>
          <textarea
            name="body"
            rows={8}
            required
            maxLength={20_000}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
            data-testid="admin-blasts-body"
            placeholder="参加者向けのメッセージを入力..."
          />
        </label>

        <div>
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-md bg-brand-orange px-5 text-sm font-semibold text-white hover:bg-brand-orange-hover"
            data-testid="admin-blasts-submit"
          >
            送信する
          </button>
        </div>
      </form>

      {/* 送信履歴 */}
      <section className="mt-8" data-testid="admin-blasts-history">
        <h3 className="text-base font-semibold">送信履歴</h3>
        {messages.length === 0 ? (
          <div className="mt-3 rounded-md border border-dashed border-border bg-surface p-6 text-center text-sm text-muted-foreground">
            まだ送信履歴はありません。
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {messages.map((m) => (
              <li
                key={m.id.toString()}
                className="rounded-md border border-border bg-surface p-4"
                data-testid={`admin-blast-row-${m.id.toString()}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold">{m.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.sentAt.toLocaleString("ja-JP")}
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  宛先:{" "}
                  {AUDIENCES.find((a) => a.value === m.audience)?.label ??
                    m.audience}{" "}
                  ・ 受信者: {m.recipientCount} 人 ・ 送信者:{" "}
                  {m.sender.displayName} (@{m.sender.nickname})
                </p>
                <pre className="mt-2 whitespace-pre-wrap break-words rounded bg-background p-2 text-xs">
                  {m.body}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
