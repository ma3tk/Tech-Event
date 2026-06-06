/**
 * 主催者ダッシュボード More タブ
 *
 * - イベント編集 (リンク)
 * - 出席管理 (既存 /admin/check-in リンク)
 * - イベント中止 (cancelEvent Server Action)
 * - イベント複製 (duplicateEvent Server Action)
 * - 公開URLコピー / 埋め込みコードへのリンク
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { cancelEvent } from "@/app/actions/event-admin-actions";

import CopyUrlButton from "./CopyUrlButton";
import DuplicateEventModal from "./DuplicateEventModal";

export const dynamic = "force-dynamic";

export default async function EventAdminMorePage({
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
      `/login?next=${encodeURIComponent(`/event/${raw}/admin/more`)}`,
    );
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      status: true,
      ownerId: true,
      groupId: true,
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
  const isCancelled = event.status === "cancelled";

  return (
    <div data-testid="admin-panel-more">
      <h2 className="text-xl font-bold">More (その他)</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        編集・複製・中止・URL 共有などの操作。
      </p>

      <section className="mt-6">
        <h3 className="text-base font-semibold">基本操作</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ActionCard
            href={`/event/${eventIdStr}/edit`}
            title="イベント編集"
            desc="タイトル / 説明 / 日時 / 場所 / 参加枠 を編集"
          />
          <ActionCard
            href={`/event/${eventIdStr}/admin/check-in`}
            title="出席管理"
            desc="参加確定者のチェックイン記録"
            testId="admin-more-checkin-link"
          />
          <ActionCard
            href={`/event/${eventIdStr}/embed-code`}
            title="埋め込みコード"
            desc="外部サイトに iframe で貼り付け"
          />
          <ActionCard
            href={`/event/${eventIdStr}`}
            title="公開ページを見る"
            desc="参加者向けページに遷移"
          />
        </div>
      </section>

      {/* ============ URL コピー ============ */}
      <section className="mt-8">
        <h3 className="text-base font-semibold">公開URL</h3>
        <div className="mt-3 rounded-md border border-border bg-surface p-4">
          <CopyUrlButton path={`/event/${eventIdStr}`} />
        </div>
      </section>

      {/* ============ イベント複製 ============ */}
      <section className="mt-8" data-testid="admin-more-duplicate">
        <h3 className="text-base font-semibold">イベントを複製</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          現在のイベントを draft 状態で複製します。コピーする要素 (参加枠 / タグ / アンケート / 発表資料) と開催日のシフト日数を指定できます。
        </p>
        <div className="mt-3">
          <DuplicateEventModal eventId={eventIdStr} />
        </div>
      </section>

      {/* ============ イベント中止 ============ */}
      <section className="mt-8" data-testid="admin-more-cancel">
        <h3 className="text-base font-semibold text-red-600">
          イベントを中止する
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          状態を <code>cancelled</code> にします。参加者には通知は自動送信されないため
          別途 Blasts タブからお知らせを送ってください。
        </p>
        {isCancelled ? (
          <p className="mt-3 text-sm text-muted-foreground">
            このイベントは既に中止済みです。
          </p>
        ) : (
          <form action={cancelEvent} className="mt-3">
            <input type="hidden" name="eventId" value={eventIdStr} />
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-md border border-red-600 bg-red-50 px-5 text-sm font-semibold text-red-600 hover:bg-red-100"
              data-testid="admin-more-cancel-button"
            >
              イベントを中止する
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

function ActionCard({
  href,
  title,
  desc,
  testId,
}: {
  href: string;
  title: string;
  desc: string;
  testId?: string;
}) {
  return (
    <Link
      href={href}
      data-testid={testId}
      className="rounded-md border border-border bg-surface p-4 transition-colors hover:bg-brand-orange-soft"
    >
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </Link>
  );
}
