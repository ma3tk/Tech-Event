"use server";

/**
 * グループ作成・更新の Server Actions。
 *
 * `event-actions.ts` と同じパターン:
 *   - FormData を受け取る
 *   - Zod でバリデーション
 *   - 認証必須 (未ログインは `/login?next=...` へ)
 *   - Prisma 7 + SQLite + Driver Adapter の都合で BigInt @id を _max+1 で採番
 *
 * 失敗時はリダイレクトクエリでエラーキーを返す。
 *   - 例: `/group/create?error=subdomain_taken&...`
 *
 * 成功時は `/group/<subdomain>` へリダイレクトする。
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { addGroupMember } from "./lib/group-membership";
import { validateSlackWebhookUrl } from "@/lib/slack";
import { recordAudit } from "@/lib/audit";
import { nextId, withRetry } from "@/lib/id-gen";
import { ActionError, buildRedirectUrlWithFormError } from "@/lib/action-error";
import { isReservedSlug } from "@/lib/reserved-words";
import { assertRateLimit, RATE_LIMITS, RateLimitError } from "@/lib/rate-limit";
import { getString as formValue, getStringRaw as formValueRaw } from "@/lib/form-data";
import { SlugSchema as SubdomainSchema, UrlOrEmpty } from "@/lib/schemas";

/* ============================================================
 * バリデーション
 * ============================================================ */

/**
 * Slack Webhook URL 専用 schema。
 * SSRF 対策のため、空文字以外は `validateSlackWebhookUrl` で許可ホストのみ許容する。
 */
const SlackWebhookUrlOrEmpty = z
  .string()
  .max(2000)
  .refine(
    (v) => v === "" || validateSlackWebhookUrl(v).ok,
    "Slack Webhook URL は https://hooks.slack.com/services/... のみ受け付けます",
  );

const GroupBaseSchema = z.object({
  name: z.string().min(1, "name は必須").max(120),
  subtitle: z.string().max(200).optional().default(""),
  organization: z.string().max(200).optional().default(""),
  description: z.string().max(20_000).optional().default(""),
  coverImageUrl: UrlOrEmpty.optional().default(""),
  thumbnailUrl: UrlOrEmpty.optional().default(""),
  websiteUrl: UrlOrEmpty.optional().default(""),
  xAccount: z.string().max(100).optional().default(""),
  facebookUrl: UrlOrEmpty.optional().default(""),
  slackWebhookUrl: SlackWebhookUrlOrEmpty.optional().default(""),
});

const CreateGroupSchema = GroupBaseSchema.extend({
  subdomain: SubdomainSchema,
});

const UpdateGroupSchema = GroupBaseSchema.extend({
  groupId: z.string().regex(/^\d+$/),
});

/* ============================================================
 * 共通ヘルパー
 * ============================================================ */

async function nextGroupId(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
): Promise<bigint> {
  return nextId(tx, "group");
}

async function nextGroupAdminId(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
): Promise<bigint> {
  return nextId(tx, "groupAdmin");
}



/** 「自分が owner/admin」かを判定 */
async function isGroupAdminOrOwner(
  groupId: bigint,
  userId: bigint,
): Promise<{ ok: true; role: "owner" | "admin" } | { ok: false }> {
  const row = await prisma.groupAdmin.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!row) return { ok: false };
  if (row.role !== "owner" && row.role !== "admin") return { ok: false };
  return { ok: true, role: row.role as "owner" | "admin" };
}

/**
 * formData をクエリ文字列に詰め直し、入力を復元しつつエラーリダイレクトする。
 *
 * Server Action 内で `redirect()` を投げると例外として伝播するので、呼び出し
 * 側の return 以降は実行されない。
 */
function redirectWithError(
  basePath: string,
  form: FormData,
  errorKey: string,
  errorMessage?: string,
): never {
  redirect(buildRedirectUrlWithFormError(basePath, form, errorKey, errorMessage));
}

/* ============================================================
 * createGroup
 * ============================================================ */

