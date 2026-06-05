/**
 * グループメンバー CSV エクスポート Route Handler
 *
 * GET /group/[subdomain]/admin/members/export.csv
 *
 * - GroupAdmin (owner / admin) のみアクセス可能。
 * - UTF-8 BOM 付き text/csv。
 */
import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
  _req: NextRequest,
  ctx: { params: Promise<{ subdomain: string }> },
): Promise<NextResponse> {
  const { subdomain } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const group = await prisma.group.findUnique({ where: { subdomain } });
  if (!group) return new NextResponse("Not Found", { status: 404 });
  const admin = await prisma.groupAdmin.findUnique({
    where: { groupId_userId: { groupId: group.id, userId: user.id } },
  });
  const isAdmin =
    !!admin && (admin.role === "owner" || admin.role === "admin");
  if (!isAdmin) return new NextResponse("Not Found", { status: 404 });

  const members = await prisma.groupMember.findMany({
    where: { groupId: group.id, leftAt: null },
    include: { user: true },
    orderBy: { joinedAt: "desc" },
  });

  const header = [
    "user_id",
    "nickname",
    "display_name",
    "email",
    "joined_via",
    "joined_at",
    "receive_announcement",
  ];
  const lines: string[] = [header.join(",")];
  for (const m of members) {
    lines.push(
      [
        m.user.id.toString(),
        m.user.nickname,
        m.user.displayName,
        m.user.email,
        m.joinedVia,
        fmt(m.joinedAt),
        m.receiveAnnouncement ? "true" : "false",
      ]
        .map((v) => csvEscape(String(v)))
        .join(","),
    );
  }

  const body = "﻿" + lines.join("\r\n") + "\r\n";
  const filename = `group-${subdomain}-members.csv`;
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
