import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

const meta: Meta = {
  title: "UI/Popover",
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">設定を開く</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="grid gap-3">
          <h4 className="text-sm font-semibold">寸法</h4>
          <div className="grid gap-1.5">
            <Label htmlFor="w">幅</Label>
            <Input id="w" defaultValue="100%" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="h">高さ</Label>
            <Input id="h" defaultValue="auto" />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const Sides: Story = {
  render: () => (
    <div className="flex gap-3">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Popover key={side}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              {side}
            </Button>
          </PopoverTrigger>
          <PopoverContent side={side} className="w-40 text-sm">
            {side} に表示されたポップオーバー
          </PopoverContent>
        </Popover>
      ))}
    </div>
  ),
};
