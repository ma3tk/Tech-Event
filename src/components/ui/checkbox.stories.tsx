import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Checkbox } from "./checkbox";
import { Label } from "./label";

const meta: Meta<typeof Checkbox> = {
  title: "UI/Checkbox",
  component: Checkbox,
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = { args: {} };
export const Checked: Story = { args: { checked: true } };
export const Indeterminate: Story = { args: { checked: "indeterminate" } };
export const Disabled: Story = { args: { disabled: true } };
export const DisabledChecked: Story = { args: { disabled: true, checked: true } };

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">利用規約に同意する</Label>
    </div>
  ),
};

export const Group: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {["フロントエンド", "バックエンド", "機械学習", "DevOps"].map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <Checkbox id={`cat-${i}`} defaultChecked={i === 0} />
          <Label htmlFor={`cat-${i}`}>{label}</Label>
        </div>
      ))}
    </div>
  ),
};
