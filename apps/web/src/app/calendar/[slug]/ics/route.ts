/**
 * GET /calendar/[slug]/ics
 *
 * Calendar に含まれる「今後 90 日のイベント」を VCALENDAR にまとめて返す。
 * Content-Type: text/calendar; charset=utf-8
 */

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildVCalendar, type IcsEventInput } from "@/lib/ical";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await context.params;

  const calendar = await prisma.calendar.findUnique({
    where: { slug },
    select: { id: true, name: true, status: true },
  });
  if (!calendar || calendar.status !== "active") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const now = new Date();
  const ninetyDaysLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const calendarEvents = await prisma.calendarEvent.findMany({
    where: {
      calendarId: calendar.id,
      event: {
        startedAt: { gte: now, lte: ninetyDaysLater },
      },
    },
    orderBy: { event: { startedAt: "asc" } },
    include: {
      event: {
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
      },
    },
  });

  const origin = request.nextUrl.origin;
  const items: IcsEventInput[] = calendarEvents.map((ce) => {
    const ev = ce.event;
    const url = `${origin}/event/${ev.id.toString()}`;
    const location =
      ev.eventFormat === "online"
        ? ev.onlineUrl ?? "オンライン"
        : [ev.place, ev.address].filter((s) => s && s.length > 0).join(" ") || "";
    const description = ev.catchPhrase ?? ev.description ?? "";
    return {
      uid: `calendar-${calendar.id.toString()}-event-${ev.id.toString()}@tech-event`,
      summary: ev.title,
      description,
      location,
      url,
      dtStart: ev.startedAt,
      dtEnd: ev.endedAt,
    };
  });

  const ics = buildVCalendar(items);
  const body = new TextEncoder().encode(ics);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="calendar-${slug}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
