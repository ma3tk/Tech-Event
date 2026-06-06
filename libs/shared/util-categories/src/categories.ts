/**
 * Discover ページで利用するテックカテゴリの静的マッピング。
 *
 * 設計メモ:
 * - Luma の Discover は固定タクソノミー (8カテゴリ) を採用しているのに対し、
 *   tech-event 本体は connpass 由来の自由タグを採用している。両者のギャップを
 *   埋めるため、Discover ページでは「Tag 名」をキーにした 6 つのカテゴリを
 *   ハードコードで用意し、`/explore?tag={slug or name}` への入り口にする。
 * - DB の Tag.slug は seed で生成された値 (ASCII の場合は確定、和文の場合は
 *   `tag-XXXX` 形式でランダム) のため、`/discover` のサーバーコンポーネント側で
 *   `Tag.name` を使って slug を解決する。`tagName` がカテゴリの代表タグ名。
 * - 万一該当タグが DB に無い場合は `tagSlug` (英字フォールバック) を使う。
 * - hue: Tailwind の任意の色相 (グラデーション背景の `from-{hue}-500 to-{hue}-700` 用)。
 *   v4 で safelist が無いと purge される可能性があるため、UI 側は CSS 変数 or 直接
 *   `style={{ background: ... }}` で生成する。
 * - icon は lucide-react のコンポーネント名 (文字列キー)。`<DiscoverCategoryIcon>` で
 *   実コンポーネントに解決する。
 */

import {
  Sparkles,
  Code,
  Smartphone,
  Shield,
  Server,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export type DiscoverCategory = {
  /** カテゴリの一意キー (URL 用ではない) */
  slug: string;
  /** 表示名 (日本語) */
  name: string;
  /** カテゴリの色相 (CSS グラデーション用 #hex 2色) */
  gradientFrom: string;
  gradientTo: string;
  /** カテゴリのアイコン (lucide-react コンポーネント) */
  icon: LucideIcon;
  /** /explore に渡す代表タグ名 (DB の Tag.name と一致させる) */
  tagName: string;
  /** Tag が DB に無い場合のフォールバック slug (英語) */
  fallbackTagSlug: string;
  /** カードに表示する説明 (1行) */
  description: string;
};

/**
 * 6 つの Discover カテゴリ。
 *
 * 並び順がそのまま UI の 2x3 グリッドの並びになる。
 */
export const DISCOVER_CATEGORIES: readonly DiscoverCategory[] = [
  {
    slug: "ai",
    name: "AI",
    tagName: "AI",
    fallbackTagSlug: "ai",
    gradientFrom: "#7c3aed", // violet-600
    gradientTo: "#ec4899", // pink-500
    icon: Sparkles,
    description: "LLM・機械学習・生成 AI の最前線",
  },
  {
    slug: "web",
    name: "Web開発",
    tagName: "React",
    fallbackTagSlug: "react",
    gradientFrom: "#0ea5e9", // sky-500
    gradientTo: "#22d3ee", // cyan-400
    icon: Code,
    description: "React / Next.js / フロントエンド",
  },
  {
    slug: "mobile",
    name: "モバイル",
    tagName: "モバイル",
    fallbackTagSlug: "mobile",
    gradientFrom: "#10b981", // emerald-500
    gradientTo: "#14b8a6", // teal-500
    icon: Smartphone,
    description: "iOS / Android / クロスプラットフォーム",
  },
  {
    slug: "security",
    name: "セキュリティ",
    tagName: "セキュリティ",
    fallbackTagSlug: "security",
    gradientFrom: "#dc2626", // red-600
    gradientTo: "#f97316", // orange-500
    icon: Shield,
    description: "脆弱性 / 認証 / ゼロトラスト",
  },
  {
    slug: "devops",
    name: "DevOps",
    tagName: "DevOps",
    fallbackTagSlug: "devops",
    gradientFrom: "#2563eb", // blue-600
    gradientTo: "#6366f1", // indigo-500
    icon: Server,
    description: "Kubernetes / CI/CD / SRE",
  },
  {
    slug: "data",
    name: "データ分析",
    tagName: "データ分析",
    fallbackTagSlug: "data",
    gradientFrom: "#f59e0b", // amber-500
    gradientTo: "#facc15", // yellow-400
    icon: BarChart3,
    description: "BI / データ基盤 / 機械学習",
  },
] as const;

/**
 * Discover ページの「都市別グリッド」用都市リスト。
 *
 * `/explore?prefecture={slug}` または `online=1` に直結する。
 * picsum.photos で seed を固定し、SSR 出力が安定するようにしている。
 */
export type DiscoverCity = {
  /** URL 用キー */
  slug: string;
  /** 表示名 (日本語) */
  name: string;
  /** 検索クエリのキー: 都道府県の slug、または "online" */
  filter:
    | { type: "prefecture"; prefectureSlug: string }
    | { type: "online" };
  /** picsum 用 seed (写真風カード) */
  photoSeed: string;
};

export const DISCOVER_CITIES: readonly DiscoverCity[] = [
  {
    slug: "tokyo",
    name: "東京",
    filter: { type: "prefecture", prefectureSlug: "tokyo" },
    photoSeed: "tech-event-tokyo",
  },
  {
    slug: "osaka",
    name: "大阪",
    filter: { type: "prefecture", prefectureSlug: "osaka" },
    photoSeed: "tech-event-osaka",
  },
  {
    slug: "fukuoka",
    name: "福岡",
    filter: { type: "prefecture", prefectureSlug: "fukuoka" },
    photoSeed: "tech-event-fukuoka",
  },
  {
    slug: "online",
    name: "オンライン",
    filter: { type: "online" },
    photoSeed: "tech-event-online",
  },
] as const;

/**
 * カテゴリの `/explore` 行き URL を組み立てる。
 *
 * @param category   対象カテゴリ
 * @param resolvedSlug DB から解決した Tag.slug (見つからなければ undefined)
 */
export function buildCategoryExploreHref(
  category: DiscoverCategory,
  resolvedSlug: string | undefined,
): string {
  const slug = resolvedSlug ?? category.fallbackTagSlug;
  return `/explore?tag=${encodeURIComponent(slug)}`;
}

/**
 * 都市カードの `/explore` 行き URL を組み立てる。
 */
export function buildCityExploreHref(city: DiscoverCity): string {
  if (city.filter.type === "online") {
    return "/explore?online=1";
  }
  return `/explore?prefecture=${encodeURIComponent(city.filter.prefectureSlug)}`;
}
