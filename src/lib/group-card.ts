/**
 * Prisma の `Group` レコードを `<GroupCard>` の `GroupCardData` に変換する。
 */
import type { GroupCardData } from "@/components/GroupCard";
import type { Group as PrismaGroup } from "@/generated/prisma";

export function toGroupCardData(g: PrismaGroup): GroupCardData {
  return {
    id: g.id.toString(),
    name: g.name,
    description: g.description ?? undefined,
    logoUrl: g.thumbnailUrl ?? g.coverImageUrl ?? undefined,
    url: `/group/${g.id.toString()}`,
    memberCount: g.memberCount,
    eventCount: g.eventCount,
  };
}
