/**
 * 表示用日付フォーマットのタイムゾーン安定化ヘルパ (hydration safe)。
 *
 * IMPORTANT: `Date.prototype.getHours()` / `getDate()` 等の **ローカル時刻依存**
 * メソッドで日付を整形すると、SSR (Node サーバの TZ) と client (ブラウザの TZ) が
 * 食い違ったときに整形結果がズレ、React の hydration mismatch を起こす。
 * 特に CI では server=UTC / Playwright ブラウザ=Asia/Tokyo のため 9 時間ズレて
 * 顕在化し、tree 再生成による submit ボタンの dead-click (E2E flake) の原因になる。
 *
 * tech-event は日本のイベントを ja-JP locale で扱うため、表示は常に JST で固定する。
 * `Intl.DateTimeFormat` を固定タイムゾーンで使えば、同じ `Date` から SSR / client で
 * 常に同じフィールド値・文字列が得られる。
 */

export const DISPLAY_TIME_ZONE = "Asia/Tokyo";

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const JP_WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export interface TokyoDateParts {
  year: number;
  /** 1-12 */
  month: number;
  /** 1-31 */
  day: number;
  /** 0-23 */
  hour: number;
  /** 0-59 */
  minute: number;
  /** 0=日 .. 6=土 */
  weekday: number;
}

/**
 * `Date` を `DISPLAY_TIME_ZONE` (JST) の各フィールドへ分解する。
 * ローカル TZ に依存しないため SSR / client で常に同じ値になる。
 */
export function tokyoDateParts(d: Date): TokyoDateParts {
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
  // `hour12: false` でも環境により深夜 0 時を "24" と返す実装があるため正規化。
  const rawHour = Number(get("hour"));
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: rawHour === 24 ? 0 : rawHour,
    minute: Number(get("minute")),
    weekday: WEEKDAY_INDEX[get("weekday")] ?? 0,
  };
}

const pad2 = (n: number): string => n.toString().padStart(2, "0");

/** 日本語の曜日 1 文字 (例: "月")。 */
export function tokyoWeekday(d: Date): string {
  return JP_WEEKDAYS[tokyoDateParts(d).weekday];
}

/** `M/D` (例: `6/15`)。 */
export function tokyoMonthDay(d: Date): string {
  const p = tokyoDateParts(d);
  return `${p.month}/${p.day}`;
}

/** `YYYY/MM/DD` (例: `2026/06/15`)。 */
export function tokyoYmdSlash(d: Date): string {
  const p = tokyoDateParts(d);
  return `${p.year}/${pad2(p.month)}/${pad2(p.day)}`;
}

/** `HH:mm` (例: `19:00`)。 */
export function tokyoHm(d: Date): string {
  const p = tokyoDateParts(d);
  return `${pad2(p.hour)}:${pad2(p.minute)}`;
}

/** `YYYY/MM/DD (曜) HH:mm` (例: `2026/06/15 (月) 19:00`)。 */
export function tokyoYmdDowHm(d: Date): string {
  const p = tokyoDateParts(d);
  return (
    `${p.year}/${pad2(p.month)}/${pad2(p.day)} (${JP_WEEKDAYS[p.weekday]}) ` +
    `${pad2(p.hour)}:${pad2(p.minute)}`
  );
}
