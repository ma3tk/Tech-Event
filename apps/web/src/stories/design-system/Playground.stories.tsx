import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Playground } from "../_support/Playground";

/**
 * Playground — クリックして要素をその場で編集し、リアルタイムに反映する実験場。
 *
 * - プレビュー内の文字を **クリックして直接編集** (contentEditable)。
 * - 右のインスペクタで variant / size / boolean / number を変更 → 即反映。
 * - 編集状態は localStorage に保存されリロードしても復元 (単一ユーザー前提)。
 * - 下部に現在の JSX を生成表示。
 */
const meta: Meta<typeof Playground> = {
  title: "Design System/Playground",
  component: Playground,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "クリックで要素を直接編集し、リアルタイムに反映するインタラクティブな実験場。編集状態は localStorage に保存される (単一ユーザー前提)。",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Playground>;

export const Default: Story = {};
