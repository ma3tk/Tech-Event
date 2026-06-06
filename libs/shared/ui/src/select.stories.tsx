import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";

const meta: Meta = {
  title: "UI/Select",
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <div className="w-60">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="カテゴリを選択" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="frontend">フロントエンド</SelectItem>
          <SelectItem value="backend">バックエンド</SelectItem>
          <SelectItem value="ml">機械学習</SelectItem>
          <SelectItem value="devops">DevOps</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const Grouped: Story = {
  render: () => (
    <div className="w-60">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="エリアを選択" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>関東</SelectLabel>
            <SelectItem value="tokyo">東京</SelectItem>
            <SelectItem value="kanagawa">神奈川</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>関西</SelectLabel>
            <SelectItem value="osaka">大阪</SelectItem>
            <SelectItem value="kyoto">京都</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-60">
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="無効" />
        </SelectTrigger>
        <SelectContent />
      </Select>
    </div>
  ),
};

export const WithDefault: Story = {
  render: () => (
    <div className="w-60">
      <Select defaultValue="backend">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="frontend">フロントエンド</SelectItem>
          <SelectItem value="backend">バックエンド</SelectItem>
          <SelectItem value="ml">機械学習</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};
