import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SearchX, Inbox, FolderOpen } from "lucide-react";

import { EmptyState } from "./empty-state";
import { Button } from "./button";

const meta: Meta<typeof EmptyState> = {
  title: "UI/EmptyState",
  component: EmptyState,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "検索結果0件 / データなし / フィルタ条件に一致なし の空状態を表す primitive。`icon` (Lucide) + `title` + `description` + `action` の構造。",
      },
    },
  },
  args: { title: "該当する項目が見つかりませんでした" },
};
export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {};

export const WithIcon: Story = {
  args: {
    icon: SearchX,
    title: "該当するイベントが見つかりませんでした",
    description: "検索条件を変えて再度お試しください。",
  },
};

export const WithAction: Story = {
  args: {
    icon: Inbox,
    title: "通知はありません",
    description: "新しい通知はすべて既読です。",
    action: <Button variant="outline">通知設定を開く</Button>,
  },
};

export const SearchResultEmpty: Story = {
  args: {
    icon: SearchX,
    title: "検索結果がありません",
    description: "別のキーワードでお試しください。",
    action: <Button variant="outline">検索条件をリセット</Button>,
  },
};

export const FolderEmpty: Story = {
  args: {
    icon: FolderOpen,
    title: "このフォルダは空です",
  },
};
