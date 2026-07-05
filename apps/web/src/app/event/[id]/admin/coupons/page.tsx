/**
 * 主催者向けクーポン管理ページ (`/event/[id]/admin/coupons`)
 *
 * - 認証必須 + Event.owner or GroupAdmin のみ (それ以外は 404)。
 *   親 layout でも同チェックを行うが、check-in ページ同様に二重防御する。
 * - クーポンの発行 / 一覧 / 無効化。
 * - 「検証プレビュー」: コード + 価格を入れると validateCoupon +
 *   computeCouponDiscount の結果 (割引額 / 割引後金額) を表示する。
 *   GET フォームなので Server Action 不要 (searchParams 経由)。
 *
 * 対象ペルソナ: P6 (コミュニティ主催者) / P7 (企業イベント担当)。
 */

import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  computeCouponDiscount,
  createCouponForm,
  deactivateCouponForm,
  listCoupons,
  validateCoupon,
} from "@tech-event/web-feature-payment";

export const dynamic = "force-dynamic";

function parseId(raw: string): bigint | null {
  if (!/^\d+$/.test(raw)) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

function first(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_input: "入力内容が不正です。",
  duplicate_code: "同じコードのクーポンが既に存在します。",
  forbidden: "権限がありません。",
  unauthorized: "ログインが必要です。",
  not_found: "対象が見つかりません。",
  error: "処理に失敗しました。時間をおいて再試行してください。",
};

const VALIDATE_REASONS: Record<string, string> = {
  invalid_input: "コードの形式が不正です。",
  not_found: "該当するクーポンが見つかりません。",
  inactive: "このクーポンは無効化されています。",
  expired: "このクーポンは有効期限切れです。",
  exhausted: "このクーポンは利用上限に達しています。",
  per_user_limit: "このユーザーは利用上限に達しています。",
};

export default async function AdminCouponsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id: raw } = await params;
  const sp = await searchParams;
  const id = parseId(raw);
  if (!id) notFound();

  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/event/${id.toString()}/admin/coupons`)}`,
    );
  }

  const event = await prisma.event.findUnique({
    where: { id },
    select: { id: true, title: true, ownerId: true, groupId: true },
  });
  if (!event) notFound();

  const isOwner = event.ownerId === user.id;
  const groupAdmin = isOwner
    ? null
    : await prisma.groupAdmin.findFirst({
        where: { groupId: event.groupId, userId: user.id },
        select: { id: true },
      });
  if (!isOwner && !groupAdmin) notFound();

  const eventIdStr = id.toString();
  const coupons = await listCoupons(eventIdStr);

  // ---- 検証プレビュー (GET フォーム / searchParams) ----
  const previewCode = first(sp.validate_code).trim();
  const previewPriceRaw = first(sp.validate_price).trim();
  const previewPrice =
    previewPriceRaw && /^\d+$/.test(previewPriceRaw)
      ? Number(previewPriceRaw)
      : null;

  let preview:
    | {
        code: string;
        valid: boolean;
        reason?: string;
        discountType?: string;
        discountValue?: number;
        discount?: number;
        finalAmount?: number;
      }
    | null = null;
  if (previewCode && previewPrice !== null) {
    const validated = await validateCoupon(eventIdStr, previewCode);
    if (validated.valid) {
      const discount = computeCouponDiscount(
        validated.discountType,
        validated.discountValue,
        previewPrice,
      );
      preview = {
        code: validated.code,
        valid: true,
        discountType: validated.discountType,
        discountValue: validated.discountValue,
        discount,
        finalAmount: previewPrice - discount,
      };
    } else {
      preview = { code: previewCode, valid: false, reason: validated.reason };
    }
  }

  const created = first(sp.created);
  const deactivated = first(sp.deactivated);
  const error = first(sp.error);

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
      <nav className="mb-4 text-sm">
        <Link
          href={`/event/${eventIdStr}`}
          className="text-link hover:underline"
        >
          ← イベントに戻る
        </Link>
      </nav>

      <h1 className="text-2xl font-bold text-foreground">
        クーポン管理 (主催者用)
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{event.title}</p>

      {created ? (
        <p
          className="mt-4 rounded-md border border-border bg-status-open-bg px-3 py-2 text-sm font-semibold text-status-open-fg"
          data-testid="coupon-created-banner"
        >
          クーポン「{created}」を発行しました。
        </p>
      ) : null}
      {deactivated ? (
        <p
          className="mt-4 rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
          data-testid="coupon-deactivated-banner"
        >
          クーポンを無効化しました。
        </p>
      ) : null}
      {error ? (
        <p
          className="mt-4 rounded-md border border-danger bg-surface px-3 py-2 text-sm font-semibold text-danger"
          role="alert"
          data-testid="coupon-error-banner"
        >
          {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.error}
        </p>
      ) : null}

      {/* ---- 発行フォーム ---- */}
      <section
        className="mt-6 rounded-md border border-border bg-surface p-4"
        aria-labelledby="coupon-create-heading"
      >
        <h2
          id="coupon-create-heading"
          className="text-lg font-bold text-foreground"
        >
          クーポンを発行
        </h2>
        <form
          action={createCouponForm}
          className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"
          data-testid="coupon-create-form"
        >
          <input type="hidden" name="eventId" value={eventIdStr} />
          <label className="block text-sm">
            <span className="font-semibold text-foreground">コード</span>
            <input
              type="text"
              name="code"
              required
              minLength={2}
              maxLength={32}
              pattern="[A-Za-z0-9_-]+"
              placeholder="EARLYBIRD10"
              className="mt-1 block w-full rounded border border-border bg-background px-2 py-1.5 text-foreground"
              data-testid="coupon-code-input"
            />
            <span className="mt-0.5 block text-xs text-muted-foreground">
              英数字・ハイフン・アンダースコア (保存時に大文字化)
            </span>
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-foreground">割引種別</span>
            <select
              name="discountType"
              className="mt-1 block w-full rounded border border-border bg-background px-2 py-1.5 text-foreground"
              data-testid="coupon-type-select"
              defaultValue="fixed"
            >
              <option value="fixed">定額 (JPY)</option>
              <option value="percent">定率 (%)</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-foreground">
              割引値 (JPY or %)
            </span>
            <input
              type="number"
              name="discountValue"
              required
              min={1}
              className="mt-1 block w-full rounded border border-border bg-background px-2 py-1.5 text-foreground"
              data-testid="coupon-value-input"
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-foreground">
              利用上限 (空 = 無制限)
            </span>
            <input
              type="number"
              name="maxRedemptions"
              min={1}
              className="mt-1 block w-full rounded border border-border bg-background px-2 py-1.5 text-foreground"
              data-testid="coupon-max-input"
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-foreground">
              1 ユーザーあたり上限
            </span>
            <input
              type="number"
              name="perUserLimit"
              min={1}
              max={100}
              defaultValue={1}
              className="mt-1 block w-full rounded border border-border bg-background px-2 py-1.5 text-foreground"
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-foreground">
              有効期限 (空 = 無期限)
            </span>
            <input
              type="date"
              name="expiresAt"
              className="mt-1 block w-full rounded border border-border bg-background px-2 py-1.5 text-foreground"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded bg-brand-orange px-4 text-sm font-semibold text-white hover:bg-brand-orange-hover"
              data-testid="coupon-create-submit"
            >
              発行する
            </button>
          </div>
        </form>
      </section>

      {/* ---- 検証プレビュー ---- */}
      <section
        className="mt-6 rounded-md border border-border bg-surface p-4"
        aria-labelledby="coupon-validate-heading"
      >
        <h2
          id="coupon-validate-heading"
          className="text-lg font-bold text-foreground"
        >
          コード検証プレビュー
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          参加費を入れると、適用時の割引額と割引後金額を計算します。
        </p>
        <form
          method="get"
          className="mt-3 flex flex-wrap items-end gap-3"
          data-testid="coupon-validate-form"
        >
          <label className="block text-sm">
            <span className="font-semibold text-foreground">コード</span>
            <input
              type="text"
              name="validate_code"
              required
              defaultValue={previewCode}
              className="mt-1 block w-40 rounded border border-border bg-background px-2 py-1.5 text-foreground"
              data-testid="coupon-validate-code-input"
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-foreground">参加費 (JPY)</span>
            <input
              type="number"
              name="validate_price"
              required
              min={1}
              defaultValue={previewPriceRaw || undefined}
              className="mt-1 block w-32 rounded border border-border bg-background px-2 py-1.5 text-foreground"
              data-testid="coupon-validate-price-input"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-brand-orange-soft"
            data-testid="coupon-validate-submit"
          >
            検証する
          </button>
        </form>

        {preview ? (
          preview.valid ? (
            <div
              className="mt-3 rounded border border-border bg-background p-3 text-sm"
              data-testid="coupon-validate-result"
            >
              <p className="font-semibold text-status-open-fg">
                有効なクーポンです: {preview.code}
              </p>
              <dl className="mt-2 grid grid-cols-2 gap-1 text-foreground sm:max-w-sm">
                <dt className="text-muted-foreground">割引</dt>
                <dd>
                  {preview.discountType === "percent"
                    ? `${preview.discountValue}%`
                    : `¥${preview.discountValue?.toLocaleString("ja-JP")}`}
                </dd>
                <dt className="text-muted-foreground">割引額</dt>
                <dd data-testid="coupon-validate-discount">
                  ¥{preview.discount?.toLocaleString("ja-JP")}
                </dd>
                <dt className="text-muted-foreground">割引後金額</dt>
                <dd data-testid="coupon-validate-final">
                  ¥{preview.finalAmount?.toLocaleString("ja-JP")}
                </dd>
              </dl>
            </div>
          ) : (
            <p
              className="mt-3 rounded border border-danger bg-background p-3 text-sm font-semibold text-danger"
              role="alert"
              data-testid="coupon-validate-result"
            >
              {VALIDATE_REASONS[preview.reason ?? ""] ??
                "このコードは利用できません。"}
            </p>
          )
        ) : null}
      </section>

      {/* ---- 一覧 ---- */}
      <section
        className="mt-6 overflow-x-auto rounded-md border border-border bg-surface"
        aria-labelledby="coupon-list-heading"
      >
        <h2 id="coupon-list-heading" className="sr-only">
          クーポン一覧
        </h2>
        <table className="w-full text-sm" data-testid="coupon-list">
          <thead className="bg-background text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">コード</th>
              <th className="px-3 py-2">割引</th>
              <th className="px-3 py-2">利用状況</th>
              <th className="px-3 py-2">有効期限</th>
              <th className="px-3 py-2">状態</th>
              <th className="px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  クーポンはまだありません。
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-border"
                  data-testid={`coupon-row-${c.code}`}
                >
                  <td className="px-3 py-2 font-mono font-semibold text-foreground">
                    {c.code}
                  </td>
                  <td className="px-3 py-2 text-foreground">
                    {c.discountType === "percent"
                      ? `${c.discountValue}%`
                      : `¥${c.discountValue.toLocaleString("ja-JP")}`}
                  </td>
                  <td className="px-3 py-2 text-foreground">
                    {c.redeemedCount}
                    {c.maxRedemptions !== null
                      ? ` / ${c.maxRedemptions}`
                      : " / ∞"}
                    <span className="ml-1 text-xs text-muted-foreground">
                      (1人{c.perUserLimit}回まで)
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {c.expiresAt
                      ? new Date(c.expiresAt).toLocaleDateString("ja-JP")
                      : "無期限"}
                  </td>
                  <td className="px-3 py-2">
                    {c.active ? (
                      <span className="rounded bg-status-open-bg px-2 py-0.5 text-xs font-semibold text-status-open-fg">
                        有効
                      </span>
                    ) : (
                      <span className="rounded bg-background px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                        無効
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {c.active ? (
                      <form action={deactivateCouponForm}>
                        <input
                          type="hidden"
                          name="eventId"
                          value={eventIdStr}
                        />
                        <input type="hidden" name="couponId" value={c.id} />
                        <button
                          type="submit"
                          className="inline-flex h-8 items-center rounded border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-brand-orange-soft"
                          data-testid={`coupon-deactivate-${c.code}`}
                        >
                          無効化
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
