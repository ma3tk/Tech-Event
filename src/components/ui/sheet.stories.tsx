import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "./sheet";
import { Button } from "./button";
import { Label } from "./label";
import { Input } from "./input";

const meta: Meta = {
  title: "UI/Sheet",
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj;

export const Right: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>右からスライド</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>絞り込み</SheetTitle>
          <SheetDescription>条件を選択してください。</SheetDescription>
        </SheetHeader>
        <div className="my-6 grid gap-3">
          <Label htmlFor="kw">キーワード</Label>
          <Input id="kw" placeholder="例: TypeScript" />
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">閉じる</Button>
          </SheetClose>
          <Button>適用</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const Left: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">左から (モバイルナビ風)</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>メニュー</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-3 text-sm">
          <a href="#">ホーム</a>
          <a href="#">イベント一覧</a>
          <a href="#">グループ</a>
          <a href="#">マイページ</a>
        </nav>
      </SheetContent>
    </Sheet>
  ),
};

export const Top: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">上から</Button>
      </SheetTrigger>
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle>お知らせ</SheetTitle>
          <SheetDescription>新機能をリリースしました。</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
};

export const Bottom: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">下から</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>共有</SheetTitle>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
};
