/**
 * /discover ロード中スケルトン
 */
import * as React from "react";

import EventCardSkeleton from "@/components/EventCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function DiscoverLoading(): React.ReactElement {
  return (
    <div
      className="mx-auto w-full max-w-6xl px-4 py-8"
      data-testid="loading-discover"
      aria-busy="true"
      aria-live="polite"
    >
      <Skeleton className="mb-2 h-8 w-1/3" />
      <Skeleton className="mb-6 h-4 w-1/2" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
