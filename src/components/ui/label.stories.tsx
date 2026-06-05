import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Label } from "./label";
import { Input } from "./input";

const meta: Meta<typeof Label> = {
  title: "UI/Label",
  component: Label,
  parameters: { layout: "centered" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    required: { control: "boolean" },
  },
  args: { children: "メールアドレス" },
};
export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = { args: {} };
export const Required: Story = { args: { required: true } };

export const WithInput: Story = {
  render: () => (
    <div className="grid w-72 gap-1.5">
      <Label htmlFor="email" required>
        メールアドレス
      </Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Label size="sm">Small label</Label>
      <Label size="md">Medium label</Label>
      <Label size="lg">Large label</Label>
    </div>
  ),
};
