/**
 * グループ admin Outbound Webhook 管理ページ。
 *
 * - 認証必須 + GroupAdmin (owner / admin) のみ閲覧可能。
 * - WebhookEndpoint の追加 (url + 購読イベント選択) / 一覧
 *   (url / 購読 / active / 最終配信) / 削除 / 有効無効切り替えを提供する。
 * - 配信時は `X-TechEvent-Signature: sha256=<HMAC-SHA256(secret, body)>` で
 *   署名される。secret は一覧の「署名シークレット」から確認できる。
 * - URL は SSRF 防御のため http(s) のみ + private IP / localhost 拒否。
 *
 * URL: `/group/[subdomain]/admin/webhooks`
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Breadcrumb from "@/components/Breadcrumb";
import {
  WEBHOOK_EVENT_LABELS,
  WEBHOOK_EVENT_TYPES,
  createWebhookEndpointAction,
  deleteWebhookEndpointAction,
  listWebhookEndpoints,
  toggleWebhookEndpointAction,
} from "@tech-event/web-feature-group";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Webhook 管理 | tech-event",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ error?: string; toast?: string }>;
};

const TOAST_MESSAGES: Record<string, string> = {
  "webhook-created": "Webhook エンドポイントを追加しました。",
  "webhook-deleted": "Webhook エンドポイントを削除しました。",
  "webhook-toggled": "Webhook エンドポイントの有効/無効を切り替えました。",
};

const DELIVERY_STATUS_LABELS: Record<string, string> = {
  success: "成功",
  failed: "失敗",
  pending: "送信中",
};

export default async function GroupAdminWebhooksPage({
  params,
  searchParams,
}: PageProps) {
  const { subdomain } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/group/${subdomain}/admin/webhooks`)}`,
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

  const endpoints = await listWebhookEndpoints(group.id);
  const toastMessage = sp.toast ? TOAST_MESSAGES[sp.toast] : undefined;

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: group.name, href: `/group/${subdomain}` },
          { label: "Webhook 管理" },
        ]}
      />

      <header className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="text-xl font-bold md:text-2xl"
            data-testid="group-webhooks-heading"
          >
            Webhook 管理 ({endpoints.length}件)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {group.name} の Outbound Webhook。参加申込・イベント公開などの発生時に、登録した
            URL へ JSON を POST します。リクエストには
            <code className="mx-1 rounded bg-background px-1 py-0.5 text-xs">
              X-TechEvent-Signature: sha256=&lt;HMAC-SHA256(secret, body)&gt;
            </code>
            ヘッダが付与されます。
          </p>
        </div>
        <Link
          href={`/group/${subdomain}/admin/members`}
          className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium hover:bg-brand-orange-soft"
        >
          メンバー管理へ
        </Link>
      </header>

      {sp.error && (
        <p
          role="alert"
          data-testid="webhook-error"
          className="mt-4 rounded-md border border-status-cancelled-bg bg-status-cancelled-bg/10 px-3 py-2 text-sm text-status-cancelled-fg"
        >
          {sp.error}
        </p>
      )}
      {toastMessage && (
        <p
          role="status"
          data-testid="webhook-toast"
          className="mt-4 rounded-md border border-border bg-brand-orange-soft px-3 py-2 text-sm text-foreground"
        >
          {toastMessage}
        </p>
      )}

      {/* ============ 追加フォーム ============ */}
      <form
        action={createWebhookEndpointAction}
        className="mt-6 grid grid-cols-1 gap-3 rounded-md border border-dashed border-border bg-surface p-4"
        data-testid="webhook-add-form"
      >
        <input type="hidden" name="subdomain" value={subdomain} />
        <div>
          <label
            htmlFor="webhook-url"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            送信先 URL *
          </label>
          <input
            id="webhook-url"
            name="url"
            type="url"
            required
            maxLength={2000}
            placeholder="例: https://example.com/hooks/tech-event"
            data-testid="webhook-add-url"
            className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            http / https のみ。localhost やプライベート IP 宛は登録できません。
          </p>
        </div>
        <fieldset>
          <legend className="mb-1 block text-xs font-medium text-muted-foreground">
            購読するイベント *
          </legend>
          <div className="flex flex-wrap gap-4">
            {WEBHOOK_EVENT_TYPES.map((type) => (
              <label
                key={type}
                className="inline-flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  name="events"
                  value={type}
                  defaultChecked
                  data-testid={`webhook-add-event-${type}`}
                  className="h-4 w-4 rounded border-border accent-brand-orange"
                />
                {WEBHOOK_EVENT_LABELS[type]}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <button
            type="submit"
            data-testid="webhook-add-submit"
            className="inline-flex h-9 items-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white hover:bg-brand-orange-hover"
          >
            エンドポイントを追加
          </button>
        </div>
      </form>

      {/* ============ 一覧 ============ */}
      <div className="mt-6 overflow-x-auto rounded-md border border-border bg-surface">
        <table className="w-full text-sm" data-testid="group-webhooks-table">
          <thead className="border-b border-border bg-background text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">URL</th>
              <th className="px-3 py-2 text-left">購読イベント</th>
              <th className="px-3 py-2 text-left">状態</th>
              <th className="px-3 py-2 text-left">最終配信</th>
              <th className="px-3 py-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {endpoints.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-muted-foreground"
                  data-testid="webhook-empty"
                >
                  Webhook エンドポイントはまだ登録されていません。
                </td>
              </tr>
            ) : (
              endpoints.map((ep) => (
                <tr
                  key={ep.id}
                  className="border-b border-border last:border-0"
                  data-testid={`webhook-row-${ep.id}`}
                >
                  <td className="max-w-[320px] px-3 py-3">
                    <p className="break-all font-medium" data-testid={`webhook-url-${ep.id}`}>
                      {ep.url}
                    </p>
                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                        署名シークレット
                      </summary>
                      <code className="mt-1 block break-all rounded bg-background px-2 py-1 text-xs">
                        {ep.secret}
                      </code>
                    </details>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    <ul className="space-y-0.5">
                      {ep.events.map((ev) => (
                        <li key={ev}>
                          <code className="rounded bg-background px-1.5 py-0.5">
                            {ev}
                          </code>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      data-testid={`webhook-active-${ep.id}`}
                      className={
                        ep.active
                          ? "inline-flex rounded-full bg-brand-orange-soft px-2 py-0.5 text-xs font-medium text-foreground"
                          : "inline-flex rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground"
                      }
                    >
                      {ep.active ? "有効" : "無効"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    {ep.lastDelivery ? (
                      <>
                        <p>
                          {DELIVERY_STATUS_LABELS[ep.lastDelivery.status] ??
                            ep.lastDelivery.status}
                          {ep.lastDelivery.statusCode != null &&
                            ` (HTTP ${ep.lastDelivery.statusCode})`}
                        </p>
                        <p>
                          {ep.lastDelivery.eventType} /{" "}
                          {(
                            ep.lastDelivery.lastAttemptAt ??
                            ep.lastDelivery.createdAt
                          ).toLocaleString("ja-JP")}
                        </p>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <form action={toggleWebhookEndpointAction}>
                        <input
                          type="hidden"
                          name="subdomain"
                          value={subdomain}
                        />
                        <input type="hidden" name="endpointId" value={ep.id} />
                        <button
                          type="submit"
                          data-testid={`webhook-toggle-${ep.id}`}
                          className="inline-flex h-8 items-center rounded-md border border-border bg-white px-3 text-xs font-medium hover:bg-brand-orange-soft"
                        >
                          {ep.active ? "無効にする" : "有効にする"}
                        </button>
                      </form>
                      <form action={deleteWebhookEndpointAction}>
                        <input
                          type="hidden"
                          name="subdomain"
                          value={subdomain}
                        />
                        <input type="hidden" name="endpointId" value={ep.id} />
                        <button
                          type="submit"
                          data-testid={`webhook-delete-${ep.id}`}
                          className="inline-flex h-8 items-center rounded-md border border-status-cancelled-bg bg-white px-3 text-xs font-medium text-status-cancelled-fg hover:bg-status-cancelled-bg/20"
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
    </div>
  );
}