export async function createGroup(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/group/create")}`);
  }

  // ---- レート制限 (user 単位: 5 回/時) ----
  try {
    assertRateLimit(`user:${user.id}:createGroup`, RATE_LIMITS.createResource);
  } catch (e) {
    if (e instanceof RateLimitError) {
      redirectWithError(
        "/group/create",
        formData,
        "rate_limited",
        e.message,
      );
    }
    throw e;
  }

  const parsed = CreateGroupSchema.safeParse({
    subdomain: formValue(formData, "subdomain"),
    name: formValue(formData, "name"),
    subtitle: formValue(formData, "subtitle"),
    organization: formValue(formData, "organization"),
    description: formValueRaw(formData, "description"),
    coverImageUrl: formValue(formData, "coverImageUrl"),
    thumbnailUrl: formValue(formData, "thumbnailUrl"),
    websiteUrl: formValue(formData, "websiteUrl"),
    xAccount: formValue(formData, "xAccount"),
    facebookUrl: formValue(formData, "facebookUrl"),
    slackWebhookUrl: formValue(formData, "slackWebhookUrl"),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    redirectWithError(
      "/group/create",
      formData,
      "invalid_input",
      first?.message ?? "入力が不正です",
    );
  }

  const data = parsed.data;

  // 予約語チェック (システムパス衝突回避 / フィッシング対策)
  if (isReservedSlug(data.subdomain)) {
    redirectWithError(
      "/group/create",
      formData,
      "subdomain_reserved",
      `サブドメイン "${data.subdomain}" は予約語のため使用できません`,
    );
  }

  // ユニーク制約の事前チェック (race condition は catch で fallback)
  const dup = await prisma.group.findUnique({
    where: { subdomain: data.subdomain },
    select: { id: true },
  });
  if (dup) {
    redirectWithError(
      "/group/create",
      formData,
      "subdomain_taken",
      `サブドメイン "${data.subdomain}" は既に使われています`,
    );
  }

  let createdSubdomain: string | null = null;
  try {
    await prisma.$transaction(async (tx) => {
      const groupId = await nextGroupId(tx);
      const now = new Date();
      await tx.group.create({
        data: {
          id: groupId,
          subdomain: data.subdomain,
          name: data.name,
          subtitle: data.subtitle || null,
          organization: data.organization || null,
          description: data.description || null,
          coverImageUrl: data.coverImageUrl || null,
          thumbnailUrl: data.thumbnailUrl || null,
          websiteUrl: data.websiteUrl || null,
          xAccount: data.xAccount || null,
          facebookUrl: data.facebookUrl || null,
          slackWebhookUrl: data.slackWebhookUrl || null,
          // memberCount は addGroupMember 内で +1 されるので 0 で初期化する
          memberCount: 0,
          eventCount: 0,
          presentationCount: 0,
          status: "active",
          publishedAt: now,
        },
      });

      // 作成者を owner として登録
      await tx.groupAdmin.create({
        data: {
          id: await nextGroupAdminId(tx),
          groupId,
          userId: user.id,
          role: "owner",
        },
      });
      // 作成者を初期 member として登録 (memberCount を 1 に進める)
      await addGroupMember(tx, {
        groupId,
        userId: user.id,
        joinedVia: "manual",
      });
      createdSubdomain = data.subdomain;
    });
  } catch (e) {
    // race condition (subdomain unique violation) など
    const msg = e instanceof Error ? e.message : String(e);
    if (/UNIQUE|constraint|subdomain/i.test(msg)) {
      redirectWithError(
        "/group/create",
        formData,
        "subdomain_taken",
        `サブドメイン "${data.subdomain}" は既に使われています`,
      );
    }
    redirectWithError(
      "/group/create",
      formData,
      "internal_error",
      "グループの作成に失敗しました",
    );
  }

  // 監査ログ
  void recordAudit({
    actorUserId: user.id,
    action: "group.create",
    targetType: "Group",
    targetId: BigInt(0), // group.id は採番後に把握できないので 0 ダミー
    metadata: { subdomain: createdSubdomain ?? data.subdomain },
  });

  revalidatePath("/dashboard");
  revalidatePath("/series");
  revalidatePath("/explore/groups");
  redirect(`/group/${createdSubdomain ?? data.subdomain}?toast=group-created`);
}

/* ============================================================
 * updateGroup
 * ============================================================ */

