/**
 * 主催者ダッシュボード Insights タブ (高度版)
 *
 * 既存指標 (申込タイミング分布 / 週次キャンセル率 / 同グループ比較) に加え、
 * 以下の新指標を追加:
 *
 *  1. 参加者所属企業 Top10 (個人特定は避け、affiliation 文字列ベースで集計)
 *  2. リピーター率 (過去に同 group のイベントに 1 度以上参加した割合)
 *  3. 申込時間帯 24h ヒートマップ (申込時刻の時間別件数)
 *  4. 直前キャンセル率 (キャンセル理由の代替: イベント開始 24h 以内の cancel 比率)
 *  5. 出席率 vs 申込数比較 (accepted のうち attended になった人の割合)
 *  6. 同グループ過去イベント比較 (申込数の棒グラフ視覚化を追加)
 *  7. JSON エクスポート (/export.json)
 *
 * Privacy: 個人特定情報は出さず、集計値のみ。affiliation は trim + 正規化済み。
 * チャートはすべて自前 SVG。外部 dep は無し。
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

import { computeInsights, type Insights } from "./_lib";

export const dynamic = "force-dynamic";

export default async function EventAdminInsightsPage({
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
      `/login?next=${encodeURIComponent(`/event/${raw}/admin/insights`)}`,
    );
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { participants: { include: { user: true } } },
  });
  if (!event) notFound();
  const isOwner = event.ownerId === user.id;
  const admin = await prisma.groupAdmin.findUnique({
    where: { groupId_userId: { groupId: event.groupId, userId: user.id } },
  });
  const isAdmin =
    !!admin && (admin.role === "owner" || admin.role === "admin");
  if (!isOwner && !isAdmin) notFound();

  const insights = await computeInsights(event);

  return (
    <div data-testid="admin-panel-insights">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Insights</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            参加者属性 / 所属企業集計 / リピーター率 / 申込時間帯 / 直前キャンセル率 /
            出席率 / 過去イベント比較。集計値のみ表示します。
          </p>
        </div>
        <Link
          href={`/event/${raw}/admin/insights/export.json`}
          data-testid="insights-export-link"
          className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium hover:bg-brand-orange-soft"
        >
          JSON エクスポート
        </Link>
      </div>

      <KpiRow insights={insights} />
      <Affiliations insights={insights} />
      <HourlyHeatmap insights={insights} />
      <TimingBuckets insights={insights} />
      <WeeklyCancel insights={insights} />
      <LastMinuteCancel insights={insights} />
      <AttendanceVsApplied insights={insights} />
      <PeersComparison insights={insights} />
      <RepeaterRate insights={insights} />
    </div>
  );
}

/* ============================================================
 * セクション群
 * ============================================================ */

function KpiRow({ insights }: { insights: Insights }) {
  const { totalParticipants, withAffiliation, withBio } = insights;
  return (
    <section className="mt-6">
      <h3 className="text-base font-semibold">参加者属性</h3>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <AttributeCard
          label="所属あり"
          count={withAffiliation}
          total={totalParticipants}
        />
        <AttributeCard
          label="Bio あり"
          count={withBio}
          total={totalParticipants}
        />
        <AttributeCard
          label="プロフィール充実"
          count={insights.withProfile}
          total={totalParticipants}
        />
      </div>
    </section>
  );
}

