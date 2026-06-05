import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LoadingState } from "./loading-state";

const meta: Meta<typeof LoadingState> = {
  title: "UI/LoadingState",
  component: LoadingState,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "ロード中の表現を `variant=spinner|skeleton|dots` で切り替える primitive。`role=status` + `aria-live=polite` で SR に通知。短時間=spinner、ページ/リスト=skeleton、継続感=dots。",
      },
    },
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["spinner", "skeleton", "dots"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    skeletonRows: { control: { type: "number", min: 1, max: 8 } },
  },
};
export default meta;
type Story = StoryObj<typeof LoadingState>;

export const Spinner: Story = {
  args: { variant: "spinner" },
};
export const SpinnerLarge: Story = {
  args: { variant: "spinner", size: "lg" },
};

export const Dots: Story = {
  args: { variant: "dots" },
};

export const SkeletonList: Story = {
  args: { variant: "skeleton", skeletonRows: 5 },
  render: (args) => (
    <div className="w-80">
      <LoadingState {...args} />
    </div>
  ),
};
