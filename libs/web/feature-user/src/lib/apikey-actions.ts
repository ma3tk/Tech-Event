"use server";

/**
 * 公開 API (`/api/v2/*`) 用 API キー管理の Server Actions。
 *
 * - `createApiKey(input)`: キーを発行し、**生キーはこのレスポンスで 1 回だけ**返す。
 *   DB には sha256 ハッシュ (`keyHash`) と先頭 12 文字 (`prefix`) のみ保存し、
 *   生キーは保存もログ出力もしない。
 * - `listApiKeys()`: 自分のキー一覧 (prefix / scopes / lastUsedAt / revokedAt)。
 * - `revokeApiKey(id)`: 自分のキーを失効させる (`revokedAt` を set。物理削除しない)。
 *
 * 認可: いずれも本人のみ (`getCurrentUser()`)。未ログインは /login にリダイレクト。
 * 採番: `nextId(tx, "apiKey")` + `withRetry` (P2002 リトライ)。
 */

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { ActionError } from "@/lib/action-error";
import { nextId, withRetry } from "@/lib/id-gen";
import { recordAudit } from "@/lib/audit";
import {
  API_KEY_PREFIX_LENGTH,
  API_KEY_RAW_PREFIX,
  hashApiKey,
  parseApiScopes,
  type ApiScope,
} from "@/lib/public-api";

import { getCurrentUser } from "./auth";

/** 1 ユーザーが同時に保持できる有効 (未失効) キーの上限 */
const MAX_ACTIVE_KEYS_PER_USER = 20;

/** 一覧表示用のキー情報 (生キー・keyHash は含まない) */
export type ApiKeySummary = {
  /** BigInt id の文字列表現 */
  id: string;
  name: string;
  /** 生キーの先頭 12 文字 (再表示はできない) */
  prefix: string;
  scopes: ApiScope[];
  /** ISO 文字列 (未使用なら null) */
  lastUsedAt: string | null;
  /** ISO 文字列 (有効なら null) */
  revokedAt: string | null;
  createdAt: string;
};

const CreateApiKeySchema = z.object({
  /** 表示用ラベル */
  name: z.string().trim().min(1, "キー名を入力してください").max(100),
  /** スコープ (read は常に付与し、write は任意) */
  scopes: z.array(z.enum(["read", "write"])).min(1).max(2),
});

/** `createApiKey` の入力型 */
export type CreateApiKeyInput = z.input<typeof CreateApiKeySchema>;

const RevokeApiKeySchema = z.object({
  id: z.string().regex(/^\d+$/, "id が不正です"),
});

/** DB row → ApiKeySummary (BigInt / Date をシリアライズ可能な形に変換) */
function toSummary(row: {
  id: bigint;
  name: string;
  prefix: string;
  scopes: string;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}): ApiKeySummary {
  return {
    id: row.id.toString(),
    name: row.name,
    prefix: row.prefix,
    scopes: parseApiScopes(row.scopes),
    lastUsedAt: row.lastUsedAt ? row.lastUsedAt.toISOString() : null,
    revokedAt: row.revokedAt ? row.revokedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

/** 認証必須ヘルパー。未ログインは /login へ */
async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/settings/api-keys")}`);
  }
  return user;
}

/**
 * API キーを発行する (本人のみ)。
 *
 * 戻り値の `rawKey` (`te_live_` + 32byte hex) は **この 1 回しか取得できない**。
 * DB には sha256 ハッシュと prefix のみを保存する。
 * `rawKey` を絶対にログ・監査レコードに含めないこと。
 */
export async function createApiKey(
  input: CreateApiKeyInput,
): Promise<{ ok: true; key: ApiKeySummary; rawKey: string }> {
  const user = await requireUser();

  const parsed = CreateApiKeySchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new ActionError(
      "invalid_input",
      first?.message ?? "入力内容が不正です",
      { field: first?.path.join(".") },
    );
  }

  // read は常時付与 (write のみのキーは作らない)
  const scopeSet = new Set<ApiScope>(["read", ...parsed.data.scopes]);
  const scopes: ApiScope[] = ["read", "write"].filter((s): s is ApiScope =>
    scopeSet.has(s as ApiScope),
  );

  const activeCount = await prisma.apiKey.count({
    where: { userId: user.id, revokedAt: null },
  });
  if (activeCount >= MAX_ACTIVE_KEYS_PER_USER) {
    throw new ActionError(
      "conflict",
      `有効な API キーは最大 ${MAX_ACTIVE_KEYS_PER_USER} 件までです。不要なキーを失効してください`,
    );
  }

  // 生キー生成: te_live_ + 32byte hex (= 64 文字)
  const rawKey = `${API_KEY_RAW_PREFIX}${randomBytes(32).toString("hex")}`;
  const keyHash = hashApiKey(rawKey);
  const prefix = rawKey.slice(0, API_KEY_PREFIX_LENGTH);

  const created = await withRetry(() =>
    prisma.$transaction(async (tx) => {
      const id = await nextId(tx, "apiKey");
      return tx.apiKey.create({
        data: {
          id,
          userId: user.id,
          name: parsed.data.name,
          keyHash,
          prefix,
          scopes: scopes.join(","),
        },
      });
    }),
  );

  // 監査レコードには生キー / keyHash を含めない
  void recordAudit({
    actorUserId: user.id,
    action: "apiKey.created",
    targetType: "ApiKey",
    targetId: created.id,
  });

  revalidatePath("/settings/api-keys");

  return { ok: true, key: toSummary(created), rawKey };
}

/**
 * 自分の API キー一覧を返す (失効済みも含む。新しい順)。
 * 生キー・keyHash は含まない。
 */
export async function listApiKeys(): Promise<ApiKeySummary[]> {
  const user = await requireUser();

  const rows = await prisma.apiKey.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toSummary);
}

/**
 * API キーを失効させる (本人のみ)。
 *
 * - 他人のキー / 存在しない id は `not_found` (存在を漏らさない)
 * - 既に失効済みの場合は冪等に成功を返す
 */
export async function revokeApiKey(id: string): Promise<{ ok: true }> {
  const user = await requireUser();

  const parsed = RevokeApiKeySchema.safeParse({ id });
  if (!parsed.success) {
    throw new ActionError("invalid_input", "id が不正です");
  }
  const keyId = BigInt(parsed.data.id);

  const row = await prisma.apiKey.findUnique({ where: { id: keyId } });
  if (!row || row.userId !== user.id) {
    throw new ActionError("not_found", "API キーが見つかりません");
  }
  if (row.revokedAt === null) {
    await prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    });
    void recordAudit({
      actorUserId: user.id,
      action: "apiKey.revoked",
      targetType: "ApiKey",
      targetId: keyId,
    });
  }

  revalidatePath("/settings/api-keys");
  return { ok: true };
}
