import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ErrorState } from "./error-state";

const meta: Meta<typeof ErrorState> = {
  title: "UI/ErrorState",
  component: ErrorState,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "データ取得失敗 / 例外発生時のフォールバック UI。`role=alert` で SR に即座にエラーを通知し、`retry` 関数を渡すと再試行ボタンが出る。",
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ErrorState>;

export const Default: Story = {
  args: {
    error: "イベント情報の取得に失敗しました。",
  },
};

export const WithRetry: Story = {
  args: {
    error: "ネットワーク接続に失敗しました。",
    retry: () => {
      /* demo only */
    },
  },
};

export const FromErrorInstance: Story = {
  args: {
    error: new Error("500 Internal Server Error"),
    retry: () => {
      /* demo only */
    },
  },
};

export const NoRetry: Story = {
  args: {
    title: "アクセス権限がありません",
    error: "このページを閲覧する権限がありません。管理者にお問い合わせください。",
  },
};
