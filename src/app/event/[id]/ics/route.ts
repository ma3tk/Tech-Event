/**
 * GET /event/[id]/ics
 *
 * イベント詳細を iCalendar (.ics) フォーマットで返す。
 * Content-Type: text/calendar; charset=utf-8
 *
 * - 改行は CRLF (RFC 5545)。
 * - DTSTART/DTEND は UTC 形式。
 * - SUMMARY/DESCRIPTION/LOCATION/URL/UID を含む。
 */

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildVCalendar } from "@/lib/ical";

function parseId(raw: string): bigint | null {
  if (!/^\d+$/.test(raw)) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: raw } = await context.params;
  const id = parseId(raw);
  if (!id) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const event = await prisma.event.findUnique({
    where: { id },
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

  if (!event) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const origin = request.nextUrl.origin;
  const url = `${origin}/event/${event.id.toString()}`;
  const location =
    event.eventFormat === "online"
      ? event.onlineUrl ?? "オンライン"
      : [event.place, event.address].filter((s) => s && s.length > 0).join(" ") ||
        "";
  const description =
    event.catchPhrase ?? event.description ?? "";

  const ics = buildVCalendar([
    {
      uid: `event-${event.id.toString()}@tech-event`,
      summary: event.title,
      description,
      location,
      url,
      dtStart: event.startedAt,
      dtEnd: event.endedAt,
    },
  ]);

  const body = new TextEncoder().encode(ics);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="event-${event.id.toString()}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
