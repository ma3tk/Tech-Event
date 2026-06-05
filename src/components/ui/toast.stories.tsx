import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Toaster, toast } from "./toast";
import { Button } from "./button";

const meta: Meta = {
  title: "UI/Toast",
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Button onClick={() => toast("イベントを保存しました")}>標準</Button>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast("保存完了", {
          description: "2026/06/04 22:30 に下書きを保存しました。",
        })
      }
    >
      Description 付き
    </Button>
  ),
};

export const Success: Story = {
  render: () => (
    <Button onClick={() => toast.success("参加申し込みが完了しました")}>
      Success
    </Button>
  ),
};

export const ErrorVariant: Story = {
  render: () => (
    <Button
      variant="destructive"
      onClick={() => toast.error("通信に失敗しました")}
    >
      Error
    </Button>
  ),
};

export const Warning: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() => toast.warning("補欠リストに登録されました")}
    >
      Warning
    </Button>
  ),
};

export const Info: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() => toast.info("新しいバージョンがあります")}
    >
      Info
    </Button>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast("下書きを削除しました", {
          action: { label: "元に戻す", onClick: () => toast("復元しました") },
        })
      }
    >
      アクション付き
    </Button>
  ),
};
