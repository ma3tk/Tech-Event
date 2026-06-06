/**
 * 主催者ダッシュボード共通レイアウト (Luma 風 6 タブ)
 *
 * - 上部に sticky なタブナビ (Overview / Guests / Registration / Blasts /
 *   Insights / More) を配置し、各タブの実体は配下の Server Component が描画する。
 * - レイアウト段階で auth と権限チェックを行い、主催者でなければ 404 を返す。
 *   各タブの page.tsx も同様の防御を二重に行う (redirect の整合性のため)。
 *
 * NOTE:
 *   - `usePathname` を使うクライアントタブナビは `AdminTabsNav` に分離している。
 *   - 既存の `/event/[id]/admin/check-in` ページもこのレイアウト配下になるが、
 *     当該ページは "出席管理" として More タブからリンクされる形を保つ。
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

import AdminTabsNav from "./_components/AdminTabsNav";

export const dynamic = "force-dynamic";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function EventAdminLayout({
  children,
  params,
}: LayoutProps) {
  const { id: raw } = await params;
  if (!/^\d+$/.test(raw)) notFound();
  const eventId = BigInt(raw);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/event/${raw}/admin`)}`);
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      status: true,
      ownerId: true,
      groupId: true,
      group: { select: { name: true, subdomain: true } },
    },
  });
  if (!event) notFound();

  // 権限チェック (owner or group admin)
  const isOwner = event.ownerId === user.id;
  const admin = await prisma.groupAdmin.findUnique({
    where: { groupId_userId: { groupId: event.groupId, userId: user.id } },
  });
  const isAdmin =
    !!admin && (admin.role === "owner" || admin.role === "admin");
  if (!isOwner && !isAdmin) notFound();

  const eventIdStr = event.id.toString();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <nav className="mb-3 text-sm text-muted-foreground">
        <Link href={`/event/${eventIdStr}`} className="hover:underline">
          ← イベントに戻る
        </Link>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            主催者ダッシュボード
          </p>
          <h1 className="text-2xl font-bold" data-testid="admin-event-title">
            {event.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {event.group.name} ・ 状態: <strong>{event.status}</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/event/${eventIdStr}/edit`}
            className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium hover:bg-brand-orange-soft"
          >
            編集
          </Link>
          <Link
            href={`/event/${eventIdStr}`}
            className="inline-flex h-10 items-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white hover:bg-brand-orange-hover"
          >
            公開ページを見る
          </Link>
        </div>
      </header>

      {/* sticky タブナビ */}
      <div
        className="sticky top-0 z-10 mt-6 -mx-4 border-b border-border bg-background/95 px-4 backdrop-blur"
        data-testid="admin-tabs"
      >
        <AdminTabsNav eventId={eventIdStr} />
      </div>

      <div className="mt-6">{children}</div>
    </div>
  );
}
