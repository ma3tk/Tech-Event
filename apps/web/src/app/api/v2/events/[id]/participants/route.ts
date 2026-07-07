/**
 * POST /api/v2/events/{id}/participants/
 *
 * イベントへのゲスト (参加者) 追加 — Luma の add-guests 相当の書き込み API。
 *
 * 認証: DB 発行キー (`ApiKey`) の write スコープ必須 (`guardRequestWithDb`)。
 *       env キー (`PUBLIC_API_KEY`) はユーザーに紐づかないため書き込み不可 (403)。
 * 認可: キー発行ユーザーがイベント主催者 (`Event.ownerId`)、または
 *       イベントの group の owner/admin であること。
 *
 * リクエストボディ (JSON): 追加対象は `nickname` または `user_id` のどちらか一方。
 *  - `nickname`      : 追加するユーザーのニックネーム
 *  - `user_id`       : 追加するユーザーの id
 *  - `event_role_id` : 参加枠 id (省略時は displayOrder 先頭の枠)
 *
 * 主催者によるゲスト追加なので定員・抽選を経由せず `accepted` で登録し、
 * `Event.acceptedCount` を increment する (キャンセル済みの再追加は復帰扱い)。
 *
 * レスポンス: 201 + 参加者オブジェクト (serializeForApi 形式)。
 * 既に参加済み (未キャンセル) の場合は 409。
 */
import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  corsPreflightResponse,
  errorResponse,
  guardRequestWithDb,
  jsonResponse,
  serializeForApi,
} from "@/lib/public-api";
import { nextId, withRetry } from "@/lib/id-gen";

export const dynamic = "force-dynamic";

export async function OPTIONS(): Promise<Response> {
  return corsPreflightResponse();
}

const AddParticipantBodySchema = z
  .object({
    nickname: z.string().trim().min(1).max(100).optional(),
    user_id: z
      .union([
        z.number().int().positive(),
        z.string().regex(/^\d+$/, "user_id must be a positive integer"),
      ])
      .optional(),
    event_role_id: z
      .union([
        z.number().int().positive(),
        z.string().regex(/^\d+$/, "event_role_id must be a positive integer"),
      ])
      .optional(),
  })
  .refine(
    (v) => (v.nickname !== undefined) !== (v.user_id !== undefined),
    "Exactly one of nickname / user_id is required",
  );

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const guard = await guardRequestWithDb(request, "write");
  if (!guard.ok) return guard.response;
  const { auth } = guard;

  if (auth.userId === undefined) {
    return errorResponse(
      403,
      "forbidden",
      "This API key is not associated with a user account",
    );
  }

  const { id: idRaw } = await context.params;
  const idNum = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(idNum) || idNum < 1) {
    return errorResponse(400, "bad_request", "Invalid event id");
  }
  const eventId = BigInt(idNum);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return errorResponse(400, "bad_request", "Request body must be valid JSON");
  }
  const parsed = AddParticipantBodySchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return errorResponse(
      400,
      "bad_request",
      `${issue?.path.join(".") || "body"}: ${issue?.message ?? "invalid"}`,
    );
  }
  const body = parsed.data;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return errorResponse(404, "not_found", `Event ${idRaw} not found`);
  }
  if (event.status === "cancelled") {
    return errorResponse(409, "conflict", "Event is cancelled");
  }

  // 認可: イベント主催者 or group owner/admin (Server 側で厳格チェック)
  let authorized = event.ownerId === auth.userId;
  if (!authorized) {
    const admin = await prisma.groupAdmin.findUnique({
      where: {
        groupId_userId: { groupId: event.groupId, userId: auth.userId },
      },
    });
    authorized = !!admin && (admin.role === "owner" || admin.role === "admin");
  }
  if (!authorized) {
    return errorResponse(
      403,
      "forbidden",
      "API key user must be the event owner or a group owner/admin",
    );
  }

  // 追加対象ユーザーの解決
  const targetUser = await prisma.user.findUnique({
    where:
      body.nickname !== undefined
        ? { nickname: body.nickname }
        : { id: BigInt(body.user_id!) },
  });
  if (!targetUser || targetUser.status !== "active") {
    return errorResponse(404, "not_found", "Target user not found");
  }

  // グループブラックリスト登録済みユーザーは追加不可 (joinEvent と同じガード)
  const blacklisted = await prisma.groupBlacklist.findUnique({
    where: {
      groupId_userId: { groupId: event.groupId, userId: targetUser.id },
    },
  });
  if (blacklisted) {
    return errorResponse(
      403,
      "forbidden",
      "Target user is blacklisted in this group",
    );
  }

  // 参加枠の解決 (指定なしは displayOrder 先頭)
  let role: { id: bigint; eventId: bigint; name: string } | null;
  if (body.event_role_id !== undefined) {
    role = await prisma.eventRole.findUnique({
      where: { id: BigInt(body.event_role_id) },
      select: { id: true, eventId: true, name: true },
    });
    if (!role || role.eventId !== eventId) {
      return errorResponse(404, "not_found", "Event role not found");
    }
  } else {
    role = await prisma.eventRole.findFirst({
      where: { eventId },
      orderBy: { displayOrder: "asc" },
      select: { id: true, eventId: true, name: true },
    });
    if (!role) {
      return errorResponse(409, "conflict", "Event has no participation roles");
    }
  }
  const eventRoleId = role.id;

  // 既存参加チェック (キャンセル済み以外が居れば 409)
  const existing = await prisma.participant.findFirst({
    where: { eventId, userId: targetUser.id, status: { not: "cancelled" } },
    select: { id: true },
  });
  if (existing) {
    return errorResponse(
      409,
      "conflict",
      "User is already a participant of this event",
    );
  }

  const now = new Date();
  const created = await withRetry(() =>
    prisma.$transaction(async (tx) => {
      // キャンセル済みレコードがあれば復帰させる (UNIQUE を汚さない)
      const cancelled = await tx.participant.findFirst({
        where: { eventId, userId: targetUser.id, status: "cancelled" },
      });
      let participant;
      if (cancelled) {
        participant = await tx.participant.update({
          where: { id: cancelled.id },
          data: {
            eventRoleId,
            status: "accepted",
            acceptedAt: now,
            cancelledAt: null,
            waitingPosition: null,
          },
        });
      } else {
        participant = await tx.participant.create({
          data: {
            id: await nextId(tx, "participant"),
            eventId,
            eventRoleId,
            userId: targetUser.id,
            status: "accepted",
            appliedAt: now,
            acceptedAt: now,
          },
        });
      }
      await tx.event.update({
        where: { id: eventId },
        data: { acceptedCount: { increment: 1 } },
      });
      return participant;
    }),
  );

  return jsonResponse(
    serializeForApi({
      id: Number(created.id),
      event_id: Number(eventId),
      event_role_id: Number(eventRoleId),
      event_role_name: role.name,
      user_id: Number(targetUser.id),
      nickname: targetUser.nickname,
      display_name: targetUser.displayName,
      status: created.status,
      applied_at: created.appliedAt.toISOString(),
      accepted_at: created.acceptedAt ? created.acceptedAt.toISOString() : null,
    }),
    { status: 201 },
  );
}
