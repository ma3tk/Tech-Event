"use server";

/**
 * Outbound Webhook エンドポイント管理の Server Actions。
 *
 * - createWebhookEndpoint / listWebhookEndpoints /
 *   deleteWebhookEndpoint / toggleWebhookEndpoint: 引数指定のコア Action
 * - `...Action(formData)`: `/group/[subdomain]/admin/webhooks` の form 用ラッパ
 *   (blacklist / broadcast の Action と同じパターン)
 *
 * 認可: 対象グループの GroupAdmin (owner / admin) のみ。
 * SSRF 防御: URL は `validateOutboundWebhookUrl` で http(s) のみ +
 * private IP / localhost 拒否 (詳細は lib/webhook-dispatch.ts)。
 * secret は 32byte hex を自動生成し、監査ログ・アプリログには出力しない。
 */

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { nextId, withRetry } from "@/lib/id-gen";
import { ActionError } from "@/lib/action-error";
import { getString as formValue } from "@/lib/form-data";

import {
  WEBHOOK_EVENT_TYPES,
  validateOutboundWebhookUrl,
  type WebhookEndpointListItem,
} from "./lib/webhook-dispatch";

/** 1 グループあたりのエンドポイント上限 (乱造防止) */
const MAX_ENDPOINTS_PER_GROUP = 10;

/* ============================================================
 * バリデーション
 * ============================================================ */

const CreateWebhookEndpointSchema = z.object({
  groupId: z.string().regex(/^\d+$/),
  url: z.string().min(1, "URL を入力してください").max(2000),
  events: z
    .array(z.enum(WEBHOOK_EVENT_TYPES))
    .min(1, "購読するイベントを 1 つ以上選択してください"),
});

const EndpointIdSchema = z.object({
  endpointId: z.string().regex(/^\d+$/),
});

/* ============================================================
 * 共通ヘルパー
 * ============================================================ */

/** 「自分が owner/admin」かを検証 (group-actions.ts と同じ判定基準) */
async function assertGroupAdminOrOwner(
  groupId: bigint,
  userId: bigint,
): Promise<void> {
  const row = await prisma.groupAdmin.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!row || (row.role !== "owner" && row.role !== "admin")) {
    throw new ActionError("forbidden", "グループ管理者権限が必要です");
  }
}

async function requireUser(): Promise<
  NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>
> {
  const user = await getCurrentUser();
  if (!user) {
    throw new ActionError("unauthorized", "ログインが必要です");
  }
  return user;
}

/* ============================================================
 * createWebhookEndpoint
 * ============================================================ */

/**
 * createWebhookEndpoint (グループ管理者): エンドポイントを追加する。
 *
 * - url は SSRF 検証 (http(s) のみ / private IP / localhost 拒否) を通過したもののみ。
 * - secret は 32byte hex を自動生成 (戻り値には含めない。一覧で確認できる)。
 */
