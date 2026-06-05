/**
 * Insights タブのデータ集計ヘルパ。
 *
 * - page.tsx (UI) と export.json (Route Handler) の両方から利用する。
 * - SQL の生クエリには依存せず、Prisma の高レベル API のみで集計する。
 *   (SQLite と PostgreSQL でも同一ロジックで動くため。)
 *
 * Privacy 配慮:
 *   - 個人特定情報 (nickname / email / userId) は返さない
 *   - 所属企業 (affiliation) は文字列を trim + 正規化して集計のみ返す
 */

import { prisma } from "@/lib/prisma";
import type { Event, Participant, User } from "@/generated/prisma";

export type AffiliationCount = { name: string; count: number };

export type TimingBucket = { range: string; count: number };

export type WeeklyCancelPoint = {
  label: string;
  rate: number;
  total: number;
  cancelled: number;
};

export type PeerEvent = {
  id: string;
  title: string;
  startedAt: string;
  startedAtFormatted: string;
  applied: number;
  cancelled: number;
  cancelRate: number;
};

export type Insights = {
  eventId: string;
  eventTitle: string;
  groupId: string;
  startedAt: string;
  startedAtFormatted: string;

  totalParticipants: number;
  acceptedCount: number;
  withAffiliation: number;
  withBio: number;
  withProfile: number;

  affiliationsTop: AffiliationCount[];

  applyHourly: number[]; // 長さ 24

  timingBuckets: TimingBucket[];

  weekly: WeeklyCancelPoint[];

  totalCancelled: number;
  lastMinuteCancelled: number;
  lastMinuteCancelRate: number;

  attendedCount: number;
  attendanceRate: number;

  repeaterCount: number;
  repeaterRate: number;

  currentApplied: number;
  currentCancelled: number;
  currentCancelRate: number;
  peers: PeerEvent[];
};

function startOfWeek(d: Date): Date {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  const day = dt.getDay();
  dt.setDate(dt.getDate() - day);
  return dt;
}

function normalizeAffiliation(s: string | null | undefined): string | null {
  if (!s) return null;
  const trimmed = s.trim();
  if (!trimmed) return null;
  // 簡易正規化: 全角空白を半角に
  return trimmed.replace(/　/g, " ");
}

export type EventWithParticipants = Event & {
  participants: (Participant & { user: User })[];
};

