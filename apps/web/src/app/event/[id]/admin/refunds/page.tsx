/**
 * 主催者向け返金管理ページ (`/event/[id]/admin/refunds`)
 *
 * - 認証必須 + Event.owner or GroupAdmin のみ (それ以外は 404)。
 *   親 layout でも同チェックを行うが、check-in ページ同様に二重防御する。
 * - イベント参加者の支払い一覧 (Payment) を表示し、各行から
 *   全額 / 部分返金を実行できる (`refundPaymentForm`)。
 * - Stripe 決済は Stripe API 経由で返金、現地払い等は DB 記録のみ。
 *
 * 対象ペルソナ: P6 (コミュニティ主催者) / P7 (企業イベント担当)。
 */

import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { refundPaymentForm } from "@tech-event/web-feature-payment";

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

const STATUS_LABELS: Record<string, string> = {
  pending: "支払い待ち",
  succeeded: "支払い済み",
  refunded: "返金済み",
  partially_refunded: "一部返金済み",
  failed: "失敗",
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid_input: "入力内容が不正です。",
  unauthorized: "ログインが必要です。",
  forbidden: "権限がありません。",
  not_found: "対象の支払いが見つかりません。",
  not_refundable: "この支払いは返金できない状態です。",
  amount_exceeds: "返金額が返金可能残額を超えています。",
  error: "返金処理に失敗しました。時間をおいて再試行してください。",
};

