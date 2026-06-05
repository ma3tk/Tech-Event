/**
 * グループメンバー Excel エクスポート Route Handler
 *
 * GET /group/[subdomain]/admin/members/export.xlsx
 *
 * - GroupAdmin (owner / admin) のみアクセス可能。
 * - ExcelJS は dynamic import で bundle 増を抑える。
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

  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "tech-event";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Members");
  sheet.columns = [
    { header: "user_id", key: "userId", width: 10 },
    { header: "nickname", key: "nickname", width: 20 },
    { header: "display_name", key: "displayName", width: 24 },
    { header: "email", key: "email", width: 30 },
    { header: "joined_via", key: "joinedVia", width: 14 },
    { header: "joined_at", key: "joinedAt", width: 24 },
    {
      header: "receive_announcement",
      key: "receiveAnnouncement",
      width: 18,
    },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const m of members) {
    sheet.addRow({
      userId: m.user.id.toString(),
      nickname: m.user.nickname,
      displayName: m.user.displayName,
      email: m.user.email,
      joinedVia: m.joinedVia,
      joinedAt: fmt(m.joinedAt),
      receiveAnnouncement: m.receiveAnnouncement ? "true" : "false",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="group-${subdomain}-members.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
