/**
 * Client Component に渡すための、シリアライズ済み (BigInt→string, Date→string ISO)
 * の型定義。
 *
 * - `Serialized*` 系は `src/lib/serialize.ts` の `Replace*` ユーティリティと
 *   一致させる必要がある。
 * - リレーションを含む集約 (例: イベント詳細用に group/owner/tags/roles ... を
 *   含めたもの) は `*With*` 型として定義する。
 */

export type {
  SerializedUser,
  SerializedGroup,
  SerializedGroupAdmin,
  SerializedGroupMember,
  SerializedEvent,
  SerializedEventRole,
  SerializedParticipant,
  SerializedComment,
  SerializedTag,
  SerializedEventTag,
  SerializedPresentationMaterial,
} from "@/lib/serialize";

import type {
  SerializedComment,
  SerializedEvent,
  SerializedEventRole,
  SerializedGroup,
  SerializedParticipant,
  SerializedPresentationMaterial,
  SerializedTag,
  SerializedUser,
} from "@/lib/serialize";

/* ============================================================
 * 文字列リテラル型 (DB は string 列で保持しているが、UI 側では narrow したい)
 * ============================================================ */

export type EventStatus = "draft" | "published" | "closed" | "cancelled";
export type EventVisibility = "public" | "private_link" | "draft";
export type EventFormat = "offline" | "online" | "hybrid";
export type RecruitmentMethod = "fcfs" | "lottery";
export type ParticipantStatus =
  | "pending"
  | "accepted"
  | "waiting"
  | "cancelled"
  | "attended"
  | "no_show";
export type GroupAdminRole = "owner" | "admin";

/* ============================================================
 * 集約型
 * ============================================================ */

/**
 * 一覧カード表示で必要となる最小集約。
 */
export type EventCardData = SerializedEvent & {
  group: Pick<SerializedGroup, "id" | "name" | "subdomain" | "thumbnailUrl">;
  tags: SerializedTag[];
};

/**
 * イベント詳細ページで必要となる集約。
 *
 * `participants` は accepted のサンプル (アバター列表示用)。
 */
export type EventDetailData = SerializedEvent & {
  group: SerializedGroup;
  owner: Pick<SerializedUser, "id" | "nickname" | "displayName" | "avatarUrl">;
  roles: SerializedEventRole[];
  tags: SerializedTag[];
  participants: (SerializedParticipant & {
    user: Pick<SerializedUser, "id" | "nickname" | "displayName" | "avatarUrl">;
  })[];
  comments: (SerializedComment & {
    user: Pick<SerializedUser, "id" | "nickname" | "displayName" | "avatarUrl">;
  })[];
  presentations: SerializedPresentationMaterial[];
};

/**
 * グループ詳細ページの集約。
 */
export type GroupDetailData = SerializedGroup & {
  upcomingEvents: EventCardData[];
  pastEvents: EventCardData[];
  memberCount: number;
};
