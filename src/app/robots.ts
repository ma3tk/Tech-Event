/**
 * Next.js convention: 動的 robots.txt の生成。
 *
 * - 公開ページ全許可。
 * - ダッシュボード / API / 各種編集系 / 出席管理は noindex 相当 (Disallow)。
 * - Sitemap への参照を含む。
 */
import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/api",
          "/event/*/admin",
          "/event/*/edit",
          "/event/*/check-in",
          "/group/*/edit",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
