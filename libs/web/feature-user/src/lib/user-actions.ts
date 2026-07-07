"use server";

/**
 * ユーザーアカウント用 Server Actions。
 *
 * `updateProfile(input)`:
 *   - 認証必須 (本人のみ)。未ログインは `/login` にリダイレクト。
 *   - `User` の編集可能フィールド (表示名 / ニックネーム / 自己紹介 / 所属 /
 *     場所 / Web サイト / X / Facebook / GitHub) を Zod 検証つきで更新する。
 *   - ニックネームは予約語と他ユーザーとの重複を拒否する。
 *
 * `withdrawAccount()`:
 *   - 認証必須 (本人のみ)。`User.status = "withdrawn"` + `withdrawnAt` を set し、
 *     セッション cookie を破棄する。
 *   - 既存の withdrawn 分岐 (`getCurrentUser` は active 以外 null /
 *     `/user/[nickname]` は notFound) がそのまま効くため、退会後は
 *     ログイン不可・プロフィール非公開になる。
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, clearSessionCookie } from "./auth";
import { ActionError } from "@/lib/action-error";
import { isReservedSlug } from "@/lib/reserved-words";
import { recordAudit } from "@/lib/audit";

/** 空文字を null に正規化する (フォームの未入力を DB では null で保持) */
const emptyToNull = (v: string): string | null => (v === "" ? null : v);

/** SNS アカウント名: 英数字 + `_` `-` `.` (空文字 = 未設定) */
const accountField = z
  .string()
  .trim()
  .max(100)
  .regex(/^[A-Za-z0-9_.-]*$/, "半角英数字と _ - . のみ使用できます");

const UpdateProfileSchema = z.object({
  /** 表示名 (必須) */
  displayName: z.string().trim().min(1, "表示名を入力してください").max(50),
  /** ニックネーム (URL に使われる) — signup フォームと同じ制約 */
  nickname: z
    .string()
    .regex(/^[A-Za-z0-9_-]{3,30}$/, "半角英数字と _ - のみ、3 ～ 30 文字です"),
  /** 自己紹介 (任意) */
  bio: z.string().max(1000).transform(emptyToNull),
  /** 所属 (会社・組織、任意) */
  affiliation: z.string().trim().max(100).transform(emptyToNull),
  /** 場所 (任意) */
  location: z.string().trim().max(100).transform(emptyToNull),
  /** Web サイト URL (任意、http/https のみ) */
  websiteUrl: z
    .union([
      z.literal(""),
      z
        .string()
        .url("URL の形式が不正です")
        .max(300)
        .refine(
          (u) => u.startsWith("http://") || u.startsWith("https://"),
          "http:// または https:// で始まる URL を入力してください",
        ),
    ])
    .transform(emptyToNull),
  /** X (Twitter) アカウント (任意) */
  xAccount: accountField.transform(emptyToNull),
  /** Facebook アカウント (任意) */
  facebookAccount: accountField.transform(emptyToNull),
  /** GitHub アカウント (任意) */
  githubAccount: accountField.transform(emptyToNull),
});

/** `updateProfile` の入力型 (フォーム値そのまま。空文字 = 未設定) */
export type UpdateProfileInput = z.input<typeof UpdateProfileSchema>;

/**
 * 自分のプロフィールを更新する。
 *
 * - 成功時は `{ok: true}` を返す (リダイレクトは呼び出し元フォームで行う)。
 * - 入力不正は `ActionError("invalid_input")`、ニックネーム重複 / 予約語は
 *   `ActionError("conflict")`。
 */
export async function updateProfile(
  input: UpdateProfileInput,
): Promise<{ ok: true; nickname: string }> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/settings/profile")}`);
  }

  const parsed = UpdateProfileSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new ActionError(
      "invalid_input",
      first?.message ?? "入力内容が不正です",
      { field: first?.path.join(".") },
    );
  }
  const data = parsed.data;

  // ニックネーム変更時: 予約語 + 他ユーザーとの重複チェック
  if (data.nickname !== user.nickname) {
    if (isReservedSlug(data.nickname)) {
      throw new ActionError(
        "conflict",
        "このニックネームは使用できません (予約語)",
        { field: "nickname" },
      );
    }
    const taken = await prisma.user.findUnique({
      where: { nickname: data.nickname },
      select: { id: true },
    });
    if (taken && taken.id !== user.id) {
      throw new ActionError(
        "conflict",
        "このニックネームは既に使われています",
        { field: "nickname" },
      );
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      displayName: data.displayName,
      nickname: data.nickname,
      bio: data.bio,
      affiliation: data.affiliation,
      location: data.location,
      websiteUrl: data.websiteUrl,
      xAccount: data.xAccount,
      facebookAccount: data.facebookAccount,
      githubAccount: data.githubAccount,
    },
  });

  void recordAudit({
    actorUserId: user.id,
    action: "profile.updated",
    targetType: "User",
    targetId: user.id,
  });

  revalidatePath("/settings/profile");
  revalidatePath(`/user/${user.nickname}`);
  if (data.nickname !== user.nickname) {
    revalidatePath(`/user/${data.nickname}`);
  }

  return { ok: true, nickname: data.nickname };
}

/**
 * 退会する (本人のみ)。
 *
 * - `User.status = "withdrawn"` + `withdrawnAt` を set。
 * - セッション cookie を破棄する (以後 `getCurrentUser()` は null)。
 * - リダイレクトは呼び出し元フォームで行う。
 */
export async function withdrawAccount(): Promise<{ ok: true }> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/account/withdraw")}`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { status: "withdrawn", withdrawnAt: new Date() },
  });

  void recordAudit({
    actorUserId: user.id,
    action: "account.withdrawn",
    targetType: "User",
    targetId: user.id,
  });

  await clearSessionCookie();

  return { ok: true };
}
