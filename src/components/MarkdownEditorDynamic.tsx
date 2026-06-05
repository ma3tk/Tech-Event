"use client";

/**
 * MarkdownEditor の client-side dynamic wrapper。
 *
 * - `next/dynamic` で `ssr: false` 指定し、Markdown エディタ本体 (marked + tabs +
 *   ツールバー) を初回ロードから外す。
 * - 親フォームは ServerComponent のまま、`<form action={serverAction}>` の中に
 *   `<MarkdownEditorDynamic name="description" ... />` を埋めれば、エディタの
 *   `<textarea name>` がフォーム送信に乗るので server action 経路は変わらない。
 * - ロード中は Skeleton で高さを確保し、レイアウトシフトを抑える。
 * - `dynamic` は Client Boundary が必須なので、本ファイルが `"use client"`。
 */
import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type MarkdownEditor from "@/components/MarkdownEditor";

type Props = ComponentProps<typeof MarkdownEditor>;

const MarkdownEditorClient = dynamic(
  () => import("@/components/MarkdownEditor"),
  {
    ssr: false,
    loading: () => (
      <div
        className="rounded-md border border-border bg-white"
        data-testid="markdown-editor-loading"
      >
        <div className="border-b border-border bg-surface px-2 py-1.5">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="px-3 py-2">
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    ),
  },
);

export default function MarkdownEditorDynamic(props: Props) {
  return <MarkdownEditorClient {...props} />;
}
