/**
 * Insights JSON エクスポートエンドポイント。
 *
 * URL: `GET /event/:id/admin/insights/export.json`
 *
 * - 認可: イベント主催者 or 同 group の owner/admin のみ。
 * - レスポンス: `Insights` 型 (admin/insights/_lib.ts) と同じ集計値を application/json で返す。
 *   `Content-Disposition: attachment; filename=insights-<eventId>.json` も付与する。
 * - 個人特定情報 (userId / email / nickname) は含めない。
 */
import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

import { computeInsights } from "../_lib";

export const dynamic = "force-dynamic";

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

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { participants: { include: { user: true } } },
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

  const insights = await computeInsights(event);

  return new NextResponse(JSON.stringify(insights, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="insights-${raw}.json"`,
      "cache-control": "no-store",
    },
  });
}
