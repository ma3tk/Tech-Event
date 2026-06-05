import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import GroupCard, { type GroupCardData } from "./GroupCard";

const meta: Meta<typeof GroupCard> = {
  title: "Organisms/GroupCard",
  component: GroupCard,
  parameters: { layout: "padded" },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["standard", "sidebar", "compact"],
    },
    isJoined: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof GroupCard>;

const baseGroup: GroupCardData = {
  id: "g1",
  name: "TypeScript JP",
  memberCount: 8421,
  eventCount: 56,
  subdomain: "typescript-jp",
  description:
    "TypeScript を学び・楽しむ日本のコミュニティです。月1回の Meetup を中心に、初心者から上級者まで幅広く参加できる勉強会を開催しています。",
  subtitle: "TypeScript 好きが集まる勉強会",
  logoUrl: "https://placehold.co/200x200/ea5404/ffffff?text=TS",
};

export const Standard: Story = {
  args: { group: baseGroup, variant: "standard" },
};

export const StandardJoined: Story = {
  args: { group: baseGroup, variant: "standard", isJoined: true },
};

export const StandardNoLogo: Story = {
  args: {
    group: { ...baseGroup, logoUrl: null },
    variant: "standard",
  },
};

export const StandardNoDescription: Story = {
  args: {
    group: { ...baseGroup, description: null, subtitle: null },
    variant: "standard",
  },
};

export const Sidebar: Story = {
  args: { group: baseGroup, variant: "sidebar" },
  render: (args) => (
    <div className="w-72">
      <GroupCard {...args} />
    </div>
  ),
};

export const SidebarList: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-2">
      {[
        { name: "TypeScript JP", members: 8421, events: 56 },
        { name: "React Tokyo", members: 12340, events: 88 },
        { name: "Next.js Meetup", members: 5421, events: 24 },
      ].map((g, i) => (
        <GroupCard
          key={g.name}
          variant="sidebar"
          group={{
            id: `g${i}`,
            name: g.name,
            memberCount: g.members,
            eventCount: g.events,
            subdomain: g.name.toLowerCase().replace(/\s/g, "-"),
            logoUrl: `https://placehold.co/64x64/ea5404/ffffff?text=${g.name[0]}`,
          }}
        />
      ))}
    </div>
  ),
};

/**
 * logoUrl ありのケース (Picsum で安定したダミー画像を生成)。
 * カバレッジ表の "GroupCard logoUrl 100%" の根拠ストーリー。
 */
export const WithLogo: Story = {
  args: {
    group: {
      ...baseGroup,
      logoUrl: "https://picsum.photos/seed/grpcard-logo-1/200/200",
    },
    variant: "standard",
  },
};

export const WithLogoJoined: Story = {
  args: {
    group: {
      ...baseGroup,
      logoUrl: "https://picsum.photos/seed/grpcard-logo-2/200/200",
    },
    variant: "standard",
    isJoined: true,
  },
};

export const SidebarWithLogo: Story = {
  args: {
    group: {
      ...baseGroup,
      logoUrl: "https://picsum.photos/seed/grpcard-logo-3/64/64",
    },
    variant: "sidebar",
  },
  render: (args) => (
    <div className="w-72">
      <GroupCard {...args} />
    </div>
  ),
};
