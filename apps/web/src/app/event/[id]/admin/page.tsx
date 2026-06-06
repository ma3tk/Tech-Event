/**
 * 主催者ダッシュボード Overview タブ (Luma 風 6 タブの 1 つ目)
 *
 * - KPI カード4枚: 累計申込 / 参加確定 / 補欠 / キャンセル (+ 参加率)
 * - 直近 24 時間の申込数推移 (時間別 SVG バー)
 * - 次のアクション (Send Blast / CSV / Check-in 等への導線)
 * - lottery 枠がある場合は抽選実行ボタン (既存機能を保持)
 * - 参加枠別集計 / 参加者一覧 (簡易) を従来通り表示
 *
 * 認可は layout.tsx 側で済んでいるが、redirect 整合性のためここでも防御する。
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatNumber } from "@/lib/utils";
import { runLottery } from "@/app/actions/lottery-actions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventAdminOverviewPage({ params }: PageProps) {
  const { id: raw } = await params;
  if (!/^\d+$/.test(raw)) notFound();
  const eventId = BigInt(raw);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/event/${raw}/admin`)}`);
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      group: true,
      roles: { orderBy: { displayOrder: "asc" } },
      participants: {
        include: { user: true, eventRole: true },
        orderBy: { appliedAt: "asc" },
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

  // 集計
  const counts = {
    accepted: 0,
    waiting: 0,
    cancelled: 0,
    attended: 0,
    no_show: 0,
    pending: 0,
  };
  for (const p of event.participants) {
    if (p.status in counts) {
      counts[p.status as keyof typeof counts] += 1;
    }
  }
  const total = event.participants.length;
  const attendanceRate =
    counts.accepted + counts.attended + counts.no_show > 0
      ? counts.attended /
        (counts.accepted + counts.attended + counts.no_show)
      : null;

  // 直近 24 時間の申込数推移 (時間別)
  const now = new Date();
  const buckets: { hour: number; count: number; label: string }[] = [];
  for (let i = 23; i >= 0; i--) {
    const slotStart = new Date(now.getTime() - (i + 1) * 60 * 60 * 1000);
    const slotEnd = new Date(now.getTime() - i * 60 * 60 * 1000);
    const c = event.participants.filter((p) => {
      const t = p.appliedAt.getTime();
      return t >= slotStart.getTime() && t < slotEnd.getTime();
    }).length;
    buckets.push({
      hour: slotEnd.getHours(),
      count: c,
      label: `${slotEnd.getHours()}時`,
    });
  }
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));

  // 参加枠別集計
  const roleStats = event.roles.map((r) => {
    const roleParticipants = event.participants.filter(
      (p) => p.eventRoleId === r.id,
    );
    return {
      id: r.id.toString(),
      name: r.name,
      capacity: r.capacity,
      recruitmentMethod: r.recruitmentMethod,
      accepted: roleParticipants.filter((p) => p.status === "accepted").length,
      waiting: roleParticipants.filter((p) => p.status === "waiting").length,
      cancelled: roleParticipants.filter((p) => p.status === "cancelled")
        .length,
      attended: roleParticipants.filter((p) => p.status === "attended").length,
      pending: roleParticipants.filter((p) => p.status === "pending").length,
    };
  });

  const hasLotteryRole = event.roles.some(
    (r) => r.recruitmentMethod === "lottery",
  );
  const eventIdStr = event.id.toString();

  return (
    <div data-testid="admin-panel-overview">
      {/* ============ KPI カード ============ */}
      <section
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        data-testid="admin-stats"
      >
        <Stat label="累計申込" value={total} testId="admin-stat-total" />
        <Stat
          label="参加確定"
          value={counts.accepted + counts.attended}
          testId="admin-stat-accepted"
        />
        <Stat
          label="補欠"
          value={counts.waiting}
          testId="admin-stat-waiting"
        />
        <Stat
          label="キャンセル"
          value={counts.cancelled}
          testId="admin-stat-cancelled"
        />
        <Stat
          label="参加率"
          value={
            attendanceRate == null
              ? "—"
              : `${Math.round(attendanceRate * 100)}%`
          }
          testId="admin-stat-attendance-rate"
        />
        <Stat label="保留" value={counts.pending} />
        <Stat label="出席済" value={counts.attended} />
        <Stat label="未出席" value={counts.no_show} />
      </section>

      {/* ============ 直近 24h 申込推移 ============ */}
      <section className="mt-8" data-testid="admin-recent-signups">
        <h2 className="mb-3 text-lg font-bold">直近24時間の申込推移</h2>
        <div className="rounded-md border border-border bg-surface p-4">
          <svg
            viewBox="0 0 480 120"
            className="h-32 w-full"
            role="img"
            aria-label="24時間別の申込数バーチャート"
          >
            {buckets.map((b, i) => {
              const barW = 480 / buckets.length;
              const h = (b.count / maxCount) * 96;
              const x = i * barW + 2;
              const y = 100 - h;
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={y}
                    width={barW - 4}
                    height={Math.max(1, h)}
                    fill="currentColor"
                    className="text-brand-orange/80"
                  />
                  {(i % 4 === 0 || i === buckets.length - 1) && (
                    <text
                      x={x + (barW - 4) / 2}
                      y={115}
                      textAnchor="middle"
                      fontSize="9"
                      fill="currentColor"
                      className="text-muted-foreground"
                    >
                      {b.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          <p className="mt-2 text-xs text-muted-foreground">
            最大: {maxCount} 件 / 24h 合計:{" "}
            {buckets.reduce((s, b) => s + b.count, 0)} 件
          </p>
        </div>
      </section>

      {/* ============ 次のアクション ============ */}
      <section className="mt-8" data-testid="admin-quick-actions">
        <h2 className="mb-3 text-lg font-bold">次のアクション</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <QuickAction
            href={`/event/${eventIdStr}/admin/blasts`}
            title="メッセージを送信"
            desc="確定者・補欠・全員へ一斉配信"
          />
          <QuickAction
            href={`/event/${eventIdStr}/admin/guests/export.csv`}
            title="参加者CSVをダウンロード"
            desc="氏名 / 枠 / ステータスを含む"
            download
          />
          <QuickAction
            href={`/event/${eventIdStr}/admin/check-in`}
            title="出席管理"
            desc="当日のチェックインを記録"
          />
        </div>
      </section>

      {/* ============ 抽選操作 (lottery 枠があるときのみ) ============ */}
      {hasLotteryRole && (
        <section className="mt-8" data-testid="admin-lottery-section">
          <h2 className="mb-3 text-lg font-bold">抽選</h2>
          <div className="rounded-md border border-border bg-surface p-5">
            <p className="mb-3 text-sm text-muted-foreground">
              抽選方式の枠について、現在 `pending` の参加者から当選者をランダムに
              選出します。capacity 分を当選 (accepted)、残りを補欠 (waiting) に
              振り分け、結果はサイト内通知で各参加者に届きます。
            </p>
            {event.lotteryAnnounceAt && (
              <p className="mb-3 text-xs text-muted-foreground">
                抽選発表予定日時:{" "}
                {event.lotteryAnnounceAt.toLocaleString("ja-JP")}
              </p>
            )}
            <form action={runLottery} data-testid="run-lottery-form">
              <input type="hidden" name="eventId" value={eventIdStr} />
              <button
                type="submit"
                className="inline-flex h-10 items-center rounded-md bg-brand-orange px-5 text-sm font-semibold text-white hover:bg-brand-orange-hover"
                data-testid="run-lottery-button"
              >
                今すぐ抽選を実行
              </button>
            </form>
          </div>
        </section>
      )}

      {/* ============ 参加枠別集計 ============ */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold">参加枠別状況</h2>
        <div className="overflow-x-auto rounded-md border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-background text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">枠名</th>
                <th className="px-3 py-2 text-right">定員</th>
                <th className="px-3 py-2 text-right">参加確定</th>
                <th className="px-3 py-2 text-right">補欠</th>
                <th className="px-3 py-2 text-right">キャンセル</th>
                <th className="px-3 py-2 text-right">出席</th>
              </tr>
            </thead>
            <tbody>
              {roleStats.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-medium">{r.name}</td>
                  <td className="px-3 py-2 text-right">
                    {r.capacity ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right">{r.accepted}</td>
                  <td className="px-3 py-2 text-right">{r.waiting}</td>
                  <td className="px-3 py-2 text-right">{r.cancelled}</td>
                  <td className="px-3 py-2 text-right">{r.attended}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ============ 参加者一覧 (概要) ============ */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            参加者一覧 ({formatNumber(total)} 人)
          </h2>
          <Link
            href={`/event/${eventIdStr}/admin/guests`}
            className="text-sm text-link hover:underline"
          >
            すべて見る →
          </Link>
        </div>
        {event.participants.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
            まだ参加者はいません。
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border bg-surface">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-background text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">ユーザー</th>
                  <th className="px-3 py-2 text-left">枠</th>
                  <th className="px-3 py-2 text-left">状態</th>
                  <th className="px-3 py-2 text-left">申込日時</th>
                  <th className="px-3 py-2 text-left">出席</th>
                </tr>
              </thead>
              <tbody>
                {event.participants.slice(0, 10).map((p) => (
                  <tr
                    key={p.id.toString()}
                    className="border-b border-border last:border-0"
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
                    <td className="px-3 py-2">{p.eventRole.name}</td>
                    <td className="px-3 py-2">
                      <StatusPill status={p.status} />
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {p.appliedAt.toLocaleString("ja-JP")}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {p.checkInAt
                        ? p.checkInAt.toLocaleString("ja-JP")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  testId,
}: {
  label: string;
  value: number | string;
  testId?: string;
}) {
  return (
    <div
      className="rounded-md border border-border bg-surface p-4"
      data-testid={testId}
    >
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold">
        {typeof value === "number" ? formatNumber(value) : value}
      </p>
    </div>
  );
}

function QuickAction({
  href,
  title,
  desc,
  download,
}: {
  href: string;
  title: string;
  desc: string;
  download?: boolean;
}) {
  if (download) {
    return (
      <a
        href={href}
        className="rounded-md border border-border bg-surface p-4 transition-colors hover:bg-brand-orange-soft"
      >
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
      </a>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-md border border-border bg-surface p-4 transition-colors hover:bg-brand-orange-soft"
    >
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </Link>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    accepted: "bg-brand-orange-soft text-brand-orange",
    waiting: "bg-zinc-100 text-zinc-700",
    cancelled: "bg-status-cancelled-bg/30 text-status-cancelled-fg",
    attended: "bg-status-ended-bg text-status-ended-fg",
    pending: "bg-zinc-100 text-zinc-700",
    no_show: "bg-status-full-bg/30 text-status-full-fg",
  };
  const label: Record<string, string> = {
    accepted: "参加確定",
    waiting: "補欠",
    cancelled: "キャンセル",
    attended: "出席",
    pending: "保留",
    no_show: "未出席",
  };
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
        map[status] ?? "bg-zinc-100 text-zinc-700"
      }`}
    >
      {label[status] ?? status}
    </span>
  );
}
