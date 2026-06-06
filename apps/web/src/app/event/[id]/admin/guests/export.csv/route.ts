/**
 * 参加者 CSV エクスポート Route Handler
 *
 * GET /event/[id]/admin/guests/export.csv
 *
 * - 主催者 (Event.owner) または GroupAdmin のみアクセス可能。
 * - レスポンスは UTF-8 BOM 付き text/csv。Excel での文字化けを避けるため BOM を先頭に付与する。
 * - カラム: participant_id, user_id, nickname, display_name, email, role,
 *   status, applied_at, accepted_at, cancelled_at, check_in_at, check_in_method
 * - searchParams `status=accepted|waiting|cancelled|...` で簡易フィルタも可能。
 */
import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

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
      ...(allowedStatuses.has(statusFilter)
        ? { status: statusFilter }
        : {}),
    },
    include: { user: true, eventRole: true },
    orderBy: { appliedAt: "asc" },
  });

  const header = [
    "participant_id",
    "user_id",
    "nickname",
    "display_name",
    "email",
    "role",
    "status",
    "applied_at",
    "accepted_at",
    "cancelled_at",
    "check_in_at",
    "check_in_method",
  ];
  const lines: string[] = [header.join(",")];
  for (const p of participants) {
    lines.push(
      [
        p.id.toString(),
        p.user.id.toString(),
        p.user.nickname,
        p.user.displayName,
        p.user.email,
        p.eventRole.name,
        p.status,
        fmt(p.appliedAt),
        fmt(p.acceptedAt),
        fmt(p.cancelledAt),
        fmt(p.checkInAt),
        p.checkInMethod ?? "",
      ]
        .map((v) => csvEscape(String(v)))
        .join(","),
    );
  }

  // UTF-8 BOM 付き
  const body = "﻿" + lines.join("\r\n") + "\r\n";
  const filename = `event-${raw}-guests.csv`;
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
