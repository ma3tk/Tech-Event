import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import EventStatusBadge, {
  EVENT_STATUSES,
  type EventStatus,
} from "./EventStatusBadge";

const meta: Meta<typeof EventStatusBadge> = {
  title: "Components/EventStatusBadge",
  component: EventStatusBadge,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "イベントの募集/開催ステータスを表すバッジ。色のみに依存させないため、ラベルテキストを必ず表示する。",
      },
    },
  },
  argTypes: {
    status: {
      control: "select",
      options: EVENT_STATUSES,
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    variant: {
      control: "inline-radio",
      options: ["subtle", "solid", "outline", "dot"],
    },
  },
};

export default meta;

type Story = StoryObj<typeof EventStatusBadge>;

export const Default: Story = {
  args: { status: "open" },
};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 bg-surface p-4">
      {EVENT_STATUSES.map((s: EventStatus) => (
        <EventStatusBadge key={s} status={s} />
      ))}
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-3 bg-surface p-4">
      {(["subtle", "solid", "outline"] as const).map((v) => (
        <div key={v} className="flex items-center gap-2">
          <span className="w-16 text-xs text-muted-foreground">{v}</span>
          <EventStatusBadge status="open" variant={v} />
          <EventStatusBadge status="full" variant={v} />
          <EventStatusBadge status="waitlist" variant={v} />
          <EventStatusBadge status="cancelled" variant={v} />
        </div>
      ))}
      <div className="flex items-center gap-2">
        <span className="w-16 text-xs text-muted-foreground">dot</span>
        <EventStatusBadge status="open" variant="dot" />
        <EventStatusBadge status="full" variant="dot" />
        <EventStatusBadge status="waitlist" variant="dot" />
        <EventStatusBadge status="cancelled" variant="dot" />
      </div>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3 bg-surface p-4">
      <EventStatusBadge status="open" size="sm" />
      <EventStatusBadge status="open" size="md" />
      <EventStatusBadge status="open" size="lg" />
    </div>
  ),
};

export const CustomLabel: Story = {
  args: { status: "open", label: "募集中 (残り3名)" },
};
