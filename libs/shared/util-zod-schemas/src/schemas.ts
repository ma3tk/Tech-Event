/**
 * Server Action 共通の Zod スキーマ群。
 *
 * code-quality.md Medium #19 で指摘: `BigIntIdSchema` / `BigIntIdString` が
 * 5+ ファイルに複製されていた。本モジュールに集約する。
 *
 * - `BigIntIdSchema`     : 数字のみ文字列 → BigInt 変換 (`z.transform`)
 * - `BigIntIdString`     : 数字のみ文字列 (BigInt 変換なし。後段で `BigInt(parsed)` するパターン用)
 * - `OptionalBigIntId`   : 空文字も許容 (任意項目用)
 *
 * 既存 Action 側の local 定義 (`event-actions.ts:41`, `event-admin-actions.ts:47`,
 * `payment-actions.ts:29`, `lottery-actions.ts:40`, `comment-actions.ts:33` 等) は
 * これに置き換える。
 */
import { z } from "zod";

/**
 * BigInt id を表す入力 schema (string → bigint に transform)。
 *
 * - HTML form は `<input value={id.toString()}>` で BigInt を文字列化して送るため、
 *   ここで一括 BigInt に変換する。
 */
export const BigIntIdSchema = z
  .string()
  .regex(/^\d+$/, "id must be digits only")
  .transform((s) => BigInt(s));

/**
 * BigInt id 文字列の schema (transform なし)。
 *
 * - 受信側で別途 `BigInt(parsed.data)` する旧パターン互換。
 * - 既存コードを段階的に `BigIntIdSchema` に寄せていく際の中間バージョン。
 */
export const BigIntIdString = z.string().regex(/^\d+$/, "id must be digits only");

/**
 * 任意項目用 BigInt id (空文字 / 未指定なら undefined)。
 */
export const OptionalBigIntId = z
  .string()
  .optional()
  .transform((s) => {
    if (!s || !/^\d+$/.test(s)) return undefined;
    return BigInt(s);
  });

/**
 * Slug 共通 schema (`/series` / `/calendar/[slug]` / `/group/[subdomain]` 等)。
 *
 * 3–63 文字、半角英小文字・数字・ハイフンのみ。
 */
export const SlugSchema = z
  .string()
  .min(3, "slug は 3 文字以上")
  .max(63, "slug は 63 文字以下")
  .regex(/^[a-z0-9-]+$/, "slug は半角英小文字・数字・ハイフンのみ");

/**
 * URL 文字列 (空文字許可)。
 */
export const UrlOrEmpty = z
  .string()
  .max(2000)
  .refine((v) => v === "" || /^https?:\/\//.test(v), "URL は http(s):// で始める");

/**
 * `#RGB` / `#RRGGBB` / `#RRGGBBAA` の hex カラー (空文字許可)。
 */
export const HexColorOrEmpty = z
  .string()
  .max(20)
  .refine(
    (v) => v === "" || /^#[0-9a-fA-F]{3,8}$/.test(v),
    "カラーは #RGB / #RRGGBB 形式",
  );
