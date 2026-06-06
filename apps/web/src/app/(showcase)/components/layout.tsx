/**
 * `/components` 専用 layout。
 *
 * ページ本体は Client Component (`page.tsx`) なので `metadata` は親レイアウト側で
 * 静的に定義する必要がある。検索エンジンへのインデックスは抑制する。
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "コンポーネントショーケース",
  description:
    "tech-event の再利用UIコンポーネントの全 variant / state を一覧表示します。",
  robots: { index: false, follow: false },
};

export default function ComponentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
