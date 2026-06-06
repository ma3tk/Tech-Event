import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Info } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { Button } from "./button";

const meta: Meta = {
  title: "UI/Tooltip",
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <TooltipProvider delayDuration={150}>
        <Story />
      </TooltipProvider>
    ),
  ],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover してね</Button>
      </TooltipTrigger>
      <TooltipContent>ツールチップの内容</TooltipContent>
    </Tooltip>
  ),
};

export const Sides: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Tooltip key={side}>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">
              {side}
            </Button>
          </TooltipTrigger>
          <TooltipContent side={side}>{side} に表示</TooltipContent>
        </Tooltip>
      ))}
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          aria-label="ヘルプ"
          className="inline-flex size-8 items-center justify-center rounded-full hover:bg-background"
        >
          <Info className="size-4 text-muted-foreground" />
        </button>
      </TooltipTrigger>
      <TooltipContent>キャパシティを上回ると補欠リストに回されます</TooltipContent>
    </Tooltip>
  ),
};
