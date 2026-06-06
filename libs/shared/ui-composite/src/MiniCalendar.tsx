/**
 * 今月のミニカレンダー (サイドバー用)。
 *
 * - 開催日 (YYYY-MM-DD) のセットを受け取り、該当日にドットを表示する。
 * - 日付セルをクリックすると `/explore?date=YYYY-MM-DD` に遷移する想定。
 * - Server Component / Client Component どちらからも呼べる純粋関数構成。
 *
 * 内部の日付セルは `ui/Button` の `asChild` パターンで Link を直接スタイル化。
 * (variant=ghost のスタイルを継承しつつ aspect-square / hover 色を上書き)
 */
import Link from "next/link";
import { cn } from "@tech-event/shared-util-cn";

export type MiniCalendarProps = {
  /** 表示基準月 (デフォルトは現在月) */
  baseDate?: Date;
  /** 開催日の Set (YYYY-MM-DD 文字列) */
  eventDates: Set<string>;
  className?: string;
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function MiniCalendar({
  baseDate = new Date(),
  eventDates,
  className,
}: MiniCalendarProps) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const firstWeekday = firstDayOfMonth.getDay(); // 0=日
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const todayYmd = ymd(new Date());

  // 6行 x 7列 = 42 セルのカレンダー
  const cells: Array<{
    day: number;
    inCurrentMonth: boolean;
    ymdString: string;
  }> = [];
  // 前月の埋め
  for (let i = 0; i < firstWeekday; i++) {
    const d = new Date(year, month, i - firstWeekday + 1);
    cells.push({ day: d.getDate(), inCurrentMonth: false, ymdString: ymd(d) });
  }
  // 今月
  for (let day = 1; day <= lastDayOfMonth; day++) {
    cells.push({
      day,
      inCurrentMonth: true,
      ymdString: ymd(new Date(year, month, day)),
    });
  }
  // 翌月の埋め
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1];
    const lastDate = new Date(last.ymdString);
    lastDate.setDate(lastDate.getDate() + 1);
    cells.push({
      day: lastDate.getDate(),
      inCurrentMonth: false,
      ymdString: ymd(lastDate),
    });
  }

  return (
    <section
      aria-label="イベントカレンダー"
      className={cn(
        "rounded-md border border-border bg-surface p-3",
        className,
      )}
    >
      <h3 className="mb-2 text-center text-sm font-bold text-foreground">
        {year}年{month + 1}月
      </h3>
      <div className="grid grid-cols-7 gap-px text-center text-[10px] text-muted-foreground">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={cn(
              "py-1 font-semibold",
              i === 0 && "text-status-cancelled-bg",
              i === 6 && "text-link",
            )}
          >
            {w}
          </div>
        ))}
        {cells.map((cell, i) => {
          const hasEvent = eventDates.has(cell.ymdString);
          const isToday = cell.ymdString === todayYmd;
          const weekday = i % 7;
          return (
            <Link
              key={`${cell.ymdString}-${i}`}
              href={`/explore?date=${cell.ymdString}`}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded text-[11px] transition-colors",
                cell.inCurrentMonth
                  ? "text-foreground hover:bg-brand-orange-soft"
                  // WCAG AA: text-muted (#6b7280) vs #ffffff = 4.6:1。
                  // 旧 text-muted-foreground/60 (#9399a1) は 2.87:1 で違反。
                  : "text-muted",
                weekday === 0 && cell.inCurrentMonth && "text-status-cancelled-bg",
                weekday === 6 && cell.inCurrentMonth && "text-link",
                isToday && "bg-brand-orange text-white hover:bg-brand-orange-hover",
              )}
              aria-label={
                hasEvent
                  ? `${cell.ymdString} (イベントあり)`
                  : cell.ymdString
              }
            >
              <span>{cell.day}</span>
              {hasEvent && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute bottom-0.5 h-1 w-1 rounded-full",
                    isToday ? "bg-white" : "bg-brand-orange",
                  )}
                />
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
