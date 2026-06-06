import EventCard, { type EventCardData } from "./EventCard";

export type EventCardCompactProps = {
  event: EventCardData;
  className?: string;
};

/**
 * コンパクトな縦型イベントカード。
 *
 * 実体は `EventCard` の `variant="grid"` バリアントへの薄いラッパー。
 * グリッド一覧 (`grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`)
 * での利用を想定。
 */
export default function EventCardCompact({
  event,
  className,
}: EventCardCompactProps) {
  return <EventCard event={event} variant="grid" className={className} />;
}
