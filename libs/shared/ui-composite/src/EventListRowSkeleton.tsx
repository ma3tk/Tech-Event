/**
 * EventListRowSkeleton
 *
 * `<EventListRow>` のロード中プレースホルダ。
 * 横長レイアウト (左サムネ + 右テキストブロック) を Skeleton で再現する。
 */
import * as React from "react";

import { Skeleton } from "@tech-event/shared-ui";

export default function EventListRowSkeleton(): React.ReactElement {
  return (
    <div
      className="flex items-stretch gap-4 rounded-lg border border-border bg-surface p-4"
      aria-hidden="true"
      data-testid="event-list-row-skeleton"
    >
      <Skeleton className="h-24 w-32 shrink-0 rounded-md" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="mt-auto flex items-center gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}
