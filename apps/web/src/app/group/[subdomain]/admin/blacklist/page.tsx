/**
 * グループ admin ブラックリスト管理ページ。
 *
 * - 認証必須 + GroupAdmin (owner / admin) のみ閲覧可能。
 * - GroupBlacklist (addedAt 降順) を表示し、nickname 指定での追加 / 解除を提供する。
 * - BL 登録済みユーザーはグループのイベントに参加申込できない
 *   (joinEvent / submitSurveyAndJoin の入口でブロック)。
 *
 * URL: `/group/[subdomain]/admin/blacklist`
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Breadcrumb from "@/components/Breadcrumb";
import {
  addToBlacklistAction,
  removeFromBlacklistAction,
} from "@/app/actions/group-actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ブラックリスト管理 | tech-event",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ error?: string; toast?: string }>;
};

export default async function GroupAdminBlacklistPage({
  params,
  searchParams,
}: PageProps) {
  const { subdomain } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(
        `/group/${subdomain}/admin/blacklist`,
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

  const entries = await prisma.groupBlacklist.findMany({
    where: { groupId: group.id },
    orderBy: { addedAt: "desc" },
  });

  // GroupBlacklist は user リレーションを持たないため userId → User を別引きする
  const userIds = Array.from(
    new Set(
      entries
        .flatMap((e) => [e.userId, e.addedByUserId])
        .map((id) => id.toString()),
    ),
  ).map((s) => BigInt(s));
  const users = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } } })
    : [];
  const userMap = new Map(users.map((u) => [u.id.toString(), u]));

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: group.name, href: `/group/${subdomain}` },
          { label: "ブラックリスト管理" },
        ]}
      />

      <header className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="text-xl font-bold md:text-2xl"
            data-testid="group-blacklist-heading"
          >
            ブラックリスト管理 ({entries.length}人)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {group.name} のブラックリスト。登録されたユーザーはこのグループのイベントに参加申込できません。
          </p>
        </div>
        <Link
          href={`/group/${subdomain}/admin/members`}
          className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium hover:bg-brand-orange-soft"
        >
          メンバー管理へ
        </Link>
      </header>

      {sp.error && (
        <p
          role="alert"
          data-testid="blacklist-error"
          className="mt-4 rounded-md border border-status-cancelled-bg bg-status-cancelled-bg/10 px-3 py-2 text-sm text-status-cancelled-fg"
        >
          {sp.error}
        </p>
      )}
      {sp.toast === "blacklist-added" && (
        <p
          role="status"
          data-testid="blacklist-toast"
          className="mt-4 rounded-md border border-border bg-brand-orange-soft px-3 py-2 text-sm text-foreground"
        >
          ブラックリストに追加しました。
        </p>
      )}
      {sp.toast === "blacklist-removed" && (
        <p
          role="status"
          data-testid="blacklist-toast"
          className="mt-4 rounded-md border border-border bg-brand-orange-soft px-3 py-2 text-sm text-foreground"
        >
          ブラックリストから解除しました。
        </p>
      )}

      {/* ============ 追加フォーム ============ */}
      <form
        action={addToBlacklistAction}
        className="mt-6 grid grid-cols-1 gap-3 rounded-md border border-dashed border-border bg-surface p-4 sm:grid-cols-[220px_minmax(0,1fr)_auto]"
        data-testid="blacklist-add-form"
      >
        <input type="hidden" name="subdomain" value={subdomain} />
        <div>
          <label
            htmlFor="blacklist-nickname"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            ニックネーム *
          </label>
          <input
            id="blacklist-nickname"
            name="nickname"
            type="text"
            required
            maxLength={100}
            placeholder="例: fast_moon_169"
            data-testid="blacklist-add-nickname"
            className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="blacklist-reason"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            理由 (任意)
          </label>
          <input
            id="blacklist-reason"
            name="reason"
            type="text"
            maxLength={500}
            placeholder="例: 無断キャンセルの繰り返し"
            data-testid="blacklist-add-reason"
            className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            data-testid="blacklist-add-submit"
            className="inline-flex h-9 items-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white hover:bg-brand-orange-hover"
          >
            追加する
          </button>
        </div>
      </form>

      {/* ============ 一覧 ============ */}
      <div className="mt-6 overflow-x-auto rounded-md border border-border bg-surface">
        <table className="w-full text-sm" data-testid="group-blacklist-table">
          <thead className="border-b border-border bg-background text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">ユーザー</th>
              <th className="px-3 py-2 text-left">理由</th>
              <th className="px-3 py-2 text-left">追加者</th>
              <th className="px-3 py-2 text-left">追加日時</th>
              <th className="px-3 py-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-muted-foreground"
                  data-testid="blacklist-empty"
                >
                  ブラックリストに登録されたユーザーはいません。
                </td>
              </tr>
            ) : (
              entries.map((e) => {
                const target = userMap.get(e.userId.toString());
                const addedBy = userMap.get(e.addedByUserId.toString());
                return (
                  <tr
                    key={e.id.toString()}
                    className="border-b border-border last:border-0"
                    data-testid={`blacklist-row-${target?.nickname ?? e.userId.toString()}`}
                  >
                    <td className="px-3 py-3">
                      {target ? (
                        <>
                          <Link
                            href={`/user/${target.nickname}`}
                            className="font-medium text-link hover:underline"
                          >
                            {target.displayName}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            @{target.nickname}
                          </p>
                        </>
                      ) : (
                        <span className="text-muted-foreground">
                          削除済みユーザー (id: {e.userId.toString()})
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {e.reason ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {addedBy ? `@${addedBy.nickname}` : "—"}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {e.addedAt.toLocaleString("ja-JP")}
                    </td>
                    <td className="px-3 py-3">
                      <form action={removeFromBlacklistAction}>
                        <input
                          type="hidden"
                          name="subdomain"
                          value={subdomain}
                        />
                        <input
                          type="hidden"
                          name="userId"
                          value={e.userId.toString()}
                        />
                        <button
                          type="submit"
                          data-testid={`blacklist-remove-${target?.nickname ?? e.userId.toString()}`}
                          className="inline-flex h-8 items-center rounded-md border border-status-cancelled-bg bg-white px-3 text-xs font-medium text-status-cancelled-fg hover:bg-status-cancelled-bg/20"
                        >
                          解除
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
