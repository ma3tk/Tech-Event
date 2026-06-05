/**
 * Server Action 共通エラー & リダイレクトヘルパー。
 *
 * - `ActionError`: ユーザー向けメッセージを伴う Server Action 例外
 *   - `code`: 機械可読の識別子 (`invalid_input`, `forbidden`, `not_found` 等)
 *   - `userMessage`: UI / toast にそのまま表示できる日本語メッセージ
 *   - `field`: 入力フィールドに紐づくエラーであれば対応するフォームの key
 * - `redirectWithFormError`: FormData の内容を残しつつ `?error=...&message=...` で
 *   元のページへ戻す。`calendar-actions.ts` / `group-actions.ts` で重複していた
 *   `redirectWithError` を共通化したもの。
 *
 * 既存 `throw new Error("invalid_input")` から段階的に移行することを想定し、
 * 旧 throw も互換のため受け付ける (グローバル `error.tsx` で文字列例外を表示)。
 */

/** 機械可読のエラーコード (string union ではなく自由文字列許容)。 */
export type ActionErrorCode =
  | "invalid_input"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "internal_error"
  | (string & {});

/**
 * Server Action から throw される共通例外。
 *
 * ```ts
 * throw new ActionError("forbidden", "権限がありません");
 * throw new ActionError("invalid_input", "メールアドレスの形式が不正です", { field: "email" });
 * ```
 */
export class ActionError extends Error {
  readonly code: ActionErrorCode;
  readonly userMessage: string;
  readonly field?: string;

  constructor(
    code: ActionErrorCode,
    userMessage: string,
    opts?: { field?: string; cause?: unknown },
  ) {
    super(userMessage);
    this.name = "ActionError";
    this.code = code;
    this.userMessage = userMessage;
    this.field = opts?.field;
    if (opts?.cause !== undefined) {
      (this as { cause?: unknown }).cause = opts.cause;
    }
  }
}

/** `unknown` から ActionError を判定。Next.js の RSC boundary を跨いでも動く。 */
export function isActionError(err: unknown): err is ActionError {
  if (err instanceof ActionError) return true;
  if (typeof err !== "object" || err === null) return false;
  const e = err as { name?: unknown; code?: unknown; userMessage?: unknown };
  return e.name === "ActionError" && typeof e.code === "string";
}

/**
 * 入力 FormData の文字列値を `?key=value` として復元しつつ
 * `?error=<code>&message=<userMessage>` を付加した URL にリダイレクトする。
 *
 * @param basePath リダイレクト先のパス (例: `/calendar/create`)
 * @param form 元の FormData (中の文字列値を復元する)
 * @param error エラーコード (`invalid_input` 等)
 * @param message 任意の補足メッセージ (UI 側で `error` フォールバック可)
 *
 * 既存の `redirectWithError` 関数を `calendar-actions.ts` / `group-actions.ts` から
 * このヘルパーへ統合するための共通実装。`redirect` 関数 (next/navigation) を
 * 呼び出し元から受け取る (Server Action ファイル外への循環 import を避けるため)。
 */
export function buildRedirectUrlWithFormError(
  basePath: string,
  form: FormData,
  error: string,
  message?: string,
): string {
  const sp = new URLSearchParams();
  sp.set("error", error);
  if (message) sp.set("message", message);
  for (const [k, v] of form.entries()) {
    if (typeof v === "string" && v.length > 0 && k !== "_action") {
      sp.set(k, v);
    }
  }
  return `${basePath}?${sp.toString()}`;
}
