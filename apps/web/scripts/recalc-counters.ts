/**
 * scripts/recalc-counters.ts
 *
 * data-model review (Critical #2,#3,#5 / High #14) のバックフィル用バッチ。
 * 既存 DB に対して以下の denormalized counter を再計算する。
 *
 *   - Group.memberCount       : GroupMember(leftAt IS NULL) を全件 count
 *   - Group.eventCount        : Event(status='published') を全件 count
 *   - Group.presentationCount : PresentationMaterial を全件 count
 *   - Tag.usageCount          : EventTag を全件 count
 *   - Calendar.subscriberCount: CalendarSubscription を全件 count
 *   - Calendar.eventCount     : CalendarEvent を全件 count
 *
 * - 等価性チェック: 既存値と新計算値が異なる場合のみ UPDATE 実行 (ログ出力)
 * - 1 つでも乖離があれば最後に終了コード非 0 で抜ける運用にする (cron で監視可能)
 * - `pnpm db:reset` 後 (seed.ts 通過後) に自動で動かすことを想定
 *
 * 実行:
 *   pnpm tsx scripts/recalc-counters.ts
 */
import { prisma } from "@tech-event/shared-data-access-prisma";

type DiffCounter = {
  table: string;
  id: string;
  field: string;
  old: number;
  next: number;
};

async function recalcGroupCounters(): Promise<DiffCounter[]> {
  const diffs: DiffCounter[] = [];
  const groups = await prisma.group.findMany({
    select: {
      id: true,
      memberCount: true,
      eventCount: true,
      presentationCount: true,
    },
  });
  for (const g of groups) {
    const [member, ev, pres] = await Promise.all([
      prisma.groupMember.count({ where: { groupId: g.id, leftAt: null } }),
      prisma.event.count({ where: { groupId: g.id, status: "published" } }),
      prisma.presentationMaterial.count({ where: { event: { groupId: g.id } } }),
    ]);
    const needsUpdate =
      member !== g.memberCount ||
      ev !== g.eventCount ||
      pres !== g.presentationCount;
    if (needsUpdate) {
      if (member !== g.memberCount) {
        diffs.push({
          table: "groups",
          id: g.id.toString(),
          field: "memberCount",
          old: g.memberCount,
          next: member,
        });
      }
      if (ev !== g.eventCount) {
        diffs.push({
          table: "groups",
          id: g.id.toString(),
          field: "eventCount",
          old: g.eventCount,
          next: ev,
        });
      }
      if (pres !== g.presentationCount) {
        diffs.push({
          table: "groups",
          id: g.id.toString(),
          field: "presentationCount",
          old: g.presentationCount,
          next: pres,
        });
      }
      await prisma.group.update({
        where: { id: g.id },
        data: {
          memberCount: member,
          eventCount: ev,
          presentationCount: pres,
        },
      });
    }
  }
  return diffs;
}

async function recalcTagCounters(): Promise<DiffCounter[]> {
  const diffs: DiffCounter[] = [];
  const tags = await prisma.tag.findMany({
    select: { id: true, usageCount: true },
  });
  // 全 EventTag を groupBy して 1 SQL で取得
  const usage = await prisma.eventTag.groupBy({
    by: ["tagId"],
    _count: { _all: true },
  });
  const usageMap = new Map<string, number>();
  for (const u of usage) {
    usageMap.set(u.tagId.toString(), u._count._all);
  }
  for (const t of tags) {
    const next = usageMap.get(t.id.toString()) ?? 0;
    if (next !== t.usageCount) {
      diffs.push({
        table: "tags",
        id: t.id.toString(),
        field: "usageCount",
        old: t.usageCount,
        next,
      });
      await prisma.tag.update({
        where: { id: t.id },
        data: { usageCount: next },
      });
    }
  }
  return diffs;
}

async function recalcCalendarCounters(): Promise<DiffCounter[]> {
  const diffs: DiffCounter[] = [];
  const cals = await prisma.calendar.findMany({
    select: { id: true, subscriberCount: true, eventCount: true },
  });
  for (const c of cals) {
    const [sub, evt] = await Promise.all([
      prisma.calendarSubscription.count({ where: { calendarId: c.id } }),
      prisma.calendarEvent.count({ where: { calendarId: c.id } }),
    ]);
    if (sub !== c.subscriberCount || evt !== c.eventCount) {
      if (sub !== c.subscriberCount) {
        diffs.push({
          table: "calendars",
          id: c.id.toString(),
          field: "subscriberCount",
          old: c.subscriberCount,
          next: sub,
        });
      }
      if (evt !== c.eventCount) {
        diffs.push({
          table: "calendars",
          id: c.id.toString(),
          field: "eventCount",
          old: c.eventCount,
          next: evt,
        });
      }
      await prisma.calendar.update({
        where: { id: c.id },
        data: { subscriberCount: sub, eventCount: evt },
      });
    }
  }
  return diffs;
}

async function main(): Promise<void> {
  console.log("[recalc-counters] start");
  const t0 = Date.now();
  const all: DiffCounter[] = [];
  all.push(...(await recalcGroupCounters()));
  all.push(...(await recalcTagCounters()));
  all.push(...(await recalcCalendarCounters()));
  const elapsed = Date.now() - t0;
  if (all.length === 0) {
    console.log(`[recalc-counters] OK — no drift (${elapsed}ms)`);
  } else {
    console.log(
      `[recalc-counters] fixed ${all.length} drift(s) in ${elapsed}ms:`,
    );
    for (const d of all) {
      console.log(
        `  - ${d.table}#${d.id}.${d.field}: ${d.old} -> ${d.next}`,
      );
    }
  }
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("[recalc-counters] FAILED:", e);
  await prisma.$disconnect();
  process.exit(1);
});
