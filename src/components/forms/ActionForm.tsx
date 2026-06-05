/**
 * ActionForm
 *
 * Server Action を `action` 属性で受け取り、submit 完了時に toast を
 * 発火する汎用クライアントラッパ。既存の `<form action={...}>` を
 * そのまま差し替えられるよう、`className` / `children` / 任意の
 * `data-testid` を素通しする。
 *
 * 既存 Server Action (`joinEvent` 等) は `void` を返し redirect を投げる
 * 設計のため、ここでは `useActionToast` の挙動に乗って成功時 (=action が
 * 例外なく解決 or NEXT_REDIRECT) に toast を表示する。
 */
"use client";

import * as React from "react";

import { useActionToast } from "@/hooks/useActionToast";

type Props = Omit<React.FormHTMLAttributes<HTMLFormElement>, "action"> & {
  action: (formData: FormData) => Promise<unknown> | unknown;
  toastMessage: string;
  toastKind?: "success" | "info" | "error";
  children: React.ReactNode;
};

export default function ActionForm({
  action,
  toastMessage,
  toastKind,
  children,
  ...rest
}: Props): React.ReactElement {
  const { formAction } = useActionToast(action, {
    message: toastMessage,
    kind: toastKind,
  });
  return (
    <form action={formAction} {...rest}>
      {children}
    </form>
  );
}
