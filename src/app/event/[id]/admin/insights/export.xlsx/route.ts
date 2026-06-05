/**
 * Insights Excel (.xlsx) エクスポート Route Handler
 *
 * GET /event/[id]/admin/insights/export.xlsx
 *
 * - 認可は JSON 版 (export.json) と同じ。
 * - 1 ワークブックに以下のシートを作成:
 *   - Summary (全体サマリ)
 *   - Affiliations (所属企業 Top10)
 *   - HourlyApply (時間帯別申込)
 *   - TimingBuckets (タイミング分布)
 *   - Weekly (週次キャンセル率)
 *   - Peers (同グループの過去イベント)
 *
 * ExcelJS は dynamic import で bundle 増を抑える。
 */
import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

import { computeInsightsSQL } from "../_lib";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: raw } = await params;
  if (!/^\d+$/.test(raw)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }
  const eventId = BigInt(raw);

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // SQL 集計に切替えたため participants を include する必要がなくなった (data-model.md High #10)
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      groupId: true,
      title: true,
      startedAt: true,
      ownerId: true,
    },
  });
  if (!event) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const isOwner = event.ownerId === user.id;
  const admin = await prisma.groupAdmin.findUnique({
    where: { groupId_userId: { groupId: event.groupId, userId: user.id } },
  });
  const isAdmin =
    !!admin && (admin.role === "owner" || admin.role === "admin");
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const insights = await computeInsightsSQL(event);

  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "tech-event";
  workbook.created = new Date();

  // Summary
  const summary = workbook.addWorksheet("Summary");
  summary.columns = [
    { header: "key", key: "key", width: 28 },
    { header: "value", key: "value", width: 28 },
  ];
  summary.getRow(1).font = { bold: true };
  const summaryRows: { key: string; value: string | number }[] = [
    { key: "eventId", value: insights.eventId },
    { key: "eventTitle", value: insights.eventTitle },
    { key: "startedAt", value: insights.startedAt },
    { key: "totalParticipants", value: insights.totalParticipants },
    { key: "acceptedCount", value: insights.acceptedCount },
    { key: "withAffiliation", value: insights.withAffiliation },
    { key: "withBio", value: insights.withBio },
    { key: "withProfile", value: insights.withProfile },
    { key: "totalCancelled", value: insights.totalCancelled },
    { key: "lastMinuteCancelled", value: insights.lastMinuteCancelled },
    {
      key: "lastMinuteCancelRate",
      value: insights.lastMinuteCancelRate,
    },
    { key: "attendedCount", value: insights.attendedCount },
    { key: "attendanceRate", value: insights.attendanceRate },
    { key: "repeaterCount", value: insights.repeaterCount },
    { key: "repeaterRate", value: insights.repeaterRate },
  ];
  for (const r of summaryRows) summary.addRow(r);

  // Affiliations
  const aff = workbook.addWorksheet("Affiliations");
  aff.columns = [
    { header: "name", key: "name", width: 30 },
    { header: "count", key: "count", width: 10 },
  ];
  aff.getRow(1).font = { bold: true };
  for (const a of insights.affiliationsTop) aff.addRow(a);

  // HourlyApply
  const hourly = workbook.addWorksheet("HourlyApply");
  hourly.columns = [
    { header: "hour", key: "hour", width: 8 },
    { header: "count", key: "count", width: 10 },
  ];
  hourly.getRow(1).font = { bold: true };
  insights.applyHourly.forEach((c, h) => hourly.addRow({ hour: h, count: c }));

  // TimingBuckets
  const tb = workbook.addWorksheet("TimingBuckets");
  tb.columns = [
    { header: "range", key: "range", width: 16 },
    { header: "count", key: "count", width: 10 },
  ];
  tb.getRow(1).font = { bold: true };
  for (const b of insights.timingBuckets) tb.addRow(b);

  // Weekly
  const weekly = workbook.addWorksheet("Weekly");
  weekly.columns = [
    { header: "label", key: "label", width: 14 },
    { header: "rate", key: "rate", width: 10 },
    { header: "total", key: "total", width: 10 },
    { header: "cancelled", key: "cancelled", width: 10 },
  ];
  weekly.getRow(1).font = { bold: true };
  for (const w of insights.weekly) weekly.addRow(w);

  // Peers
  const peers = workbook.addWorksheet("Peers");
  peers.columns = [
    { header: "id", key: "id", width: 14 },
    { header: "title", key: "title", width: 30 },
    { header: "startedAt", key: "startedAt", width: 24 },
    { header: "applied", key: "applied", width: 10 },
    { header: "cancelled", key: "cancelled", width: 10 },
    { header: "cancelRate", key: "cancelRate", width: 10 },
  ];
  peers.getRow(1).font = { bold: true };
  for (const p of insights.peers) peers.addRow(p);

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="insights-${raw}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
