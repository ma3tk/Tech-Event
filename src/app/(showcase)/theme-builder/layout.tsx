/**
 * `/theme-builder` 専用 layout.
 *
 * 本ページは Client Component なので metadata は親レイアウトで定義する。
 * デザインシステム検証用 (ユーザーが独自のブランド色・角丸・フォントサイズで
 * 主要 primitive をプレビューできる) なので robots: noindex。
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Theme Builder — tech-event デザインシステム",
  description:
    "tech-event のブランド色・角丸・フォントサイズを差し替えて、主要 primitive のリアルタイムプレビューを確認します。",
  robots: { index: false, follow: false },
};

export default function ThemeBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
