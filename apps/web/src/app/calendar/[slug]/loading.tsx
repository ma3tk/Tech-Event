/**
 * /calendar/[slug] ロード中スケルトン
 */
import * as React from "react";

import EventListRowSkeleton from "@/components/EventListRowSkeleton";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarLoading(): React.ReactElement {
  return (
    <div
      className="mx-auto w-full max-w-5xl px-4 py-8"
      data-testid="loading-calendar"
      aria-busy="true"
      aria-live="polite"
    >
      <Card className="mb-6 space-y-3 p-6">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </Card>
      <Skeleton className="mb-4 h-6 w-32" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <EventListRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
