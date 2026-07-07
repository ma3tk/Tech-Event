/**
 * クーポン割引の純粋計算ヘルパー。
 *
 * `coupon-actions.ts` は `"use server"` ファイルのため async 関数しか export
 * できない。割引計算のような同期の純粋関数はここに置き、Server Action /
 * webhook / UI (Server Component) から共用する。
 *
 * 金額は全て Int (JPY)。
 */

/**
 * 割引適用後の最低請求額 (JPY)。
 *
 * - Stripe の JPY 最低請求額は ¥50。割引後 amount が 0 以下 (あるいは
 *   Stripe が拒否する少額) にならないよう、割引額をここまでで頭打ちにする。
 * - 「実質無料クーポン」を作りたい場合も、この下限までの割引となる
 *   (完全無料は pricingType 自体を無料枠にする運用)。
 */
export const MIN_PAID_AMOUNT_JPY = 50;

/** クーポン種別: 定率 (%) or 定額 (JPY) */
export type CouponDiscountType = "percent" | "fixed";

/**
 * クーポンコードの正規化。
 *
 * - 前後空白を除去し、大文字化する (保存・照合とも正規化後の値を使う)。
 */
export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * 割引額 (JPY) を計算する。
 *
 * - `percent`: `floor(price * value / 100)`
 * - `fixed`  : `value` そのまま
 * - いずれも「割引後金額が {@link MIN_PAID_AMOUNT_JPY} を下回らない」よう
 *   `price - MIN_PAID_AMOUNT_JPY` で頭打ちにする (0 以下ガード)。
 * - price が下限以下 (通常あり得ない設定) なら割引 0。
 *
 * @returns 実際に割り引く額 (0 以上、`price - MIN_PAID_AMOUNT_JPY` 以下)
 */
export function computeCouponDiscount(
  discountType: string,
  discountValue: number,
  price: number,
): number {
  if (!Number.isFinite(price) || price <= MIN_PAID_AMOUNT_JPY) return 0;
  if (!Number.isFinite(discountValue) || discountValue <= 0) return 0;

  const raw =
    discountType === "percent"
      ? Math.floor((price * Math.min(discountValue, 100)) / 100)
      : Math.floor(discountValue);

  const maxDiscount = price - MIN_PAID_AMOUNT_JPY;
  return Math.max(0, Math.min(raw, maxDiscount));
}
