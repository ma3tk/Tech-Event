/**
 * イベント作成ページ (Server Component + Server Action)
 *
 * - 未ログインは /login?next=/event/create
 * - 自分が owner/admin のグループのみ select 表示
 * - 参加枠は固定 3 枠まで入力可能 (eventRole[0..2])
 * - status を hidden の "draft" / "published" にして submit ボタンで切り替える
 */

import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createEvent } from "@/app/actions/event-admin-actions";
import MarkdownEditor from "@/components/MarkdownEditorDynamic";

export const dynamic = "force-dynamic";

export default async function EventCreatePage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/event/create")}`);
  }
  const sp = await searchParams;
  const preselectedSubdomain = sp.group;

  // 自分が owner/admin のグループ
  const adminRows = await prisma.groupAdmin.findMany({
    where: { userId: user.id, role: { in: ["owner", "admin"] } },
    include: { group: true },
    orderBy: { addedAt: "asc" },
  });
  const groups = adminRows
    .filter((a) => a.group.status === "active")
    .map((a) => ({
      id: a.group.id.toString(),
      subdomain: a.group.subdomain,
      name: a.group.name,
      role: a.role,
    }));

  // プリセット選択
  const presetGroup = preselectedSubdomain
    ? groups.find((g) => g.subdomain === preselectedSubdomain)
    : undefined;

  const noGroup = groups.length === 0;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">イベントを作成する</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        勉強会・カンファレンス・LT 大会など、新しいイベントを作成します。
      </p>

      {noGroup ? (
        <div className="mt-6 rounded-md border border-border bg-surface p-6 text-sm">
          <p>
            イベントを作成するには、まずグループを作成して管理者になる必要があります。
          </p>
          <Link
            href="/group/create"
            className="mt-4 inline-flex h-10 items-center rounded-md bg-brand-orange px-5 text-sm font-semibold text-white hover:bg-brand-orange-hover"
          >
            グループを作成する
          </Link>
        </div>
      ) : (
        <form
          action={createEvent}
          method="post"
          className="mt-6 space-y-8"
          data-testid="event-create-form"
        >
          <Section title="基本情報">
            <Field label="グループ" htmlFor="groupId" required>
              <select
                id="groupId"
                name="groupId"
                required
                defaultValue={presetGroup?.id ?? groups[0]?.id}
                className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} (@{g.subdomain}) - {g.role === "owner" ? "オーナー" : "管理者"}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="タイトル" htmlFor="title" required>
              <input
                id="title"
                name="title"
                type="text"
                required
                maxLength={200}
                className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
              />
            </Field>

            <Field label="キャッチコピー" htmlFor="catchPhrase">
              <input
                id="catchPhrase"
                name="catchPhrase"
                type="text"
                maxLength={300}
                className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
              />
            </Field>

            <Field
              label="イベント説明 (Markdown)"
              htmlFor="description"
              help="GFM Markdown が利用できます。左で編集、右にライブプレビュー。"
            >
              <MarkdownEditor
                id="description"
                name="description"
                rows={10}
                maxLength={50_000}
                placeholder="## 概要&#10;このイベントは..."
                testIdPrefix="event-description-editor"
              />
            </Field>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field label="カバー画像 URL" htmlFor="coverImageUrl">
                <input
                  id="coverImageUrl"
                  name="coverImageUrl"
                  type="url"
                  maxLength={2000}
                  placeholder="https://..."
                  className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
                />
              </Field>
              <Field label="ハッシュタグ" htmlFor="hashTag" help="# なしで 1 つ">
                <input
                  id="hashTag"
                  name="hashTag"
                  type="text"
                  maxLength={120}
                  placeholder="techevent"
                  className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
                />
              </Field>
            </div>
          </Section>

          <Section title="開催形式・会場">
            <Field label="開催形式" htmlFor="eventFormat" required>
              <select
                id="eventFormat"
                name="eventFormat"
                defaultValue="offline"
                className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
              >
                <option value="offline">オフライン (会場)</option>
                <option value="online">オンライン</option>
                <option value="hybrid">ハイブリッド</option>
              </select>
            </Field>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field label="会場名" htmlFor="place">
                <input
                  id="place"
                  name="place"
                  type="text"
                  maxLength={200}
                  className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
                />
              </Field>
              <Field label="住所" htmlFor="address">
                <input
                  id="address"
                  name="address"
                  type="text"
                  maxLength={300}
                  className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
                />
              </Field>
            </div>
            <Field label="オンライン URL" htmlFor="onlineUrl">
              <input
                id="onlineUrl"
                name="onlineUrl"
                type="url"
                maxLength={2000}
                placeholder="https://zoom.us/..."
                className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
              />
            </Field>
          </Section>

          <Section title="開催日時・募集期間">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field label="開始日時" htmlFor="startedAt" required>
                <input
                  id="startedAt"
                  name="startedAt"
                  type="datetime-local"
                  required
                  className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
                />
              </Field>
              <Field label="終了日時" htmlFor="endedAt" required>
                <input
                  id="endedAt"
                  name="endedAt"
                  type="datetime-local"
                  required
                  className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
                />
              </Field>
              <Field label="募集開始日時" htmlFor="acceptsFrom">
                <input
                  id="acceptsFrom"
                  name="acceptsFrom"
                  type="datetime-local"
                  className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
                />
              </Field>
              <Field label="募集締切日時" htmlFor="acceptsUntil">
                <input
                  id="acceptsUntil"
                  name="acceptsUntil"
                  type="datetime-local"
                  className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
                />
              </Field>
            </div>
          </Section>

          <Section title="募集設定">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field label="全体定員 (任意)" htmlFor="capacity">
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min={0}
                  className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
                />
              </Field>
              <Field label="受付方式" htmlFor="recruitmentMethod">
                <select
                  id="recruitmentMethod"
                  name="recruitmentMethod"
                  defaultValue="fcfs"
                  className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
                >
                  <option value="fcfs">先着順</option>
                  <option value="lottery">抽選</option>
                </select>
              </Field>
            </div>
            <Field
              label="抽選発表日時"
              htmlFor="lotteryAnnounceAt"
              help="抽選の場合のみ。空欄可。"
            >
              <input
                id="lotteryAnnounceAt"
                name="lotteryAnnounceAt"
                type="datetime-local"
                className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
              />
            </Field>
          </Section>

          <Section
            title="参加枠"
            help="最大 3 枠まで設定できます。1 枠目は必須です。"
          >
            <RoleRow index={0} defaultName="一般" defaultPricing="free" required />
            <RoleRow index={1} defaultName="" defaultPricing="free" />
            <RoleRow index={2} defaultName="" defaultPricing="free" />
          </Section>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-6">
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-brand-orange-soft"
            >
              キャンセル
            </Link>
            <button
              type="submit"
              name="status"
              value="draft"
              data-testid="event-save-draft"
              className="inline-flex h-10 items-center rounded-md border border-brand-orange bg-surface px-5 text-sm font-semibold text-brand-orange hover:bg-brand-orange-soft"
            >
              下書き保存
            </button>
            <button
              type="submit"
              name="status"
              value="published"
              data-testid="event-publish"
              className="inline-flex h-10 items-center rounded-md bg-brand-orange px-5 text-sm font-semibold text-white shadow hover:bg-brand-orange-hover"
            >
              公開する
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ============================================================
 * 小さな下請けコンポーネント
 * ============================================================ */

function Section({
  title,
  help,
  children,
}: {
  title: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {help && <p className="mt-1 text-xs text-muted-foreground">{help}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  help,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  help?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1 block text-sm font-medium text-foreground"
      >
        {label}
        {required && <span className="ml-1 text-status-cancelled-fg">*</span>}
      </label>
      {children}
      {help && <p className="mt-1 text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}

function RoleRow({
  index,
  defaultName,
  defaultPricing,
  required,
}: {
  index: number;
  defaultName: string;
  defaultPricing: "free" | "on_site" | "prepaid";
  required?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-md border border-border p-3 sm:grid-cols-[2fr_1fr_1fr_1fr]">
      <div>
        <label
          htmlFor={`eventRole-${index}-name`}
          className="mb-1 block text-xs font-medium text-muted-foreground"
        >
          枠名{required ? " *" : ""}
        </label>
        <input
          id={`eventRole-${index}-name`}
          name={`eventRole[${index}].name`}
          type="text"
          required={required}
          defaultValue={defaultName}
          maxLength={120}
          placeholder={index === 0 ? "一般" : "(空欄なら無効)"}
          className="block w-full rounded-md border border-border bg-white px-2 py-1.5 text-sm focus:border-brand-orange focus:outline-none"
        />
      </div>
      <div>
        <label
          htmlFor={`eventRole-${index}-capacity`}
          className="mb-1 block text-xs font-medium text-muted-foreground"
        >
          定員
        </label>
        <input
          id={`eventRole-${index}-capacity`}
          name={`eventRole[${index}].capacity`}
          type="number"
          min={0}
          className="block w-full rounded-md border border-border bg-white px-2 py-1.5 text-sm focus:border-brand-orange focus:outline-none"
        />
      </div>
      <div>
        <label
          htmlFor={`eventRole-${index}-pricingType`}
          className="mb-1 block text-xs font-medium text-muted-foreground"
        >
          料金タイプ
        </label>
        <select
          id={`eventRole-${index}-pricingType`}
          name={`eventRole[${index}].pricingType`}
          defaultValue={defaultPricing}
          className="block w-full rounded-md border border-border bg-white px-2 py-1.5 text-sm focus:border-brand-orange focus:outline-none"
        >
          <option value="free">無料</option>
          <option value="on_site">会場払い</option>
          <option value="prepaid">前払い</option>
        </select>
      </div>
      <div>
        <label
          htmlFor={`eventRole-${index}-price`}
          className="mb-1 block text-xs font-medium text-muted-foreground"
        >
          料金 (円)
        </label>
        <input
          id={`eventRole-${index}-price`}
          name={`eventRole[${index}].price`}
          type="number"
          min={0}
          defaultValue={0}
          className="block w-full rounded-md border border-border bg-white px-2 py-1.5 text-sm focus:border-brand-orange focus:outline-none"
        />
      </div>
    </div>
  );
}
