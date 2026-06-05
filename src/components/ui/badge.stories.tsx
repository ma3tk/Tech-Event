import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Badge } from "./badge";

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: [
          "**設計意図**: 状態を 1〜2 単語で表す短いラベル。`success` = open、`warning` = waitlist、`info` = upcoming のように semantic な色を採用。WCAG AA (4.5:1) のコントラスト比は `status-*-fg/bg` で担保。",
          "",
          "- イベントステータス (open/full/…) は `EventStatusBadge` (composite) を使う。Badge は更に汎用的な「タグ」用途",
          "- `outline` variant は背景が透明なので、白以外の背景の上に置けば自動で透ける",
          "- アイコン付きは `gap-1` で間隔調整済み — `<Badge><Icon /> 文字</Badge>` でそのまま使える",
          "",
          "**Anti-pattern**:",
          "- ❌ Badge をクリック可能にする (= ClickableTag / Button を使う。a11y で `<span>` を `role=button` 化するのは avoid)",
          "- ❌ `variant=success` を「完了したタスク」に使う (= 緑は「進行中=募集中」の意味で予約済)",
          "- ❌ Badge 内に長文を入れる (= Badge は最大 12〜16 文字を想定。それ以上は `Tooltip` か `<p>` を使う)",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: [
        "default",
        "secondary",
        "destructive",
        "outline",
        "success",
        "warning",
        "info",
      ],
    },
  },
  args: { children: "Badge" },
};
export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = { args: {} };
export const Secondary: Story = { args: { variant: "secondary", children: "Secondary" } };
export const Destructive: Story = { args: { variant: "destructive", children: "Cancelled" } };
export const Outline: Story = { args: { variant: "outline", children: "Outline" } };
export const Success: Story = { args: { variant: "success", children: "募集中" } };
export const Warning: Story = { args: { variant: "warning", children: "補欠" } };
export const Info: Story = { args: { variant: "info", children: "Upcoming" } };

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 bg-surface p-4">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
};
