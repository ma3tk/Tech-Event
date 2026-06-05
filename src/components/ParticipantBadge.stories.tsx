import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ParticipantBadge from "./ParticipantBadge";

const meta: Meta<typeof ParticipantBadge> = {
  title: "Molecules/ParticipantBadge",
  component: ParticipantBadge,
  parameters: { layout: "padded" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    iconOnly: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof ParticipantBadge>;

export const Default: Story = {
  args: { nickname: "tanaka_san" },
};

export const WithAvatar: Story = {
  args: {
    nickname: "tanaka_san",
    avatarUrl: "https://i.pravatar.cc/64?img=8",
  },
};

export const WithUserObject: Story = {
  args: {
    user: {
      id: "u1",
      nickname: "yamada",
      displayName: "山田 太郎",
      avatarUrl: "https://i.pravatar.cc/64?img=15",
    },
  },
};

export const WithMeta: Story = {
  args: {
    nickname: "tanaka_san",
    avatarUrl: "https://i.pravatar.cc/64?img=22",
    ticketName: "一般枠",
    status: "参加確定",
    appliedAt: "2026-05-20T10:00:00+09:00",
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6 bg-surface p-4">
      <ParticipantBadge nickname="sm" size="sm" />
      <ParticipantBadge nickname="md" size="md" />
      <ParticipantBadge nickname="lg" size="lg" />
    </div>
  ),
};

export const IconOnly: Story = {
  args: {
    nickname: "tanaka_san",
    avatarUrl: "https://i.pravatar.cc/64?img=33",
    iconOnly: true,
  },
};

export const WithProfileLink: Story = {
  args: {
    nickname: "tanaka_san",
    profileUrl: "/user/tanaka",
    avatarUrl: "https://i.pravatar.cc/64?img=44",
  },
};

export const ParticipantList: Story = {
  render: () => (
    <ul className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface">
      {[
        { name: "tanaka", ticket: "一般枠", date: "2026-05-20T10:00:00+09:00" },
        { name: "yamada", ticket: "学生枠", date: "2026-05-21T14:30:00+09:00" },
        { name: "suzuki", ticket: "一般枠", date: "2026-05-22T09:00:00+09:00" },
      ].map((p, i) => (
        <li key={p.name} className="p-3">
          <ParticipantBadge
            nickname={p.name}
            avatarUrl={`https://i.pravatar.cc/64?img=${i + 1}`}
            ticketName={p.ticket}
            appliedAt={p.date}
          />
        </li>
      ))}
    </ul>
  ),
};

/**
 * DiceBear (identicon) で安定したアバター画像を生成するパターン。
 * カバレッジ表の "ParticipantBadge avatarUrl 100%" の根拠ストーリー。
 * - https://api.dicebear.com/9.x/identicon/svg?seed=<name>
 */
export const WithDiceBearAvatar: Story = {
  render: () => (
    <div className="flex flex-col gap-4 bg-surface p-4">
      <div className="flex flex-wrap items-center gap-6">
        <ParticipantBadge
          nickname="dicebear_sm"
          size="sm"
          avatarUrl="https://api.dicebear.com/9.x/identicon/svg?seed=dicebear-sm"
        />
        <ParticipantBadge
          nickname="dicebear_md"
          size="md"
          avatarUrl="https://api.dicebear.com/9.x/identicon/svg?seed=dicebear-md"
        />
        <ParticipantBadge
          nickname="dicebear_lg"
          size="lg"
          avatarUrl="https://api.dicebear.com/9.x/identicon/svg?seed=dicebear-lg"
        />
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <ParticipantBadge
          nickname="iconOnly_sm"
          size="sm"
          iconOnly
          avatarUrl="https://api.dicebear.com/9.x/identicon/svg?seed=icon-only-sm"
        />
        <ParticipantBadge
          nickname="iconOnly_md"
          size="md"
          iconOnly
          avatarUrl="https://api.dicebear.com/9.x/identicon/svg?seed=icon-only-md"
        />
        <ParticipantBadge
          nickname="iconOnly_lg"
          size="lg"
          iconOnly
          avatarUrl="https://api.dicebear.com/9.x/identicon/svg?seed=icon-only-lg"
        />
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <ParticipantBadge
          nickname="with_link"
          avatarUrl="https://api.dicebear.com/9.x/identicon/svg?seed=with-link"
          profileUrl="/user/with-link"
        />
        <ParticipantBadge
          nickname="with_meta"
          avatarUrl="https://api.dicebear.com/9.x/identicon/svg?seed=with-meta"
          ticketName="一般枠"
          status="参加確定"
          appliedAt="2026-06-01T12:00:00+09:00"
        />
      </div>
    </div>
  ),
};
