"use client";

/**
 * 「最近見たイベント」サイドバーパネル。
 *
 * - sessionStorage の `tech-event:recently-viewed` を読み込み、保存があれば表示する。
 * - 空のときは `fallback` (サンプル直近イベント) を表示する。
 * - クライアントマウント前は SSR と同じ fallback を出すため hydration ズレが起きない。
 *
 * sessionStorage のスキーマ:
 *   [{ id: string, title: string, href: string, startedAt: string }, ...] (最大10件)
 *
 * 内部は `ui/Card` をベースに、サイドバー用の薄めの余白 (p-4) を維持。
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

export type RecentlyViewedItem = {
  id: string;
  title: string;
  href: string;
  /** ISO8601 開催日時 (省略可) */
  startedAt?: string;
};

export type RecentlyViewedEventsProps = {
  /** sessionStorage に何も無いときに表示するサンプル */
  fallback: RecentlyViewedItem[];
};

const STORAGE_KEY = "tech-event:recently-viewed";

function shortDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function RecentlyViewedEvents({
  fallback,
}: RecentlyViewedEventsProps) {
  const [items, setItems] = useState<RecentlyViewedItem[]>(fallback);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // 上から最大 3 件
        setItems(
          parsed
            .filter(
              (x): x is RecentlyViewedItem =>
                typeof x?.id === "string" &&
                typeof x?.title === "string" &&
                typeof x?.href === "string",
            )
            .slice(0, 3),
        );
      }
    } catch {
      // 読み込み失敗時は fallback のままにする
    }
  }, []);

  return (
    <Card
      role="region"
      aria-labelledby="recently-viewed-heading"
      // ui/Card は p-0 + rounded-lg + shadow-sm。サイドバー用は rounded-md + p-4
      // で従来見た目を維持 (shadow-sm は両方共通)。
      className="rounded-md p-4 shadow-none"
    >
      <h3
        id="recently-viewed-heading"
        className="mb-2 flex items-center gap-1 text-sm font-bold text-foreground"
      >
        <Clock aria-hidden="true" className="h-3.5 w-3.5" />
        最近見たイベント
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {hydrated ? "閲覧履歴はまだありません。" : ""}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {items.slice(0, 3).map((item) => (
            <li key={item.id} className="py-2 first:pt-0 last:pb-0">
              <Link
                href={item.href}
                className="block text-xs leading-snug hover:text-link"
              >
                {item.startedAt && (
                  <span className="mr-1 text-[10px] text-muted-foreground">
                    {shortDate(item.startedAt)}
                  </span>
                )}
                <span className="line-clamp-2 text-foreground hover:text-link">
                  {item.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
