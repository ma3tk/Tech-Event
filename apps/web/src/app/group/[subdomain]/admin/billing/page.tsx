/**
 * グループ admin 課金 (Plus プラン) 管理ページ。
 *
 * - 認証必須 + GroupAdmin (owner / admin) のみ閲覧可能。
 * - 現在のプラン (Free / Plus) と有効期限を表示。
 * - Free → Plus のアップグレード (Stripe Checkout mode=subscription)。
 *   Stripe / STRIPE_PLUS_PRICE_ID 未設定環境では「準備中」表示に
 *   フォールバックする (既存の現地払いフォールバックと同方針)。
 * - Plus → 解約 (Stripe 設定済みなら subscriptions.cancel、未設定なら DB のみ)。
 *
 * URL: `/group/[subdomain]/admin/billing`
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Breadcrumb from "@/components/Breadcrumb";
import {
  PLAN_LIMITS,
  PLUS_PLAN_PRICE_LABEL,
  cancelPlusSubscriptionForm,
  formatPlanLimit,
  isGroupPlus,
  isPlusSubscriptionConfigured,
  upgradeGroupPlanForm,
} from "@tech-event/web-feature-payment";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "プラン / 課金 | tech-event",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ billing?: string }>;
};

/** `?billing=` トースト文言 (upgradeGroupPlanForm / cancelPlusSubscriptionForm が付与) */
const TOAST_MESSAGES: Record<string, { kind: "success" | "error"; text: string }> = {
  success: {
    kind: "success",
    text: "お支払いが完了しました。プランへの反映まで少し時間がかかる場合があります。",
  },
  canceled_plan: {
    kind: "success",
    text: "Plus プランを解約しました。グループは Free プランに戻りました。",
  },
  checkout_cancelled: {
    kind: "error",
    text: "チェックアウトがキャンセルされました。プランは変更されていません。",
  },
  disabled: {
    kind: "error",
    text: "オンライン決済は現在準備中です。しばらくお待ちください。",
  },
  already_plus: {
    kind: "error",
    text: "このグループは既に Plus プランです。",
  },
  not_plus: {
    kind: "error",
    text: "このグループは Plus プランではありません。",
  },
  forbidden: {
    kind: "error",
    text: "この操作を行う権限がありません (owner / admin のみ)。",
  },
  error: {
    kind: "error",
    text: "処理中にエラーが発生しました。時間をおいて再度お試しください。",
  },
};

/** 機能比較表に出す項目 (PLAN_LIMITS のキーと表示ラベル) */
const LIMIT_ROWS: { key: keyof typeof PLAN_LIMITS.free; label: string }[] = [
  { key: "maxWebhookEndpoints", label: "Outbound Webhook エンドポイント数" },
  { key: "customEventTheme", label: "イベントテーマカスタマイズ" },
  { key: "customDomain", label: "カスタムドメイン" },
  { key: "prioritySupport", label: "優先サポート" },
];

