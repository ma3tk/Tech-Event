import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import HostAvatarStack, {
  type HostAvatarHost,
} from "./HostAvatarStack";

const meta: Meta<typeof HostAvatarStack> = {
  title: "Components/HostAvatarStack",
  component: HostAvatarStack,
  parameters: { layout: "padded" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    showNames: { control: "boolean" },
    maxVisible: { control: { type: "number", min: 1, max: 8 } },
  },
};

export default meta;

type Story = StoryObj<typeof HostAvatarStack>;

const sample: HostAvatarHost[] = [
  {
    name: "山田 太郎",
    avatarUrl: "https://i.pravatar.cc/96?img=12",
    profileUrl: "/user/taro",
    role: "主催",
  },
  {
    name: "佐藤 花子",
    avatarUrl: "https://i.pravatar.cc/96?img=22",
    profileUrl: "/user/hanako",
    role: "共催",
  },
  {
    name: "Suzuki Jiro",
    avatarUrl: "https://i.pravatar.cc/96?img=33",
    profileUrl: "/user/jiro",
    role: "共催",
  },
];

export const Pair: Story = {
  args: { hosts: sample.slice(0, 2), size: "md", showNames: true },
};

export const Trio: Story = {
  args: { hosts: sample, size: "md", showNames: true },
};

export const Overflow: Story = {
  args: {
    hosts: [
      ...sample,
      { name: "Alice", avatarUrl: "https://i.pravatar.cc/96?img=41" },
      { name: "Bob", avatarUrl: "https://i.pravatar.cc/96?img=52" },
      { name: "Carol", avatarUrl: "https://i.pravatar.cc/96?img=63" },
      { name: "Dave", avatarUrl: "https://i.pravatar.cc/96?img=14" },
    ],
    size: "md",
    maxVisible: 5,
    showNames: true,
  },
};

export const NoAvatar: Story = {
  args: {
    hosts: [
      { name: "山田 太郎" },
      { name: "佐藤 花子" },
      { name: "Suzuki" },
    ],
    size: "md",
    showNames: true,
  },
};

export const Small: Story = {
  args: { hosts: sample, size: "sm" },
};

export const Large: Story = {
  args: { hosts: sample, size: "lg", showNames: true, label: "HOSTS" },
};