export async function updateGroup(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    const subdomain = formValue(formData, "subdomain");
    redirect(
      `/login?next=${encodeURIComponent(
        subdomain ? `/group/${subdomain}/edit` : "/dashboard",
      )}`,
    );
  }

  const parsed = UpdateGroupSchema.safeParse({
    groupId: formValueRaw(formData, "groupId"),
    name: formValue(formData, "name"),
    subtitle: formValue(formData, "subtitle"),
    organization: formValue(formData, "organization"),
    description: formValueRaw(formData, "description"),
    coverImageUrl: formValue(formData, "coverImageUrl"),
    thumbnailUrl: formValue(formData, "thumbnailUrl"),
    websiteUrl: formValue(formData, "websiteUrl"),
    xAccount: formValue(formData, "xAccount"),
    facebookUrl: formValue(formData, "facebookUrl"),
    slackWebhookUrl: formValue(formData, "slackWebhookUrl"),
  });
  if (!parsed.success) {
    throw new Error("invalid_input");
  }
  const data = parsed.data;
  const groupId = BigInt(data.groupId);

  // 権限チェック
  const perm = await isGroupAdminOrOwner(groupId, user.id);
  if (!perm.ok) {
    throw new Error("forbidden");
  }

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new Error("group_not_found");

  await prisma.group.update({
    where: { id: groupId },
    data: {
      name: data.name,
      subtitle: data.subtitle || null,
      organization: data.organization || null,
      description: data.description || null,
      coverImageUrl: data.coverImageUrl || null,
      thumbnailUrl: data.thumbnailUrl || null,
      websiteUrl: data.websiteUrl || null,
      xAccount: data.xAccount || null,
      facebookUrl: data.facebookUrl || null,
      slackWebhookUrl: data.slackWebhookUrl || null,
    },
  });

  // 監査ログ
  void recordAudit({
    actorUserId: user.id,
    action: "group.update",
    targetType: "Group",
    targetId: groupId,
    metadata: { subdomain: group.subdomain },
  });

  revalidatePath(`/group/${group.subdomain}`);
  revalidatePath(`/group/${group.subdomain}/edit`);
  redirect(`/group/${group.subdomain}`);
}

/* ============================================================
 * グループブラックリスト (GroupBlacklist)
 *
 * - addToBlacklist / removeFromBlacklist: 引数指定のコア Action
 * - addToBlacklistAction / removeFromBlacklistAction: 管理ページの
 *   form から呼ぶ FormData ラッパ (nickname → userId 解決 + redirect)
 *
 * 認可: 対象グループの GroupAdmin (owner / admin) のみ。
 * BL 登録済みユーザーの参加申込は joinEvent / submitSurveyAndJoin の
 * 入口 (feature-event) でブロックされる。
 * ============================================================ */

const BlacklistIdsSchema = z.object({
  groupId: z.string().regex(/^\d+$/),
  userId: z.string().regex(/^\d+$/),
  reason: z.string().max(500).optional().default(""),
});

/**
 * addToBlacklist (グループ管理者): 指定ユーザーをグループのブラックリストに追加。
 *
 * - 既に登録済みなら reason のみ更新 (冪等)。
 * - 自分自身・グループ管理者 (owner/admin) は登録不可。
 */
export async function addToBlacklist(
  groupId: bigint | string,
  userId: bigint | string,
  reason?: string,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    throw new ActionError("unauthorized", "ログインが必要です");
  }

  const parsed = BlacklistIdsSchema.safeParse({
    groupId: String(groupId),
    userId: String(userId),
    reason: reason ?? "",
  });
  if (!parsed.success) {
    throw new ActionError("invalid_input", "入力内容が不正です");
  }
  const gid = BigInt(parsed.data.groupId);
  const uid = BigInt(parsed.data.userId);
  const trimmedReason = parsed.data.reason.trim();

  const perm = await isGroupAdminOrOwner(gid, user.id);
  if (!perm.ok) {
    throw new ActionError("forbidden", "グループ管理者権限が必要です");
  }

  const group = await prisma.group.findUnique({ where: { id: gid } });
  if (!group) {
    throw new ActionError("not_found", "グループが見つかりません");
  }
  const target = await prisma.user.findUnique({ where: { id: uid } });
  if (!target) {
    throw new ActionError("not_found", "ユーザーが見つかりません");
  }
  if (uid === user.id) {
    throw new ActionError("invalid_input", "自分自身はブラックリストに追加できません");
  }
  // グループ管理者は BL 対象にできない (owner を admin が BAN する事故防止)
  const targetAdmin = await prisma.groupAdmin.findUnique({
    where: { groupId_userId: { groupId: gid, userId: uid } },
  });
  if (targetAdmin && (targetAdmin.role === "owner" || targetAdmin.role === "admin")) {
    throw new ActionError("invalid_input", "グループ管理者はブラックリストに追加できません");
  }

  await withRetry(() =>
    prisma.$transaction(async (tx) => {
      const existing = await tx.groupBlacklist.findUnique({
        where: { groupId_userId: { groupId: gid, userId: uid } },
      });
      if (existing) {
        // 冪等: 登録済みなら reason のみ更新
        await tx.groupBlacklist.update({
          where: { id: existing.id },
          data: { reason: trimmedReason || null },
        });
        return;
      }
      await tx.groupBlacklist.create({
        data: {
          id: await nextId(tx, "groupBlacklist"),
          groupId: gid,
          userId: uid,
          reason: trimmedReason || null,
          addedByUserId: user.id,
        },
      });
    }),
  );

  // 監査ログ
  void recordAudit({
    actorUserId: user.id,
    action: "group.blacklist.add",
    targetType: "Group",
    targetId: gid,
    metadata: { userId: uid.toString(), nickname: target.nickname },
  });

  revalidatePath(`/group/${group.subdomain}/admin/blacklist`);
}

