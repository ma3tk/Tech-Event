/**
 * /notifications ロード中スケルトン
 */
import * as React from "react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsLoading(): React.ReactElement {
  return (
    <div
      className="mx-auto w-full max-w-3xl px-4 py-8"
      data-testid="loading-notifications"
      aria-busy="true"
      aria-live="polite"
    >
      <Skeleton className="mb-6 h-8 w-32" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="flex items-start gap-3 p-4">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
