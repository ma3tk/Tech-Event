/**
 * connpass v2 互換レスポンスへの変換マッパー群。
 *
 * 公開 API の各 route から共通利用する。Prisma の Event/Group/User レコードから、
 * v2 schema 準拠の JSON 形に整形する。
 */
import type {
  Event as PrismaEvent,
  Group as PrismaGroup,
  User as PrismaUser,
} from "@/generated/prisma";

export type EventForApi = PrismaEvent & {
  group: PrismaGroup;
  owner: PrismaUser;
};

/** Event 状態 → connpass の open_status */
export function deriveOpenStatus(
  status: string,
  startedAt: Date,
  endedAt: Date,
  now: Date = new Date(),
): string {
  if (status === "cancelled") return "cancelled";
  const t = now.getTime();
  if (t < startedAt.getTime()) return "preopen";
  if (t > endedAt.getTime()) return "close";
  return "open";
}

/** Event → connpass v2 互換 JSON */
export function toApiEvent(
  e: EventForApi,
  base: string,
  now: Date = new Date(),
): Record<string, unknown> {
  return {
    id: Number(e.id),
    title: e.title,
    catch: e.catchPhrase,
    description: e.description,
    url: `${base}/event/${e.id.toString()}`,
    image_url: e.coverImageUrl,
    hash_tag: e.hashTag,
    started_at: e.startedAt.toISOString(),
    ended_at: e.endedAt.toISOString(),
    published_at: e.publishedAt ? e.publishedAt.toISOString() : null,
    limit: e.capacity,
    event_type: e.eventType,
    open_status: deriveOpenStatus(e.status, e.startedAt, e.endedAt, now),
    group: {
      id: Number(e.group.id),
      subdomain: e.group.subdomain,
      title: e.group.name,
      url: `${base}/group/${e.group.id.toString()}`,
    },
    address: e.address,
    place: e.place,
    lat: e.lat,
    lon: e.lon,
    owner_id: Number(e.ownerId),
    owner_nickname: e.owner.nickname,
    owner_display_name: e.ownerDisplayName ?? e.owner.displayName,
    accepted: e.acceptedCount,
    waiting: e.waitingCount,
    updated_at: e.updatedAt.toISOString(),
  };
}

/** リクエストヘッダから絶対URLのベースを推定 */
export function deriveBaseUrl(request: Request): string {
  const protocol = request.headers.get("x-forwarded-proto") ?? "http";
  const host = request.headers.get("host") ?? "localhost:3000";
  return `${protocol}://${host}`;
}
