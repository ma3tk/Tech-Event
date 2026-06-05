import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Header from "./Header";

const meta: Meta<typeof Header> = {
  title: "Organisms/Header",
  component: Header,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "グローバルヘッダー。ロゴ・検索・ナビ・アカウント領域を含む。Server Component で組むときは HeaderServer 経由で呼ぶ。",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Header>;

export const LoggedOut: Story = {
  args: { user: null },
};

export const LoggedIn: Story = {
  args: {
    user: {
      id: "1",
      nickname: "tanaka",
      unreadNotificationCount: 0,
    },
  },
};

export const LoggedInWithNotifications: Story = {
  args: {
    user: {
      id: "1",
      nickname: "tanaka",
      unreadNotificationCount: 3,
    },
  },
};

export const LoggedInWithAvatar: Story = {
  args: {
    user: {
      id: "1",
      nickname: "tanaka",
      avatarUrl: "https://i.pravatar.cc/64?img=12",
      unreadNotificationCount: 12,
    },
  },
};

export const ManyUnread: Story = {
  args: {
    user: {
      id: "1",
      nickname: "tanaka",
      unreadNotificationCount: 150,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "未読が 99 を超えると `99+` 表示にクランプされる。",
      },
    },
  },
};

export const WithSearchQuery: Story = {
  args: {
    user: null,
    searchQuery: "TypeScript",
  },
};