function Affiliations({ insights }: { insights: Insights }) {
  const max = Math.max(1, ...insights.affiliationsTop.map((a) => a.count));
  return (
    <section className="mt-8" data-testid="admin-insights-affiliations">
      <h3 className="text-base font-semibold">所属企業 Top10</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        参加者の所属情報を集計 (個人名は表示しません)。
      </p>
      {insights.affiliationsTop.length === 0 ? (
        <div className="mt-3 rounded-md border border-dashed border-border bg-surface p-6 text-center text-sm text-muted-foreground">
          所属情報を入力している参加者がいません。
        </div>
      ) : (
        <ul className="mt-3 space-y-1 rounded-md border border-border bg-surface p-4">
          {insights.affiliationsTop.map((a) => (
            <li key={a.name} className="flex items-center gap-3 text-sm">
              <span className="w-40 truncate">{a.name}</span>
              <div className="relative flex-1 h-3 overflow-hidden rounded bg-zinc-100">
                <div
                  className="absolute inset-y-0 left-0 bg-brand-orange/70"
                  style={{ width: `${(a.count / max) * 100}%` }}
                />
              </div>
              <span className="tabular-nums text-xs text-muted-foreground w-10 text-right">
                {a.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function HourlyHeatmap({ insights }: { insights: Insights }) {
  const max = Math.max(1, ...insights.applyHourly);
  return (
    <section className="mt-8" data-testid="admin-insights-hourly">
      <h3 className="text-base font-semibold">申込時間帯分布 (24時間)</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        参加者が申込ボタンを押した時刻 (JST) の集計。
      </p>
      <div className="mt-3 rounded-md border border-border bg-surface p-4">
        <svg
          viewBox="0 0 480 100"
          className="h-24 w-full"
          role="img"
          aria-label="申込時間帯ヒートマップ"
        >
          {insights.applyHourly.map((c, i) => {
            const cellW = 480 / 24;
            const ratio = c / max;
            const alpha = 0.15 + ratio * 0.85;
            return (
              <g key={i}>
                <rect
                  x={i * cellW + 2}
                  y={20}
                  width={cellW - 4}
                  height={60}
                  /* Data viz palette: 申込時間帯 = chart-2 (オレンジ) */
                  fill="var(--chart-2)"
                  fillOpacity={alpha}
                />
                <text
                  x={i * cellW + cellW / 2}
                  y={94}
                  textAnchor="middle"
                  fontSize="8"
                  fill="currentColor"
                  className="text-muted-foreground"
                >
                  {i}
                </text>
                <text
                  x={i * cellW + cellW / 2}
                  y={14}
                  textAnchor="middle"
                  fontSize="8"
                  fill="currentColor"
                  className="text-foreground"
                >
                  {c > 0 ? c : ""}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

function TimingBuckets({ insights }: { insights: Insights }) {
  const { timingBuckets } = insights;
  const max = Math.max(1, ...timingBuckets.map((b) => b.count));
  return (
    <section className="mt-8" data-testid="admin-insights-timing">
      <h3 className="text-base font-semibold">申込タイミング分布</h3>
      <div className="mt-3 rounded-md border border-border bg-surface p-4">
        <svg
          viewBox="0 0 480 160"
          className="h-40 w-full"
          role="img"
          aria-label="申込タイミング分布バーチャート"
        >
          {timingBuckets.map((b, i) => {
            const barW = 480 / timingBuckets.length;
            const h = (b.count / max) * 120;
            const x = i * barW + 6;
            const y = 130 - h;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barW - 12}
                  height={Math.max(1, h)}
                  /* Data viz palette: 申込タイミング = chart-1 (青) */
                  fill="var(--chart-1)"
                  fillOpacity={0.85}
                />
                <text
                  x={x + (barW - 12) / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fontSize="10"
                  fill="currentColor"
                  className="text-foreground"
                >
                  {b.count}
                </text>
                <text
                  x={x + (barW - 12) / 2}
                  y={150}
                  textAnchor="middle"
                  fontSize="9"
                  fill="currentColor"
                  className="text-muted-foreground"
                >
                  {b.range}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

function WeeklyCancel({ insights }: { insights: Insights }) {
  const { weekly } = insights;
  return (
    <section className="mt-8" data-testid="admin-insights-cancel-rate">
      <h3 className="text-base font-semibold">週ごとのキャンセル率推移</h3>
      {weekly.length === 0 ? (
        <div className="mt-3 rounded-md border border-dashed border-border bg-surface p-6 text-center text-sm text-muted-foreground">
          集計対象の申込履歴がありません。
        </div>
      ) : (
        <div className="mt-3 rounded-md border border-border bg-surface p-4">
          <svg
            viewBox="0 0 480 160"
            className="h-40 w-full"
            role="img"
            aria-label="キャンセル率推移バーチャート"
          >
            {weekly.map((w, i) => {
              const barW = 480 / Math.max(1, weekly.length);
              const h = w.rate * 120;
              const x = i * barW + 6;
              const y = 130 - h;
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={y}
                    width={barW - 12}
                    height={Math.max(1, h)}
                    /* Data viz palette: 警告系 = chart-6 (ヴァーミリオン) */
                    fill="var(--chart-6)"
                    fillOpacity={0.85}
                  />
                  <text
                    x={x + (barW - 12) / 2}
                    y={y - 4}
                    textAnchor="middle"
                    fontSize="9"
                    fill="currentColor"
                    className="text-foreground"
                  >
                    {Math.round(w.rate * 100)}%
                  </text>
                  <text
                    x={x + (barW - 12) / 2}
                    y={150}
                    textAnchor="middle"
                    fontSize="9"
                    fill="currentColor"
                    className="text-muted-foreground"
                  >
                    {w.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </section>
  );
}

function LastMinuteCancel({ insights }: { insights: Insights }) {
  const { lastMinuteCancelRate, totalCancelled, lastMinuteCancelled } =
    insights;
  return (
    <section className="mt-8" data-testid="admin-insights-last-minute">
      <h3 className="text-base font-semibold">直前キャンセル率</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        イベント開始 24 時間以内に行われたキャンセルの比率。
      </p>
      <div className="mt-3 rounded-md border border-border bg-surface p-4">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold">
            {Math.round(lastMinuteCancelRate * 100)}%
          </span>
          <span className="text-sm text-muted-foreground">
            ({lastMinuteCancelled} / {totalCancelled})
          </span>
        </div>
        <div className="mt-3 h-3 w-full overflow-hidden rounded bg-zinc-100">
          <div
            className="h-full bg-status-cancelled-fg"
            style={{ width: `${Math.round(lastMinuteCancelRate * 100)}%` }}
          />
        </div>
      </div>
    </section>
  );
}

function AttendanceVsApplied({ insights }: { insights: Insights }) {
  const { attendedCount, acceptedCount, attendanceRate } = insights;
  return (
    <section className="mt-8" data-testid="admin-insights-attendance">
      <h3 className="text-base font-semibold">出席率 vs 申込数</h3>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <AttributeCard
          label="申込確定"
          count={acceptedCount}
          total={insights.totalParticipants}
        />
        <AttributeCard
          label="当日出席"
          count={attendedCount}
          total={acceptedCount}
        />
        <AttributeCard
          label="出席率"
          count={Math.round(attendanceRate * 100)}
          total={100}
          unit="%"
        />
      </div>
    </section>
  );
}

function PeersComparison({ insights }: { insights: Insights }) {
  const { peers, currentApplied, currentCancelled, currentCancelRate } =
    insights;
  const max = Math.max(1, currentApplied, ...peers.map((p) => p.applied));
  return (
    <section className="mt-8" data-testid="admin-insights-peers">
      <h3 className="text-base font-semibold">
        同グループの過去イベントとの比較
      </h3>

      {/* 申込数の棒グラフ */}
      <div className="mt-3 rounded-md border border-border bg-surface p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-28 truncate text-sm font-semibold">
              本イベント
            </span>
            <div className="relative flex-1 h-4 overflow-hidden rounded bg-zinc-100">
              <div
                className="absolute inset-y-0 left-0 bg-brand-orange"
                style={{ width: `${(currentApplied / max) * 100}%` }}
              />
            </div>
            <span className="w-12 text-right text-xs tabular-nums">
              {currentApplied}
            </span>
          </div>
          {peers.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <span className="w-28 truncate text-sm text-muted-foreground">
                {p.title}
              </span>
              <div className="relative flex-1 h-4 overflow-hidden rounded bg-zinc-100">
                <div
                  className="absolute inset-y-0 left-0 bg-brand-orange/40"
                  style={{ width: `${(p.applied / max) * 100}%` }}
                />
              </div>
              <span className="w-12 text-right text-xs tabular-nums">
                {p.applied}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 overflow-x-auto rounded-md border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-background text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">イベント</th>
              <th className="px-3 py-2 text-left">開催日</th>
              <th className="px-3 py-2 text-right">申込数</th>
              <th className="px-3 py-2 text-right">キャンセル</th>
              <th className="px-3 py-2 text-right">キャンセル率</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border bg-brand-orange-soft/40 font-semibold">
              <td className="px-3 py-2">本イベント</td>
              <td className="px-3 py-2 text-xs">
                {insights.startedAtFormatted}
              </td>
              <td className="px-3 py-2 text-right">{currentApplied}</td>
              <td className="px-3 py-2 text-right">{currentCancelled}</td>
              <td className="px-3 py-2 text-right">
                {Math.round(currentCancelRate * 100)}%
              </td>
            </tr>
            {peers.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  比較対象の過去イベントはありません。
                </td>
              </tr>
            ) : (
              peers.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-3 py-2">{p.title}</td>
                  <td className="px-3 py-2 text-xs">{p.startedAtFormatted}</td>
                  <td className="px-3 py-2 text-right">{p.applied}</td>
                  <td className="px-3 py-2 text-right">{p.cancelled}</td>
                  <td className="px-3 py-2 text-right">
                    {Math.round(p.cancelRate * 100)}%
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RepeaterRate({ insights }: { insights: Insights }) {
  const { repeaterCount, repeaterRate } = insights;
  return (
    <section className="mt-8 mb-6" data-testid="admin-insights-repeater">
      <h3 className="text-base font-semibold">リピーター率</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        参加者のうち、同グループの過去イベントに参加経験がある割合。
      </p>
      <div className="mt-3 rounded-md border border-border bg-surface p-4">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold">
            {Math.round(repeaterRate * 100)}%
          </span>
          <span className="text-sm text-muted-foreground">
            ({repeaterCount} / {insights.totalParticipants})
          </span>
        </div>
        <div className="mt-3 h-3 w-full overflow-hidden rounded bg-zinc-100">
          <div
            className="h-full bg-brand-orange"
            style={{ width: `${Math.round(repeaterRate * 100)}%` }}
          />
        </div>
      </div>
    </section>
  );
}

function AttributeCard({
  label,
  count,
  total,
  unit,
}: {
  label: string;
  count: number;
  total: number;
  unit?: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold">
        {count}
        {unit ?? ""}
      </p>
      {!unit && (
        <>
          <p className="text-xs text-muted-foreground">
            {pct}% / 全 {total} 人
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded bg-zinc-100">
            <div
              className="h-full bg-brand-orange"
              style={{ width: `${pct}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}