export default async function AdminRefundsPage({
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
      `/login?next=${encodeURIComponent(`/event/${id.toString()}/admin/refunds`)}`,
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

  // 支払いレコードのある参加者一覧 (キャンセル済み含む: 返金対象になり得る)
  const participants = await prisma.participant.findMany({
    where: {
      eventId: id,
      payment: { isNot: null },
    },
    orderBy: { appliedAt: "asc" },
    include: {
      payment: true,
      user: {
        select: {
          id: true,
          nickname: true,
          displayName: true,
        },
      },
      eventRole: { select: { name: true } },
    },
  });

  const eventIdStr = id.toString();
  const refunded = first(sp.refunded);
  const error = first(sp.error);

  const totalPaid = participants.reduce(
    (sum, p) => sum + (p.payment?.amount ?? 0),
    0,
  );
  const totalRefunded = participants.reduce(
    (sum, p) => sum + (p.payment?.refundedAmount ?? 0),
    0,
  );

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <nav className="mb-4 text-sm">
        <Link
          href={`/event/${eventIdStr}`}
          className="text-link hover:underline"
        >
          ← イベントに戻る
        </Link>
      </nav>

      <h1 className="text-2xl font-bold text-foreground">
        返金管理 (主催者用)
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{event.title}</p>

      {refunded ? (
        <p
          className="mt-4 rounded-md border border-border bg-status-open-bg px-3 py-2 text-sm font-semibold text-status-open-fg"
          data-testid="refund-success-banner"
        >
          {refunded === "refunded"
            ? "全額返金しました。"
            : "一部返金しました。"}
        </p>
      ) : null}
      {error ? (
        <p
          className="mt-4 rounded-md border border-danger bg-surface px-3 py-2 text-sm font-semibold text-danger"
          role="alert"
          data-testid="refund-error-banner"
        >
          {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.error}
        </p>
      ) : null}

      <section className="mt-4 grid grid-cols-1 gap-3 rounded-md border border-border bg-surface p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase text-muted-foreground">支払い件数</p>
          <p className="mt-1 text-lg font-bold text-foreground">
            {participants.length} 件
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">支払い総額</p>
          <p className="mt-1 text-lg font-bold text-foreground">
            ¥{totalPaid.toLocaleString("ja-JP")}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">返金総額</p>
          <p className="mt-1 text-lg font-bold text-foreground">
            ¥{totalRefunded.toLocaleString("ja-JP")}
          </p>
        </div>
      </section>

      <section
        className="mt-6 overflow-x-auto rounded-md border border-border bg-surface"
        aria-labelledby="refunds-heading"
      >
        <h2 id="refunds-heading" className="sr-only">
          支払い一覧
        </h2>
        <table className="w-full text-sm" data-testid="refund-list">
          <thead className="bg-background text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">参加者</th>
              <th className="px-3 py-2">枠 / 決済</th>
              <th className="px-3 py-2">金額</th>
              <th className="px-3 py-2">状態</th>
              <th className="px-3 py-2">返金</th>
            </tr>
          </thead>
          <tbody>
            {participants.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  支払いレコードのある参加者がいません。
                </td>
              </tr>
            ) : (
              participants.map((p) => {
                const pay = p.payment;
                if (!pay) return null;
                const refundedAmount = pay.refundedAmount ?? 0;
                const remaining = pay.amount - refundedAmount;
                const refundable =
                  (pay.status === "succeeded" ||
                    pay.status === "partially_refunded") &&
                  remaining > 0;
                return (
                  <tr
                    key={p.id.toString()}
                    className="border-t border-border align-top"
                    data-testid={`refund-row-${p.user.id.toString()}`}
                  >
                    <td className="px-3 py-2">
                      <Link
                        href={`/user/${p.user.nickname}`}
                        className="font-medium text-link hover:underline"
                      >
                        {p.user.displayName}
                      </Link>
                      <span className="ml-1 text-xs text-muted-foreground">
                        @{p.user.nickname}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {p.eventRole.name}
                      <br />
                      {pay.provider}
                      {pay.paidAt
                        ? ` / ${new Date(pay.paidAt).toLocaleString("ja-JP")}`
                        : ""}
                    </td>
                    <td className="px-3 py-2 text-foreground">
                      ¥{pay.amount.toLocaleString("ja-JP")}
                      {(pay.discountAmount ?? 0) > 0 ? (
                        <span className="block text-xs text-muted-foreground">
                          (クーポン割引 ¥
                          {(pay.discountAmount ?? 0).toLocaleString("ja-JP")})
                        </span>
                      ) : null}
                      {refundedAmount > 0 ? (
                        <span className="block text-xs text-muted-foreground">
                          返金済 ¥{refundedAmount.toLocaleString("ja-JP")}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          pay.status === "refunded" ||
                          pay.status === "partially_refunded"
                            ? "rounded bg-background px-2 py-0.5 text-xs font-semibold text-muted-foreground"
                            : "rounded bg-status-open-bg px-2 py-0.5 text-xs font-semibold text-status-open-fg"
                        }
                        data-testid={`refund-status-${p.user.id.toString()}`}
                      >
                        {STATUS_LABELS[pay.status] ?? pay.status}
                      </span>
                      {pay.refundReason ? (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          理由: {pay.refundReason}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      {refundable ? (
                        <form
                          action={refundPaymentForm}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <input
                            type="hidden"
                            name="eventId"
                            value={eventIdStr}
                          />
                          <input
                            type="hidden"
                            name="participantId"
                            value={p.id.toString()}
                          />
                          <input
                            type="number"
                            name="amount"
                            min={1}
                            max={remaining}
                            placeholder={`全額 (¥${remaining.toLocaleString("ja-JP")})`}
                            aria-label="返金額 (空なら全額)"
                            className="h-8 w-36 rounded border border-border bg-background px-2 text-xs text-foreground"
                            data-testid={`refund-amount-${p.user.id.toString()}`}
                          />
                          <input
                            type="text"
                            name="reason"
                            maxLength={500}
                            placeholder="返金理由 (任意)"
                            aria-label="返金理由"
                            className="h-8 w-40 rounded border border-border bg-background px-2 text-xs text-foreground"
                            data-testid={`refund-reason-${p.user.id.toString()}`}
                          />
                          <button
                            type="submit"
                            className="inline-flex h-8 items-center rounded bg-brand-orange px-3 text-xs font-semibold text-white hover:bg-brand-orange-hover"
                            data-testid={`refund-submit-${p.user.id.toString()}`}
                          >
                            返金する
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {remaining <= 0 ? "返金済み" : "-"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      <p className="mt-3 text-xs text-muted-foreground">
        Stripe 決済は Stripe API 経由で返金されます。現地払いなどの Stripe
        外決済は、実際の返金を別途行ったうえで記録として更新してください。
      </p>
    </div>
  );
}
