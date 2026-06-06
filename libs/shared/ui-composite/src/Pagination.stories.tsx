import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Pagination from "./Pagination";

const meta: Meta<typeof Pagination> = {
  title: "Components/Pagination",
  component: Pagination,
  parameters: { layout: "padded" },
  argTypes: {
    currentPage: { control: { type: "number", min: 1 } },
    totalPages: { control: { type: "number", min: 1 } },
    siblingCount: { control: { type: "number", min: 0 } },
    boundaryCount: { control: { type: "number", min: 0 } },
  },
};

export default meta;

type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
  args: {
    currentPage: 3,
    totalPages: 10,
    baseUrl: "/explore",
  },
};

export const FirstPage: Story = {
  args: { currentPage: 1, totalPages: 10, baseUrl: "/explore" },
};

export const LastPage: Story = {
  args: { currentPage: 10, totalPages: 10, baseUrl: "/explore" },
};

export const ManyPages: Story = {
  args: { currentPage: 25, totalPages: 100, baseUrl: "/explore" },
};

export const NoEllipsis: Story = {
  args: { currentPage: 2, totalPages: 5, baseUrl: "/explore" },
};

export const SinglePage: Story = {
  args: { currentPage: 1, totalPages: 1, baseUrl: "/explore" },
  parameters: {
    docs: {
      description: {
        story: "totalPages が 1 以下のときは何も描画されない (null を返す)。",
      },
    },
  },
};

export const CustomBuildHref: Story = {
  args: {
    currentPage: 4,
    totalPages: 12,
    buildHref: (p) => `#page-${p}`,
  },
};

/**
 * siblingCount=0: 現在ページの前後ボタンを表示しない (端点 + 現在のみ)。
 * カバレッジ表の "Pagination siblingCount カスタム 100%" の根拠ストーリー。
 */
export const SiblingCount0: Story = {
  args: {
    currentPage: 5,
    totalPages: 20,
    siblingCount: 0,
    baseUrl: "/explore",
  },
  parameters: {
    docs: {
      description: {
        story:
          "siblingCount=0 では現在ページの周辺ページが表示されず、端点と現在ページだけになる (ellipsis で省略)。",
      },
    },
  },
};

/**
 * siblingCount=2: 現在ページの前後 2 ページずつを表示。
 */
export const SiblingCount2: Story = {
  args: {
    currentPage: 10,
    totalPages: 20,
    siblingCount: 2,
    baseUrl: "/explore",
  },
  parameters: {
    docs: {
      description: {
        story:
          "siblingCount=2 では現在ページの前後 2 ページずつを表示する (例: 8 9 [10] 11 12)。",
      },
    },
  },
};

/**
 * boundaryCount=2: 先頭・末尾の表示ページ数を多めに。
 */
export const BoundaryCount2: Story = {
  args: {
    currentPage: 10,
    totalPages: 20,
    boundaryCount: 2,
    baseUrl: "/explore",
  },
};
