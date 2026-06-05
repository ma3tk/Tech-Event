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
import { addGroupMember } from "@/lib/group-membership";
import { validateSlackWebhookUrl } from "@/lib/slack";
import { recordAudit } from "@/lib/audit";
import { nextId } from "@/lib/id-gen";
import { buildRedirectUrlWithFormError } from "@/lib/action-error";

/* ============================================================
 * バリデーション
 * ============================================================ */

function formValue(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function formValueRaw(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
}

const SubdomainSchema = z
  .string()
  .min(3, "subdomain は 3 文字以上")
  .max(63, "subdomain は 63 文字以下")
  .regex(/^[a-z0-9-]+$/, "subdomain は半角英小文字・数字・ハイフンのみ");

const UrlOrEmpty = z
  .string()
  .max(2000)
  .refine((v) => v === "" || /^https?:\/\//.test(v), "URL は http(s):// で始める");

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

  revalidatePath(`/group/${group.subdomain}`);
  revalidatePath(`/group/${group.subdomain}/edit`);
  redirect(`/group/${group.subdomain}`);
}
