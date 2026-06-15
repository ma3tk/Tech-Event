/**
 * 汎用ユーティリティ。
 *
 * - `cn()`: Tailwind class 合成 (clsx + tailwind-merge) — `@/lib/cn` の再export
 * - `formatEventDate()`: イベント開催日時の整形 (例: "2026年06月15日(月) 19:00 〜 21:00")
 * - `formatRelative()`: 相対時刻 (例: "3時間前", "2日後")
 * - `formatAcceptedRatio()`: "12 / 50 人 参加" のような表記
 *
 * NOTE: `cn()` は `@/lib/cn` を正本としているため、新規 import は `@/lib/cn` 推奨。
 * 後方互換のため本ファイルからも再export している。
 */

/* ============================================================
 * className 合成 (@/lib/cn の再export)
 * ============================================================ */

export { cn } from "./cn";

/* ============================================================
 * 日付フォーマット
 * ============================================================ */

const JP_WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

/**
 * イベント日時の表示タイムゾーン。
 *
 * IMPORTANT: SSR (Node サーバ) と client (ブラウザ) でローカルタイムゾーンが
 * 異なると、`Date.prototype.getHours()` 等の **ローカル時刻依存** の整形結果が
 * 食い違い、React の hydration mismatch を起こす。
 * (CI は server=UTC / Playwright ブラウザ=Asia/Tokyo のため特に顕在化する。)
 *
 * tech-event は日本のイベントを ja-JP locale で扱うため、表示は常に JST で固定する。
 * 固定タイムゾーンで整形すれば SSR / client の出力が一致し hydration mismatch が消える。
 */
export const DISPLAY_TIME_ZONE = "Asia/Tokyo";

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * `Date` を固定タイムゾーン (`DISPLAY_TIME_ZONE`) の各フィールドに分解する。
 *
 * `Intl.DateTimeFormat` を経由するため SSR / client のローカル TZ に依存せず、
 * 同じ `Date` からは常に同じフィールド値が得られる (hydration safe)。
 */
function tokyoParts(d: Date): {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
  weekday: number; // 0=日 .. 6=土
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? "";
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  // `hour12: false` でも環境によっては深夜 0 時を "24" と返す実装があるため正規化する。
  const rawHour = Number(get("hour"));
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: rawHour === 24 ? 0 : rawHour,
    minute: Number(get("minute")),
    weekday: weekdayMap[get("weekday")] ?? 0,
  };
}

function formatYmd(d: Date): string {
  const p = tokyoParts(d);
  const m = pad2(p.month);
  const day = pad2(p.day);
  const w = JP_WEEKDAYS[p.weekday];
  return `${p.year}年${m}月${day}日(${w})`;
}

function formatHm(d: Date): string {
  const p = tokyoParts(d);
  return `${pad2(p.hour)}:${pad2(p.minute)}`;
}

/**
 * イベントの開催日時を 1 行で整形する。
 *
 * - 同日開催: `2026年06月15日(月) 19:00 〜 21:00`
 * - 日を跨ぐ: `2026年06月15日(月) 19:00 〜 2026年06月16日(火) 02:00`
 */
export function formatEventDate(start: Date | string, end: Date | string): string {
  const s = start instanceof Date ? start : new Date(start);
  const e = end instanceof Date ? end : new Date(end);

  const sp = tokyoParts(s);
  const ep = tokyoParts(e);
  const sameDay =
    sp.year === ep.year && sp.month === ep.month && sp.day === ep.day;

  if (sameDay) {
    return `${formatYmd(s)} ${formatHm(s)} 〜 ${formatHm(e)}`;
  }
  return `${formatYmd(s)} ${formatHm(s)} 〜 ${formatYmd(e)} ${formatHm(e)}`;
}

/**
 * `start` 日時のみを整形 (一覧カード用)。
 */
export function formatEventDateShort(start: Date | string): string {
  const s = start instanceof Date ? start : new Date(start);
  return `${formatYmd(s)} ${formatHm(s)}`;
}

/* ============================================================
 * 相対時刻
 * ============================================================ */

/**
 * 相対時刻を日本語で返す。基準は現在時刻 (`now`)。
 *
 * - 過去: "3分前", "2時間前", "5日前", "3ヶ月前"
 * - 未来: "10分後", "明日", "3日後", "来月"
 */
export function formatRelative(
  target: Date | string,
  now: Date = new Date(),
): string {
  const t = target instanceof Date ? target : new Date(target);
  const diffMs = t.getTime() - now.getTime();
  const absSec = Math.floor(Math.abs(diffMs) / 1000);
  const isPast = diffMs < 0;

  const unit = (n: number, label: string): string =>
    isPast ? `${n}${label}前` : `${n}${label}後`;

  if (absSec < 60) return isPast ? "たった今" : "まもなく";
  const min = Math.floor(absSec / 60);
  if (min < 60) return unit(min, "分");
  const hour = Math.floor(min / 60);
  if (hour < 24) return unit(hour, "時間");
  const day = Math.floor(hour / 24);
  if (day < 30) return unit(day, "日");
  const month = Math.floor(day / 30);
  if (month < 12) return unit(month, "ヶ月");
  const year = Math.floor(day / 365);
  return unit(year, "年");
}

/* ============================================================
 * 参加状況
 * ============================================================ */

/**
 * 参加状況のテキストを生成する。
 *
 * - 定員あり (空き): `12 / 50 人 参加`
 * - 定員あり (満員): `満員 (50 / 50 人)`
 * - 定員なし: `12 人 参加`
 */
export function formatAcceptedRatio(
  accepted: number,
  capacity: number | null | undefined,
): string {
  if (capacity == null) {
    return `${accepted} 人 参加`;
  }
  if (accepted >= capacity) {
    return `満員 (${capacity} / ${capacity} 人)`;
  }
  return `${accepted} / ${capacity} 人 参加`;
}

/**
 * 残席数を返す。定員なしの場合は `null`。
 */
export function remainingSeats(
  accepted: number,
  capacity: number | null | undefined,
): number | null {
  if (capacity == null) return null;
  return Math.max(0, capacity - accepted);
}

/**
 * イベントが満員かどうか。
 */
export function isFull(
  accepted: number,
  capacity: number | null | undefined,
): boolean {
  if (capacity == null) return false;
  return accepted >= capacity;
}

/* ============================================================
 * その他
 * ============================================================ */

/**
 * 数値を 3 桁区切り (1,234) に整形。
 *
 * 第2引数で locale (`"ja" | "en"`) を渡すと Intl.NumberFormat を経由した
 * locale-aware な整形になる。省略時は ja-JP で従来挙動を維持する。
 */
export function formatNumber(n: number, locale?: "ja" | "en"): string {
  if (locale === "en") return new Intl.NumberFormat("en-US").format(n);
  return new Intl.NumberFormat("ja-JP").format(n);
}

/**
 * 文字列を指定文字数で省略する。
 */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "…";
}
