/**
 * iCalendar (RFC 5545) フォーマット生成ヘルパー。
 *
 * - 改行は `\r\n` を使用 (RFC 5545)。
 * - DTSTART/DTEND は UTC 形式 (`YYYYMMDDTHHMMSSZ`)。
 * - SUMMARY / DESCRIPTION / LOCATION 内の特殊文字 (バックスラッシュ・カンマ・
 *   セミコロン・改行) はエスケープする。
 * - 1 行 75 オクテット超は折り畳む (TEXT プロパティ向け簡易実装)。
 */

const CRLF = "\r\n";

/** DateTime -> "YYYYMMDDTHHMMSSZ" 形式 (UTC) */
export function formatIcsDateUtc(d: Date): string {
  const yyyy = d.getUTCFullYear().toString().padStart(4, "0");
  const mm = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const dd = d.getUTCDate().toString().padStart(2, "0");
  const hh = d.getUTCHours().toString().padStart(2, "0");
  const mi = d.getUTCMinutes().toString().padStart(2, "0");
  const ss = d.getUTCSeconds().toString().padStart(2, "0");
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
}

/** TEXT 値のエスケープ */
export function escapeIcsText(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/**
 * 1 プロパティ行を 75 オクテットで折り畳む。
 * RFC 5545: 継続行は SP (1 byte) 始まり。
 *
 * 文字数ベースの簡易実装。マルチバイトの正確な境界判定は省略する。
 */
function foldLine(line: string): string {
  const max = 75;
  if (line.length <= max) return line;
  const parts: string[] = [];
  let i = 0;
  parts.push(line.slice(0, max));
  i = max;
  while (i < line.length) {
    parts.push(" " + line.slice(i, i + max - 1));
    i += max - 1;
  }
  return parts.join(CRLF);
}

export type IcsEventInput = {
  uid: string;
  summary: string;
  description?: string | null;
  location?: string | null;
  url?: string | null;
  dtStart: Date;
  dtEnd: Date;
  dtStamp?: Date;
};

/** 単一 VEVENT を文字列で生成 */
export function buildVEvent(input: IcsEventInput): string {
  const lines: string[] = [];
  lines.push("BEGIN:VEVENT");
  lines.push(`UID:${input.uid}`);
  lines.push(`DTSTAMP:${formatIcsDateUtc(input.dtStamp ?? new Date())}`);
  lines.push(`DTSTART:${formatIcsDateUtc(input.dtStart)}`);
  lines.push(`DTEND:${formatIcsDateUtc(input.dtEnd)}`);
  lines.push(`SUMMARY:${escapeIcsText(input.summary)}`);
  if (input.description) {
    lines.push(`DESCRIPTION:${escapeIcsText(input.description)}`);
  }
  if (input.location) {
    lines.push(`LOCATION:${escapeIcsText(input.location)}`);
  }
  if (input.url) {
    lines.push(`URL:${input.url}`);
  }
  lines.push("END:VEVENT");
  return lines.map(foldLine).join(CRLF);
}

/** VCALENDAR ラッパー */
export function buildVCalendar(events: IcsEventInput[]): string {
  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//tech-event//Calendar//JA");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");
  for (const e of events) {
    lines.push(buildVEvent(e));
  }
  lines.push("END:VCALENDAR");
  lines.push(""); // 末尾改行
  return lines.join(CRLF);
}
