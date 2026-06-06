/**
 * Insights SQL 集計のベンチマーク。
 *
 * 既存イベントを 1 件選び、必要なら一時参加者を追加して `computeInsightsSQL()` の
 * 所要時間を 5 回計測する。`code-review/code-quality.md` High #12 の目標
 * 「100 参加者の event で計算時間 < 100ms」を検証するためのスクリプト。
 *
 * 実行: `npx tsx scripts/bench-insights.ts [--participants=100]`
 */
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/index.js";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

function parseTargetSize(): number {
  const arg = process.argv.find((a) => a.startsWith("--participants="));
  if (!arg) return 100;
  const n = Number(arg.split("=")[1]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 100;
}

async function main() {
  const targetSize = parseTargetSize();

  const target = await prisma.event.findFirst({
    select: { id: true, groupId: true, title: true, startedAt: true },
    orderBy: { id: "asc" },
  });
  if (!target) {
    console.log("No events found.");
    return;
  }

  const existing = await prisma.participant.count({
    where: { eventId: target.id },
  });
  const need = Math.max(0, targetSize - existing);
  console.log(
    `Target event id=${target.id} title="${target.title}". existing participants=${existing}; will add ${need} ephemeral participants to reach ~${targetSize}.`,
  );

  const role = await prisma.eventRole.findFirst({
    where: { eventId: target.id },
    select: { id: true },
  });
  if (!role) {
    console.log("No event role found.");
    return;
  }

  const tempUserIds: bigint[] = [];
  const tempParticipantIds: bigint[] = [];

  const maxUserRow = await prisma.user.aggregate({ _max: { id: true } });
  const maxPartRow = await prisma.participant.aggregate({
    _max: { id: true },
  });
  let nextUserId = (maxUserRow._max.id ?? BigInt(0)) + BigInt(1);
  let nextPartId = (maxPartRow._max.id ?? BigInt(0)) + BigInt(1);

  for (let i = 0; i < need; i++) {
    const u = await prisma.user.create({
      data: {
        id: nextUserId,
        nickname: `bench_user_${nextUserId.toString()}`,
        displayName: `Bench ${i}`,
        email: `bench_${nextUserId.toString()}@example.com`,
        emailVerifiedAt: new Date(),
        affiliation: i % 3 === 0 ? `Bench Corp ${i % 5}` : null,
        bio: i % 2 === 0 ? "bench user bio" : null,
      },
    });
    tempUserIds.push(u.id);
    const p = await prisma.participant.create({
      data: {
        id: nextPartId,
        eventId: target.id,
        eventRoleId: role.id,
        userId: u.id,
        status:
          i % 4 === 0 ? "cancelled" : i % 4 === 1 ? "waiting" : "accepted",
        appliedAt: new Date(Date.now() - i * 60_000),
        cancelledAt: i % 4 === 0 ? new Date() : null,
      },
    });
    tempParticipantIds.push(p.id);
    nextUserId += BigInt(1);
    nextPartId += BigInt(1);
  }

  // dynamic import of insights _lib (tsx 直接実行する想定で .ts 拡張子を含めるのは
  // typecheck で弾かれるので、`as any` キャストで吸収する)
  const lib = (await import(
    /* @vite-ignore */ "../src/app/event/[id]/admin/insights/_lib"
  )) as { computeInsightsSQL: (e: { id: bigint; groupId: bigint; title: string; startedAt: Date }) => Promise<unknown> };
  const { computeInsightsSQL } = lib;

  // warm up
  await computeInsightsSQL(target);

  const runs = 5;
  const durations: number[] = [];
  for (let i = 0; i < runs; i++) {
    const start = process.hrtime.bigint();
    await computeInsightsSQL(target);
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1_000_000;
    durations.push(ms);
    console.log(`  run ${i + 1}: ${ms.toFixed(2)}ms`);
  }

  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  const min = Math.min(...durations);
  const max = Math.max(...durations);
  console.log("");
  console.log(
    `Runs: ${runs}  avg=${avg.toFixed(2)}ms  min=${min.toFixed(2)}ms  max=${max.toFixed(2)}ms`,
  );
  console.log(`Goal: avg < 100ms → ${avg < 100 ? "PASS" : "FAIL"}`);

  if (tempParticipantIds.length > 0) {
    await prisma.participant.deleteMany({
      where: { id: { in: tempParticipantIds } },
    });
  }
  if (tempUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: tempUserIds } } });
  }
  console.log(`Cleaned up ${tempParticipantIds.length} ephemeral participants and users.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
