/**
 * /explore ロード中スケルトン
 *
 * フィルタサイドバー + イベント一覧 (横長行) のレイアウトを再現する。
 */
import * as React from "react";

import EventListRowSkeleton from "@/components/EventListRowSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExploreLoading(): React.ReactElement {
  return (
    <div
      className="mx-auto w-full max-w-6xl px-4 py-8"
      data-testid="loading-explore"
      aria-busy="true"
      aria-live="polite"
    >
      <Skeleton className="mb-6 h-8 w-48" />
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </aside>
        <section className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventListRowSkeleton key={i} />
          ))}
        </section>
      </div>
    </div>
  );
}
