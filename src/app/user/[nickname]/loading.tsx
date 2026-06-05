/**
 * /user/[nickname] ロード中スケルトン
 */
import * as React from "react";

import EventListRowSkeleton from "@/components/EventListRowSkeleton";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserLoading(): React.ReactElement {
  return (
    <div
      className="mx-auto w-full max-w-4xl px-4 py-8"
      data-testid="loading-user"
      aria-busy="true"
      aria-live="polite"
    >
      <Card className="mb-6 flex items-center gap-4 p-6">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </Card>
      <Skeleton className="mb-4 h-6 w-32" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <EventListRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
