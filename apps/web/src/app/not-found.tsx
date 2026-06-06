/**
 * 404 not-found page (App Router convention)
 */
import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound(): React.ReactElement {
  return (
    <div
      className="mx-auto w-full max-w-xl px-4 py-12"
      data-testid="not-found"
    >
      <Card>
        <CardHeader>
          <CardTitle>ページが見つかりません</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            お探しのページは削除されたか、URL が変更された可能性があります。
          </p>
          <Button asChild variant="default">
            <Link href="/">トップへ戻る</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
