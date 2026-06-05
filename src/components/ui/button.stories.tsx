import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Plus, Trash2, Search } from "lucide-react";

import { Button } from "./button";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: [
          "**設計意図**: CVA で variant × size を直交させ、`asChild` で `<Link>` / `<a>` に被せて使う shadcn パターン。",
          "",
          "- `variant=default` はブランドオレンジ (`bg-brand-orange`)、`destructive` はキャンセル系 (`bg-brand-red`)、`outline` / `ghost` は背景なし。",
          "- `size=icon` は正方形 (h-10 w-10)。必ず `aria-label` を付与すること。",
          "- フォーカスリングはグローバル `:focus-visible` + 明示的 `focus-visible:ring-2` の二重実装で、Tailwind ユーティリティの prune に強い。",
          "- Motion: `duration-fast` (150ms) で hover/focus を素早く返す。",
          "",
          "**Anti-pattern**:",
          "- ❌ `<a>` を直接 className でスタイルする (= `asChild` を使う)",
          "- ❌ `variant=destructive` を成功系の CTA に使う (色の意味の濫用)",
          "- ❌ `size=icon` で `aria-label` を省略する (SR ユーザーが何のボタンか分からない)",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["default", "secondary", "destructive", "outline", "ghost", "link"],
    },
    size: {
      control: "inline-radio",
      options: ["xs", "sm", "md", "lg", "icon"],
    },
    disabled: { control: "boolean" },
    asChild: { control: "boolean" },
  },
  args: { children: "ボタン" },
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = { args: {} };
export const Secondary: Story = { args: { variant: "secondary" } };
export const Destructive: Story = { args: { variant: "destructive", children: "削除する" } };
export const Outline: Story = { args: { variant: "outline" } };
export const Ghost: Story = { args: { variant: "ghost" } };
export const Link: Story = { args: { variant: "link", children: "詳細を見る" } };

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 bg-surface p-4">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-3 bg-surface p-4">
      <Button size="xs">XS</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="検索">
        <Search />
      </Button>
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 bg-surface p-4">
      <Button>
        <Plus /> イベントを作成
      </Button>
      <Button variant="destructive">
        <Trash2 /> 削除
      </Button>
      <Button variant="outline">
        <Search /> 検索
      </Button>
    </div>
  ),
};

export const Disabled: Story = { args: { disabled: true, children: "使えません" } };

export const Loading: Story = {
  render: () => (
    <Button disabled>
      <span className="inline-block size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      送信中...
    </Button>
  ),
};

export const AsChildLink: Story = {
  render: () => (
    <Button asChild>
      <a href="#example">a 要素として描画</a>
    </Button>
  ),
};
