import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { Button } from "./button";
import { Badge } from "./badge";

const meta: Meta = {
  title: "UI/Card",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: [
          "**設計意図**: 5 つのスロット (`Card` / `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter`) に分割し、レイアウトを Composition で組み立てる shadcn パターン。",
          "",
          "- ベースは `bg-surface` + `border-border` + `rounded-card` + `shadow-elevation-card`。Light/Dark テーマで自動切替",
          "- ListRow など 1 行レイアウトには使わず、`<div>` で組む (= Card は「カード」という視覚メタファに特化)",
          "- ホバー時にカード全体をクリック可能にする場合は親で `<Link>` をラップする。Card 自体に onClick を付けない",
          "",
          "**Anti-pattern**:",
          "- ❌ Card 内に `position: fixed` の sticky を入れる (= 親の `overflow: hidden` で見切れる)",
          "- ❌ `bg-white` をハードコード (= ダークモードで白カードのまま残る)",
          "- ❌ CardHeader / CardTitle を省略して `<h3>` を直書きする (= タイポグラフィスケールが揃わない)",
          "",
          "**カタログ**: [docs/catalog/01-atoms/card.md](https://github.com/findyinc/tech-event/blob/main/docs/catalog/01-atoms/card.md) — 使い分けガイド",
        ].join("\n"),
      },
    },
  },
};
export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>カードのタイトル</CardTitle>
        <CardDescription>カードの説明文がここに入ります。</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground">
          本文。一覧表示・詳細表示の汎用コンテナです。
        </p>
      </CardContent>
      <CardFooter>
        <Button size="sm">アクション</Button>
        <Button size="sm" variant="outline">
          キャンセル
        </Button>
      </CardFooter>
    </Card>
  ),
};

export const EventLike: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>Next.js 16 リリース勉強会</CardTitle>
          <Badge variant="success">募集中</Badge>
        </div>
        <CardDescription>2026年06月15日 (月) 19:00 - 21:00</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed">
          Next.js 16 の新機能と React 19 を組み合わせた最新パターンを学びます。
        </p>
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-xs text-muted-foreground">42 / 60 人</span>
        <Button size="sm">参加する</Button>
      </CardFooter>
    </Card>
  ),
};

export const HeaderOnly: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>シンプルカード</CardTitle>
        <CardDescription>本文無しでも成立します。</CardDescription>
      </CardHeader>
    </Card>
  ),
};
