/**
 * 参加者 Excel (.xlsx) エクスポート Route Handler
 *
 * GET /event/[id]/admin/guests/export.xlsx
 *
 * - 主催者 / GroupAdmin のみアクセス可。
 * - レスポンスは ExcelJS で生成した OOXML バイナリ (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
 * - カラム順は CSV エクスポートと一致 (互換性確保)
 *
 * ExcelJS は dynamic import で bundle 増を回避。
 */
import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function fmt(d: Date | null | undefined): string {
  return d ? d.toISOString() : "";
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: raw } = await ctx.params;
  if (!/^\d+$/.test(raw)) {
    return new NextResponse("Not Found", { status: 404 });
  }
  const eventId = BigInt(raw);

  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, title: true, ownerId: true, groupId: true },
  });
  if (!event) {
    return new NextResponse("Not Found", { status: 404 });
  }
  const isOwner = event.ownerId === user.id;
  let isAdmin = false;
  if (!isOwner) {
    const admin = await prisma.groupAdmin.findUnique({
      where: { groupId_userId: { groupId: event.groupId, userId: user.id } },
    });
    isAdmin = !!admin && (admin.role === "owner" || admin.role === "admin");
  }
  if (!isOwner && !isAdmin) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status") ?? "";
  const allowedStatuses = new Set([
    "accepted",
    "waiting",
    "cancelled",
    "attended",
    "no_show",
    "pending",
  ]);

  const participants = await prisma.participant.findMany({
    where: {
      eventId,
      ...(allowedStatuses.has(statusFilter) ? { status: statusFilter } : {}),
    },
    include: { user: true, eventRole: true },
    orderBy: { appliedAt: "asc" },
  });

  // ExcelJS は dynamic import (bundle 増対策、本ルート以外は load しない)
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "tech-event";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Guests");
  sheet.columns = [
    { header: "participant_id", key: "participantId", width: 14 },
    { header: "user_id", key: "userId", width: 10 },
    { header: "nickname", key: "nickname", width: 20 },
    { header: "display_name", key: "displayName", width: 24 },
    { header: "email", key: "email", width: 30 },
    { header: "role", key: "role", width: 16 },
    { header: "status", key: "status", width: 12 },
    { header: "applied_at", key: "appliedAt", width: 24 },
    { header: "accepted_at", key: "acceptedAt", width: 24 },
    { header: "cancelled_at", key: "cancelledAt", width: 24 },
    { header: "check_in_at", key: "checkInAt", width: 24 },
    { header: "check_in_method", key: "checkInMethod", width: 14 },
  ];
  // ヘッダ太字
  sheet.getRow(1).font = { bold: true };

  for (const p of participants) {
    sheet.addRow({
      participantId: p.id.toString(),
      userId: p.user.id.toString(),
      nickname: p.user.nickname,
      displayName: p.user.displayName,
      email: p.user.email,
      role: p.eventRole.name,
      status: p.status,
      appliedAt: fmt(p.appliedAt),
      acceptedAt: fmt(p.acceptedAt),
      cancelledAt: fmt(p.cancelledAt),
      checkInAt: fmt(p.checkInAt),
      checkInMethod: p.checkInMethod ?? "",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `event-${raw}-guests.xlsx`;
  return new NextResponse(buffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
