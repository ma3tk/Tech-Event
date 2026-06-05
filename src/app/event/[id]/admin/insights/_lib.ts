/**
 * Insights タブのデータ集計ヘルパ (SQL 化版)。
 *
 * - page.tsx (UI) と export.json (Route Handler) の両方から利用する。
 * - 旧版は `event.participants` (`include: { user: true }`) を全件 fetch して JS で
 *   filter/group していたが、参加者規模が増えると線形に重くなる。
 * - 本実装は Prisma の `groupBy` / `count` / `$queryRaw` を使い、
 *   集計は DB レイヤで完了させ、ID と少数の集計値だけを Node に持ち上げる。
 *   100 参加者規模で計算時間 < 100ms を目標。
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
  return trimmed.replace(/　/g, " ");
}

export type EventWithParticipants = Event & {
  participants: (Participant & { user: User })[];
};

/**
 * Insights を SQL 集計ベースで返す。
 *
 * 旧 `computeInsights(event)` との互換のため引数で `event` を受けるが、内部では
 * `event.id`/`event.groupId`/`event.startedAt`/`event.title` のみ利用する。
 * `event.participants` (include 済み) は **使わない** (SQL 集計に切替済み)。
 *
 * 戻り値型・項目名は旧版と完全一致。
 */
export async function computeInsightsSQL(
  event: Pick<Event, "id" | "groupId" | "startedAt" | "title">,
): Promise<Insights> {
  const eventId = event.id;
  const startedMs = event.startedAt.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  /* ============================================================
   * 1) 参加者件数 + status 別件数 + appliedAt / cancelledAt / checkInAt
   *    を 1 クエリで取得 (raw query を避け、findMany + minimum select)。
   *
   *    bigint 集計はサポートが弱いので、必要な行だけ取って Node 側で纏める。
   * ============================================================ */
  const participants = await prisma.participant.findMany({
    where: { eventId },
    select: {
      userId: true,
      status: true,
      appliedAt: true,
      cancelledAt: true,
      checkInAt: true,
    },
  });

  const totalP = participants.length;
  let acceptedCount = 0;
  let totalCancelled = 0;
  let lastMinuteCancelled = 0;
  let attendedCount = 0;
  const applyHourly = Array.from({ length: 24 }, () => 0);
  const timingBuckets: TimingBucket[] = [
    { range: "30日以上前", count: 0 },
    { range: "14-29日前", count: 0 },
    { range: "7-13日前", count: 0 },
    { range: "3-6日前", count: 0 },
    { range: "1-2日前", count: 0 },
    { range: "当日", count: 0 },
  ];
  const weeklyMap = new Map<
    string,
    { weekStart: Date; total: number; cancelled: number }
  >();
  const userIdSet = new Set<bigint>();

  for (const p of participants) {
    userIdSet.add(p.userId);
    if (p.status === "accepted" || p.status === "attended") acceptedCount++;
    if (p.status === "attended" || p.checkInAt != null) attendedCount++;
    if (p.status === "cancelled") {
      totalCancelled++;
      if (
        p.cancelledAt != null &&
        startedMs - p.cancelledAt.getTime() <= dayMs &&
        startedMs - p.cancelledAt.getTime() >= 0
      ) {
        lastMinuteCancelled++;
      }
    }
    const h = p.appliedAt.getHours();
    if (h >= 0 && h < 24) applyHourly[h] = (applyHourly[h] ?? 0) + 1;
    const diff = Math.floor((startedMs - p.appliedAt.getTime()) / dayMs);
    if (diff >= 30) timingBuckets[0]!.count += 1;
    else if (diff >= 14) timingBuckets[1]!.count += 1;
    else if (diff >= 7) timingBuckets[2]!.count += 1;
    else if (diff >= 3) timingBuckets[3]!.count += 1;
    else if (diff >= 1) timingBuckets[4]!.count += 1;
    else timingBuckets[5]!.count += 1;

    const ws = startOfWeek(p.appliedAt);
    const key = ws.toISOString();
    const v = weeklyMap.get(key) ?? { weekStart: ws, total: 0, cancelled: 0 };
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

  const lastMinuteCancelRate =
    totalCancelled > 0 ? lastMinuteCancelled / totalCancelled : 0;
  const attendanceRate =
    acceptedCount > 0 ? attendedCount / acceptedCount : 0;

  /* ============================================================
   * 2) 参加者属性: affiliation / bio 状態 + 所属 Top10
   *    SQL の groupBy(by:['affiliation']) で集計し、bio 集計は count(where) を 2 本だけ。
   * ============================================================ */
  const userIds = Array.from(userIdSet);
  const [affiliationGroups, withAffiliation, withBio, withProfile] =
    userIds.length === 0
      ? [[], 0, 0, 0]
      : await Promise.all([
          prisma.user.groupBy({
            by: ["affiliation"],
            where: { id: { in: userIds } },
            _count: { _all: true },
            // SQLite では orderBy の _count 指定で `_all` を直接書けないので、
            // 取得後に Node で sort/slice する。groupBy 1 クエリで全所属を取って
            // userIds 件数で線形に収まる。
          }),
          prisma.user.count({
            where: {
              id: { in: userIds },
              affiliation: { not: null },
            },
          }),
          prisma.user.count({
            where: {
              id: { in: userIds },
              bio: { not: null },
            },
          }),
          prisma.user.count({
            where: {
              id: { in: userIds },
              OR: [
                { affiliation: { not: null } },
                { bio: { not: null } },
              ],
            },
          }),
        ]);

  const affMap = new Map<string, number>();
  for (const g of affiliationGroups) {
    const n = normalizeAffiliation(g.affiliation);
    if (!n) continue;
    affMap.set(n, (affMap.get(n) ?? 0) + g._count._all);
  }
  const affiliationsTop: AffiliationCount[] = Array.from(affMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  /* ============================================================
   * 3) 同グループの過去イベント peer 集計
   *    旧: peer 各々で `participant.findMany` (6 SQL)
   *    新: peer 一覧 1 SQL + groupBy(by:['eventId','status']) 1 SQL
   * ============================================================ */
  const peerEventsRaw = await prisma.event.findMany({
    where: {
      groupId: event.groupId,
      id: { not: eventId },
      status: { in: ["published", "closed"] },
    },
    select: { id: true, title: true, startedAt: true },
    orderBy: { startedAt: "desc" },
    take: 6,
  });

  const peerEventIds = peerEventsRaw.map((e) => e.id);
  const peerGrouped =
    peerEventIds.length === 0
      ? []
      : await prisma.participant.groupBy({
          by: ["eventId", "status"],
          where: { eventId: { in: peerEventIds } },
          _count: { _all: true },
        });

  // eventId ごとに applied (全件) と cancelled の数を集計
  const peerStats = new Map<
    string,
    { applied: number; cancelled: number }
  >();
  for (const row of peerGrouped) {
    const key = row.eventId.toString();
    const v = peerStats.get(key) ?? { applied: 0, cancelled: 0 };
    v.applied += row._count._all;
    if (row.status === "cancelled") v.cancelled += row._count._all;
    peerStats.set(key, v);
  }

  const peers: PeerEvent[] = peerEventsRaw.map((e) => {
    const s = peerStats.get(e.id.toString()) ?? { applied: 0, cancelled: 0 };
    return {
      id: e.id.toString(),
      title: e.title,
      startedAt: e.startedAt.toISOString(),
      startedAtFormatted: e.startedAt.toLocaleDateString("ja-JP"), // insights は管理画面 (主催者) なので ja-JP 固定 OK
      applied: s.applied,
      cancelled: s.cancelled,
      cancelRate: s.applied > 0 ? s.cancelled / s.applied : 0,
    };
  });

  /* ============================================================
   * 4) リピーター率
   *    旧: participants 全件で repeaterIds Set を作り、現 participant とマッチ
   *    新: 「peer events に accepted/attended/waiting で含まれる userId distinct」を
   *        IN クエリ 1 本で抽出 → 現参加者 userIds とインターセクト
   * ============================================================ */
  let repeaterCount = 0;
  if (userIds.length > 0 && peerEventIds.length > 0) {
    const histories = await prisma.participant.findMany({
      where: {
        userId: { in: userIds },
        eventId: { in: peerEventIds },
        status: { in: ["accepted", "attended", "waiting"] },
      },
      select: { userId: true },
      distinct: ["userId"],
    });
    repeaterCount = histories.length;
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

    currentApplied: totalP,
    currentCancelled: totalCancelled,
    currentCancelRate: totalP > 0 ? totalCancelled / totalP : 0,
    peers,
  };
}

/**
 * 旧 API 互換: `EventWithParticipants` を渡しても動くよう薄くラップする。
 * 内部は SQL 集計版 `computeInsightsSQL` を呼ぶ (event の participants は無視)。
 */
export async function computeInsights(
  event: EventWithParticipants,
): Promise<Insights> {
  return computeInsightsSQL(event);
}
