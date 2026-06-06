/**
 * イベント参加申込ページ (アンケート付き)
 *
 * - Survey (trigger=on_apply) が存在する場合のみ表示する
 *   存在しない場合は /event/{id} へリダイレクト (従来の join フォームへ誘導)
 * - 質問タイプ: text / textarea / single / multi / scale
 * - 送信は submitSurveyAndJoin Server Action
 * - eventRoleId は ?eventRoleId=xxx で受け取る (なければ最初の枠)
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { submitSurveyAndJoin } from "@/app/actions/survey-actions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ eventRoleId?: string; error?: string }>;
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
  // Survey が無い場合は通常の申込ページに戻す
  if (!survey || survey.questions.length === 0) {
    redirect(`/event/${raw}`);
  }

  // eventRoleId を解決 (queryparam か先頭枠)
  const roleParam = sp.eventRoleId;
  const role =
    (roleParam && /^\d+$/.test(roleParam)
      ? event.roles.find((r) => r.id.toString() === roleParam)
      : null) ?? event.roles[0];
  if (!role) {
    redirect(`/event/${raw}`);
  }

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

      <form
        action={submitSurveyAndJoin}
        method="post"
        className="mt-6 space-y-6 rounded-lg border border-border bg-surface p-6"
        data-testid="apply-form"
      >
        <input type="hidden" name="eventId" value={eventId.toString()} />
        <input type="hidden" name="eventRoleId" value={role.id.toString()} />

        <p className="text-sm text-muted-foreground">
          主催者からのアンケートにお答えください。
        </p>

        <ul className="flex flex-col gap-6">
          {survey.questions.map((q) => {
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
            className="inline-flex h-10 items-center rounded-md bg-brand-orange px-5 text-sm font-semibold text-white shadow hover:bg-brand-orange-hover"
          >
            回答して申込
          </button>
        </div>
      </form>
    </div>
  );
}
