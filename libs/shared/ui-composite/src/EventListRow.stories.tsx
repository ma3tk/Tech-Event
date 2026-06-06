import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import EventListRow from "./EventListRow";
import type { EventCardData } from "./EventCard";

const meta: Meta<typeof EventListRow> = {
  title: "Components/EventListRow",
  component: EventListRow,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "1 行 88-96px の高密度フォーマット。検索結果 / ランキング / タイムラインの内部要素として使う。Design.md §5.4 厳格仕様準拠。\n\n**カタログ**: [docs/catalog/03-organisms/event-list-row.md](https://github.com/findyinc/tech-event/blob/main/docs/catalog/03-organisms/event-list-row.md) — 使い分けガイド",
      },
    },
  },
  argTypes: {
    showRank: { control: { type: "number", min: 1 } },
    compact: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof EventListRow>;

const baseEvent: EventCardData = {
  id: "e1",
  title: "第 42 回 TypeScript Meetup - 型システム再入門",
  startedAt: "2026-06-15T19:00:00+09:00",
  status: "open",
  location: { type: "offline", prefecture: "東京都" },
  accepted: 23,
  limit: 50,
  group: {
    id: "g1",
    name: "TypeScript JP",
    iconUrl: "https://placehold.co/40x40/ea5404/ffffff?text=TS",
  },
  hashtags: ["TypeScript"],
};

export const Default: Story = {
  args: { event: baseEvent },
  render: (args) => (
    <div className="w-full max-w-3xl">
      <EventListRow {...args} />
    </div>
  ),
};

export const Compact: Story = {
  args: { event: baseEvent, compact: true },
  render: (args) => (
    <div className="w-full max-w-3xl">
      <EventListRow {...args} />
    </div>
  ),
};

export const Rank1: Story = {
  args: { event: baseEvent, showRank: 1 },
  render: (args) => (
    <div className="w-full max-w-3xl">
      <EventListRow {...args} />
    </div>
  ),
};

export const Rank2: Story = {
  args: { event: baseEvent, showRank: 2 },
  render: (args) => (
    <div className="w-full max-w-3xl">
      <EventListRow {...args} />
    </div>
  ),
};

export const Rank3: Story = {
  args: { event: baseEvent, showRank: 3 },
  render: (args) => (
    <div className="w-full max-w-3xl">
      <EventListRow {...args} />
    </div>
  ),
};

export const Rank10: Story = {
  args: { event: baseEvent, showRank: 10 },
  render: (args) => (
    <div className="w-full max-w-3xl">
      <EventListRow {...args} />
    </div>
  ),
};

export const ListOfRows: Story = {
  render: () => (
    <div className="w-full max-w-3xl divide-y divide-border rounded-md border border-border bg-surface">
      {(
        [
          { title: "React Meetup #88", status: "open", accepted: 30, limit: 50 },
          {
            title: "Next.js 16 リリースパーティ",
            status: "full",
            accepted: 100,
            limit: 100,
          },
          {
            title: "TypeScript x AI ワークショップ",
            status: "waitlist",
            accepted: 80,
            limit: 80,
          },
          {
            title: "終了済みの過去イベント",
            status: "ended",
            accepted: 42,
            limit: 50,
          },
        ] as const
      ).map((row, i) => (
        <EventListRow
          key={i}
          event={{
            ...baseEvent,
            id: `e${i}`,
            title: row.title,
            status: row.status,
            accepted: row.accepted,
            limit: row.limit,
          }}
        />
      ))}
    </div>
  ),
};

export const Ranking: Story = {
  render: () => (
    <div className="w-full max-w-3xl divide-y divide-border rounded-md border border-border bg-surface">
      {[1, 2, 3, 4, 5].map((rank) => (
        <EventListRow
          key={rank}
          showRank={rank}
          event={{
            ...baseEvent,
            id: `e${rank}`,
            title: `第 ${rank} 位のイベント`,
          }}
        />
      ))}
    </div>
  ),
};

export const OnlineEvent: Story = {
  args: {
    event: {
      ...baseEvent,
      location: { type: "online", platform: "Zoom" },
    },
  },
  render: (args) => (
    <div className="w-full max-w-3xl">
      <EventListRow {...args} />
    </div>
  ),
};

/**
 * thumbnailUrl を指定したケース。カバレッジ表の「サムネ有 100%」の根拠ストーリー。
 * Picsum で安定したダミー画像を生成 (seed 固定で常に同じ画像)。
 */
export const WithThumbnail: Story = {
  args: {
    event: {
      ...baseEvent,
      title: "サムネイル画像ありイベント - フロントエンドカンファレンス",
      thumbnailUrl: "https://picsum.photos/seed/listrow-thumb-1/640/360",
    },
  },
  render: (args) => (
    <div className="w-full max-w-3xl">
      <EventListRow {...args} />
    </div>
  ),
};

export const WithThumbnailCompact: Story = {
  args: {
    event: {
      ...baseEvent,
      title: "サムネ + compact",
      thumbnailUrl: "https://picsum.photos/seed/listrow-thumb-2/640/360",
    },
    compact: true,
  },
  render: (args) => (
    <div className="w-full max-w-3xl">
      <EventListRow {...args} />
    </div>
  ),
};

export const WithThumbnailRank1: Story = {
  args: {
    event: {
      ...baseEvent,
      title: "サムネ + ランキング1位",
      thumbnailUrl: "https://picsum.photos/seed/listrow-thumb-3/640/360",
    },
    showRank: 1,
  },
  render: (args) => (
    <div className="w-full max-w-3xl">
      <EventListRow {...args} />
    </div>
  ),
};
