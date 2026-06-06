/**
 * 主催者ダッシュボード Guests タブ
 *
 * - 全参加者をテーブル表示 (アバター/名前/枠/ステータス/申込時刻)
 * - フィルタ: status (確定 / 補欠 / キャンセル / 抽選中)
 * - 検索: nickname / displayName 部分一致 (大文字小文字無視)
 * - 並び替え: 申込時刻 (asc/desc) / 名前 (asc)
 * - 各行: 出席切替 / 枠変更 / 削除 (Server Action)
 * - CSV エクスポート: route handler /admin/guests/export.csv へのリンク
 *
 * URL クエリ (Next.js searchParams) で UI 状態を保持する:
 *   ?status=accepted&q=foo&sort=name&dir=asc
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { toggleParticipantAttendance } from "@/app/actions/checkin-actions";
import {
  removeParticipant,
  updateParticipantRole,
} from "@/app/actions/event-admin-actions";
import {
  approveParticipant,
  rejectParticipant,
} from "@/app/actions/approval-actions";

import DirectMessageButton from "./DirectMessageButton";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const STATUS_FILTERS = [
  { key: "all", label: "すべて" },
  { key: "approval_pending", label: "承認待ち" },
  { key: "accepted", label: "参加確定" },
  { key: "waiting", label: "補欠" },
  { key: "cancelled", label: "キャンセル" },
  { key: "pending", label: "抽選中" },
  { key: "attended", label: "出席" },
] as const;

type StatusKey = (typeof STATUS_FILTERS)[number]["key"];

function readQuery(
  q: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const v = q[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return "";
}

export default async function EventAdminGuestsPage({
  params,
  searchParams,
}: PageProps) {
  const { id: raw } = await params;
  if (!/^\d+$/.test(raw)) notFound();
  const eventId = BigInt(raw);

  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/event/${raw}/admin/guests`)}`,
    );
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      roles: { orderBy: { displayOrder: "asc" } },
    },
  });
  if (!event) notFound();
  const isOwner = event.ownerId === user.id;
  const admin = await prisma.groupAdmin.findUnique({
    where: { groupId_userId: { groupId: event.groupId, userId: user.id } },
  });
  const isAdmin =
    !!admin && (admin.role === "owner" || admin.role === "admin");
  if (!isOwner && !isAdmin) notFound();

  const sp = await searchParams;
  const rawStatus = readQuery(sp, "status");
  const status: StatusKey = (STATUS_FILTERS.some((s) => s.key === rawStatus)
    ? rawStatus
    : "all") as StatusKey;
  const q = readQuery(sp, "q").trim();
  const sort = readQuery(sp, "sort") === "name" ? "name" : "appliedAt";
  const dir = readQuery(sp, "dir") === "desc" ? "desc" : "asc";

  // approval_pending は (status=pending AND approvalStatus=pending) のフィルタ
  const whereStatus =
    status === "all"
      ? undefined
      : status === "approval_pending"
        ? { status: "pending", approvalStatus: "pending" }
        : { status: status as string };

  const allParticipants = await prisma.participant.findMany({
    where: {
      eventId,
      ...whereStatus,
    },
    include: { user: true, eventRole: true },
  });

  // 検索フィルタ (DB 側で SQLite 用に case-insensitive を安定動作させづらいので
  // メモリ上で行う)
  const lowered = q.toLowerCase();
  const filtered = q
    ? allParticipants.filter(
        (p) =>
          p.user.nickname.toLowerCase().includes(lowered) ||
          p.user.displayName.toLowerCase().includes(lowered),
      )
    : allParticipants;

  // 並び替え
  filtered.sort((a, b) => {
    let cmp = 0;
    if (sort === "name") {
      cmp = a.user.displayName.localeCompare(b.user.displayName, "ja");
    } else {
      cmp = a.appliedAt.getTime() - b.appliedAt.getTime();
    }
    return dir === "desc" ? -cmp : cmp;
  });

  const eventIdStr = event.id.toString();

  const buildHref = (overrides: Record<string, string | null>): string => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (q) params.set("q", q);
    if (sort !== "appliedAt") params.set("sort", sort);
    if (dir !== "asc") params.set("dir", dir);
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null) params.delete(k);
      else params.set(k, v);
    }
    const s = params.toString();
    return s
      ? `/event/${eventIdStr}/admin/guests?${s}`
      : `/event/${eventIdStr}/admin/guests`;
  };

  return (
    <div data-testid="admin-panel-guests">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Guests</h2>
        <div className="flex items-center gap-2">
          <a
            href={`/event/${eventIdStr}/admin/guests/export.csv`}
            className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium hover:bg-brand-orange-soft"
            data-testid="admin-guests-csv-button"
            download
          >
            CSV エクスポート
          </a>
          <a
            href={`/event/${eventIdStr}/admin/guests/export.xlsx`}
            className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium hover:bg-brand-orange-soft"
            data-testid="admin-guests-xlsx-button"
            download
          >
            Excel エクスポート
          </a>
        </div>
      </div>

      {/* フィルタ */}
      <nav
        className="mt-4 flex flex-wrap gap-1 border-b border-border"
        data-testid="admin-guests-filter"
        aria-label="ステータスフィルタ"
      >
        {STATUS_FILTERS.map((f) => {
          const active = status === f.key;
          return (
            <Link
              key={f.key}
              href={buildHref({ status: f.key === "all" ? null : f.key })}
              data-testid={`admin-guests-filter-${f.key}`}
              className={cn(
                "border-b-2 px-3 py-2 text-sm font-medium",
                active
                  ? "border-brand-orange text-brand-orange"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      {/* 検索 + 並び替え */}
      <form
        method="get"
        className="mt-4 flex flex-wrap items-center gap-3"
        data-testid="admin-guests-search-form"
      >
        {status !== "all" && (
          <input type="hidden" name="status" value={status} />
        )}
        <label className="flex flex-1 items-center gap-2">
          <span className="text-sm text-muted-foreground">検索</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="名前または nickname"
            className="h-9 flex-1 rounded-md border border-border bg-surface px-3 text-sm"
            data-testid="admin-guests-search-input"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">並び替え</span>
          <select
            name="sort"
            defaultValue={sort}
            className="h-9 rounded-md border border-border bg-surface px-2 text-sm"
            data-testid="admin-guests-sort-select"
          >
            <option value="appliedAt">申込時刻</option>
            <option value="name">名前</option>
          </select>
          <select
            name="dir"
            defaultValue={dir}
            className="h-9 rounded-md border border-border bg-surface px-2 text-sm"
          >
            <option value="asc">昇順</option>
            <option value="desc">降順</option>
          </select>
        </label>
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white hover:bg-brand-orange-hover"
        >
          適用
        </button>
      </form>

      {/* テーブル */}
      <div className="mt-4 overflow-x-auto rounded-md border border-border bg-surface">
        <table className="w-full text-sm" data-testid="admin-guests-table">
          <thead className="border-b border-border bg-background text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">ユーザー</th>
              <th className="px-3 py-2 text-left">枠</th>
              <th className="px-3 py-2 text-left">状態</th>
              <th className="px-3 py-2 text-left">申込日時</th>
              <th className="px-3 py-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  条件に合致する参加者はいません。
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr
                  key={p.id.toString()}
                  className="border-b border-border last:border-0 align-top"
                  data-testid={`admin-guest-row-${p.id.toString()}`}
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      {p.user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.user.avatarUrl}
                          alt=""
                          className="h-8 w-8 rounded-full bg-zinc-100"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-zinc-200" />
                      )}
                      <div>
                        <Link
                          href={`/user/${p.user.nickname}`}
                          className="font-medium text-link hover:underline"
                        >
                          {p.user.displayName}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          @{p.user.nickname}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <form
                      action={updateParticipantRole}
                      className="flex items-center gap-2"
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
                      <select
                        name="eventRoleId"
                        defaultValue={p.eventRoleId.toString()}
                        className="h-8 rounded border border-border bg-surface px-2 text-xs"
                        data-testid={`admin-guest-role-select-${p.id.toString()}`}
                      >
                        {event.roles.map((r) => (
                          <option key={r.id.toString()} value={r.id.toString()}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="inline-flex h-8 items-center rounded border border-border bg-surface px-2 text-xs hover:bg-brand-orange-soft"
                      >
                        変更
                      </button>
                    </form>
                  </td>
                  <td className="px-3 py-3">
                    <StatusPill
                      status={p.status}
                      approvalStatus={p.approvalStatus ?? null}
                    />
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    {p.appliedAt.toLocaleString("ja-JP")}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      {/* 承認制で承認待ちの場合: 承認 / 却下ボタン */}
                      {p.approvalStatus === "pending" &&
                        p.status === "pending" && (
                          <>
                            <form action={approveParticipant}>
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
                              <button
                                type="submit"
                                className="inline-flex h-8 items-center rounded bg-brand-orange px-2 text-xs font-semibold text-white hover:bg-brand-orange-hover"
                                data-testid={`admin-guest-approve-${p.id.toString()}`}
                              >
                                承認
                              </button>
                            </form>
                            <form action={rejectParticipant}>
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
                              <button
                                type="submit"
                                className="inline-flex h-8 items-center rounded border border-border bg-surface px-2 text-xs font-semibold text-status-cancelled-fg hover:bg-status-cancelled-bg/20"
                                data-testid={`admin-guest-reject-${p.id.toString()}`}
                              >
                                却下
                              </button>
                            </form>
                          </>
                        )}
                      {(p.status === "accepted" || p.status === "attended") && (
                        <form action={toggleParticipantAttendance}>
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
                            type="hidden"
                            name="next"
                            value={
                              p.status === "attended" ? "accepted" : "attended"
                            }
                          />
                          <button
                            type="submit"
                            className={cn(
                              "inline-flex h-8 items-center rounded px-2 text-xs",
                              p.status === "attended"
                                ? "border border-border bg-surface hover:bg-brand-orange-soft"
                                : "bg-brand-orange text-white hover:bg-brand-orange-hover",
                            )}
                          >
                            {p.status === "attended"
                              ? "出席取消"
                              : "出席にする"}
                          </button>
                        </form>
                      )}
                      <DirectMessageButton
                        eventId={eventIdStr}
                        participantId={p.id.toString()}
                        recipientName={p.user.displayName}
                      />
                      <form action={removeParticipant}>
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
                        <button
                          type="submit"
                          className="inline-flex h-8 items-center rounded border border-border bg-surface px-2 text-xs text-red-600 hover:bg-red-50"
                          data-testid={`admin-guest-remove-${p.id.toString()}`}
                        >
                          削除
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {filtered.length} 人を表示中 ・ 全 {allParticipants.length} 人
      </p>
    </div>
  );
}

function StatusPill({
  status,
  approvalStatus,
}: {
  status: string;
  approvalStatus?: string | null;
}) {
  const map: Record<string, string> = {
    accepted: "bg-brand-orange-soft text-brand-orange",
    waiting: "bg-zinc-100 text-zinc-700",
    cancelled: "bg-status-cancelled-bg/30 text-status-cancelled-fg",
    attended: "bg-status-ended-bg text-status-ended-fg",
    pending: "bg-zinc-100 text-zinc-700",
    no_show: "bg-status-full-bg/30 text-status-full-fg",
  };
  const label: Record<string, string> = {
    accepted: "参加確定",
    waiting: "補欠",
    cancelled: "キャンセル",
    attended: "出席",
    pending: "保留",
    no_show: "未出席",
  };
  // 承認制の特殊表示
  if (approvalStatus === "pending" && status === "pending") {
    return (
      <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
        承認待ち
      </span>
    );
  }
  if (approvalStatus === "rejected") {
    return (
      <span className="inline-block rounded bg-status-cancelled-bg/30 px-2 py-0.5 text-xs font-medium text-status-cancelled-fg">
        却下
      </span>
    );
  }
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
        map[status] ?? "bg-zinc-100 text-zinc-700"
      }`}
    >
      {label[status] ?? status}
    </span>
  );
}
