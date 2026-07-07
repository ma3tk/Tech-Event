/**
 * グループ課金プラン (free / plus) の判定と機能ゲートの論理定義。
 *
 * 方針 (CLAUDE.md 1.1「既存機能を削減しない」):
 *   - ゲートは「Plus で上限緩和」方向のみ。free の値は既存実装の挙動と
 *     完全に一致させる (free ユーザーの体験は従来と 1 bit も変わらない)。
 *   - 例: Outbound Webhook エンドポイント上限は feature-group の
 *     `MAX_ENDPOINTS_PER_GROUP = 10` が既存値 → free は 10 のまま、
 *     Plus は無制限に緩和する。
 *   - まだ実装されていない機能 (カスタムドメイン等) は「論理定義」として
 *     Plus 側にのみ true を置く (free の既存挙動には影響しない)。
 *
 * 環境変数:
 *   - STRIPE_PLUS_PRICE_ID : Plus プランの Stripe Price ID (subscription)。
 *     未設定なら Plus checkout は無効 (disabled フォールバック)。
 */
import { isStripeEnabled } from "./stripe";

/* ============================================================
 * 型
 * ============================================================ */

/** グループの課金プラン識別子 */
export type GroupPlan = "free" | "plus";

/** プラン判定に必要な最小限の Group 形状 (Prisma Group と構造的互換) */
export type PlanGroupLike = {
  plan: string;
  planExpiresAt: Date | null;
};

/** 「無制限」を表す番兵値 (UI では `formatPlanLimit` で「無制限」表示) */
export const UNLIMITED = Number.POSITIVE_INFINITY;

/** プランごとの機能ゲート論理定義 */
export type PlanLimits = {
  /**
   * Outbound Webhook エンドポイント上限。
   * free = 10 は feature-group `MAX_ENDPOINTS_PER_GROUP` の既存値と整合
   * (free の挙動は従来と同一。Plus は無制限に緩和)。
   */
  maxWebhookEndpoints: number;
  /**
   * イベントテーマ (カラー/カバー) カスタマイズ。
   * 既存実装では free でも利用可能なため free = true を維持する。
   */
  customEventTheme: boolean;
  /** カスタムドメイン (未実装機能の論理定義。Plus のみ) */
  customDomain: boolean;
  /** 優先サポート (論理定義。Plus のみ) */
  prioritySupport: boolean;
};

/* ============================================================
 * 定義
 * ============================================================ */

/**
 * プラン別の機能ゲート。
 *
 * IMPORTANT: free の値を既存実装の上限より下げてはならない
 * (既存機能の縮小になるため)。Plus は緩和のみ。
 */
export const PLAN_LIMITS: Record<GroupPlan, PlanLimits> = {
  free: {
    maxWebhookEndpoints: 10, // 既存の MAX_ENDPOINTS_PER_GROUP と同値
    customEventTheme: true, // 既存挙動を維持 (free でも利用可)
    customDomain: false,
    prioritySupport: false,
  },
  plus: {
    maxWebhookEndpoints: UNLIMITED,
    customEventTheme: true,
    customDomain: true,
    prioritySupport: true,
  },
};

/** Plus プランの表示用価格ラベル (pricing ページと整合) */
export const PLUS_PLAN_PRICE_LABEL = "$29 / 月";

/* ============================================================
 * 判定関数
 * ============================================================ */

/**
 * グループが有効な Plus プランかどうか。
 *
 * - `plan === "plus"` かつ `planExpiresAt` が未来 (または null = 無期限)
 * - 期限切れの Plus は free 扱い (webhook 遅延・解約後の残存に対する防御)
 */
export function isGroupPlus(group: PlanGroupLike): boolean {
  if (group.plan !== "plus") return false;
  if (group.planExpiresAt == null) return true;
  return group.planExpiresAt.getTime() > Date.now();
}

/** 期限切れを考慮した実効プランを返す */
export function resolveGroupPlan(group: PlanGroupLike): GroupPlan {
  return isGroupPlus(group) ? "plus" : "free";
}

/** グループの実効プランに対応する機能ゲートを返す */
export function getPlanLimits(group: PlanGroupLike): PlanLimits {
  return PLAN_LIMITS[resolveGroupPlan(group)];
}

/**
 * Plus サブスクリプション checkout が利用可能な環境か。
 * STRIPE_SECRET_KEY + STRIPE_PLUS_PRICE_ID の両方が必要。
 * 未設定環境では UI 側で「準備中」表示にフォールバックする。
 */
export function isPlusSubscriptionConfigured(): boolean {
  return isStripeEnabled() && !!getPlusPriceId();
}

/**
 * Plus プランの Stripe Price ID。未設定なら null。
 * NOTE: util-env の schema には未登録のため process.env を直接参照する
 * (optional な値であり、未設定でも既存挙動を壊さない)。
 * この値はログに出力しないこと。
 */
export function getPlusPriceId(): string | null {
  return process.env.STRIPE_PLUS_PRICE_ID || null;
}

/** UI 表示用: 数値上限を「無制限」/ 数字文字列に整形する */
export function formatPlanLimit(value: number | boolean): string {
  if (typeof value === "boolean") return value ? "対応" : "非対応";
  return Number.isFinite(value) ? String(value) : "無制限";
}
