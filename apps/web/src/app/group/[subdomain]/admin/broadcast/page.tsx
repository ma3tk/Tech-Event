/**
 * グループ一斉メッセージ (broadcast) 送信ページ。
 *
 * - 認証必須 + GroupAdmin (owner / admin) のみアクセス可能。
 * - 件名 / 本文を入力して `sendGroupMessageAction` を呼び、
 *   受信許諾 (`GroupMember.receiveAnnouncement`) のあるメンバー全員へ
 *   サイト内通知 (`group_message`) + メールを送信する。
 * - `?sent=1` で着地した場合は完了バナー、`?error=...` はエラーバナーを表示。
 * - 送信履歴 (Message, audience="group_members") を下部に表示する。
 *
 * URL: `/group/[subdomain]/admin/broadcast`
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendGroupMessageAction } from "@/app/actions/group-actions";
import Breadcrumb from "@/components/Breadcrumb";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "グループ一斉メッセージ | tech-event",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function GroupAdminBroadcastPage({
  params,
  searchParams,
}: PageProps) {
  const { subdomain } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(
        `/group/${subdomain}/admin/broadcast`,
      )}`,
    );
  }

  const group = await prisma.group.findUnique({ where: { subdomain } });
  if (!group) notFound();

  const admin = await prisma.groupAdmin.findUnique({
    where: { groupId_userId: { groupId: group.id, userId: user.id } },
  });
  const isAdmin =
    !!admin && (admin.role === "owner" || admin.role === "admin");
  if (!isAdmin) notFound();

  const sp = await searchParams;
  const justSent = sp.sent === "1";
  const error = typeof sp.error === "string" ? sp.error : null;

  const [recipientCount, messages] = await Promise.all([
    prisma.groupMember.count({
      where: { groupId: group.id, leftAt: null, receiveAnnouncement: true },
    }),
    prisma.message.findMany({
      where: { groupId: group.id, audience: "group_members" },
      orderBy: { sentAt: "desc" },
      take: 20,
      include: {
        sender: { select: { displayName: true, nickname: true } },
      },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: group.name, href: `/group/${subdomain}` },
          { label: "一斉メッセージ" },
        ]}
      />

      <header className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="text-xl font-bold md:text-2xl"
            data-testid="group-broadcast-heading"
          >
            一斉メッセージ
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {group.name} のメンバー (受信を許可している {recipientCount} 人)
            へサイト内通知とメールを送信します。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/group/${subdomain}/admin/members`}
            data-testid="group-broadcast-members-link"
            className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium hover:bg-brand-orange-soft"
          >
            メンバー管理
          </Link>
        </div>
      </header>

      {justSent && (
        <div
          className="mt-4 rounded-md border border-status-open-fg/30 bg-status-open-bg/30 px-4 py-3 text-sm text-status-open-fg"
          data-testid="group-broadcast-sent-banner"
          role="status"
        >
          メッセージを送信しました。
        </div>
      )}
      {error && (
        <div
          className="mt-4 rounded-md border border-red-600/30 bg-red-50 px-4 py-3 text-sm text-red-600"
          data-testid="group-broadcast-error-banner"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* 送信フォーム */}
      <form
        action={sendGroupMessageAction}
        className="mt-6 grid grid-cols-1 gap-4 rounded-md border border-border bg-surface p-4"
        data-testid="group-broadcast-form"
      >
        <input type="hidden" name="subdomain" value={subdomain} />

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
            data-testid="group-broadcast-subject"
            placeholder="例: 次回イベントのお知らせ"
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
            data-testid="group-broadcast-body"
            placeholder="メンバー向けのお知らせを入力..."
          />
        </label>

        <p className="text-xs text-muted-foreground">
          受信設定 (グループのメンバー設定 / 通知設定) でオフにしている
          メンバーには届きません。
        </p>

        <div>
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-md bg-brand-orange px-5 text-sm font-semibold text-white hover:bg-brand-orange-hover"
            data-testid="group-broadcast-submit"
          >
            送信する
          </button>
        </div>
      </form>

      {/* 送信履歴 */}
      <section className="mt-8" data-testid="group-broadcast-history">
        <h2 className="text-base font-semibold">送信履歴</h2>
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
                data-testid={`group-broadcast-row-${m.id.toString()}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold">{m.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.sentAt.toLocaleString("ja-JP")}
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  受信者: {m.recipientCount} 人 ・ 送信者:{" "}
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
