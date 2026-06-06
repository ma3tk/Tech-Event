import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Breadcrumb from "./Breadcrumb";

const meta: Meta<typeof Breadcrumb> = {
  title: "Components/Breadcrumb",
  component: Breadcrumb,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof Breadcrumb>;

export const Default: Story = {
  args: {
    items: [
      { label: "ホーム", href: "/" },
      { label: "イベントを探す", href: "/explore" },
      { label: "Next.js 勉強会" },
    ],
    enableJsonLd: false,
  },
};

export const TwoLevels: Story = {
  args: {
    items: [
      { label: "ホーム", href: "/" },
      { label: "ランキング" },
    ],
    enableJsonLd: false,
  },
};

export const ManyLevels: Story = {
  args: {
    items: [
      { label: "ホーム", href: "/" },
      { label: "グループ", href: "/series" },
      { label: "TypeScript JP", href: "/group/typescript-jp" },
      { label: "イベント", href: "/group/typescript-jp/events" },
      { label: "第 42 回 TypeScript Meetup" },
    ],
    enableJsonLd: false,
  },
};

export const CustomSeparator: Story = {
  args: {
    items: [
      { label: "ホーム", href: "/" },
      { label: "検索結果", href: "/search?q=react" },
      { label: "React" },
    ],
    separator: <span aria-hidden="true">/</span>,
    enableJsonLd: false,
  },
};