export async function createWebhookEndpoint(
  groupId: bigint | string,
  url: string,
  events: string[],
): Promise<{ id: string }> {
  const user = await requireUser();

  const parsed = CreateWebhookEndpointSchema.safeParse({
    groupId: String(groupId),
    url: url.trim(),
    events,
  });
  if (!parsed.success) {
    throw new ActionError(
      "invalid_input",
      parsed.error.issues[0]?.message ?? "入力内容が不正です",
    );
  }
  const gid = BigInt(parsed.data.groupId);

  await assertGroupAdminOrOwner(gid, user.id);

  const group = await prisma.group.findUnique({ where: { id: gid } });
  if (!group) {
    throw new ActionError("not_found", "グループが見つかりません");
  }

  // SSRF 防御: http(s) のみ + private IP / localhost / 内部ホスト名を拒否
  const urlCheck = validateOutboundWebhookUrl(parsed.data.url);
  if (!urlCheck.ok) {
    throw new ActionError("invalid_input", urlCheck.error);
  }

  const count = await prisma.webhookEndpoint.count({ where: { groupId: gid } });
  if (count >= MAX_ENDPOINTS_PER_GROUP) {
    throw new ActionError(
      "invalid_input",
      `Webhook エンドポイントは 1 グループ ${MAX_ENDPOINTS_PER_GROUP} 件までです`,
    );
  }

  // 署名用シークレット (32byte hex)。ログには出力しない。
  const secret = randomBytes(32).toString("hex");
  // 重複を除去しつつ定義順で正規化して保存 (カンマ区切り)
  const normalizedEvents = WEBHOOK_EVENT_TYPES.filter((t) =>
    parsed.data.events.includes(t),
  );

  const endpointId = await withRetry(() =>
    prisma.$transaction(async (tx) => {
      const id = await nextId(tx, "webhookEndpoint");
      await tx.webhookEndpoint.create({
        data: {
          id,
          groupId: gid,
          url: parsed.data.url,
          secret,
          events: normalizedEvents.join(","),
          active: true,
        },
      });
      return id;
    }),
  );

  // 監査ログ (secret は含めない)
  void recordAudit({
    actorUserId: user.id,
    action: "group.webhook.create",
    targetType: "Group",
    targetId: gid,
    metadata: {
      endpointId: endpointId.toString(),
      url: parsed.data.url,
      events: normalizedEvents.join(","),
    },
  });

  revalidatePath(`/group/${group.subdomain}/admin/webhooks`);
  return { id: endpointId.toString() };
}

/* ============================================================
 * listWebhookEndpoints
 * ============================================================ */

/**
 * listWebhookEndpoints (グループ管理者): エンドポイント一覧 + 最終配信結果。
 */
export async function listWebhookEndpoints(
  groupId: bigint | string,
): Promise<WebhookEndpointListItem[]> {
  const user = await requireUser();

  if (!/^\d+$/.test(String(groupId))) {
    throw new ActionError("invalid_input", "入力内容が不正です");
  }
  const gid = BigInt(String(groupId));

  await assertGroupAdminOrOwner(gid, user.id);

  const endpoints = await prisma.webhookEndpoint.findMany({
    where: { groupId: gid },
    orderBy: { id: "asc" },
    include: {
      deliveries: {
        orderBy: { id: "desc" },
        take: 1,
      },
    },
  });

  return endpoints.map((ep) => {
    const last = ep.deliveries[0] ?? null;
    return {
      id: ep.id.toString(),
      url: ep.url,
      events: ep.events
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      active: ep.active,
      secret: ep.secret,
      createdAt: ep.createdAt,
      lastDelivery: last
        ? {
            eventType: last.eventType,
            status: last.status,
            statusCode: last.statusCode,
            lastAttemptAt: last.lastAttemptAt,
            createdAt: last.createdAt,
          }
        : null,
    };
  });
}

/* ============================================================
 * deleteWebhookEndpoint
 * ============================================================ */

/**
 * deleteWebhookEndpoint (グループ管理者): エンドポイントを削除する。
 * 配信ログ (WebhookDelivery) は onDelete: Cascade で一緒に消える。
 */
export async function deleteWebhookEndpoint(
  id: bigint | string,
): Promise<void> {
  const user = await requireUser();

  const parsed = EndpointIdSchema.safeParse({ endpointId: String(id) });
  if (!parsed.success) {
    throw new ActionError("invalid_input", "入力内容が不正です");
  }
  const endpointId = BigInt(parsed.data.endpointId);

  const endpoint = await prisma.webhookEndpoint.findUnique({
    where: { id: endpointId },
    include: { group: { select: { subdomain: true } } },
  });
  if (!endpoint) {
    throw new ActionError("not_found", "エンドポイントが見つかりません");
  }

  await assertGroupAdminOrOwner(endpoint.groupId, user.id);

  await prisma.webhookEndpoint.delete({ where: { id: endpointId } });

  void recordAudit({
    actorUserId: user.id,
    action: "group.webhook.delete",
    targetType: "Group",
    targetId: endpoint.groupId,
    metadata: { endpointId: endpointId.toString(), url: endpoint.url },
  });

  revalidatePath(`/group/${endpoint.group.subdomain}/admin/webhooks`);
}

