/**
 * Stripe SDK のサーバサイドラッパー。
 *
 * 環境変数:
 *   - STRIPE_SECRET_KEY        : 必須 (未設定なら Stripe 機能は disable)
 *   - STRIPE_WEBHOOK_SECRET    : webhook 検証用
 *   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY : クライアント側 (Checkout redirect 等) で使う
 *
 * `getStripe()` は STRIPE_SECRET_KEY が無いときは null を返す。
 * 呼び出し側はこれを判定して、有料イベントの「事前決済」 (`pricingType = "prepaid"`)
 * を扱うかどうか分岐する。未設定なら従来挙動 (現地払い表記) にフォールバック。
 */
import Stripe from "stripe";

let _stripe: Stripe | null = null;

/**
 * 環境変数から Stripe インスタンスを取得 (singleton)。
 * 未設定環境では null を返し、呼び出し側でフォールバック扱いとする。
 */
export function getStripe(): Stripe | null {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  _stripe = new Stripe(key, {
    // SDK のバージョン互換のため apiVersion を固定しない
    typescript: true,
    // 任意の app 名を入れる
    appInfo: {
      name: "tech-event",
      version: "0.1.0",
    },
  });
  return _stripe;
}

/** Stripe が利用可能か (= STRIPE_SECRET_KEY が設定済みか) */
export function isStripeEnabled(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/** Stripe Webhook の署名検証に使う secret。未設定なら null。 */
export function getStripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET || null;
}

/** クライアントサイドで使う公開可能キー (`@stripe/stripe-js` 用) */
export function getStripePublishableKey(): string | null {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null;
}
