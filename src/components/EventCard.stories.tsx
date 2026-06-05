import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import EventCard, { type EventCardData } from "./EventCard";

const meta: Meta<typeof EventCard> = {
  title: "Organisms/EventCard",
  component: EventCard,
  parameters: { layout: "padded" },
  argTypes: {
    variant: { control: "inline-radio", options: ["list", "grid"] },
  },
};

export default meta;

type Story = StoryObj<typeof EventCard>;

const baseEvent: EventCardData = {
  id: "e1",
  title: "第 42 回 TypeScript Meetup - 型システム再入門",
  catchPhrase:
    "TypeScript の型システムをゼロから学び直す勉強会。LT と懇親会あり。",
  startedAt: "2026-06-15T19:00:00+09:00",
  endedAt: "2026-06-15T21:30:00+09:00",
  status: "open",
  location: { type: "offline", prefecture: "東京都", address: "渋谷区" },
  accepted: 23,
  limit: 50,
  group: {
    id: "g1",
    name: "TypeScript JP",
    iconUrl: "https://placehold.co/40x40/ea5404/ffffff?text=TS",
  },
  hashtags: ["TypeScript", "勉強会", "渋谷", "LT"],
};

export const ListDefault: Story = {
  args: { event: baseEvent, variant: "list" },
};

export const GridDefault: Story = {
  args: { event: baseEvent, variant: "grid" },
  render: (args) => (
    <div className="w-72">
      <EventCard {...args} />
    </div>
  ),
};

export const Online: Story = {
  args: {
    event: {
      ...baseEvent,
      title: "オンライン LT 大会",
      location: { type: "online", platform: "Zoom" },
    },
  },
};

export const Hybrid: Story = {
  args: {
    event: {
      ...baseEvent,
      title: "ハイブリッド開催 - 会場 + オンライン同時配信",
      location: { type: "hybrid", prefecture: "大阪府" },
    },
  },
};

export const Full: Story = {
  args: {
    event: { ...baseEvent, status: "full", accepted: 50, limit: 50 },
  },
};

export const Waitlist: Story = {
  args: {
    event: { ...baseEvent, status: "waitlist", accepted: 50, limit: 50 },
  },
};

export const Cancelled: Story = {
  args: { event: { ...baseEvent, status: "cancelled" } },
};

export const Ended: Story = {
  args: { event: { ...baseEvent, status: "ended" } },
};

export const NoThumbnail: Story = {
  args: { event: { ...baseEvent, thumbnailUrl: undefined } },
};

export const NoLimit: Story = {
  args: { event: { ...baseEvent, limit: null } },
};

export const GridGallery: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {(["open", "full", "upcoming", "ended", "cancelled", "waitlist"] as const).map(
        (status, i) => (
          <EventCard
            key={status}
            variant="grid"
            event={{
              ...baseEvent,
              id: `e${i}`,
              title: `${status} のイベント例 ${i + 1}`,
              status,
            }}
          />
        ),
      )}
    </div>
  ),
};

/**
 * 全 8 status × list/grid variant の網羅ストーリー。
 * カバレッジ表の "EventCard status 100%" の根拠ストーリー。
 */
export const AllStatusesListVariant: Story = {
  render: () => {
    const statuses = [
      "upcoming",
      "open",
      "full",
      "waitlist",
      "closed",
      "cancelled",
      "ended",
      "ongoing",
    ] as const;
    return (
      <div className="flex flex-col gap-3">
        {statuses.map((status, i) => (
          <EventCard
            key={status}
            variant="list"
            event={{
              ...baseEvent,
              id: `list-${i}`,
              title: `[${status}] のイベント例`,
              status,
            }}
          />
        ))}
      </div>
    );
  },
};

export const AllStatusesGridVariant: Story = {
  render: () => {
    const statuses = [
      "upcoming",
      "open",
      "full",
      "waitlist",
      "closed",
      "cancelled",
      "ended",
      "ongoing",
    ] as const;
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statuses.map((status, i) => (
          <EventCard
            key={status}
            variant="grid"
            event={{
              ...baseEvent,
              id: `grid-${i}`,
              title: `[${status}] のイベント例`,
              status,
            }}
          />
        ))}
      </div>
    );
  },
};
