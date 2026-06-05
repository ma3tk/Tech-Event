/**
 * EventCardSkeleton
 *
 * `<EventCard>` のロード中プレースホルダ。Skeleton primitive を組み合わせて
 * カード形状を再現する。loading.tsx で利用する。
 */
import * as React from "react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function EventCardSkeleton(): React.ReactElement {
  return (
    <Card
      className="flex flex-col gap-3 p-4"
      aria-hidden="true"
      data-testid="event-card-skeleton"
    >
      <Skeleton className="h-32 w-full rounded-md" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-12" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="mt-auto flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-12" />
      </div>
    </Card>
  );
}