/** Insights を集計して返す。`event` には participants + user が include 済みであること。 */
export async function computeInsights(
  event: EventWithParticipants,
): Promise<Insights> {
  const participants = event.participants;
  const totalP = participants.length;

  /* ---------- 参加者属性 ---------- */
  const withAffiliation = participants.filter(
    (p) => !!normalizeAffiliation(p.user.affiliation),
  ).length;
  const withBio = participants.filter(
    (p) => !!p.user.bio && p.user.bio.trim() !== "",
  ).length;
  const withProfile = participants.filter(
    (p) =>
      !!normalizeAffiliation(p.user.affiliation) ||
      (!!p.user.bio && p.user.bio.trim() !== ""),
  ).length;
  const acceptedCount = participants.filter(
    (p) => p.status === "accepted" || p.status === "attended",
  ).length;

  /* ---------- 所属企業 Top10 ---------- */
  const affMap = new Map<string, number>();
  for (const p of participants) {
    const n = normalizeAffiliation(p.user.affiliation);
    if (!n) continue;
    affMap.set(n, (affMap.get(n) ?? 0) + 1);
  }
  const affiliationsTop: AffiliationCount[] = Array.from(affMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  /* ---------- 申込時間帯 (24h) ---------- */
  const applyHourly = Array.from({ length: 24 }, () => 0);
  for (const p of participants) {
    const h = p.appliedAt.getHours();
    if (h >= 0 && h < 24) applyHourly[h] = (applyHourly[h] ?? 0) + 1;
  }

  /* ---------- 申込タイミング分布 ---------- */
  const startedMs = event.startedAt.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const timingBuckets: TimingBucket[] = [
    { range: "30日以上前", count: 0 },
    { range: "14-29日前", count: 0 },
    { range: "7-13日前", count: 0 },
    { range: "3-6日前", count: 0 },
    { range: "1-2日前", count: 0 },
    { range: "当日", count: 0 },
  ];
  for (const p of participants) {
    const diff = Math.floor((startedMs - p.appliedAt.getTime()) / dayMs);
    if (diff >= 30) timingBuckets[0]!.count += 1;
    else if (diff >= 14) timingBuckets[1]!.count += 1;
    else if (diff >= 7) timingBuckets[2]!.count += 1;
    else if (diff >= 3) timingBuckets[3]!.count += 1;
    else if (diff >= 1) timingBuckets[4]!.count += 1;
    else timingBuckets[5]!.count += 1;
  }

  /* ---------- 週ごとのキャンセル率 ---------- */
  const weeklyMap = new Map<
    string,
    { weekStart: Date; total: number; cancelled: number }
  >();
  for (const p of participants) {
    const ws = startOfWeek(p.appliedAt);
    const key = ws.toISOString();
    const v = weeklyMap.get(key) ?? {
      weekStart: ws,
      total: 0,
      cancelled: 0,
    };
    v.total += 1;
    if (p.status === "cancelled") v.cancelled += 1;
    weeklyMap.set(key, v);
  }
  const weekly: WeeklyCancelPoint[] = Array.from(weeklyMap.values())
    .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
    .map((w) => ({
      label: `${w.weekStart.getMonth() + 1}/${w.weekStart.getDate()}〜`,
      rate: w.total > 0 ? w.cancelled / w.total : 0,
      total: w.total,
      cancelled: w.cancelled,
    }));

  /* ---------- 直前キャンセル率 ---------- */
  const cancelled = participants.filter((p) => p.status === "cancelled");
  const totalCancelled = cancelled.length;
  const lastMinuteCancelled = cancelled.filter(
    (p) =>
      p.cancelledAt != null &&
      startedMs - p.cancelledAt.getTime() <= dayMs &&
      startedMs - p.cancelledAt.getTime() >= 0,
  ).length;
  const lastMinuteCancelRate =
    totalCancelled > 0 ? lastMinuteCancelled / totalCancelled : 0;

  /* ---------- 出席率 vs 申込数 ---------- */
  const attendedCount = participants.filter(
    (p) => p.status === "attended" || p.checkInAt != null,
  ).length;
  const attendanceRate =
    acceptedCount > 0 ? attendedCount / acceptedCount : 0;

  /* ---------- 同グループの過去イベント比較 ---------- */
  const peerEventsRaw = await prisma.event.findMany({
    where: {
      groupId: event.groupId,
      id: { not: event.id },
      status: { in: ["published", "closed"] },
    },
    select: { id: true, title: true, startedAt: true },
    orderBy: { startedAt: "desc" },
    take: 6,
  });
  const peers: PeerEvent[] = [];
  for (const e of peerEventsRaw) {
    const ps = await prisma.participant.findMany({
      where: { eventId: e.id },
      select: { status: true },
    });
    const applied = ps.length;
    const cancelledN = ps.filter((p) => p.status === "cancelled").length;
    peers.push({
      id: e.id.toString(),
      title: e.title,
      startedAt: e.startedAt.toISOString(),
      startedAtFormatted: e.startedAt.toLocaleDateString("ja-JP"),
      applied,
      cancelled: cancelledN,
      cancelRate: applied > 0 ? cancelledN / applied : 0,
    });
  }
  const currentApplied = totalP;
  const currentCancelled = participants.filter((p) => p.status === "cancelled")
    .length;
  const currentCancelRate =
    currentApplied > 0 ? currentCancelled / currentApplied : 0;

  /* ---------- リピーター率 (同グループの他イベントに参加経験あり) ---------- */
  // 参加者の userId を集めて、同グループの他イベント参加履歴を 1 クエリで引く
  let repeaterCount = 0;
  if (participants.length > 0 && peerEventsRaw.length > 0) {
    const userIds = Array.from(
      new Set(participants.map((p) => p.userId.toString())),
    ).map((s) => BigInt(s));
    const peerEventIds = peerEventsRaw.map((e) => e.id);
    const histories = await prisma.participant.findMany({
      where: {
        userId: { in: userIds },
        eventId: { in: peerEventIds },
        status: { in: ["accepted", "attended", "waiting"] },
      },
      select: { userId: true },
    });
    const repeaterIds = new Set(histories.map((h) => h.userId.toString()));
    // 「現在の participants の中で repeaterIds に含まれる人数」を数える
    const presentUserIds = new Set(participants.map((p) => p.userId.toString()));
    repeaterCount = Array.from(presentUserIds).filter((id) =>
      repeaterIds.has(id),
    ).length;
  }
  const repeaterRate = totalP > 0 ? repeaterCount / totalP : 0;

  return {
    eventId: event.id.toString(),
    eventTitle: event.title,
    groupId: event.groupId.toString(),
    startedAt: event.startedAt.toISOString(),
    startedAtFormatted: event.startedAt.toLocaleDateString("ja-JP"),

    totalParticipants: totalP,
    acceptedCount,
    withAffiliation,
    withBio,
    withProfile,

    affiliationsTop,
    applyHourly,
    timingBuckets,
    weekly,

    totalCancelled,
    lastMinuteCancelled,
    lastMinuteCancelRate,

    attendedCount,
    attendanceRate,

    repeaterCount,
    repeaterRate,

    currentApplied,
    currentCancelled,
    currentCancelRate,
    peers,
  };
}
