/**
 * /admin/component-feedback — コンポーネントフィードバックの集計・トリアージ画面。
 *
 * Storybook (Gallery / Docs) の HTML フォームから投稿された各コンポーネントへの
 * 評価 (1-5) + コメントを、コンポーネント別サマリ + 個別一覧で確認し、状態を更新して
 * デザインシステムの改善に回す (DS 改善ループ)。
 *
 * 認可: role=admin or role=organizer のみ。それ以外は 403。
 */
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { renderMarkdown } from "@tech-event/shared-util-markdown";

import { updateFeedbackStatus } from "./actions";
import { isFeedbackAdmin } from "./_auth";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS = ["open", "triaged", "resolved", "wontfix"] as const;

function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span aria-label={`${value.toFixed(1)} / 5`} title={`${value.toFixed(1)} / 5`}>
      <span style={{ color: "#f59e0b" }}>{"★".repeat(full)}</span>
      <span className="text-muted-foreground">{"★".repeat(5 - full)}</span>
    </span>
  );
}

export default async function ComponentFeedbackAdminPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/admin/component-feedback");
  }
  if (!isFeedbackAdmin(user)) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">403 — 権限がありません</h1>
        <p className="mt-3 text-muted-foreground">
          このページは管理者 (環境変数 <code>COMPONENT_FEEDBACK_ADMINS</code> の
          allowlist) のみ閲覧できます。
        </p>
      </div>
    );
  }

  // コンポーネント別サマリ (件数 / 平均評価 / open 件数)
  const grouped = await prisma.componentFeedback.groupBy({
    by: ["component"],
    _count: { _all: true },
    _avg: { rating: true },
    orderBy: { _count: { component: "desc" } },
  });
  const openCounts = await prisma.componentFeedback.groupBy({
    by: ["component"],
    where: { status: "open" },
    _count: { _all: true },
  });
  const openByComponent = new Map(
    openCounts.map((o) => [o.component, o._count._all]),
  );

  // 個別一覧 (最新 200 件)
  const recent = await prisma.componentFeedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { nickname: true } } },
  });

  const total = grouped.reduce((s, g) => s + g._count._all, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          コンポーネントフィードバック
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Storybook から投稿された {total} 件のフィードバックを集計・トリアージします。
          投稿は{" "}
          <code className="rounded bg-surface-muted px-1">/api/component-feedback</code>{" "}
          経由で保存されます。
        </p>
      </header>

      {/* ===== コンポーネント別サマリ ===== */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-bold text-foreground">
          コンポーネント別サマリ
        </h2>
        {grouped.length === 0 ? (
          <p className="rounded-md border border-border bg-surface p-6 text-sm text-muted-foreground">
            まだフィードバックがありません。Storybook の{" "}
            <strong>Design System / Gallery</strong> から投稿できます。
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-semibold">コンポーネント</th>
                  <th className="px-4 py-2 font-semibold">件数</th>
                  <th className="px-4 py-2 font-semibold">平均評価</th>
                  <th className="px-4 py-2 font-semibold">未対応 (open)</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((g) => (
                  <tr key={g.component} className="border-t border-border">
                    <td className="px-4 py-2 font-medium text-foreground">
                      {g.component}
                    </td>
                    <td className="px-4 py-2">{g._count._all}</td>
                    <td className="px-4 py-2">
                      <Stars value={g._avg.rating ?? 0} />{" "}
                      <span className="text-muted-foreground">
                        {(g._avg.rating ?? 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {openByComponent.get(g.component) ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ===== 個別一覧 ===== */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-foreground">
          個別フィードバック (最新 {recent.length} 件)
        </h2>
        <ul className="space-y-3">
          {recent.map((f) => (
            <li
              key={f.id.toString()}
              className="rounded-md border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-semibold text-foreground">{f.component}</span>
                <Stars value={f.rating} />
                <span className="text-xs text-muted-foreground">
                  {f.user?.nickname ?? "匿名"} ·{" "}
                  {f.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC
                </span>
                <StatusBadge status={f.status} />
              </div>

              {f.comment && (
                <div
                  className="prose prose-sm mt-2 max-w-none text-sm text-foreground"
                  // renderMarkdown() で DOMPurify sanitize 済み (CLAUDE.md §7)。
                  // nosemgrep: typescript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml -- renderMarkdown() で DOMPurify sanitize 済みの HTML。
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(f.comment) }}
                />
              )}

              <form action={updateFeedbackStatus} className="mt-3 flex items-center gap-2">
                <input type="hidden" name="id" value={f.id.toString()} />
                <label className="text-xs text-muted-foreground" htmlFor={`st-${f.id}`}>
                  状態
                </label>
                <select
                  id={`st-${f.id}`}
                  name="status"
                  defaultValue={f.status}
                  className="rounded border border-border bg-surface px-2 py-1 text-xs"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded bg-brand-orange px-3 py-1 text-xs font-semibold text-white hover:bg-brand-orange-hover"
                >
                  更新
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-status-open-bg text-status-open-fg",
    triaged: "bg-brand-orange-soft text-brand-orange",
    resolved: "bg-status-open-bg text-status-open-fg",
    wontfix: "bg-surface-muted text-muted-foreground",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${map[status] ?? "bg-surface-muted text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}
