/**
 * /dashboard ロード中スケルトン
 */
import * as React from "react";

import EventListRowSkeleton from "@/components/EventListRowSkeleton";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading(): React.ReactElement {
  return (
    <div
      className="mx-auto w-full max-w-5xl px-4 py-8"
      data-testid="loading-dashboard"
      aria-busy="true"
      aria-live="polite"
    >
      <Skeleton className="mb-6 h-8 w-1/4" />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="space-y-2 p-4">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-6 w-1/3" />
          </Card>
        ))}
      </div>

      <Skeleton className="mb-3 h-6 w-32" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <EventListRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
