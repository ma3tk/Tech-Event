/**
 * E2E 用ヘルパ: Event.status を任意値にリセットする。
 *
 * `POST /api/test/reset-event-status?eventId=<id>&status=<draft|published>`
 *
 * 本番では disable (NODE_ENV === "production" のとき 404)。
 */
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * 2 段ガード: production では常に 404。
 * 非 production でも `ENABLE_TEST_ENDPOINTS=1` のときのみ有効。
 */
function isTestEndpointEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.ENABLE_TEST_ENDPOINTS === "1";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isTestEndpointEnabled()) {
    return new NextResponse("Not Found", { status: 404 });
  }
  const eventIdRaw = request.nextUrl.searchParams.get("eventId");
  const status = request.nextUrl.searchParams.get("status") ?? "draft";
  if (!eventIdRaw || !/^\d+$/.test(eventIdRaw)) {
    return NextResponse.json({ error: "invalid_eventId" }, { status: 400 });
  }
  const eventId = BigInt(eventIdRaw);
  await prisma.event.update({
    where: { id: eventId },
    data: {
      status,
      publishedAt: status === "published" ? new Date() : null,
      visibility: status === "published" ? "public" : "draft",
    },
  });
  return NextResponse.json({ ok: true });
}
