/**
 * 都道府県定数 (connpass API v2 互換スラグ)。
 *
 * - `PREFECTURES`      : 47 都道府県の { slug, label } 一覧 (北→南、JIS X 0401 順)
 * - `LOCATION_OPTIONS` : 検索 UI 用に「オンライン」「海外」を加えた開催地オプション
 * - `prefectureLabel()`: slug → 表示名の解決 (旧 UI の地域スラグ `tohoku` 等の
 *                        レガシーエイリアスも解決する。後方互換用)
 *
 * slug は connpass の都道府県 enum (research/api/endpoint-event-search.md 参照)
 * に準拠する。label は住所文字列 (`Event.address`) の LIKE マッチにそのまま
 * 使えるよう「東京都」「大阪府」「北海道」「◯◯県」の正式表記とする。
 */

export interface PrefectureOption {
  /** connpass 互換スラグ (例: "tokyo") */
  slug: string;
  /** 正式表示名 (例: "東京都")。住所部分一致にも使う */
  label: string;
}

/** 47 都道府県 (JIS X 0401 コード順) */
export const PREFECTURES: readonly PrefectureOption[] = [
  { slug: "hokkaido", label: "北海道" },
  { slug: "aomori", label: "青森県" },
  { slug: "iwate", label: "岩手県" },
  { slug: "miyagi", label: "宮城県" },
  { slug: "akita", label: "秋田県" },
  { slug: "yamagata", label: "山形県" },
  { slug: "fukushima", label: "福島県" },
  { slug: "ibaraki", label: "茨城県" },
  { slug: "tochigi", label: "栃木県" },
  { slug: "gunma", label: "群馬県" },
  { slug: "saitama", label: "埼玉県" },
  { slug: "chiba", label: "千葉県" },
  { slug: "tokyo", label: "東京都" },
  { slug: "kanagawa", label: "神奈川県" },
  { slug: "niigata", label: "新潟県" },
  { slug: "toyama", label: "富山県" },
  { slug: "ishikawa", label: "石川県" },
  { slug: "fukui", label: "福井県" },
  { slug: "yamanashi", label: "山梨県" },
  { slug: "nagano", label: "長野県" },
  { slug: "gifu", label: "岐阜県" },
  { slug: "shizuoka", label: "静岡県" },
  { slug: "aichi", label: "愛知県" },
  { slug: "mie", label: "三重県" },
  { slug: "shiga", label: "滋賀県" },
  { slug: "kyoto", label: "京都府" },
  { slug: "osaka", label: "大阪府" },
  { slug: "hyogo", label: "兵庫県" },
  { slug: "nara", label: "奈良県" },
  { slug: "wakayama", label: "和歌山県" },
  { slug: "tottori", label: "鳥取県" },
  { slug: "shimane", label: "島根県" },
  { slug: "okayama", label: "岡山県" },
  { slug: "hiroshima", label: "広島県" },
  { slug: "yamaguchi", label: "山口県" },
  { slug: "tokushima", label: "徳島県" },
  { slug: "kagawa", label: "香川県" },
  { slug: "ehime", label: "愛媛県" },
  { slug: "kochi", label: "高知県" },
  { slug: "fukuoka", label: "福岡県" },
  { slug: "saga", label: "佐賀県" },
  { slug: "nagasaki", label: "長崎県" },
  { slug: "kumamoto", label: "熊本県" },
  { slug: "oita", label: "大分県" },
  { slug: "miyazaki", label: "宮崎県" },
  { slug: "kagoshima", label: "鹿児島県" },
  { slug: "okinawa", label: "沖縄県" },
] as const;

/** オンライン開催 (connpass の prefecture enum にも `online` が存在する) */
export const ONLINE_LOCATION: PrefectureOption = {
  slug: "online",
  label: "オンライン",
};

/** 海外開催 */
export const OVERSEAS_LOCATION: PrefectureOption = {
  slug: "overseas",
  label: "海外",
};

/** 検索 UI の「開催地」セレクト用: 47 都道府県 + オンライン + 海外 (計 49) */
export const LOCATION_OPTIONS: readonly PrefectureOption[] = [
  ...PREFECTURES,
  ONLINE_LOCATION,
  OVERSEAS_LOCATION,
] as const;

/**
 * 旧 UI で使っていた地域スラグのエイリアス (後方互換)。
 * `/explore?prefecture=tohoku` のような既存 URL / ブックマークを壊さない。
 */
export const LEGACY_PREFECTURE_ALIASES: Readonly<Record<string, string>> = {
  tohoku: "東北",
} as const;

/**
 * slug → 表示名 (住所マッチ用ラベル) を解決する。
 * 47 都道府県 / オンライン / 海外 / レガシーエイリアスの順で探し、
 * どれにも該当しなければ null。
 */
export function prefectureLabel(slug: string): string | null {
  const found = LOCATION_OPTIONS.find((p) => p.slug === slug);
  if (found) return found.label;
  return LEGACY_PREFECTURE_ALIASES[slug] ?? null;
}
