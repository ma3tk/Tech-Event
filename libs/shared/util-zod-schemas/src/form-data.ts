/**
 * Server Action 共通の FormData ヘルパー。
 *
 * code-quality.md Medium #18 で指摘: `formValue` / `formValueRaw` / `formInt` が
 * 8 ファイルにコピペされていた。本モジュールに集約する。
 *
 * - `getString(form, key)`     : trim 済み文字列 (string|File → string)
 * - `getStringRaw(form, key)`  : trim しない文字列 (本文・コメント等で利用)
 * - `getInt(form, key)`        : 数値変換。空文字 / NaN は undefined
 * - `getBoolean(form, key)`    : "true"/"on"/"1" のみ true 判定
 *
 * 既存の Action 内で `formValue` / `formValueRaw` / `formInt` を local 定義していた
 * ものを段階的に置き換えること。
 */

/**
 * 文字列値を取得し trim する。`File` などの非文字列 / 欠落値は空文字を返す。
 *
 * 既存 `formValue` (event-actions.ts:36, comment-actions.ts:30, calendar-actions.ts:29 等)
 * の共通実装。
 */
export function getString(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/**
 * trim しない文字列値を取得。
 *
 * 既存 `formValueRaw` (event-admin-actions.ts:37, calendar-actions.ts:34 等)。
 * コメント本文 / マークダウン本文など、先頭末尾の改行も含めて保持する用途で使う。
 */
export function getStringRaw(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
}

/**
 * 整数値を取得。空文字 / 数値変換不能 / 非整数 は undefined。
 *
 * 既存 `formInt` (event-admin-actions.ts:42) の共通実装。
 * `parseInt(v, 10)` でなく `Number(v)` を使うのは `"12.5"` のような不正値を
 * `NaN` ではなく `12.5` として黙って取り込むのを防ぐため。
 */
export function getInt(form: FormData, key: string): number | undefined {
  const v = form.get(key);
  if (typeof v !== "string" || v.trim() === "") return undefined;
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return undefined;
  return n;
}

/**
 * Boolean 値を取得。`"true"` / `"on"` / `"1"` / `"yes"` を true 判定。
 *
 * HTML checkbox は チェック時 `"on"`、未チェック時 値そのものがない (= form.get → null) ため
 * デフォルトを false にする実装が一般的。
 */
export function getBoolean(form: FormData, key: string): boolean {
  const v = form.get(key);
  if (typeof v !== "string") return false;
  const s = v.toLowerCase().trim();
  return s === "true" || s === "on" || s === "1" || s === "yes";
}
