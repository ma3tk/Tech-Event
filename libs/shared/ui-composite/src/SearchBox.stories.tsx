import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SearchBox from "./SearchBox";

const meta: Meta<typeof SearchBox> = {
  title: "Components/SearchBox",
  component: SearchBox,
  parameters: { layout: "padded" },
  argTypes: {
    variant: { control: "inline-radio", options: ["header", "hero"] },
  },
};

export default meta;

type Story = StoryObj<typeof SearchBox>;

export const Header: Story = {
  args: { variant: "header" },
};

export const Hero: Story = {
  args: { variant: "hero", placeholder: "気になるキーワードを入力" },
};

export const WithDefaultValue: Story = {
  args: { variant: "header", defaultValue: "Next.js" },
};

export const CustomPlaceholder: Story = {
  args: {
    variant: "header",
    placeholder: "グループ名を検索",
    action: "/series/search",
  },
};
