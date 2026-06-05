/**
 * Next.js convention: グループ詳細ページの OG 画像 (1200x630) を動的生成。
 *
 * `next/og` の `ImageResponse` を使い、システムフォントで以下を描画:
 * - 上部に「tech-event」サイト名
 * - 中央にグループ名 + subtitle
 * - 下部にメンバー数 / イベント数
 */
import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "tech-event のグループ";

export default async function Image({
  params,
}: {
  params: { subdomain: string };
}) {
  const group = await prisma.group.findUnique({
    where: { subdomain: params.subdomain },
    select: {
      name: true,
      subtitle: true,
      memberCount: true,
      eventCount: true,
    },
  });

  const name = group?.name ?? "tech-event のグループ";
  const subtitle = group?.subtitle ?? "";
  const stats = group
    ? `メンバー ${group.memberCount} 人 / 開催 ${group.eventCount} 回`
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(135deg, #1f3c66 0%, #2c5891 60%, #1f63c1 100%)",
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
            flexDirection: "column",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.2,
              textShadow: "0 2px 12px rgba(0,0,0,0.2)",
              display: "flex",
            }}
          >
            {name.length > 60 ? `${name.slice(0, 59)}…` : name}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: 30,
                opacity: 0.9,
                lineHeight: 1.4,
                display: "flex",
              }}
            >
              {subtitle.length > 100 ? `${subtitle.slice(0, 99)}…` : subtitle}
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            fontSize: 28,
            opacity: 0.95,
          }}
        >
          {stats}
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
