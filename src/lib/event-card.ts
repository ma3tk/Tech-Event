/**
 * Prisma の `Event` レコード (group / tags を include したもの) を、
 * `<EventCard>` が受け取る `EventCardData` に変換するヘルパー群。
 *
 * - status の正規化 (Prisma の `draft|published|closed|cancelled` を、
 *   UI 表示用の `upcoming|open|full|waitlist|closed|cancelled|ended|ongoing` に
 *   寄せる)
 * - location の組み立て (`eventFormat` + `address` から discriminated union を生成)
 * - BigInt → string への変換
 */
import type {
  EventCardData as EventCardComponentData,
  EventLocation,
} from "@/components/EventCard";
import type { EventStatus } from "@/components/EventStatusBadge";
import type {
  Event as PrismaEvent,
  Group as PrismaGroup,
  Tag as PrismaTag,
} from "@/generated/prisma";

type EventWithRelations = PrismaEvent & {
  group: PrismaGroup;
  tags: Array<{ tag: PrismaTag }>;
};

/**
 * Event レコードから UI 用 EventStatus を導出する。
 *
 * 「終了」「満員」など UI の状態は startedAt / endedAt / capacity / acceptedCount
 * の組み合わせで決まるため、ここでまとめて判定する。
 */
export function deriveUiEventStatus(
  e: Pick<
    PrismaEvent,
    | "status"
    | "startedAt"
    | "endedAt"
    | "capacity"
    | "acceptedCount"
    | "acceptsFrom"
    | "acceptsUntil"
  >,
  now: Date = new Date(),
): EventStatus {
  if (e.status === "cancelled") return "cancelled";
  if (e.status === "draft") return "upcoming";

  if (now > e.endedAt) return "ended";
  if (now >= e.startedAt && now <= e.endedAt) return "ongoing";

  // 開催前: 募集状況で細かく判定
  const full =
    e.capacity != null && e.acceptedCount >= e.capacity ? true : false;
  if (full) return "full";

  if (e.acceptsUntil && now > e.acceptsUntil) return "closed";
  if (e.acceptsFrom && now < e.acceptsFrom) return "upcoming";

  return "open";
}

/** Event レコードから UI 用 EventLocation を組み立てる */
export function deriveUiLocation(
  e: Pick<PrismaEvent, "eventFormat" | "address" | "place" | "onlineUrl">,
): EventLocation {
  if (e.eventFormat === "online") {
    return { type: "online", platform: e.place ?? undefined };
  }
  if (e.eventFormat === "hybrid") {
    return {
      type: "hybrid",
      prefecture: e.place ?? e.address ?? "未定",
      address: e.address ?? undefined,
    };
  }
  return {
    type: "offline",
    prefecture: e.place ?? e.address ?? "未定",
    address: e.address ?? undefined,
  };
}

/** Prisma の Event レコード -> EventCard が受け取るデータ */
export function toEventCardData(
  e: EventWithRelations,
  now: Date = new Date(),
): EventCardComponentData {
  return {
    id: e.id.toString(),
    title: e.title,
    catchPhrase: e.catchPhrase ?? undefined,
    startedAt: e.startedAt.toISOString(),
    endedAt: e.endedAt.toISOString(),
    status: deriveUiEventStatus(e, now),
    thumbnailUrl: e.coverImageUrl ?? undefined,
    location: deriveUiLocation(e),
    accepted: e.acceptedCount,
    limit: e.capacity,
    group: {
      id: e.group.id.toString(),
      name: e.group.name,
      iconUrl: e.group.thumbnailUrl ?? undefined,
      url: `/group/${e.group.id.toString()}`,
    },
    hashtags: e.hashTag
      ? e.hashTag
          .split(/[\s,]+/)
          .map((t) => t.replace(/^#/, "").trim())
          .filter((t) => t.length > 0)
      : undefined,
    href: `/event/${e.id.toString()}`,
  };
}