export default async function GroupAdminBillingPage({
  params,
  searchParams,
}: PageProps) {
  const { subdomain } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/group/${subdomain}/admin/billing`)}`,
    );
  }

  const group = await prisma.group.findUnique({ where: { subdomain } });
  if (!group) notFound();

  const admin = await prisma.groupAdmin.findUnique({
    where: { groupId_userId: { groupId: group.id, userId: user.id } },
  });
  const isAdmin =
    !!admin && (admin.role === "owner" || admin.role === "admin");
  if (!isAdmin) notFound();

  const plus = isGroupPlus(group);
  const checkoutAvailable = isPlusSubscriptionConfigured();
  const toast = sp.billing ? TOAST_MESSAGES[sp.billing] : undefined;

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: group.name, href: `/group/${subdomain}` },
          { label: "プラン / 課金" },
        ]}
      />

      <header className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="text-xl font-bold md:text-2xl"
            data-testid="billing-heading"
          >
            プラン / 課金
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {group.name} の課金プランを管理します。Plus プラン (
            {PLUS_PLAN_PRICE_LABEL}) では Webhook 上限の緩和などの拡張機能が
            利用できます。
          </p>
        </div>
        <Link
          href={`/group/${subdomain}/admin/webhooks`}
          className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium hover:bg-brand-orange-soft"
        >
          Webhook 管理へ
        </Link>
      </header>

      {toast && (
        <p
          role={toast.kind === "error" ? "alert" : "status"}
          data-testid="billing-toast"
          className={
            toast.kind === "error"
              ? "mt-4 rounded-md border border-status-cancelled-bg bg-status-cancelled-bg/10 px-3 py-2 text-sm text-status-cancelled-fg"
              : "mt-4 rounded-md border border-border bg-brand-orange-soft px-3 py-2 text-sm text-foreground"
          }
        >
          {toast.text}
        </p>
      )}

      {/* ============ 現在のプラン ============ */}
      <section
        className="mt-6 rounded-md border border-border bg-surface p-4"
        data-testid="billing-current-plan"
      >
        <h2 className="text-sm font-medium text-muted-foreground">
          現在のプラン
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span
            data-testid="billing-plan-badge"
            className={
              plus
                ? "inline-flex rounded-full bg-brand-orange px-3 py-1 text-sm font-semibold text-white"
                : "inline-flex rounded-full border border-border bg-background px-3 py-1 text-sm font-semibold text-foreground"
            }
          >
            {plus ? "Plus" : "Free"}
          </span>
          {plus && group.planExpiresAt && (
            <span
              className="text-sm text-muted-foreground"
              data-testid="billing-expires"
            >
              次回更新 / 有効期限:{" "}
              {group.planExpiresAt.toLocaleString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          )}
          {!plus && group.plan === "plus" && group.planExpiresAt && (
            <span
              className="text-sm text-status-cancelled-fg"
              data-testid="billing-expired-note"
            >
              Plus プランの有効期限が切れています (Free プランとして動作中)。
            </span>
          )}
        </div>

        {/* ---- アクション: アップグレード or 解約 ---- */}
        <div className="mt-4">
          {plus ? (
            <form
              action={cancelPlusSubscriptionForm}
              data-testid="billing-cancel-form"
            >
              <input type="hidden" name="groupId" value={group.id.toString()} />
              <input type="hidden" name="subdomain" value={subdomain} />
              <button
                type="submit"
                data-testid="billing-cancel-button"
                className="inline-flex h-9 items-center rounded-md border border-status-cancelled-bg bg-surface px-4 text-sm font-medium text-status-cancelled-fg hover:bg-status-cancelled-bg/20"
              >
                Plus プランを解約する
              </button>
              <p className="mt-2 text-xs text-muted-foreground">
                解約すると即時に Free プランへ戻ります。既存のデータや
                イベントはそのまま残ります。
              </p>
            </form>
          ) : checkoutAvailable ? (
            <form
              action={upgradeGroupPlanForm}
              data-testid="billing-upgrade-form"
            >
              <input type="hidden" name="groupId" value={group.id.toString()} />
              <input type="hidden" name="subdomain" value={subdomain} />
              <button
                type="submit"
                data-testid="billing-upgrade-button"
                className="inline-flex h-9 items-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white hover:bg-brand-orange-hover"
              >
                Plus にアップグレード ({PLUS_PLAN_PRICE_LABEL})
              </button>
              <p className="mt-2 text-xs text-muted-foreground">
                Stripe の安全なチェックアウト画面に移動します。
              </p>
            </form>
          ) : (
            <div
              data-testid="billing-upgrade-disabled"
              className="rounded-md border border-dashed border-border bg-background px-4 py-3 text-sm text-muted-foreground"
            >
              オンラインでのアップグレードは現在準備中です。
              決済環境の設定が完了するまで、このグループは Free
              プランのままご利用いただけます (既存機能に制限はありません)。
            </div>
          )}
        </div>
      </section>

      {/* ============ プラン比較 (機能ゲート) ============ */}
      <section className="mt-6" data-testid="billing-plan-limits">
        <h2 className="text-lg font-bold">プラン比較</h2>
        <div className="mt-3 overflow-x-auto rounded-md border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-background text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">機能</th>
                <th className="px-3 py-2 text-center">Free</th>
                <th className="px-3 py-2 text-center">Plus</th>
              </tr>
            </thead>
            <tbody>
              {LIMIT_ROWS.map((row) => (
                <tr
                  key={row.key}
                  className="border-b border-border last:border-0"
                  data-testid={`billing-limit-${row.key}`}
                >
                  <th scope="row" className="px-3 py-2 text-left font-medium">
                    {row.label}
                  </th>
                  <td className="px-3 py-2 text-center">
                    {formatPlanLimit(PLAN_LIMITS.free[row.key])}
                  </td>
                  <td className="px-3 py-2 text-center font-medium">
                    {formatPlanLimit(PLAN_LIMITS.plus[row.key])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          料金プランの詳細は{" "}
          <Link href="/pricing" className="text-link hover:text-link-hover">
            料金プランページ
          </Link>{" "}
          をご覧ください。
        </p>
      </section>
    </div>
  );
}
