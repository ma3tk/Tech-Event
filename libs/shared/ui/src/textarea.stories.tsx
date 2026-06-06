import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Textarea } from "./textarea";
import { Label } from "./label";

const meta: Meta<typeof Textarea> = {
  title: "UI/Textarea",
  component: Textarea,
  parameters: { layout: "centered" },
  argTypes: {
    disabled: { control: "boolean" },
    invalid: { control: "boolean" },
  },
  args: { placeholder: "イベントの説明..." },
};
export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  render: (args) => (
    <div className="w-80">
      <Textarea {...args} />
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-80 gap-1.5">
      <Label htmlFor="msg">メッセージ</Label>
      <Textarea id="msg" placeholder="自由記入..." rows={5} />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-80">
      <Textarea disabled defaultValue="編集できません" />
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="w-80">
      <Textarea invalid defaultValue="エラー状態" />
    </div>
  ),
};