/**
 * removeFromBlacklist (グループ管理者): ブラックリストから解除。
 * 未登録なら no-op (冪等)。
 */
export async function removeFromBlacklist(
  groupId: bigint | string,
  userId: bigint | string,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    throw new ActionError("unauthorized", "ログインが必要です");
  }

  const parsed = BlacklistIdsSchema.safeParse({
    groupId: String(groupId),
    userId: String(userId),
  });
  if (!parsed.success) {
    throw new ActionError("invalid_input", "入力内容が不正です");
  }
  const gid = BigInt(parsed.data.groupId);
  const uid = BigInt(parsed.data.userId);

  const perm = await isGroupAdminOrOwner(gid, user.id);
  if (!perm.ok) {
    throw new ActionError("forbidden", "グループ管理者権限が必要です");
  }

  const group = await prisma.group.findUnique({ where: { id: gid } });
  if (!group) {
    throw new ActionError("not_found", "グループが見つかりません");
  }

  await prisma.groupBlacklist.deleteMany({
    where: { groupId: gid, userId: uid },
  });

  // 監査ログ
  void recordAudit({
    actorUserId: user.id,
    action: "group.blacklist.remove",
    targetType: "Group",
    targetId: gid,
    metadata: { userId: uid.toString() },
  });

  revalidatePath(`/group/${group.subdomain}/admin/blacklist`);
}

/**
 * addToBlacklistAction: BL 管理ページの追加 form 用ラッパ。
 *
 * FormData: subdomain (必須) / nickname (必須) / reason (任意)
 * 成否はクエリパラメータで BL 管理ページに戻して表示する。
 */
export async function addToBlacklistAction(formData: FormData): Promise<void> {
  const subdomain = formValue(formData, "subdomain");
  const nickname = formValue(formData, "nickname").trim();
  const reason = formValue(formData, "reason");
  const basePath = `/group/${subdomain}/admin/blacklist`;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(basePath)}`);
  }

  const group = await prisma.group.findUnique({ where: { subdomain } });
  if (!group) {
    redirect(`${basePath}?error=${encodeURIComponent("グループが見つかりません")}`);
  }
  if (!nickname) {
    redirect(`${basePath}?error=${encodeURIComponent("ニックネームを入力してください")}`);
  }
  const target = await prisma.user.findUnique({ where: { nickname } });
  if (!target) {
    redirect(
      `${basePath}?error=${encodeURIComponent(`ユーザー "@${nickname}" が見つかりません`)}`,
    );
  }

  try {
    await addToBlacklist(group.id, target.id, reason);
  } catch (e) {
    if (e instanceof ActionError) {
      redirect(`${basePath}?error=${encodeURIComponent(e.message)}`);
    }
    throw e;
  }
  redirect(`${basePath}?toast=blacklist-added`);
}

/**
 * removeFromBlacklistAction: BL 管理ページの解除ボタン用ラッパ。
 *
 * FormData: subdomain (必須) / userId (必須)
 */
export async function removeFromBlacklistAction(
  formData: FormData,
): Promise<void> {
  const subdomain = formValue(formData, "subdomain");
  const userIdRaw = formValue(formData, "userId");
  const basePath = `/group/${subdomain}/admin/blacklist`;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(basePath)}`);
  }

  const group = await prisma.group.findUnique({ where: { subdomain } });
  if (!group) {
    redirect(`${basePath}?error=${encodeURIComponent("グループが見つかりません")}`);
  }
  if (!/^\d+$/.test(userIdRaw)) {
    redirect(`${basePath}?error=${encodeURIComponent("ユーザー ID が不正です")}`);
  }

  try {
    await removeFromBlacklist(group.id, BigInt(userIdRaw));
  } catch (e) {
    if (e instanceof ActionError) {
      redirect(`${basePath}?error=${encodeURIComponent(e.message)}`);
    }
    throw e;
  }
  redirect(`${basePath}?toast=blacklist-removed`);
}
