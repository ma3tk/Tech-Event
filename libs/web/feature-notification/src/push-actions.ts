"use server";

/**
 * Web Push 購読 (`PushSubscription`) 用 Server Actions。
 *
 * `savePushSubscription({ endpoint, p256dh, auth })`:
 *  - 認証必須。未ログインは `ActionError("forbidden")`。
 *  - ブラウザの `PushManager.subscribe()` が返す購読情報を保存する。
 *  - `endpoint` は unique。既存レコードがあれば keys / userId を更新 (upsert 相当)、
 *    無ければ `nextId(tx, "pushSubscription")` で採番して作成 (CLAUDE.md §6.3/§6.4)。
 *
 * `deletePushSubscription(endpoint)`:
 *  - 認証必須。**自分の** 購読のみ削除できる (userId 条件付き deleteMany)。
 *
 * 呼び出し経路:
 *  - `POST /api/push/subscribe` / `POST /api/push/unsubscribe` (route handler 経由)
 *  - 将来的に Client Component から直接 Server Action としても呼べる。
 */

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { nextId, withRetry } from "@/lib/id-gen";
import { ActionError } from "@/lib/action-error";

/**
 * ブラウザの PushSubscription から取り出した購読情報。
 * `endpoint` は push service の URL、`p256dh` / `auth` は暗号化キー (base64url)。
 */
const PushSubscriptionInputSchema = z.object({
  endpoint: z.string().url().max(2048),
  p256dh: z.string().min(1).max(512),
  auth: z.string().min(1).max(512),
});

export type PushSubscriptionInput = z.infer<typeof PushSubscriptionInputSchema>;

/**
 * 購読を保存する (endpoint unique upsert)。
 *
 * - 同じ endpoint が既にある場合はキーと userId を更新する
 *   (ブラウザ側で購読が再生成された / 別ユーザーで再ログインしたケース)。
 * - 新規は `nextId` 採番 + `withRetry` で採番 race を吸収する。
 */
export async function savePushSubscription(
  input: PushSubscriptionInput,
): Promise<{ ok: true; created: boolean }> {
  const user = await getCurrentUser();
  if (!user) {
    throw new ActionError("forbidden", "ログインが必要です");
  }

  const parsed = PushSubscriptionInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new ActionError("invalid_input", "購読情報の形式が不正です");
  }
  const { endpoint, p256dh, auth } = parsed.data;

  const created = await withRetry(() =>
    prisma.$transaction(async (tx) => {
      const existing = await tx.pushSubscription.findUnique({
        where: { endpoint },
        select: { id: true },
      });
      if (existing) {
        await tx.pushSubscription.update({
          where: { id: existing.id },
          data: { userId: user.id, p256dh, auth },
        });
        return false;
      }
      const id = await nextId(tx, "pushSubscription");
      await tx.pushSubscription.create({
        data: { id, userId: user.id, endpoint, p256dh, auth },
      });
      return true;
    }),
  );

  return { ok: true, created };
}

/**
 * 購読を解除する。自分 (ログインユーザー) の購読のみ削除できる。
 *
 * @returns `deleted` — 削除した件数 (endpoint 不一致 / 他人の購読なら 0)
 */
export async function deletePushSubscription(
  endpoint: string,
): Promise<{ ok: true; deleted: number }> {
  const user = await getCurrentUser();
  if (!user) {
    throw new ActionError("forbidden", "ログインが必要です");
  }

  const parsed = z.string().url().max(2048).safeParse(endpoint);
  if (!parsed.success) {
    throw new ActionError("invalid_input", "endpoint の形式が不正です");
  }

  const result = await prisma.pushSubscription.deleteMany({
    where: { endpoint: parsed.data, userId: user.id },
  });

  return { ok: true, deleted: result.count };
}
