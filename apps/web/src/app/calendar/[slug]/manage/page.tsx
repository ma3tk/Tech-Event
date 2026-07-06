/**
 * Calendar イベント管理ページ (所有者のみ)
 *
 * - Calendar に含まれるイベント一覧 + 削除ボタン
 * - 新規追加フォーム (event ID 指定)
 * - Membership Tier 管理 (作成 / 編集 / 無効化)
 * - 承認待ち購読リクエストの承認 / 却下
 *
 * 最低限の管理 UI。実運用ではイベント検索・候補ピックを足せる。
 */

import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  addEventToCalendar,
  removeEventFromCalendar,
} from "@/app/actions/calendar-actions";
import {
  createTierForm,
  updateTierForm,
  deactivateTierForm,
  approveSubscriptionForm,
  rejectSubscriptionForm,
} from "@tech-event/web-feature-calendar";
import { formatEventDateShort, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pickString(
  sp: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const v = sp[key];
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

export default async function CalendarManagePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const error = pickString(sp, "error");
  const message = pickString(sp, "message");
  const notice = pickString(sp, "notice");

  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/calendar/${slug}/manage`)}`,
    );
  }

  const cal = await prisma.calendar.findUnique({ where: { slug } });
  if (!cal) notFound();
  if (cal.ownerUserId !== user.id) {
    redirect(`/calendar/${slug}`);
  }

  const [items, tiers, pendingSubs] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: { calendarId: cal.id },
      orderBy: { event: { startedAt: "asc" } },
      include: { event: { include: { group: true } } },
    }),
    // manage は owner のみ到達するため inactive 込みで全 tier を出す
    prisma.calendarMembershipTier.findMany({
      where: { calendarId: cal.id },
      orderBy: [{ price: "asc" }, { id: "asc" }],
    }),
    prisma.calendarSubscription.findMany({
      where: { calendarId: cal.id, status: "pending" },
      orderBy: { subscribedAt: "asc" },
      include: {
        user: {
          select: { nickname: true, displayName: true, avatarUrl: true },
        },
        tier: { select: { name: true, price: true } },
      },
    }),
  ]);

  const NOTICE_MESSAGES: Record<string, string> = {
    "tier-created": "メンバーシッププランを作成しました。",
    "tier-updated": "メンバーシッププランを更新しました。",
    "tier-deactivated": "メンバーシッププランを無効化しました。",
    "subscription-approved": "購読リクエストを承認しました。",
    "subscription-rejected": "購読リクエストを却下しました。",
  };
  const noticeText = notice ? NOTICE_MESSAGES[notice] : undefined;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <p className="text-xs text-muted-foreground">
        <Link href={`/calendar/${cal.slug}`} className="text-link hover:underline">
          ← {cal.name}
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-bold">イベントを管理</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        このカレンダーに含めるイベントを追加・削除できます。
      </p>

      {error && (
        <div
          role="alert"
          data-testid="calendar-manage-error"
          className="mt-6 rounded-md border border-status-full-bg bg-status-full-bg/20 px-4 py-3 text-sm text-status-full-fg"
        >
          <strong className="font-semibold">エラー:</strong> {message || error}
        </div>
      )}

      {noticeText && (
        <div
          role="status"
          data-testid="calendar-manage-notice"
          className="mt-6 rounded-md border border-border bg-surface px-4 py-3 text-sm text-foreground"
        >
          {noticeText}
        </div>
      )}

      {/* 追加フォーム */}
      <section className="mt-6 rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-bold">イベントを追加</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          イベントID (URL `/event/&lt;ID&gt;` の数字) を入力してください。
        </p>
        <form
          action={addEventToCalendar}
          method="post"
          className="mt-4 flex flex-wrap items-end gap-3"
          data-testid="calendar-add-event-form"
        >
          <input type="hidden" name="slug" value={cal.slug} />
          <div>
            <label
              htmlFor="eventId"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              イベントID
            </label>
            <input
              id="eventId"
              name="eventId"
              type="text"
              required
              pattern="\d+"
              className="block w-48 rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
            />
          </div>
          <button
            type="submit"
            data-testid="calendar-add-event-submit"
            className="inline-flex h-10 items-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white shadow hover:bg-brand-orange-hover"
          >
            追加
          </button>
        </form>
      </section>

      {/* 一覧 */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold">
          含まれるイベント ({items.length})
        </h2>
        {items.length === 0 ? (
          <p className="rounded-md border border-border bg-surface p-6 text-sm text-muted-foreground">
            まだ追加されたイベントはありません。
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border bg-surface">
            {items.map((ce) => (
              <li
                key={ce.event.id.toString()}
                className="flex items-center gap-4 p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    {formatEventDateShort(ce.event.startedAt.toISOString())} ・{" "}
                    {ce.event.group.name}
                  </p>
                  <Link
                    href={`/event/${ce.event.id.toString()}`}
                    className="line-clamp-1 text-sm font-semibold text-foreground hover:text-link"
                  >
                    {ce.event.title}
                  </Link>
                </div>
                <form action={removeEventFromCalendar} method="post">
                  <input type="hidden" name="slug" value={cal.slug} />
                  <input
                    type="hidden"
                    name="eventId"
                    value={ce.event.id.toString()}
                  />
                  <button
                    type="submit"
                    data-testid={`calendar-remove-event-${ce.event.id.toString()}`}
                    className="inline-flex h-9 items-center rounded-md border border-border bg-white px-3 text-sm text-status-cancelled-fg hover:bg-zinc-50"
                  >
                    削除
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ============ 承認待ちの購読リクエスト ============ */}
      <section className="mt-8" data-testid="calendar-pending-subs-section">
        <h2 className="mb-3 text-lg font-bold">
          承認待ちの購読リクエスト ({pendingSubs.length})
        </h2>
        {pendingSubs.length === 0 ? (
          <p
            data-testid="calendar-pending-subs-empty"
            className="rounded-md border border-border bg-surface p-6 text-sm text-muted-foreground"
          >
            承認待ちのリクエストはありません。
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border bg-surface">
            {pendingSubs.map((sub) => (
              <li
                key={sub.id.toString()}
                data-testid={`calendar-pending-sub-${sub.user.nickname}`}
                className="flex flex-wrap items-center gap-4 p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {sub.user.displayName}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      @{sub.user.nickname}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    プラン: {sub.tier?.name ?? "(不明)"}
                    {sub.tier && sub.tier.price > 0
                      ? ` (¥${formatNumber(sub.tier.price)}/月)`
                      : ""}{" "}
                    ・ 申請日: {formatEventDateShort(sub.subscribedAt.toISOString())}
                  </p>
                </div>
                <form action={approveSubscriptionForm} method="post">
                  <input type="hidden" name="slug" value={cal.slug} />
                  <input
                    type="hidden"
                    name="subscriptionId"
                    value={sub.id.toString()}
                  />
                  <button
                    type="submit"
                    data-testid={`calendar-approve-sub-${sub.user.nickname}`}
                    className="inline-flex h-9 items-center rounded-md bg-brand-orange px-3 text-sm font-semibold text-white shadow hover:bg-brand-orange-hover"
                  >
                    承認
                  </button>
                </form>
                <form action={rejectSubscriptionForm} method="post">
                  <input type="hidden" name="slug" value={cal.slug} />
                  <input
                    type="hidden"
                    name="subscriptionId"
                    value={sub.id.toString()}
                  />
                  <button
                    type="submit"
                    data-testid={`calendar-reject-sub-${sub.user.nickname}`}
                    className="inline-flex h-9 items-center rounded-md border border-border bg-white px-3 text-sm text-status-cancelled-fg hover:bg-zinc-50"
                  >
                    却下
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ============ メンバーシップ プラン (tier) 管理 ============ */}
      <section className="mt-8" data-testid="calendar-tiers-manage-section">
        <h2 className="mb-3 text-lg font-bold">
          メンバーシップ プラン ({tiers.length})
        </h2>

        {/* 作成フォーム */}
        <div className="rounded-lg border border-border bg-surface p-6">
          <h3 className="text-base font-bold">プランを作成</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            有料 (月額 JPY) または承認制の購読プランを追加できます。価格 0 +
            承認制なしのプランは通常の無料購読と同じ扱いです。
          </p>
          <form
            action={createTierForm}
            method="post"
            className="mt-4 flex flex-wrap items-end gap-3"
            data-testid="calendar-tier-create-form"
          >
            <input type="hidden" name="calendarId" value={cal.id.toString()} />
            <div>
              <label
                htmlFor="tier-name"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                プラン名
              </label>
              <input
                id="tier-name"
                name="name"
                type="text"
                required
                maxLength={120}
                data-testid="calendar-tier-name-input"
                className="block w-48 rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="tier-price"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                月額 (JPY)
              </label>
              <input
                id="tier-price"
                name="price"
                type="text"
                inputMode="numeric"
                pattern="\d*"
                defaultValue="0"
                data-testid="calendar-tier-price-input"
                className="block w-28 rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="tier-description"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                説明 (任意)
              </label>
              <input
                id="tier-description"
                name="description"
                type="text"
                maxLength={2000}
                data-testid="calendar-tier-description-input"
                className="block w-64 rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
              />
            </div>
            <label className="flex h-10 items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                name="approvalRequired"
                data-testid="calendar-tier-approval-checkbox"
                className="h-4 w-4 rounded border-border"
              />
              承認制にする
            </label>
            <button
              type="submit"
              data-testid="calendar-tier-create-submit"
              className="inline-flex h-10 items-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white shadow hover:bg-brand-orange-hover"
            >
              プランを追加
            </button>
          </form>
        </div>

        {/* 一覧 + 編集 / 無効化 */}
        {tiers.length === 0 ? (
          <p
            data-testid="calendar-tiers-empty"
            className="mt-4 rounded-md border border-border bg-surface p-6 text-sm text-muted-foreground"
          >
            まだプランはありません。プランが無いカレンダーは従来どおり無料購読のみです。
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-md border border-border bg-surface">
            {tiers.map((tier) => (
              <li
                key={tier.id.toString()}
                data-testid={`calendar-tier-row-${tier.id.toString()}`}
                className="flex flex-wrap items-end gap-3 p-4"
              >
                <form
                  action={updateTierForm}
                  method="post"
                  className="flex flex-wrap items-end gap-3"
                >
                  <input type="hidden" name="tierId" value={tier.id.toString()} />
                  <div>
                    <label
                      htmlFor={`tier-name-${tier.id.toString()}`}
                      className="mb-1 block text-xs font-medium text-muted-foreground"
                    >
                      プラン名
                    </label>
                    <input
                      id={`tier-name-${tier.id.toString()}`}
                      name="name"
                      type="text"
                      defaultValue={tier.name}
                      maxLength={120}
                      className="block w-40 rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`tier-price-${tier.id.toString()}`}
                      className="mb-1 block text-xs font-medium text-muted-foreground"
                    >
                      月額 (JPY)
                    </label>
                    <input
                      id={`tier-price-${tier.id.toString()}`}
                      name="price"
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      defaultValue={String(tier.price)}
                      className="block w-24 rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
                    />
                  </div>
                  <label className="flex h-10 items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      name="approvalRequired"
                      defaultChecked={tier.approvalRequired}
                      className="h-4 w-4 rounded border-border"
                    />
                    承認制
                  </label>
                  <button
                    type="submit"
                    data-testid={`calendar-tier-update-${tier.id.toString()}`}
                    className="inline-flex h-9 items-center rounded-md border border-border bg-white px-3 text-sm text-foreground hover:bg-zinc-50"
                  >
                    更新
                  </button>
                </form>
                <div className="flex items-center gap-2">
                  {!tier.active && (
                    <span
                      data-testid={`calendar-tier-inactive-badge-${tier.id.toString()}`}
                      className="rounded bg-status-ended-bg px-2 py-0.5 text-xs text-status-ended-fg"
                    >
                      無効
                    </span>
                  )}
                  {tier.active && (
                    <form action={deactivateTierForm} method="post">
                      <input
                        type="hidden"
                        name="tierId"
                        value={tier.id.toString()}
                      />
                      <button
                        type="submit"
                        data-testid={`calendar-tier-deactivate-${tier.id.toString()}`}
                        className="inline-flex h-9 items-center rounded-md border border-border bg-white px-3 text-sm text-status-cancelled-fg hover:bg-zinc-50"
                      >
                        無効化
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
