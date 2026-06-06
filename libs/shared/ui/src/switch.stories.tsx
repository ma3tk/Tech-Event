import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Switch } from "./switch";
import { Label } from "./label";

const meta: Meta<typeof Switch> = {
  title: "UI/Switch",
  component: Switch,
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = { args: {} };
export const Checked: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true } };
export const DisabledChecked: Story = {
  args: { disabled: true, defaultChecked: true },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Switch id="notify" defaultChecked />
      <Label htmlFor="notify">通知を受け取る</Label>
    </div>
  ),
};

export const SettingsList: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {[
        ["メール通知", true],
        ["プッシュ通知", false],
        ["週次まとめ", true],
      ].map(([label, checked]) => (
        <div key={String(label)} className="flex items-center justify-between gap-6">
          <Label htmlFor={`s-${label}`}>{String(label)}</Label>
          <Switch id={`s-${label}`} defaultChecked={Boolean(checked)} />
        </div>
      ))}
    </div>
  ),
};
