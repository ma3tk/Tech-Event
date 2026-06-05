/**
 * E2E 用ヘルパ: Group.slackWebhookUrl を直接設定する。
 *
 * `POST /api/test/set-slack-webhook?groupId=<id>&url=<webhookUrl>`
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
  const groupIdRaw = request.nextUrl.searchParams.get("groupId");
  const url = request.nextUrl.searchParams.get("url");
  if (!groupIdRaw || !/^\d+$/.test(groupIdRaw)) {
    return NextResponse.json({ error: "invalid_groupId" }, { status: 400 });
  }
  const groupId = BigInt(groupIdRaw);
  await prisma.group.update({
    where: { id: groupId },
    data: { slackWebhookUrl: url || null },
  });
  return NextResponse.json({ ok: true });
}
