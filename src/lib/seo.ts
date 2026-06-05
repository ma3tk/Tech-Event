/**
 * SEO 関連の共通ユーティリティ。
 *
 * - `BASE_URL`: 絶対 URL 組み立ての基準。`NEXT_PUBLIC_BASE_URL` 環境変数を利用。
 * - `absoluteUrl(path)`: 相対パスから絶対 URL を組み立てる。
 * - `SITE_NAME` / `DEFAULT_DESCRIPTION` / `DEFAULT_LOCALE`: 全ページで使う既定値。
 */

export const SITE_NAME = "tech-event";

export const DEFAULT_DESCRIPTION =
  "tech-event はエンジニア向けの勉強会・カンファレンス・ミートアップを探せるイベント支援プラットフォームです。";

export const DEFAULT_LOCALE = "ja_JP";

import { env } from "@/env";

/** 環境変数優先。未設定なら localhost にフォールバック。末尾スラッシュは除去。 */
export const BASE_URL = (
  env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

/** 相対 path から絶対 URL を組み立てる。 */
export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${normalized}`;
}

/** description テキストの簡易整形 (改行除去 + 末尾を最大 N 文字に切り詰め)。 */
export function truncateDescription(
  text: string | null | undefined,
  max = 160,
): string {
  if (!text) return DEFAULT_DESCRIPTION;
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max - 1)}…`;
}

/** RSS/XML 用エスケープ。 */
export function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
