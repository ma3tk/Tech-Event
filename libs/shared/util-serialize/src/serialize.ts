/**
 * Prisma の返り値を Next.js の Client Component に渡すためのシリアライズヘルパー。
 *
 * - Prisma の `BigInt` 主キー / FK はそのままだと JSON 化できず、
 *   Server -> Client の boundary で `Error: Only plain objects ... can be passed` になる。
 * - そこで全 BigInt を文字列 (`"123"`) に変換し、Date は ISO 文字列に変換する。
 */

import type {
  Event,
  EventRole,
  Group,
  GroupAdmin,
  GroupMember,
  User,
  Participant,
  Comment,
  Tag,
  EventTag,
  PresentationMaterial,
} from "@/generated/prisma";

/* ============================================================
 * primitive helpers
 * ============================================================ */

export function bigintToString(value: bigint): string {
  return value.toString();
}

export function nullableBigintToString(
  value: bigint | null | undefined,
): string | null {
  return value == null ? null : value.toString();
}

export function dateToIso(value: Date): string {
  return value.toISOString();
}

export function nullableDateToIso(
  value: Date | null | undefined,
): string | null {
  return value == null ? null : value.toISOString();
}

/* ============================================================
 * 型 (Serialized*)
 *
 * Prisma 生成型の BigInt -> string, Date -> string に変換した形。
 * ============================================================ */

type ReplaceBigIntAndDate<T> = {
  [K in keyof T]: T[K] extends bigint
    ? string
    : T[K] extends bigint | null
      ? string | null
      : T[K] extends Date
        ? string
        : T[K] extends Date | null
          ? string | null
          : T[K];
};

export type SerializedUser = ReplaceBigIntAndDate<User>;
export type SerializedGroup = ReplaceBigIntAndDate<Group>;
export type SerializedGroupAdmin = ReplaceBigIntAndDate<GroupAdmin>;
export type SerializedGroupMember = ReplaceBigIntAndDate<GroupMember>;
export type SerializedEvent = ReplaceBigIntAndDate<Event>;
export type SerializedEventRole = ReplaceBigIntAndDate<EventRole>;
export type SerializedParticipant = ReplaceBigIntAndDate<Participant>;
export type SerializedComment = ReplaceBigIntAndDate<Comment>;
export type SerializedTag = ReplaceBigIntAndDate<Tag>;
export type SerializedEventTag = ReplaceBigIntAndDate<EventTag>;
export type SerializedPresentationMaterial =
  ReplaceBigIntAndDate<PresentationMaterial>;

/* ============================================================
 * model -> serialized 変換関数
 * ============================================================ */

export function serializeUser(user: User): SerializedUser {
  return {
    ...user,
    id: user.id.toString(),
    emailVerifiedAt: nullableDateToIso(user.emailVerifiedAt),
    withdrawnAt: nullableDateToIso(user.withdrawnAt),
    lastLoginAt: nullableDateToIso(user.lastLoginAt),
    createdAt: dateToIso(user.createdAt),
    updatedAt: dateToIso(user.updatedAt),
  } as SerializedUser;
}

export function serializeGroup(group: Group): SerializedGroup {
  return {
    ...group,
    id: group.id.toString(),
    publishedAt: dateToIso(group.publishedAt),
    createdAt: dateToIso(group.createdAt),
    updatedAt: dateToIso(group.updatedAt),
  } as SerializedGroup;
}

export function serializeEvent(event: Event): SerializedEvent {
  return {
    ...event,
    id: event.id.toString(),
    groupId: event.groupId.toString(),
    ownerId: event.ownerId.toString(),
    parentEventId: nullableBigintToString(event.parentEventId),
    startedAt: dateToIso(event.startedAt),
    endedAt: dateToIso(event.endedAt),
    acceptsFrom: nullableDateToIso(event.acceptsFrom),
    acceptsUntil: nullableDateToIso(event.acceptsUntil),
    lotteryAnnounceAt: nullableDateToIso(event.lotteryAnnounceAt),
    publishedAt: nullableDateToIso(event.publishedAt),
    createdAt: dateToIso(event.createdAt),
    updatedAt: dateToIso(event.updatedAt),
  } as SerializedEvent;
}

export function serializeEventRole(role: EventRole): SerializedEventRole {
  return {
    ...role,
    id: role.id.toString(),
    eventId: role.eventId.toString(),
    createdAt: dateToIso(role.createdAt),
    updatedAt: dateToIso(role.updatedAt),
  } as SerializedEventRole;
}

export function serializeParticipant(p: Participant): SerializedParticipant {
  return {
    ...p,
    id: p.id.toString(),
    eventId: p.eventId.toString(),
    eventRoleId: p.eventRoleId.toString(),
    userId: p.userId.toString(),
    paymentId: nullableBigintToString(p.paymentId),
    appliedAt: dateToIso(p.appliedAt),
    acceptedAt: nullableDateToIso(p.acceptedAt),
    cancelledAt: nullableDateToIso(p.cancelledAt),
    checkInAt: nullableDateToIso(p.checkInAt),
    createdAt: dateToIso(p.createdAt),
    updatedAt: dateToIso(p.updatedAt),
  } as SerializedParticipant;
}

export function serializeComment(c: Comment): SerializedComment {
  return {
    ...c,
    id: c.id.toString(),
    eventId: c.eventId.toString(),
    userId: c.userId.toString(),
    parentCommentId: nullableBigintToString(c.parentCommentId),
    createdAt: dateToIso(c.createdAt),
    deletedAt: nullableDateToIso(c.deletedAt),
  } as SerializedComment;
}

export function serializeTag(t: Tag): SerializedTag {
  return {
    ...t,
    id: t.id.toString(),
  } as SerializedTag;
}

export function serializePresentationMaterial(
  m: PresentationMaterial,
): SerializedPresentationMaterial {
  return {
    ...m,
    id: m.id.toString(),
    eventId: m.eventId.toString(),
    presenterUserId: nullableBigintToString(m.presenterUserId),
    postedAt: dateToIso(m.postedAt),
  } as SerializedPresentationMaterial;
}

/* ============================================================
 * 汎用シリアライザ
 *
 * 任意ネストの object/array に対し BigInt -> string, Date -> ISO 文字列の
 * 変換を再帰的に行う。型情報は失われるので、可能なら上の専用関数を使うこと。
 * ============================================================ */

export function serializeDeep<T>(value: T): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((v) => serializeDeep(v));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = serializeDeep(v);
    }
    return out;
  }
  return value;
}
