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

export { cn } from "@/lib/cn";

/* ============================================================
 * 日付フォーマット
 * ============================================================ */

const JP_WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const w = JP_WEEKDAYS[d.getDay()];
  return `${y}年${m}月${day}日(${w})`;
}

function formatHm(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
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

  const sameDay =
    s.getFullYear() === e.getFullYear() &&
    s.getMonth() === e.getMonth() &&
    s.getDate() === e.getDate();

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
