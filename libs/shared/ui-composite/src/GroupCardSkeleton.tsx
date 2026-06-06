/**
 * GroupCardSkeleton
 *
 * `<GroupCard>` のロード中プレースホルダ。
 */
import * as React from "react";

import { Card } from "@tech-event/shared-ui";
import { Skeleton } from "@tech-event/shared-ui";

export default function GroupCardSkeleton(): React.ReactElement {
  return (
    <Card
      className="flex items-start gap-3 p-4"
      aria-hidden="true"
      data-testid="group-card-skeleton"
    >
      <Skeleton className="h-12 w-12 shrink-0 rounded-md" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </Card>
  );
}
