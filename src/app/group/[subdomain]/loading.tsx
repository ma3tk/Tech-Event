/**
 * /group/[subdomain] ロード中スケルトン
 */
import * as React from "react";

import EventCardSkeleton from "@/components/EventCardSkeleton";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function GroupLoading(): React.ReactElement {
  return (
    <div
      className="mx-auto w-full max-w-6xl px-4 py-8"
      data-testid="loading-group"
      aria-busy="true"
      aria-live="polite"
    >
      <Skeleton className="mb-4 h-4 w-1/3" />
      <Card className="mb-6 flex items-start gap-4 p-6">
        <Skeleton className="h-20 w-20 rounded-md" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </Card>
      <Skeleton className="mb-4 h-6 w-32" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
