/**
 * `@tech-event/web-feature-payment` — 決済 (Payment) 機能。Stripe 連携を含む。
 *
 * - payment-actions      : Checkout / 返金 (refundPayment) Server Actions
 * - coupon-actions       : クーポン発行 / 検証 Server Actions
 * - subscription-actions : グループ Plus プラン (subscription) Server Actions
 * - lib/stripe           : Stripe SDK ラッパー
 * - lib/coupon           : 割引計算の純粋関数 (computeCouponDiscount 等)
 * - lib/plan             : プラン判定 (isGroupPlus) / 機能ゲート (PLAN_LIMITS)
 */
export * from "./payment-actions";
export * from "./coupon-actions";
export * from "./subscription-actions";
export * from "./lib/stripe";
export * from "./lib/coupon";
export * from "./lib/plan";
