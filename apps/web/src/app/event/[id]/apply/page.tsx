/**
 * イベント参加申込ページ (アンケート / 販売期間 / 招待コード / 寄付)
 *
 * - Survey (trigger=on_apply) が存在する場合に表示する
 * - 加えて、参加枠が以下のいずれかに該当する場合も (Survey が無くても) 表示する:
 *   - 販売期間 (saleStartsAt/saleEndsAt) の期間外 → 「販売期間外」表示 + 申込不可
 *   - 招待コード限定 (unlockCode) → コード入力欄 (URL `?unlock=` で事前入力可)
 *   - 寄付型 (pricingType=donation) → 寄付額入力欄 (最低 donationMinAmount、推奨 price)
 * - どちらにも該当しない場合は /event/{id} へリダイレクト (従来の join フォームへ誘導)
 * - 質問タイプ: text / textarea / single / multi / scale
 * - 送信は submitSurveyAndJoin Server Action
 *   (寄付型 × Stripe 有効時のみ joinPaidEvent (P1 所有) に委譲。
 *    couponCode / donationAmount はフォームフィールドとして渡す契約)
 * - eventRoleId は ?eventRoleId=xxx で受け取る (なければ最初の枠)
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { submitSurveyAndJoin } from "@/app/actions/survey-actions";
import { joinPaidEvent } from "@/app/actions/payment-actions";
import { isStripeEnabled } from "@/lib/stripe";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    eventRoleId?: string;
    error?: string;
    unlock?: string;
    coupon?: string;
  }>;
};

type ParsedOptions =
  | { kind: "list"; values: string[] }
  | { kind: "scale"; min: number; max: number }
  | { kind: "none" };

function parseOptions(inputType: string, raw: string | null): ParsedOptions {
  if (inputType === "text" || inputType === "textarea") return { kind: "none" };
  if (!raw) {
    if (inputType === "scale") return { kind: "scale", min: 1, max: 5 };
    return { kind: "list", values: [] };
  }
  try {
    const parsed = JSON.parse(raw);
    if (inputType === "scale") {
      const min = typeof parsed?.min === "number" ? parsed.min : 1;
      const max = typeof parsed?.max === "number" ? parsed.max : 5;
      return { kind: "scale", min, max };
    }
    if (Array.isArray(parsed)) {
      return { kind: "list", values: parsed.map((v) => String(v)) };
    }
  } catch {
    // ignore
  }
  return { kind: "list", values: [] };
}

export default async function EventApplyPage({
  params,
  searchParams,
}: PageProps) {
  const { id: raw } = await params;
  if (!/^\d+$/.test(raw)) notFound();
  const eventId = BigInt(raw);
  const sp = await searchParams;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/event/${raw}/apply`)}`);
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      roles: { orderBy: { displayOrder: "asc" } },
      surveys: {
        include: { questions: { orderBy: { displayOrder: "asc" } } },
        where: { trigger: "on_apply" },
      },
    },
  });
  if (!event) notFound();

  const survey = event.surveys[0];
  const hasSurveyQuestions = !!survey && survey.questions.length > 0;

  // eventRoleId を解決 (queryparam か先頭枠)
  const roleParam = sp.eventRoleId;
  const role =
    (roleParam && /^\d+$/.test(roleParam)
      ? event.roles.find((r) => r.id.toString() === roleParam)
      : null) ?? event.roles[0];
  if (!role) {
    redirect(`/event/${raw}`);
  }

  // ============ 参加枠ゲート (販売期間 / 招待コード / 寄付) ============
  const now = new Date();
  const saleNotStarted = !!role.saleStartsAt && now < role.saleStartsAt;
  const saleEnded = !!role.saleEndsAt && now > role.saleEndsAt;
  const saleClosed = saleNotStarted || saleEnded;
  const needsUnlockCode = !!role.unlockCode;
  const isDonation = role.pricingType === "donation";
  const roleHasGate = saleClosed || needsUnlockCode || isDonation;

  // Survey が無く、枠にゲート要素も無い場合は通常の申込フローに戻す (従来挙動)
  if (!hasSurveyQuestions && !roleHasGate) {
    redirect(`/event/${raw}`);
  }

  const questions = survey?.questions ?? [];
  const donationMin = role.donationMinAmount ?? 0;
  const donationDefault =
    role.price > donationMin ? role.price : donationMin;

  // 寄付型 × Stripe 有効時は P1 の決済アクション (joinPaidEvent) に委譲。
  // couponCode / donationAmount はフォームフィールドとして渡す (契約)。
  // それ以外 (on_site 相当) は submitSurveyAndJoin で金額記録のみ行う。
  const formAction =
    isDonation && isStripeEnabled() ? joinPaidEvent : submitSurveyAndJoin;

  const fmtDateTime = (d: Date) =>
    d.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <nav className="mb-3 text-sm text-muted-foreground">
        <Link href={`/event/${raw}`} className="hover:underline">
          ← イベントに戻る
        </Link>
      </nav>
      <h1 className="text-2xl font-bold">参加申込</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {event.title} / 参加枠: <strong>{role.name}</strong>
      </p>

      {sp.error === "required" && (
        <div
          role="alert"
          data-testid="apply-form-error"
          className="mt-4 rounded-md border border-status-full-bg bg-status-full-bg/20 px-4 py-3 text-sm text-status-full-fg"
        >
          必須項目に未回答があります。下記の質問を確認してください。
        </div>
      )}

      {sp.error === "unlock" && (
        <div
          role="alert"
          data-testid="apply-unlock-error"
          className="mt-4 rounded-md border border-status-full-bg bg-status-full-bg/20 px-4 py-3 text-sm text-status-full-fg"
        >
          招待コードが一致しません。正しい招待コードを入力してください。
        </div>
      )}

      {sp.error === "donation" && (
        <div
          role="alert"
          data-testid="apply-donation-error"
          className="mt-4 rounded-md border border-status-full-bg bg-status-full-bg/20 px-4 py-3 text-sm text-status-full-fg"
        >
          寄付金額が不正です。最低 {donationMin.toLocaleString("ja-JP")}{" "}
          円以上の整数で入力してください。
        </div>
      )}

      {saleClosed && (
        <div
          role="alert"
          data-testid="apply-sale-closed"
          className="mt-4 rounded-md border border-status-full-bg bg-status-full-bg/20 px-4 py-3 text-sm text-status-full-fg"
        >
          この参加枠は販売期間外のため、現在申込できません。
          {saleNotStarted && role.saleStartsAt && (
            <span className="mt-1 block">
              販売開始: {fmtDateTime(role.saleStartsAt)}
            </span>
          )}
          {saleEnded && role.saleEndsAt && (
            <span className="mt-1 block">
              販売終了: {fmtDateTime(role.saleEndsAt)} (終了済み)
            </span>
          )}
        </div>
      )}

      <form
        action={formAction}
        method="post"
        className="mt-6 space-y-6 rounded-lg border border-border bg-surface p-6"
        data-testid="apply-form"
      >
        <input type="hidden" name="eventId" value={eventId.toString()} />
        <input type="hidden" name="eventRoleId" value={role.id.toString()} />
        {/* クーポンコード: P1 (決済) の契約に基づく passthrough フィールド。
            URL `?coupon=` で受け取った値をそのまま決済アクションに渡す。 */}
        <input
          type="hidden"
          name="couponCode"
          value={(sp.coupon ?? "").slice(0, 64)}
        />

        {/* ============ 招待コード限定枠 ============ */}
        {needsUnlockCode && (
          <div className="flex flex-col gap-2" data-testid="apply-unlock-field">
            <label
              htmlFor="unlockCode"
              className="text-sm font-medium text-foreground"
            >
              招待コード
              <span className="ml-1 text-status-cancelled-fg">*</span>
            </label>
            <input
              id="unlockCode"
              name="unlockCode"
              type="text"
              required
              maxLength={64}
              defaultValue={(sp.unlock ?? "").slice(0, 64)}
              placeholder="主催者から共有されたコードを入力"
              data-testid="apply-unlock-code"
              autoComplete="off"
              className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
            />
            <p className="text-xs text-muted-foreground">
              この参加枠は招待コード限定です。コードが一致しないと申込できません。
            </p>
          </div>
        )}

        {/* ============ 寄付型 (donation) ============ */}
        {isDonation && (
          <div
            className="flex flex-col gap-2"
            data-testid="apply-donation-field"
          >
            <label
              htmlFor="donationAmount"
              className="text-sm font-medium text-foreground"
            >
              寄付金額 (円)
              <span className="ml-1 text-status-cancelled-fg">*</span>
            </label>
            <input
              id="donationAmount"
              name="donationAmount"
              type="number"
              required
              min={donationMin}
              max={10_000_000}
              step={1}
              defaultValue={donationDefault}
              data-testid="apply-donation-amount"
              className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
            />
            <p className="text-xs text-muted-foreground">
              最低 {donationMin.toLocaleString("ja-JP")} 円
              {role.price > 0 && (
                <> / 推奨 {role.price.toLocaleString("ja-JP")} 円</>
              )}
              。この枠は寄付型です。任意の金額で参加できます。
            </p>
          </div>
        )}

        {hasSurveyQuestions && (
          <p className="text-sm text-muted-foreground">
            主催者からのアンケートにお答えください。
          </p>
        )}

        <ul className="flex flex-col gap-6">
          {questions.map((q) => {
            const opts = parseOptions(q.inputType, q.options);
            const qIdStr = q.id.toString();
            const fieldName = `answer-${qIdStr}`;
            return (
              <li
                key={qIdStr}
                className="flex flex-col gap-2"
                data-testid={`question-${qIdStr}`}
              >
                <label
                  htmlFor={`q-${qIdStr}`}
                  className="text-sm font-medium text-foreground"
                >
                  {q.body}
                  {q.required && (
                    <span className="ml-1 text-status-cancelled-fg">*</span>
                  )}
                </label>

                {q.inputType === "text" && (
                  <input
                    id={`q-${qIdStr}`}
                    name={fieldName}
                    type="text"
                    required={q.required}
                    maxLength={1000}
                    className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
                  />
                )}

                {q.inputType === "textarea" && (
                  <textarea
                    id={`q-${qIdStr}`}
                    name={fieldName}
                    required={q.required}
                    rows={4}
                    maxLength={5000}
                    className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
                  />
                )}

                {q.inputType === "single" && opts.kind === "list" && (
                  <fieldset
                    id={`q-${qIdStr}`}
                    className="flex flex-col gap-1.5 rounded-md border border-border bg-white p-3"
                  >
                    {opts.values.length === 0 ? (
                      <p className="text-xs text-muted-foreground">選択肢がありません</p>
                    ) : (
                      opts.values.map((opt, i) => (
                        <label
                          key={`${qIdStr}-${i}`}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="radio"
                            name={fieldName}
                            value={opt}
                            required={q.required && i === 0}
                          />
                          <span>{opt}</span>
                        </label>
                      ))
                    )}
                  </fieldset>
                )}

                {q.inputType === "multi" && opts.kind === "list" && (
                  <fieldset
                    id={`q-${qIdStr}`}
                    className="flex flex-col gap-1.5 rounded-md border border-border bg-white p-3"
                  >
                    {opts.values.length === 0 ? (
                      <p className="text-xs text-muted-foreground">選択肢がありません</p>
                    ) : (
                      opts.values.map((opt, i) => (
                        <label
                          key={`${qIdStr}-${i}`}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            name={`${fieldName}[]`}
                            value={opt}
                          />
                          <span>{opt}</span>
                        </label>
                      ))
                    )}
                  </fieldset>
                )}

                {q.inputType === "scale" && opts.kind === "scale" && (
                  <div
                    id={`q-${qIdStr}`}
                    className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-white p-3"
                  >
                    {Array.from(
                      { length: opts.max - opts.min + 1 },
                      (_, i) => opts.min + i,
                    ).map((v, i) => (
                      <label
                        key={v}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-brand-orange-soft"
                      >
                        <input
                          type="radio"
                          name={fieldName}
                          value={String(v)}
                          required={q.required && i === 0}
                        />
                        <span>{v}</span>
                      </label>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Link
            href={`/event/${raw}`}
            className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-brand-orange-soft"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            data-testid="apply-submit"
            disabled={saleClosed}
            aria-disabled={saleClosed}
            className={
              saleClosed
                ? "inline-flex h-10 items-center rounded-md bg-border-strong px-5 text-sm font-semibold text-muted-foreground"
                : "inline-flex h-10 items-center rounded-md bg-brand-orange px-5 text-sm font-semibold text-white shadow hover:bg-brand-orange-hover"
            }
          >
            {saleClosed
              ? "販売期間外"
              : hasSurveyQuestions
                ? "回答して申込"
                : "申込する"}
          </button>
        </div>
      </form>
    </div>
  );
}
