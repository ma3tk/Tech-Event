/**
 * Next.js convention: イベント詳細ページの OG 画像 (1200x630) を動的生成。
 *
 * `next/og` の `ImageResponse` を使い、システムフォントで以下を描画:
 * - 上部に「tech-event」サイト名
 * - 中央にイベントタイトル
 * - 下部に開催日 + グループ名
 *
 * カバー画像が無い場合のフォールバックとしても機能する。
 */
import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "tech-event のイベント";

function parseId(raw: string): bigint | null {
  if (!/^\d+$/.test(raw)) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

function formatStartDate(d: Date | null | undefined): string {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function Image({
  params,
}: {
  params: { id: string };
}) {
  const id = parseId(params.id);
  let title = "tech-event のイベント";
  let groupName = "tech-event";
  let dateLabel = "";

  if (id) {
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        title: true,
        startedAt: true,
        group: { select: { name: true } },
      },
    });
    if (event) {
      title = event.title;
      groupName = event.group.name;
      dateLabel = formatStartDate(event.startedAt);
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #ea580c 0%, #f97316 60%, #fb923c 100%)",
          color: "#ffffff",
          padding: "64px",
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Noto Sans JP", sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "0.02em",
            opacity: 0.95,
          }}
        >
          tech-event
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            paddingTop: 24,
          }}
        >
          <div
            style={{
              fontSize: 60,
              fontWeight: 800,
              lineHeight: 1.2,
              textShadow: "0 2px 12px rgba(0,0,0,0.15)",
              display: "flex",
            }}
          >
            {title.length > 90 ? `${title.slice(0, 89)}…` : title}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 28,
            opacity: 0.95,
          }}
        >
          <div style={{ display: "flex" }}>{dateLabel}</div>
          <div style={{ display: "flex" }}>{groupName}</div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
