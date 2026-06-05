/**
 * useActionToast
 *
 * Server Action 用のクライアントラッパフック。React 19 の `useActionState`
 * (旧 `useFormState`) と組み合わせて以下を提供する:
 *
 *   - Server Action 呼び出し後に `useEffect` で `toast()` を発火する
 *   - 既存 Server Action は `void` を返し `redirect` で遷移する設計なので、
 *     ラッパ Action を内部で組み立てる必要なく、フォーム送信成功 (=submit
 *     completed without thrown error) をシグナルにする
 *
 * 利用例:
 *
 *   const { formAction, formRef } = useActionToast(joinEvent, {
 *     toastKey: "joined",
 *   });
 *   return <form ref={formRef} action={formAction}> ... </form>;
 *
 * 注意:
 *   - Server Action 内の `redirect()` は例外として伝播するが、`<form>` の
 *     action として渡している場合は Next.js が握りつぶしてリダイレクトを
 *     処理する。フックは `useTransition` の pending → !pending 遷移
 *     (= action 解決) を検知して、トーストを発火する。
 *   - 結果として redirect 後の新 URL でもトーストは表示される。
 */
"use client";

import * as React from "react";

import { toast } from "@/components/ui/toast";
import { isActionError } from "@/lib/action-error";

type ToastKind = "success" | "info" | "error";

type Options = {
  /** トースト本文 */
  message: string;
  /** トースト種別 (デフォルト success) */
  kind?: ToastKind;
};

export function useActionToast<TArgs extends unknown[]>(
  action: (...args: TArgs) => Promise<unknown> | unknown,
  options: Options,
): {
  formAction: (...args: TArgs) => Promise<void>;
  pending: boolean;
} {
  const [pending, startTransition] = React.useTransition();

  const formAction = React.useCallback(
    (...args: TArgs) => {
      return new Promise<void>((resolve) => {
        startTransition(async () => {
          try {
            await action(...args);
            // 成功時のみトースト発火 (redirect 例外も成功とみなして fire)
            const kind = options.kind ?? "success";
            if (kind === "success") toast.success(options.message);
            else if (kind === "info") toast.info(options.message);
            else toast.error(options.message);
          } catch (err) {
            // Next.js の redirect は内部例外で再 throw されることがある
            // (NEXT_REDIRECT digest)。redirect 系は成功扱いにして toast を出す。
            const digest =
              err && typeof err === "object" && "digest" in err
                ? String((err as { digest?: unknown }).digest ?? "")
                : "";
            if (digest.startsWith("NEXT_REDIRECT")) {
              const kind = options.kind ?? "success";
              if (kind === "success") toast.success(options.message);
              else if (kind === "info") toast.info(options.message);
              else toast.error(options.message);
            } else if (isActionError(err)) {
              // Server Action から ActionError が伝播してきたら
              // ユーザー向けメッセージをそのまま toast に出す
              toast.error(err.userMessage);
            } else {
              toast.error("エラーが発生しました");
            }
          } finally {
            resolve();
          }
        });
      });
    },
    [action, options.kind, options.message],
  );

  return { formAction, pending };
}
