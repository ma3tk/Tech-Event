import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Label } from "./label";

const meta: Meta = {
  title: "UI/RadioGroup",
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="online">
      <div className="flex items-center gap-2">
        <RadioGroupItem id="r-online" value="online" />
        <Label htmlFor="r-online">オンライン</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="r-offline" value="offline" />
        <Label htmlFor="r-offline">オフライン</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="r-hybrid" value="hybrid" />
        <Label htmlFor="r-hybrid">ハイブリッド</Label>
      </div>
    </RadioGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="a" disabled>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="d-a" value="a" />
        <Label htmlFor="d-a">A</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="d-b" value="b" />
        <Label htmlFor="d-b">B</Label>
      </div>
    </RadioGroup>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <RadioGroup defaultValue="md" className="flex gap-4">
      {["sm", "md", "lg"].map((v) => (
        <div key={v} className="flex items-center gap-2">
          <RadioGroupItem id={`h-${v}`} value={v} />
          <Label htmlFor={`h-${v}`}>{v}</Label>
        </div>
      ))}
    </RadioGroup>
  ),
};
