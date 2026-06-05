import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import EventTimeline from "./EventTimeline";
import type { EventCardData } from "./EventCard";

const meta: Meta<typeof EventTimeline> = {
  title: "Organisms/EventTimeline",
  component: EventTimeline,
  parameters: { layout: "padded" },
  argTypes: {
    groupByMonth: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof EventTimeline>;

const baseGroup = {
  id: "g1",
  name: "TypeScript JP",
  iconUrl: "https://placehold.co/40x40/ea5404/ffffff?text=TS",
  url: "/group/tsj",
};

function makeEvent(
  i: number,
  isoDate: string,
  overrides: Partial<EventCardData> = {},
): EventCardData {
  return {
    id: `e-${i}`,
    title: `イベント ${i} - TypeScript Meetup vol.${i}`,
    startedAt: isoDate,
    status: "open",
    location: { type: "offline", prefecture: "東京都" },
    accepted: 12 + i,
    limit: 50,
    group: baseGroup,
    hashtags: ["TypeScript"],
    ...overrides,
  };
}

/**
 * Default: 同一月内に複数イベントが並ぶケース (2026年06月のみ)。
 * 単一月見出しの表示確認とリスト並びの基本ケース。
 */
export const Default: Story = {
  args: {
    heading: "Hosting",
    events: [
      makeEvent(1, "2026-06-03T19:00:00+09:00"),
      makeEvent(2, "2026-06-12T19:30:00+09:00", {
        location: { type: "online", platform: "Zoom" },
        status: "full",
      }),
      makeEvent(3, "2026-06-21T13:00:00+09:00"),
    ],
  },
  render: (args) => (
    <div className="w-full max-w-3xl">
      <EventTimeline {...args} />
    </div>
  ),
};

/**
 * WithGap: 月跨ぎ (2026年6月 → 8月、7月は空) のセクション分割を視覚的に確認。
 */
export const WithGap: Story = {
  args: {
    heading: "Going",
    events: [
      makeEvent(1, "2026-06-03T19:00:00+09:00"),
      makeEvent(2, "2026-06-30T19:30:00+09:00"),
      makeEvent(3, "2026-08-01T10:00:00+09:00", { status: "upcoming" }),
      makeEvent(4, "2026-08-15T19:00:00+09:00", {
        location: { type: "hybrid", prefecture: "大阪府" },
      }),
      makeEvent(5, "2026-09-04T19:00:00+09:00"),
    ],
  },
  render: (args) => (
    <div className="w-full max-w-3xl">
      <EventTimeline {...args} />
    </div>
  ),
};

/**
 * Empty: 0 件時の Empty State 表示。
 */
export const Empty: Story = {
  args: {
    heading: "Hosted",
    events: [],
    emptyMessage: "主催したイベントはまだありません",
  },
  render: (args) => (
    <div className="w-full max-w-3xl">
      <EventTimeline {...args} />
    </div>
  ),
};

/**
 * OneMonth: 単一月に多数のイベントが集中するケース。
 * 月見出しに件数表示が付くことを確認。
 */
export const OneMonth: Story = {
  args: {
    heading: "Materials",
    events: [
      makeEvent(1, "2026-07-02T19:00:00+09:00", { status: "ended" }),
      makeEvent(2, "2026-07-08T19:30:00+09:00", { status: "ended" }),
      makeEvent(3, "2026-07-14T13:00:00+09:00", { status: "ended" }),
      makeEvent(4, "2026-07-21T19:00:00+09:00", { status: "ended" }),
      makeEvent(5, "2026-07-28T19:00:00+09:00", { status: "ended" }),
    ],
  },
  render: (args) => (
    <div className="w-full max-w-3xl">
      <EventTimeline {...args} />
    </div>
  ),
};
