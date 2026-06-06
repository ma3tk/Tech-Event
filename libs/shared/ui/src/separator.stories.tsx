import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Separator } from "./separator";

const meta: Meta<typeof Separator> = {
  title: "UI/Separator",
  component: Separator,
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-80 bg-surface p-4">
      <div className="text-sm">上のテキスト</div>
      <Separator className="my-3" />
      <div className="text-sm">下のテキスト</div>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-12 items-center gap-3 bg-surface p-3">
      <span className="text-sm">左</span>
      <Separator orientation="vertical" />
      <span className="text-sm">中</span>
      <Separator orientation="vertical" />
      <span className="text-sm">右</span>
    </div>
  ),
};
