/**
 * /event/[id] ロード中スケルトン
 *
 * ヒーロー (タイトル + メタ) + メイン 2/3 + サイドバー 1/3 のレイアウトを再現する。
 */
import * as React from "react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function EventDetailLoading(): React.ReactElement {
  return (
    <div
      className="mx-auto w-full max-w-6xl px-4 py-8"
      data-testid="loading-event-detail"
      aria-busy="true"
      aria-live="polite"
    >
      {/* breadcrumb */}
      <Skeleton className="mb-4 h-4 w-1/3" />

      {/* hero */}
      <div className="mb-6 space-y-3">
        <Skeleton className="h-48 w-full rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <Card className="space-y-3 p-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
          <Card className="space-y-3 p-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </Card>
        </div>
        <aside className="space-y-4">
          <Card className="space-y-3 p-4">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-9 w-full" />
          </Card>
          <Card className="space-y-3 p-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-9 w-full" />
          </Card>
        </aside>
      </div>
    </div>
  );
}
