/**
 * Locale 対応の日時 / 数値整形ユーティリティ。
 *
 * 既存の `src/lib/utils.ts` に存在する `formatEventDate` / `formatNumber` /
 * `formatEventDateShort` を `ja-JP` ハードコードのまま残すと、英語ユーザーに
 * 「2026年06月15日(月) 19:00」のような和暦・曜日が混ざった文字列が出てしまう。
 *
 * 本モジュールは `(value, locale)` の引数で受けるラッパを提供し、`event/[id]` の
 * ような Server Component から `getLocale()` 経由で取得した locale を渡せる
 * ようにする。
 *
 * - `formatDate(value, locale)`         : "YYYY/MM/DD HH:mm" 相当の locale 別整形
 * - `formatDateLong(value, locale)`     : "YYYY年MM月DD日(月) HH:mm" 相当の locale 別整形
 * - `formatEventDateRange(start, end, locale)` : 開催期間 1 行整形
 * - `formatNumberLocale(n, locale)`     : 3 桁区切り整形 (en-US / ja-JP)
 *
 * Intl.DateTimeFormat / Intl.NumberFormat を直接使うと SSR では Node.js の
 * Intl データに依存し、本番運用上は十分そろっている。曜日テキストは
 * `narrow` 指定で 1 文字 (例: ja=月 / en=Mon) を引いて利用する。
 */
import type { Locale } from "./i18n";

const BCP47: Record<Locale, string> = {
  ja: "ja-JP",
  en: "en-US",
};

function toBcp47(locale: Locale): string {
  return BCP47[locale] ?? BCP47.ja;
}

/**
 * 表示用日時の固定タイムゾーン。
 *
 * IMPORTANT: `Intl.DateTimeFormat` を `timeZone` 指定なしで使うと、整形結果が
 * 実行環境のローカルタイムゾーンに依存する。SSR (Node サーバ) と client
 * (ブラウザ) で TZ が食い違うと整形文字列がズレ、React の hydration mismatch を
 * 起こす (CI は server=UTC / Playwright ブラウザ=Asia/Tokyo で 9 時間ズレる)。
 * tech-event は日本のイベントを扱うため、表示は常に JST で固定し SSR/client の
 * 出力を一致させる。
 */
const DISPLAY_TIME_ZONE = "Asia/Tokyo";

/**
 * 表示タイムゾーン (JST) 固定で Y/M/D を取り出す (sameDay 判定用、hydration safe)。
 */
function tokyoYmd(d: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  return { year: get("year"), month: get("month"), day: get("day") };
}

/**
 * 与えられた値を Date に変換。失敗時は null。
 */
function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * "YYYY/MM/DD HH:mm" 相当を locale で整形する。
 *
 * - ja: "2026/06/15 19:00" (24h)
 * - en: "06/15/2026, 7:00 PM" 相当 → Intl の short style に従う
 */
export function formatDate(
  value: Date | string | number | null | undefined,
  locale: Locale,
): string {
  const d = toDate(value);
  if (!d) return "";
  return new Intl.DateTimeFormat(toBcp47(locale), {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: locale === "en",
  }).format(d);
}

/**
 * 日付のみ整形 ("2026/06/15" 相当)。
 */
export function formatDateOnly(
  value: Date | string | number | null | undefined,
  locale: Locale,
): string {
  const d = toDate(value);
  if (!d) return "";
  return new Intl.DateTimeFormat(toBcp47(locale), {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * "YYYY年MM月DD日(月)" / "Mon, Jun 15, 2026" 相当の long 形式 + 時刻。
 */
export function formatDateLong(
  value: Date | string | number | null | undefined,
  locale: Locale,
): string {
  const d = toDate(value);
  if (!d) return "";
  return new Intl.DateTimeFormat(toBcp47(locale), {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: locale === "en",
  }).format(d);
}

/**
 * イベントの開催期間を 1 行で整形 (locale 対応版)。
 *
 * - 同日: "2026/06/15 19:00 〜 21:00" / "06/15/2026 7:00 PM – 9:00 PM"
 * - 跨ぐ: "2026/06/15 19:00 〜 2026/06/16 02:00"
 */
export function formatEventDateRange(
  start: Date | string | number,
  end: Date | string | number,
  locale: Locale,
): string {
  const s = toDate(start);
  const e = toDate(end);
  if (!s || !e) return "";

  const sp = tokyoYmd(s);
  const ep = tokyoYmd(e);
  const sameDay =
    sp.year === ep.year && sp.month === ep.month && sp.day === ep.day;

  const dateFmt = new Intl.DateTimeFormat(toBcp47(locale), {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const timeFmt = new Intl.DateTimeFormat(toBcp47(locale), {
    timeZone: DISPLAY_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: locale === "en",
  });
  const sep = locale === "en" ? " – " : " 〜 ";

  if (sameDay) {
    return `${dateFmt.format(s)} ${timeFmt.format(s)}${sep}${timeFmt.format(e)}`;
  }
  return `${dateFmt.format(s)} ${timeFmt.format(s)}${sep}${dateFmt.format(e)} ${timeFmt.format(e)}`;
}

/**
 * 数値を 3 桁区切りで整形。
 */
export function formatNumberLocale(n: number, locale: Locale): string {
  return new Intl.NumberFormat(toBcp47(locale)).format(n);
}
