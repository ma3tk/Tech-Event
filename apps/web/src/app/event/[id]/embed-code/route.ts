/**
 * GET /event/[id]/embed-code
 *
 * 指定イベントを他サイトに埋め込むための iframe スニペットを
 * `text/plain` で返す。サイト管理者が「埋め込みコードをコピー」できる用途。
 *
 * 例:
 * ```html
 * <iframe src="http://localhost:3000/embed/event/1"
 *         title="..." width="100%" height="420"
 *         frameborder="0" loading="lazy"></iframe>
 * ```
 */

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

function parseId(raw: string): bigint | null {
  if (!/^\d+$/.test(raw)) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
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
    select: { id: true, title: true },
  });
  if (!event) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const origin = request.nextUrl.origin;
  const embedUrl = `${origin}/embed/event/${event.id.toString()}`;
  const title = `tech-event: ${event.title}`;

  const snippet = `<iframe src="${embedUrl}" title="${escapeAttr(title)}" width="100%" height="420" style="border:0;max-width:640px;" loading="lazy"></iframe>`;

  return new NextResponse(snippet, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
