/**
 * 主催者向け アンケート回答一覧 (owner / group admin 限定)
 *
 * - 各質問ごとの回答を集計表示
 *   - single/multi: 選択肢ごとの分布 (棒グラフ風)
 *   - scale: 平均値 + 分布
 *   - text/textarea: 回答一覧 (ユーザー名 + 本文)
 * - CSV エクスポート (a 要素から data: URL でダウンロード)
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
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

function parseAnswer(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/** CSV 用のエスケープ (RFC 4180) */
function csvEscape(s: string): string {
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export default async function EventAdminSurveyPage({ params }: PageProps) {
  const { id: raw } = await params;
  if (!/^\d+$/.test(raw)) notFound();
  const eventId = BigInt(raw);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/event/${raw}/admin/survey`)}`);
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { group: true },
  });
  if (!event) notFound();

  // 権限チェック
  const isOwner = event.ownerId === user.id;
  const admin = await prisma.groupAdmin.findUnique({
    where: { groupId_userId: { groupId: event.groupId, userId: user.id } },
  });
  const isAdmin =
    !!admin && (admin.role === "owner" || admin.role === "admin");
  if (!isOwner && !isAdmin) notFound();

  const survey = await prisma.survey.findFirst({
    where: { eventId, trigger: "on_apply" },
    include: {
      questions: {
        orderBy: { displayOrder: "asc" },
        include: {
          answers: {
            include: {
              participant: { include: { user: true } },
            },
          },
        },
      },
    },
  });

  // 集計用に「全回答者 (参加者) リスト」も取得しておく (CSV 一覧用)
  const participants = await prisma.participant.findMany({
    where: { eventId },
    include: {
      user: true,
      surveyAnswers: { include: { question: true } },
    },
    orderBy: { appliedAt: "asc" },
  });

  // ============ CSV データを構築 ============
  // ヘッダ: 申込日時, ユーザー, 枠ID, ステータス, [質問1], [質問2], ...
  const questions = survey?.questions ?? [];
  const csvHeader = [
    "appliedAt",
    "userId",
    "userNickname",
    "userDisplayName",
    "eventRoleId",
    "status",
    ...questions.map((q) => q.body),
  ].map(csvEscape).join(",");
  const csvRows = participants.map((p) => {
    const answerByQuestionId = new Map<string, string>();
    for (const a of p.surveyAnswers) {
      const parsed = parseAnswer(a.answerValue);
      const text = Array.isArray(parsed) ? parsed.join(" | ") : String(parsed ?? "");
      answerByQuestionId.set(a.surveyQuestionId.toString(), text);
    }
    return [
      p.appliedAt.toISOString(),
      p.userId.toString(),
      p.user.nickname,
      p.user.displayName,
      p.eventRoleId.toString(),
      p.status,
      ...questions.map((q) => answerByQuestionId.get(q.id.toString()) ?? ""),
    ].map((v) => csvEscape(v)).join(",");
  });
  const csv = [csvHeader, ...csvRows].join("\r\n");
  const csvDataUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;

  return (
    <div data-testid="admin-survey-panel">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">アンケート回答</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            回答の集計とエクスポート。
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={csvDataUrl}
            download={`event-${raw}-survey.csv`}
            data-testid="survey-csv-export"
            className="inline-flex h-10 items-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white hover:bg-brand-orange-hover"
          >
            CSV エクスポート
          </a>
        </div>
      </header>

      {!survey || survey.questions.length === 0 ? (
        <div className="mt-8 rounded-md border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
          まだアンケート質問が設定されていません。
          <p className="mt-3">
            <Link
              href={`/event/${raw}/edit`}
              className="text-link hover:underline"
            >
              イベント編集画面で質問を追加 →
            </Link>
          </p>
        </div>
      ) : (
        <section
          className="mt-6 space-y-6"
          data-testid="survey-results"
        >
          {survey.questions.map((q) => {
            const opts = parseOptions(q.inputType, q.options);
            const answers = q.answers;
            return (
              <article
                key={q.id.toString()}
                className="rounded-md border border-border bg-surface p-5"
                data-testid={`survey-question-${q.id.toString()}`}
              >
                <header className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-foreground">
                    Q{q.displayOrder}. {q.body}
                    {q.required && (
                      <span className="ml-1 text-status-cancelled-fg">*</span>
                    )}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {q.inputType} ・ 回答 {answers.length} 件
                  </span>
                </header>

                {(q.inputType === "single" ||
                  q.inputType === "multi") &&
                  opts.kind === "list" && (
                    <DistributionView
                      options={opts.values}
                      answers={answers.map((a) => a.answerValue)}
                      multi={q.inputType === "multi"}
                    />
                  )}

                {q.inputType === "scale" && opts.kind === "scale" && (
                  <ScaleView
                    min={opts.min}
                    max={opts.max}
                    answers={answers.map((a) => a.answerValue)}
                  />
                )}

                {(q.inputType === "text" || q.inputType === "textarea") && (
                  <ul className="flex flex-col gap-2">
                    {answers.length === 0 ? (
                      <li className="text-sm text-muted-foreground">
                        回答はまだありません。
                      </li>
                    ) : (
                      answers.map((a) => {
                        const parsed = parseAnswer(a.answerValue);
                        const text =
                          typeof parsed === "string"
                            ? parsed
                            : JSON.stringify(parsed);
                        return (
                          <li
                            key={a.id.toString()}
                            className="rounded border border-border bg-white px-3 py-2 text-sm"
                          >
                            <p className="text-xs text-muted-foreground">
                              {a.participant.user.displayName} (@
                              {a.participant.user.nickname})
                            </p>
                            <p className="mt-1 whitespace-pre-wrap">{text}</p>
                          </li>
                        );
                      })
                    )}
                  </ul>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

function DistributionView({
  options,
  answers,
  multi,
}: {
  options: string[];
  answers: string[];
  multi: boolean;
}) {
  // 集計
  const counts = new Map<string, number>();
  for (const opt of options) counts.set(opt, 0);
  let total = 0;
  for (const raw of answers) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }
    if (multi && Array.isArray(parsed)) {
      for (const v of parsed) {
        const s = String(v);
        counts.set(s, (counts.get(s) ?? 0) + 1);
      }
      if (parsed.length > 0) total++;
    } else {
      const s = String(parsed);
      counts.set(s, (counts.get(s) ?? 0) + 1);
      total++;
    }
  }
  const maxCount = Math.max(1, ...Array.from(counts.values()));
  return (
    <ul className="flex flex-col gap-1.5">
      {options.map((opt) => {
        const c = counts.get(opt) ?? 0;
        const ratio = total > 0 ? Math.round((c / total) * 100) : 0;
        return (
          <li key={opt} className="text-sm">
            <div className="flex items-center justify-between">
              <span>{opt}</span>
              <span className="text-muted-foreground">
                {c} 件 ({ratio}%)
              </span>
            </div>
            <div
              className="mt-1 h-2 w-full overflow-hidden rounded bg-border"
              aria-hidden="true"
            >
              <div
                className="h-full bg-brand-orange"
                style={{ width: `${(c / maxCount) * 100}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ScaleView({
  min,
  max,
  answers,
}: {
  min: number;
  max: number;
  answers: string[];
}) {
  const nums: number[] = [];
  for (const raw of answers) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }
    const n = Number(typeof parsed === "string" ? parsed : parsed);
    if (Number.isFinite(n)) nums.push(n);
  }
  const avg =
    nums.length === 0
      ? null
      : Math.round((nums.reduce((s, v) => s + v, 0) / nums.length) * 10) / 10;
  // 分布
  const counts = new Map<number, number>();
  for (let v = min; v <= max; v++) counts.set(v, 0);
  for (const n of nums) {
    if (counts.has(n)) counts.set(n, (counts.get(n) ?? 0) + 1);
  }
  const maxCount = Math.max(1, ...Array.from(counts.values()));
  return (
    <div>
      <p className="mb-2 text-sm">
        平均: <strong>{avg ?? "—"}</strong> / {min}-{max} (回答 {nums.length} 件)
      </p>
      <ul className="flex flex-col gap-1.5">
        {Array.from(counts.entries()).map(([v, c]) => {
          const ratio = nums.length > 0 ? Math.round((c / nums.length) * 100) : 0;
          return (
            <li key={v} className="text-sm">
              <div className="flex items-center justify-between">
                <span>{v}</span>
                <span className="text-muted-foreground">
                  {c} 件 ({ratio}%)
                </span>
              </div>
              <div
                className="mt-1 h-2 w-full overflow-hidden rounded bg-border"
                aria-hidden="true"
              >
                <div
                  className="h-full bg-brand-orange"
                  style={{ width: `${(c / maxCount) * 100}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
