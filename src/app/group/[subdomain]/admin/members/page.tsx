/**
 * グループ admin メンバー一覧ページ。
 *
 * - 認証必須 + GroupAdmin (owner / admin) のみ閲覧可能。
 * - GroupMember (joinedAt 降順) を表示し、CSV / Excel エクスポート導線を提供する。
 *
 * URL: `/group/[subdomain]/admin/members`
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Breadcrumb from "@/components/Breadcrumb";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "グループメンバー管理 | tech-event",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ subdomain: string }>;
};

export default async function GroupAdminMembersPage({ params }: PageProps) {
  const { subdomain } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(
        `/group/${subdomain}/admin/members`,
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

  const members = await prisma.groupMember.findMany({
    where: { groupId: group.id, leftAt: null },
    include: { user: true },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: group.name, href: `/group/${subdomain}` },
          { label: "メンバー管理" },
        ]}
      />

      <header className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="text-xl font-bold md:text-2xl"
            data-testid="group-members-heading"
          >
            メンバー管理 ({members.length}人)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {group.name} のメンバー一覧。CSV / Excel で書き出せます。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/group/${subdomain}/admin/members/export.csv`}
            data-testid="group-members-csv-button"
            download
            className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium hover:bg-brand-orange-soft"
          >
            CSV エクスポート
          </a>
          <a
            href={`/group/${subdomain}/admin/members/export.xlsx`}
            data-testid="group-members-xlsx-button"
            download
            className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium hover:bg-brand-orange-soft"
          >
            Excel エクスポート
          </a>
        </div>
      </header>

      <div className="mt-6 overflow-x-auto rounded-md border border-border bg-surface">
        <table
          className="w-full text-sm"
          data-testid="group-members-table"
        >
          <thead className="border-b border-border bg-background text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">ユーザー</th>
              <th className="px-3 py-2 text-left">参加経路</th>
              <th className="px-3 py-2 text-left">参加日時</th>
              <th className="px-3 py-2 text-left">通知</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  まだメンバーがいません。
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr
                  key={m.id.toString()}
                  className="border-b border-border last:border-0"
                  data-testid={`group-member-row-${m.user.id.toString()}`}
                >
                  <td className="px-3 py-3">
                    <Link
                      href={`/user/${m.user.nickname}`}
                      className="font-medium text-link hover:underline"
                    >
                      {m.user.displayName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      @{m.user.nickname}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-xs">{m.joinedVia}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    {m.joinedAt.toLocaleString("ja-JP")}
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {m.receiveAnnouncement ? "受信" : "停止"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
