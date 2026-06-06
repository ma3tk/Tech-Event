/**
 * GET /group/[subdomain]/ics
 *
 * グループの「今後 30 日のイベント」を VCALENDAR にまとめて返す。
 * Content-Type: text/calendar; charset=utf-8
 */

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildVCalendar, type IcsEventInput } from "@/lib/ical";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ subdomain: string }> },
): Promise<NextResponse> {
  const { subdomain } = await context.params;

  const group = await prisma.group.findUnique({
    where: { subdomain },
    select: { id: true, name: true },
  });
  if (!group) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const events = await prisma.event.findMany({
    where: {
      groupId: group.id,
      startedAt: { gte: now, lte: thirtyDaysLater },
    },
    orderBy: { startedAt: "asc" },
    select: {
      id: true,
      title: true,
      catchPhrase: true,
      description: true,
      startedAt: true,
      endedAt: true,
      place: true,
      address: true,
      onlineUrl: true,
      eventFormat: true,
    },
  });

  const origin = request.nextUrl.origin;
  const items: IcsEventInput[] = events.map((event) => {
    const url = `${origin}/event/${event.id.toString()}`;
    const location =
      event.eventFormat === "online"
        ? event.onlineUrl ?? "オンライン"
        : [event.place, event.address].filter((s) => s && s.length > 0).join(" ") ||
          "";
    const description = event.catchPhrase ?? event.description ?? "";
    return {
      uid: `event-${event.id.toString()}@tech-event`,
      summary: event.title,
      description,
      location,
      url,
      dtStart: event.startedAt,
      dtEnd: event.endedAt,
    };
  });

  const ics = buildVCalendar(items);
  const body = new TextEncoder().encode(ics);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="group-${subdomain}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