/* ============================================================
 * toggleWebhookEndpoint
 * ============================================================ */

/**
 * toggleWebhookEndpoint (グループ管理者): active を反転する。
 */
export async function toggleWebhookEndpoint(
  id: bigint | string,
): Promise<{ active: boolean }> {
  const user = await requireUser();

  const parsed = EndpointIdSchema.safeParse({ endpointId: String(id) });
  if (!parsed.success) {
    throw new ActionError("invalid_input", "入力内容が不正です");
  }
  const endpointId = BigInt(parsed.data.endpointId);

  const endpoint = await prisma.webhookEndpoint.findUnique({
    where: { id: endpointId },
    include: { group: { select: { subdomain: true } } },
  });
  if (!endpoint) {
    throw new ActionError("not_found", "エンドポイントが見つかりません");
  }

  await assertGroupAdminOrOwner(endpoint.groupId, user.id);

  const updated = await prisma.webhookEndpoint.update({
    where: { id: endpointId },
    data: { active: !endpoint.active },
  });

  void recordAudit({
    actorUserId: user.id,
    action: "group.webhook.toggle",
    targetType: "Group",
    targetId: endpoint.groupId,
    metadata: {
      endpointId: endpointId.toString(),
      active: updated.active,
    },
  });

  revalidatePath(`/group/${endpoint.group.subdomain}/admin/webhooks`);
  return { active: updated.active };
}

/* ============================================================
 * FormData ラッパ (管理ページの form 用)
 * ============================================================ */

/**
 * createWebhookEndpointAction: 追加 form 用ラッパ。
 *
 * FormData: subdomain (必須) / url (必須) / events (checkbox 複数)
 */
export async function createWebhookEndpointAction(
  formData: FormData,
): Promise<void> {
  const subdomain = formValue(formData, "subdomain");
  const basePath = `/group/${subdomain}/admin/webhooks`;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(basePath)}`);
  }

  const group = await prisma.group.findUnique({ where: { subdomain } });
  if (!group) {
    redirect(`${basePath}?error=${encodeURIComponent("グループが見つかりません")}`);
  }

  const events = formData
    .getAll("events")
    .filter((v): v is string => typeof v === "string");

  try {
    await createWebhookEndpoint(group.id, formValue(formData, "url"), events);
  } catch (e) {
    if (e instanceof ActionError) {
      redirect(`${basePath}?error=${encodeURIComponent(e.message)}`);
    }
    throw e;
  }
  redirect(`${basePath}?toast=webhook-created`);
}

/**
 * deleteWebhookEndpointAction: 削除ボタン用ラッパ。
 *
 * FormData: subdomain (必須) / endpointId (必須)
 */
export async function deleteWebhookEndpointAction(
  formData: FormData,
): Promise<void> {
  const subdomain = formValue(formData, "subdomain");
  const basePath = `/group/${subdomain}/admin/webhooks`;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(basePath)}`);
  }

  try {
    await deleteWebhookEndpoint(formValue(formData, "endpointId"));
  } catch (e) {
    if (e instanceof ActionError) {
      redirect(`${basePath}?error=${encodeURIComponent(e.message)}`);
    }
    throw e;
  }
  redirect(`${basePath}?toast=webhook-deleted`);
}

/**
 * toggleWebhookEndpointAction: 有効/無効切り替えボタン用ラッパ。
 *
 * FormData: subdomain (必須) / endpointId (必須)
 */
export async function toggleWebhookEndpointAction(
  formData: FormData,
): Promise<void> {
  const subdomain = formValue(formData, "subdomain");
  const basePath = `/group/${subdomain}/admin/webhooks`;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(basePath)}`);
  }

  try {
    await toggleWebhookEndpoint(formValue(formData, "endpointId"));
  } catch (e) {
    if (e instanceof ActionError) {
      redirect(`${basePath}?error=${encodeURIComponent(e.message)}`);
    }
    throw e;
  }
  redirect(`${basePath}?toast=webhook-toggled`);
}
