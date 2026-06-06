import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta: Meta = {
  title: "UI/Tabs",
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-80">
      <TabsList>
        <TabsTrigger value="overview">概要</TabsTrigger>
        <TabsTrigger value="schedule">スケジュール</TabsTrigger>
        <TabsTrigger value="participants">参加者</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="rounded border border-border bg-surface p-4 text-sm">
        概要タブの内容です。
      </TabsContent>
      <TabsContent value="schedule" className="rounded border border-border bg-surface p-4 text-sm">
        スケジュールタブの内容です。
      </TabsContent>
      <TabsContent value="participants" className="rounded border border-border bg-surface p-4 text-sm">
        参加者タブの内容です。
      </TabsContent>
    </Tabs>
  ),
};

export const WithDisabled: Story = {
  render: () => (
    <Tabs defaultValue="a" className="w-80">
      <TabsList>
        <TabsTrigger value="a">A</TabsTrigger>
        <TabsTrigger value="b" disabled>
          B (無効)
        </TabsTrigger>
        <TabsTrigger value="c">C</TabsTrigger>
      </TabsList>
      <TabsContent value="a">A の内容</TabsContent>
      <TabsContent value="c">C の内容</TabsContent>
    </Tabs>
  ),
};
