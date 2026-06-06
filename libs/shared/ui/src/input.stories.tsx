import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Search, Mail } from "lucide-react";

import { Input, InputGroup } from "./input";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: [
          "**設計意図**: ネイティブ `<input>` を Tailwind でスタイルした最小プリミティブ。`invalid` を渡すと border が `brand-red` に変わり、`aria-invalid=true` も自動で付く (= 利用側で個別に書く必要がない)。",
          "",
          "- 必ず `<Label htmlFor>` か親の `<Label>` でラベルを紐付ける",
          "- アイコン付きフィールドは `InputGroup` でラップして leading/trailing アイコンを配置",
          "- フォーカスリングは `:focus-visible` + Tailwind 二重実装",
          "",
          "**Anti-pattern**:",
          "- ❌ placeholder だけでラベルを省略する (= SR + 認知障害ユーザーに不親切)",
          "- ❌ エラー時に `invalid` ではなく className で直接 border-red を書く (`aria-invalid` が抜ける)",
          "- ❌ `type=number` で `step` を省略 (小数許容かどうかブラウザ依存になる)",
          "",
          "**カタログ**: [docs/catalog/01-atoms/input.md](https://github.com/findyinc/tech-event/blob/main/docs/catalog/01-atoms/input.md) — 使い分けガイド",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    type: { control: "select", options: ["text", "email", "password", "number", "search"] },
    disabled: { control: "boolean" },
    invalid: { control: "boolean" },
  },
  args: { placeholder: "入力してください" },
};
export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  render: (args) => (
    <div className="w-72">
      <Input {...args} />
    </div>
  ),
};

export const WithValue: Story = {
  render: () => (
    <div className="w-72">
      <Input defaultValue="入力済みのテキスト" />
    </div>
  ),
};

export const Password: Story = {
  render: () => (
    <div className="w-72">
      <Input type="password" placeholder="パスワード" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-72">
      <Input disabled placeholder="無効" defaultValue="編集不可" />
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="w-72">
      <Input invalid defaultValue="不正な値" />
    </div>
  ),
};

export const InGroupWithIcon: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-3">
      <InputGroup>
        <Search />
        <Input placeholder="イベントを検索" />
      </InputGroup>
      <InputGroup>
        <Mail />
        <Input type="email" placeholder="email@example.com" />
      </InputGroup>
      <InputGroup invalid>
        <Mail />
        <Input invalid defaultValue="不正なメール" />
      </InputGroup>
      <InputGroup disabled>
        <Mail />
        <Input disabled defaultValue="無効状態" />
      </InputGroup>
    </div>
  ),
};
